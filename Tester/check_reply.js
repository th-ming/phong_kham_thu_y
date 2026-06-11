const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://127.0.0.1:3005';
const OUT_DIR = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\4061f818-4a02-4de1-a89e-91b95fb9fa12';
const USER_IMAGE_PATH = path.join(OUT_DIR, 'media__1781152695680.png');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE]: ${msg.text()}`);
  });

  console.log(`Going to ${BASE}...`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const bubble = page.locator('#chatBtn, [data-ai-id*="button-chatbot"]').first();
  await bubble.click();
  await page.waitForTimeout(1500);

  const agentTabButton = page.locator('[data-ai-id="button-chatbot-jdzj"]').first();
  await agentTabButton.click();
  await page.waitForTimeout(1000);

  console.log('Pasting image...');
  const imageBase64 = fs.readFileSync(USER_IMAGE_PATH).toString('base64');
  const imageDataUrl = `data:image/png;base64,${imageBase64}`;

  await page.evaluate(async (imgUrl) => {
    const textarea = document.querySelector('textarea[data-ai-id="textarea_chatbot_input"]');
    if (!textarea) return;
    textarea.focus();
    const res = await fetch(imgUrl);
    const blob = await res.blob();
    const file = new File([blob], 'user_image.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
    textarea.dispatchEvent(pasteEvent);
  }, imageDataUrl);

  await page.waitForTimeout(2000);

  console.log('Sending message...');
  const textarea = page.locator('textarea[data-ai-id="textarea_chatbot_input"]');
  await textarea.fill('đổi chữ đặt lịch hẹn cho bé sang màu vàng');
  await page.waitForTimeout(500);
  await textarea.press('Enter');

  console.log('Waiting 15s for response...');
  await page.waitForTimeout(15000);

  const messages = await page.locator('.chat-message-ai').allInnerTexts();
  console.log('AI Messages in Chatbox:');
  console.log(messages);

  await browser.close();
}

main().catch(console.error);
