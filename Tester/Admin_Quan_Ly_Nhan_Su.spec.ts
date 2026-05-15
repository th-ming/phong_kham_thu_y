import { test, expect } from '@playwright/test';

// Thay đổi PORT tùy theo cấu hình Frontend hiện tại (3000, 3001 hoặc 5173)
const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử nâng cao: Quản lý Nhân sự & Xác minh Phân quyền', () => {

    test('TC01: Luồng thêm mới nhân sự và xác minh quyền đăng nhập', async ({ page }) => {
        // --- BƯỚC 1: ĐĂNG NHẬP ADMIN ĐỂ TẠO NHÂN SỰ ---
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        // SỬA LỖI TIMEOUT: Xóa dòng gọi URL quá sớm
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

        // --- BƯỚC 2: TẠO MỚI MỘT BÁC SĨ ---
        await page.goto(`${BASE_URL}/quan-ly/nhan-vien-phan-quyen`);
        await page.getByRole('button', { name: /Thêm nhân sự/i }).click();

        const ts = Date.now();
        const testEmail = `doctor_${ts}@rexi.com`;
        const testPass = 'Rexi@2024';
        const hoTen = `Bác sĩ Kiểm thử ${ts}`;

        await page.getByLabel(/HỌ VÀ TÊN/i).fill(hoTen);
        await page.locator('select').first().selectOption('Bác sĩ');
        // SỬA LỖI: Tự động tạo SĐT ngẫu nhiên để không bị báo trùng lặp
        await page.getByLabel(/SỐ ĐIỆN THOẠI/i).fill(`09${ts.toString().slice(-8)}`);
        await page.getByLabel(/EMAIL/i).fill(testEmail);

        // Nhập mật khẩu ban đầu (Trường mới thêm vào)
        await page.getByPlaceholder(/Nhập mật khẩu/i).fill(testPass);

        const today = new Date().toISOString().split('T')[0];
        await page.locator('input[type="date"]').fill(today);

        await page.getByRole('button', { name: /LƯU THÔNG TIN/i }).click();

        // Xác nhận thông báo thành công
        await expect(page.getByText('Đã thêm nhân sự mới!')).toBeVisible({ timeout: 10000 });

        // --- BƯỚC 3: ĐĂNG XUẤT VÀ ĐĂNG NHẬP BẰNG TÀI KHOẢN MỚI ---
        await page.goto(`${BASE_URL}/dang-nhap`);

        // Tên đăng nhập được hệ thống tự sinh từ phần trước @ của Email
        const username = testEmail.split('@')[0];
        await page.getByPlaceholder('Tên đăng nhập').fill(username);
        await page.getByPlaceholder('Mật khẩu').fill(testPass);
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // --- BƯỚC 4: XÁC MINH QUYỀN TRUY CẬP CỦA BÁC SĨ ---
        // Bác sĩ cũng vào được trang quản lý nhưng sẽ bị giới hạn module (nếu hệ thống đã cấu hình)
        await expect(page).toHaveURL(/.*\/quan-ly\/dashboard/, { timeout: 10000 });

        // Kiểm tra xem Bác sĩ có thấy mục "Nhân sự & Phân quyền" không (Lẽ ra là KHÔNG ĐƯỢC THẤY)
        const staffMenu = page.locator('text=Nhân sự & Phân quyền');
        await expect(staffMenu).not.toBeVisible();
    });

    test('TC02: Kiểm tra chức năng Lọc và Chỉnh sửa thông tin', async ({ page }) => {
        // Đăng nhập Admin
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

        await page.goto(`${BASE_URL}/quan-ly/nhan-vien-phan-quyen`);

        // Thử lọc danh sách
        await page.locator('select').first().selectOption('Kế toán');
        await page.waitForTimeout(500);

        // Thử mở Modal sửa thông tin
        const editBtn = page.locator('button:has-text("Sửa")').first();
        if (await editBtn.isVisible()) {
            await editBtn.click();
            await expect(page.getByText(/Cập nhật nhân viên/i)).toBeVisible();
            // Xác nhận ô mật khẩu KHÔNG hiển thị khi sửa
            await expect(page.getByPlaceholder(/Nhập mật khẩu/i)).not.toBeVisible();
        }
    });

});
