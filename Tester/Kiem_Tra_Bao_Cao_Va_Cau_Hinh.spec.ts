import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Báo cáo Thống kê & Cấu hình Hệ thống', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi kịch bản test
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Kiểm tra trang phân tích doanh thu & xuất file báo cáo', async ({ page }) => {
        // 1. Đi tới trang Phân tích & Báo cáo
        await page.goto(`${BASE_URL}/quan-ly/bao-cao`);
        await expect(page.getByText('Phân tích & Báo cáo')).toBeVisible();

        // 2. Xác nhận sự hiển thị của các biểu đồ
        await expect(page.getByText('Xu hướng doanh thu')).toBeVisible();
        await expect(page.getByText('Doanh thu 7 ngày qua')).toBeVisible();
        await expect(page.getByText('Tỷ lệ thú cưng')).toBeVisible();
        await expect(page.getByText('Hiệu suất đội ngũ')).toBeVisible();

        // 3. Kiểm tra tính năng in báo cáo và xuất báo cáo ra Excel
        const printBtn = page.getByRole('button', { name: /In Báo Cáo/i });
        const excelBtn = page.getByRole('button', { name: /Xuất Excel/i });
        await expect(printBtn).toBeVisible();
        await expect(excelBtn).toBeVisible();
    });

    test('TC02: Kiểm tra trang Cấu hình và Tính năng Sao lưu cơ sở dữ liệu', async ({ page }) => {
        // 1. Đi tới trang Cấu hình hệ thống
        await page.goto(`${BASE_URL}/quan-ly/cau-hinh`);
        await expect(page.getByText('Cấu hình hệ thống')).toBeVisible();

        // 2. Kiểm tra phần sao lưu cơ sở dữ liệu
        await expect(page.getByText('Sao lưu Dữ liệu')).toBeVisible();
        await expect(page.getByText('Quản lý Bản sao lưu')).toBeVisible();

        // 3. Kiểm tra nhật ký hoạt động của nhân viên (Audit Log)
        await expect(page.getByText('Nhật ký hoạt động (Audit Log)')).toBeVisible();
    });

});
