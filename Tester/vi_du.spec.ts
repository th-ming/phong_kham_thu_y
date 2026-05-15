import { test, expect } from '@playwright/test';

/**
 * Các kịch bản kiểm thử mẫu cơ bản của Playwright
 * Sử dụng để kiểm tra cài đặt công cụ và tham khảo cú pháp
 */

test('Kiểm tra tiêu đề trang chủ Playwright', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Xác nhận tiêu đề trang có chứa chuỗi ký tự cụ thể
  await expect(page).toHaveTitle(/Playwright/);
});

test('Kiểm tra điều hướng đến trang hướng dẫn', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Tìm và nhấn vào liên kết "Get started"
  await page.getByRole('link', { name: 'Get started' }).click();

  // Xác nhận URL thay đổi sang trang giới thiệu
  await expect(page).toHaveURL(/.*intro/);
});
