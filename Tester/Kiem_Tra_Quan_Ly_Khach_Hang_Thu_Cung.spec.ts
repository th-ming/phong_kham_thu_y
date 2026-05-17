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
        await expect(page.getByRole('heading', { name: 'Khách hàng & Thú cưng' })).toBeVisible();

        // 2. Click nút "Thêm chủ nuôi" để mở form đăng ký nhanh
        await page.getByRole('button', { name: /Thêm chủ nuôi/i }).click();
        await expect(page.getByText('Thêm chủ nuôi mới')).toBeVisible();

        // 3. Nhập dữ liệu khách hàng mới
        const ts = Date.now();
        const tenKhachHang = `Khách Hàng Kiểm Thử ${ts}`;
        await page.locator('input').nth(0).fill(tenKhachHang); // Tên
        await page.locator('input').nth(1).fill(`09${ts.toString().slice(-8)}`); // SĐT ngẫu nhiên
        await page.locator('input').nth(2).fill(`tester_${ts}@rexi.com`); // Email

        // 4. Lưu thông tin
        await page.getByRole('button', { name: 'Lưu thông tin' }).click();

        // 5. Xác nhận hiển thị thông báo thành công
        await expect(page.getByText('Thêm khách hàng thành công!')).toBeVisible({ timeout: 10000 });
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
        await page.locator('select').first().selectOption({ index: 1 });
        await page.locator('input').nth(3).fill(`Cún Cưng VIP ${ts}`); // Tên bé
        await page.locator('select').nth(1).selectOption('Chó');       // Loài
        await page.locator('input').nth(4).fill('Corgi');              // Giống
        await page.locator('input').nth(5).fill('8.5');                // Cân nặng
        await page.locator('select').nth(2).selectOption('Đực');       // Giới tính
        await page.locator('input').nth(7).fill('Vàng Trắng');          // Màu sắc

        // 4. Đăng ký bé
        await page.getByRole('button', { name: 'Đăng ký bé' }).click();

        // 5. Xác nhận thành công
        await expect(page.getByText('Thêm thú cưng thành công!')).toBeVisible({ timeout: 10000 });
    });

});
