# Railway Deployment Guide - Complete Step-by-Step

This guide will walk you through deploying your AI Code Review application to Railway with both backend and frontend working.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Git installed on your computer
- All environment variables ready (GitHub OAuth, OpenAI API key, etc.)

---

## Part 1: Push Code to GitHub

### Step 1: Initialize Git Repository

Open PowerShell in your project directory and run:

```powershell
cd "c:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"
git init
```

### Step 2: Configure Git (if not already done)

```powershell
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Step 3: Add All Files

```powershell
git add .
```

### Step 4: Create Initial Commit

```powershell
git commit -m "Initial commit: AI Code Review application with Next.js and Socket.io"
```

### Step 5: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `ai-code-review` (or your preferred name)
3. Description: "AI-powered code review platform with real-time collaboration"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 6: Connect to GitHub Repository

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Example:**
```powershell
git remote add origin https://github.com/johndoe/ai-code-review.git
git branch -M main
git push -u origin main
```

You may be prompted to authenticate with GitHub. Follow the prompts.

---

## Part 2: Deploy to Railway

### Step 7: Create Railway Account

1. Go to https://railway.app
2. Click **Login** or **Start a New Project**
3. Sign up using your **GitHub account** (recommended for easier deployment)

### Step 8: Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. If prompted, authorize Railway to access your GitHub repositories
4. Select your `ai-code-review` repository

### Step 9: Configure Build Settings

Railway should auto-detect your Dockerfile. If not:

1. Go to **Settings** tab
2. Under **Build**, ensure:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile`

### Step 10: Add PostgreSQL Database

1. In your Railway project, click **New**
2. Select **Database** → **PostgreSQL**
3. Railway will automatically provision a PostgreSQL database
4. The `DATABASE_URL` will be automatically added to your environment variables

### Step 11: Add Redis (Optional but Recommended)

1. Click **New** again
2. Select **Database** → **Redis**
3. Railway will provision Redis and add `REDIS_URL` to environment variables

### Step 12: Configure Environment Variables

1. Go to your main service (the one with your code)
2. Click **Variables** tab
3. Add the following environment variables:

#### Required Variables:

```env
# Database (automatically added by Railway)
DATABASE_URL=postgresql://...

# NextAuth Configuration
NEXTAUTH_URL=https://YOUR_APP_NAME.up.railway.app
NEXTAUTH_SECRET=<generate-a-random-secret>

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Node Environment
NODE_ENV=production
```

#### Optional Variables:

```env
# Redis (if using Redis)
REDIS_URL=redis://...

# Port (Railway sets this automatically)
PORT=3000
```

### Step 13: Generate NEXTAUTH_SECRET

Run this command in PowerShell to generate a secure secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### Step 14: Configure GitHub OAuth for Production

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App** (or edit existing)
3. Fill in:
   - **Application name**: AI Code Review (Production)
   - **Homepage URL**: `https://YOUR_APP_NAME.up.railway.app`
   - **Authorization callback URL**: `https://YOUR_APP_NAME.up.railway.app/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID** and generate a new **Client Secret**
6. Add these to Railway environment variables

**Note:** Replace `YOUR_APP_NAME` with your actual Railway app domain (found in Settings → Domains)

### Step 15: Configure Custom Domain (Optional)

1. In Railway, go to **Settings** → **Domains**
2. Railway provides a free domain: `your-app.up.railway.app`
3. Or add your custom domain if you have one

### Step 16: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Watch the **Deployments** tab for build progress
3. Check logs for any errors

### Step 17: Run Database Migrations

After the first deployment:

1. Go to your service in Railway
2. Click on the **Deployments** tab
3. Find the latest deployment
4. The start command in `railway.json` already includes: `npx prisma migrate deploy`
5. This will run automatically on each deployment

Alternatively, you can run migrations manually:

1. Click on your service
2. Go to **Settings** → **Deploy**
3. Under **Custom Start Command**, ensure it's:
   ```
   npx prisma migrate deploy && npx tsx server.ts
   ```

---

## Part 3: Verify Deployment

### Step 18: Test Your Application

1. Open your Railway app URL: `https://YOUR_APP_NAME.up.railway.app`
2. Test the following:
   - ✅ Homepage loads
   - ✅ GitHub OAuth login works
   - ✅ Create a new code review session
   - ✅ Real-time collaboration (Socket.io) works
   - ✅ AI code review functionality works

### Step 19: Monitor Logs

1. In Railway, click on your service
2. Go to **Deployments** tab
3. Click on the latest deployment
4. View **Logs** to monitor application behavior

### Step 20: Check Environment Variables

Ensure all environment variables are set correctly:

```
✅ DATABASE_URL (from PostgreSQL service)
✅ NEXTAUTH_URL (your Railway domain)
✅ NEXTAUTH_SECRET (random secret)
✅ GITHUB_CLIENT_ID (production OAuth app)
✅ GITHUB_CLIENT_SECRET (production OAuth app)
✅ OPENAI_API_KEY (your OpenAI key)
✅ NODE_ENV=production
```

---

## Part 4: Continuous Deployment

### Step 21: Enable Auto-Deploy

Railway automatically deploys when you push to GitHub:

1. Make changes to your code locally
2. Commit changes:
   ```powershell
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Railway will automatically detect the push and deploy

### Step 22: Monitor Deployments

1. Each push creates a new deployment
2. Railway keeps previous deployments
3. You can rollback to previous versions if needed

---

## Troubleshooting

### Issue: Build Fails

**Solution:**
- Check **Logs** in Railway for error messages
- Ensure all dependencies are in `package.json`
- Verify Dockerfile is correct

### Issue: Database Connection Error

**Solution:**
- Verify `DATABASE_URL` is set correctly
- Ensure PostgreSQL service is running
- Check if migrations ran successfully

### Issue: GitHub OAuth Not Working

**Solution:**
- Verify `NEXTAUTH_URL` matches your Railway domain
- Check GitHub OAuth callback URL is correct
- Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are from production OAuth app

### Issue: Socket.io Not Working

**Solution:**
- Ensure your custom server (`server.ts`) is being used
- Check that the start command uses `tsx server.ts`
- Verify WebSocket connections are allowed (Railway supports WebSockets by default)

### Issue: Environment Variables Not Loading

**Solution:**
- Check that variables are set in Railway (not just locally)
- Restart the deployment after adding variables
- Ensure no typos in variable names

---

## Quick Reference Commands

### Git Commands
```powershell
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push

# View remote URL
git remote -v
```

### Railway CLI (Optional)
```powershell
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run command in Railway environment
railway run npm run db:migrate
```

---

## Post-Deployment Checklist

- [ ] Application accessible at Railway URL
- [ ] GitHub OAuth login works
- [ ] Database connected and migrations applied
- [ ] Real-time collaboration (Socket.io) functional
- [ ] AI code review features working
- [ ] Environment variables properly configured
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and logs accessible
- [ ] Auto-deployment from GitHub working

---

## Support

If you encounter issues:

1. Check Railway logs for errors
2. Review environment variables
3. Verify GitHub OAuth configuration
4. Check Railway status page: https://status.railway.app
5. Railway Discord: https://discord.gg/railway

---

## Summary

You've successfully:
1. ✅ Pushed your code to GitHub
2. ✅ Deployed to Railway with PostgreSQL
3. ✅ Configured environment variables
4. ✅ Set up GitHub OAuth for production
5. ✅ Enabled continuous deployment

Your application is now live with both backend (Socket.io, API routes) and frontend (Next.js) working together on Railway!
