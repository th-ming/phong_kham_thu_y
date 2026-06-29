import { test } from '@playwright/test';
import * as path from 'path';

test('Recapture form bac si voi du lieu day du', async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 5000) => {
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('Da chup: ' + name);
    };

    // Login bac si
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('doctor_1779566347881');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 20000 });
    console.log('Login Bac si OK!');

    // Di toi trang kham benh
    await page.goto('http://localhost:3005/quan-ly/kham-benh');
    await page.waitForTimeout(5000);

    try {
        // Chon benh nhan dang cho tu select box
        const selectBox = page.locator('select[data-ai-id="select-quanlybenhan-8wqe"]');
        await selectBox.selectOption({ value: 'LH-0F91DEAF' });
        console.log('Da chon benh nhan Miu trong ca truc');

        // Doi load form kham
        await page.waitForTimeout(3000);
        await shot('bac si kham benh.png', 3000);

        // Chuyen sang tab ke don de chup anh lap don thuoc
        // Tim nut Ke don / Tab don thuoc
        const keDonTab = page.locator('button:has-text("Kê đơn"), button:has-text("Kê đơn thuốc"), [class*="tab"]').first();
        await keDonTab.click({ force: true, timeout: 5000 });
        await shot('bac si lap don thuoc.png', 5000);
    } catch (e) {
        console.log('Loi thao tac form kham:', e.message);
        await page.screenshot({ path: path.join(OUT, 'bac si kham benh.png') });
        await page.screenshot({ path: path.join(OUT, 'bac si lap don thuoc.png') });
    }

    console.log('Chup lai form bac si hoan tat!');
});
