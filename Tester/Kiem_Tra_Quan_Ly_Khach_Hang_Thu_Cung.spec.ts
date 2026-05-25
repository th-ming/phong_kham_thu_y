import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Quản lý Khách hàng & Thú cưng', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi kịch bản test
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Luồng Đăng ký Chủ nuôi (Khách hàng mới)', async ({ page }) => {
        // 1. Đi tới trang Quản lý Khách hàng & Thú cưng
        await page.goto(`${BASE_URL}/quan-ly/khach-hang-thu-cung`);
        await expect(page.getByRole('heading', { name: 'Khách hàng & Thú cưng' })).toBeVisible({ timeout: 15000 });

        // 2. Click nút "Thêm chủ nuôi" để mở form đăng ký nhanh
        await page.getByRole('button', { name: /Thêm chủ nuôi/i }).click();
        await expect(page.getByText('Thêm chủ nuôi mới')).toBeVisible();

        // 3. Nhập dữ liệu khách hàng mới
        const ts = Date.now();
        const tenKhachHang = `Khách Hàng Kiểm Thử ${ts}`;
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-3mat"]').fill(tenKhachHang); // Tên
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-3m6n"]').fill(`09${ts.toString().slice(-8)}`); // SĐT ngẫu nhiên
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-j4ng"]').fill(`tester_${ts}@rexi.com`); // Email
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-namsinh"]').fill('1999'); // Năm sinh (Gen Z để chatbot đổi giọng nhây)

        // 4. Lưu thông tin
        const registerResponse = page.waitForResponse(res => res.url().includes('/api/auth/register-simple'), { timeout: 15000 });
        await page.locator('[data-ai-id="button-quanlykhachhangthucung-30dl"]').click({ force: true });
        await expect((await registerResponse).ok()).toBeTruthy();

        // 5. Xác nhận hiển thị thông báo thành công
        await expect(page.getByText('Thêm khách hàng thành công!')).toBeVisible({ timeout: 10000 });

        // Chụp lại ảnh màn hình bằng chứng thực tế đăng ký thành công có Năm sinh Gen Z
        await page.screenshot({ path: 'd:/QLy Phòng Khám Thú Y/Tester/test-results/evidence-tc01-dang-ky-nam-sinh.png', fullPage: true });
    });

    test('TC02: Đăng ký bé mới và gán cho Chủ sở hữu', async ({ page }) => {
        // 1. Đi tới trang Quản lý Khách hàng & Thú cưng
        await page.goto(`${BASE_URL}/quan-ly/khach-hang-thu-cung`);

        // 2. Click nút "Thêm bé mới"
        await page.getByRole('button', { name: /Thêm bé mới/i }).click();
        await expect(page.getByText('Đăng ký bé mới')).toBeVisible();

        // 3. Điền thông tin bé thú cưng
        const ts = Date.now();
        // Chọn chủ nuôi đầu tiên có sẵn trong dropdown
        await page.locator('[data-ai-id="select-quanlykhachhangthucung-nqxg"]').selectOption({ index: 1 });
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-ub0z"]').fill(`Cún Cưng VIP ${ts}`); // Tên bé
        await page.locator('[data-ai-id="select-quanlykhachhangthucung-36r6"]').selectOption('Chó');       // Loài
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-y0af"]').fill('Corgi');              // Giống
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-ccuw"]').fill('8.5');                // Cân nặng
        await page.locator('[data-ai-id="select-quanlykhachhangthucung-1av9"]').selectOption('Đực');       // Giới tính
        await page.locator('[data-ai-id="input-quanlykhachhangthucung-h9m1"]').fill('Vàng Trắng');          // Màu sắc

        // 4. Đăng ký bé
        await page.getByRole('button', { name: 'Đăng ký bé' }).click();

        // 5. Xác nhận thành công
        await expect(page.getByText('Thêm thú cưng thành công!')).toBeVisible({ timeout: 20000 });

        // Chụp lại ảnh màn hình bằng chứng thực tế đăng ký thú cưng thành công
        await page.screenshot({ path: 'd:/QLy Phòng Khám Thú Y/Tester/test-results/evidence-tc02-dang-ky-thu-cung.png', fullPage: true });
    });

});
