import { test, expect } from '@playwright/test';

// Thay đổi PORT tùy theo cấu hình Frontend hiện tại của sếp (3000, 3001 hoặc 5173)
const BASE_URL = 'http://localhost:3000';

test.describe('Kiểm thử E2E: Chức năng Đăng nhập / Đăng ký', () => {

    test.beforeEach(async ({ page }) => {
        // Truy cập vào trang đăng nhập trước mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);
    });

    test('TC01: Đăng nhập thất bại với thông tin không hợp lệ', async ({ page }) => {
        await page.getByPlaceholder('Tên đăng nhập').fill('invalid_user_123');
        await page.getByPlaceholder('Mật khẩu').fill('wrong_password');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // Kiểm tra UI có hiện thông báo lỗi từ backend không
        await expect(page.getByText('Sai tài khoản hoặc mật khẩu!')).toBeVisible({ timeout: 5000 });
    });

    test('TC02: Đăng nhập thành công với tài khoản hợp lệ', async ({ page }) => {
        // Sử dụng tài khoản admin được seed trong DataSeederController (admin/123456)
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('123456');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // Nếu là Admin, hệ thống sẽ điều hướng sang trang dashboard quản lý
        await expect(page).toHaveURL(/.*\/quan-ly\/dashboard/, { timeout: 10000 });
    });

    test('TC03: Đăng ký - Báo lỗi ngay lập tức khi xác nhận mật khẩu không khớp', async ({ page }) => {
        // Bấm chuyển sang form đăng ký
        await page.getByText('Đăng ký ngay').click();

        await page.getByPlaceholder('Họ và tên').fill('Nguyễn Văn A');
        await page.getByPlaceholder('Email').fill('nva@example.com');
        await page.getByPlaceholder('Số điện thoại').fill('0987654321');
        await page.getByPlaceholder('Địa chỉ').fill('Hà Nội');
        await page.getByPlaceholder('Tên đăng nhập').fill('nguyenvan_a');
        await page.getByPlaceholder('Mật khẩu').fill('Password@123');
        await page.getByPlaceholder('Xác nhận mật khẩu').fill('Password_Khac');

        await page.getByRole('button', { name: 'Đăng ký' }).click();

        // Lỗi này do Frontend tự bắt, không gọi API
        await expect(page.getByText('Mật khẩu xác nhận không khớp!')).toBeVisible();
    });

    test('TC04: Đăng ký thành công tài khoản khách hàng mới', async ({ page }) => {
        await page.getByText('Đăng ký ngay').click();

        // Tạo timestamp ngẫu nhiên để thông tin (Email/SĐT/Username) không bị trùng ở các lần chạy sau
        const timestamp = Date.now();

        await page.getByPlaceholder('Họ và tên').fill('Khách Hàng Test');
        await page.getByPlaceholder('Email').fill(`test_${timestamp}@example.com`);
        await page.getByPlaceholder('Số điện thoại').fill(`09${timestamp.toString().slice(-8)}`);
        await page.getByPlaceholder('Địa chỉ').fill('TP. Hồ Chí Minh');
        await page.getByPlaceholder('Tên đăng nhập').fill(`user_${timestamp}`);
        await page.getByPlaceholder('Mật khẩu').fill('Rexi@123');
        await page.getByPlaceholder('Xác nhận mật khẩu').fill('Rexi@123');

        await page.getByRole('button', { name: 'Đăng ký' }).click();

        // Sau khi đăng ký thành công, thông báo hiện lên và Form đổi về Đăng nhập
        await expect(page.getByText('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.')).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();
    });
});