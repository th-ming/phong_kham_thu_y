import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử Trang Bảng điều khiển Admin (Dashboard)', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        // SỬA LỖI TIMEOUT: Chờ trang lưu Token xong mới test tiếp
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Kiểm tra các thành phần giao diện chính của Dashboard', async ({ page }) => {
        // 1. Kiểm tra tiêu đề chính
        await expect(page.getByText('Tổng quan hệ thống 📊')).toBeVisible();
        await expect(page.getByText(/Xin chào Admin/i)).toBeVisible();

        // 2. Kiểm tra 4 thẻ thống kê (Stats Cards)
        const statsCards = ['Khách Hàng', 'Lịch Hẹn Nay', 'Doanh Thu', 'Kho Thuốc'];
        for (const label of statsCards) {
            await expect(page.getByText(label)).toBeVisible();
        }

        // 3. Kiểm tra bảng "Lịch hẹn hôm nay"
        await expect(page.getByText('Lịch hẹn hôm nay')).toBeVisible();
        await expect(page.locator('table')).toBeVisible();

        // Kiểm tra các cột trong bảng
        const headers = ['GIỜ', 'BỆNH NHÂN', 'BÁC SĨ', 'TRẠNG THÁI'];
        for (const header of headers) {
            await expect(page.locator('table')).toContainText(header);
        }

        // 4. Kiểm tra mục "Cảnh báo kho"
        await expect(page.getByText('Cảnh báo kho')).toBeVisible();
    });

    test('TC02: Kiểm tra tính tương tác của Sidebar và Dashboard', async ({ page }) => {
        // 1. Click vào một mục khác trên Sidebar (VD: Quản lý lịch hẹn)
        await page.getByRole('link', { name: /Quản lý lịch hẹn/i }).click();
        await expect(page).toHaveURL(/.*\/quan-ly\/lich-hen/);

        // 2. Quay lại Dashboard từ Sidebar
        await page.getByRole('link', { name: /Bảng điều khiển/i }).click();
        await expect(page).toHaveURL(/.*\/quan-ly\/dashboard/);

        // 3. Kiểm tra nút "Tất cả" trong bảng lịch hẹn
        await page.getByRole('link', { name: 'Tất cả' }).click();
        await expect(page).toHaveURL(/.*\/quan-ly\/lich-hen/);
    });

    test('TC03: Kiểm tra hiệu ứng Responsive cơ bản', async ({ page }) => {
        // Thu nhỏ màn hình xuống kích thước mobile
        await page.setViewportSize({ width: 375, height: 667 });

        // Kiểm tra xem tiêu đề vẫn hiển thị (hoặc theo logic mobile của bạn)
        await expect(page.getByText('Tổng quan hệ thống 📊')).toBeVisible();

        // Kiểm tra xem Sidebar có bị ẩn hoặc chuyển thành menu mobile không 
        // (Tùy thuộc vào implementation của SidebarAdmin.tsx)
    });

});
