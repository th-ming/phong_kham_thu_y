import { test } from '@playwright/test';
import * as path from 'path';

test('Recapture va chup dung form nghiep vu', async ({ page }) => {
    test.setTimeout(600000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 5000) => {
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('Da chup: ' + name);
    };

    // ===== 1. KHACH HANG (Mai Hoàng Long - 0984163338) =====
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0984163338');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 20000 });
    console.log('Login KH OK!');

    // Hình 21: Chi tiet thu cung (Click truc tiep vao link/nut chi tiet tren list card)
    await page.goto('http://localhost:3005/khach-hang/quan-ly-thu-cung');
    await page.waitForTimeout(5000);
    try {
        // Tìm thẻ card hoặc nút có chữ chi tiết và click force
        const btn = page.locator('button:has-text("Chi tiết"), a:has-text("Chi tiết"), .glass-card, [class*="card"]').first();
        await btn.click({ force: true, timeout: 5000 });
        await shot('chi tiet thu cung dich vu.png', 5000);
        await page.keyboard.press('Escape');
    } catch (e) {
        console.log('Ko mo dc modal chi tiet thu cung, chup trang list:', e.message);
        await page.screenshot({ path: path.join(OUT, 'chi tiet thu cung dich vu.png') });
    }

    // Hình 23: Xac nhan thanh toan (Chup modal khi click "Thanh toan" tu list hoa don)
    await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
    await page.waitForTimeout(5000);
    try {
        const btn = page.locator('button:has-text("Thanh toán"), button:has-text("Chi tiết"), .glass-card').first();
        await btn.click({ force: true, timeout: 5000 });
        await shot('xac nhan thanh toan hoa don.png', 5000);
        await page.keyboard.press('Escape');
    } catch (e) {
        console.log('Ko mo dc modal thanh toan, chup trang list:', e.message);
        await page.screenshot({ path: path.join(OUT, 'xac nhan thanh toan hoa don.png') });
    }

    // Hình 27: Chi tiet ho so benh an
    await page.goto('http://localhost:3005/khach-hang/ho-so-benh-an');
    await page.waitForTimeout(5000);
    try {
        const btn = page.locator('button:has-text("Xem"), button:has-text("Chi tiết"), .glass-card').first();
        await btn.click({ force: true, timeout: 5000 });
        await shot('chi tiet ho so benh an hoa don.png', 5000);
        await page.keyboard.press('Escape');
    } catch (e) {
        console.log('Ko mo dc modal benh an, chup trang list:', e.message);
        await page.screenshot({ path: path.join(OUT, 'chi tiet ho so benh an hoa don.png') });
    }

    // ===== 2. BAC SI (doctor_1779566347881) =====
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('doctor_1779566347881');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 20000 });
    console.log('Login Bac si OK!');

    // Hình 41: Bác sĩ khám bệnh (Click "Bắt đầu khám" cho ca khám đã gán)
    await page.goto('http://localhost:3005/quan-ly/kham-benh');
    await page.waitForTimeout(6000);
    try {
        // Tìm button bắt đầu khám hoặc icon khám
        const btn = page.locator('button:has-text("Khám"), button:has-text("Bắt đầu khám"), button:has-text("Bắt đầu")').first();
        await btn.click({ force: true, timeout: 5000 });
        await shot('bac si kham benh.png', 5000);
        
        // Hình 42: Bác sĩ lập đơn thuốc / chỉ định dịch vụ
        // Click tiếp tab hoặc nút Kê đơn / Chỉ định dịch vụ ngay trong form khám
        const tab = page.locator('button:has-text("Kê đơn"), button:has-text("Thuốc"), button:has-text("Chỉ định dịch vụ")').first();
        await tab.click({ force: true, timeout: 5000 });
        await shot('bac si lap don thuoc.png', 5000);
    } catch (e) {
        console.log('Ko mo dc form khám, chup mac dinh:', e.message);
        await page.screenshot({ path: path.join(OUT, 'bac si kham benh.png') });
        await page.screenshot({ path: path.join(OUT, 'bac si lap don thuoc.png') });
    }

    // ===== 3. ADMIN =====
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 20000 });
    console.log('Login Admin OK!');

    // Hình 32: Quản lý tài khoản khách hàng & thú cưng (URL chuẩn)
    await page.goto('http://localhost:3005/quan-ly/khach-hang-thu-cung');
    await shot('quan ly tai khoan khach hang.png', 8000);

    console.log('Recapture test spec hoan thanh.');
});
