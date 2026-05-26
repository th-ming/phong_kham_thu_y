import { test, expect } from '@playwright/test';

// Thay đổi PORT tùy theo cấu hình Frontend hiện tại (3000, 3001 hoặc 5173)
const FRONTEND_PORT = 3005;
// Cổng Backend API (Mặc định là 8081)
const BACKEND_PORT = 8081;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử luồng Đăng nhập và Đăng ký hệ thống', () => {

    test.beforeEach(async ({ page }) => {
        // Mock các API ngoài / SMTP để kiểm thử UI mượt mà, độc lập
        await page.route('**/api/system/send-otp', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: "OTP sent successfully" })
        }));
        await page.route('**/api/auth/forgot-password-verify', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: "Verification success" })
        }));

        // Truy cập trang đăng nhập trước mỗi kịch bản test
        await page.goto(`${BASE_URL}/dang-nhap`);
    });

    // --- PHẦN 1: CHỨC NĂNG ĐĂNG NHẬP ---

    test('TC01: Đăng nhập Admin thành công và kiểm tra tính năng Ghi nhớ tài khoản', async ({ page }) => {
        // Điền thông tin đăng nhập Admin
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');

        // Tích chọn checkbox Ghi nhớ tài khoản
        await page.locator('input[type="checkbox"]').check();

        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // Xác nhận điều hướng vào Dashboard quản trị
        await expect(page).toHaveURL(/.*\/quan-ly\/dashboard/, { timeout: 10000 });

        // Kiểm tra dữ liệu được lưu sau khi quay lại trang login
        await page.goto(`${BASE_URL}/dang-nhap`);
        await expect(page.getByPlaceholder('Tên đăng nhập')).toHaveValue('admin');
    });

    test('TC02: Đăng nhập thất bại khi nhập sai mật khẩu', async ({ page }) => {
        await page.getByPlaceholder('Tên đăng nhập').fill('wrong_user');
        await page.getByPlaceholder('Mật khẩu').fill('wrong_pass_123');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // Kiểm tra thông báo lỗi hiển thị trên UI
        await expect(page.getByText('Sai tài khoản hoặc mật khẩu!')).toBeVisible({ timeout: 5000 });
    });

    test('TC03: Kiểm tra hiển thị và trạng thái nút Đăng nhập Google', async ({ page }) => {
        const googleBtn = page.locator('#googleBtn');
        await expect(googleBtn).toBeVisible();
        await expect(googleBtn).toBeEnabled();
    });

    // --- PHẦN 2: CHỨC NĂNG ĐĂNG KÝ ---

    test('TC04: Luồng đăng ký tài khoản khách hàng mới', async ({ page }) => {
        // Chuyển sang form đăng ký
        await page.getByText('Đăng ký ngay').click();

        // Tạo mã định danh duy nhất dựa trên thời gian thực
        const ts = Date.now();

        await page.getByPlaceholder('Họ và tên').fill('Automation Tester');
        await page.getByPlaceholder('Email').fill(`tester_${ts}@rexi.com`);
        // SỬA LỖI: Tạo số điện thoại ảo ngẫu nhiên để tránh lỗi 409 trùng lặp khách hàng
        await page.getByPlaceholder('Số điện thoại').fill(`09${ts.toString().slice(-8)}`);
        await page.getByPlaceholder('Địa chỉ').fill('123 Testing St, Hanoi');
        await page.getByPlaceholder('Tên đăng nhập').fill(`user_${ts}`);
        await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('Rexi@2026');
        await page.getByPlaceholder('Xác nhận mật khẩu').fill('Rexi@2026');

        await page.getByRole('button', { name: 'Đăng ký' }).click();

        // Kiểm tra thông báo thành công và chuyển hướng form
        await expect(page.getByText('Đăng ký thành công!')).toBeVisible({ timeout: 7000 });
        await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();
    });

    // --- PHẦN 3: CHỨC NĂNG QUÊN MẬT KHẨU ---

    test('TC05: Khôi phục mật khẩu qua phương thức gửi mã OTP Email', async ({ page }) => {
        await page.getByText('Quên mật khẩu?').click();
        await expect(page).toHaveURL(/.*\/quen-mat-khau/);

        // Lựa chọn tab xác minh qua OTP
        await page.getByText('Dùng mã OTP').click();

        await page.getByPlaceholder('Nhập Email để nhận mã OTP').fill('test_recovery@rexi.com');
        await page.getByRole('button', { name: 'GỬI MÃ OTP' }).click();

        // Kiểm tra thông báo nhắc kiểm tra hòm thư rác (Spam)
        await expect(page.getByText('Vui lòng kiểm tra hòm thư (bao gồm cả thư rác/Spam)!')).toBeVisible({ timeout: 10000 });

        // Xác nhận hiển thị trường nhập mã xác thực
        await expect(page.getByPlaceholder('Nhập 6 chữ số OTP')).toBeVisible();
    });

    test('TC06: Khôi phục mật khẩu qua phương thức Xác minh nhanh', async ({ page }) => {
        await page.getByText('Quên mật khẩu?').click();

        // Điền thông tin vào form Xác minh nhanh
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Số điện thoại đăng ký').fill('0981812345');
        await page.getByPlaceholder('Email đăng ký').fill('admin@rexi.com');

        await page.getByRole('button', { name: 'XÁC MINH NGAY' }).click();
    });

});