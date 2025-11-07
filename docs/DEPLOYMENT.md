# Deployment Guide

This guide covers deploying the Real-Time Code Collaboration Platform to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Separate WebSocket Server](#separate-websocket-server)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Database hosting account (Supabase, PlanetScale, or Railway)
- Redis hosting account (Upstash or Redis Cloud)
- OpenAI API key
- GitHub OAuth app credentials

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis
REDIS_URL="redis://default:password@host:6379"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# GitHub OAuth
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# WebSocket Server (if separate)
NEXT_PUBLIC_SOCKET_URL="https://ws.your-app.com"
```

### Generating NEXTAUTH_SECRET

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Database Setup

### Option 1: Supabase (Recommended for Beginners)

1. **Create Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub

2. **Create Project**
   - Click "New Project"
   - Choose organization
   - Set database password (save this!)
   - Select region (closest to your users)
   - Wait for project to provision (~2 minutes)

3. **Get Connection String**
   - Go to Project Settings → Database
   - Copy "Connection string" (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password
   - Example: `postgresql://postgres:password@db.abc123.supabase.co:5432/postgres`

4. **Configure Connection Pooling** (Important!)
   - Supabase provides a pooled connection string
   - Use the "Connection pooling" string for production
   - Add `?pgbouncer=true` to the URL
   - Example: `postgresql://postgres:password@db.abc123.supabase.co:6543/postgres?pgbouncer=true`

5. **Set in Vercel**
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `DATABASE_URL` with the pooled connection string

### Option 2: PlanetScale

1. **Create Account**
   - Go to [planetscale.com](https://planetscale.com)
   - Sign up with GitHub

2. **Create Database**
   - Click "New database"
   - Choose region
   - Select free "Hobby" plan

3. **Get Connection String**
   - Go to database → Connect
   - Select "Prisma" from framework dropdown
   - Copy the connection string
   - Example: `mysql://user:password@aws.connect.psdb.cloud/database?sslaccept=strict`

4. **Important**: PlanetScale uses MySQL, not PostgreSQL
   - Update `prisma/schema.prisma`:
     ```prisma
     datasource db {
       provider = "mysql"
       url      = env("DATABASE_URL")
       relationMode = "prisma"
     }
     ```
   - Add `@@index` for foreign keys

### Option 3: Railway

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - New Project → Provision PostgreSQL
   - Wait for deployment

3. **Get Connection String**
   - Click on PostgreSQL service
   - Go to "Connect" tab
   - Copy "Postgres Connection URL"
   - Example: `postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway`

---

## Redis Setup

### Option 1: Upstash (Recommended)

1. **Create Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up with GitHub

2. **Create Redis Database**
   - Click "Create Database"
   - Choose region (same as your app)
   - Select "Global" for multi-region (or "Regional" for single region)
   - Free tier: 10,000 commands/day

3. **Get Connection String**
   - Go to database details
   - Copy "Redis URL"
   - Example: `redis://default:password@us1-abc123.upstash.io:6379`

4. **Enable TLS** (Important for production)
   - Upstash uses TLS by default
   - Connection string starts with `rediss://` (note the double 's')

### Option 2: Redis Cloud

1. **Create Account**
   - Go to [redis.com/cloud](https://redis.com/try-free/)
   - Sign up

2. **Create Database**
   - New Subscription → Free tier
   - Choose cloud provider and region
   - Create database

3. **Get Connection Details**
   - Go to database → Configuration
   - Copy endpoint and password
   - Format: `redis://default:password@redis-12345.cloud.redislabs.com:12345`

### Option 3: Vercel KV (Easiest for Vercel Users)

1. **Enable in Vercel**
   - Vercel Dashboard → Storage → Create Database
   - Select "KV" (Redis-compatible)
   - Connect to your project

2. **Automatic Configuration**
   - Vercel automatically sets `KV_URL`, `KV_REST_API_URL`, etc.
   - Update code to use Vercel KV SDK:
     ```typescript
     import { kv } from '@vercel/kv';
     ```

---

## Vercel Deployment

### Step 1: Prepare Repository

1. **Initialize Git** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**
   ```bash
   gh repo create realtime-code-collab --public
   git remote add origin https://github.com/yourusername/realtime-code-collab.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Import Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install --legacy-peer-deps`

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from `.env.example`
   - Set for "Production", "Preview", and "Development"

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)

### Step 3: Run Database Migrations

**Important**: Vercel doesn't run migrations automatically!

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migrations
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

Or use Vercel's "Deploy Hooks":

```bash
# In your project settings, create a deploy hook
# Then trigger it after migrations:
curl -X POST https://api.vercel.com/v1/integrations/deploy/...
```

---

## Separate WebSocket Server

Since Vercel is serverless, WebSocket connections need a separate server.

### Option 1: Railway

1. **Create New Service**
   - Railway Dashboard → New Project
   - Deploy from GitHub repo

2. **Configure**
   - Add `Dockerfile`:
     ```dockerfile
     FROM node:18-alpine
     WORKDIR /app
     COPY package*.json ./
     RUN npm ci --legacy-peer-deps
     COPY . .
     RUN npm run build
     EXPOSE 3000
     CMD ["npm", "start"]
     ```

3. **Environment Variables**
   - Add all required env vars in Railway
   - Set `PORT=3000`

4. **Deploy**
   - Railway automatically deploys on push
   - Get public URL: `your-app.railway.app`

5. **Update Vercel**
   - Add `NEXT_PUBLIC_SOCKET_URL=https://your-app.railway.app` in Vercel

### Option 2: Render

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub repo

2. **Configure**
   - Build Command: `npm install --legacy-peer-deps && npm run build`
   - Start Command: `npm start`
   - Plan: Free (or paid for better performance)

3. **Environment Variables**
   - Add all required vars

4. **Deploy**
   - Render builds and deploys
   - Get URL: `your-app.onrender.com`

### Option 3: DigitalOcean App Platform

1. **Create App**
   - DigitalOcean → Apps → Create App
   - Connect GitHub

2. **Configure**
   - Detected as Node.js app
   - Build: `npm install --legacy-peer-deps && npm run build`
   - Run: `npm start`

3. **Add Database & Redis**
   - Add PostgreSQL database component
   - Add Redis database component
   - Automatically connected

4. **Deploy**
   - DigitalOcean builds and deploys
   - Get URL: `your-app.ondigitalocean.app`

---

## GitHub OAuth Setup

### Development

1. **Create OAuth App**
   - GitHub → Settings → Developer settings → OAuth Apps
   - New OAuth App
   - Application name: "Code Collab (Dev)"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

2. **Get Credentials**
   - Copy Client ID → `GITHUB_ID` in `.env`
   - Generate client secret → `GITHUB_SECRET` in `.env`

### Production

1. **Create Separate OAuth App**
   - New OAuth App
   - Application name: "Code Collab"
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

2. **Update Vercel**
   - Add production `GITHUB_ID` and `GITHUB_SECRET` in Vercel

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check if site is up
curl https://your-app.vercel.app

# Check API routes
curl https://your-app.vercel.app/api/sessions

# Check WebSocket server
curl https://your-ws-server.railway.app
```

### 2. Test Features

- [ ] Sign in with GitHub
- [ ] Create a session
- [ ] Open session in two browsers
- [ ] Type in one, verify sync in other
- [ ] Send chat message
- [ ] Request AI review

### 3. Monitor

- **Vercel Dashboard**: Check function logs, errors
- **Database**: Monitor connection count, query performance
- **Redis**: Check memory usage, command count
- **OpenAI**: Monitor token usage, costs

### 4. Set Up Alerts

- **Vercel**: Enable email notifications for failed deployments
- **Uptime Monitor**: Use UptimeRobot or Pingdom
- **Error Tracking**: Integrate Sentry

---

## Troubleshooting

### Database Connection Errors

**Error**: `Can't reach database server`

**Solutions**:
1. Check `DATABASE_URL` is correct
2. Verify database is running
3. Check IP whitelist (some providers require this)
4. Use connection pooling for serverless

**Error**: `Too many connections`

**Solutions**:
1. Use connection pooling (PgBouncer)
2. Reduce `connection_limit` in DATABASE_URL
3. Upgrade database plan

### Redis Connection Errors

**Error**: `ECONNREFUSED`

**Solutions**:
1. Check `REDIS_URL` is correct
2. Verify Redis is running
3. Check if TLS is required (`rediss://` vs `redis://`)

### WebSocket Connection Errors

**Error**: `WebSocket connection failed`

**Solutions**:
1. Check `NEXT_PUBLIC_SOCKET_URL` is set
2. Verify WebSocket server is running
3. Check CORS configuration
4. Ensure port is open (not blocked by firewall)

### Build Errors

**Error**: `Module not found`

**Solutions**:
1. Run `npm install --legacy-peer-deps`
2. Check `package.json` dependencies
3. Clear `.next` folder and rebuild

**Error**: `Prisma Client not generated`

**Solutions**:
1. Ensure `postinstall` script runs: `"postinstall": "prisma generate"`
2. Manually run `npx prisma generate`

### Authentication Errors

**Error**: `Callback URL mismatch`

**Solutions**:
1. Check GitHub OAuth app callback URL matches `NEXTAUTH_URL/api/auth/callback/github`
2. Ensure `NEXTAUTH_URL` is set correctly

**Error**: `Invalid session`

**Solutions**:
1. Check `NEXTAUTH_SECRET` is set
2. Clear browser cookies
3. Verify JWT configuration

---

## Performance Optimization

### 1. Enable Caching

```typescript
// In API routes
export const revalidate = 60; // Cache for 60 seconds
```

### 2. Optimize Images

```typescript
// Use Next.js Image component
import Image from 'next/image';
```

### 3. Database Indexing

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_sessions_owner ON code_sessions(ownerId);
CREATE INDEX idx_sessions_updated ON code_sessions(updatedAt DESC);
```

### 4. Redis Caching

```typescript
// Cache AI review results
const cacheKey = `review:${hash(code)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const result = await openai.chat.completions.create(...);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour
```

---

## Cost Estimation

### Free Tier (Hobby Projects)

- **Vercel**: Free (100GB bandwidth, 100 hours serverless)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **Upstash**: Free (10k commands/day)
- **OpenAI**: Pay-as-you-go (~$0.01 per review)

**Total**: ~$0-5/month (depending on OpenAI usage)

### Production (Small Team)

- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Upstash**: $10/month
- **Railway**: $5/month (WebSocket server)
- **OpenAI**: ~$20-50/month

**Total**: ~$80-110/month

---

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database uses SSL/TLS
- [ ] Redis uses TLS
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all API routes
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)
- [ ] HTTPS enforced (Vercel does this automatically)

---

## Backup Strategy

### Database Backups

**Supabase**: Automatic daily backups (retained for 7 days on free tier)

**Manual Backup**:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Redis Backups

**Upstash**: Automatic snapshots

**Manual Backup**:
```bash
redis-cli --rdb dump.rdb
```

---

## Rollback Procedure

### Vercel

1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Database

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Restore from backup
psql $DATABASE_URL < backup.sql
```

---

## Next Steps

1. Set up monitoring (Sentry, LogRocket)
2. Configure custom domain
3. Add SSL certificate (Vercel does this automatically)
4. Set up staging environment
5. Create runbook for common issues

---

## Support

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Upstash**: [upstash.com/docs](https://upstash.com/docs)
- **OpenAI**: [platform.openai.com/docs](https://platform.openai.com/docs)
