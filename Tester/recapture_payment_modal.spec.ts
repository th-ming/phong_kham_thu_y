import { test } from '@playwright/test';
import * as path from 'path';

test('Recapture xac nhan thanh toan hoa don', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    // Login KH
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0984163338');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 20000 });

    // Hướng tới trang hóa đơn thanh toán
    await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
    await page.waitForTimeout(5000);

    // Kiểm tra xem có popup năm sinh xuất hiện không và xử lý nó
    const surveyModal = page.locator('text=Cho Rexi biết năm sinh của bạn');
    if (await surveyModal.count() > 0) {
        console.log('Phan hien popup nam sinh, dang tu dong tat...');
        try {
            // Click vao o chon nam sinh va chon mot gia tri ngau nhien, vi du 2000
            const selectYear = page.locator('select, input[placeholder*="năm sinh"], button:has-text("năm sinh")').first();
            if (await selectYear.count() > 0) {
                await selectYear.click({ force: true });
                await page.keyboard.type('2000');
                await page.keyboard.press('Enter');
            }
            // Click nut "Xác nhận"
            const xacNhanBtn = page.locator('button:has-text("Xác nhận")').first();
            await xacNhanBtn.click({ force: true });
            await page.waitForTimeout(2000);
        } catch(e) {
            console.log('Loi khi tat popup nam sinh:', e.message);
        }
    }

    // Click vao nut thanh toan de hien thi modal xac nhan thanh toan hoa don thuc te
    try {
        const btn = page.locator('button:has-text("Thanh toán"), button:has-text("Chi tiết")').first();
        await btn.click({ force: true, timeout: 5000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT, 'xac nhan thanh toan hoa don.png') });
        console.log('Da chup: xac nhan thanh toan hoa don.png');
        await page.keyboard.press('Escape');
    } catch (e) {
        console.log('Ko mo duoc modal thanh toan hoa don, chup list:', e.message);
        await page.screenshot({ path: path.join(OUT, 'xac nhan thanh toan hoa don.png') });
    }
});
