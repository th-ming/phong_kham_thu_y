const { chromium } = require('playwright');

const servicesMock = [
  {
    id_dich_vu: 1,
    ten_dich_vu: "Khám lâm sàng tổng quát",
    mo_ta: "Bác sĩ kiểm tra tổng quát, đánh giá tình trạng hiện tại và tư vấn phác đồ phù hợp nhất cho bé.",
    gia: 150000,
    thoi_luong_phut: 30,
    trang_thai: true
  }
];

async function inspectNetwork() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', req => console.log('REQ:', req.url(), req.method()));
  page.on('response', res => console.log('RES:', res.url(), res.status()));

  await page.route('**/api/dich-vu', async (route) => {
    console.log('INTERCEPTED /api/dich-vu');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(servicesMock)
    });
  });
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat');
  await page.waitForTimeout(5000);
  await browser.close();
}

inspectNetwork().catch(console.error);
