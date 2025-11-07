# Command Cheat Sheet

Quick reference for all commands you'll need to develop, test, and deploy the application.

## Table of Contents
- [Setup](#setup)
- [Development](#development)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Setup

### Initial Installation

```bash
# Clone the repository
git clone <repo-url>
cd realtime-code-collab

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env

# Edit .env with your actual values
# Windows: notepad .env
# Mac/Linux: nano .env
```

### Environment Setup

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Windows PowerShell alternative
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Database Setup (Local)

**Option 1: Docker (Recommended)**

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check if running
docker ps

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

**Option 2: Local Installation**

```bash
# PostgreSQL (Windows)
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# PostgreSQL (Mac)
brew install postgresql@15
brew services start postgresql@15

# PostgreSQL (Linux)
sudo apt-get install postgresql-15

# Create database
createdb collab_db

# Redis (Windows)
# Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL

# Redis (Mac)
brew install redis
brew services start redis

# Redis (Linux)
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## Development

### Running the App

```bash
# Start development server (with custom Socket.io server)
npm run dev

# Start Next.js only (without Socket.io)
npm run dev:next

# Build for production
npm run build

# Start production server
npm start

# Start production (Next.js only)
npm run start:next
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint -- --fix

# Run Prettier
npm run format

# Check types without building
npm run type-check
```

### Watching for Changes

```bash
# Development server auto-reloads on file changes
npm run dev

# Watch TypeScript compilation
npx tsc --watch

# Watch tests
npm run test:ui
```

---

## Database

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Example: Add users table
npx prisma migrate dev --name add_users_table

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# Push schema without creating migration (for prototyping)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Database Management

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Or with connection string parts
psql -h localhost -U user -d collab_db

# List databases
\l

# Connect to database
\c collab_db

# List tables
\dt

# Describe table
\d users

# Run SQL query
SELECT * FROM users;

# Exit
\q

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Redis Commands

```bash
# Connect to Redis
redis-cli

# With password
redis-cli -a your-password

# With URL
redis-cli -u redis://localhost:6379

# Test connection
PING
# Should return: PONG

# List all keys
KEYS *

# Get value
GET key

# Set value
SET key value

# Delete key
DEL key

# Clear all data (WARNING!)
FLUSHALL

# Exit
exit

# Monitor all commands in real-time
redis-cli MONITOR
```

---

## Testing

### Playwright Tests

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run specific test file
npx playwright test tests/playwright/collaboration.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Debug tests
npx playwright test --debug

# Generate test code (record actions)
npx playwright codegen http://localhost:3000

# Show test report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots
```

### Manual Testing

```bash
# Start app
npm run dev

# Open in browser
# Windows
start http://localhost:3000

# Mac
open http://localhost:3000

# Linux
xdg-open http://localhost:3000

# Test in multiple browsers
# Open same URL in Chrome, Firefox, Safari
```

---

## Deployment

### Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs

# Pull environment variables
vercel env pull .env.local

# Add environment variable
vercel env add VARIABLE_NAME
```

### Git Commands

```bash
# Initialize repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create GitHub repo (using GitHub CLI)
gh repo create realtime-code-collab --public

# Add remote
git remote add origin https://github.com/username/realtime-code-collab.git

# Push to GitHub
git push -u origin main

# Create feature branch
git checkout -b feature/new-feature

# Push feature branch
git push origin feature/new-feature

# Create pull request
gh pr create
```

### Database Migrations (Production)

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Or on Windows
set DATABASE_URL=postgresql://...

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db pull
```

---

## Troubleshooting

### Clear Caches

```bash
# Clear Next.js cache
rm -rf .next

# Windows
rmdir /s .next

# Clear node_modules
rm -rf node_modules
npm install --legacy-peer-deps

# Clear Prisma generated files
rm -rf node_modules/@prisma/client
npx prisma generate
```

### Port Already in Use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Check if PostgreSQL is running
# Windows
sc query postgresql-x64-15

# Mac
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Restart PostgreSQL
# Windows
net stop postgresql-x64-15
net start postgresql-x64-15

# Mac
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check if Redis is running
# Windows
sc query Redis

# Mac
brew services list | grep redis

# Linux
sudo systemctl status redis

# Restart Redis
# Windows
net stop Redis
net start Redis

# Mac
brew services restart redis

# Linux
sudo systemctl restart redis
```

### Reset Everything

```bash
# Stop all services
docker-compose down -v  # If using Docker

# Clear all caches
rm -rf .next node_modules

# Reinstall
npm install --legacy-peer-deps

# Reset database
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate

# Restart
npm run dev
```

---

## Useful Aliases

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, or PowerShell profile):

```bash
# Development
alias dev="npm run dev"
alias build="npm run build"
alias start="npm start"

# Database
alias db:studio="npx prisma studio"
alias db:migrate="npx prisma migrate dev"
alias db:push="npx prisma db push"
alias db:reset="npx prisma migrate reset"

# Testing
alias test="npm test"
alias test:ui="npm run test:ui"

# Code quality
alias lint="npm run lint"
alias format="npm run format"
alias typecheck="npm run type-check"

# Git
alias gs="git status"
alias ga="git add"
alias gc="git commit -m"
alias gp="git push"
alias gl="git log --oneline --graph"
```

---

## Environment Variables Quick Reference

```bash
# Required for local development
DATABASE_URL=postgresql://user:password@localhost:5432/collab_db
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl>
GITHUB_ID=<from-github-oauth-app>
GITHUB_SECRET=<from-github-oauth-app>
OPENAI_API_KEY=<from-openai-platform>

# Optional
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

---

## Quick Start (TL;DR)

```bash
# 1. Clone and install
git clone <repo>
cd realtime-code-collab
npm install --legacy-peer-deps

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start services (Docker)
docker-compose up -d

# 4. Setup database
npx prisma migrate dev

# 5. Start app
npm run dev

# 6. Open browser
open http://localhost:3000
```

---

## Common Workflows

### Adding a New Feature

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit files ...

# 3. Test
npm run lint
npm run type-check
npm test

# 4. Commit
git add .
git commit -m "feat: add my feature"

# 5. Push
git push origin feature/my-feature

# 6. Create PR
gh pr create
```

### Updating Database Schema

```bash
# 1. Edit prisma/schema.prisma
# ... add/modify models ...

# 2. Create migration
npx prisma migrate dev --name add_new_field

# 3. Verify in Prisma Studio
npx prisma studio

# 4. Update code to use new schema
# ... edit TypeScript files ...

# 5. Test
npm run dev

# 6. Commit
git add prisma/
git commit -m "db: add new field to model"
```

### Deploying to Production

```bash
# 1. Ensure all tests pass
npm test

# 2. Build locally to verify
npm run build

# 3. Commit and push
git add .
git commit -m "chore: prepare for deployment"
git push origin main

# 4. Deploy (Vercel auto-deploys on push)
# Or manually:
vercel --prod

# 5. Run migrations on production DB
DATABASE_URL=<prod-url> npx prisma migrate deploy

# 6. Verify deployment
curl https://your-app.vercel.app
```

---

## Getting Help

```bash
# Next.js help
npx next --help

# Prisma help
npx prisma --help

# Playwright help
npx playwright --help

# npm scripts
npm run

# Check versions
node --version
npm --version
npx prisma --version
```

---

## Performance Profiling

```bash
# Analyze bundle size
npm run build
# Check .next/analyze output

# Profile React components
# Add ?react-devtools to URL in browser

# Database query profiling
# Enable in prisma/schema.prisma:
# log = ["query", "info", "warn", "error"]

# Monitor WebSocket connections
# Use browser DevTools → Network → WS tab
```

---

## Backup and Restore

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Backup Redis
redis-cli --rdb dump.rdb

# Restore database
psql $DATABASE_URL < backup-20241029.sql

# Restore Redis
redis-cli --rdb dump.rdb
redis-cli FLUSHALL
redis-cli --pipe < dump.rdb
```

---

This cheat sheet covers the most common commands you'll use. Bookmark this page for quick reference!
