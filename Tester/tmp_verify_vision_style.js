const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';
const OUT_DIR = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\4061f818-4a02-4de1-a89e-91b95fb9fa12';
const USER_IMAGE_PATH = path.join(OUT_DIR, 'media__1781152695680.png');

async function post(pathname, body, token) {
  try {
    const res = await fetch(`${API}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, json };
  } catch (e) {
    console.error("Fetch error:", e.message);
    return { status: 500, error: e.message };
  }
}

async function main() {
  console.log('Logging in...');
  const auth = await post('/api/auth/login', { username: 'admin', password: 'admin@rexi.com' });
  let token = auth.json?.token;
  let user = auth.json?.user;

  if (!token) {
    console.warn('Login with admin failed, proceeding...');
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  if (token && user) {
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });
  }

  console.log(`Going to ${BASE}...`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Take screenshot before modification to verify title exists
  const initialTitleColor = await page.locator('[data-ai-id="heading-home-cta-title"]').evaluate(el => el.style.color);
  console.log(`Initial title style color: ${initialTitleColor}`);

  console.log('Opening chatbot...');
  const bubble = page.locator('#chatBtn, [data-ai-id*="button-chatbot"]').first();
  await bubble.click();
  await page.waitForTimeout(1500);

  console.log('Switching to Agent Tab...');
  const agentTabButton = page.locator('[data-ai-id="button-chatbot-jdzj"]').first();
  await agentTabButton.click();
  await page.waitForTimeout(1000);

  console.log('Pasting user uploaded image into chatbot...');
  const imageBase64 = fs.readFileSync(USER_IMAGE_PATH).toString('base64');
  const imageDataUrl = `data:image/png;base64,${imageBase64}`;

  await page.evaluate(async (imgUrl) => {
    const textarea = document.querySelector('textarea[data-ai-id="textarea_chatbot_input"]');
    if (!textarea) {
      console.error("Textarea not found!");
      return;
    }
    textarea.focus();

    const res = await fetch(imgUrl);
    const blob = await res.blob();
    const file = new File([blob], 'user_image.png', { type: 'image/png' });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(pasteEvent);
  }, imageDataUrl);

  console.log('Waiting for image compression...');
  await page.waitForTimeout(2000);

  console.log('Typing command and sending...');
  const textarea = page.locator('textarea[data-ai-id="textarea_chatbot_input"]');
  await textarea.fill('đổi chữ đặt lịch hẹn cho bé sang màu vàng');
  await page.waitForTimeout(500);
  await textarea.press('Enter');

  console.log('Waiting for Agent Vision Model analysis & ReAct loop execution (15s)...');
  await page.waitForTimeout(15000);

  // Check new style of the title
  const finalTitleStyle = await page.locator('[data-ai-id="heading-home-cta-title"]').evaluate(el => ({
    color: el.style.color,
    outline: el.style.outline
  }));
  console.log(`Final title style:`, finalTitleStyle);

  // Take proof screenshot
  const screenshotPath = path.join(OUT_DIR, 'vision_proof.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();
}

main().catch(err => {
  console.error("Error in verification script:", err);
  process.exit(1);
});
