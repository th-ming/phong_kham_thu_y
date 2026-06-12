const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3005/dang-nhap", { waitUntil: "networkidle" });
  
  const metrics = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    
    // Find any elements overflowing horizontally
    const overflowingElements = [];
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > 390) {
        // Only report if it has visible content or block layout
        const style = getComputedStyle(el);
        if (style.display !== 'none' && rect.width > 0 && rect.height > 0) {
          overflowingElements.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: rect.right,
            width: rect.width,
            text: el.textContent?.trim().slice(0, 30)
          });
        }
      }
    }
    
    return {
      scrollWidth,
      clientWidth,
      bodyScrollWidth,
      overflowingElements: overflowingElements.slice(0, 10)
    };
  });
  
  console.log("Layout Verification Metrics:", JSON.stringify(metrics, null, 2));
  await browser.close();
}

run().catch(console.error);
