import { test } from '@playwright/test';
import * as path from 'path';

test('Chup lai cac anh admin chua chatbot bi loi font', async ({ page }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const OUT = 'd:\\QLy Ph\u00f2ng Kh\u00e1m Th\u00fa Y\\B\u00e1o c\u00e1o th\u1ef1c t\u1eadp\\\u1ea3nh b\u00e1o c\u00e1o';

    const shot = async (name, ms = 4000) => {
        await page.waitForTimeout(ms);
        await page.screenshot({ path: path.join(OUT, name) });
        console.log('Da chup: ' + name);
    };

    // Đăng nhập Admin
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    await page.waitForURL('**/quan-ly/dashboard', { timeout: 20000 });
    console.log('Login Admin OK!');

    // 1. doi_soat_va_thanh_toan_tu_dong.png (Kế toán dashboard)
    await page.goto('http://localhost:3005/quan-ly/ke-toan');
    await shot('doi soat va thanh toan tu dong.png', 5000);

    // 2. thong_ke_doanh_thu.png (Báo cáo & thống kê)
    await page.goto('http://localhost:3005/quan-ly/bao-cao-thong-ke');
    await shot('thong ke doanh thu.png', 5000);

    // 3. quan_ly_kho_duoc_va_canh_bao.png (Kho dược)
    await page.goto('http://localhost:3005/quan-ly/kho-thuoc');
    await shot('quan ly kho duoc va canh bao.png', 5000);

    // 4. thiet_la_ca_truc_va_lich_lam_viec.png (Lịch làm việc)
    await page.goto('http://localhost:3005/quan-ly/lich-lam-viec');
    await shot('thiet la ca truc va lich lam viec.png', 5000);

    // 5. quan_ly_ho_so_benh_an_hoa_don.png (Quản lý hồ sơ bệnh án)
    await page.goto('http://localhost:3005/quan-ly/ho-so-benh-an');
    await shot('quan ly ho so benh an hoa don.png', 5000);

    // 6. quan_ly_dich_vu_kham.png (Quản lý dịch vụ)
    await page.goto('http://localhost:3005/quan-ly/dich-vu');
    await shot('quan ly dich vu kham.png', 5000);

    // 7. quan_ly_thu_cung_dich_vu.png (Khách hàng & thú cưng)
    await page.goto('http://localhost:3005/quan-ly/khach-hang-thu-cung');
    await shot('quan ly thu cung dich vu.png', 5000);

    console.log('Chup lai cac anh admin hoan tat!');
});
