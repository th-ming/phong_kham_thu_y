# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Chatbot_Thong_Minh.spec.ts >> Kiểm tra Chatbot thông minh - ý định, media và giọng nói >> Không tự điều hướng khi người dùng chỉ hỏi thông tin, dù phản hồi AI có tag NAVIGATE
- Location: Kiem_Tra_Chatbot_Thong_Minh.spec.ts:40:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#chatWindow')
Expected substring: "hóa đơn cần kiểm tra"
Received string:    "Trợ lý Rexi 🐾volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi trưa Sen Nguyễn Ngọc Ánh! 🐾 Trợ lý Rexi rất vui được gặp lại. Hôm nay bé yêu nhà mình có khỏe không dạ?Hóa đơn thanh toán cần lưu ý gì?Kết nối gián đoạn. Đừng lo, Bác sĩ Rexi vẫn ở đây và sẵn sàng hỗ trợ bé!Đặt lịch khámHồ sơ béHóa đơn của tôiCấp cứu hóc dị vậtLịch tiêm phòngDấu hiệu cần đi khámChăm sóc sau khámDinh dưỡng thú cưngSơ cứu ngộ độcadd_circlemic_nonesend"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#chatWindow')
    13 × locator resolved to <div id="chatWindow" class="glass-card animate-fade-in">…</div>
       - unexpected value "Trợ lý Rexi 🐾volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi trưa Sen Nguyễn Ngọc Ánh! 🐾 Trợ lý Rexi rất vui được gặp lại. Hôm nay bé yêu nhà mình có khỏe không dạ?Hóa đơn thanh toán cần lưu ý gì?Kết nối gián đoạn. Đừng lo, Bác sĩ Rexi vẫn ở đây và sẵn sàng hỗ trợ bé!Đặt lịch khámHồ sơ béHóa đơn của tôiCấp cứu hóc dị vậtLịch tiêm phòngDấu hiệu cần đi khámChăm sóc sau khámDinh dưỡng thú cưngSơ cứu ngộ độcadd_circlemic_nonesend"

```

```yaml
- text: Trợ lý Rexi 🐾 volume_off restart_alt close
- button "chat Trợ lý Rexi"
- button "smart_toy Tác vụ Agent v2"
- paragraph:
  - text: Chào buổi trưa Sen
  - strong: Nguyễn Ngọc Ánh
  - text: "! 🐾 Trợ lý Rexi rất vui được gặp lại. Hôm nay bé yêu nhà mình có khỏe không dạ?"
- paragraph: Hóa đơn thanh toán cần lưu ý gì?
- paragraph: Kết nối gián đoạn. Đừng lo, Bác sĩ Rexi vẫn ở đây và sẵn sàng hỗ trợ bé!
- button "Đặt lịch khám"
- button "Hồ sơ bé"
- button "Hóa đơn của tôi"
- button "Cấp cứu hóc dị vật"
- button "Lịch tiêm phòng"
- button "Dấu hiệu cần đi khám"
- button "Chăm sóc sau khám"
- button "Dinh dưỡng thú cưng"
- button "Sơ cứu ngộ độc"
- button "add_circle"
- button "mic_none"
- textbox "Nhắn tin cho Bác sĩ Thú y Rexi..."
- button "send"
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
  8   |   await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
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
  40  |   test('Không tự điều hướng khi người dùng chỉ hỏi thông tin, dù phản hồi AI có tag NAVIGATE', async ({ page }) => {
  41  |     await loginAsCustomer(page);
  42  |     await page.route('**/api/chat', async route => {
  43  |       await route.fulfill({
  44  |         status: 200,
  45  |         contentType: 'application/json; charset=utf-8',
  46  |         body: JSON.stringify({
  47  |           reply: 'Dạ, hóa đơn cần kiểm tra trạng thái thanh toán và số tiền. [NAVIGATE:/khach-hang/hoa-don-thanh-toan]'
  48  |         })
  49  |       });
  50  |     });
  51  | 
  52  |     await openChat(page);
  53  |     await page.locator('textarea').first().fill('Hóa đơn thanh toán cần lưu ý gì?');
  54  |     await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  55  | 
> 56  |     await expect(page.locator('#chatWindow')).toContainText('hóa đơn cần kiểm tra');
      |                                               ^ Error: expect(locator).toContainText(expected) failed
  57  |     await page.waitForTimeout(1800);
  58  |     await expect(page).toHaveURL(/\/khach-hang\/dashboard/);
  59  |   });
  60  | 
  61  |   test('Chỉ điều hướng khi người dùng yêu cầu mở/chuyển trang rõ ràng', async ({ page }) => {
  62  |     await loginAsCustomer(page);
  63  |     await page.route('**/api/chat', async route => {
  64  |       await route.fulfill({
  65  |         status: 200,
  66  |         contentType: 'application/json; charset=utf-8',
  67  |         body: JSON.stringify({
  68  |           reply: 'Dạ, Rexi mở trang hóa đơn cho Sen ngay. [NAVIGATE:/khach-hang/hoa-don-thanh-toan]'
  69  |         })
  70  |       });
  71  |     });
  72  | 
  73  |     await openChat(page);
  74  |     await page.locator('textarea').first().fill('Mở trang hóa đơn thanh toán cho tôi');
  75  |     await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  76  | 
  77  |     await page.waitForURL(/.*\/khach-hang\/hoa-don-thanh-toan/, { timeout: 5000 });
  78  |   });
  79  | 
  80  |   test('Không hiển thị raw tag điều khiển, cảnh báo khẩn cấp render thành UI hỗ trợ', async ({ page }) => {
  81  |     await loginAsCustomer(page);
  82  |     await page.route('**/api/chat', async route => {
  83  |       await route.fulfill({
  84  |         status: 200,
  85  |         contentType: 'application/json; charset=utf-8',
  86  |         body: JSON.stringify({
  87  |           reply: '[EMERGENCY] Bé đang khó thở, cần sơ cứu ngay. [NAVIGATE:/khach-hang/dat-lich-hen] [CLICK:button-demo]'
  88  |         })
  89  |       });
  90  |     });
  91  | 
  92  |     await openChat(page);
  93  |     await page.locator('textarea').first().fill('Bé khó thở tím tái phải làm sao');
  94  |     await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  95  | 
  96  |     await expect(page.locator('#chatWindow')).toContainText(/sơ cứu|khẩn cấp/i);
  97  |     await expect(page.locator('#chatWindow')).not.toContainText('[EMERGENCY]');
  98  |     await expect(page.locator('#chatWindow')).not.toContainText('[NAVIGATE:');
  99  |     await expect(page.locator('#chatWindow')).not.toContainText('[CLICK:');
  100 |     await expect(page.getByRole('link', { name: /GỌI HOTLINE KHẨN/i })).toBeVisible({ timeout: 8000 });
  101 |     await expect(page.getByRole('link', { name: /ĐƯỜNG ĐẾN PHÒNG KHÁM/i })).toBeVisible({ timeout: 8000 });
  102 |   });
  103 | 
  104 |   test('Ảnh gửi lên API giữ data URL và MIME type để AI nhận diện đúng định dạng', async ({ page }) => {
  105 |     let capturedBody: any = null;
  106 |     await loginAsCustomer(page);
  107 |     await page.route('**/*api/chat*', async route => {
  108 |       capturedBody = route.request().postDataJSON();
  109 |       await route.fulfill({
  110 |         status: 200,
  111 |         contentType: 'application/json; charset=utf-8',
  112 |         body: JSON.stringify({ reply: 'Đã nhận ảnh để phân tích.' })
  113 |       });
  114 |     });
  115 | 
  116 |     await openChat(page);
  117 |     const png1x1 = Buffer.from(
  118 |       'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  119 |       'base64'
  120 |     );
  121 |     await page.locator('input[data-ai-id="input-chatbot-jmt6"]').setInputFiles({
  122 |       name: 'vet-sample.png',
  123 |       mimeType: 'image/png',
  124 |       buffer: png1x1
  125 |     });
  126 |     await expect(page.locator('#chatWindow')).toBeVisible();
  127 |     await page.locator('textarea').first().fill('Nhìn ảnh này giúp tôi nhận diện tình trạng da của bé');
  128 |     await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  129 | 
  130 |     await expect.poll(async () => capturedBody || await page.evaluate(() => (window as any).__REXI_LAST_CHAT_PAYLOAD__ || null)).not.toBeNull();
  131 |     capturedBody = capturedBody || await page.evaluate(() => (window as any).__REXI_LAST_CHAT_PAYLOAD__);
  132 |     const lastMessage = capturedBody[capturedBody.length - 1];
  133 |     expect(lastMessage.images[0]).toMatch(/^data:image\/png;base64,/);
  134 |   });
  135 | 
  136 |   test('Nhận diện giọng nói gửi đúng transcript vào chatbot', async ({ page }) => {
  137 |     await page.addInitScript(() => {
  138 |       class FakeSpeechRecognition {
  139 |         static instance: any;
  140 |         continuous = false;
  141 |         interimResults = false;
  142 |         lang = '';
  143 |         onresult: any;
  144 |         onerror: any;
  145 |         onend: any;
  146 |         constructor() {
  147 |           FakeSpeechRecognition.instance = this;
  148 |           (window as any).__speechRecognitionInstance = this;
  149 |         }
  150 |         start() {}
  151 |         stop() {
  152 |           if (this.onend) this.onend();
  153 |         }
  154 |       }
  155 |       (window as any).SpeechRecognition = FakeSpeechRecognition;
  156 |       (window as any).webkitSpeechRecognition = FakeSpeechRecognition;
```