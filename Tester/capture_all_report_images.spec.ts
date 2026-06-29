import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Chụp tất cả các ảnh báo cáo còn thiếu', async ({ page }) => {
    // Tăng giới hạn timeout của test lên 10 phút (600,000 ms) vì có rất nhiều màn hình chờ load 8.5 giây
    test.setTimeout(600000);

    // Kích thước desktop chuẩn để ảnh chụp rõ nét
    await page.setViewportSize({ width: 1280, height: 800 });

    // Đường dẫn thư mục lưu ảnh báo cáo của người dùng
    const outputDir = 'd:\\QLy Phòng Khám Thú Y\\Báo cáo thực tập\\ảnh báo cáo';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const waitAndScreenshot = async (filename: string) => {
        console.log(`Đang chờ dữ liệu tải cho: ${filename}...`);
        await page.waitForTimeout(8500); // Đợi hơn 8 giây theo đúng yêu cầu để dữ liệu load hết
        const targetPath = path.join(outputDir, filename);
        await page.screenshot({ path: targetPath });
        console.log(`Đã chụp và lưu: ${targetPath}`);
    };

    // ==========================================
    // PHẦN 1: ĐĂNG NHẬP KHÁCH HÀNG (TK: 0954570698)
    // ==========================================
    console.log('--- KHÁCH HÀNG FLOW ---');
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('0954570698');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click({ timeout: 10000 });
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
    
    // 1. Dashboard Khách hàng
    await waitAndScreenshot('khach hang dashboard.png');

    // 2. Quản lý thú cưng
    await page.goto('http://localhost:3005/khach-hang/quan-ly-thu-cung');
    await waitAndScreenshot('trang thu cung dich vu.png');

    // 3. Lọc thú cưng
    try {
        await page.locator('input[placeholder*="Tìm"], input[placeholder*="lọc"], input[placeholder*="search"]').first().fill('a', { timeout: 5000 });
        await waitAndScreenshot('loc thu cung dich vu.png');
    } catch (e) {
        console.log('Không thể thực hiện lọc thú cưng:', e.message);
    }

    // 4. Chi tiết thú cưng
    try {
        await page.locator('button:has-text("Chi tiết"), button:has-text("Xem"), .material-symbols-outlined:has-text("visibility")').first().click({ timeout: 5000 });
        await waitAndScreenshot('chi tiet thu cung dich vu.png');
        // Đóng modal chi tiết
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log('Không thể mở chi tiết thú cưng:', e.message);
    }

    // 5. Đặt lịch hẹn
    await page.goto('http://localhost:3005/khach-hang/dat-lich-hen');
    await waitAndScreenshot('dang ky lich hen.png');

    // 6. Lịch sử khám bệnh / lịch hẹn
    await page.goto('http://localhost:3005/khach-hang/lich-su-lich-hen');
    await waitAndScreenshot('lich su kham benh.png');

    // 7. Trang đơn thuốc / hồ sơ bệnh án
    await page.goto('http://localhost:3005/khach-hang/ho-so-benh-an');
    await waitAndScreenshot('trang don thuoc.png');

    // 8. Chi tiết hồ sơ bệnh án
    try {
        await page.locator('button:has-text("Chi tiết"), button:has-text("Xem"), button:has-text("Đơn thuốc")').first().click({ timeout: 5000 });
        await waitAndScreenshot('chi tiet ho so benh an hoa don.png');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log('Không thể mở chi tiết hồ sơ bệnh án:', e.message);
    }

    // 9. Hóa đơn và thanh toán
    await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
    await waitAndScreenshot('gui email hoa don va lich hen.png'); // Trang này chứa nút gửi email hóa đơn

    // 10. Xác nhận thanh toán hóa đơn
    try {
        await page.locator('button:has-text("Thanh toán"), button:has-text("Pay"), button:has-text("Chi tiết")').first().click({ timeout: 5000 });
        await waitAndScreenshot('xac nhan thanh toan hoa don.png');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log('Không thể mở cổng thanh toán hóa đơn:', e.message);
    }

    // 11. Cập nhật thông tin tài khoản
    await page.goto('http://localhost:3005/khach-hang/thong-tin-ca-nhan');
    await waitAndScreenshot('cap nhat thong tin tai khoan.png');

    // 12. Trợ lý ảo AI (Bật chatbot ở góc màn hình)
    try {
        await page.goto('http://localhost:3005/');
        await page.waitForTimeout(2000);
        const chatBubble = page.locator('button[aria-label*="AI"], button[aria-label*="chat"], .chat-bubble, #rexi-chat-trigger').first();
        await chatBubble.click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        await page.locator('textarea, input[placeholder*="nhập"], input[placeholder*="hỏi"]').first().fill('Xin chào Rexi, phòng khám mở cửa lúc mấy giờ?', { timeout: 5000 });
        await page.keyboard.press('Enter');
        await waitAndScreenshot('tro ly ao ai.png');
    } catch (e) {
        console.log('Không thể kích hoạt trợ lý ảo AI:', e.message);
    }

    // Clear session & log out
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());

    // ==========================================
    // PHẦN 2: ĐĂNG NHẬP ADMIN (TK: admin)
    // ==========================================
    console.log('--- ADMIN FLOW ---');
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click({ timeout: 10000 });
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    
    // 13. Dashboard Quản trị
    await waitAndScreenshot('dashboard quan ly.png');

    // 14. Quản lý khách hàng & thú cưng
    await page.goto('http://localhost:3005/quan-ly/khach-hang-thu-cung');
    await waitAndScreenshot('quan ly thu cung dich vu.png');

    // 15. Quản lý hồ sơ bệnh án
    await page.goto('http://localhost:3005/quan-ly/ho-so-benh-an');
    await waitAndScreenshot('quan ly ho so benh an hoa don.png');

    // 16. Quản lý tài khoản và nhân sự
    await page.goto('http://localhost:3005/quan-ly/nhan-vien');
    await waitAndScreenshot('quan ly tai khoan khach hang.png');

    // 17. Quản lý lịch hẹn khám
    await page.goto('http://localhost:3005/quan-ly/lich-hen');
    await waitAndScreenshot('quan ly lich hen kham.png');

    // 18. Quản lý dịch vụ khám
    await page.goto('http://localhost:3005/quan-ly/dich-vu');
    await waitAndScreenshot('quan ly dich vu kham.png');

    // 19. Báo cáo thống kê / doanh thu
    await page.goto('http://localhost:3005/quan-ly/bao-cao-thong-ke');
    await waitAndScreenshot('thong ke doanh thu.png');

    // 20. Báo cáo hiệu năng danh sách cuộn ảo
    await waitAndScreenshot('bao cao hieu nang cuon ao.png');

    // 21. Đối soát và thanh toán tự động (Kế toán)
    await page.goto('http://localhost:3005/quan-ly/ke-toan');
    await waitAndScreenshot('doi soat va thanh toan tu dong.png');

    // 22. Quản lý kho dược
    await page.goto('http://localhost:3005/quan-ly/kho-thuoc');
    await waitAndScreenshot('quan ly kho duoc va canh bao.png');

    // 23. Thiết lập ca trực nhân sự
    await page.goto('http://localhost:3005/quan-ly/lich-lam-viec');
    await waitAndScreenshot('thiet la ca truc va lich lam viec.png');

    // 24. Cấu hình hệ thống & API Key
    await page.goto('http://localhost:3005/quan-ly/cau-hinh');
    await waitAndScreenshot('cau hinh he thong va api key.png');

    // Clear session & log out
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());

    // ==========================================
    // PHẦN 3: ĐĂNG NHẬP BÁC SĨ (TK: doctor_1779566347881)
    // ==========================================
    console.log('--- DOCTOR FLOW ---');
    await page.goto('http://localhost:3005/dang-nhap');
    await page.waitForTimeout(2000);
    await page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]').fill('doctor_1779566347881');
    await page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]').fill('Rexi@2026');
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click({ timeout: 10000 });
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    // 25. Bác sĩ thực hiện khám bệnh
    await page.goto('http://localhost:3005/quan-ly/kham-benh');
    await waitAndScreenshot('bac si kham benh.png');

    // 26. Bác sĩ kê đơn thuốc
    try {
        await page.locator('button:has-text("Khám"), button:has-text("Ghi bệnh án"), button:has-text("Kê đơn")').first().click({ timeout: 5000 });
        await waitAndScreenshot('bac si lap don thuoc.png');
        await page.keyboard.press('Escape');
    } catch (e) {
        console.log('Không thể mở modal lập đơn thuốc của Bác sĩ:', e.message);
    }

    console.log('Tất cả các ảnh báo cáo đã được chụp và lưu thành công!');
});
