import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai 2 trang admin bi trang', async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    // Đăng nhập Admin
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/quan-ly/dashboard', { timeout: 20000 });
    console.log('Login Admin OK!');

    // 1. quan_ly_ho_so_benh_an_hoa_don.png
    await page.goto('http://localhost:3005/quan-ly/ho-so-benh-an');
    // Chờ đến khi có nội dung thực sự render ra (không còn trắng)
    try {
        await page.waitForSelector('table, div.glass-card, h1, div.page-header', { timeout: 15000 });
    } catch(e) { console.log('Timeout cho selector ho so, chup luon'); }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(OUT, 'quan ly ho so benh an hoa don.png') });
    console.log('Da chup: quan ly ho so benh an hoa don.png');

    // 2. quan_ly_dich_vu_kham.png
    await page.goto('http://localhost:3005/quan-ly/dich-vu');
    try {
        await page.waitForSelector('table, div.glass-card, h1, div.page-header', { timeout: 15000 });
    } catch(e) { console.log('Timeout cho selector dich vu, chup luon'); }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(OUT, 'quan ly dich vu kham.png') });
    console.log('Da chup: quan ly dich vu kham.png');

    console.log('Hoan tat!');
});
