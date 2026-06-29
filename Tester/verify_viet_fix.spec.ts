import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai anh chatbot sau khi sua tieng Viet co dau', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('tranminh09818@gmail.com');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/khach-hang/dashboard', { timeout: 20000 });
    console.log('Login OK!');

    // 1. trang_thu_cung - doi cho chatbot proactive hien thi
    await page.goto('http://localhost:3005/khach-hang/quan-ly-thu-cung');
    await page.waitForSelector('div.glass-card, div[style*="cursor"]', { timeout: 15000 });
    await page.waitForTimeout(6000); // doi chatbot proactive bubble hien
    await page.screenshot({ path: path.join(OUT, 'chi tiet thu cung dich vu.png') });
    console.log('Da chup: chi tiet thu cung dich vu.png');

    // 2. ho so benh an
    await page.goto('http://localhost:3005/khach-hang/ho-so-benh-an');
    await page.waitForSelector('table, div.glass-card', { timeout: 15000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(OUT, 'chi tiet ho so benh an hoa don.png') });
    console.log('Da chup: chi tiet ho so benh an hoa don.png');

    console.log('Hoan tat!');
});
