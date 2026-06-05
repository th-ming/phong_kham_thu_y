const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const artifactDir = path.join(__dirname, "test-results");
const appUrl = process.env.REXI_APP_URL || "http://127.0.0.1:3005/khach-hang/thong-tin-ca-nhan";
const operaPath = process.env.OPERA_PATH || "C:\\Users\\84916\\AppData\\Local\\Programs\\Opera\\opera.exe";

const launchOptions = {
  headless: process.env.HEADED === "1" ? false : true,
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--no-sandbox",
  ],
};

if (fs.existsSync(operaPath)) {
  launchOptions.executablePath = operaPath;
  console.log(`[INFO] Testing with Opera: ${operaPath}`);
} else {
  console.log("[INFO] Opera executable not found. Falling back to bundled Chromium with Opera user-agent.");
}

fs.mkdirSync(artifactDir, { recursive: true });

(async () => {
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["microphone"],
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0",
  });

  await context.addInitScript(() => {
    localStorage.setItem("token", "playwright-fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "KH-PLAYWRIGHT",
        id_khach_hang: "KH-PLAYWRIGHT",
        ten_khach_hang: "Khach Test Opera",
        ten_dang_nhap: "khach_test_opera",
        loai_tai_khoan: "khach_hang",
        ten_vai_tro: "Khach hang",
        nam_sinh: 1998,
      })
    );
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  let transcribeCalls = 0;
  let chatCalls = 0;

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.stack || err.message));

  await page.route("**/api/chat/transcribe", async (route) => {
    transcribeCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ text: "mo thong tin bac si phu trach kham cho thu cung" }),
    });
  });

  await page.route("**/api/chat", async (route) => {
    chatCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ reply: "Da nhan transcript tu Opera Whisper." }),
    });
  });

  const clickMicButton = async () =>
    page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const button = buttons.find((item) => /\bmic\b|mic_none/.test((item.textContent || "").trim()));
      if (!button) throw new Error("Mic button not found");
      button.click();
      return {
        title: button.getAttribute("title"),
        text: button.textContent,
      };
    });

  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    const operaDetected = await page.evaluate(() => /OPR\//.test(navigator.userAgent));
    await page.locator("#chatBtn").click({ timeout: 10000 });
    await page.waitForTimeout(800);

    const hookReady = await page.evaluate(() => Boolean(window.__REXI_VOICE_TEST__));
    const firstClick = await clickMicButton();
    await page.waitForTimeout(1200);
    const stateAfterStart = await page.evaluate(() => window.__REXI_VOICE_TEST__?.state?.());
    const secondClick = await clickMicButton();
    await page.waitForTimeout(4500);
    const stateAfterStop = await page.evaluate(() => window.__REXI_VOICE_TEST__?.state?.());
    const bodyText = await page.locator("body").innerText();
    const screenshotPath = path.join(artifactDir, "opera-whisper-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const result = {
      operaDetected,
      hookReady,
      firstClick,
      secondClick,
      stateAfterStart,
      stateAfterStop,
      transcribeCalls,
      chatCalls,
      transcriptVisible: bodyText.toLowerCase().includes("mo thong tin bac si"),
      consoleErrors: consoleErrors.slice(0, 8),
      pageErrors,
      screenshotPath: path.relative(rootDir, screenshotPath),
    };

    console.log(JSON.stringify(result, null, 2));

    if (!operaDetected) throw new Error("Opera user-agent was not detected.");
    if (!hookReady) throw new Error("Voice test hook is not available.");
    if (stateAfterStart?.recognitionRunning) throw new Error("Opera path should not start SpeechRecognition.");
    if (transcribeCalls !== 1) throw new Error(`Expected 1 transcribe call, got ${transcribeCalls}.`);
    if (!result.transcriptVisible) throw new Error("Transcribed text was not visible in the UI.");
  } finally {
    await browser.close();
  }
})();
