# Setup Guide - Avoiding Common Pitfalls

This guide helps you avoid common setup issues, especially the GitHub OAuth 404 error.

## Table of Contents
- [Environment Variables](#environment-variables)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Common Errors](#common-errors)
- [Validation Features](#validation-features)

## Environment Variables

### Critical: Replace ALL Placeholder Values

The application **will not start** if you use placeholder values from `.env.example`. The server now validates all environment variables on startup.

### Step-by-Step Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Replace each placeholder value**:

   #### Database URL
   ```env
   # ❌ WRONG - Placeholder value
   DATABASE_URL="postgresql://user:password@localhost:5432/collab_db?schema=public"
   
   # ✅ CORRECT - Real credentials
   DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/collab_db?schema=public"
   ```

   #### Redis URL
   ```env
   # ❌ WRONG - Default value (might work locally but should be verified)
   REDIS_URL="redis://localhost:6379"
   
   # ✅ CORRECT - Verified connection string
   REDIS_URL="redis://localhost:6379"  # or your Redis Cloud URL
   ```

   #### NextAuth Secret
   ```env
   # ❌ WRONG - Placeholder value
   NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
   
   # ✅ CORRECT - Generated secret
   NEXTAUTH_SECRET="Xk7mP9qR2sT4vW8yZ1aB3cD5eF7gH9jK2lM4nP6qR8sT0uV2wX4yZ6aB8cD0eF2g"
   ```
   
   Generate with: `openssl rand -base64 32`

   #### GitHub OAuth (MOST IMPORTANT)
   ```env
   # ❌ WRONG - Placeholder values (causes 404 error)
   GITHUB_ID="your-github-oauth-app-id"
   GITHUB_SECRET="your-github-oauth-app-secret"
   
   # ✅ CORRECT - Real OAuth credentials
   GITHUB_ID="Iv1.a1b2c3d4e5f6g7h8"
   GITHUB_SECRET="1234567890abcdef1234567890abcdef12345678"
   ```

   #### OpenAI API Key
   ```env
   # ❌ WRONG - Placeholder value
   OPENAI_API_KEY="sk-your-openai-api-key-here"
   
   # ✅ CORRECT - Real API key
   OPENAI_API_KEY="sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijk"
   ```

## GitHub OAuth Setup

### Creating a GitHub OAuth App

1. **Go to GitHub Developer Settings**:
   - Navigate to: https://github.com/settings/developers
   - Click "OAuth Apps" in the left sidebar
   - Click "New OAuth App"

2. **Fill in the application details**:
   ```
   Application name: Real-Time Code Collab (Local Dev)
   Homepage URL: http://localhost:3000
   Application description: (optional) Local development environment
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```

3. **Register the application**:
   - Click "Register application"
   - You'll see your **Client ID** immediately
   - Click "Generate a new client secret"
   - **IMPORTANT**: Copy the secret immediately - you won't see it again!

4. **Update your .env file**:
   ```env
   GITHUB_ID="<paste your Client ID here>"
   GITHUB_SECRET="<paste your Client Secret here>"
   ```

5. **Restart the server**:
   ```bash
   npm run dev
   ```

### Production Setup

For production, create a separate OAuth App with your production URLs:

```
Application name: Real-Time Code Collab (Production)
Homepage URL: https://yourdomain.com
Authorization callback URL: https://yourdomain.com/api/auth/callback/github
```

## Common Errors

### Error: GitHub OAuth 404

**Symptom:**
```
GET https://github.com/login/oauth/authorize?client_id=your-github-oauth-app-id... 404 (Not Found)
```

**Cause:**
The `.env` file contains placeholder values instead of real GitHub OAuth credentials.

**Solution:**
1. Create a GitHub OAuth App (see above)
2. Copy the real Client ID and Client Secret to `.env`
3. Restart the server

### Error: Environment Validation Failed

**Symptom:**
```
❌ ENVIRONMENT CONFIGURATION ERROR
================================================================================
Environment variable GITHUB_ID contains a placeholder value: "your-github-oauth-app-id"
Please replace it with a real value in your .env file.
```

**Cause:**
The server detected placeholder values in your environment variables.

**Solution:**
Follow the setup instructions above to replace all placeholder values with real credentials.

### Error: Missing Environment Variable

**Symptom:**
```
Missing required environment variable: GITHUB_ID
Please set this in your .env file. See .env.example for reference.
```

**Cause:**
A required environment variable is not set in your `.env` file.

**Solution:**
1. Ensure `.env` file exists in the project root
2. Add the missing variable with a real value
3. Restart the server

## Validation Features

The application now includes several validation features to prevent configuration errors:

### 1. Startup Validation

The server validates all environment variables before starting:

```typescript
// In server.ts
try {
  console.log('🔍 Validating environment variables...');
  validateEnv();
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
```

### 2. GitHub OAuth Validation

The auth configuration validates GitHub credentials at module load time:

```typescript
// In lib/auth.ts
function validateGitHubCredentials() {
  const githubId = process.env.GITHUB_ID;
  const githubSecret = process.env.GITHUB_SECRET;

  if (!githubId || !githubSecret) {
    throw new Error('GitHub OAuth credentials are missing...');
  }

  // Check for placeholder values
  const placeholders = ['your-github-oauth-app-id', 'your-github-oauth-app-secret'];
  if (placeholders.some(p => githubId.includes(p) || githubSecret.includes(p))) {
    throw new Error('GitHub OAuth credentials contain placeholder values...');
  }

  return { githubId, githubSecret };
}
```

### 3. Detailed Error Messages

When validation fails, you'll see clear error messages with:
- Which variable is invalid
- Why it's invalid (missing or placeholder)
- Where to get the correct value
- How to fix the issue

### 4. Enhanced Error Page

The authentication error page now provides detailed information about OAuth failures:
- Clear error titles and descriptions
- Specific error codes
- Troubleshooting tips
- Links to relevant documentation

## Best Practices

### 1. Never Commit .env Files

Add `.env` to `.gitignore` (already done in this project):
```gitignore
.env
.env.local
.env.*.local
```

### 2. Use Different Credentials for Different Environments

- **Development**: Use a separate GitHub OAuth App for `localhost:3000`
- **Staging**: Use a separate OAuth App for your staging URL
- **Production**: Use a separate OAuth App for your production URL

### 3. Rotate Secrets Regularly

- Regenerate `NEXTAUTH_SECRET` periodically
- Rotate API keys if they're exposed
- Update OAuth secrets if compromised

### 4. Verify Setup Before Deploying

Before deploying to production:
1. ✅ All environment variables are set
2. ✅ No placeholder values remain
3. ✅ OAuth callback URLs match your domain
4. ✅ Database and Redis are accessible
5. ✅ API keys have sufficient credits/quota

## Testing Your Setup

### 1. Start the Server

```bash
npm run dev
```

You should see:
```
🔍 Validating environment variables...
✅ Environment variables validated successfully
> Ready on http://localhost:3000
> Socket.io server running on ws://localhost:3000
```

### 2. Test Authentication

1. Navigate to http://localhost:3000
2. Click "Sign in with GitHub"
3. You should be redirected to GitHub (not see a 404)
4. Authorize the application
5. You should be redirected back and signed in

### 3. Check Logs

In development mode, you'll see detailed logs:
```
✅ User signed in: user@example.com
New user created: user@example.com
```

## Getting Help

If you're still experiencing issues:

1. **Check the server logs** - They now include detailed error messages
2. **Verify your .env file** - Ensure no placeholder values remain
3. **Test your credentials** - Try accessing GitHub OAuth manually
4. **Check the documentation** - See README.md and other docs/ files
5. **Review the error page** - It provides specific troubleshooting tips

## Summary Checklist

Before starting the server, ensure:

- [ ] `.env` file exists in project root
- [ ] All placeholder values are replaced with real credentials
- [ ] GitHub OAuth App is created with correct callback URL
- [ ] `GITHUB_ID` and `GITHUB_SECRET` are from your OAuth App
- [ ] `NEXTAUTH_SECRET` is generated with `openssl rand -base64 32`
- [ ] `OPENAI_API_KEY` is a valid API key with billing enabled
- [ ] Database and Redis are running and accessible
- [ ] Server starts without validation errors

If all items are checked, your setup is complete! 🎉
