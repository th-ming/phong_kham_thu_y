import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai anh dung nghiep vu sau khi fix sach', async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 4000) => {
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('Da chup: ' + name);
    };

    // ===== 1. KHACH HANG (0984163338) - Hoa don thanh toan (Hình 23) =====
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0984163338');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/khach-hang/dashboard', { timeout: 20000 });
    console.log('Login KH OK!');

    // Di toi trang hoa don
    await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
    await page.waitForTimeout(5000);

    // Click badge "Chi tiết" để mở modal danh sách hóa đơn
    try {
        const kpiBadge = page.locator('div.customer-kpi-badge:has-text("Chi tiết")').first();
        await kpiBadge.click({ force: true, timeout: 5000 });
        console.log('Da click kpi badge de mo modal');
        
        // Chờ modal load dữ liệu và chụp trực tiếp modal chi tiết hóa đơn/thanh toán
        await shot('xac nhan thanh toan hoa don.png', 4000);
        await page.keyboard.press('Escape');
    } catch(e) {
        console.log('Loi click thanh toan:', e.message);
        await page.screenshot({ path: path.join(OUT, 'xac nhan thanh toan hoa don.png') });
    }

    // ===== 2. ADMIN (admin) - Lich hen (Hình 33) & Chatbot AI (Hình 36) =====
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/quan-ly/dashboard', { timeout: 20000 });
    console.log('Login Admin OK!');

    // Chụp lại trang quản lý lịch hẹn (Hình 33 - đã decode HTML Entities cột lý do)
    await page.goto('http://localhost:3005/quan-ly/lich-hen');
    await shot('quan ly lich hen kham.png', 6000);

    // Chụp trợ lý ảo AI (Hình 36 - đã ép encoding UTF-8)
    try {
        const chatBtn = page.locator('#chatBtn');
        await chatBtn.click({ force: true, timeout: 5000 });
        await shot('tro ly ao ai.png', 4000);
    } catch(e) {
        console.log('Loi click mo chatbot:', e.message);
    }

    console.log('Chup lai hoan tat!');
});
