import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

async function loginAsCustomer(page: any) {
  await page.context().clearCookies();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expect(page.getByPlaceholder('Tên đăng nhập')).toBeVisible({ timeout: 15000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('testcustomer2');
  await page.getByPlaceholder('Mật khẩu').fill('Password123!');
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 30000 });
}

async function openChat(page: any) {
  await page.locator('#chatBtn').click({ force: true });
  await expect(page.locator('#chatWindow')).toBeVisible();
}

test.describe('Kiểm tra Chatbot thông minh - ý định, media và giọng nói', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000);

  test('Phát hiện lỗi nhập liệu ngay khi người dùng bỏ thiếu trường bắt buộc', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto(`${BASE_URL}/khach-hang/dat-lich-hen`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.locator('#chatBtn')).toBeVisible({ timeout: 15000 });

    await page.locator('button[data-ai-id="button-datlichhen-66iq"]').click({ force: true });

    await expect(page.getByText(/Rexi (phát hiện lỗi|thấy đơn đặt lịch khám còn thiếu)/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('Mở chatbot sẽ prewarm provider AI để giảm độ trễ tin nhắn đầu', async ({ page }) => {
    let prewarmCount = 0;
    await loginAsCustomer(page);
    await page.route('**/api/chat/prewarm', async route => {
      prewarmCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ ok: true, provider: 'groq', mode: 'background' })
      });
    });

    await openChat(page);
    await expect.poll(() => prewarmCount).toBe(1);

    await page.locator('#chatBtn').click({ force: true });
    await page.locator('#chatBtn').click({ force: true });
    await page.waitForTimeout(400);
    expect(prewarmCount).toBe(1);
  });

  test('Không tự điều hướng khi người dùng chỉ hỏi thông tin, dù phản hồi AI có tag NAVIGATE', async ({ page }) => {
    await loginAsCustomer(page);
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          reply: 'Dạ, hóa đơn cần kiểm tra trạng thái thanh toán và số tiền. [NAVIGATE:/khach-hang/hoa-don-thanh-toan]'
        })
      });
    });

    await openChat(page);
    await page.locator('textarea').first().fill('Hóa đơn thanh toán cần lưu ý gì?');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

    await expect(page.locator('#chatWindow')).toContainText('hóa đơn cần kiểm tra');
    await page.waitForTimeout(1800);
    await expect(page).toHaveURL(/\/khach-hang\/dashboard/);
  });

  test('Chỉ điều hướng khi người dùng yêu cầu mở/chuyển trang rõ ràng', async ({ page }) => {
    await loginAsCustomer(page);
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          reply: 'Dạ, Rexi mở trang hóa đơn cho Sen ngay. [NAVIGATE:/khach-hang/hoa-don-thanh-toan]'
        })
      });
    });

    await openChat(page);
    await page.locator('textarea').first().fill('Mở trang hóa đơn thanh toán cho tôi');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

    await page.waitForURL(/.*\/khach-hang\/hoa-don-thanh-toan/, { timeout: 5000 });
  });

  test('Không hiển thị raw tag điều khiển, cảnh báo khẩn cấp render thành UI hỗ trợ', async ({ page }) => {
    await loginAsCustomer(page);
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          reply: '[EMERGENCY] Bé đang khó thở, cần sơ cứu ngay. [NAVIGATE:/khach-hang/dat-lich-hen] [CLICK:button-demo]'
        })
      });
    });

    await openChat(page);
    await page.locator('textarea').first().fill('Bé khó thở tím tái phải làm sao');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

    await expect(page.locator('#chatWindow')).toContainText(/sơ cứu|khẩn cấp/i);
    await expect(page.locator('#chatWindow')).not.toContainText('[EMERGENCY]');
    await expect(page.locator('#chatWindow')).not.toContainText('[NAVIGATE:');
    await expect(page.locator('#chatWindow')).not.toContainText('[CLICK:');
    await expect(page.getByRole('link', { name: /GỌI HOTLINE KHẨN/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /ĐƯỜNG ĐẾN PHÒNG KHÁM/i })).toBeVisible({ timeout: 8000 });
  });

  test('Ảnh gửi lên API giữ data URL và MIME type để AI nhận diện đúng định dạng', async ({ page }) => {
    let capturedBody: any = null;
    await loginAsCustomer(page);
    await page.route('**/*api/chat*', async route => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ reply: 'Đã nhận ảnh để phân tích.' })
      });
    });

    await openChat(page);
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      'base64'
    );
    await page.locator('input[data-ai-id="input-chatbot-jmt6"]').setInputFiles({
      name: 'vet-sample.png',
      mimeType: 'image/png',
      buffer: png1x1
    });
    await expect(page.locator('#chatWindow')).toBeVisible();
    await page.locator('textarea').first().fill('Nhìn ảnh này giúp tôi nhận diện tình trạng da của bé');
    await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

    await expect.poll(async () => capturedBody || await page.evaluate(() => (window as any).__REXI_LAST_CHAT_PAYLOAD__ || null)).not.toBeNull();
    capturedBody = capturedBody || await page.evaluate(() => (window as any).__REXI_LAST_CHAT_PAYLOAD__);
    const lastMessage = capturedBody[capturedBody.length - 1];
    expect(lastMessage.images[0]).toMatch(/^data:image\/png;base64,/);
  });

  test('Nhận diện giọng nói gửi đúng transcript vào chatbot', async ({ page }) => {
    await page.addInitScript(() => {
      class FakeSpeechRecognition {
        static instance: any;
        continuous = false;
        interimResults = false;
        lang = '';
        onresult: any;
        onerror: any;
        onend: any;
        constructor() {
          FakeSpeechRecognition.instance = this;
          (window as any).__speechRecognitionInstance = this;
        }
        start() {}
        stop() {
          if (this.onend) this.onend();
        }
      }
      (window as any).SpeechRecognition = FakeSpeechRecognition;
      (window as any).webkitSpeechRecognition = FakeSpeechRecognition;
      (window as any).__emitFinalSpeech = (text: string) => {
        const instance = (window as any).__speechRecognitionInstance;
        instance.onresult({
          resultIndex: 0,
          results: [
            {
              isFinal: true,
              0: { transcript: text }
            }
          ]
        });
      };
    });

    await loginAsCustomer(page);
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ reply: 'Đã nhận yêu cầu giọng nói.' })
      });
    });

    await openChat(page);
    await page.locator('button[data-ai-id="button-chatbot-4mbq"]').click({ force: true });
    await page.evaluate(() => (window as any).__emitFinalSpeech('Mèo bỏ ăn hai ngày cần làm gì'));

    await expect(page.locator('#chatWindow')).toContainText('Mèo bỏ ăn hai ngày cần làm gì');
    await expect(page.locator('#chatWindow')).toContainText('Đã nhận yêu cầu giọng nói');
  });
});
