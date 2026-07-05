import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  /* IMPORTANT: fullyParallel=false và workers=1 là BẮT BUỘC.
   * Lý do: Backend có brute-force lockout (5 lần sai → khóa 15 phút).
   * Nếu chạy parallel, nhiều test cùng login 1 lúc → trigger lockout → tất cả test sau fail timeout.
 * Root cause: 2026-07-02 - Xem Documentation/DEBUG_GUIDE.md */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results.json' }]],
  timeout: 90000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
