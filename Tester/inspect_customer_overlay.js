const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto("http://localhost:3001/dang-nhap", { waitUntil: "domcontentloaded" });
  await page.locator('[data-ai-id="input-dangnhapdangky-8dku"]').fill("testcustomer2");
  await page.locator('[data-ai-id="input-dangnhapdangky-h1ru"]').fill("Password123!");
  await page.locator('[data-ai-id="button-dangnhapdangky-xgfa"]').click();
  await page.waitForURL(/khach-hang/, { timeout: 20000 });
  await page.goto("http://localhost:3001/khach-hang/hoa-don-thanh-toan", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const overlays = await page.evaluate(() =>
    Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          (style.position === "fixed" || style.position === "absolute") &&
          rect.width > 300 &&
          rect.height > 180
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id,
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent?.trim().slice(0, 180),
          position: getComputedStyle(element).position,
          zIndex: getComputedStyle(element).zIndex,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      })
  );

  console.log(JSON.stringify(overlays, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
