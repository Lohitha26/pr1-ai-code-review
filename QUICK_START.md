# 🚀 Quick Start - Deploy to Railway in 20 Minutes

This is a condensed guide to get your AI Code Review app deployed quickly.

## ⚡ Prerequisites (5 minutes)

1. **GitHub Account** - Sign up at https://github.com
2. **Railway Account** - Sign up at https://railway.app (use GitHub login)
3. **OpenAI API Key** - Get from https://platform.openai.com/api-keys
4. **Git Installed** - Download from https://git-scm.com

---

## 📦 Part 1: Push to GitHub (5 minutes)

Open PowerShell in your project folder:

```powershell
# Navigate to project
cd "c:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"

# Initialize Git
git init

# Configure Git (use your info)
git config user.name "Your Name"
git config user.email "your@email.com"

# Add and commit
git add .
git commit -m "Initial commit: AI Code Review app"
```

**Create GitHub Repository:**
1. Go to https://github.com/new
2. Name: `ai-code-review`
3. Don't initialize with anything
4. Click **Create repository**

**Push to GitHub:**
```powershell
# Replace YOUR_USERNAME and YOUR_REPO with your values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 🚂 Part 2: Deploy to Railway (10 minutes)

### 1. Create Project
- Go to https://railway.app
- Click **New Project**
- Select **Deploy from GitHub repo**
- Choose your `ai-code-review` repository

### 2. Add Database
- Click **New** → **Database** → **PostgreSQL**
- Railway auto-configures `DATABASE_URL`

### 3. Add Redis (Optional)
- Click **New** → **Database** → **Redis**
- Railway auto-configures `REDIS_URL`

### 4. Generate Secret
Run in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output - you'll need it next.

### 5. Add Environment Variables
Go to your service → **Variables** tab → Add these:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://YOUR_APP.up.railway.app` |
| `NEXTAUTH_SECRET` | Paste from step 4 |
| `GITHUB_CLIENT_ID` | Get from step 6 below |
| `GITHUB_CLIENT_SECRET` | Get from step 6 below |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `NODE_ENV` | `production` |

### 6. Setup GitHub OAuth
1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Name**: AI Code Review (Production)
   - **Homepage**: `https://YOUR_APP.up.railway.app`
   - **Callback**: `https://YOUR_APP.up.railway.app/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID** and **Client Secret**
6. Add them to Railway variables (step 5)

**Note:** Get `YOUR_APP` name from Railway → Settings → Domains

---

## ✅ Part 3: Verify (5 minutes)

### Check Deployment
1. Go to **Deployments** tab in Railway
2. Wait for build to complete (green checkmark)
3. Click on deployment to view logs

### Test Your App
Open: `https://YOUR_APP.up.railway.app`

Test these features:
- ✅ Homepage loads
- ✅ GitHub login works
- ✅ Create code review session
- ✅ Real-time collaboration
- ✅ AI code review

---

## 🔄 Future Updates

After initial deployment, just push to GitHub:

```powershell
git add .
git commit -m "Your changes"
git push
```

Railway automatically deploys! 🎉

---

## 🆘 Troubleshooting

### Build Fails
- Check Railway logs for errors
- Verify all dependencies in `package.json`

### GitHub Login Fails
- Verify `NEXTAUTH_URL` matches Railway domain exactly
- Check GitHub OAuth callback URL is correct
- Ensure using production OAuth credentials

### Database Error
- Verify PostgreSQL service is running
- Check `DATABASE_URL` is set (auto-added by Railway)

### Socket.io Not Working
- Verify start command: `npx tsx server.ts`
- Check Railway logs for WebSocket errors

---

## 📚 Need More Help?

- **Detailed Guide**: See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.txt`
- **Environment Template**: See `.env.railway`
- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway

---

## 🎯 Summary

You've deployed a full-stack Next.js app with:
- ✅ Custom Express server with Socket.io
- ✅ PostgreSQL database
- ✅ GitHub OAuth authentication
- ✅ OpenAI integration
- ✅ Real-time collaboration
- ✅ Continuous deployment from GitHub

**Total Time**: ~20 minutes
**Cost**: Free tier available on Railway

Enjoy your deployed app! 🚀
