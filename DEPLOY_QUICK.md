# DEPLOY NHANH - REIXI

## Render (Backend)

1. Vào Render Dashboard -> rexi-backend -> Environment
2. Copy các bi?n du?i dây và thêm vào:

SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host>:<port>/<db>?sslmode=require
DB_USERNAME=<user>
DB_PASSWORD=<pass>
JWT_SECRET=<32+ ky tu ngau nhien>
CORS_ALLOWED_ORIGINS=https://<ten-mien-vercel>.vercel.app
APP_FRONTEND_URL=https://<ten-mien-vercel>.vercel.app
COOKIE_SECURE=true
MAIL_USERNAME=rexivetsys@gmail.com
MAIL_PASSWORD=<app-password-gmail>
WEBHOOK_SECRET=<random-long-string>
VNPAY_TMN_CODE=***REMOVED***-VNPAY_TMN_CODE
VNPAY_HASH_SECRET=<hash-secret-cua-ban>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://<ten-mien-vercel>.vercel.app/khach-hang/hoa-don-thanh-toan
VNPAY_IPN_URL=https://<ten-mien-backend>.onrender.com/api/payment/vnpay/ipn
VIETQR_BANK_ID=MB
VIETQR_ACCOUNT_NO=***REMOVED***
VIETQR_ACCOUNT_NAME=***REMOVED***
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=

## Vercel (Frontend)

1. Vào Vercel Dashboard -> Project -> Settings -> Environment Variables
2. Thêm:

VITE_API_URL=https://<ten-mien-backend>.onrender.com
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>

3. Redeploy

## Push tu dong deploy

- Render: auto deploy khi push len master (da config trong render.yaml)
- Vercel: auto deploy khi push len master

Khi push code len GitHub -> ca 2 platform se tu dong build va deploy.
