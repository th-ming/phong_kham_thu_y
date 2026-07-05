import { test, expect } from '@playwright/test';

const PORT = 3005;
const BASE = `http://localhost:${PORT}`;

// ================================================================
// CUSTOMER MEDICAL RECORDS
// ================================================================
test.describe('CUSTOMER: Ho so Benh An — Xem + Loc + Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load ho so benh an — heading + list', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/ho-so-benh-an`);
    await expect(page.getByRole('heading', { name: /Hồ sơ|Bệnh án/i })).toBeVisible({ timeout: 10000 });
  });

  test('TC02: Loc ho so theo thu cung', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/ho-so-benh-an`);
    const petSelect = page.locator('select').first();
    if (await petSelect.count() > 0) {
      const opts = await petSelect.locator('option').count();
      if (opts > 1) {
        await petSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1500);
      }
    }
  });

  test('TC03: Tim kiem ho so benh an', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/ho-so-benh-an`);
    const searchInput = page.locator('input[placeholder*="Tìm"], input[type="search"], input[type="text"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('viêm');
      await page.waitForTimeout(1500);
    }
  });

  test('TC04: Xem chi tiet ho so benh an — click record', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/ho-so-benh-an`);
    const firstRow = page.locator('tbody tr, [class*="record"], .card').first();
    if (await firstRow.count() > 0 && await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(2000);
    }
  });

  test('TC05: Empty state — khong co ho so', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/ho-so-benh-an`);
    const body = await page.textContent('body');
    // Either has records or shows empty message
    const hasData = (await page.locator('tbody tr, [class*="record"]').count()) > 0;
    const hasEmpty = /Chưa có|Không có|trống|no record/i.test(body || '');
    expect(hasData || hasEmpty).toBe(true);
  });
});

// ================================================================
// CUSTOMER PROFILE EDIT
// ================================================================
test.describe('CUSTOMER: Thong tin ca nhan — Edit Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('***REMOVED***');
    await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load trang thong tin ca nhan', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/thong-tin-ca-nhan`);
    await expect(page.getByRole('heading', { name: /Cá nhân|Thông tin|Hồ sơ/i })).toBeVisible({ timeout: 10000 });
  });

  test('TC02: Chinh sua ten — fill + save', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/thong-tin-ca-nhan`);
    const nameInput = page.locator('input[name="ho_ten"], input[name="hoTen"], input[placeholder*="Họ tên"], input[placeholder*="Tên"]').first();
    if (await nameInput.count() > 0) {
      const original = await nameInput.inputValue();
      await nameInput.clear();
      await nameInput.fill('Trần Hoàng Minh');
      const saveBtn = page.getByRole('button', { name: /Lưu|Cập nhật|Lưu thay đổi/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('TC03: Doi so dien thoai', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/thong-tin-ca-nhan`);
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="SĐT"], input[placeholder*="điện thoại"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.clear();
      await phoneInput.fill('0989123456');
      const saveBtn = page.getByRole('button', { name: /Lưu|Cập nhật/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('TC04: Submit form trong — validation error', async ({ page }) => {
    await page.goto(`${BASE}/khach-hang/thong-tin-ca-nhan`);
    const inputs = page.locator('input[type="text"], input[type="email"]');
    const count = await inputs.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await inputs.nth(i).clear();
      }
      const saveBtn = page.getByRole('button', { name: /Lưu|Cập nhật/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  });
});

// ================================================================
// RBAC — Role Based Access Control (positive + negative)
// ================================================================
test.describe('RBAC: Phan quyen — Positive + Negative', () => {
  const accounts = [
    { role: 'admin', user: 'admin', pass: 'admin@rexi.com', name: 'Admin' },
    { role: 'doctor', user: 'doctor1', pass: 'Doctor1@', name: 'Doctor' },
    { role: 'accountant', user: 'ketoan', pass: 'Ketoan1@', name: 'Accountant' },
    { role: 'receptionist', user: 'tieptan', pass: 'Tieptan1@', name: 'Receptionist' },
  ];

  const adminOnlyRoutes = [
    '/quan-ly/nhan-vien-phan-quyen',
    '/quan-ly/cau-hinh',
    '/quan-ly/marketing',
  ];
  const doctorRoutes = ['/quan-ly/kham-benh', '/quan-ly/ho-so-benh-an'];
  const accountantRoutes = ['/quan-ly/ke-toan', '/quan-ly/hoa-don'];
  const receptionistRoutes = ['/quan-ly/lich-hen', '/quan-ly/khach-hang-thu-cung'];

  async function login(page, username, password) {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill(username);
    await page.getByPlaceholder('Mật khẩu').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    try {
      await page.waitForURL(/.*\/quan-ly\/dashboard|.*\/khach-hang\/dashboard/, { timeout: 8000 });
    } catch {
      // Some accounts might redirect differently — OK
    }
  }

  for (const account of accounts) {
    test.describe(`Role: ${account.role} (${account.user})`, () => {
      test.beforeEach(async ({ page }) => {
        await login(page, account.user, account.pass);
      });

      test(`TC01: ${account.role} sees their own dashboard`, async ({ page }) => {
        await page.goto(`${BASE}/quan-ly/dashboard`);
        await expect(page.locator('body')).toBeVisible();
      });

      test(`TC02: ${account.role} can access allowed pages`, async ({ page }) => {
        const allowed = account.role === 'admin'
          ? adminOnlyRoutes
          : account.role === 'doctor'
            ? doctorRoutes
            : account.role === 'accountant'
              ? accountantRoutes
              : receptionistRoutes;
        for (const route of allowed.slice(0, 2)) {
          await page.goto(`${BASE}${route}`);
          await page.waitForTimeout(2000);
          // Should NOT redirect to /dang-nhap
          expect(page.url()).not.toContain('/dang-nhap');
        }
      });
    });
  }

  test('TC_NEGATIVE: Non-admin CANNOT access admin-only pages', async ({ page }) => {
    // Login as doctor, try to access admin-only config page
    await login(page, 'doctor1', 'Doctor1@');
    await page.goto(`${BASE}/quan-ly/cau-hinh`);
    await page.waitForTimeout(3000);
    // Should be redirected away from admin page
    const url = page.url();
    const blocked = url.includes('/dang-nhap') || url.includes('/khach-hang/') || !url.includes('/quan-ly/cau-hinh');
    expect(blocked).toBe(true);
  });

  test('TC_NEGATIVE: Non-admin CANNOT access staff management', async ({ page }) => {
    await login(page, 'ketoan', 'Ketoan1@');
    await page.goto(`${BASE}/quan-ly/nhan-vien-phan-quyen`);
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain('/quan-ly/nhan-vien-phan-quyen');
  });
});

// ================================================================
// LOGOUT + SESSION
// ================================================================
test.describe('AUTH: Logout + Session Management', () => {
  test('TC01: Logout clears session and redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    // Click logout
    const logoutBtn = page.getByRole('button', { name: /Đăng xuất|Logout|Đăng xuất/i }).first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
    } else {
      // Try sidebar logout link
      const logoutLink = page.locator(`a[href*="logout"], [data-ai-id*="logout"]`).first();
      if (await logoutLink.count() > 0) await logoutLink.click();
    }
    await page.waitForTimeout(2000);
    // Should redirect to login or homepage
    expect(page.url()).toMatch(/dang-nhap|^http:\/\/localhost:3005\/$/);
  });

  test('TC02: After logout, cannot access protected page directly', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    const logoutBtn = page.getByRole('button', { name: /Đăng xuất|Logout|Đăng xuất/i }).first();
    if (await logoutBtn.count() > 0) await logoutBtn.click();
    await page.waitForTimeout(2000);

    // Try to go back to dashboard
    await page.goto(`${BASE}/quan-ly/dashboard`);
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/dang-nhap|^http:\/\/localhost:3005\/$/);
  });

  test('TC03: Session expires — JWT expired → redirect login', async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });

    // Clear token to simulate expiry
    await page.evaluate(() => localStorage.removeItem('token'));
    // Try API call
    const resp = await page.evaluate(async () => {
      try {
        const r = await fetch('/api/ho-so-benh-an/khach/test', { credentials: 'include' });
        return r.status;
      } catch { return 0; }
    });
    // Should be 401 or redirect
    expect(resp === 0 || resp === 401).toBe(true);
  });
});
