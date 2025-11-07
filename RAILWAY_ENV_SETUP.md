# Railway Environment Variables Setup

After your build succeeds, you MUST configure these environment variables in Railway for the app to work properly.

## 🔑 How to Add Variables in Railway

1. Go to your Railway project
2. Click on your **service** (the one with your code, not the database)
3. Go to the **Variables** tab
4. Click **New Variable** for each one below

---

## ✅ Required Environment Variables

### 1. NEXTAUTH_URL
**Value:** `https://YOUR_APP_NAME.up.railway.app`

**How to get it:**
- Go to Railway → Your Service → **Settings** → **Domains**
- Copy the Railway-provided domain (e.g., `your-app-name.up.railway.app`)
- Add `https://` prefix

**Example:**
```
NEXTAUTH_URL=https://pr1-ai-code-review-production.up.railway.app
```

---

### 2. NEXTAUTH_SECRET
**Value:** Generate a random 32-byte base64 string

**How to generate:**
Run this in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example output:**
```
NEXTAUTH_SECRET=Xk7mP9vQ2wR5tY8uI1oP3aS6dF9gH2jK4lZ7xC0vB1n=
```

---

### 3. GITHUB_CLIENT_ID
**Value:** Your GitHub OAuth App Client ID (Production)

**How to get it:**
1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name:** AI Code Review (Production)
   - **Homepage URL:** `https://YOUR_APP_NAME.up.railway.app`
   - **Authorization callback URL:** `https://YOUR_APP_NAME.up.railway.app/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**

**Example:**
```
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

---

### 4. GITHUB_CLIENT_SECRET
**Value:** Your GitHub OAuth App Client Secret (Production)

**How to get it:**
1. In the same GitHub OAuth App page
2. Click **Generate a new client secret**
3. Copy the secret (you won't see it again!)

**Example:**
```
GITHUB_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

### 5. OPENAI_API_KEY
**Value:** Your OpenAI API Key

**How to get it:**
1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Copy the key (starts with `sk-`)

**Example:**
```
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

### 6. NODE_ENV
**Value:** `production`

**Just set it to:**
```
NODE_ENV=production
```

---

### 7. DATABASE_URL
**Status:** ✅ Automatically added by Railway

**What to do:** Nothing! Railway PostgreSQL service automatically injects this.

**Format (for reference):**
```
DATABASE_URL=postgresql://postgres:password@host:5432/railway
```

---

### 8. REDIS_URL (Optional)
**Status:** ✅ Automatically added if you add Redis

**What to do:** 
- If you added Redis service: Railway auto-injects this
- If you didn't add Redis: Skip this (app will work without it)

**Format (for reference):**
```
REDIS_URL=redis://default:password@host:6379
```

---

## 📋 Quick Checklist

Copy this checklist and check off as you add each variable:

```
□ NEXTAUTH_URL = https://YOUR_APP.up.railway.app
□ NEXTAUTH_SECRET = (generated with node command)
□ GITHUB_CLIENT_ID = (from GitHub OAuth app)
□ GITHUB_CLIENT_SECRET = (from GitHub OAuth app)
□ OPENAI_API_KEY = sk-...
□ NODE_ENV = production
□ DATABASE_URL = (auto-added by Railway PostgreSQL)
□ REDIS_URL = (auto-added by Railway Redis, optional)
```

---

## 🚨 Important Notes

1. **Don't use development OAuth credentials** - Create a NEW GitHub OAuth app for production
2. **Callback URL must match exactly** - Use your Railway domain
3. **NEXTAUTH_SECRET must be secure** - Use the node command to generate it
4. **DATABASE_URL is automatic** - Don't manually set it
5. **Restart after adding variables** - Railway will automatically redeploy

---

## 🔄 After Adding Variables

1. Railway will automatically redeploy your app
2. Wait for deployment to complete
3. Check logs for any errors
4. Test your app at `https://YOUR_APP.up.railway.app`

---

## ✅ Verification

Test these features to ensure everything works:

- [ ] Homepage loads
- [ ] Click "Sign in with GitHub" → redirects to GitHub
- [ ] Authorize the app → redirects back successfully
- [ ] Create a new code review session
- [ ] AI code review works
- [ ] Real-time collaboration works

---

## 🆘 Troubleshooting

### GitHub OAuth 404 Error
- Verify `NEXTAUTH_URL` matches your Railway domain exactly
- Check GitHub OAuth callback URL is correct
- Ensure using production OAuth credentials

### App Won't Start
- Check Railway logs for errors
- Verify all required variables are set
- Ensure `DATABASE_URL` is present (from PostgreSQL service)

### AI Features Don't Work
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has credits
- Look for errors in Railway logs

---

## 📞 Need Help?

- **Railway Logs:** Railway → Your Service → Deployments → Click deployment → Logs
- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway

---

**Last Updated:** 2024
**Platform:** Railway
**Required Variables:** 6 (+ 2 automatic)
