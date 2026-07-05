import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3005';

test.describe('Rexi Agent DOM reading & action test', () => {
  test.setTimeout(120000);

  async function loginAndOpenChat(page: any) {
    await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'load', timeout: 30000 });
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
    await page.waitForTimeout(2000);
    const chatBtn = page.locator('#chatBtn').first();
    await expect(chatBtn).toBeVisible({ timeout: 10000 });
    await chatBtn.click({ force: true });
    await expect(page.locator('#chatWindow')).toBeVisible({ timeout: 10000 });
  }

  test('Navigate to lich-hen via agent', async ({ page }) => {
    await loginAndOpenChat(page);
    const chatInput = page.locator('textarea[placeholder*="Nhắn tin"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill('mở trang lịch hẹn');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
    await page.waitForTimeout(5000);
    const url = page.url();
    console.log('URL after navigate:', url);
    expect(url).toContain('/quan-ly/lich-hen');
    await page.screenshot({ path: 'test-results/agent_navigate.png' });
  });

  test('Open schedule page via agent', async ({ page }) => {
    await loginAndOpenChat(page);
    const chatInput = page.locator('textarea[placeholder*="Nhắn tin"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill('mở trang lịch làm việc');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
    await page.waitForTimeout(5000);
    const url = page.url();
    console.log('URL after navigate:', url);
    expect(url).toContain('/quan-ly/lich-lam-viec');
    await page.screenshot({ path: 'test-results/agent_schedule.png' });
  });

  test('Ask agent what is on current page (LLM test)', async ({ page }) => {
    await loginAndOpenChat(page);
    const chatInput = page.locator('textarea[placeholder*="Nhắn tin"], textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    // Ask about the current page content - should trigger LLM
    await chatInput.fill('trên trang này có gì');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
    await page.waitForTimeout(8000);
    // Check if we got a meaningful response
    const lastMsg = page.locator('.chat-message-ai').last();
    await expect(lastMsg).toBeVisible({ timeout: 15000 });
    const text = await lastMsg.textContent();
    console.log('AI response to "trên trang này có gì":', text?.substring(0, 200));
    await page.screenshot({ path: 'test-results/agent_ask_page.png' });
  });
});
