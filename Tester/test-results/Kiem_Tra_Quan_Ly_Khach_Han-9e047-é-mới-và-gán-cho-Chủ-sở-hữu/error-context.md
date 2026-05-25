# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Quan_Ly_Khach_Hang_Thu_Cung.spec.ts >> Kiểm thử chức năng: Quản lý Khách hàng & Thú cưng >> TC02: Đăng ký bé mới và gán cho Chủ sở hữu
- Location: Kiem_Tra_Quan_Ly_Khach_Hang_Thu_Cung.spec.ts:46:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Thêm thú cưng thành công!')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Thêm thú cưng thành công!')

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
- main:
  - heading "Khách hàng & Thú cưng" [level=1]
  - paragraph: Quản lý thông tin chủ nuôi và các bạn nhỏ trong hệ thống.
  - button "person_add Thêm chủ nuôi"
  - button "pets Thêm bé mới"
  - heading "Danh sách khách hàng (28) Virtual List" [level=2]
  - text: search
  - textbox "Tìm khách hàng, số điện thoại..."
  - text: TÊN KHÁCH HÀNG NĂM SINH LIÊN HỆ TRẠNG THÁI THAO TÁC person Trần Minh — 0981848323 tranminh09818@gmail.com Hoạt động
  - button "lock Khóa"
  - text: person Lê Hoàng Phong — 0912345678 tester_1778980148883@rexi.com Hoạt động
  - button "lock Khóa"
  - text: person 19. Trần Hoàng Minh — 0928675251 thuyvan09818@gmail.com Hoạt động
  - button "lock Khóa"
  - text: person Khách Hàng Kiểm Thử 1779567828124 — 0967828124 tester_1779567828124@rexi.com Hoạt động
  - button "lock Khóa"
  - text: person Trần Thị Lan — 0987654321 tester_1778980011507@rexi.com Hoạt động
  - button "lock Khóa"
  - text: person Khách Hàng Kiểm Thử 1779570430769 — 0970430769 tester_1779570430769@rexi.com Hoạt động
  - button "lock Khóa"
  - text: person Khách Hàng Kiểm Thử 1779575445849 — 0975445849 tester_1779575445849@rexi.com Hoạt động
  - button "lock Khóa"
  - heading "Danh sách thú cưng (10)" [level=2]
  - text: search
  - textbox "Tìm tên bé, loài, giống..."
  - table:
    - rowgroup:
      - row "ID THÚ CƯNG ĐẶC ĐIỂM CHỦ SỞ HỮU THỂ TRẠNG THAO TÁC":
        - columnheader "ID"
        - columnheader "THÚ CƯNG"
        - columnheader "ĐẶC ĐIỂM"
        - columnheader "CHỦ SỞ HỮU"
        - columnheader "THỂ TRẠNG"
        - columnheader "THAO TÁC"
    - rowgroup:
      - row "#TC-9BAC2BA8 pets Cún Cưng VIP 1779739236298 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-9BAC2BA8"
        - cell "pets Cún Cưng VIP 1779739236298"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-BF524DC9 pets Cún Cưng VIP 1779739172317 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-BF524DC9"
        - cell "pets Cún Cưng VIP 1779739172317"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-1210244B pets ,,, ,,,, - — Đực • Không rõ màu person 19. Trần Hoàng Minh 0 kg edit delete":
        - cell "#TC-1210244B"
        - cell "pets ,,,"
        - cell ",,,, - — Đực • Không rõ màu"
        - cell "person 19. Trần Hoàng Minh"
        - cell "0 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-BF422C4A pets Cún Cưng VIP 1779575449253 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-BF422C4A"
        - cell "pets Cún Cưng VIP 1779575449253"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-F4B77060 pets Cún Cưng VIP 1779575155736 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-F4B77060"
        - cell "pets Cún Cưng VIP 1779575155736"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-5567DD11 pets Cún Cưng VIP 1779572553894 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-5567DD11"
        - cell "pets Cún Cưng VIP 1779572553894"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-466269A2 pets Cún Cưng VIP 1779571633514 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-466269A2"
        - cell "pets Cún Cưng VIP 1779571633514"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-CBEA7DB4 pets Cún Cưng VIP 1779571200116 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-CBEA7DB4"
        - cell "pets Cún Cưng VIP 1779571200116"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-797DB73A pets Cún Cưng VIP 1779570434133 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-797DB73A"
        - cell "pets Cún Cưng VIP 1779570434133"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
      - row "#TC-B8712048 pets Cún Cưng VIP 1779568384978 Chó - Corgi Đực • Vàng Trắng person Trần Minh 8.5 kg edit delete":
        - cell "#TC-B8712048"
        - cell "pets Cún Cưng VIP 1779568384978"
        - cell "Chó - Corgi Đực • Vàng Trắng"
        - cell "person Trần Minh"
        - cell "8.5 kg"
        - cell "edit delete":
          - button "edit"
          - button "delete"
  - button "chevron_left Trước" [disabled]
  - text: Trang 1 / 2
  - button "Sau chevron_right"
- button "pets"
- heading "Đăng ký bé mới" [level=3]
- button "close"
- text: CHỦ SỞ HỮU
- combobox:
  - option "-- Chọn khách hàng --"
  - option "Trần Minh - 0981848323" [selected]
  - option "Lê Hoàng Phong - 0912345678"
  - option "19. Trần Hoàng Minh - 0928675251"
  - option "Khách Hàng Kiểm Thử 1779567828124 - 0967828124"
  - option "Trần Thị Lan - 0987654321"
  - option "Khách Hàng Kiểm Thử 1779570430769 - 0970430769"
  - option "Khách Hàng Kiểm Thử 1779575445849 - 0975445849"
  - option "Khách Hàng Kiểm Thử 1779739220573 - 0939220573"
  - option "Khách Hàng Kiểm Thử 1779571196604 - 0971196604"
  - option "Khách Hàng Kiểm Thử 1779568099379 - 0968099379"
  - option "Khách Hàng Kiểm Thử 1779571629285 - 0971629285"
  - option "Khách Hàng Kiểm Thử 1779575152703 - 0975152703"
  - option "Automation Tester - 0975095171"
  - option "Walkthrough User - 0901234567"
  - option "Đặng Văn Cường - 0933445566"
  - option "Automation Tester - 0971149004"
  - option "Automation Tester - 0968274213"
  - option "Khách Hàng Kiểm Thử 1779739165842 - 0939165842"
  - option "Automation Tester - 0971559209"
  - option "Automation Tester - 0970382931"
  - option "Khách Hàng Kiểm Thử 1779568379851 - 0968379851"
  - option "Automation Tester - 0975381892"
  - option "minh minh -"
  - option "Automation Tester - 0966433815"
  - option "Khách Hàng Kiểm Thử 1779572551265 - 0972551265"
  - option "Automation Tester - 0972511232"
  - option "Nguyễn Ngọc Ánh - 0966778899"
  - option "Vũ Đức Trí - 0900112233"
- text: TÊN BÉ
- textbox: Cún Cưng VIP 1779753155831
- text: LOÀI
- combobox:
  - option "Chó" [selected]
  - option "Mèo"
  - option "Khác"
- text: GIỐNG
- textbox: Corgi
- text: CÂN NẶNG (KG)
- spinbutton: "8.5"
- text: GIỚI TÍNH
- combobox:
  - option "Đực" [selected]
  - option "Cái"
  - option "Không xác định"
- text: NGÀY SINH
- textbox
- text: MÀU SẮC
- textbox: Vàng Trắng
- button "Đang lưu..." [disabled]
- button "Hủy"
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
  20 |         await expect(page.getByRole('heading', { name: 'Khách hàng & Thú cưng' })).toBeVisible();
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
> 69 |         await expect(page.getByText('Thêm thú cưng thành công!')).toBeVisible({ timeout: 10000 });
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  70 | 
  71 |         // Chụp lại ảnh màn hình bằng chứng thực tế đăng ký thú cưng thành công
  72 |         await page.screenshot({ path: 'd:/QLy Phòng Khám Thú Y/Tester/test-results/evidence-tc02-dang-ky-thu-cung.png', fullPage: true });
  73 |     });
  74 | 
  75 | });
  76 | 
```