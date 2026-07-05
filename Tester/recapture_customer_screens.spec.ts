import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai cac anh bi loi bang tai khoan Tran Minh giau du lieu', async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 4000) => {
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('Da chup: ' + name);
    };

    // Đăng nhập tài khoản khách hàng Trần Minh
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('tranminh09818@gmail.com');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/khach-hang/dashboard', { timeout: 20000 });
    console.log('Login KH Tran Minh OK!');

    // 1. dang_ky_lich_hen.png
    await page.goto('http://localhost:3005/khach-hang/dat-lich-hen');
    await shot('dang ky lich hen.png', 5000);

    // 2. trang_thu_cung_dich_vu.png
    await page.goto('http://localhost:3005/khach-hang/quan-ly-thu-cung');
    await shot('trang thu cung dich vu.png', 5000);

    // 3. chi_tiet_thu_cung_dich_vu.png
    try {
        // Tìm card thú cưng đầu tiên trên trang quan-ly-thu-cung
        const firstPet = page.locator('div.glass-card, div[style*="cursor"], div.pet-card').first();
        await firstPet.click({ force: true, timeout: 5000 });
        await shot('chi tiet thu cung dich vu.png', 4000);
        await page.keyboard.press('Escape');
    } catch(e) {
        console.log('Loi chi tiet thu cung:', e.message);
    }

    // 4. chi_tiet_ho_so_benh_an_hoa_don.png
    await page.goto('http://localhost:3005/khach-hang/ho-so-benh-an');
    await page.waitForTimeout(4000);
    try {
        // Click vào dòng hoặc nút xem hồ sơ đầu tiên
        const firstRecord = page.locator('tr, div.glass-card, button:has-text("Chi tiết")').first();
        await firstRecord.click({ force: true, timeout: 5000 });
        await shot('chi tiet ho so benh an hoa don.png', 4000);
        await page.keyboard.press('Escape');
    } catch(e) {
        console.log('Loi chi tiet ho so:', e.message);
    }

    // 5. cap_nhat_thong_tin_tai_khoan.png
    await page.goto('http://localhost:3005/khach-hang/thong-tin-ca-nhan');
    await shot('cap nhat thong tin tai khoan.png', 5000);

    console.log('Chup lai hoan tat!');
});
