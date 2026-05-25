# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Quan_Ly_Khach_Hang_Thu_Cung.spec.ts >> Kiểm thử chức năng: Quản lý Khách hàng & Thú cưng >> TC01: Luồng Đăng ký Chủ nuôi (Khách hàng mới)
- Location: Kiem_Tra_Quan_Ly_Khach_Hang_Thu_Cung.spec.ts:17:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Khách hàng & Thú cưng' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Khách hàng & Thú cưng' })

```

```yaml
- img "Rexi"
- heading "REXI ADMIN" [level=2]
- paragraph: HỆ THỐNG QUẢN TRỊ
- img "Admin Rexi System"
- paragraph: Admin Rexi System
- paragraph: Quản trị tối cao
- navigation:
  - text: TỔNG QUAN
  - link "dashboard Bảng điều khiển":
    - /url: /quan-ly/dashboard
  - link "monitoring Báo cáo & Thống kê":
    - /url: /quan-ly/bao-cao-thong-ke
  - text: LỊCH TRÌNH & NHÂN SỰ
  - link "calendar_month Quản lý lịch hẹn":
    - /url: /quan-ly/lich-hen
  - link "edit_calendar Điều hành nhân sự":
    - /url: /quan-ly/lich-lam-viec
  - link "badge Nhân sự & Quyền hạn":
    - /url: /quan-ly/nhan-vien-phan-quyen
  - text: KHÁCH HÀNG & DỊCH VỤ
  - link "groups Khách hàng & Thú cưng":
    - /url: /quan-ly/khach-hang-thu-cung
  - link "medical_information Danh mục dịch vụ":
    - /url: /quan-ly/dich-vu
  - text: CHUYÊN MÔN LÂM SÀNG
  - link "stethoscope Khám bệnh & Kê đơn":
    - /url: /quan-ly/kham-benh
  - link "clinical_notes Hồ sơ bệnh án":
    - /url: /quan-ly/ho-so-benh-an
  - link "description Kê đơn & Thuốc":
    - /url: /quan-ly/don-thuoc
  - link "biotech Xét nghiệm & Cận lâm sàng":
    - /url: /quan-ly/xet-nghiem
  - text: KHO & TÀI CHÍNH
  - link "medication Danh mục kho thuốc":
    - /url: /quan-ly/kho-thuoc
  - link "inventory_2 Nhập kho & Kiểm kê":
    - /url: /quan-ly/nhap-kho
  - link "receipt_long Hóa đơn & Thanh toán":
    - /url: /quan-ly/hoa-don
  - link "account_balance Tài chính - Kế toán":
    - /url: /quan-ly/ke-toan
  - text: TIỆN ÍCH & MARKETING
  - link "campaign Chiến dịch Marketing":
    - /url: /quan-ly/marketing
  - link "folder_open Quản lý tệp tin":
    - /url: /quan-ly/file-dinh-kem
  - text: CẤU HÌNH
  - link "settings Cài đặt chung":
    - /url: /quan-ly/cau-hinh
  - link "extension Phân hệ chức năng":
    - /url: /quan-ly/chuc-nang
  - link "person Hồ sơ cá nhân":
    - /url: /quan-ly/thong-tin-ca-nhan
- link "home Về trang chủ":
  - /url: /
- button "Đổi giao diện": dark_mode
- button "logout Đăng xuất"
- main
- text: Cần Rexi hỗ trợ nghiệp vụ ca trực hay tra cứu y khoa gì không sếp? 🐾
- button "Ẩn bong bóng gợi ý chatbot": close
- button "pets"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const FRONTEND_PORT = 3005;
  4  | const BASE_URL = `http://localhost:${FRONTEND_PORT}`;
  5  | 
  6  | test.describe('Kiểm thử chức năng: Quản lý Khách hàng & Thú cưng', () => {
  7  | 
  8  |     test.beforeEach(async ({ page }) => {
  9  |         // Đăng nhập Admin trước mỗi kịch bản test
  10 |         await page.goto(`${BASE_URL}/dang-nhap`);
  11 |         await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  12 |         await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
  13 |         await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  14 |         await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
  15 |     });
  16 | 
  17 |     test('TC01: Luồng Đăng ký Chủ nuôi (Khách hàng mới)', async ({ page }) => {
  18 |         // 1. Đi tới trang Quản lý Khách hàng & Thú cưng
  19 |         await page.goto(`${BASE_URL}/quan-ly/khach-hang-thu-cung`);
> 20 |         await expect(page.getByRole('heading', { name: 'Khách hàng & Thú cưng' })).toBeVisible();
     |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  21 | 
  22 |         // 2. Click nút "Thêm chủ nuôi" để mở form đăng ký nhanh
  23 |         await page.getByRole('button', { name: /Thêm chủ nuôi/i }).click();
  24 |         await expect(page.getByText('Thêm chủ nuôi mới')).toBeVisible();
  25 | 
  26 |         // 3. Nhập dữ liệu khách hàng mới
  27 |         const ts = Date.now();
  28 |         const tenKhachHang = `Khách Hàng Kiểm Thử ${ts}`;
  29 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-3mat"]').fill(tenKhachHang); // Tên
  30 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-3m6n"]').fill(`09${ts.toString().slice(-8)}`); // SĐT ngẫu nhiên
  31 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-j4ng"]').fill(`tester_${ts}@rexi.com`); // Email
  32 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-namsinh"]').fill('1999'); // Năm sinh (Gen Z để chatbot đổi giọng nhây)
  33 | 
  34 |         // 4. Lưu thông tin
  35 |         const registerResponse = page.waitForResponse(res => res.url().includes('/api/auth/register-simple'), { timeout: 15000 });
  36 |         await page.locator('[data-ai-id="button-quanlykhachhangthucung-30dl"]').click({ force: true });
  37 |         await expect((await registerResponse).ok()).toBeTruthy();
  38 | 
  39 |         // 5. Xác nhận hiển thị thông báo thành công
  40 |         await expect(page.getByText('Thêm khách hàng thành công!')).toBeVisible({ timeout: 10000 });
  41 | 
  42 |         // Chụp lại ảnh màn hình bằng chứng thực tế đăng ký thành công có Năm sinh Gen Z
  43 |         await page.screenshot({ path: 'd:/QLy Phòng Khám Thú Y/Tester/test-results/evidence-tc01-dang-ky-nam-sinh.png', fullPage: true });
  44 |     });
  45 | 
  46 |     test('TC02: Đăng ký bé mới và gán cho Chủ sở hữu', async ({ page }) => {
  47 |         // 1. Đi tới trang Quản lý Khách hàng & Thú cưng
  48 |         await page.goto(`${BASE_URL}/quan-ly/khach-hang-thu-cung`);
  49 | 
  50 |         // 2. Click nút "Thêm bé mới"
  51 |         await page.getByRole('button', { name: /Thêm bé mới/i }).click();
  52 |         await expect(page.getByText('Đăng ký bé mới')).toBeVisible();
  53 | 
  54 |         // 3. Điền thông tin bé thú cưng
  55 |         const ts = Date.now();
  56 |         // Chọn chủ nuôi đầu tiên có sẵn trong dropdown
  57 |         await page.locator('[data-ai-id="select-quanlykhachhangthucung-nqxg"]').selectOption({ index: 1 });
  58 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-ub0z"]').fill(`Cún Cưng VIP ${ts}`); // Tên bé
  59 |         await page.locator('[data-ai-id="select-quanlykhachhangthucung-36r6"]').selectOption('Chó');       // Loài
  60 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-y0af"]').fill('Corgi');              // Giống
  61 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-ccuw"]').fill('8.5');                // Cân nặng
  62 |         await page.locator('[data-ai-id="select-quanlykhachhangthucung-1av9"]').selectOption('Đực');       // Giới tính
  63 |         await page.locator('[data-ai-id="input-quanlykhachhangthucung-h9m1"]').fill('Vàng Trắng');          // Màu sắc
  64 | 
  65 |         // 4. Đăng ký bé
  66 |         await page.getByRole('button', { name: 'Đăng ký bé' }).click();
  67 | 
  68 |         // 5. Xác nhận thành công
  69 |         await expect(page.getByText('Thêm thú cưng thành công!')).toBeVisible({ timeout: 10000 });
  70 | 
  71 |         // Chụp lại ảnh màn hình bằng chứng thực tế đăng ký thú cưng thành công
  72 |         await page.screenshot({ path: 'd:/QLy Phòng Khám Thú Y/Tester/test-results/evidence-tc02-dang-ky-thu-cung.png', fullPage: true });
  73 |     });
  74 | 
  75 | });
  76 | 
```