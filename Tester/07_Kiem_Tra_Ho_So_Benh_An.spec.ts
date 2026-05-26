import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Quản lý Hồ sơ bệnh án điện tử', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập ADMIN/bs trước mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Kiểm tra giao diện Danh sách Hồ sơ bệnh án', async ({ page }) => {
        // 1. Điều hướng tới trang hồ sơ bệnh án
        await page.goto(`${BASE_URL}/quan-ly/ho-so-benh-an`);
        await expect(page.getByRole('heading', { name: 'Hồ sơ bệnh án' })).toBeVisible();

        // 2. Xác minh các cột chính trong bảng hiển thị đầy đủ
        await expect(page.getByRole('columnheader', { name: 'MÃ HỒ SƠ' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'NGÀY KHÁM' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'THÚ CƯNG' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'BÁC SĨ ĐIỀU TRỊ' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'CHẨN ĐOÁN' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'TRẠNG THÁI' })).toBeVisible();
    });

    test('TC02: Truy cập xem chi tiết Hồ sơ bệnh án', async ({ page }) => {
        // 1. Đi tới trang danh sách hồ sơ
        await page.goto(`${BASE_URL}/quan-ly/ho-so-benh-an`);

        // 2. Tìm dòng hồ sơ bệnh án đầu tiên và bấm vào nút Xem chi tiết (icon visibility)
        const firstViewBtn = page.locator('tbody tr td a').first();
        if (await firstViewBtn.isVisible()) {
            await firstViewBtn.click();

            // 3. xn điều hướng thành công đến trang chi tiết bệnh án
            await expect(page).toHaveURL(/.*\/quan-ly\/ho-so-benh-an\/\d+/, { timeout: 10000 });

            // 4. Kiểm tra xem thông tin chi tiết bệnh án có hiển thị hay ko
            await expect(page.getByText(/Chi tiết bệnh án/i).or(page.getByText(/Thông tin khám bệnh/i))).toBeVisible();
        }
    });

});
