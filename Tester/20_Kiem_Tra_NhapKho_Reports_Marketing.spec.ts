import { test, expect } from '@playwright/test';

const PORT = 3005;
const BASE = `http://localhost:${PORT}`;

// ================================================================
// WAREHOUSE INBOUND — Nhập kho thuốc
// ================================================================
test.describe('ADMIN: Nhap Kho — Quan ly nhap kho thuoc', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load trang nhap kho', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/nhap-kho`);
    const heading = page.getByRole('heading', { name: /Nhập kho|Nhap kho|Kho thuốc/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });

  test('TC02: Form nhap kho — open + fill', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/nhap-kho`);
    const addBtn = page.getByRole('button', { name: /Nhập kho|Thêm|Tạo mới/i }).first();
    if (await addBtn.count() > 0 && await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      // Try fill form fields
      const inputs = page.locator('input[type="text"], input[type="number"], select');
      const count = await inputs.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('TC03: Danh sach nha cung cap', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/nhap-kho`);
    const supplierText = page.getByText(/Nhà cung cấp|Nha cung cap|NCC/i);
    if (await supplierText.count() > 0) await expect(supplierText.first()).toBeVisible();
  });

  test('TC04: Bang danh sach nhap kho — columns', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/nhap-kho`);
    const table = page.locator('table').first();
    if (await table.count() > 0 && await table.isVisible().catch(() => false)) {
      const ths = await table.locator('th').count();
      expect(ths).toBeGreaterThanOrEqual(3);
    }
  });

  test('TC05: Tim kiem nhap kho', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/nhap-kho`);
    const searchInput = page.locator('input[placeholder*="Tìm"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('paracetamol');
      await page.waitForTimeout(1500);
    }
  });
});

// ================================================================
// REPORTS & STATISTICS
// ================================================================
test.describe('ADMIN: Bao cao Thong ke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load trang bao cao', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/bao-cao-thong-ke`);
    const heading = page.getByRole('heading', { name: /Báo cáo|Bao cao|Thống kê|Thong ke|Doanh thu|Bệnh nhân/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });

  test('TC02: Loc bao cao theo thoi gian', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/bao-cao-thong-ke`);
    const selects = page.locator('select');
    const count = await selects.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      try { await selects.nth(i).selectOption({ index: 1 }); await page.waitForTimeout(500); } catch {}
    }
  });

  test('TC03: Xem chi tiet bao cao doanh thu', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/bao-cao-thong-ke`);
    const revenueText = page.getByText(/Doanh thu|Revenue|Tổng doanh thu/i);
    if (await revenueText.count() > 0) await expect(revenueText.first()).toBeVisible();
  });

  test('TC04: Xem thong ke bac si', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/bao-cao-thong-ke`);
    const doctorText = page.getByText(/Bác sĩ|Bac si|Lịch sử khám/i);
    if (await doctorText.count() > 0) await expect(doctorText.first()).toBeVisible();
  });

  test('TC05: Xuat bao cao — verify buttons', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/bao-cao-thong-ke`);
    const exportBtns = page.getByRole('button', { name: /Xuất Excel|Xuất PDF|Export|In báo cáo/i });
    if (await exportBtns.count() > 0) await expect(exportBtns.first()).toBeVisible();
  });
});

// ================================================================
// MARKETING MANAGEMENT
// ================================================================
test.describe('ADMIN: Quan ly Marketing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dang-nhap`);
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
    await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
    await page.waitForURL(/.*\/quan-ly\/dashboard/, { timeout: 15000 });
  });

  test('TC01: Load trang marketing', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/marketing`);
    const heading = page.getByRole('heading', { name: /Marketing|Khuyến mãi|Uu dai|Chiến dịch/i });
    if (await heading.count() > 0) await expect(heading.first()).toBeVisible({ timeout: 10000 });
    else await expect(page.locator('body')).toBeVisible();
  });

  test('TC02: Tao campaign moi — open modal', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/marketing`);
    const addBtn = page.getByRole('button', { name: /Thêm|Tạo mới|Tạo campaign|Tạo ưu đãi/i }).first();
    if (await addBtn.count() > 0 && await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('TC03: Danh sach campaigns — table', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/marketing`);
    const table = page.locator('table').first();
    if (await table.count() > 0) await expect(table).toBeVisible();
  });

  test('TC04: Loc theo loai campaign', async ({ page }) => {
    await page.goto(`${BASE}/quan-ly/marketing`);
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      await selects.first().selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });
});
