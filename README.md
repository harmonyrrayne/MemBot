# AI Companion Chatbot with MemU Integration

A full-stack AI chatbot application with memory capabilities powered by MemU API integration. The app allows users to have contextual conversations with an AI assistant that remembers previous interactions.

## Features

- 🤖 AI-powered conversations using OpenAI GPT models
- 🧠 Memory integration with MemU API for contextual responses
- 💾 PostgreSQL database for conversation history
- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- 📱 Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI API, MemU API

## Deployment Instructions

### Deploy to Vercel

1. **Fork this repository** to your GitHub account

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your forked repository

3. **Environment Variables**:
   Add these environment variables in Vercel dashboard:
   ```
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   MEMU_API_KEY=your_memu_api_key
   NODE_ENV=production
   ```

4. **Database Setup**:
   - Create a PostgreSQL database (recommend Neon, PlanetScale, or Vercel Postgres)
   - Run `npm run db:push` to create tables

5. **Deploy**: Vercel will automatically build and deploy your app

### Deploy to Railway

1. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"

2. **Add Database**:
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Copy the DATABASE_URL from the database service

3. **Environment Variables**:
   Add the same environment variables as above

4. **Deploy**: Railway will automatically build and deploy

### Deploy to Render

1. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Sign in with GitHub
   - Click "New" → "Web Service"

2. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Add environment variables

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create `.env` file with:
   ```
   DATABASE_URL=your_postgresql_url
   OPENAI_API_KEY=your_openai_key
   MEMU_API_KEY=your_memu_key
   ```

3. **Run database migrations**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## API Keys Required

- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **MemU API Key**: Get from [MemU platform](https://memu.ai)

## License

MIT License