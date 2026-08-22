# REXI - Hệ Thống Quản Lý Phòng Khám Thú Y

![Status](https://img.shields.io/badge/Status-Stable-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-green?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue?style=for-the-badge)

Hệ thống quản lý phòng khám thú y toàn diện REXI được xây dựng trên nền tảng **Spring Boot 3.4 (Backend Java 21)** và **React 18 + Vite 5 + TypeScript (Frontend)**, hỗ trợ vận hành tự động quy trình phòng khám từ tiếp tân, khám lâm sàng, xét nghiệm, kế toán thanh toán và tích hợp trợ lý ảo thông minh **REXI AI** với công nghệ RAG (Retrieval-Augmented Generation).

---

## Tính Năng Nổi Bật

| Lĩnh Vực | Tính Năng |
|----------|-----------|
| **Tiếp Tân** | Đăng ký khách hàng, đặt lịch hẹn nhanh, quản lý khách vãng lai |
| **Bác Sĩ** | Hồ sơ bệnh án, đơn thuốc, xét nghiệm, châm cứu, tư vấn |
| **Kế Toán** | Hóa đơn, thanh toán VNPay/VietQR, báo cáo tài chính |
| **Quản Lý** | Nhân sự, lịch trực, dịch vụ, thuốc, hệ thống thông báo |
| **REXI AI** | Chatbot thông minh, trợ lý ảo với RAG tri thức thú y, gợi ý lịch hẹn |
| **Bảo Mật** | JWT, RBAC, Rate Limiting, Action Auth Filter, Cookie Secure |
| **Thanh Toán** | VNPay sandbox, VietQR, hỗ trợ thanh toán trực tuyến |
| **Triển Khai** | Docker Compose, Nginx Reverse Proxy, Render (backend), Vercel (frontend) |

---

## Công Nghệ Sử Dụng

### Backend
- **Java 21** + **Spring Boot 3.4** (JPA, Security, WebSocket, Mail, Validation)
- **JWT Authentication** với Role-Based Access Control (RBAC)
- **AI Integration**: Groq (Llama 3.3), Gemini 2.0 Flash, OpenRouter (DeepSeek)
- **RAG Engine**: EmbeddingService + VectorKnowledgeService + KnowledgeIndexer (80+ tài liệu thú y)
- **Database**: SQL Server (local), PostgreSQL/Supabase (prod)
- **Caching**: Redis (Docker), Bucket4j Rate Limiting
- **Payment**: VNPay sandbox, VietQR
- **API Docs**: SpringDoc OpenAPI (Swagger UI)

### Frontend
- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3.4** (utility-first styling)
- **React Router 6** (SPA routing)
- **Chart.js** + **react-chartjs-2** (biểu đồ, thống kê)
- **GSAP** + **Lottie** (animation, hiệu ứng)
- **WebSocket** (STOMP) + **SockJS** (chat trực tuyến)
- **Playwright** (E2E testing - 16 kịch bản kiểm thử)
- **PWA** (vite-plugin-pwa)

### Cơ Sở Hạ Tầng
- **Docker Compose**: SQL Server + Backend + Frontend + Redis + Nginx
- **Nginx**: Reverse Proxy, Rate Limiter, Gzip Compression
- **Render.com**: Backend deploy (free tier)
- **Vercel**: Frontend deploy (free tier)

---

## Cấu Trúc Dự Án

```
.
├── Backend/                    # Core API (Spring Boot Java 21)
│   ├── src/main/java/com/rexi/pkty/
│   │   ├── controller/         # 20 REST Controllers
│   │   ├── service/            # Business logic + AI services
│   │   ├── entity/             # JPA Entities (27 entities)
│   │   ├── repository/         # Spring Data Repositories
│   │   ├── security/           # JWT, Rate Limit, RBAC
│   │   └── config/             # Swagger, WebSocket, CORS
│   └── src/main/resources/knowledge/  # 80+ tài liệu thú y (RAG)
├── Frontend/                   # Giao diện Web (React + Vite + Tailwind)
│   └── src/
├── Tester/                     # 16 kịch bản kiểm thử E2E (Playwright)
├── Database/                   # SQL Server & Postgres scripts
├── scripts/                    # PowerShell tự động hóa
├── Documentation/              # Báo cáo, tài liệu
├── skills/                     # Codebuff AI skills
├── docker-compose.yml          # Bộ điều phối container
├── nginx.conf                  # Reverse Proxy & Rate Limiter
└── RexiProject.code-workspace  # Không gian làm việc VS Code
```

---

## Hướng Dẫn Khởi Chạy Nhanh

### Yêu Cầu
- **JDK 21+** (`java -version` kiểm tra)
- **Node.js 18+** (`node -version` kiểm tra)
- **SQL Server Express** (cho local) hoặc **PostgreSQL/Supabase** (cho prod)

### Khởi Chạy Local

```bash
# 1. Clone repository
git clone https://github.com/th-ming/phong_kham_thu_y.git
cd phong_kham_thu_y

# 2. Khởi chạy Backend (port 8081)
#    - Chạy trực tiếp:
cd Backend && mvnw.cmd spring-boot:run

#    - Hoặc dùng script (tự động cấu hình env):
.\scripts\start_backend_dev.ps1

#    - Chế độ tiết kiệm RAM (512MB):
.\scripts\start_backend_low_ram.ps1

# 3. Khởi chạy Frontend (port 3005)
cd Frontend && npm install && npm run dev
```

### Mở Dự Án Với VS Code
1. Mở phần mềm VS Code
2. Nhấp đúp mở trực tiếp file `RexiProject.code-workspace`
3. Hệ thống sẽ tự động áp dụng giao diện và cấu hình tối ưu

### Kiểm Tra Hoạt Động
- **Backend**: http://localhost:8081/api/system/health
- **Frontend**: http://localhost:3005
- **Swagger UI**: http://localhost:8081/swagger-ui/index.html (chỉ trong profile dev)

---

## Triển Khai Lên Server (Production)

### Docker & Docker Compose

Hệ thống hỗ trợ chạy toàn bộ môi trường (SQL Server, Redis, Java Backend, React Frontend và Nginx Reverse Proxy) hoàn toàn tự động chỉ với một câu lệnh. Đặc biệt, cơ sở dữ liệu SQL Server sẽ tự động được khởi tạo cấu trúc bảng (schema) từ tệp `Database/PhongKhamThuY.sql` nhờ dịch vụ tự khởi chạy tích hợp sẵn.

```bash
# 1. Sao chép dự án và truy cập thư mục
git clone https://github.com/th-ming/phong_kham_thu_y.git
cd phong_kham_thu_y

# 2. Tạo tệp .env cấu hình môi trường chạy Docker
# (Có thể copy từ .env.example rồi chỉnh sửa)
cp .env.example .env

# Lưu ý cập nhật các biến quan trọng trong .env:
# - DB_PASSWORD: Mật khẩu sa cho SQL Server container
# - JWT_SECRET: Khóa ký bảo mật JWT (>= 32 ký tự)
# - VNPAY_RETURN_URL: Điều hướng về http://localhost/khach-hang/hoa-don-thanh-toan khi đi qua cổng Nginx 80

# 3. Khởi chạy hệ thống bằng Docker Compose
docker-compose up -d --build
```

Hệ thống sẽ tự động điều phối:
1. Khởi động **SQL Server** và kiểm tra trạng thái hoạt động.
2. Dịch vụ **sqlserver-init** tự động nạp cấu trúc cơ sở dữ liệu `PhongKhamThuY.sql`.
3. Build mã nguồn và khởi động **Backend (Spring Boot)** và **Frontend (React Nginx)**.
4. Mở cổng **Nginx Reverse Proxy** tại port `80` tiếp nhận mọi request.

*Truy cập hệ thống tại:* `http://localhost` (Port 80 mặc định).

### Triển Khai Riêng Lẻ

| Dịch Vụ | Platform | Cấu Hình |
|---------|----------|----------|
| **Backend** | Render.com | Docker, free tier, health check: `/api/system/health` |
| **Frontend** | Vercel | Static build, auto deploy từ GitHub |
| **Database** | Supabase | PostgreSQL managed, free tier |

---

## Cấu Hình Môi Trường

File `.env` (Backend) - các biến quan trọng:

| Biến | Mô Tả | Mặc Định |
|------|-------|----------|
| `DB_URL` | JDBC URL | `jdbc:sqlserver://...SQLEXPRESS;databaseName=PhongKhamThuY` |
| `DB_USERNAME` | Tên đăng nhập DB | `sa` |
| `DB_PASSWORD` | Mật khẩu DB | (cần thiết) |
| `JWT_SECRET` | Bí mật JWT | (cần thiết, >= 32 ký tự) |
| `GROQ_API_KEY` | API Key Groq AI | (tùy chọn) |
| `GEMINI_API_KEY` | API Key Google Gemini | (tùy chọn) |
| `OPENROUTER_API_KEY` | API Key OpenRouter | (tùy chọn) |
| `SPRING_PROFILES_ACTIVE` | Profile: `local`, `dev`, `prod` | `local` |
| `CORS_ALLOWED_ORIGINS` | Domain được phép truy cập | `http://localhost:3000,...` |
| `MAIL_USERNAME` | Email SMTP username | (tùy chọn) |
| `MAIL_PASSWORD` | Email SMTP password | (tùy chọn) |

---

## Các Script Hướng Dẫn

| Script | Mô Tả |
|--------|-------|
| `scripts/start_backend_dev.ps1` | Chế độ dev: auto-restart khi sửa code |
| `scripts/start_backend_low_ram.ps1` | Chế độ tiết kiệm RAM (512MB) |
| `scripts/start_backend_supabase_low_ram.ps1` | Kết nối Supabase + tiết kiệm RAM |
| `scripts/start_frontend_low_ram.cmd` | Frontend chế độ tiết kiệm RAM |
| `scripts/ensure_backend_dev_running.ps1` | Tự động khởi chạy backend nếu chưa chạy |

---

## Bộ Kiểm Thử E2E

Dự án có **16 kịch bản kiểm thử Playwright** bao phủ toàn bộ chức năng:

1. Đăng nhập và đăng ký
2. Quản lý khách hàng thú cưng
3. Khách đặt lịch hẹn
4. Lịch trình và lịch trực
5. Nghĩa vụ lâm sàng bác sĩ
6. Lâm sàng và xét nghiệm
7. Hồ sơ bệnh án
8. Quản lý dịch vụ và thuốc
9. Kế toán và thanh toán
10. Thanh toán khách hàng
11. Dashboard admin
12. Quản lý nhân sự
13. Báo cáo và cấu hình
14. Chatbot AI
15. Chatbot thông minh
16. Siêu Agent 150 trường hợp

```bash
# Chạy kiểm thử
cd Tester && npx playwright test
```

---

## Tác Giả

**Trần Minh** (FITA - VNUA)

---

*Tài liệu được bảo trì và cập nhật tự động.*
