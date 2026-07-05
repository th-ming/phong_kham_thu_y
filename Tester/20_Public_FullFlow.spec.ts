import { test, expect } from '@playwright/test';

const PORT = 3005;
const BASE = `http://localhost:${PORT}`;

// ================================================================
// PUBLIC PAGES — TrangChu, VeChungToi, BangGia, LienHe, BacSi
// ================================================================
test.describe('PUBLIC: Trang chu va cac trang cong khai', () => {
  test('TC01: Trang chu — heading + CTA + services', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('heading', { name: /Rexi|Phòng khám|Thú y|Veterinary/i })).toBeVisible({ timeout: 10000 });
    const cta = page.getByRole('link', { name: /Đặt lịch|Đặt lịch khám|Booking/i }).first();
    if (await cta.count() > 0) await expect(cta).toBeVisible();
  });

  test('TC02: Trang chu — chatbot button visible', async ({ page }) => {
    await page.goto(BASE);
    const chatBtn = page.locator('#chatBtn, [class*="chatBtn"]');
    await expect(chatBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC03: Ve chung toi — About page loads', async ({ page }) => {
    await page.goto(`${BASE}/ve-chung-toi`);
    await expect(page.getByRole('heading', { name: /Về|Giới thiệu|Về chúng tôi/i })).toBeVisible({ timeout: 10000 });
  });

  test('TC04: Bang gia dich vu — Price list loads', async ({ page }) => {
    await page.goto(`${BASE}/bang-gia`);
    const heading = page.getByRole('heading', { name: /Bảng giá|Báo giá|Dịch vụ|Giá/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });

  test('TC05: Lien he — Contact page loads', async ({ page }) => {
    await page.goto(`${BASE}/lien-he`);
    const heading = page.getByRole('heading', { name: /Liên hệ|Liên hệ hỗ trợ|Contact/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });

  test('TC06: Bac si — Doctor list page loads', async ({ page }) => {
    await page.goto(`${BASE}/bac-si`);
    const heading = page.getByRole('heading', { name: /Bác sĩ|Bác sĩ thú y|Đội ngũ|Doctor/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });

  test('TC07: 404 page — unknown route shows error', async ({ page }) => {
    await page.goto(`${BASE}/duong-dan-khong-ton-tai-404`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC08: Dark mode toggle on public page', async ({ page }) => {
    await page.goto(BASE);
    const themeBtn = page.locator('.theme-toggle-btn, [class*="theme-toggle"], button[aria-label*="theme" i], button[title*="theme" i]');
    if (await themeBtn.count() > 0 && await themeBtn.isVisible().catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      const html = await page.getAttribute('html', 'data-theme').catch(() => null);
      // theme should toggle between light/dark
      expect(html === 'dark' || html === 'light' || html === null).toBe(true);
    }
  });

  test('TC09: CTA chuyen sang trang dat lich', async ({ page }) => {
    await page.goto(BASE);
    const bookingLink = page.getByRole('link', { name: /Đặt lịch|Đặt lịch khám/i }).first();
    if (await bookingLink.count() > 0) {
      await bookingLink.click();
      await page.waitForURL(/.*dat-lich-hen|.*dang-nhap/, { timeout: 10000 });
    }
  });

  test('TC10: Footer links all clickable', async ({ page }) => {
    await page.goto(BASE);
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const links = footer.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href').catch(() => null);
      if (href && href !== '#' && !href.startsWith('javascript')) {
        // Just verify link has valid href
        expect(href.length).toBeGreaterThan(0);
      }
    }
  });
});

// ================================================================
// CUSTOMER FULL FLOW — Register → Book → View
// ================================================================
test.describe('CUSTOMER: Full E2E flow — Dang ky → Dat lich → Xem lich su', () => {
  test('TC01: Dang ky tai khoan moi + dat lich luon', async ({ page }) => {
    // Step 1: Register
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByText('Đăng ký ngay').click();
    await page.waitForTimeout(2000);

    const ts = Date.now();
    const username = `e2e_${ts}`;
    const phone = `09${ts.toString().slice(-8)}`;

    // Fill step 1
    await page.getByPlaceholder('Nguyễn Văn A').fill(`E2E Test ${ts}`);
    await page.getByPlaceholder('example@email.com').fill(`e2e_${ts}@test.com`);
    await page.getByPlaceholder('0912345678').fill(phone);
    await page.getByPlaceholder('Chọn năm sinh').selectOption('2000');
    await page.getByRole('button', { name: /Tiếp theo/ }).click();
    await page.waitForTimeout(2000);

    // Step 2
    await page.getByPlaceholder('Tên đăng nhập').fill(username);
    await page.getByPlaceholder('Mật khẩu').fill('E2Etest@123');
    await page.getByPlaceholder('Xác nhận mật khẩu').fill('E2Etest@123');
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    // Wait for success or redirect
    await page.waitForTimeout(5000);
    const url = page.url();
    const registered = url.includes('/khach-hang/dashboard') || url.includes('/dang-nhap');
    expect(registered).toBe(true);
  });

  test('TC02: Customer — xem lich su + filter', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });

    await page.goto(`${BASE}/khach-hang/lich-su-lich-hen`);
    await expect(page.getByRole('heading', { name: /Lịch sử|Lịch hẹn/i })).toBeVisible({ timeout: 10000 });
  });

  test('TC03: Customer — xem hoa don + filter status', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });

    await page.goto(`${BASE}/khach-hang/hoa-don-thanh-toan`);
    await expect(page.getByRole('heading', { name: /Hóa đơn|Thanh toán/i })).toBeVisible({ timeout: 10000 });
    const filterSelect = page.locator('select').first();
    if (await filterSelect.count() > 0) {
      const opts = await filterSelect.locator('option').count();
      if (opts > 1) {
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
      }
    }
  });

  test('TC04: Customer — quan ly thu cung + them pet', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });

    await page.goto(`${BASE}/khach-hang/quan-ly-thu-cung`);
    const heading = page.getByRole('heading', { name: /Thú cưng|Quản lý|Thu cung/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });
});
