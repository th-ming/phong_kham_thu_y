# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Chatbot_Thong_Minh.spec.ts >> Kiểm tra Chatbot thông minh - ý định, media và giọng nói >> Mở chatbot sẽ prewarm provider AI để giảm độ trễ tin nhắn đầu
- Location: Kiem_Tra_Chatbot_Thong_Minh.spec.ts:40:7

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:3005/", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const FRONTEND_PORT = 3005;
  4   | const BASE_URL = `http://localhost:${FRONTEND_PORT}`;
  5   | 
  6   | async function loginAsCustomer(page: any) {
  7   |   await page.context().clearCookies();
> 8   |   await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      |              ^ Error: page.goto: Could not connect to server
  9   |   await page.evaluate(() => {
  10  |     localStorage.clear();
  11  |     sessionStorage.clear();
  12  |   });
  13  |   await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  14  |   await expect(page.getByPlaceholder('Tên đăng nhập')).toBeVisible({ timeout: 15000 });
  15  |   await page.getByPlaceholder('Tên đăng nhập').fill('testcustomer2');
  16  |   await page.getByPlaceholder('Mật khẩu').fill('Password123!');
  17  |   await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  18  |   await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 30000 });
  19  | }
  20  | 
  21  | async function openChat(page: any) {
  22  |   await page.locator('#chatBtn').click({ force: true });
  23  |   await expect(page.locator('#chatWindow')).toBeVisible();
  24  | }
  25  | 
  26  | test.describe('Kiểm tra Chatbot thông minh - ý định, media và giọng nói', () => {
  27  |   test.describe.configure({ mode: 'serial' });
  28  |   test.setTimeout(60000);
  29  | 
  30  |   test('Phát hiện lỗi nhập liệu ngay khi người dùng bỏ thiếu trường bắt buộc', async ({ page }) => {
  31  |     await loginAsCustomer(page);
  32  |     await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  33  |     await expect(page.locator('#chatBtn')).toBeVisible({ timeout: 15000 });
  34  | 
  35  |     await page.locator('button[data-ai-id="button-datlichhen-66iq"]').click({ force: true });
  36  | 
  37  |     await expect(page.getByText(/Rexi (phát hiện lỗi|thấy đơn đặt lịch khám còn thiếu)/i).first()).toBeVisible({ timeout: 8000 });
  38  |   });
  39  | 
  40  |   test('Mở chatbot sẽ prewarm provider AI để giảm độ trễ tin nhắn đầu', async ({ page }) => {
  41  |     let prewarmCount = 0;
  42  |     await loginAsCustomer(page);
  43  |     await page.route('**/api/chat/prewarm', async route => {
  44  |       prewarmCount++;
  45  |       await route.fulfill({
  46  |         status: 200,
  47  |         contentType: 'application/json; charset=utf-8',
  48  |         body: JSON.stringify({ ok: true, provider: 'groq', mode: 'background' })
  49  |       });
  50  |     });
  51  | 
  52  |     await openChat(page);
  53  |     await expect.poll(() => prewarmCount).toBe(1);
  54  | 
  55  |     await page.locator('#chatBtn').click({ force: true });
  56  |     await page.locator('#chatBtn').click({ force: true });
  57  |     await page.waitForTimeout(400);
  58  |     expect(prewarmCount).toBe(1);
  59  |   });
  60  | 
  61  |   test('Không tự điều hướng khi người dùng chỉ hỏi thông tin, dù phản hồi AI có tag NAVIGATE', async ({ page }) => {
  62  |     await loginAsCustomer(page);
  63  |     await page.route('**/api/chat', async route => {
  64  |       await route.fulfill({
  65  |         status: 200,
  66  |         contentType: 'application/json; charset=utf-8',
  67  |         body: JSON.stringify({
  68  |           reply: 'Dạ, hóa đơn cần kiểm tra trạng thái thanh toán và số tiền. [NAVIGATE:/khach-hang/hoa-don-thanh-toan]'
  69  |         })
  70  |       });
  71  |     });
  72  | 
  73  |     await openChat(page);
  74  |     await page.locator('textarea').first().fill('Hóa đơn thanh toán cần lưu ý gì?');
  75  |     await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  76  | 
  77  |     await expect(page.locator('#chatWindow')).toContainText('hóa đơn cần kiểm tra');
  78  |     await page.waitForTimeout(1800);
  79  |     await expect(page).toHaveURL(/\/khach-hang\/dashboard/);
  80  |   });
  81  | 
  82  |   test('Chỉ điều hướng khi người dùng yêu cầu mở/chuyển trang rõ ràng', async ({ page }) => {
  83  |     await loginAsCustomer(page);
  84  |     await page.route('**/api/chat', async route => {
  85  |       await route.fulfill({
  86  |         status: 200,
  87  |         contentType: 'application/json; charset=utf-8',
  88  |         body: JSON.stringify({
  89  |           reply: 'Dạ, Rexi mở trang hóa đơn cho Sen ngay. [NAVIGATE:/khach-hang/hoa-don-thanh-toan]'
  90  |         })
  91  |       });
  92  |     });
  93  | 
  94  |     await openChat(page);
  95  |     await page.locator('textarea').first().fill('Mở trang hóa đơn thanh toán cho tôi');
  96  |     await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  97  | 
  98  |     await page.waitForURL(/.*\/khach-hang\/hoa-don-thanh-toan/, { timeout: 5000 });
  99  |   });
  100 | 
  101 |   test('Không hiển thị raw tag điều khiển, cảnh báo khẩn cấp render thành UI hỗ trợ', async ({ page }) => {
  102 |     await loginAsCustomer(page);
  103 |     await page.route('**/api/chat', async route => {
  104 |       await route.fulfill({
  105 |         status: 200,
  106 |         contentType: 'application/json; charset=utf-8',
  107 |         body: JSON.stringify({
  108 |           reply: '[EMERGENCY] Bé đang khó thở, cần sơ cứu ngay. [NAVIGATE:/khach-hang/dat-lich-hen] [CLICK:button-demo]'
```