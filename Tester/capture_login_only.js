const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function captureEnv(baseUrl, envName) {
  console.log(`Bắt đầu chụp ảnh môi trường: ${envName} tại ${baseUrl}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();
  const cb = `?cb=${Date.now()}`;
  console.log('Chụp trang Đăng nhập...');
  await page.goto(`${baseUrl}/dang-nhap${cb}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, `${envName}-login.png`) });
  await browser.close();
  console.log(`Đã hoàn tất chụp ảnh môi trường: ${envName}`);
}

(async () => {
  try {
    await captureEnv('http://127.0.0.1:3005', 'local');
    await captureEnv('https://rexi-vet-clinic.vercel.app', 'cloud');
    console.log('Tất cả ảnh minh chứng đã được cập nhật mới nhất!');
  } catch (err) {
    console.error('Lỗi chụp ảnh minh chứng thực tế:', err);
  }
})();
