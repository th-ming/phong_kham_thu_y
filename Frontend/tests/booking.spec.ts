import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Kiểm thử E2E: Chức năng Đặt lịch hẹn Khách hàng', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập với tài khoản khách hàng trước khi chạy mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);

        // Sếp có thể đổi thông tin tài khoản này thành tài khoản test có sẵn trong DB
        await page.getByPlaceholder('Tên đăng nhập').fill('test_user');
        await page.getByPlaceholder('Mật khẩu').fill('Rexi@123');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // Chờ điều hướng thành công vào dashboard khách hàng
        await expect(page).toHaveURL(/.*\/khach-hang\/dashboard/, { timeout: 10000 });
    });

    test('TC01: Đặt lịch hẹn thành công với thông tin đầy đủ', async ({ page }) => {
        // 1. Vào trang đặt lịch
        await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`);
        await expect(page.locator('h1, h2').filter({ hasText: /Đặt lịch/i })).toBeVisible();

        // 2. Chọn Thú cưng (chọn option đầu tiên sau phần placeholder)
        const petSelect = page.getByLabel(/Thú cưng/i).or(page.locator('select').nth(0));
        await petSelect.selectOption({ index: 1 });

        // 3. Chọn Dịch vụ
        const serviceSelect = page.getByLabel(/Dịch vụ/i).or(page.locator('select').nth(1));
        await serviceSelect.selectOption({ index: 1 });

        // 4. Chọn Bác sĩ (Nếu có select bác sĩ thì chọn, không thì bỏ qua)
        const doctorSelect = page.getByLabel(/Bác sĩ/i).or(page.locator('select').nth(2));
        if (await doctorSelect.isVisible()) {
            await doctorSelect.selectOption({ index: 1 });
        }

        // 5. Chọn Ngày hẹn (Sẽ chọn ngày mai để chắc chắn có giờ trống)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        await page.locator('input[type="date"]').fill(dateStr);

        // 6. Chọn Giờ hẹn
        const timeSelect = page.getByLabel(/Giờ/i).or(page.locator('select').nth(3));
        await timeSelect.selectOption({ index: 1 });

        // 7. Ghi chú
        await page.getByPlaceholder(/Ghi chú|Triệu chứng/i).fill('Khám tổng quát cho bé, bé dạo này hơi biếng ăn.');

        // 8. Bấm Đặt lịch
        await page.getByRole('button', { name: /Xác nhận|Đặt lịch/i }).click();

        // 9. Kiểm tra hiển thị thông báo thành công và chuyển hướng
        await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 5000 });
    });

    test('TC02: Đặt lịch thất bại nếu bỏ trống thông tin bắt buộc', async ({ page }) => {
        await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`);

        await page.getByRole('button', { name: /Xác nhận|Đặt lịch/i }).click();
        await expect(page).toHaveURL(/.*\/khach-hang\/dat-lich-hen/); // Đảm bảo vẫn ở lại trang đặt lịch do lỗi
    });
});