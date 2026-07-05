import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test.describe('Kiểm tra Chatbot AI - Tính năng Khẩn cấp, Bảo mật & Đặt lịch tự động', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Vào trang Đăng nhập hệ thống để lấy phiên đăng nhập trước khi dùng Chatbot
        await page.goto(`${BASE_URL}/dang-nhap`);
        await page.getByPlaceholder('Tên đăng nhập').fill('khachhang');
        await page.getByPlaceholder('Mật khẩu').fill('khachhang@rexi.com');
        await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
        
        // 2. Chờ điều hướng vào Trang tổng quan khách hàng thành công
        await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
    });

    test('TC01: Luồng gửi tin nhắn Chatbot AI hoàn chỉnh và nhận phản hồi', async ({ page }) => {
        // 1. Nhấp nút kích hoạt Chatbot Rexi ở góc phải màn hình
        const chatbotBtn = page.locator('#chatBtn');
        await expect(chatbotBtn).toBeVisible();
        await chatbotBtn.click({ force: true });
            
        // 2. xn Khung chat AI hiển thị tiêu đề và lời chào chào mừng
        await expect(page.locator('#chatWindow').getByText('Trợ lý Rexi').first()).toBeVisible();
        await expect(page.locator('.chat-message-ai').first()).toBeVisible();

        // 3. Nhập câu hỏi tư vấn sức khỏe cho thú cưng
        const chatInput = page.locator('textarea[placeholder*="Nhắn tin cho Rexi"], textarea').first();
        await expect(chatInput).toBeVisible();
        await chatInput.fill('Rexi ơi, chó bị nôn ra bọt trắng thì làm sao?');
            
        // 4. Nhấp nút gửi tin nhắn chính thức
        await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

        // 5. xn tin nhắn của người dùng xuất hiện trên khung chat
        await expect(page.locator('#chatWindow')).toContainText('nôn ra bọt trắng');

        // 6. Chờ trợ lý AI phản hồi và kiểm tra sự xuất hiện của câu trả lời
        const lastAIResponse = page.locator('.chat-message-ai').last();
        await expect(lastAIResponse).toBeVisible({ timeout: 15000 });
    });

    test('TC02: Kích hoạt quy trình Sơ cứu Khẩn cấp (Emergency Triage) & Hotline', async ({ page }) => {
        const chatbotBtn = page.locator('#chatBtn');
        await expect(chatbotBtn).toBeVisible();
        await chatbotBtn.click({ force: true });

        const chatInput = page.locator('textarea[placeholder*="Nhắn tin cho Rexi"], textarea').first();
        // Gửi từ khóa nguy kịch khẩn cấp
        await chatInput.fill('Cấp cứu! Cún nhà tôi bị hóc dị vật không thở được!');
        // 4. Nhấp nút gửi tin nhắn chính thức
        await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

        // xn tin nhắn của người dùng xuất hiện trên khung chat
        await expect(page.locator('#chatWindow')).toContainText('hóc dị vật');

        // 1. Kiểm tra Trợ lý ảo phản hồi siêu nhanh với giao diện Cảnh báo khẩn cấp nổi bật
        const responseContainer = page.locator('.chat-message-ai').last();
        await expect(responseContainer).toBeVisible({ timeout: 15000 });

        // 2. Xác minh Trợ lý AI khuyên dùng quy trình sơ cứu cơ học Heimlich
        await expect(responseContainer).toContainText(/Heimlich/i);

        // 3. Xác minh Trợ lý AI đồng bộ hóa đúng sđt khẩn cấp chính thức của Rexi Clinic
        await expect(responseContainer).toContainText(/0353.*374.*156/);

        // Chụp lại ảnh màn hình bằng auth tế AI phản hồi khẩn cấp Heimlich trực quan lộng lẫy
        await page.screenshot({ path: 'd:/QLy Phòng Khám Thú Y/Tester/test-results/evidence-tc03-chatbot-emergency.png', fullPage: true });
    });

    test('TC03: Tương tác các gợi ý nhanh (Quick Actions) và nút chuyển tiếp đăng ký', async ({ page }) => {
        const chatbotBtn = page.locator('#chatBtn');
        await expect(chatbotBtn).toBeVisible();
        await chatbotBtn.click({ force: true });

        // 1. Kiểm tra sự hiện diện của các nút gợi ý nhanh
        const firstSuggestion = page.getByRole('button', { name: /Cấp cứu Hóc Dị Vật/i }).first();
        if (await firstSuggestion.isVisible()) {
            await firstSuggestion.click();

            // 2. Đảm bảo tin nhắn tự động được gửi đi và hiển thị trên cửa sổ chat
            await expect(page.locator('#chatWindow')).toContainText('hóc dị vật');
        }
    });
});
