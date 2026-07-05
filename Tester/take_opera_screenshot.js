const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:\\Users\\84916\\.gemini\\antigravity-ide\\brain\\58d76d87-ba07-4adf-a18a-cd436a1b6446';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const ports = [9222, 9223, 9224, 9225, 9333];
  let connected = false;

  for (const port of ports) {
    try {
      console.log(`Đang thử kết nối tới cổng remote debugging: ${port}...`);
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      connected = true;
      console.log(`Kết nối thành công tới trình duyệt ở cổng ${port}!`);
      
      const contexts = browser.contexts();
      let imgIndex = 1;
      for (const context of contexts) {
        const pages = context.pages();
        console.log(`Tìm thấy ${pages.length} tab/trang.`);
        for (const page of pages) {
          try {
            const url = page.url();
            const title = await page.title();
            console.log(`Tab ${imgIndex}: Title: "${title}", URL: "${url}"`);
            
            const filename = `opera_screenshot_${imgIndex}.png`;
            const savePath = path.join(artifactDir, filename);
            await page.screenshot({ path: savePath });
            console.log(`Đã chụp ảnh màn hình và lưu tại: ${savePath}`);
            imgIndex++;
          } catch (pageErr) {
            console.error(`Không thể chụp tab này: ${pageErr.message}`);
          }
        }
      }
      
      await browser.close();
      break;
    } catch (e) {
      // Cổng này không mở
    }
  }

  if (!connected) {
    console.log('\n[ERROR] Không thể kết nối tới trình duyệt nào qua cổng Remote Debugging.');
    console.log('Vui lòng khởi động Opera hoặc Chrome với tuỳ chọn remote-debugging bằng cách:');
    console.log('1. Đóng hoàn toàn trình duyệt đang chạy.');
    console.log('2. Mở Command Prompt hoặc Run (Win+R) chạy lệnh:');
    console.log('   opera.exe --remote-debugging-port=9222');
    console.log('   (Hoặc: chrome.exe --remote-debugging-port=9222)');
  }
}

run();
