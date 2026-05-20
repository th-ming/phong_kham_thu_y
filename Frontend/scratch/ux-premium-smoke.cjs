const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const expectedInfraNoise =
      text.includes("ERR_NETWORK_ACCESS_DENIED") ||
      text.includes("WebSocket connection") ||
      text.includes("CORS policy") ||
      text.includes("Failed to fetch") ||
      text.includes("Lỗi tải Lottie") ||
      text.includes("403 (Forbidden)") ||
      text.includes("ERR_FAILED");
    if (!expectedInfraNoise) errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:3001/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const homeCounts = await page.evaluate(() => ({
    magnetic: document.querySelectorAll(".magnetic-btn").length,
    spotlight: document.querySelectorAll(".premium-spotlight-card").length,
    reveal: document.querySelectorAll(".scroll-reveal").length,
    textLength: document.body.innerText.length,
  }));
  await page.screenshot({ path: "artifacts/ux-premium-home.png", fullPage: false });

  const login = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  login.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const expectedInfraNoise =
      text.includes("ERR_NETWORK_ACCESS_DENIED") ||
      text.includes("WebSocket connection") ||
      text.includes("CORS policy") ||
      text.includes("Failed to fetch") ||
      text.includes("Lỗi tải Lottie") ||
      text.includes("403 (Forbidden)") ||
      text.includes("ERR_FAILED");
    if (!expectedInfraNoise) errors.push(text);
  });
  login.on("pageerror", (error) => errors.push(error.message));

  await login.goto("http://127.0.0.1:3001/dang-nhap", { waitUntil: "domcontentloaded" });
  await login.waitForTimeout(7000);
  await login.screenshot({ path: "artifacts/ux-premium-login.png", fullPage: false });

  const loginCounts = await login.evaluate(() => ({
    magnetic: document.querySelectorAll(".magnetic-btn").length,
    spotlight: document.querySelectorAll(".premium-spotlight-card").length,
    reveal: document.querySelectorAll(".scroll-reveal").length,
    textLength: document.body.innerText.length,
  }));

  await browser.close();

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  console.log(JSON.stringify({ home: homeCounts, login: loginCounts }));
})();
