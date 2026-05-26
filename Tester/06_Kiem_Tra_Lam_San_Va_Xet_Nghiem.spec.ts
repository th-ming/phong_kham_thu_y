import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Quản lý Xét nghiệm Lâm sàng', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi kịch bản test
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Giao diện danh sách phiếu xét nghiệm lâm sàng', async ({ page }) => {
        // 1. Đi tới trang quản lý xét nghiệm
        await page.goto(`${BASE_URL}/quan-ly/xet-nghiem`);
        await expect(page.getByRole('heading', { name: 'Quản lý Xét nghiệm' })).toBeVisible();

        // 2. Xác minh cấu trúc các cột hiển thị trong bảng xét nghiệm
        await expect(page.getByText('MÃ XN')).toBeVisible();
        await expect(page.getByText('LOẠI XÉT NGHIỆM')).toBeVisible();
        await expect(page.getByText('BÁC SĨ CHỈ ĐỊNH')).toBeVisible();
        await expect(page.getByText('NGÀY LẤY MẪU')).toBeVisible();
        await expect(page.getByText('TRẠNG THÁI')).toBeVisible();
    });

    test('TC02: Xem chi tiết kết quả xét nghiệm lâm sàng', async ({ page }) => {
        // 1. Đi tới trang quản lý xét nghiệm
        await page.goto(`${BASE_URL}/quan-ly/xet-nghiem`);

        // 2. Click xem kết quả đầu tiên trong danh sách (nếu có)
        const firstViewBtn = page.locator('tbody tr td button').first();
        if (await firstViewBtn.isVisible()) {
            await firstViewBtn.click();

            // 3. Xác nhận Modal Kết quả xét nghiệm hiển thị đầy đủ
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByText('Kết quả xét nghiệm')).toBeVisible();
            await expect(page.getByText('KẾT QUẢ PHÂN TÍCH')).toBeVisible();

            // 4. Đóng modal kết quả xét nghiệm
            await page.getByRole('button', { name: 'Đóng' }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
        }
    });

});
