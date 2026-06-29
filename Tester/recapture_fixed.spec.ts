import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai cac anh bi loi sau khi fix', async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 5000) => {
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('Da chup: ' + name);
    };

    // ===== 1. KHACH HANG (0984163338) - Hoa don thanh toan =====
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(3000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0984163338');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 20000 });
    console.log('Login KH OK!');

    // Di toi hoa don thanh toan
    await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
    await page.waitForTimeout(6000);

    // Kiem tra va tat khao sat nam sinh neu co
    try {
        const surveyInput = page.locator('select, input[placeholder*="năm sinh"]').first();
        if (await surveyInput.count() > 0) {
            await surveyInput.selectOption({ value: '2000' });
            await page.locator('button:has-text("Xác nhận"), button:has-text("Gửi")').first().click({ force: true });
            await page.waitForTimeout(2000);
        }
    } catch(e) {
        console.log('Popup khao sat nam sinh khong xuat hien hoac khong can thiet.');
    }

    // Click nut Thanh toan de mo modal thanh toan hoa don thuc te
    try {
        const payBtn = page.locator('button:has-text("Thanh toán"), button:has-text("Chi tiết")').first();
        await payBtn.click({ force: true, timeout: 5000 });
        await shot('xac nhan thanh toan hoa don.png', 4000);
        await page.keyboard.press('Escape');
    } catch(e) {
        console.log('Loi click thanh toan:', e.message);
        await page.screenshot({ path: path.join(OUT, 'xac nhan thanh toan hoa don.png') });
    }

    // ===== 2. ADMIN (admin) - Lich hen (da fix font) va Chatbot AI =====
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 20000 });
    console.log('Login Admin OK!');

    // Chup lai trang quan ly lich hen (Hình 33 - da sua loi font chu)
    await page.goto('http://localhost:3005/quan-ly/lich-hen');
    await shot('quan ly lich hen kham.png', 8000);

    // Kich hoat chatbot va chup anh tro ly ao AI (Hình 36 - da sua encoding UTF-8)
    try {
        const chatBtn = page.locator('#chatBtn');
        await chatBtn.click({ force: true, timeout: 5000 });
        await shot('tro ly ao ai.png', 5000);
    } catch(e) {
        console.log('Loi mo chatbot:', e.message);
    }

    console.log('Chup lai hoan tat!');
});
