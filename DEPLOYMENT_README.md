# 🚀 Deployment Guide - AI Code Review Platform

Complete guide to deploy your AI Code Review application to Railway with both backend (Socket.io) and frontend (Next.js) working together.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start (20 min)](#quick-start)
3. [Detailed Steps](#detailed-steps)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)
6. [Post-Deployment](#post-deployment)

---

## 🎯 Overview

This application is a full-stack Next.js app with:
- **Frontend**: Next.js 14 with App Router
- **Backend**: Custom Express server with Socket.io
- **Database**: PostgreSQL (via Prisma)
- **Cache**: Redis (optional)
- **Auth**: NextAuth.js with GitHub OAuth
- **AI**: OpenAI GPT-4 integration

**Deployment Platform**: Railway (recommended for WebSocket support)

---

## ⚡ Quick Start

### Prerequisites
- GitHub account
- Railway account (sign up with GitHub)
- OpenAI API key
- Git installed

### 3-Step Deployment

#### 1️⃣ Push to GitHub (5 min)
```powershell
cd "c:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### 2️⃣ Deploy on Railway (10 min)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add PostgreSQL database
4. Configure environment variables (see below)
5. Set up GitHub OAuth

#### 3️⃣ Verify (5 min)
- Test login
- Create code review session
- Verify real-time features

**See `QUICK_START.md` for detailed quick start guide.**

---

## 📝 Detailed Steps

### Step 1: Prepare Your Code

Ensure these files exist (already included):
- ✅ `Dockerfile` - Multi-stage Docker build
- ✅ `railway.json` - Railway configuration
- ✅ `.gitignore` - Excludes node_modules, .env, etc.
- ✅ `prisma/schema.prisma` - Database schema

### Step 2: Initialize Git Repository

```powershell
# Navigate to project
cd "c:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"

# Initialize Git
git init

# Configure Git (first time only)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Code Review application with Next.js and Socket.io"
```

### Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `ai-code-review` (or your choice)
3. Description: "AI-powered code review platform with real-time collaboration"
4. Choose Public or Private
5. **Important**: Do NOT initialize with README, .gitignore, or license
6. Click **Create repository**

### Step 4: Push to GitHub

```powershell
# Add remote (replace with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/ai-code-review.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

You may be prompted to authenticate with GitHub.

### Step 5: Create Railway Account

1. Go to https://railway.app
2. Click **Login** or **Start a New Project**
3. **Sign up with GitHub** (recommended)
4. Authorize Railway to access your repositories

### Step 6: Create Railway Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your `ai-code-review` repository
4. Railway will automatically detect the Dockerfile

### Step 7: Add PostgreSQL Database

1. In your Railway project, click **New**
2. Select **Database** → **PostgreSQL**
3. Railway automatically:
   - Provisions PostgreSQL instance
   - Creates `DATABASE_URL` environment variable
   - Links it to your service

### Step 8: Add Redis (Optional but Recommended)

1. Click **New** again
2. Select **Database** → **Redis**
3. Railway automatically:
   - Provisions Redis instance
   - Creates `REDIS_URL` environment variable
   - Links it to your service

### Step 9: Configure Environment Variables

#### Generate NEXTAUTH_SECRET

Run this in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output.

#### Add Variables to Railway

1. Click on your main service (the one with your code)
2. Go to **Variables** tab
3. Click **New Variable**
4. Add each variable below:

**Required Variables:**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `DATABASE_URL` | Auto-added | From PostgreSQL service |
| `NEXTAUTH_URL` | `https://YOUR_APP.up.railway.app` | Get domain from Settings → Domains |
| `NEXTAUTH_SECRET` | Paste from above | Generated secret |
| `GITHUB_CLIENT_ID` | From GitHub OAuth | See Step 10 |
| `GITHUB_CLIENT_SECRET` | From GitHub OAuth | See Step 10 |
| `OPENAI_API_KEY` | `sk-...` | From OpenAI platform |
| `NODE_ENV` | `production` | Required |

**Optional Variables:**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `REDIS_URL` | Auto-added | From Redis service |
| `PORT` | `3000` | Railway sets automatically |

### Step 10: Setup GitHub OAuth for Production

**Important**: Create a NEW OAuth app for production (separate from development).

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:

   ```
   Application name: AI Code Review (Production)
   Homepage URL: https://YOUR_APP_NAME.up.railway.app
   Application description: AI-powered code review platform
   Authorization callback URL: https://YOUR_APP_NAME.up.railway.app/api/auth/callback/github
   ```

4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret**
7. Copy the **Client Secret** (you won't see it again!)
8. Add both to Railway environment variables

**Note**: Replace `YOUR_APP_NAME` with your actual Railway domain (found in Settings → Domains)

### Step 11: Deploy

1. Railway automatically starts deploying after you connect the repo
2. Go to **Deployments** tab to monitor progress
3. Click on the deployment to view logs
4. Wait for build to complete (usually 3-5 minutes)

### Step 12: Verify Deployment

1. Go to **Settings** → **Domains** to get your app URL
2. Click the URL to open your app
3. Test the following:
   - ✅ Homepage loads
   - ✅ GitHub login works
   - ✅ User can create a session
   - ✅ Real-time collaboration works
   - ✅ AI code review works

---

## 🔐 Environment Variables

### Complete List

```env
# Database (Auto-added by Railway)
DATABASE_URL=postgresql://...

# Redis (Auto-added by Railway if using Redis)
REDIS_URL=redis://...

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=<random-32-byte-base64-string>

# GitHub OAuth (Production)
GITHUB_CLIENT_ID=<your-production-client-id>
GITHUB_CLIENT_SECRET=<your-production-client-secret>

# OpenAI API
OPENAI_API_KEY=sk-<your-openai-api-key>

# Node Environment
NODE_ENV=production

# Port (Optional - Railway sets automatically)
PORT=3000
```

### How to Get Each Variable

| Variable | How to Get |
|----------|------------|
| `DATABASE_URL` | Auto-added by Railway PostgreSQL |
| `REDIS_URL` | Auto-added by Railway Redis |
| `NEXTAUTH_URL` | Your Railway domain |
| `NEXTAUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app (production) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app (production) |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

---

## 🐛 Troubleshooting

### Build Fails

**Symptoms**: Deployment fails during build

**Solutions**:
1. Check Railway logs for specific error
2. Verify all dependencies are in `package.json`
3. Ensure Dockerfile is correct
4. Check if build runs locally: `docker build -t test .`

### Database Connection Error

**Symptoms**: App crashes with database connection error

**Solutions**:
1. Verify PostgreSQL service is running in Railway
2. Check `DATABASE_URL` is set correctly
3. Ensure migrations ran: Check logs for "prisma migrate deploy"
4. Try redeploying

### GitHub OAuth Not Working

**Symptoms**: Login redirects to error page or 404

**Solutions**:
1. Verify `NEXTAUTH_URL` matches Railway domain exactly
2. Check GitHub OAuth callback URL is correct
3. Ensure using **production** OAuth credentials (not development)
4. Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
5. Check that callback URL in GitHub matches: `https://YOUR_APP.up.railway.app/api/auth/callback/github`

### Socket.io Not Working

**Symptoms**: Real-time features don't work

**Solutions**:
1. Verify start command uses `tsx server.ts`
2. Check Railway logs for WebSocket errors
3. Ensure custom server is running (not Next.js standalone)
4. Railway supports WebSockets by default, no special config needed

### Environment Variables Not Loading

**Symptoms**: App can't find environment variables

**Solutions**:
1. Verify variables are set in Railway (not just locally)
2. Check for typos in variable names
3. Redeploy after adding variables
4. Use exact names (case-sensitive)

### App Crashes on Startup

**Symptoms**: Deployment succeeds but app crashes

**Solutions**:
1. Check Railway logs for error messages
2. Verify all required environment variables are set
3. Check database connection
4. Ensure `NODE_ENV=production` is set
5. Verify start command is correct

---

## 🔄 Post-Deployment

### Continuous Deployment

Railway automatically deploys when you push to GitHub:

```powershell
# Make changes to your code
# ...

# Commit and push
git add .
git commit -m "Your commit message"
git push
```

Railway will:
1. Detect the push
2. Build the Docker image
3. Run database migrations
4. Deploy the new version
5. Zero-downtime deployment

### Monitoring

1. **Logs**: Railway → Your Service → Deployments → Click deployment → Logs
2. **Metrics**: Railway → Your Service → Metrics
3. **Database**: Railway → PostgreSQL service → Metrics

### Rollback

If something goes wrong:
1. Go to **Deployments** tab
2. Find a previous working deployment
3. Click **⋮** → **Redeploy**

### Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **Custom Domain**
3. Enter your domain
4. Add DNS records as instructed
5. Update `NEXTAUTH_URL` and GitHub OAuth callback URL

### Scaling

Railway automatically scales based on usage. For manual scaling:
1. Go to **Settings** → **Resources**
2. Adjust resources as needed

---

## 📚 Additional Resources

### Documentation Files

- **`QUICK_START.md`** - 20-minute deployment guide
- **`RAILWAY_DEPLOYMENT_GUIDE.md`** - Comprehensive step-by-step guide
- **`DEPLOYMENT_CHECKLIST.txt`** - Printable checklist
- **`.env.railway`** - Environment variables template
- **`deploy-commands.ps1`** - PowerShell commands reference

### External Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.io Docs**: https://socket.io/docs

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Redis added (optional)
- [ ] All environment variables configured
- [ ] GitHub OAuth setup for production
- [ ] Deployment successful
- [ ] Homepage loads
- [ ] GitHub login works
- [ ] Database connected
- [ ] Real-time features work
- [ ] AI features work
- [ ] Monitoring setup
- [ ] Custom domain configured (optional)

---

## 🎉 Success!

Your AI Code Review platform is now deployed with:
- ✅ Full-stack Next.js application
- ✅ Custom server with Socket.io for real-time collaboration
- ✅ PostgreSQL database with Prisma ORM
- ✅ GitHub OAuth authentication
- ✅ OpenAI integration for AI-powered reviews
- ✅ Continuous deployment from GitHub
- ✅ Production-ready infrastructure

**Your app is live at**: `https://YOUR_APP.up.railway.app`

Enjoy your deployed application! 🚀

---

## 💡 Tips

1. **Keep secrets safe**: Never commit `.env` files
2. **Monitor logs**: Check Railway logs regularly
3. **Test before pushing**: Test changes locally first
4. **Use staging**: Consider a staging environment for testing
5. **Backup database**: Railway provides automatic backups
6. **Update dependencies**: Keep packages up to date
7. **Monitor costs**: Check Railway usage dashboard

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway logs for errors
3. Verify all environment variables
4. Check Railway status: https://status.railway.app
5. Ask on Railway Discord: https://discord.gg/railway

---

**Last Updated**: 2024
**Platform**: Railway
**Framework**: Next.js 14
**Node Version**: 18+
