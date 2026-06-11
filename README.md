# 🐾 REXI - Hệ Thống Quản Lý Phòng Khám Thú Y Toàn Diện

![Status](https://img.shields.io/badge/Status-Stable-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)

Hệ thống quản lý phòng khám thú y toàn diện REXI được xây dựng trên nền tảng **Spring Boot (Backend Java 21)** và **React + Vite (Frontend)**, hỗ trợ vận hành tự động quy trình phòng khám từ tiếp tân, khám lâm sàng, xét nghiệm đến kế toán thanh toán và tích hợp trợ lý ảo thông minh REXI AI.

---

## 🏗️ Cấu Trúc Dự Án Thực Chiến

Dự án được tổ chức cấu trúc khoa học và dọn dẹp sạch sẽ:

```text
.
├── 📂 Backend/              # Core API (Spring Boot Java 21)
├── 📂 Frontend/             # Giao diện Web (React + Vite + Tailwind CSS)
├── 📂 Tester/               # Bộ 16 kịch bản kiểm thử E2E tự động (Playwright)
├── 📂 documentation/        # Tài liệu báo cáo, đề cương thực tập và ảnh minh họa
│   ├── 📄 AGENTS.md                   # Quy tắc comment code thực chiến
│   ├── 📄 REXI_ELITE_ENGINEERING.md   # Cẩm nang kiến trúc và hiệu năng
│   └── 📄 VIRTUAL_LIST_REUSE_GUIDE.md # Hướng dẫn tối ưu cuộn ảo danh sách
├── 📂 scripts/              # Các script PowerShell tự động hóa vận hành
├── 📂 Archived_Resources/    # Nơi lưu trữ an toàn các file log và tài nguyên nháp
├── 📂 Database/             # Cơ sở dữ liệu gốc (SQL Server & Postgres)
├── 🐳 docker-compose.yml     # Bộ điều phối container chạy toàn hệ thống
├── 🛡️ nginx.conf            # Khiên bảo mật Reverse Proxy & Rate Limiter
└── 💻 RexiProject.code-workspace # Không gian làm việc tối ưu trên VS Code
```

---

## 💻 Hướng Dẫn Khởi Chạy Nhanh Cho Lập Trình Viên

Để mở dự án với cấu hình giao diện tối ưu nhất và tự động ẩn các file cấu hình hệ thống khỏi thanh Sidebar:
1. Mở phần mềm VS Code.
2. Nhấp đúp mở trực tiếp file [RexiProject.code-workspace](file:///d:/QLy%20Ph%C3%B2ng%20Kh%C3%A1m%20Th%C3%BA%20Y/RexiProject.code-workspace).
3. Hệ thống sẽ tự động bật các server phát triển và áp dụng giao diện mượt mà nhất.

---

## 🚀 Hướng Dẫn Triển Khai Lên Server Thực Tế (Production)

### Sử dụng Docker & Docker Compose
Yêu cầu hệ thống: Máy chủ cài sẵn **Docker** và **Docker Compose**.

```bash
# 1. Tải mã nguồn về server
git clone https://github.com/tranminh09818/phong_kham_thu_y.git
cd phong_kham_thu_y

# 2. Cấu hình biến môi trường
cp .env.example .env
nano .env # Nhập các API Key của AI và mật khẩu Database bảo mật thực tế

# 3. Khởi chạy toàn bộ hệ thống bằng 1 lệnh duy nhất
docker-compose up -d --build
```
Hệ thống sẽ tự động build, đóng gói ứng dụng, khởi tạo SQL Server & Redis, sau đó đi qua khiên bảo mật Nginx Reverse Proxy để chạy trực tiếp tại cổng HTTP `80` tiêu chuẩn.

---

## 👨‍💻 Tác giả
**Trần Minh** (FITA - VNUA)

---
*Tài liệu được bảo trì và cập nhật tự động cho chiến dịch kiểm thử thực tập.*