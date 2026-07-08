param(
    [switch]$SkipVercel = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "REXI - AUTO DEPLOY (push + Vercel)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Push to GitHub (triggers Render auto-deploy)
Write-Host "[1/3] Pushing to GitHub (triggers Render auto-deploy)..." -ForegroundColor Yellow

git add .
git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin master

Write-Host "  -> GitHub push complete`n" -ForegroundColor Green

# Step 2: Deploy Vercel
if (-not $SkipVercel) {
    Write-Host "[2/3] Deploying Vercel Frontend..." -ForegroundColor Yellow
    
    $env:VITE_API_URL = 'https://phong-kham-thu-y.onrender.com'
    $env:VITE_GOOGLE_CLIENT_ID = '334761445329-iog83fgqrdlo0iavo68pkv17modc85du.apps.googleusercontent.com'
    
    Set-Location 'Frontend'
    $vercelOutput = npx vercel deploy --prod --yes --no-wait 2>&1
    Set-Location '..'
    
    Write-Host "  -> Vercel deployment output:`n" -ForegroundColor Gray
    Write-Host $vercelOutput
} else {
    Write-Host "[2/3] Skipping Vercel deployment`n" -ForegroundColor Gray
}

# Step 3: Summary
Write-Host "[3/3] DEPLOY SUMMARY`n" -ForegroundColor Cyan
Write-Host "  Render Backend : https://phong-kham-thu-y.onrender.com" -ForegroundColor White
Write-Host "  Vercel Frontend: https://rexi-vet-clinic.vercel.app`n" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
