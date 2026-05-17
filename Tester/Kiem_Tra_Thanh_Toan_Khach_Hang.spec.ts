import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Cổng Khách hàng - Hóa đơn & VietQR', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập tài khoản Khách hàng trước mỗi ca kiểm thử
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('khachhang1');
        await page.getByPlaceholder('Mật khẩu').fill('khachhang@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Giao diện Hóa đơn khách hàng và bộ lọc trạng thái', async ({ page }) => {
        // 1. Điều hướng sang trang Hóa đơn & Thanh toán trong cổng khách hàng
        await page.goto(`${BASE_URL}/khach-hang/hoa-don-thanh-toan`);
        await expect(page.getByRole('heading', { name: 'Hóa đơn & Thanh toán' })).toBeVisible();

        // 2. Kiểm tra sự hiện diện của các khối thống kê chi tiêu
        await expect(page.getByText('TỔNG HÓA ĐƠN')).toBeVisible();
        await expect(page.getByText('ĐÃ THANH TOÁN')).toBeVisible();
        await expect(page.getByText('ĐANG CHỜ')).toBeVisible();
        await expect(page.getByText('TỔNG CHI TIÊU')).toBeVisible();

        // 3. Kiểm tra thanh tìm kiếm và bộ lọc hóa đơn
        const filterSelect = page.locator('select').first();
        await expect(filterSelect).toBeVisible();
        await filterSelect.selectOption('cho_thanh_toan'); // Lọc hóa đơn chờ trả
    });

    test('TC02: Thanh toán chuyển khoản tự động qua VietQR', async ({ page }) => {
        // 1. Điều hướng sang trang Hóa đơn & Thanh toán
        await page.goto(`${BASE_URL}/khach-hang/hoa-don-thanh-toan`);

        // 2. Tìm nút thanh toán VietQR của hóa đơn đầu tiên đang chờ trả (nếu có)
        const qrPaymentBtn = page.getByRole('button', { name: /VietQR/i }).first();
        if (await qrPaymentBtn.isVisible()) {
            await qrPaymentBtn.click();

            // 3. Xác nhận Modal Quét Mã VietQR xuất hiện đầy đủ
            await expect(page.getByText('Thanh toán chuyển khoản')).toBeVisible();
            await expect(page.getByText('NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)')).toBeVisible();

            // 4. Nhấn đóng modal quét mã
            await page.getByRole('button', { name: 'Đóng' }).click();
            await expect(page.getByText('Thanh toán chuyển khoản')).not.toBeVisible();
        }
    });

});
