import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3001;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử Trang Bảng điều khiển Admin (Dashboard)', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        
        // Đợi chuyển hướng và kiểm tra URL
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Kiểm tra các thành phần giao diện chính của Dashboard', async ({ page }) => {
        // 1. Kiểm tra tiêu đề chính
        await expect(page.getByText('Tổng quan hệ thống 📊')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Xin chào Admin/i)).toBeVisible();

        // 2. Kiểm tra các thẻ thống kê (Stats Cards)
        // Chúng ta dùng các nhãn phổ biến trong DashboardQuanLy.tsx
        const statsLabels = [/Khách Hàng/i, /Lịch Hẹn/i, /Doanh Thu/i, /Kho Thuốc/i];
        for (const label of statsLabels) {
            await expect(page.getByText(label)).toBeVisible();
        }

        // 3. Kiểm tra bảng "Lịch hẹn hôm nay"
        await expect(page.getByText(/Lịch hẹn hôm nay/i)).toBeVisible();
        
        // Kiểm tra tiêu đề cột bảng
        const headers = ['GIỜ', 'BỆNH NHÂN', 'BÁC SĨ', 'TRẠNG THÁI'];
        for (const header of headers) {
            await expect(page.locator('table')).toContainText(header);
        }

        // 4. Kiểm tra mục "Cảnh báo kho"
        await expect(page.getByText(/Cảnh báo kho/i)).toBeVisible();
    });

    test('TC02: Kiểm tra tính điều hướng từ Dashboard', async ({ page }) => {
        // Kiểm tra link "Tất cả" trong bảng lịch hẹn
        const allAppointmentsLink = page.getByRole('link', { name: 'Tất cả' });
        if (await allAppointmentsLink.isVisible()) {
            await allAppointmentsLink.click();
            await expect(page).toHaveURL(/.*\/quan-ly\/lich-hen/);
        }
    });

});
