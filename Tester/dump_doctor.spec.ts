import { test } from '@playwright/test';
import * as path from 'path';

test('Dump bac si page HTML', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('doctor_1779566347881');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 20000 });

    await page.goto('http://localhost:3005/quan-ly/kham-benh');
    await page.waitForTimeout(10000);

    const html = await page.content();
    require('fs').writeFileSync(path.join(OUT, 'debug_kham_benh.html'), html, 'utf8');
    await page.screenshot({ path: path.join(OUT, 'debug_kham_benh_page.png') });
    console.log('Dumped HTML and screen to report output folder');
});
