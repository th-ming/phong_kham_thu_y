const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright', 'agent-ai-live-slang');
fs.mkdirSync(outDir, { recursive: true });

const cases = [
  'ê mở dùm t cái trang lịch hẹn coi hôm nay có gì',
  'ý help t cái chỗ nì tra khách hàng cái coi',
  'qua bill xem khách nào chưa thanh toán đi',
  'bay qua kho thuốc check tồn cho t',
  'mở cái màn hình bệnh án của boss giúp',
  'dòi oi chỉnh cho tun cái này tăng lên 2 nhấn cái nút này xem',
  'cái ô này set 2 đi rồi bấm lưu',
  'chỗ nì sửa lại thành 500k nha',
  'ấn cái nút xanh xanh đó coi',
  'form này thiếu gì thì tự điền nốt đi',
  'ú cha rựa ơi chóa nhà tôi nó nhảy với miu là t làm sao',
  'chóa nhà t cứ gãi bụng quài có ổn áp k',
  'miu nhà tui bỏ ăn từ sáng h phải làm j',
  'boss t ói 2 lần r có cần qua khám hong',
  'bé cún bị run run xong nằm im, cứu t',
  'khách tên anh minh có lịch nào nay k',
  'check giúp t bill của khách sdt 098xxxxxxx',
  'con poodle tên lu lần trước khám gì ấy nhỉ',
  'kho còn thuốc tẩy giun cho mèo không',
  'hôm qua có bao nhiêu lịch bị hủy',
  'dm sao cái form này không lưu được, check hộ t',
  'mẹ cái nút này bấm hoài không chạy',
  'rối vl, đặt lịch nhanh cho bé miu ngày mai đi',
  'làm mẹ gì mà hóa đơn không hiện, xem giúp',
  'asdf ú ớ cái lịch đâu',
  'tăng lên 2',
  'nhấn thử',
  'cái này sai sai sửa đi',
  'help cái chỗ ni'
];

const startIndex = Math.max(0, Number(process.env.START_INDEX || 1) - 1);
const endIndexExclusive = Math.min(cases.length, Number(process.env.END_INDEX || cases.length));

async function login(page) {
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
  await page.waitForURL(/\/quan-ly\/dashboard|\/khach-hang\/dashboard/, { timeout: 45000 });
  await page.waitForTimeout(8000);
}

async function openAgent(page) {
  const alreadyOpen = await page.locator('#chatWindow').isVisible().catch(() => false);
  if (!alreadyOpen && !(await page.locator('#chatBtn').isVisible().catch(() => false))) {
    await page.goto(`${BASE_URL}/quan-ly/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(5000);
  }
  if (!alreadyOpen) {
    await page.locator('#chatBtn').waitFor({ state: 'visible', timeout: 45000 });
    await page.locator('#chatBtn').click({ force: true });
    await page.locator('#chatWindow').waitFor({ state: 'visible', timeout: 45000 });
  }
  const agentTab = page.locator('button').filter({ hasText: /Rexi Agent|Agent v2|smart_toy/i }).first();
  await agentTab.click({ force: true });
  await page.waitForTimeout(800);
  return true;
}

async function sendAgentMessage(page, text) {
  if (!(await page.locator('#chatWindow').isVisible().catch(() => false))) {
    await openAgent(page);
  }
  const beforeAiCount = await page.locator('#chatWindow').locator('text=/Rexi|Agent|Tôi|Mở|CẢNH BÁO|Bạn|Dạ|Rexi/i').count().catch(() => 0);
  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 20000 });
  await input.fill(text);
  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return response.request().method() === 'POST'
      && (url.includes('/api/agent/react') || url.includes('/api/agent/swarm-orchestration') || url.includes('/api/chat'));
  }, { timeout: 120000 }).catch(() => null);
  await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  const response = await responsePromise;
  await page.waitForTimeout(2500);
  const afterAiCount = await page.locator('#chatWindow').locator('text=/Rexi|Agent|Tôi|Mở|CẢNH BÁO|Bạn|Dạ|không|chưa|Đã/i').count().catch(() => beforeAiCount);
  return response
    ? { status: response.status(), url: response.url(), grew: afterAiCount > beforeAiCount, path: page.url() }
    : { status: 'NO_RESPONSE', url: '', grew: afterAiCount > beforeAiCount, path: page.url() };
}

async function captureProof(page, screenshot) {
    if (await page.locator('#chatWindow').isVisible().catch(() => false)) {
      await page.locator('#chatWindow').screenshot({ path: screenshot, animations: 'disabled', timeout: 20000 });
    } else {
      await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled', timeout: 30000 });
    }
}

async function extractVisibleChatText(page) {
  return await page.locator('#chatWindow').innerText({ timeout: 15000 }).catch(() => '');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(30000);

  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/agent/react') || url.includes('/api/chat') || url.includes('/api/agent/swarm-orchestration')) {
      let body = '';
      try { body = await response.text(); } catch (e) { body = String(e); }
      apiResponses.push({ url, status: response.status(), body: body.slice(0, 4000) });
    }
  });

  await login(page);
  await openAgent(page);

  const results = [];
  const report = path.join(outDir, 'agent-ai-live-slang-report.json');
  for (let i = startIndex; i < endIndexExclusive; i++) {
    const text = cases[i];
    const id = String(i + 1).padStart(2, '0');
    const screenshot = path.join(outDir, `agent-ai-live-${id}.png`);
    let api;
    let error = null;
    try {
      api = await sendAgentMessage(page, text);
    } catch (e) {
      error = String(e && e.stack ? e.stack : e);
      api = { status: 'SCRIPT_ERROR', url: '', grew: false, path: page.url() };
    }
    await captureProof(page, screenshot).catch(() => {});
    const chatText = await extractVisibleChatText(page);
    results.push({
      index: i + 1,
      input: text,
      api,
      error,
      screenshot,
      chatTail: chatText.slice(-2500)
    });
    fs.writeFileSync(report, JSON.stringify({
      baseUrl: BASE_URL,
      generatedAt: new Date().toISOString(),
      total: cases.length,
      completed: results.length,
      results,
      apiResponses
    }, null, 2), 'utf8');
    console.log(`[${id}/${cases.length}] ${api.status} ${text}`);
  }

  fs.writeFileSync(report, JSON.stringify({
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    total: cases.length,
    results,
    apiResponses
  }, null, 2), 'utf8');

  console.log(JSON.stringify({ report, screenshots: results.map(r => r.screenshot) }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
