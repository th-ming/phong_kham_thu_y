import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Dump Tran Minh client pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('tranminh09818@gmail.com');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/khach-hang/dashboard', { timeout: 20000 });

    // Trang thú cưng
    await page.goto('http://localhost:3005/khach-hang/thu-cung');
    await page.waitForTimeout(5000);
    const html1 = await page.content();
    fs.writeFileSync(path.join(OUT, 'dump_thu_cung.html'), html1, 'utf8');

    // Trang hồ sơ y tế
    await page.goto('http://localhost:3005/khach-hang/ho-so-y-te');
    await page.waitForTimeout(5000);
    const html2 = await page.content();
    fs.writeFileSync(path.join(OUT, 'dump_ho_so.html'), html2, 'utf8');

    // Trang dashboard (để click avatar)
    await page.goto('http://localhost:3005/khach-hang/dashboard');
    await page.waitForTimeout(5000);
    const html3 = await page.content();
    fs.writeFileSync(path.join(OUT, 'dump_dashboard.html'), html3, 'utf8');

    console.log('Dump hoan tat!');
});
