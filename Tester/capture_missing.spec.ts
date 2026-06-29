import { test } from '@playwright/test';
import * as path from 'path';

test('Chup anh con thieu', async ({ page }) => {
    test.setTimeout(600000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 12000) => {
        console.log('Cho ' + ms/1000 + 's: ' + name);
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('OK: ' + name);
    };

    // Login khach hang
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(3000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0954570698');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 20000 });

    // Hinh 21: Chi tiet thu cung
    await page.goto('http://localhost:3005/khach-hang/quan-ly-thu-cung');
    await page.waitForTimeout(15000);
    try {
        await page.locator('button, a').filter({ hasText: /chi ti\u1ebft|xem chi/i }).first().click({ timeout: 8000 });
        await shot('chi tiet thu cung dich vu.png', 10000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch { await page.screenshot({ path: path.join(OUT, 'chi tiet thu cung dich vu.png') }); }

    // Hinh 23: Xac nhan thanh toan
    await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
    await page.waitForTimeout(15000);
    try {
        await page.locator('button').filter({ hasText: /thanh to\u00e1n|pay/i }).first().click({ timeout: 8000 });
        await shot('xac nhan thanh toan hoa don.png', 10000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch { await page.screenshot({ path: path.join(OUT, 'xac nhan thanh toan hoa don.png') }); }

    // Hinh 27: Chi tiet ho so benh an
    await page.goto('http://localhost:3005/khach-hang/ho-so-benh-an');
    await page.waitForTimeout(15000);
    try {
        await page.locator('button, a').filter({ hasText: /chi ti\u1ebft|xem|\u0111\u01a1n thu\u1ed1c/i }).first().click({ timeout: 8000 });
        await shot('chi tiet ho so benh an hoa don.png', 10000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch { await page.screenshot({ path: path.join(OUT, 'chi tiet ho so benh an hoa don.png') }); }

    // Hinh 36: Tro ly ao AI (selector dung la #chatBtn)
    await page.goto('http://localhost:3005/');
    await page.waitForTimeout(15000);
    await page.locator('#chatBtn').click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.locator('textarea').first().fill('Xin chao Rexi', { timeout: 8000 });
    await page.keyboard.press('Enter');
    await shot('tro ly ao ai.png', 10000);

    // Login bac si
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(3000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('doctor_1779566347881');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 20000 });

    // Hinh 42: Bac si lap don thuoc/hoa don
    await page.goto('http://localhost:3005/quan-ly/kham-benh');
    await page.waitForTimeout(15000);
    try {
        await page.locator('button').filter({ hasText: /kh\u00e1m|k\u00ea \u0111\u01a1n|ghi b\u1ec7nh|l\u1eadp|ch\u1ec9 \u0111\u1ecbnh/i }).first().click({ timeout: 8000 });
        await shot('bac si lap don thuoc.png', 10000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch { await page.screenshot({ path: path.join(OUT, 'bac si lap don thuoc.png') }); }

    console.log('DONE!');
});
