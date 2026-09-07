# Script to help set up environment variables for Render + Vercel
# This does NOT upload automatically - it just prints the commands to copy

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RENDER ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to: https://dashboard.render.com/web/<your-service>/env" -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy and paste these:"
Write-Host ""
Write-Host "SPRING_PROFILES_ACTIVE=prod"
Write-Host "DB_URL=jdbc:postgresql://<host>:<port>/<db>?sslmode=require"
Write-Host "DB_USERNAME=<user>"
Write-Host "DB_PASSWORD=<pass>"
Write-Host "JWT_SECRET=... (32+ chars)"
Write-Host "CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app"
Write-Host "APP_FRONTEND_URL=https://<your-vercel-domain>.vercel.app"
Write-Host "COOKIE_SECURE=true"
Write-Host "MAIL_USERNAME=rexivetsys@gmail.com"
Write-Host "MAIL_PASSWORD=<app-password>"
Write-Host "WEBHOOK_SECRET=<random-long-string>"
Write-Host "VNPAY_TMN_CODE=***REMOVED***-VNPAY_TMN_CODE"
Write-Host "VNPAY_HASH_SECRET=<your-secret>"
Write-Host "VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
Write-Host "VNPAY_RETURN_URL=https://<your-vercel-domain>.vercel.app/khach-hang/hoa-don-thanh-toan"
Write-Host "VNPAY_IPN_URL=https://<your-render-backend>.onrender.com/api/payment/vnpay/ipn"
Write-Host "VIETQR_BANK_ID=<your-bank-id>"
Write-Host "VIETQR_ACCOUNT_NO=<your-account-no>"
Write-Host "VIETQR_ACCOUNT_NAME=<your-account-name>"
Write-Host "GROQ_API_KEY="
Write-Host "GEMINI_API_KEY="
Write-Host "OPENROUTER_API_KEY="
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to: Vercel Dashboard -> Project -> Settings -> Environment Variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy and paste these:"
Write-Host ""
Write-Host "VITE_API_URL=https://<your-render-backend>.onrender.com"
Write-Host "VITE_GOOGLE_CLIENT_ID=334761445329-iog83fgqrdlo0iavo68pkv17modc85du.apps.googleusercontent.com"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "After setting all env vars, just push code to GitHub -> auto deploy!" -ForegroundColor Green
