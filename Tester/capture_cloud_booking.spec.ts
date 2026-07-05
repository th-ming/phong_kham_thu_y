import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Chụp ảnh màn hình đặt lịch hẹn online trên cloud', async ({ page }) => {
    // Kích thước desktop chuẩn để ảnh chụp rõ nét, lộng lẫy
    await page.setViewportSize({ width: 1280, height: 800 });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('response', async res => {
        if (res.status() >= 400) {
            console.log(`API FAILED: ${res.url()} -> status=${res.status()}`);
            try {
                console.log(`API ERROR BODY: ${await res.text()}`);
            } catch (e) {}
        }
    });

    // Thư mục lưu artifacts của hội thoại hiện tại
    const artifactDir = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\9d838657-7fcb-4299-9fb5-288fb554bf21';

    console.log('1. Truy cập trang đăng nhập cloud...');
    await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('2. Điền thông tin đăng nhập...');
    await page.getByPlaceholder('Tên đăng nhập').fill('khachhang');
    await page.getByPlaceholder('Mật khẩu').fill('khachhang@rexi.com');
    
    console.log('3. Bấm đăng nhập...');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

    // Chờ điều hướng vào dashboard khách hàng
    await page.waitForURL('**/khach-hang/dashboard', { timeout: 35000 });
    console.log('Đã đăng nhập Khách hàng thành công.');
    await page.waitForTimeout(2000);

    // Vào trang đặt lịch hẹn
    console.log('4. Vào trang đặt lịch hẹn...');
    await page.goto('https://rexi-vet-clinic.vercel.app/khach-hang/dat-lich-hen', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Chọn thú cưng (option đầu tiên)
    console.log('5. Chọn thú cưng...');
    const petSelect = page.locator('select').first();
    await petSelect.waitFor({ state: 'visible', timeout: 10000 });
    await petSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Chọn dịch vụ đầu tiên
    console.log('6. Chọn dịch vụ...');
    const serviceCard = page.locator('.service-card-select').first();
    await serviceCard.waitFor({ state: 'visible', timeout: 5000 });
    await serviceCard.click();
    await page.waitForTimeout(1000);

    // Điền ngày khám (dùng ngày xa trong tương lai để có slot trống)
    // Tính ngày sau 7 ngày từ hôm nay để tránh slot đã đầy
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`7. Điền ngày khám: ${dateStr}`);
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(dateStr);
    
    // Đợi API /api/gio-ranh và /api/bac-si trả về - cho phép tới 8 giây
    console.log('8. Đợi hệ thống load slot giờ khám...');
    await page.waitForTimeout(4000);

    // Kiểm tra bác sĩ có load không (tùy chọn - không bắt buộc)
    const doctorSelect = page.locator('select[data-ai-id="dropdown_doctor"]');
    const doctorCount = await doctorSelect.locator('option').count();
    console.log(`Số lựa chọn bác sĩ: ${doctorCount}`);
    
    // Kiểm tra slot giờ có xuất hiện không
    const slots = page.locator('.customer-booking-slots button, button[data-ai-id*="slot"]');
    const slotCount = await slots.count();
    console.log(`Số slot giờ khả dụng: ${slotCount}`);

    // Chụp màn hình giao diện đặt lịch - chụp dù có slot hay không
    console.log('9. Chụp màn hình toàn bộ trang...');
    const bookingImgPath = path.join(artifactDir, 'screenshot_cloud_booking.png');
    await page.screenshot({ path: bookingImgPath, fullPage: true });
    console.log(`Đã chụp ảnh: ${bookingImgPath}`);

    // Log trạng thái cuối
    if (slotCount > 0) {
        console.log(`✅ THÀNH CÔNG: Trang đặt lịch hoạt động tốt - có ${slotCount} slot giờ khả dụng`);
    } else {
        console.log(`⚠️  Không có slot giờ - có thể chưa có ca trực cho ngày ${dateStr}`);
        // Log DOM trạng thái để debug
        const pageContent = await page.locator('[class*="booking-slots"], [class*="slot"]').allTextContents();
        console.log('Slot area content:', pageContent);
    }
});
