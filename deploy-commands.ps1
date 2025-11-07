# ═══════════════════════════════════════════════════════════════
# AI Code Review - Deployment Commands for Railway
# ═══════════════════════════════════════════════════════════════
# 
# This script contains all the commands you need to deploy.
# Copy and paste each command one by one into PowerShell.
# 
# ═══════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  AI CODE REVIEW - DEPLOYMENT COMMANDS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Navigate to Project Directory" -ForegroundColor Yellow
Write-Host 'cd "c:\Users\lohit\OneDrive\Desktop\Projects\AI Code Review"' -ForegroundColor Green
Write-Host ""

Write-Host "STEP 2: Initialize Git Repository" -ForegroundColor Yellow
Write-Host "git init" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 3: Configure Git (Replace with your info)" -ForegroundColor Yellow
Write-Host 'git config user.name "Your Name"' -ForegroundColor Green
Write-Host 'git config user.email "your.email@example.com"' -ForegroundColor Green
Write-Host ""

Write-Host "STEP 4: Add All Files" -ForegroundColor Yellow
Write-Host "git add ." -ForegroundColor Green
Write-Host ""

Write-Host "STEP 5: Create Initial Commit" -ForegroundColor Yellow
Write-Host 'git commit -m "Initial commit: AI Code Review application"' -ForegroundColor Green
Write-Host ""

Write-Host "STEP 6: Connect to GitHub (Replace YOUR_USERNAME and YOUR_REPO)" -ForegroundColor Yellow
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Green
Write-Host "git branch -M main" -ForegroundColor Green
Write-Host "git push -u origin main" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 7: Generate NEXTAUTH_SECRET" -ForegroundColor Yellow
Write-Host "node -e `"console.log(require('crypto').randomBytes(32).toString('base64'))`"" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NEXT STEPS:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create GitHub repository at: https://github.com/new" -ForegroundColor White
Write-Host "2. Run the commands above in order" -ForegroundColor White
Write-Host "3. Go to Railway: https://railway.app" -ForegroundColor White
Write-Host "4. Deploy from GitHub repo" -ForegroundColor White
Write-Host "5. Add PostgreSQL database" -ForegroundColor White
Write-Host "6. Configure environment variables" -ForegroundColor White
Write-Host "7. Set up GitHub OAuth for production" -ForegroundColor White
Write-Host ""
Write-Host "See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions!" -ForegroundColor Green
Write-Host ""
