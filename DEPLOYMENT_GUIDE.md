# 🚀 Complete Deployment Guide - Railway (Single Server)

This guide will walk you through deploying your AI Code Review application to Railway with PostgreSQL and Redis included.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Prepare Your Code](#prepare-your-code)
3. [Push to GitHub](#push-to-github)
4. [Set Up Railway Account](#set-up-railway-account)
5. [Deploy PostgreSQL Database](#deploy-postgresql-database)
6. [Deploy Redis](#deploy-redis)
7. [Deploy Your Application](#deploy-your-application)
8. [Configure Environment Variables](#configure-environment-variables)
9. [Set Up GitHub OAuth](#set-up-github-oauth)
10. [Run Database Migrations](#run-database-migrations)
11. [Test Your Deployment](#test-your-deployment)
12. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Prerequisites

Before starting, ensure you have:
- ✅ GitHub account
- ✅ Railway account (sign up at [railway.app](https://railway.app))
- ✅ OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- ✅ Git installed on your computer

---

## 2️⃣ Prepare Your Code

### Step 1: Update .gitignore

Make sure your `.gitignore` includes:

```
# Environment variables
.env
.env*.local

# Dependencies
node_modules/

# Build outputs
.next/
out/
dist/
build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db
```

### Step 2: Verify Files Are Ready

Check that these files exist in your project:
- ✅ `Dockerfile` (created)
- ✅ `.dockerignore` (created)
- ✅ `railway.json` (created)
- ✅ `next.config.js` (updated with standalone output)
- ✅ `.env.example` (for reference)

---

## 3️⃣ Push to GitHub

### Step 1: Create a New GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the **"+"** icon → **"New repository"**
3. Fill in:
   - **Repository name**: `ai-code-review` (or your preferred name)
   - **Description**: "Real-time collaborative code editor with AI review"
   - **Visibility**: Public or Private (your choice)
4. **DO NOT** initialize with README, .gitignore, or license
5. Click **"Create repository"**

### Step 2: Initialize Git (if not already done)

Open PowerShell in your project directory:

```powershell
cd "C:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AI Code Review Platform"
```

### Step 3: Push to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/ai-code-review.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Checkpoint**: Your code should now be on GitHub!

---

## 4️⃣ Set Up Railway Account

### Step 1: Sign Up

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub account
4. Complete the setup

### Step 2: Add Payment Method (Optional but Recommended)

- Railway offers **$5 free credit per month**
- For production apps, add a credit card (you won't be charged unless you exceed free tier)
- Go to **Account Settings** → **Billing** → **Add Payment Method**

---

## 5️⃣ Deploy PostgreSQL Database

### Step 1: Create New Project

1. In Railway dashboard, click **"New Project"**
2. Select **"Provision PostgreSQL"**
3. Wait for database to deploy (~30 seconds)

### Step 2: Get Database Connection String

1. Click on the **PostgreSQL** service
2. Go to **"Variables"** tab
3. Find and copy **`DATABASE_URL`**
4. It will look like: `postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway`

**💾 Save this URL** - you'll need it later!

---

## 6️⃣ Deploy Redis

### Step 1: Add Redis to Project

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. Wait for Redis to deploy (~20 seconds)

### Step 2: Get Redis Connection String

1. Click on the **Redis** service
2. Go to **"Variables"** tab
3. Find and copy **`REDIS_URL`**
4. It will look like: `redis://default:password@containers-us-west-123.railway.app:6379`

**💾 Save this URL** - you'll need it later!

---

## 7️⃣ Deploy Your Application

### Step 1: Add GitHub Repository

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your **`ai-code-review`** repository
4. Railway will detect the Dockerfile automatically

### Step 2: Configure Build Settings

Railway should automatically detect:
- ✅ **Builder**: Dockerfile
- ✅ **Build Command**: Uses Dockerfile
- ✅ **Start Command**: `node server.ts`

If not, you can set these in **Settings** → **Deploy**

---

## 8️⃣ Configure Environment Variables

### Step 1: Add Environment Variables

1. Click on your **app service** (not database or Redis)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add each of these:

#### Required Variables:

```bash
# Database (use the URL from step 5)
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway

# Redis (use the URL from step 6)
REDIS_URL=redis://default:password@containers-us-west-123.railway.app:6379

# NextAuth URL (Railway will provide this after first deploy)
NEXTAUTH_URL=https://your-app.up.railway.app

# NextAuth Secret (generate a random string)
NEXTAUTH_SECRET=your-generated-secret-here

# GitHub OAuth (we'll set this up next)
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Node Environment
NODE_ENV=production

# Port (Railway sets this automatically, but add it anyway)
PORT=3000
```

### Step 2: Generate NEXTAUTH_SECRET

Run this in PowerShell:

```powershell
# Generate a random 32-character base64 string
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Copy the output and use it as `NEXTAUTH_SECRET`

### Step 3: Get Your Railway App URL

1. After adding variables, Railway will start deploying
2. Go to **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://ai-code-review-production-abc123.up.railway.app`
5. **Copy this URL** and update the `NEXTAUTH_URL` variable with it

---

## 9️⃣ Set Up GitHub OAuth

### Step 1: Create GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in:
   - **Application name**: `AI Code Review (Production)`
   - **Homepage URL**: `https://your-app.up.railway.app` (your Railway URL)
   - **Authorization callback URL**: `https://your-app.up.railway.app/api/auth/callback/github`
4. Click **"Register application"**

### Step 2: Get Credentials

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't see it again!)

### Step 3: Update Railway Variables

1. Go back to Railway → Your app → **Variables**
2. Update:
   - `GITHUB_ID` = your Client ID
   - `GITHUB_SECRET` = your Client Secret
3. Railway will automatically redeploy

---

## 🔟 Run Database Migrations

### Option 1: Using Railway CLI (Recommended)

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

### Option 2: Using Local Terminal

```powershell
# Set the production DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

**✅ Checkpoint**: Your database schema is now created!

---

## 1️⃣1️⃣ Test Your Deployment

### Step 1: Check Deployment Status

1. Go to Railway dashboard
2. Click on your app service
3. Go to **"Deployments"** tab
4. Wait for status to show **"Success"** (green checkmark)
5. Check **"Logs"** tab for any errors

### Step 2: Visit Your App

1. Click on your app's domain URL
2. You should see the home page
3. Try signing in with GitHub
4. Create a new coding session
5. Test real-time collaboration by opening the same session in two browser tabs

### Step 3: Verify Features

Test these features:
- ✅ GitHub OAuth login
- ✅ Create new session
- ✅ Real-time code editing (open in 2 tabs)
- ✅ Live cursors and awareness
- ✅ Chat functionality
- ✅ AI code review

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Error**: `Cannot find module 'xyz'`

**Solution**:
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Commit and push
git add .
git commit -m "Fix dependencies"
git push
```

### Issue: Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Check `DATABASE_URL` is correct in Railway variables
2. Ensure PostgreSQL service is running
3. Check if database migrations ran successfully

### Issue: Redis Connection Error

**Error**: `ECONNREFUSED redis`

**Solution**:
1. Check `REDIS_URL` is correct
2. Ensure Redis service is running in Railway
3. Verify Redis URL format: `redis://default:password@host:port`

### Issue: GitHub OAuth 404

**Error**: `404 Not Found` when signing in

**Solution**:
1. Verify `NEXTAUTH_URL` matches your Railway domain exactly
2. Check GitHub OAuth callback URL matches: `https://your-app.up.railway.app/api/auth/callback/github`
3. Ensure `GITHUB_ID` and `GITHUB_SECRET` are correct

### Issue: Socket.io Not Working

**Error**: `WebSocket connection failed`

**Solution**:
1. Check Railway logs for Socket.io initialization
2. Verify port 3000 is exposed in Dockerfile
3. Ensure `NEXT_PUBLIC_SOCKET_URL` is not set (or set to same domain)

### Issue: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```powershell
# Run migrations again
railway run npx prisma migrate deploy

# Or redeploy
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## 📊 Monitor Your Deployment

### Railway Dashboard

- **Metrics**: View CPU, memory, and network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments

### Set Up Alerts

1. Go to **Project Settings** → **Notifications**
2. Enable email notifications for:
   - Deployment failures
   - Service crashes
   - Resource limits

---

## 💰 Cost Estimation

### Railway Free Tier
- **$5 credit per month** (enough for hobby projects)
- Includes: 512MB RAM, shared CPU
- Estimated usage: ~$3-5/month for this app

### If You Exceed Free Tier
- **PostgreSQL**: ~$5/month
- **Redis**: ~$5/month
- **App Server**: ~$5/month
- **Total**: ~$15/month

### OpenAI Costs
- **GPT-4**: ~$0.01-0.03 per code review
- **Estimated**: $5-20/month depending on usage

---

## 🔐 Security Checklist

Before going live:
- ✅ All secrets in environment variables (not in code)
- ✅ `.env` file is in `.gitignore`
- ✅ Strong `NEXTAUTH_SECRET` generated
- ✅ Database uses SSL (Railway does this automatically)
- ✅ Redis uses TLS (Railway does this automatically)
- ✅ HTTPS enabled (Railway does this automatically)
- ✅ GitHub OAuth callback URL is correct

---

## 🎉 Success!

Your AI Code Review platform is now live! 

**Your app URL**: `https://your-app.up.railway.app`

### Next Steps

1. **Custom Domain** (Optional)
   - Go to Railway → Settings → Domains
   - Add your custom domain
   - Update DNS records

2. **Monitoring** (Recommended)
   - Set up error tracking (Sentry)
   - Monitor OpenAI usage
   - Set up uptime monitoring

3. **Backup Strategy**
   - Railway automatically backs up databases
   - Consider additional backups for production

---

## 📞 Support

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **Socket.io**: [socket.io/docs](https://socket.io/docs)

---

## 🔄 Updating Your Deployment

To deploy updates:

```powershell
# Make your changes
# ...

# Commit and push
git add .
git commit -m "Your update message"
git push

# Railway will automatically redeploy!
```

---

**Need help?** Check the Railway logs first, they usually show exactly what went wrong!
