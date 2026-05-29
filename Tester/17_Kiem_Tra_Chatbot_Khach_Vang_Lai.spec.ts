import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Khách vãng lai hỏi dịch vụ công khai thành công', async ({ page }) => {
  // Tăng thời gian chờ cho test này lên 60 giây
  test.setTimeout(60000);

  // Capture console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', exception => console.log('BROWSER EXCEPTION:', exception.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure()?.errorText));

  // 1. Mở trang chủ
  await page.goto('http://localhost:3005', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // 2. Xóa token để chắc chắn chưa đăng nhập
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // 3. Mở chat
  await page.locator('#chatBtn').click({ force: true });
  await expect(page.locator('#chatWindow')).toBeVisible({ timeout: 15000 });
  
  // 4. Click tab Rexi Agent
  await page.locator('button[data-ai-id="button-chatbot-jdzj"]').click({ force: true });
  
  // 5. Điền lệnh hỏi dịch vụ
  await page.locator('textarea[placeholder*="Lệnh"]').fill('Rexi có những dịch vụ thú y nào?');
  
  // 6. Gửi tin nhắn
  await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  
  // 7. Đợi tin nhắn phản hồi xuất hiện (tin nhắn AI thứ 2 xuất hiện trong Agent chat)
  const aiMessages = page.locator('.chat-message-ai');
  await expect(aiMessages).toHaveCount(2, { timeout: 25000 });
  
  // 8. Đợi thêm 5 giây nữa để đảm bảo chữ chạy typewriter đã stream ra hoàn chỉnh
  console.log('Tin nhắn AI mới đã xuất hiện! Đợi stream chữ...');
  await page.waitForTimeout(5000);

  // 9. Chụp ảnh màn hình
  const chatWindow = page.locator('#chatWindow');
  const screenshotPath = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\3b708dbe-9528-4c5b-b1dc-6678369e1121\\artifacts\\rexi_agent_success.png';
  await chatWindow.screenshot({ path: screenshotPath, animations: 'disabled', timeout: 10000 });
  console.log('Chụp ảnh thành công: ' + screenshotPath);
});
