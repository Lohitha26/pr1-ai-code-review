# 🚀 Quick Start - Deploy in 15 Minutes

Follow these steps to deploy your AI Code Review app to Railway.

## 📝 What You Need

1. GitHub account
2. Railway account (free - sign up at [railway.app](https://railway.app))
3. OpenAI API key ([get here](https://platform.openai.com/api-keys))

---

## 🎯 Step-by-Step (Copy & Paste)

### 1. Push to GitHub (5 minutes)

```powershell
# Navigate to your project
cd "C:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ai-code-review.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Railway (5 minutes)

1. Go to [railway.app](https://railway.app) → Login with GitHub
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"** → Wait 30 seconds
4. Click **"+ New"** → **"Database"** → **"Add Redis"** → Wait 20 seconds
5. Click **"+ New"** → **"GitHub Repo"** → Select your `ai-code-review` repo

### 3. Add Environment Variables (3 minutes)

Click on your **app service** → **Variables** → Add these:

```bash
DATABASE_URL=<copy from PostgreSQL service Variables tab>
REDIS_URL=<copy from Redis service Variables tab>
NEXTAUTH_URL=<will get after generating domain>
NEXTAUTH_SECRET=<generate below>
GITHUB_ID=<will get in next step>
GITHUB_SECRET=<will get in next step>
OPENAI_API_KEY=sk-your-openai-key-here
NODE_ENV=production
PORT=3000
```

**Generate NEXTAUTH_SECRET** (PowerShell):
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Get Railway Domain**:
- Go to **Settings** → **Domains** → **Generate Domain**
- Copy the URL (e.g., `https://ai-code-review-production.up.railway.app`)
- Update `NEXTAUTH_URL` with this URL

### 4. Set Up GitHub OAuth (2 minutes)

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Name**: `AI Code Review`
   - **Homepage URL**: `https://your-railway-url.up.railway.app`
   - **Callback URL**: `https://your-railway-url.up.railway.app/api/auth/callback/github`
4. Click **"Register application"**
5. Copy **Client ID** → Update `GITHUB_ID` in Railway
6. Click **"Generate a new client secret"** → Copy → Update `GITHUB_SECRET` in Railway

### 5. Run Database Migrations (2 minutes)

**Option A - Railway CLI**:
```powershell
npm install -g @railway/cli
railway login
railway link
railway run npx prisma migrate deploy
```

**Option B - Local**:
```powershell
$env:DATABASE_URL="<your-railway-postgres-url>"
npx prisma migrate deploy
```

### 6. Test Your App! 🎉

1. Go to your Railway app URL
2. Sign in with GitHub
3. Create a new session
4. Test real-time editing (open in 2 tabs)

---

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL provisioned
- [ ] Redis added
- [ ] App deployed from GitHub
- [ ] All environment variables added
- [ ] Domain generated
- [ ] GitHub OAuth app created
- [ ] Database migrations ran
- [ ] App tested and working

---

## 🆘 Common Issues

**Build fails?**
```powershell
# Clear and reinstall
Remove-Item -Recurse -Force node_modules
npm install
git add .
git commit -m "Fix dependencies"
git push
```

**Can't sign in?**
- Check `NEXTAUTH_URL` matches Railway domain exactly
- Verify GitHub OAuth callback URL is correct
- Ensure `GITHUB_ID` and `GITHUB_SECRET` are set

**Database error?**
- Run migrations: `railway run npx prisma migrate deploy`
- Check `DATABASE_URL` is correct

---

## 📚 Full Documentation

For detailed explanations, see:
- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **DEPLOYMENT_CHECKLIST.md** - Detailed checklist

---

## 💰 Cost

**Free tier includes**:
- $5/month Railway credit
- Enough for hobby projects
- No credit card required initially

**Typical usage**: $3-5/month (within free tier)

---

**That's it! Your app is live! 🚀**
