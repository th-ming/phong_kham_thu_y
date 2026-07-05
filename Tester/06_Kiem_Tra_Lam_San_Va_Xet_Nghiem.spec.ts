import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Quản lý Xét nghiệm Lâm sàng', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Giao diện danh sách phiếu xét nghiệm lâm sàng', async ({ page }) => {
        await page.goto(`${BASE_URL}/quan-ly/xet-nghiem`);
        await expect(page.getByRole('heading', { name: 'Quản lý Xét nghiệm' })).toBeVisible();

        // Verify desktop table has correct column structure (>=5 columns)
        const labTable = page.locator('.admin-lab-desktop-table table');
        await expect(labTable).toBeVisible();
        const thCount = await labTable.locator('th').count();
        expect(thCount).toBeGreaterThanOrEqual(5);
    });

    test('TC02: Xem chi tiết kết quả xét nghiệm lâm sàng', async ({ page }) => {
        await page.goto(`${BASE_URL}/quan-ly/xet-nghiem`);

        const firstViewBtn = page.locator('tbody tr td button').first();
        if (await firstViewBtn.isVisible()) {
            await firstViewBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByText('Kết quả xét nghiệm')).toBeVisible();
            await expect(page.getByText('KẾT QUẢ PHÂN TÍCH')).toBeVisible();
            await page.getByRole('button', { name: 'Đóng' }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
        }
    });

});
