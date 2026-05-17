import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng Kế toán & Quản lý Hóa đơn', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi test case (Admin có quyền kế toán)
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Kiểm tra giao diện Dashboard Kế toán & Biểu đồ doanh thu', async ({ page }) => {
        // 1. Đi tới trang Bảng điều khiển Kế toán
        await page.goto(`${BASE_URL}/quan-ly/ketoan-dashboard`);
        await expect(page.getByText('Bảng Điều Khiển Kế Toán')).toBeVisible();

        // 2. Kiểm tra các thẻ thống kê tài chính
        await expect(page.getByText('DOANH THU HÔM NAY')).toBeVisible();
        await expect(page.getByText('CÔNG NỢ CHƯA THU')).toBeVisible();
        await expect(page.getByText('HÓA ĐƠN CHƯA THANH TOÁN')).toBeVisible();

        // 3. Kiểm tra Biểu đồ biến động doanh thu
        await expect(page.getByText('Biến động doanh thu (7 ngày gần nhất)')).toBeVisible();

        // 4. Kiểm tra nút Xuất file Excel hóa đơn
        const excelBtn = page.getByRole('button', { name: /Xuất Excel/i });
        await expect(excelBtn).toBeVisible();
    });

    test('TC02: Xem chi tiết hóa đơn và In hóa đơn', async ({ page }) => {
        // 1. Đi tới trang Kế toán
        await page.goto(`${BASE_URL}/quan-ly/ketoan-dashboard`);

        // 2. Tìm hóa đơn đầu tiên trong danh sách và bấm Xem chi tiết
        const firstViewBtn = page.locator('button:has-text("Xem chi tiết")').first();
        if (await firstViewBtn.isVisible()) {
            await firstViewBtn.click();

            // 3. Xác nhận Modal Chi tiết Hóa đơn mở lên thành công
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByText('MÃ HÓA ĐƠN')).toBeVisible();
            await expect(page.getByText('TỔNG CỘNG:')).toBeVisible();

            // 4. Kiểm tra sự tồn tại của nút "In hóa đơn"
            const printBtn = page.getByRole('button', { name: /In hóa đơn/i });
            await expect(printBtn).toBeVisible();

            // 5. Đóng modal
            await page.getByRole('button', { name: 'Đóng' }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
        }
    });

});
