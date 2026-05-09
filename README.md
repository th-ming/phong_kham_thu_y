# 🐾 REXI - Veterinary Management System

![Status](https://img.shields.io/badge/Status-Stable-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Hệ thống quản lý phòng khám thú y toàn diện được xây dựng trên nền tảng Spring Boot và React.

---

## 🏗️ Cấu Trúc Dự Án

```text
.
├── 📂 Backend/         # Core API (Spring Boot)
├── 📂 Frontend/        # Web Interface (React + Vite)
├── 📂 scripts/         # Automation Scripts
├── 📄 PhongKhamThuY.sql # Database Schema & Data
├── 🐳 docker-compose.yml # Docker Orchestration
└── 🛡️ nginx.conf       # Reverse Proxy Config
```

---

## 🚀 Hướng Dẫn Triển Khai (Deployment)

### 1. Sử dụng Docker
Yêu cầu: Docker Desktop / Docker Engine.

```bash
# Clone repository
git clone https://github.com/tranminh09818/phong_kham_thu_y.git
cd phong_kham_thu_y

# Khởi chạy hệ thống
docker-compose up -d
```
Hệ thống sẽ tự động cấu hình SQL Server và khởi chạy ứng dụng tại: `http://localhost`.

### 2. Cấu hình môi trường
Các thông số kết nối được định nghĩa trong file `.env.example`. Sao chép thành `.env` để tùy chỉnh nếu cần thiết.

---

## 👨‍💻 Tác giả
**Trần Minh**

---
*Dữ liệu được cập nhật tự động hàng ngày.*