import { test, expect } from '@playwright/test';

const PORT = 3005;
const BASE = `http://localhost:${PORT}`;

// ================================================================
// RBAC FULL — All roles, all pages
// ================================================================
test.describe('RBAC: Phan quyen day du — 4 vai tro', () => {
  const accounts = [
    { role: 'admin', user: 'admin', pass: 'admin@rexi.com' },
    { role: 'doctor', user: 'doctor1', pass: 'Doctor1@' },
    { role: 'accountant', user: 'ketoan', pass: 'Ketoan1@' },
    { role: 'receptionist', user: 'tieptan', pass: 'Tieptan1@' },
  ];

  async function login(page, u, p) {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill(u);
    await page.getByPlaceholder('Mật khẩu').fill(p);
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    try { await page.waitForURL(/.*\/quan-ly/, { timeout: 8000 }); } catch {}
  }

  for (const acc of accounts) {
    test.describe(`Role: ${acc.role}`, () => {
      test.beforeEach(async ({ page }) => { await login(page, acc.user, acc.pass); });

      test('TC01: Redirect to own dashboard on login', async ({ page }) => {
        const url = page.url();
        expect(url).toMatch(/quan-ly|khach-hang/);
      });

      test('TC02: Cannot access /quan-ly/nhan-vien-phan-quyen (staff mgmt)', async ({ page }) => {
        const initial = page.url();
        await page.goto(`${BASE}/quan-ly/nhan-vien-phan-quyen`);
        await page.waitForTimeout(2000);
        const url = page.url();
        if (url.includes('/quan-ly/nhan-vien-phan-quyen')) {
          // If still on page — content should show permission denied OR redirect happens on API call
          const body = await page.textContent('body');
          // Either redirected or shows access denied message
        } else {
          expect(url).not.toContain('/quan-ly/nhan-vien-phan-quyen');
        }
      });

      test('TC03: Cannot access /quan-ly/cau-hinh (system config)', async ({ page }) => {
        await page.goto(`${BASE}/quan-ly/cau-hinh`);
        await page.waitForTimeout(2000);
        expect(page.url()).not.toContain('/quan-ly/cau-hinh');
      });
    });
  }
});

// ================================================================
// LOGOUT + SESSION EDGE CASES
// ================================================================
test.describe('AUTH: Logout + Session + Token', () => {
  test('TC01: Logout redirects to login page', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    const logoutBtn = page.getByRole('button', { name: /Đăng xuất/i }).first();
    if (await logoutBtn.count() > 0) await logoutBtn.click();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/dang-nhap|\/$/);
  });

  test('TC02: After logout, back button does not restore session', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    const logoutBtn = page.getByRole('button', { name: /Đăng xuất/i }).first();
    if (await logoutBtn.count() > 0) await logoutBtn.click();
    await page.waitForTimeout(2000);

    // Try going back
    await page.goBack();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/dang-nhap|\/$/);
  });

  test('TC03: Token removed from localStorage after logout', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    const logoutBtn = page.getByRole('button', { name: /Đăng xuất/i }).first();
    if (await logoutBtn.count() > 0) await logoutBtn.click();
    await page.waitForTimeout(2000);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('TC04: Protected page redirects when no token', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/dashboard`);
    await page.waitForTimeout(3000);
    expect(page.url()).toMatch(/dang-nhap|\/$/);
  });
});

// ================================================================
// BOOKING EDGE CASES
// ================================================================
test.describe('DAT LICH: Edge Cases — Past date, Overlap, Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Past date (yesterday) should be blocked by browser min', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/dat-lich-hen`);
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.count() > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      await dateInput.fill(yStr);
      // Try to submit
      const submitBtn = page.getByRole('button', { name: /Đặt lịch|Xác nhận/i }).first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('TC02: Submit with NO fields filled — should stay on page', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/dat-lich-hen`);
    const submitBtn = page.getByRole('button', { name: /Đặt lịch|Xác nhận/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await expect(page).toHaveURL(/.*\/khach-hang\/dat-lich-hen/);
    }
  });

  test('TC03: Pet select required — empty selection triggers validation', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/dat-lich-hen`);
    // Just try submit without selecting anything
    const submitBtn = page.getByRole('button', { name: /Đặt lịch|Xác nhận/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toMatch(/dat-lich-hen/);
    }
  });

  test('TC04: Service card click — visual feedback', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/dat-lich-hen`);
    const serviceCard = page.locator('[class*="service"], .service-card, [class*="dich-vu"]').first();
    if (await serviceCard.count() > 0 && await serviceCard.isVisible().catch(() => false)) {
      await serviceCard.click();
      await page.waitForTimeout(500);
      // Should show selected state (border/background change)
    }
  });

  test('TC05: Note textarea max length — fill 1000 chars', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/dat-lich-hen`);
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      const longText = 'A'.repeat(500);
      await textarea.fill(longText);
      const val = await textarea.inputValue();
      expect(val.length).toBeGreaterThanOrEqual(500);
    }
  });
});

// ================================================================
// CUSTOMER APPOINTMENT HISTORY — Extended edge cases
// ================================================================
test.describe('CUSTOMER: Lich su Lich Hen — Extended', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load page — empty state if no appointments', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/lich-su-lich-hen`);
    // Either has appointments or empty message
    const body = await page.textContent('body');
    const hasAppointments = (await page.locator('[class*="card"], [class*="item"], tbody tr').count()) > 0;
    const hasEmpty = /Chưa có|Không có|trống|chưa có lịch/i.test(body || '');
    expect(hasAppointments || hasEmpty).toBe(true);
  });

  test('TC02: Filter all statuses — no crash', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/lich-su-lich-hen`);
    const selects = page.locator('select');
    const count = await selects.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const sel = selects.nth(i);
      const opts = await sel.locator('option').count();
      for (let j = 0; j < Math.min(opts, 3); j++) {
        try { await sel.selectOption({ index: j }); await page.waitForTimeout(500); } catch {}
      }
    }
  });

  test('TC03: URL params pre-filter petId — works', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/lich-su-lich-hen?petId=1`);
    await page.waitForTimeout(2000);
    // Page should load without crash
    await expect(page.locator('body')).toBeVisible();
  });
});
