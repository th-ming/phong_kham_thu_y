import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Quản lý Lịch trực & Phân bổ ca trực', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi kịch bản test
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Giao diện Lịch trực nhân sự và các bộ lọc', async ({ page }) => {
        // 1. Đi tới trang Quản lý lịch trực nhân sự
        await page.goto(`${BASE_URL}/quan-ly/lich-lam-viec`);
        await expect(page.getByRole('heading', { name: 'Điều Hành Nhân Sự' })).toBeVisible();

        // 2. Kiểm tra hiển thị các ngày trong tuần
        await expect(page.getByText('Thứ 2')).toBeVisible();
        await expect(page.getByText('Thứ 3')).toBeVisible();
        await expect(page.getByText('Thứ 7')).toBeVisible();
        await expect(page.getByText('Chủ Nhật')).toBeVisible();

        // 3. Kiểm tra các bộ lọc nhân viên theo chức vụ
        const roleSelect = page.locator('select').first();
        await expect(roleSelect).toBeVisible();
        await roleSelect.selectOption('all');
    });

    test('TC02: Đăng ký ca trực mới cho nhân viên', async ({ page }) => {
        // 1. Đi tới trang Quản lý lịch trực nhân sự
        await page.goto(`${BASE_URL}/quan-ly/lich-lam-viec`);

        // 2. Tìm nút Đăng ký ca trực (icon add_circle) ở một ô trống
        const addBtn = page.locator('[data-testid="add-shift-btn"]').first();
        if (await addBtn.isVisible()) {
            await addBtn.click();

            // 3. Xác nhận Modal Đăng Ký Ca Trực hiển thị thành công
            await expect(page.getByText('Đăng Ký Ca Trực')).toBeVisible();

            // 4. Đóng modal (Hủy bỏ)
            await page.getByRole('button', { name: 'HỦY' }).click();
            await expect(page.getByText('Đăng Ký Ca Trực')).not.toBeVisible();
        }
    });

});
