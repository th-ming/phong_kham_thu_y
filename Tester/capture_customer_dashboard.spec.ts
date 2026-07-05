import { test, expect } from "@playwright/test";

const FRONTEND = "https://rexi-vet-clinic.vercel.app";
const ARTIFACT = "C:\\Users\\84916\\.gemini\\antigravity\\brain\\9d838657-7fcb-4299-9fb5-288fb554bf21";

test("Capture Customer Dashboard to verify padding", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Login
    await page.goto(FRONTEND + "/dang-nhap", { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.locator("input").nth(0).fill("khachhang");
    await page.locator("input[type=password]").first().fill("khachhang@rexi.com");
    await page.locator("button[type=submit]").first().click();
    
    // Wait for redirect to dashboard
    await page.waitForURL("**/khach-hang/dashboard", { timeout: 60000 });
    await page.waitForTimeout(5000); // Wait for animations to settle
    
    // Take screenshot of the dashboard
    await page.screenshot({ path: ARTIFACT + "\\screenshot_customer_dashboard_padding.png" });
});
