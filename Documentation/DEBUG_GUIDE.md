# DEBUG GUIDE — Rexi Veterinary System

## 🔴 Issue: Playwright Tests Fail with Login Timeout

### Ngày phát hiện: 2026-07-02

### Triệu chứng:
- Gần hết Playwright test cases fail với lỗi `page.waitForURL: Timeout 15000ms exceeded`
- Test cố gắng login admin → click "Đăng nhập ngay" → nhưng KHÔNG redirect sang `/quan-ly/dashboard`
- Một số test pass (TC03 Google button, TC05 OTP, TC06 Quick verify) vì KHÔNG cần login

### Root Cause:
**Brute-force lockout trong `AuthController.java`** khi chạy Playwright tests song song.

**Cơ chế:**
1. `AuthController.java` có biến static `loginAttempts` và `lockoutTime` (ConcurrentHashMap, lưu trong RAM)
2. `MAX_ATTEMPTS = 5` — sau 5 lần nhập sai pass → khóa tạm thời `LOCKOUT_DURATION = 15 phút`
3. Key lockout = `username + "-" + clientIp` (VD: `admin-127.0.0.1`)
4. `Frontend/playwright.config.ts` có `fullyParallel: true` → nhiều test chạy **đồng thời**
5. Nhiều test cùng nhập `admin`/`admin@rexi.com` (hoặc sai pass) 1 lúc → Backend đếm nhiều lần → trigger lockout
6. Tất cả test sau đều fail vì admin bị khóa 15 phút

### Bằng chứng:
- Browser test login `admin/admin@rexi.com` → **PASS** (chạy riêng lẻ)
- SQL query xác nhận `admin` tồn tại trong DB, active, BCrypt hash ✅
- Playwright test chạy `--workers=1` (chạy tuần tự) → **PASS** trong 6.5s

### Cách fix (ĐÃ LÀM):
```typescript
// Frontend/playwright.config.ts
fullyParallel: false,  // KHÔNG được parallel
workers: 1,            // LUÔN chạy tuần tự
```

### Bài học:
1. **Luôn chạy Playwright tests tuần tự** (workers=1) vì Backend có brute-force lockout
2. Nếu muốn chạy parallel, phải tắt lockout trong AuthController cho test environment
3. Account `admin/admin@rexi.com` là tài khoản test chung → tránh chạy nhiều test cùng lúc login account này

---

## 🔴 Issue: Chatbot Test 150 Kịch bản timeout

### Triệu chứng:
- Test 16 (`16_Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts`) timeout 15 phút

### Root Cause:
- Test có ~150 cases, mỗi case mock API + wait 3s = ~7.5 phút lý thuyết
- Nhưng browser context load lại trang + open chatbot mỗi case → cộng thêm thời gian
- Playwright timeout config quá thấp cho số lượng case lớn

### Cách fix:
- Tăng timeout trong config: `timeout: 180000` (3 phút/case) hoặc chia nhỏ thành nhiều file

---

## 🟡 Issue: Test 17 (Guest Chatbot) fail

### Triệu chứng:
- `locator.fill: Test timeout of 60000ms exceeded` tại `textarea[placeholder*="Lệnh"]`

### Root Cause:
- Placeholder text trong chatbot Agent tab có thể thay đổi
- Test hardcode `placeholder*="Lệnh"` nhưng UI thực tế dùng placeholder khác

### Cách fix:
- Cập nhật selector trong test để khớp với placeholder thực tế
