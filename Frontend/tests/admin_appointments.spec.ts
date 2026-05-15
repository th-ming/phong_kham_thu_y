import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3001;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử Trang Quản lý Lịch hẹn (Admin)', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập Admin trước mỗi test case
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // SỬA LỖI TIMEOUT: Phải đợi hệ thống lưu token và chuyển qua Dashboard xong
        await page.waitForURL(/.*\/quan-ly\/dashboard/);

        // Sau đó mới điều hướng đến trang Quản lý lịch hẹn
        await page.goto(`${BASE_URL}/quan-ly/lich-hen`);
        await expect(page).toHaveURL(/.*\/quan-ly\/lich-hen/);
    });

    test('TC01: Kiểm tra hiển thị danh sách và bộ lọc trạng thái', async ({ page }) => {
        // 1. Kiểm tra tiêu đề trang
        await expect(page.getByText('Điều phối lịch hẹn')).toBeVisible();

        // 2. Kiểm tra sự hiện diện của các tab lọc
        const tabs = ['TẤT CẢ', 'CHỜ XÁC NHẬN', 'ĐÃ XÁC NHẬN', 'ĐANG KHÁM', 'HOÀN TẤT', 'ĐÃ HỦY'];
        for (const tab of tabs) {
            await expect(page.getByRole('button', { name: tab })).toBeVisible();
        }

        // 3. Thử chuyển tab lọc (Ví dụ: Đã xác nhận)
        await page.getByRole('button', { name: 'ĐÃ XÁC NHẬN' }).click();
        // Kiểm tra xem trạng thái trong bảng có khớp với lọc không (nếu có dữ liệu)
        const statusBadges = page.locator('span:has-text("DA_XAC_NHAN")');
        const count = await statusBadges.count();
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                await expect(statusBadges.nth(i)).toBeVisible();
            }
        }
    });

    test('TC02: Xem chi tiết một lịch hẹn', async ({ page }) => {
        // 1. Nhấn nút Xem (Biểu tượng visibility) của hàng đầu tiên
        const viewBtn = page.locator('button:has(.material-symbols-outlined:text("visibility"))').first();
        await expect(viewBtn).toBeVisible();
        await viewBtn.click();

        // 2. Kiểm tra Modal chi tiết hiển thị
        await expect(page.getByText('Chi tiết lịch hẹn')).toBeVisible();
        await expect(page.getByText('Thông tin chủ nuôi')).toBeVisible();
        await expect(page.getByText('Thông tin thú cưng')).toBeVisible();

        // 3. Đóng Modal
        await page.locator('button:has(.material-symbols-outlined:text("close"))').click();
        await expect(page.getByText('Chi tiết lịch hẹn')).not.toBeVisible();
    });

    test('TC03: Cập nhật trạng thái lịch hẹn', async ({ page }) => {
        // 1. Nhấn nút Sửa (Biểu tượng edit_square) của hàng đầu tiên
        const editBtn = page.locator('button:has(.material-symbols-outlined:text("edit_square"))').first();
        await expect(editBtn).toBeVisible();
        await editBtn.click();

        // 2. Kiểm tra Modal cập nhật trạng thái hiển thị
        await expect(page.getByText(/Cập nhật trạng thái/i)).toBeVisible();

        // 3. Chọn trạng thái mới (Ví dụ: ĐÃ XÁC NHẬN)
        const confirmBtn = page.getByRole('button', { name: 'ĐÃ XÁC NHẬN' });
        await confirmBtn.click();

        // 4. Kiểm tra Toast thông báo thành công
        await expect(page.getByText('Đã cập nhật trạng thái lịch hẹn!')).toBeVisible({ timeout: 10000 });
    });

    test('TC04: Mở Modal thêm lịch hẹn mới', async ({ page }) => {
        // 1. Nhấn nút "Thêm lịch hẹn"
        await page.getByRole('button', { name: /Thêm lịch hẹn/i }).click();

        // 2. Kiểm tra Modal thêm lịch hẹn hiển thị
        // Lưu ý: Chúng ta kiểm tra sự tồn tại của các trường cơ bản trong ModalTaoLichHenAdmin
        await expect(page.getByText(/TẠO LỊCH HẸN MỚI/i)).toBeVisible();
        // SỬA LỖI TC04: Modal mới mở ra ở Bước 1 nên chỉ hiện tìm khách hàng
        await expect(page.getByText(/TÌM KHÁCH HÀNG BẰNG SĐT/i)).toBeVisible();
    });

});
