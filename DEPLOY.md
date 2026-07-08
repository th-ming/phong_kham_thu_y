# DEPLOY GUIDE - REXI Phòng Khám Thú Y

## Mục Lục
1. [Render - Backend](#render---backend)
2. [Vercel - Frontend](#vercel---frontend)
3. [Database - PostgreSQL](#database---postgresql)
4. [Kiểm Tra Sau Khi Deploy](#kiểm-tra-sau-khi-deploy)

---

## Render - Backend

### Bước 1: Tạo Web Service trên Render
1. Vào [Render Dashboard](https://dashboard.render.com/)
2. Chọn **New +** → **Web Service**
3. Connect repo: `tranminh09818/phong_kham_thu_y`
4. Cấu hình:
   - **Name**: `rexi-backend` (hoặc tên bạn muốn)
   - **Region**: Singapore (gần VN nhất)
   - **Branch**: `master`
   - **Root Directory**: `Backend`
   - **Runtime**: `Docker`
   - **Plan**: `Free`

### Bước 2: Thêm Environment Variables
Vào tab **Environment** và thêm các biến sau:

#### BẮT BUỘC (nếu thiếu app sẽ crash)
| Variable | Value | Note |
|----------|-------|------|
| `SPRING_PROFILES_ACTIVE` | `prod` | |
| `DB_URL` | `***REMOVED***-DB_URL` | PostgreSQL JDBC URL từ Render/Supabase |
| `DB_USERNAME` | `<username>` | |
| `DB_PASSWORD` | `<password>` | |
| `JWT_SECRET` | `<32+ ký tự ngẫu nhiên>` | **BẮT BUỘC >= 32 ký tự** |
| `CORS_ALLOWED_ORIGINS` | `https://<ten-mien-vercel-cua-ban>.vercel.app` | Domain Vercel frontend |
| `APP_FRONTEND_URL` | `https://<ten-mien-vercel-cua-ban>.vercel.app` | |

#### BẢO MẬT & THANH TOÁN
| Variable | Value | Note |
|----------|-------|------|
| `COOKIE_SECURE` | `true` | Cookie chỉ gửi qua HTTPS |
| `WEBHOOK_SECRET` | `<chuỗi bí mật dài>` | Xác thực webhook thanh toán |
| `MAIL_USERNAME` | `rexivetsys@gmail.com` | |
| `MAIL_PASSWORD` | `<mật khẩu ứng dụng Gmail>` | Dùng App Password, không phải password thường |
| `VNPAY_TMN_CODE` | `***REMOVED***-VNPAY_TMN_CODE` | |
| `VNPAY_HASH_SECRET` | `<bí mật VNPay>` | |
| `VNPAY_URL` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` | |
| `VNPAY_RETURN_URL` | `https://<ten-mien-vercel-cua-ban>.vercel.app/khach-hang/hoa-don-thanh-toan` | |
| `VIETQR_BANK_ID` | `MB` | |
| `VIETQR_ACCOUNT_NO` | `***REMOVED***` | |
| `VIETQR_ACCOUNT_NAME` | `***REMOVED***` | |

#### AI API KEYS (Tùy chọn - có thể nhập sau)
| Variable | Value | Note |
|----------|-------|------|
| `GROQ_API_KEY` | `<Groq API key>` | |
| `GEMINI_API_KEY` | `<Gemini API key>` | |
| `OPENROUTER_API_KEY` | `<OpenRouter API key>` | |

### Bước 3: Health Check
Render sẽ tự động kiểm tra: `https://<ten-mien-backend>.onrender.com/api/system/health`

Nếu trả về `200 OK` → Deploy thành công.

---

## Vercel - Frontend

### Bước 1: Import Project
1. Vào [Vercel Dashboard](https://vercel.com/)
2. **Add New...** → **Project**
3. Import `tranminh09818/phong_kham_thu_y`
4. Cấu hình:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `Frontend/` (nếu được hỏi)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Bước 2: Environment Variables
Vào **Project Settings** → **Environment Variables** → thêm:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://<ten-mien-backend>.onrender.com` | Production, Preview |
| `VITE_GOOGLE_CLIENT_ID` | `<Google OAuth Client ID>` | Production, Preview |

> **Lưu ý**: Biến `VITE_*` phải được set **trước khi build**. Sau khi thêm xong, nhấn **Redeploy**.

### Bước 3: Rewrites (nếu cần)
`vercel.json` ở root đã có sẵn config proxy `/api` và `/ws` về backend. Nếu Vercel không đọc được `vercel.json` root, hãy đảm bảo:
- **Project Settings** → **General** → **Root Directory** nên để trống hoặc là `.` để Vercel đọc file root.

---

## Database - PostgreSQL

### Lựa chọn 1: Render PostgreSQL (Khuyến nghị cho deploy trên Render)
1. Render Dashboard → **New +** → **PostgreSQL**
2. Tạo DB mới (Plan Free)
3. Lấy **Connection String** (Internal URL)
4. Điền vào `DB_URL` trên Render backend:
   ```
   ***REMOVED***-DB_URL
   ```

### Lựa chọn 2: Supabase
1. Tạo project trên [Supabase](https://supabase.com/)
2. Lấy **Connection String** (pooler mode hoặc direct)
3. Điền vào `DB_URL`

### Chú ý quan trọng về Data:
- Backend hiện đang dùng **SQL Server** schema (`Database/PhongKhamThuY.sql`)
- Khi chuyển sang **Render + PostgreSQL**, bạn **CẦN** chuyển schema sang PostgreSQL.
- Hoặc nếu muốn giữ nguyên:
  - Dùng Supabase cung cấp managed PostgreSQL
  - Import lại schema thủ công

> **Nếu chưa chuyển DB sang PostgreSQL, backend sẽ không khởi động được trên Render.**

---

## Kiểm Tra Sau Khi Deploy

### Backend (Render)
```bash
# Health check
curl https://<ten-mien-backend>.onrender.com/api/system/health

# Test đăng nhập (nếu có data)
curl -X POST https://<ten-mien-backend>.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rexi.vn","password":"<password>"}'
```

### Frontend (Vercel)
```bash
# Kiểm tra frontend load được
curl https://<ten-mien-frontend>.vercel.app/

# Kiểm tra API proxy hoạt động
curl https://<ten-mien-frontend>.vercel.app/api/system/health
# Phải trả về kết quả từ backend (qua Vercel rewrite)
```

### CORS Check
Nếu browser báo lỗi CORS:
- Đảm bảo `CORS_ALLOWED_ORIGINS` trên Render **đúng domain Vercel**
- Đảm bảo `APP_FRONTEND_URL` trên Render **đúng domain Vercel**

---

## Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Cách fix |
|------|-------------|----------|
| Backend health check fail | Thiếu `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Thêm đủ env vars vào Render |
| Frontend báo 404 API | `VITE_API_URL` chưa set trên Vercel | Thêm env vars + Redeploy |
| Lỗi CORS | Domain Vercel chưa có trong `CORS_ALLOWED_ORIGINS` | Thêm domain Vercel vào Render env |
| Frontend 404 icon PWA | Đã fix, cần push code mới + redeploy | Đã fix trong commit `fd281134` |
| Backend không connect DB | Chưa chuyển schema sang PostgreSQL | Dùng Supabase hoặc migrate schema |

---

## Liên Hệ
- **Tác giả**: Trần Minh (FITA - VNUA)
- **Repo**: https://github.com/tranminh09818/phong_kham_thu_y
