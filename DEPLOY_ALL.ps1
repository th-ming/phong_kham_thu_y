# Auto deploy script for Rexi Veterinary System
# This script will:
# 1. Push code to GitHub (triggers Render auto-deploy)
# 2. Deploy Vercel via CLI with env vars

param(
    [switch]$SkipGit = $false,
    [switch]$SkipVercel = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "REXI VETERINARY - AUTO DEPLOY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Push to GitHub (triggers Render auto-deploy)
if (-not $SkipGit) {
    Write-Host "[1/3] Pushing code to GitHub (triggers Render auto-deploy)..." -ForegroundColor Yellow
    
    git add .
    git commit -m "chore: deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git push origin master
    
    Write-Host "  -> GitHub push complete`n" -ForegroundColor Green
} else {
    Write-Host "[1/3] Skipping Git push`n" -ForegroundColor Gray
}

# Step 2: Deploy Vercel
if (-not $SkipVercel) {
    Write-Host "[2/3] Deploying Vercel Frontend..." -ForegroundColor Yellow
    
    $env:VITE_API_URL = 'https://phong-kham-thu-y.onrender.com'
    $env:VITE_GOOGLE_CLIENT_ID = '334761445329-iog83fgqrdlo0iavo68pkv17modc85du.apps.googleusercontent.com'
    
    Set-Location 'Frontend'
    npx vercel --prod --yes
    Set-Location '..'
    
    Write-Host "  -> Vercel deployment complete`n" -ForegroundColor Green
} else {
    Write-Host "[2/3] Skipping Vercel deployment`n" -ForegroundColor Gray
}

# Step 3: Summary
Write-Host "[3/3] DEPLOY SUMMARY`n" -ForegroundColor Cyan
Write-Host "  Render Backend : https://phong-kham-thu-y.onrender.com" -ForegroundColor White
Write-Host "  Vercel Frontend: https://rexi-vet-clinic.vercel.app`n" -ForegroundColor White
Write-Host "NOTE: If Render fails, manually set env vars at:" -ForegroundColor Yellow
Write-Host "  https://dashboard.render.com/web/rexi-backend/env`n" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan
