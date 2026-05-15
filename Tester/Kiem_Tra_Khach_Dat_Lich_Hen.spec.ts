import { test, expect } from '@playwright/test';

// Thay đổi PORT tùy theo cấu hình Frontend hiện tại (3000, 3001 hoặc 5173)
const FRONTEND_PORT = 3001; 
// Cổng Backend API (Mặc định là 8081)
const BACKEND_PORT = 8081;  
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử luồng Đặt lịch hẹn dành cho Khách hàng', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập hệ thống trước khi thực hiện đặt lịch
        await page.goto(`${BASE_URL}/dang-nhap`);

        // Sử dụng tài khoản kiểm thử có sẵn trong cơ sở dữ liệu
        await page.getByPlaceholder('Tên đăng nhập').fill('test_user');
        await page.getByPlaceholder('Mật khẩu').fill('Rexi@123');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // Chờ điều hướng vào giao diện Khách hàng
        await expect(page).toHaveURL(/.*\/khach-hang\/dashboard/, { timeout: 10000 });
    });

    test('TC01: Đặt lịch hẹn thành công với đầy đủ thông tin bắt buộc', async ({ page }) => {
        // Truy cập vào trang đặt lịch
        await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`);
        await expect(page.locator('h1, h2').filter({ hasText: /Đặt lịch/i })).toBeVisible();

        // Lựa chọn thông tin Thú cưng
        const petSelect = page.getByLabel(/Thú cưng/i).or(page.locator('select').nth(0));
        await petSelect.selectOption({ index: 1 });

        // Lựa chọn loại Dịch vụ
        const serviceSelect = page.getByLabel(/Dịch vụ/i).or(page.locator('select').nth(1));
        await serviceSelect.selectOption({ index: 1 });

        // Lựa chọn Bác sĩ (nếu có)
        const doctorSelect = page.getByLabel(/Bác sĩ/i).or(page.locator('select').nth(2));
        if (await doctorSelect.isVisible()) {
            await doctorSelect.selectOption({ index: 1 });
        }

        // Chọn ngày hẹn (Ngày mai)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        await page.locator('input[type="date"]').fill(dateStr);

        // Chọn khung giờ khám
        const timeSelect = page.getByLabel(/Giờ/i).or(page.locator('select').nth(3));
        await timeSelect.selectOption({ index: 1 });

        // Điền thông tin ghi chú/triệu chứng
        await page.getByPlaceholder(/Ghi chú|Triệu chứng/i).fill('Khám sức khỏe tổng quát.');

        // Gửi yêu cầu đặt lịch
        await page.getByRole('button', { name: /Xác nhận|Đặt lịch/i }).click();

        // Xác nhận thông báo thành công từ hệ thống
        await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 5000 });
    });

    test('TC02: Kiểm tra lỗi ràng buộc khi để trống thông tin bắt buộc', async ({ page }) => {
        await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`);

        // Bấm đặt lịch khi chưa chọn thông tin
        await page.getByRole('button', { name: /Xác nhận|Đặt lịch/i }).click();
        
        // Đảm bảo không chuyển trang do lỗi validate
        await expect(page).toHaveURL(/.*\/khach-hang\/dat-lich-hen/);
    });

});