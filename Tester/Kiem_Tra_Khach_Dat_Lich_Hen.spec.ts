import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm thử luồng Đặt lịch hẹn dành cho Khách hàng (Customer Portal)', () => {

    test.beforeEach(async ({ page }) => {
        // Lắng nghe logs và phản hồi lỗi từ API
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('response', async res => {
            if (res.status() >= 400) {
                console.log(`API FAILED: ${res.url()} -> status=${res.status()}`);
                try {
                    console.log(`API ERROR BODY: ${await res.text()}`);
                } catch (e) {}
            }
        });

        // --- BƯỚC CHÍNH: Đăng nhập Khách hàng thực tế để thực hiện kiểm thử ---
        console.log("--- BẮT ĐẦU BƯỚC ĐĂNG NHẬP KHÁCH HÀNG ---");
        await page.goto(`${BASE_URL}/dang-nhap`);

        // 2. Nhập tài khoản Khách hàng thực tế
        await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
        await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***-DB_PASSWORD');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();

        // 3. Chờ điều hướng vào Giao diện Khách hàng thành công
        await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
        console.log("Đăng nhập Khách hàng thành công. Chuẩn bị chạy các test cases.");
    });

    test('TC01: Luồng Đặt lịch hẹn trọn gói với các bước điền form chi tiết', async ({ page }) => {
        // 1. Điều hướng sang trang Đặt lịch hẹn
        await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`);
        await expect(page.getByRole('heading', { name: /Đặt lịch khám/i })).toBeVisible();

        // 2. Chọn Thú cưng cần khám từ ô chọn dropdown
        const petSelect = page.locator('select[data-ai-id="select-datlichhen-688p"]');
        await expect(petSelect).toBeVisible({ timeout: 10000 });
        await petSelect.selectOption({ index: 1 }); // Chọn bé đầu tiên

        // 3. Chọn Loại dịch vụ khám mong muốn (Click vào thẻ dịch vụ đầu tiên)
        const serviceCard = page.locator('.service-card-select').first();
        await expect(serviceCard).toBeVisible();
        await serviceCard.click();

        // 4. Chọn ngày khám (Lấy ngày mai để tránh lỗi đặt giờ quá khứ)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const dateInput = page.locator('input[type="date"]');
        await expect(dateInput).toBeVisible();
        await dateInput.fill(dateStr);

        // 5. Chọn Bác sĩ điều trị chỉ định (tùy chọn)
        const doctorSelect = page.locator('select[data-ai-id="select-datlichhen-33v9"]');
        await expect(doctorSelect).toBeEnabled();
        // Đợi đến khi danh sách bác sĩ được tải từ API xong (dropdown có nhiều hơn 1 option)
        await page.waitForFunction(
            (sel) => (sel as HTMLSelectElement).options.length > 1,
            await doctorSelect.elementHandle()
        );
        await doctorSelect.selectOption({ index: 1 }); // Chọn bác sĩ đầu tiên

        // 6. Chọn Khung giờ khám rảnh trong ngày (Click vào nút giờ rảnh đầu tiên)
        const slotButton = page.locator('button[data-ai-id="button-datlichhen-rvj4"]').first();
        await expect(slotButton).toBeVisible({ timeout: 10000 });
        await slotButton.click();

        // 7. Nhập chi tiết triệu chứng lâm sàng của bé thú cưng
        const noteTextarea = page.locator('textarea[placeholder*="miêu tả"], textarea[placeholder*="triệu chứng"], textarea').first();
        await expect(noteTextarea).toBeVisible();
        await noteTextarea.fill('Bé có dấu hiệu ngứa tai, liên tục gãi đỏ cả tai và chảy ít dịch mủ màu nâu.');

        // 8. Gửi yêu cầu đặt lịch khám
        const confirmBtn = page.getByRole('button', { name: /Đặt lịch|Xác nhận/i });
        await expect(confirmBtn).toBeVisible();
        await confirmBtn.click();

        // 9. Xác nhận hệ thống đưa ra thông báo đăng ký đặt lịch thành công
        await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 10000 });
    });

    test('TC02: Ràng buộc tính hợp lệ của dữ liệu (Validation Constraints)', async ({ page }) => {
        // 1. Điều hướng sang trang Đặt lịch hẹn
        await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`);

        // 2. Không điền bất kỳ thông tin nào và nhấn trực tiếp nút Đặt lịch
        const confirmBtn = page.getByRole('button', { name: /Đặt lịch|Xác nhận/i });
        await confirmBtn.click();

        // 3. Đảm bảo trang web không được chuyển tiếp do vi phạm Validation
        await expect(page).toHaveURL(/.*\/khach-hang\/dat-lich-hen/);
    });

});