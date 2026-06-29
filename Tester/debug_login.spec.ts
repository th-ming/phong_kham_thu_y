import { test } from '@playwright/test';

test('Debug dang nhap khach hang', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0984163338');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    
    // Click dang nhap
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    console.log('Da click dang nhap, cho 8s...');
    await page.waitForTimeout(8000);
    
    console.log('Current URL after login attempt:', page.url());
    await page.screenshot({ path: 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o\\debug_login_0984163338.png' });
});
