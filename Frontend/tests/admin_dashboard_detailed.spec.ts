import { test, expect } from '@playwright/test';
const BASE_URL = 'http://127.0.0.1:3001';
test.describe('Kiem thu Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL + '/dang-nhap');
        await page.getByPlaceholder('Ten dang nhap').fill('admin');
        await page.getByPlaceholder('Mat khau').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Dang nhap ngay' }).click();
        await page.waitForURL('**/quan-ly/dashboard');
    });
    test('Hien thi Stats Card', async ({ page }) => {
        await expect(page.locator('.glass-card').first()).toBeVisible();
    });
});
