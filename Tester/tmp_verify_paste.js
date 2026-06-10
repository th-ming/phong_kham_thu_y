const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';
const OUT_DIR = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\4061f818-4a02-4de1-a89e-91b95fb9fa12';

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
    console.warn('Login with admin failed, proceeding as guest...');
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

  console.log('Opening chatbot...');
  const bubble = page.locator('#chatBtn, [data-ai-id*="button-chatbot"]').first();
  await bubble.click();
  await page.waitForTimeout(1500);

  console.log('Switching to Agent Tab...');
  const agentTabButton = page.locator('[data-ai-id="button-chatbot-jdzj"]').first();
  await agentTabButton.click();
  await page.waitForTimeout(1000);

  console.log('Simulating image paste event on chatbot input...');
  await page.evaluate(async () => {
    const textarea = document.querySelector('textarea[data-ai-id="textarea_chatbot_input"]');
    if (!textarea) {
      console.error("Textarea not found!");
      return;
    }
    textarea.focus();

    // 1x1 green pixel base64
    const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await fetch(base64Data);
    const blob = await res.blob();
    const file = new File([blob], 'proof_screenshot.png', { type: 'image/png' });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(pasteEvent);
  });

  console.log('Waiting for image compression and rendering...');
  await page.waitForTimeout(3000);

  // Check if preview image exists in DOM
  const previewImage = page.locator('img[alt="preview"]');
  const count = await previewImage.count();
  console.log(`Number of preview images found: ${count}`);

  // Take screenshot
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const screenshotPath = path.join(OUT_DIR, 'paste_proof_agent.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();
}

main().catch(err => {
  console.error("Error in verification script:", err);
  process.exit(1);
});
