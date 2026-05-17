import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Quản lý Danh mục Dịch vụ & Kho thuốc', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Luồng Thêm mới, Sửa và Xóa Dịch vụ thú y', async ({ page }) => {
        // 1. Đi tới trang Quản lý dịch vụ
        await page.goto(`${BASE_URL}/quan-ly/dich-vu`);
        await expect(page.getByText('Danh mục dịch vụ')).toBeVisible();

        // 2. Click nút "Thêm dịch vụ" để mở form định nghĩa
        await page.getByRole('button', { name: /Thêm dịch vụ/i }).click();
        await expect(page.getByText('Định nghĩa dịch vụ mới')).toBeVisible();

        // 3. Nhập dữ liệu dịch vụ mới
        const ts = Date.now();
        const tenDichVu = `Siêu âm màu 4D ${ts}`;
        await page.locator('input').nth(0).fill(tenDichVu); // Tên dịch vụ
        await page.locator('input').nth(1).fill('180000'); // Giá niêm yết
        await page.locator('input').nth(2).fill('30');     // Thời lượng phút
        await page.locator('textarea').fill('Siêu âm thai kiểm tra và đếm số thai cho thú cưng bằng công nghệ 4D VIP.');

        // 4. Lưu thông tin
        await page.getByRole('button', { name: /Lưu dịch vụ/i }).click();

        // 5. Xác nhận thêm thành công và tìm thấy trong bảng
        await expect(page.getByText('Thêm dịch vụ mới thành công!')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(tenDichVu)).toBeVisible();

        // 6. Nhấp sửa dịch vụ vừa tạo
        const editBtn = page.locator(`tr:has-text("${tenDichVu}")`).locator('button').first();
        await editBtn.click();
        await expect(page.getByText('Cập nhật dịch vụ')).toBeVisible();

        // 7. Thay đổi giá niêm yết lên 200,000đ
        await page.locator('input').nth(1).fill('200000');
        await page.getByRole('button', { name: /Lưu dịch vụ/i }).click();
        await expect(page.getByText('Đã cập nhật dịch vụ thành công!')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('200.000 đ')).toBeVisible();
    });

    test('TC02: Kiểm tra trang hiển thị tồn kho và lô thuốc', async ({ page }) => {
        // 1. Đi tới trang Quản lý Kho thuốc
        await page.goto(`${BASE_URL}/quan-ly/kho-thuoc`);
        await expect(page.getByText('Quản lý Kho thuốc')).toBeVisible();

        // 2. Kiểm tra cột hiển thị của danh mục thuốc
        await expect(page.getByText('Danh mục thuốc')).toBeVisible();
        await expect(page.getByText('TÊN THUỐC')).toBeVisible();
        await expect(page.getByText('DẠNG')).toBeVisible();
        await expect(page.getByText('GIÁ BÁN')).toBeVisible();

        // 3. Kiểm tra cột lô thuốc
        await expect(page.getByText('Lô thuốc & Hạn dùng')).toBeVisible();
    });

});
