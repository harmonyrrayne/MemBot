# Quick Deployment Guide

Your AI chatbot is ready to deploy! Here are step-by-step instructions for the most popular free/affordable platforms:

## 🚀 Recommended: Vercel (Free Tier Available)

**Step 1: Export Your Code**
1. Download this project as a ZIP from Replit
2. Extract and upload to GitHub (create new repository)

**Step 2: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your repository
3. Vercel will auto-detect settings

**Step 3: Add Database**
1. In Vercel dashboard: "Storage" → "Create Database" → "Postgres"
2. Copy the DATABASE_URL connection string

**Step 4: Environment Variables**
In Vercel project settings, add:
```
DATABASE_URL=your_postgres_url_from_step_3
OPENAI_API_KEY=your_openai_key
MEMU_API_KEY=your_memu_key
NODE_ENV=production
```

**Step 5: Deploy**
- Push code to GitHub → Vercel auto-deploys
- Your app will be live at `yourproject.vercel.app`

## 🚂 Alternative: Railway ($5/month)

**Step 1: Setup**
1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"

**Step 2: Add Database**
1. Click "New" → "Database" → "PostgreSQL"
2. Connect to your web service

**Step 3: Environment Variables**
Add the same variables as Vercel

**Step 4: Deploy**
Railway auto-builds and deploys

## 🔗 API Keys You'll Need

Get these before deploying:

1. **OpenAI API Key**: 
   - Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create new key

2. **MemU API Key**: 
   - Sign up at [memu.ai](https://memu.ai)
   - Get your API key from dashboard

## ✅ What's Already Configured

- ✅ Build scripts ready
- ✅ Production server setup
- ✅ Database schema configured
- ✅ Frontend optimized
- ✅ Environment variables template

## 🎯 Next Steps After Deployment

1. Test the deployed app
2. Add your API keys in the settings page
3. Start chatting with your AI assistant!

Your app includes memory features, so conversations will become more personalized over time.