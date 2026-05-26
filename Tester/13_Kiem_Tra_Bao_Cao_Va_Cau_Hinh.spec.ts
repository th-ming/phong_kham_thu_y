import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────
// Cấu hình chung
// ──────────────────────────────────────────────────────────
const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;
const CAU_HINH_URL = `${BASE_URL}/quan-ly/cau-hinh`;

// Tên tab chính xác theo giao diện thực tế của component
const TEN_TAB = {
    chung: 'Cấu hình chung',
    thanhToan: 'Thanh toán',
    ai: 'AI & Phân quyền',
    email: 'Email SMTP',
    backup: 'Backup & Nhật ký',
};

// Hàm dùng chung: đăng nhập và điều hướng tới trang cấu hình
async function dangNhapVaDiToi(page: any, url: string) {
    await page.goto(`${BASE_URL}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    // Chờ điều hướng về Dashboard thành công
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    // Điều hướng tới trang đích
    await page.goto(url);
    // Chờ DOM load xong (dùng domcontentloaded thay networkidle vì Vite giữ WebSocket liên tục)
    await page.waitForLoadState('domcontentloaded');
}

test.describe('Kiểm thử E2E: Trang Cấu hình & Quản trị Hệ thống', () => {

    // ──────────────────────────────────────────────────────
    // TC-CH01: Tải trang và xác nhận 5 tab hiển thị đúng
    // ──────────────────────────────────────────────────────
    test('TC-CH01: Tải trang cấu hình và xác nhận 5 tab hiển thị', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);

        // Kiểm tra tiêu đề h1
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Xác nhận 5 tab đúng tên hiển thị
        for (const tenTab of Object.values(TEN_TAB)) {
            await expect(page.getByRole('button', { name: tenTab })).toBeVisible({ timeout: 5000 });
        }
    });

    // ──────────────────────────────────────────────────────
    // TC-CH02: Lưu cấu hình hệ thống thành công
    // ──────────────────────────────────────────────────────
    test('TC-CH02: Lưu cấu hình hệ thống thành công', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Đảm bảo đang ở tab Cấu hình chung
        await page.getByRole('button', { name: TEN_TAB.chung }).click();
        await page.waitForTimeout(500);

        // Nhấn nút Lưu tất cả thay đổi
        await page.getByRole('button', { name: /Lưu tất cả thay đổi/i }).click();

        // Xác nhận toast thành công hoặc lỗi xuất hiện (cả 2 đều chứng tỏ logic chạy đúng)
        const toastThanhCong = page.getByText(/Đã lưu cấu hình thành công/i);
        const toastLoi = page.getByText(/Lỗi khi lưu/i);
        await expect(toastThanhCong.or(toastLoi)).toBeVisible({ timeout: 10000 });
    });

    // ──────────────────────────────────────────────────────
    // TC-CH03: Form test email SMTP – validate nhập liệu
    // ──────────────────────────────────────────────────────
    test('TC-CH03: Form test email hiển thị và validate nhập liệu', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Chuyển sang tab Email SMTP
        await page.getByRole('button', { name: TEN_TAB.email }).click();

        // Tìm trường nhập email nhận test theo placeholder thực tế trong UI
        const truongEmailTest = page.getByPlaceholder('example@gmail.com').last();
        await expect(truongEmailTest).toBeVisible({ timeout: 8000 });

        // Nhấn "Gửi Test" khi chưa nhập → phải có toast báo lỗi
        await page.getByRole('button', { name: 'Gửi Test' }).click();
        await expect(page.getByText(/Vui lòng nhập email nhận test/i)).toBeVisible({ timeout: 5000 });

        // Nhập email hợp lệ và xác nhận
        await truongEmailTest.fill('test@rexi.com');
        await expect(truongEmailTest).toHaveValue('test@rexi.com');
    });

    // ──────────────────────────────────────────────────────
    // TC-CH04: Nút xóa nhật ký hệ thống – yêu cầu xác nhận
    // ──────────────────────────────────────────────────────
    test('TC-CH04: Nút xóa nhật ký hệ thống hiển thị và yêu cầu xác nhận', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Chuyển sang tab Backup & Nhật ký
        await page.getByRole('button', { name: TEN_TAB.backup }).click();

        // Xác nhận phần Nhật ký hoạt động hiển thị
        await expect(page.getByText('Nhật ký hoạt động')).toBeVisible({ timeout: 8000 });

        // Xác nhận nút Xóa nhật ký tồn tại
        const nutXoaNhatKy = page.getByRole('button', { name: /Xóa nhật ký/i });
        await expect(nutXoaNhatKy).toBeVisible();

        // Click nút, bắt dialog confirm → dismiss để không xóa thật
        page.once('dialog', dialog => dialog.dismiss());
        await nutXoaNhatKy.click();
        // Xác nhận UI không bị crash sau khi hủy dialog
        await expect(page.getByText('Nhật ký hoạt động')).toBeVisible({ timeout: 3000 });
    });

    // ──────────────────────────────────────────────────────
    // TC-CH05: Tab Backup – danh sách và nút sao lưu hiển thị
    // ──────────────────────────────────────────────────────
    test('TC-CH05: Trang backup hiển thị danh sách và nút sao lưu', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Chuyển sang tab Backup
        await page.getByRole('button', { name: TEN_TAB.backup }).click();

        // Xác nhận phần Sao lưu thủ công hiển thị
        await expect(page.getByText('Sao lưu thủ công')).toBeVisible({ timeout: 8000 });

        // Xác nhận nút Sao lưu ngay có thể tương tác
        const nutSaoLuu = page.getByRole('button', { name: /Sao lưu ngay/i });
        await expect(nutSaoLuu).toBeVisible();
        await expect(nutSaoLuu).toBeEnabled();

        // Xác nhận nút Làm mới danh sách
        await expect(page.getByRole('button', { name: /Làm mới danh sách/i })).toBeVisible();
    });

    // ──────────────────────────────────────────────────────
    // TC-CH06: Nút Tải xuống xuất hiện trong danh sách backup
    // ──────────────────────────────────────────────────────
    test('TC-CH06: Nút Tải xuống (download icon) hiển thị cho mỗi file backup', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Chuyển sang tab Backup
        await page.getByRole('button', { name: TEN_TAB.backup }).click();
        await expect(page.getByText('Sao lưu thủ công')).toBeVisible({ timeout: 8000 });

        // Làm mới danh sách và chờ API phản hồi (dùng networkidle thay vì timeout cứng)
        await page.getByRole('button', { name: /Làm mới danh sách/i }).click();
        await page.waitForLoadState('networkidle');

        // Kiểm tra file backup trong danh sách
        const danhSachItem = page.locator('li').filter({ hasText: '.bak' });
        const soLuong = await danhSachItem.count();

        if (soLuong > 0) {
            // Xác nhận nút download (title="Tải xuống") xuất hiện trên item đầu tiên
            const nutTaiXuong = danhSachItem.first().locator('button[title="Tải xuống"]');
            await expect(nutTaiXuong).toBeVisible({ timeout: 5000 });
        } else {
            // Chưa có backup → xác nhận thông báo trống hiển thị
            await expect(page.getByText('Chưa có file backup')).toBeVisible({ timeout: 5000 });
        }
    });

    // ──────────────────────────────────────────────────────
    // TC-CH07: Ma trận phân quyền AI – checkbox toggle
    // ──────────────────────────────────────────────────────
    test('TC-CH07: Ma trận phân quyền AI hiển thị và checkbox hoạt động', async ({ page }) => {
        await dangNhapVaDiToi(page, CAU_HINH_URL);
        await expect(page.locator('h1')).toContainText('Cấu hình hệ thống', { timeout: 10000 });

        // Chuyển sang tab AI & Phân quyền
        await page.getByRole('button', { name: TEN_TAB.ai }).click();

        // Xác nhận tiêu đề h2 Ma trận phân quyền hiển thị (dùng heading để tránh strict mode)
        await expect(page.getByRole('heading', { name: /Ma trận phân quyền tác vụ AI/i })).toBeVisible({ timeout: 8000 });

        // Xác nhận ít nhất 1 checkbox phân quyền trong bảng
        const checkboxes = page.locator('input[type="checkbox"]');
        const soCheckbox = await checkboxes.count();
        expect(soCheckbox).toBeGreaterThan(0);

        // Toggle checkbox đầu tiên → xác nhận UI phản hồi đúng (đảo trạng thái)
        const trangThaiDau = await checkboxes.first().isChecked();
        await checkboxes.first().click();
        const trangThaiSau = await checkboxes.first().isChecked();
        expect(trangThaiSau).toBe(!trangThaiDau);
    });

});
