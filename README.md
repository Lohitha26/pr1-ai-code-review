# Real-Time Code Collaboration Platform with AI Code Review

A full-stack collaborative code editor with real-time synchronization, live cursors, and AI-powered code review suggestions.

## 🚀 Features

- **Real-Time Collaboration**: Multiple users can edit code simultaneously with CRDT-based conflict-free synchronization
- **Live Cursors & Awareness**: See where your collaborators are typing in real-time
- **AI Code Review**: Get intelligent code suggestions and reviews powered by OpenAI GPT
- **Chat Sidebar**: Communicate with collaborators while coding
- **Session Management**: Create public or private coding sessions
- **Persistent Sessions**: All sessions are saved to PostgreSQL with Prisma ORM
- **Authentication**: Secure GitHub OAuth integration via NextAuth.js
- **Monaco Editor**: Full-featured code editor with syntax highlighting and IntelliSense

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code's editor component
- **Socket.io Client** - WebSocket client for real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Socket.io** - WebSocket server for real-time events
- **Redis** - Pub/sub for multi-server synchronization and session caching
- **PostgreSQL** - Primary database for session persistence
- **Prisma** - Type-safe ORM for database operations

### Real-Time Sync
- **Yjs** - CRDT library for conflict-free collaborative editing
- **y-protocols** - Yjs protocol implementations

### AI Integration
- **OpenAI API** - GPT models for code review and suggestions

### Testing & CI
- **Playwright** - End-to-end testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD pipeline

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Redis** 6.x or higher ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional (for easier local development):
- **Docker** & **Docker Compose** - To run Postgres and Redis in containers

## 🏁 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd realtime-code-collab
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/collab_db?schema=public"

# Redis - Replace with your Redis connection string
REDIS_URL="redis://localhost:6379"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# GitHub OAuth - Get from https://github.com/settings/developers
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"

# OpenAI API - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### 4. Set Up Database

#### Option A: Using Docker (Recommended for beginners)

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: collab_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Start the services:

```bash
docker-compose up -d
```

#### Option B: Local Installation

Install PostgreSQL and Redis locally, then create a database:

```bash
# PostgreSQL
createdb collab_db

# Redis should start automatically after installation
# Or start manually: redis-server
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

This will:
- Create the database schema
- Generate the Prisma Client
- Seed initial data (if configured)

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:ui
```

### Run Specific Test File

```bash
npx playwright test tests/playwright/collaboration.spec.ts
```

## 📚 Project Structure

```
realtime-code-collab/
├── app/                          # Next.js App Router pages
│   ├── (editor)/                 # Editor route group
│   │   └── session/[sessionId]/  # Dynamic session page
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── ai/                   # AI review endpoints
│   │   └── socket/               # Socket.io endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── Editor.tsx                # Monaco editor wrapper
│   ├── Chat.tsx                  # Chat sidebar
│   ├── AiReviewPanel.tsx         # AI suggestions panel
│   └── ParticipantList.tsx       # Live participant list
├── lib/                          # Utility libraries
│   ├── yjs/                      # Yjs integration
│   │   ├── provider.ts           # Yjs provider setup
│   │   └── awareness.ts          # Awareness (cursor) handling
│   ├── socket.ts                 # Socket.io client wrapper
│   ├── redis.ts                  # Redis client setup
│   └── prisma.ts                 # Prisma client singleton
├── server/                       # Server-side code
│   └── socket-server.ts          # Socket.io server setup
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── tests/                        # Test files
│   └── playwright/               # E2E tests
├── docs/                         # Documentation
│   ├── walkthrough/              # Line-by-line file explanations
│   ├── concepts/                 # Technology explanations
│   └── learning-plan.md          # 8-week learning roadmap
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
│       └── ci.yml                # Main CI pipeline
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind configuration
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
└── package.json                  # Dependencies and scripts
```

## 🔑 Getting API Keys

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Real-Time Code Collab (Local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** to `GITHUB_ID` in `.env`
6. Generate a new client secret and copy to `GITHUB_SECRET` in `.env`

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key to `OPENAI_API_KEY` in `.env`
6. **Important**: Add billing information to your OpenAI account to use the API

## 🚀 Deployment

This app is designed to deploy as a **single server** (not serverless) because it uses Socket.io for real-time WebSocket connections.

### Recommended: Railway (Single Server Deployment)

**Quick Start (15 minutes)**:
1. Push code to GitHub
2. Deploy to Railway (includes PostgreSQL + Redis)
3. Add environment variables
4. Set up GitHub OAuth
5. Run database migrations

📖 **See deployment guides**:
- **QUICK_START_DEPLOYMENT.md** - Deploy in 15 minutes
- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **DEPLOYMENT_CHECKLIST.md** - Detailed checklist

### Alternative Platforms

- **Render** - Similar to Railway, free tier available
- **DigitalOcean App Platform** - $5/month
- **Fly.io** - Good for global deployment
- **AWS/GCP/Azure** - For enterprise deployments

### Why Not Vercel?

Vercel is serverless and doesn't support persistent WebSocket connections required by Socket.io. You would need to deploy the WebSocket server separately, which adds complexity.

## 📖 Learning Resources

This project introduces several advanced concepts. Check out these resources:

### CRDTs & Yjs
- [Yjs Documentation](https://docs.yjs.dev/)
- [CRDT Explained](https://crdt.tech/)
- [Conflict-Free Replicated Data Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)

### Socket.io
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### Monaco Editor
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)

For a complete learning plan, see `docs/learning-plan.md`.

## 🐛 Troubleshooting

### GitHub OAuth 404 Error

If you see a 404 error when trying to sign in with GitHub:

**Symptoms:**
- Error: `GET https://github.com/login/oauth/authorize?client_id=your-github-oauth-app-id... 404 (Not Found)`
- The URL contains placeholder values like `your-github-oauth-app-id`

**Solution:**
1. Check your `.env` file has real GitHub OAuth credentials (not placeholder values)
2. Ensure you've created a GitHub OAuth App at https://github.com/settings/developers
3. Copy the **Client ID** to `GITHUB_ID` in `.env`
4. Copy the **Client Secret** to `GITHUB_SECRET` in `.env`
5. Restart the server after updating `.env`: `npm run dev`

**The server now validates environment variables on startup and will show a clear error message if credentials are missing or invalid.**

### Port Already in Use

If port 3000 is already in use:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

- Ensure PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` in `.env`
- Verify database exists: `psql -l`

### Redis Connection Issues

- Ensure Redis is running: `redis-cli ping` (should return "PONG")
- Check your `REDIS_URL` in `.env`

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Environment Variable Validation Errors

If the server fails to start with environment validation errors:

1. **Copy the example file**: `cp .env.example .env`
2. **Replace all placeholder values** with real credentials
3. **Generate NEXTAUTH_SECRET**: `openssl rand -base64 32`
4. **Verify all required variables** are set in `.env`
5. **Restart the server**: `npm run dev`

The server will display detailed error messages indicating which variables are missing or contain placeholder values.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Yjs](https://github.com/yjs/yjs) - CRDT implementation
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Next.js](https://nextjs.org/) - React framework
- [Socket.io](https://socket.io/) - Real-time communication
- [Prisma](https://www.prisma.io/) - Database ORM

---

**Need help?** Check out the detailed walkthroughs in `docs/walkthrough/` for line-by-line explanations of every file.
