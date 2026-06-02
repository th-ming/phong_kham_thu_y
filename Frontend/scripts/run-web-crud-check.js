const { chromium } = require("playwright");

const baseUrl = "http://localhost:3001";

async function main() {
  const context = await chromium.launchPersistentContext("../.tmp/pw-profile", {
    channel: "msedge",
    headless: true,
    viewport: { width: 1440, height: 950 },
    args: ["--disk-cache-dir=../.tmp/pw-cache", "--disable-dev-shm-usage"]
  });
  const page = context.pages()[0] || await context.newPage();
  const result = {
    login: "pending",
    agentPing: "pending",
    appointmentPage: "pending",
    findings: []
  };

  page.on("console", msg => {
    if (msg.type() === "error") result.findings.push(`console error: ${msg.text().slice(0, 300)}`);
  });
  page.on("dialog", dialog => dialog.accept().catch(() => {}));
  page.on("response", response => {
    const status = response.status();
    if (status >= 400) result.findings.push(`http ${status}: ${response.url()}`);
    if (response.url().includes("/api/lich-hen") && status >= 400) {
      response.text().then(text => result.findings.push(`lich-hen error body: ${text.slice(0, 500)}`)).catch(() => {});
    }
  });
  page.on("pageerror", err => result.findings.push(`page error: ${err.message.slice(0, 300)}`));

  try {
    console.error("STEP login");
    await page.goto(`${baseUrl}/dang-nhap`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator("input").first().fill("admin");
    await page.locator('input[type="password"]').first().fill("admin@rexi.com");
    await page.locator('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Dang nhap")').first().click();
    await page.waitForURL(/quan-ly|dashboard|\/$/, { timeout: 30000 });
    result.login = page.url();

    console.error("STEP agent");
    await page.goto(`${baseUrl}/quan-ly/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const chatButton = page.locator("#chatBtn, [data-ai-id='button-chatbot-yhoj']").first();
    await chatButton.click({ timeout: 15000 });
    await page.locator("text=Rexi Agent").first().click({ timeout: 10000 });
    const textarea = page.locator("textarea").last();
    await textarea.fill("ping");
    const sendButton = page.locator("button").filter({ hasText: /send|progress_activity|gửi|gui/i }).last();
    await sendButton.click({ timeout: 10000 });
    await page.waitForTimeout(12000);
    const bodyText = await page.locator("body").innerText();
    result.agentPing = bodyText.includes("Rexi") || bodyText.includes("sẵn sàng") || bodyText.includes("hỗ trợ")
      ? "responded"
      : "no clear response";

    console.error("STEP appointment page");
    await page.goto(`${baseUrl}/quan-ly/lich-hen`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const buttons = await page.locator("button").evaluateAll(nodes => nodes.slice(0, 40).map(n => n.innerText.trim()).filter(Boolean));
    const inputs = await page.locator("input, select, textarea").evaluateAll(nodes => nodes.slice(0, 40).map(n => ({
      tag: n.tagName,
      type: n.getAttribute("type"),
      placeholder: n.getAttribute("placeholder"),
      value: n.value,
      text: n.innerText
    })));
    result.appointmentPage = { url: page.url(), buttons, inputs };

    const addAppointment = page.locator("button").filter({ hasText: /Thêm lịch hẹn|Them lich hen/i }).first();
    await addAppointment.click({ timeout: 10000 });
    await page.waitForTimeout(1500);
    const modalText = await page.locator("body").innerText();
    const modalInputs = await page.locator("input, select, textarea").evaluateAll(nodes => nodes.slice(0, 80).map((n, idx) => ({
      idx,
      tag: n.tagName,
      type: n.getAttribute("type"),
      placeholder: n.getAttribute("placeholder"),
      name: n.getAttribute("name"),
      value: n.value,
      text: n.innerText
    })));
    const modalButtons = await page.locator("button").evaluateAll(nodes => nodes.slice(0, 80).map((n, idx) => ({ idx, text: n.innerText.trim(), id: n.getAttribute("data-ai-id") })).filter(x => x.text || x.id));
    result.addAppointmentModal = {
      visible: /Tạo lịch|Thêm lịch|Khách hàng|SĐT|thu cưng|thú cưng/i.test(modalText),
      inputs: modalInputs,
      buttons: modalButtons
    };

    const unique = Date.now();
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="số điện thoại"], input[placeholder*="SĐT"]').last();
    await phoneInput.fill(`098${String(unique).slice(-7)}`);
    await page.locator('[data-ai-id="button-modaltaolichhenadmin-tpay"], button').filter({ hasText: /Tìm kiếm/i }).first().click();
    await page.waitForTimeout(2500);
    result.afterCustomerSearch = {
      text: (await page.locator("body").innerText()).slice(0, 4000),
      inputs: await page.locator("input, select, textarea").evaluateAll(nodes => nodes.slice(0, 100).map((n, idx) => ({
        idx,
        tag: n.tagName,
        type: n.getAttribute("type"),
        placeholder: n.getAttribute("placeholder"),
        value: n.value,
        text: n.innerText
      }))),
      buttons: await page.locator("button").evaluateAll(nodes => nodes.slice(0, 100).map((n, idx) => ({ idx, text: n.innerText.trim(), id: n.getAttribute("data-ai-id") })).filter(x => x.text || x.id))
    };

    await page.locator('[data-ai-id="input-modaltaolichhenadmin-1jt8"]').fill(`Khach Agent UI ${unique}`);
    await page.locator('[data-ai-id="input-modaltaolichhenadmin-bplk"]').fill(`Pet Agent UI ${unique}`);
    await page.locator('[data-ai-id="button-modaltaolichhenadmin-z04y"]').click();
    await page.waitForTimeout(2500);
    result.afterCustomerSelect = {
      text: (await page.locator("body").innerText()).slice(-4000),
      inputs: await page.locator("input, select, textarea").evaluateAll(nodes => nodes.slice(0, 120).map((n, idx) => ({
        idx,
        tag: n.tagName,
        type: n.getAttribute("type"),
        placeholder: n.getAttribute("placeholder"),
        value: n.value,
        text: n.innerText
      }))),
      buttons: await page.locator("button").evaluateAll(nodes => nodes.slice(0, 120).map((n, idx) => ({ idx, text: n.innerText.trim(), id: n.getAttribute("data-ai-id") })).filter(x => x.text || x.id))
    };

    await page.locator('[data-ai-id="select-modaltaolichhenadmin-lgu8"]').selectOption({ label: "Khám Đa Khoa" });
    await page.locator('[data-ai-id="input-modaltaolichhenadmin-h78k"]').fill("2026-06-01");
    await page.waitForTimeout(2500);
    await page.locator('[data-ai-id="select-modaltaolichhenadmin-3aa3"]').selectOption({ index: 1 });
    await page.waitForTimeout(2500);
    const slotCount = await page.locator('[data-ai-id="select-modaltaolichhenadmin-bdsw"] option').count();
    if (slotCount > 1) {
      await page.locator('[data-ai-id="select-modaltaolichhenadmin-bdsw"]').selectOption({ index: slotCount - 1 });
    }
    await page.locator('[data-ai-id="textarea-modaltaolichhenadmin-notes"]').fill(`Test web CRUD agent ${unique}`);
    const appointmentResponsePromise = page.waitForResponse(
      response => response.url().includes("/api/lich-hen") && response.request().method() === "POST",
      { timeout: 45000 }
    ).catch(error => ({ error: error.message }));
    await page.locator('[data-ai-id="button-modaltaolichhenadmin-q0a4"]').click();
    const appointmentResponse = await appointmentResponsePromise;
    let appointmentResponseInfo = appointmentResponse;
    if (appointmentResponse && typeof appointmentResponse.status === "function") {
      appointmentResponseInfo = {
        status: appointmentResponse.status(),
        url: appointmentResponse.url(),
        body: (await appointmentResponse.text().catch(error => error.message)).slice(0, 1000)
      };
    }
    await page.waitForTimeout(3000);
    result.afterAppointmentSubmit = {
      text: (await page.locator("body").innerText()).slice(0, 5000),
      slotCount,
      appointmentResponse: appointmentResponseInfo,
      currentUrl: page.url()
    };

    if (!result.afterAppointmentSubmit.text.includes(`Pet Agent UI ${unique}`)) {
      result.findings.push("appointment was not visible after submit; clinical flow skipped");
    } else {
      console.error("STEP clinical record");
      await page.goto(`${baseUrl}/quan-ly/kham-benh`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.locator('[data-ai-id="input-quanlybenhan-appointment-search"]').fill(`Pet Agent UI ${unique}`);
      await page.waitForTimeout(800);
      await page.locator('[data-ai-id="select-quanlybenhan-8wqe"]').selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.locator('[data-ai-id="textarea-quanlybenhan-trieuchung"]').fill(`Triệu chứng test agent UI ${unique}`);
      await page.locator('[data-ai-id="textarea-quanlybenhan-chandoan"]').fill(`Chẩn đoán test agent UI ${unique}`);
      await page.locator('[data-ai-id="button-quanlybenhan-8zw3"]').click();
      await page.waitForTimeout(500);
      const medicineSelect = page.locator('[data-ai-id="select-quanlybenhan-dttd"]').first();
      const medicineValue = await medicineSelect.evaluate(select => {
        const options = Array.from(select.options);
        const available = options.find((option, index) => index > 0 && !/\(Tồn:\s*0\)/i.test(option.textContent || ""));
        return available ? available.value : "";
      });
      if (medicineValue) {
        await medicineSelect.selectOption(medicineValue);
        await page.locator('[data-ai-id="input-quanlybenhan-nj8p"]').first().fill("1");
        await page.locator('[data-ai-id="input-quanlybenhan-vgla"]').first().fill("Ngày 1 viên sau ăn");
        await page.locator('[data-ai-id="textarea-quanlybenhan-loidang"]').fill(`Lời dặn test agent UI ${unique}`);
      } else {
        result.findings.push("no medicine with stock found; prescription detail may be skipped");
      }
      await page.locator('[data-ai-id="button-quanlybenhan-1pce"]').click();
      await page.waitForTimeout(7000);
      result.afterClinicalSave = {
        text: (await page.locator("body").innerText()).slice(0, 5000),
        medicineValue,
        currentUrl: page.url()
      };

      console.error("STEP invoice payment");
      await page.goto(`${baseUrl}/quan-ly/hoa-don`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.locator('[data-ai-id="input-quanlyhoadon-unv9"]').fill(`Pet Agent UI ${unique}`);
      await page.waitForTimeout(1200);
      const payButtons = page.locator('[data-ai-id="button-quanlyhoadon-h34e"]');
      const payCount = await payButtons.count();
      if (payCount > 0) {
        await payButtons.first().click();
        await page.waitForTimeout(3500);
      } else {
        result.findings.push("invoice payment button not found for generated pet");
      }
      result.afterInvoicePayment = {
        text: (await page.locator("body").innerText()).slice(0, 5000),
        payCount,
        currentUrl: page.url()
      };
    }

    await page.screenshot({ path: "output/playwright/web-crud-check.png", fullPage: true });
    console.error("STEP done");
  } finally {
    await context.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
