import { test, expect } from '@playwright/test';

const FRONTEND_PORT = 3005;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

test('DEBUG: Chup man hinh trang dang ky', async ({ page }) => {
  await page.goto(`${BASE_URL}/dang-nhap`);
  await expect(page).toHaveURL(/.*dang-nhap/);
  
  // Click chuyen sang form dang ky
  await page.getByText('Đăng ký ngay').click();
  
  // Cho page load
  await page.waitForTimeout(3000);
  
  // Chup man hinh
  await page.screenshot({ path: 'D:/QLy Phòng Khám Thú Y/Tester/test-results/debug-dang-ky.png', fullPage: true });
  
  // In HTML de debug
  const html = await page.content();
  console.log('PAGE TITLE:', await page.title());
  console.log('CURRENT URL:', page.url());
  console.log('HAS HO VA TEN:', html.includes('Họ và tên'));
  console.log('HAS EMAIL:', html.includes('Email'));
  console.log('HAS SDT:', html.includes('Số điện thoại'));
  
  // List all placeholders
  const placeholders = await page.locator('input[placeholder], input').all();
  console.log('NUM INPUTS:', placeholders.length);
  for (let i = 0; i < Math.min(placeholders.length, 10); i++) {
    const ph = await placeholders[i].getAttribute('placeholder').catch(() => '(no placeholder)');
    console.log(`  Input ${i}: placeholder="${ph}"`);
  }
  
  test.skip(true, 'Debug only');
});
