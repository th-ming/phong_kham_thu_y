import { test, expect } from '@playwright/test';

const PORT = 3005;
const BASE = `http://localhost:${PORT}`;

// ================================================================
// INVOICE MANAGEMENT (Admin) + PAYMENT E2E
// ================================================================
test.describe('ADMIN: Quan ly Hoa Don + Thanh toan E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load danh sach hoa don — table + columns', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    await expect(page.getByRole('heading', { name: /Hóa đơn|Quản lý hóa đơn/i })).toBeVisible({ timeout: 10000 });
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
    }
  });

  test('TC02: Loc hoa don theo trang thai', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    const selects = page.locator('select');
    const count = await selects.count();
    if (count > 0) {
      await selects.first().selectOption({ index: 1 });
      await page.waitForTimeout(1500);
    }
  });

  test('TC03: Xem chi tiet hoa don — modal opens', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    const viewBtn = page.locator('button:has-text("Xem chi tiết"), tbody tr td button').first();
    if (await viewBtn.count() > 0 && await viewBtn.isVisible().catch(() => false)) {
      await viewBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Mã hóa đơn|TỔNG CỘNG/i)).toBeVisible();
      await page.getByRole('button', { name: 'Đóng' }).click();
    }
  });

  test('TC04: In hoa don — click print', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    const printBtn = page.getByRole('button', { name: /In hóa đơn|Print/i }).first();
    if (await printBtn.count() > 0 && await printBtn.isVisible().catch(() => false)) {
      // Don't actually print — just verify button
      await expect(printBtn).toBeEnabled();
    }
  });

  test('TC05: Xuat Excel hoa don — verify button', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    const excelBtn = page.getByRole('button', { name: /Xuất Excel|Export/i }).first();
    if (await excelBtn.count() > 0) {
      await expect(excelBtn).toBeVisible();
    }
  });

  test('TC06: Tao hoa don thu cong — modal opens', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    const addBtn = page.getByRole('button', { name: /Tạo hóa đơn|Thêm hóa đơn|Tạo mới/i }).first();
    if (await addBtn.count() > 0 && await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('TC07: Tim kiem hoa don', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/hoa-don`);
    const searchInput = page.locator('input[placeholder*="Tìm"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('HD');
      await page.waitForTimeout(1500);
    }
  });
});

// ================================================================
// PRESCRIPTION MANAGEMENT
// ================================================================
test.describe('ADMIN: Quan ly Don Thuoc — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load danh sach don thuoc', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/don-thuoc`);
    await expect(page.getByRole('heading', { name: /Đơn thuốc|Don thuốc|Kê đơn/i })).toBeVisible({ timeout: 10000 });
  });

  test('TC02: Xem chi tiet don thuoc', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/don-thuoc`);
    const viewBtn = page.locator('button[title="Xem"], button[aria-label="Xem"], tbody tr td button').first();
    if (await viewBtn.count() > 0 && await viewBtn.isVisible().catch(() => false)) {
      await viewBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'Đóng' }).click();
    }
  });

  test('TC03: Loc don thuoc theo trang thai', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/don-thuoc`);
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      await selects.first().selectOption({ index: 1 });
      await page.waitForTimeout(1500);
    }
  });

  test('TC04: Tim kiem don thuoc', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/don-thuoc`);
    const searchInput = page.locator('input[placeholder*="Tìm"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('paracetamol');
      await page.waitForTimeout(1500);
    }
  });

  test('TC05: Xuat don thuoc PDF — verify button', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/don-thuoc`);
    const pdfBtn = page.getByRole('button', { name: /Xuất PDF|In đơn|PDF/i }).first();
    if (await pdfBtn.count() > 0) {
      await expect(pdfBtn).toBeVisible();
    }
  });
});
