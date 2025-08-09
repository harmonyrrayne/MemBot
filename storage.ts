import { type User, type InsertUser, type Conversation, type Message, type Settings, type InsertConversation, type InsertMessage, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
  
  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Settings
  getSettings(userId: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private settings: Map<string, Settings>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.settings = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      lastActivity: new Date(),
      lastMessage: insertConversation.lastMessage || null,
      messageCount: insertConversation.messageCount || null,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, lastActivity: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    // Also delete associated messages
    Array.from(this.messages.entries()).forEach(([messageId, message]) => {
      if (message.conversationId === id) {
        this.messages.delete(messageId);
      }
    });
    return deleted;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      memoryContext: insertMessage.memoryContext || null,
    };
    this.messages.set(id, message);
    return message;
  }

  async getSettings(userId: string): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(s => s.userId === userId);
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = randomUUID();
    const settings: Settings = { 
      ...insertSettings, 
      id,
      memuApiKey: insertSettings.memuApiKey || null,
      openaiApiKey: insertSettings.openaiApiKey || null,
      temperature: insertSettings.temperature || null,
      maxTokens: insertSettings.maxTokens || null,
      model: insertSettings.model || null,
      autoMemoryStorage: insertSettings.autoMemoryStorage || null,
      contextAwareResponses: insertSettings.contextAwareResponses || null,
      userIdentifier: insertSettings.userIdentifier || null,
    };
    this.settings.set(id, settings);
    return settings;
  }

  async updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings | undefined> {
    const existing = Array.from(this.settings.values()).find(s => s.userId === userId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.settings.set(existing.id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
