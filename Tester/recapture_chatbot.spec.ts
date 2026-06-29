import { test } from '@playwright/test';
import * as path from 'path';

test('Recapture chatbot AI', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/quan-ly/dashboard', { timeout: 20000 });

    await page.goto('http://localhost:3005/quan-ly/lich-hen');
    await page.waitForTimeout(3000);

    const chatBtn = page.locator('#chatBtn');
    await chatBtn.click({ force: true });
    
    // Đợi chatbot mở rộng và render lời chào chuẩn
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, 'tro ly ao ai.png') });
    console.log('Da chup: tro ly ao ai.png');
});
