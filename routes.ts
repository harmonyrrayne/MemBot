import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertSettingsSchema } from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";

// MemU API types and functions
interface MemuResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function memorizeConversation(apiKey: string, conversation: string, userId: string, userName: string, agentId: string, agentName: string): Promise<MemuResponse> {
  try {
    const response = await fetch("https://api-preview.memu.so/memorize_conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        conversation,
        user_id: userId,
        user_name: userName,
        agent_id: agentId,
        agent_name: agentName,
      }),
    });

    if (!response.ok) {
      throw new Error(`MemU API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function retrieveMemory(apiKey: string, query: string, userId: string): Promise<MemuResponse> {
  try {
    const response = await fetch("https://api-preview.memu.so/retrieve_memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`MemU API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get conversations for a user
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversation data" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, userId } = req.body;

      if (!content || !userId) {
        return res.status(400).json({ message: "Content and userId are required" });
      }

      // Get user settings
      const userSettings = await storage.getSettings(userId);
      if (!userSettings?.openaiApiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content,
        memoryContext: null,
      });

      // Get memory context from MemU if API key is available
      let memoryContext = null;
      if (userSettings.memuApiKey && userSettings.contextAwareResponses === "true") {
        const memoryResult = await retrieveMemory(
          userSettings.memuApiKey,
          content,
          userSettings.userIdentifier || userId
        );
        
        if (memoryResult.success) {
          memoryContext = memoryResult.data;
        }
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const openai = new OpenAI({ 
        apiKey: userSettings.openaiApiKey 
      });

      // Build conversation history
      const messages = await storage.getMessages(conversationId);
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Add system prompt with memory context
      const systemPrompt = `You are MemU, an AI companion with persistent memory. You remember previous conversations and provide contextual, personalized responses.

${memoryContext ? `Memory Context: ${JSON.stringify(memoryContext)}` : ""}

Be helpful, conversational, and reference relevant memories when appropriate. If you use memory context, acknowledge it naturally in your response.`;

      const completion = await openai.chat.completions.create({
        model: userSettings.model || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
        ],
        temperature: parseFloat(userSettings.temperature || "0.7"),
        max_tokens: parseInt(userSettings.maxTokens || "1024"),
      });

      const aiResponse = completion.choices[0].message.content || "I couldn't generate a response.";

      // Create AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        memoryContext,
      });

      // Store conversation in MemU if enabled
      if (userSettings.memuApiKey && userSettings.autoMemoryStorage === "true") {
        const conversationText = `User: ${content}\nAssistant: ${aiResponse}`;
        await memorizeConversation(
          userSettings.memuApiKey,
          conversationText,
          userSettings.userIdentifier || userId,
          "User",
          "memu_assistant",
          "MemU Assistant"
        );
      }

      // Update conversation last message and activity
      const currentConversation = await storage.getConversations(userId);
      const conversation = currentConversation.find(c => c.id === conversationId);
      await storage.updateConversation(conversationId, {
        lastMessage: content,
        messageCount: (parseInt(conversation?.messageCount || "0") + 2).toString(),
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Get user settings
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let settings = await storage.getSettings(userId);
      
      if (!settings) {
        settings = await storage.createSettings({ userId });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update user settings
  app.put("/api/settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      let settings = await storage.getSettings(userId);
      if (!settings) {
        settings = await storage.createSettings({ ...updates, userId });
      } else {
        settings = await storage.updateSettings(userId, updates);
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Test API connections
  app.post("/api/test-connections", async (req, res) => {
    try {
      const { openaiApiKey, memuApiKey, userId } = req.body;
      const results = { openai: false, memu: false };

      // Test OpenAI
      if (openaiApiKey) {
        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });
          await openai.models.list();
          results.openai = true;
        } catch (error) {
          console.error("OpenAI test failed:", error);
        }
      }

      // Test MemU
      if (memuApiKey && userId) {
        const testResult = await retrieveMemory(memuApiKey, "test query", userId);
        results.memu = testResult.success;
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Connection test failed" });
    }
  });

  return httpServer;
}
