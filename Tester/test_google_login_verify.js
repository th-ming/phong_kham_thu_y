const { chromium } = require('playwright');

(async () => {
  console.log('Khởi động trình duyệt...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Lắng nghe console log từ trang web
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  try {
    console.log('Truy cập trang đăng nhập...');
    await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    
    const frames = page.frames();
    const googleBtnFrame = frames.find(f => f.url().includes('accounts.google.com/gsi/button'));
    
    if (googleBtnFrame) {
      console.log('Đã thấy iframe Google Button.');
      
      // Lắng nghe sự kiện mở trang mới (popup)
      const popupPromise = page.waitForEvent('popup', { timeout: 8000 }).catch(() => null);
      
      // Thử click vào nút Google Login
      await googleBtnFrame.click('div.nsm7Bb-HzV7m-LgbsSe');
      console.log('Đã click nút.');
      
      const popup = await popupPromise;
      if (popup) {
        console.log('Popup xuất hiện!');
        await popup.waitForLoadState('networkidle');
        const popupUrl = popup.url();
        console.log('Popup URL:', popupUrl);
        const text = await popup.innerText('body');
        if (text.includes('origin_mismatch') || popupUrl.includes('origin_mismatch')) {
          console.log('❌ KẾT QUẢ: Vẫn bị lỗi origin_mismatch!');
        } else {
          console.log('✅ KẾT QUẢ: Thành công! Không bị lỗi.');
        }
      } else {
        console.log('Không nhận được popup (có thể do cơ chế bảo mật headless của Google chặn click tự động).');
        console.log('Hãy thử kiểm tra console log ở trên xem Google có in ra lỗi origin_mismatch nào không.');
      }
    } else {
      console.log('Không thấy nút Google.');
    }
  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await browser.close();
  }
})();
