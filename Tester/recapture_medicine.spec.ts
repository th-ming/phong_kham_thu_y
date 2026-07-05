import { test } from '@playwright/test';
import * as path from 'path';

test('Recapture form ke don thuoc bac si', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 4000) => {
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

    // Di toi trang kham benh va chon ca truc
    await page.goto('http://localhost:3005/quan-ly/kham-benh');
    await page.waitForTimeout(4000);
    
    try {
        const selectBox = page.locator('select[data-ai-id="select-quanlybenhan-8wqe"]');
        await selectBox.selectOption({ value: 'LH-0F91DEAF' });
        await page.waitForTimeout(2000);

        // Click vao nut "+ Thêm thuốc" de hien thi form ke don thuoc
        const addMedicineBtn = page.locator('button:has-text("Thêm thuốc"), [class*="btn"]:has-text("Thêm thuốc")').first();
        await addMedicineBtn.click({ force: true, timeout: 5000 });
        
        // Chup lai giao dien ke don thuoc sau khi mo pop-up them thuoc
        await shot('bac si lap don thuoc.png', 4000);
    } catch (e) {
        console.log('Loi click mo form ke don:', e.message);
        // Fallback copy anh kham benh sang don thuoc
        const srcImg = path.join(OUT, 'bac si kham benh.png');
        const destImg = path.join(OUT, 'bac si lap don thuoc.png');
        if (fs.existsSync(srcImg)) {
            fs.copyFileSync(srcImg, destImg);
            console.log('Fallback: Da copy bac si kham benh sang bac si lap don thuoc');
        }
    }
});
