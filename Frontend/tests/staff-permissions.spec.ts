import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3001';

test.describe('Kiểm thử Hộp đen: Quản lý Nhân sự & Phân quyền', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập với quyền Admin
        await page.goto(`${BASE_URL}/dang-nhap`);
        
        // Đợi Form load
        await expect(page.getByPlaceholder('Tên đăng nhập')).toBeVisible({ timeout: 10000 });
        
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        
        // SỬA LỖI TIMEOUT: Phải đợi trang lưu token xong
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
        
        // Điều hướng đến trang Nhân sự & Phân quyền
        await page.goto(`${BASE_URL}/quan-ly/nhan-vien-phan-quyen`);
        await expect(page.getByText('Nhân sự & Quyền hạn')).toBeVisible({ timeout: 15000 });
    });

    test('TC-NS01: Thêm nhân sự mới (Bác sĩ) và kiểm tra ID tự sinh', async ({ page }) => {
        await page.getByRole('button', { name: 'person_add Thêm nhân sự' }).click();
        
        const timestamp = Date.now();
        const testName = `BS Test ${timestamp}`;
        const testEmail = `bs_test_${timestamp}@rexi.vn`;
        
        // Điền form thêm mới
        await page.locator('div:has(> label:text("HỌ VÀ TÊN")) input').fill(testName);
        await page.locator('div:has(> label:text("CHUYÊN MÔN")) select').selectOption('Bác sĩ');
        // SỬA LỖI TRÙNG LẶP DỮ LIỆU: Sinh số điện thoại động ngẫu nhiên
        await page.locator('div:has(> label:text("SỐ ĐIỆN THOẠI")) input').fill(`09${timestamp.toString().slice(-8)}`);
        await page.locator('div:has(> label:text("EMAIL (DÙNG ĐỂ TẠO TK)")) input').fill(testEmail);
        
        // Ngày vào làm
        await page.locator('input[type="date"]').fill('2024-01-01');
        
        await page.getByRole('button', { name: 'LƯU THÔNG TIN' }).click();
        
        // Chờ thông báo thành công
        await expect(page.getByText('Đã thêm nhân sự mới!')).toBeVisible();
        
        // Kiểm tra trong danh sách
        await page.getByPlaceholder('Tìm tên, SĐT, Email...').fill(testName);
        const row = page.locator('tr').filter({ hasText: testName });
        await expect(row).toBeVisible();
        
        // Kiểm tra tiền tố ID (Backend tự sinh nên cần check UI có hiển thị badge tương ứng không)
        await expect(row.getByText('BÁC SĨ')).toBeVisible();
    });

    test('TC-NS02: Tìm kiếm và Lọc nhân sự', async ({ page }) => {
        // Thử lọc theo chức vụ
        await page.selectOption('select:has-text("Tất cả chức vụ")', 'Kế toán');
        
        // Đảm bảo các dòng còn lại đều là Kế toán
        const rows = page.locator('tbody tr');
        const count = await rows.count();
        for (let i = 0; i < count; i++) {
            await expect(rows.nth(i).getByText('KẾ TOÁN')).toBeVisible();
        }
        
        // Thử tìm kiếm theo tên
        await page.getByPlaceholder('Tìm tên, SĐT, Email...').fill('admin');
        await expect(page.locator('tbody tr').first().getByText(/admin/i)).toBeVisible();
    });

    test('TC-NS03: Sửa thông tin nhân sự', async ({ page }) => {
        // Tìm một nhân sự bất kỳ (tránh admin đang login)
        const row = page.locator('tbody tr').filter({ hasNotText: 'admin' }).first();
        const oldName = await row.locator('td').first().innerText();
        
        await row.getByRole('button', { name: 'edit Sửa' }).click();
        
        const newName = `Updated ${Date.now()}`;
        await page.locator('div:has(> label:text("HỌ VÀ TÊN")) input').fill(newName);
        await page.getByRole('button', { name: 'LƯU THÔNG TIN' }).click();
        
        await expect(page.getByText('Đã cập nhật thông tin nhân sự!')).toBeVisible();
        await expect(page.getByText(newName)).toBeVisible();
    });

    test('TC-NS04: Xóa/Cho nghỉ việc nhân sự', async ({ page }) => {
        // Tạo một nhân sự tạm để xóa
        await page.getByRole('button', { name: 'person_add Thêm nhân sự' }).click();
        const timestampDelete = Date.now();
        const nameToDelete = `Delete Me ${timestampDelete}`;
        await page.locator('div:has(> label:text("HỌ VÀ TÊN")) input').fill(nameToDelete);
        await page.locator('div:has(> label:text("SỐ ĐIỆN THOẠI")) input').fill(`08${timestampDelete.toString().slice(-8)}`);
        await page.locator('div:has(> label:text("EMAIL (DÙNG ĐỂ TẠO TK)")) input').fill(`del_${timestampDelete}@test.com`);
        await page.locator('input[type="date"]').fill('2024-05-14');
        await page.getByRole('button', { name: 'LƯU THÔNG TIN' }).click();
        await expect(page.getByText('Đã thêm nhân sự mới!')).toBeVisible();

        // Tìm và xóa
        await page.getByPlaceholder('Tìm tên, SĐT, Email...').fill(nameToDelete);
        const row = page.locator('tr').filter({ hasText: nameToDelete });
        
        // Listen to confirm dialog
        page.on('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'delete Xóa' }).click();
        
        await expect(page.getByText('Đã xóa nhân viên thành công!')).toBeVisible();
        await expect(page.getByText(nameToDelete)).not.toBeVisible();
    });

});
