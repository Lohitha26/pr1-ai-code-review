# ✅ Deployment Checklist - Quick Reference

Use this checklist to ensure you complete all deployment steps.

## 📦 Pre-Deployment

- [ ] All code committed to Git
- [ ] `.env` file is in `.gitignore`
- [ ] No sensitive data in code
- [ ] `Dockerfile` exists
- [ ] `.dockerignore` exists
- [ ] `railway.json` exists
- [ ] `next.config.js` has `output: 'standalone'`

## 🐙 GitHub Setup

- [ ] Created new GitHub repository
- [ ] Repository name: `_______________`
- [ ] Pushed code to GitHub
- [ ] Repository is accessible

## 🚂 Railway Setup

### Account
- [ ] Signed up at railway.app
- [ ] Connected GitHub account
- [ ] (Optional) Added payment method

### PostgreSQL
- [ ] Provisioned PostgreSQL database
- [ ] Copied `DATABASE_URL`
- [ ] Saved URL: `_______________`

### Redis
- [ ] Added Redis to project
- [ ] Copied `REDIS_URL`
- [ ] Saved URL: `_______________`

### Application
- [ ] Connected GitHub repository
- [ ] Railway detected Dockerfile
- [ ] Generated domain
- [ ] App URL: `_______________`

## 🔐 Environment Variables

Add these in Railway → Variables:

- [ ] `DATABASE_URL` = `postgresql://...`
- [ ] `REDIS_URL` = `redis://...`
- [ ] `NEXTAUTH_URL` = `https://your-app.up.railway.app`
- [ ] `NEXTAUTH_SECRET` = (generated with PowerShell)
- [ ] `GITHUB_ID` = (from GitHub OAuth app)
- [ ] `GITHUB_SECRET` = (from GitHub OAuth app)
- [ ] `OPENAI_API_KEY` = `sk-...`
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`

## 🔑 GitHub OAuth

- [ ] Created OAuth App at github.com/settings/developers
- [ ] App name: `_______________`
- [ ] Homepage URL: `https://your-app.up.railway.app`
- [ ] Callback URL: `https://your-app.up.railway.app/api/auth/callback/github`
- [ ] Copied Client ID
- [ ] Generated and copied Client Secret
- [ ] Updated Railway variables

## 🗄️ Database Migrations

Choose one method:

### Option A: Railway CLI
- [ ] Installed Railway CLI: `npm install -g @railway/cli`
- [ ] Logged in: `railway login`
- [ ] Linked project: `railway link`
- [ ] Ran migrations: `railway run npx prisma migrate deploy`

### Option B: Local Terminal
- [ ] Set DATABASE_URL environment variable
- [ ] Ran: `npx prisma migrate deploy`
- [ ] Ran: `npx prisma generate`

## 🧪 Testing

- [ ] Deployment shows "Success" in Railway
- [ ] App URL loads successfully
- [ ] Can sign in with GitHub
- [ ] Can create new session
- [ ] Real-time editing works (test in 2 tabs)
- [ ] Live cursors visible
- [ ] Chat works
- [ ] AI review works

## 🔍 Verification

- [ ] Check Railway logs for errors
- [ ] Test all features thoroughly
- [ ] Verify database connections
- [ ] Verify Redis connections
- [ ] Check Socket.io connections

## 📊 Post-Deployment

- [ ] Set up Railway notifications
- [ ] Monitor resource usage
- [ ] Check OpenAI usage/costs
- [ ] (Optional) Add custom domain
- [ ] (Optional) Set up error tracking (Sentry)
- [ ] (Optional) Set up uptime monitoring

## 🎉 Launch

- [ ] All features working
- [ ] No errors in logs
- [ ] Shared app URL with team/users
- [ ] Documented any issues

---

## 📝 Important URLs

**GitHub Repository**: `_______________`

**Railway Project**: `_______________`

**App URL**: `_______________`

**GitHub OAuth App**: https://github.com/settings/developers

**Railway Dashboard**: https://railway.app/dashboard

---

## 🆘 Quick Troubleshooting

### Build fails?
```powershell
Remove-Item -Recurse -Force node_modules
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### Database error?
- Check DATABASE_URL is correct
- Verify migrations ran: `railway run npx prisma migrate deploy`

### GitHub OAuth error?
- Verify NEXTAUTH_URL matches Railway domain
- Check callback URL in GitHub OAuth app
- Ensure GITHUB_ID and GITHUB_SECRET are correct

### Socket.io not working?
- Check Railway logs
- Verify port 3000 is exposed
- Ensure WebSocket connections are allowed

---

**Pro Tip**: Keep this checklist handy for future deployments!
