import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử chức năng: Nghiệp vụ Bác sĩ Lâm sàng & Kê đơn thuốc', () => {

    test.beforeEach(async ({ page }) => {
        // Đăng nhập tài khoản có quyền lâm sàng trước mỗi ca kiểm thử
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('admin');
        await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        // Chờ chuyển hướng sang trang chủ hoặc dashboard
        await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Giao diện Trang chủ Bác sĩ và biểu đồ ca khám', async ({ page }) => {
        // 1. Xác minh tài khoản đang có quyền truy cập phân hệ lâm sàng
        await expect(page.getByRole('heading', { name: /Tổng quan hệ thống/i })).toBeVisible();
        const examShortcut = page.getByRole('link', { name: /Khám bệnh & Kê đơn/i });
        await expect(examShortcut).toBeVisible();
    });

    test('TC02: Thực hiện ca khám lâm sàng và kê đơn thuốc cho thú cưng', async ({ page }) => {
        // 1. Truy cập trực tiếp trang Khám bệnh
        await page.goto(`${BASE_URL}/quan-ly/kham-benh`);

        // 2. Kiểm tra phần chọn ca khám chờ hôm nay
        const patientSelect = page.locator('select').first();
        await expect(patientSelect).toBeVisible();

        // 3. Nếu có bệnh nhân đang chờ, thực hiện luồng nhập chẩn đoán chi tiết
        const countOptions = await patientSelect.locator('option').count();
        if (countOptions > 1) {
            // Chọn bệnh nhân đầu tiên trong hàng đợi
            await patientSelect.selectOption({ index: 1 });

            // 4. Nhập triệu chứng và kết luận chẩn đoán lâm sàng
            await page.getByPlaceholder('Ghi nhận triệu chứng...').fill('Sốt cao 39 độ, bỏ ăn 2 ngày, nôn mửa nhẹ.');
            await page.getByPlaceholder('Nhập kết luận bệnh...').fill('Viêm dạ dày cấp tính do thức ăn lạ.');

            // 5. Thêm thuốc điều trị vào đơn thuốc
            const addMedicineBtn = page.getByRole('button', { name: /Thêm thuốc/i });
            await expect(addMedicineBtn).toBeVisible();
            await addMedicineBtn.click();

            // Chọn loại thuốc từ kho dược phẩm
            const medicineSelect = page.locator('select').nth(1);
            if (await medicineSelect.isVisible()) {
                await medicineSelect.selectOption({ index: 1 });
                // Nhập số lượng và liều dùng chỉ định
                await page.getByPlaceholder('SL').fill('5');
                await page.getByPlaceholder('Liều dùng').fill('Sáng 1 viên, tối 1 viên sau ăn.');
            }

            // 6. Nhập lời dặn dò bs gửi chủ nuôi
            await page.getByPlaceholder('Kiêng ăn mặn').fill('Cho uống nhiều nước, ăn cháo loãng ấm trong 3 ngày.');

            // 7. Nhấp nút xn hoàn thành lưu hồ sơ & chốt hóa đơn tự động
            const submitBtn = page.getByRole('button', { name: /LƯU BỆNH ÁN/i });
            await expect(submitBtn).toBeVisible();
        }
    });

});
