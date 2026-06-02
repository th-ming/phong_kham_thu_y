const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:3001";
const outputDir = path.resolve(__dirname, "../Frontend/output/playwright/birth-year-tone-proof");

const scenarios = [
  { key: "genz", label: "Gen Z", birthYear: 2000 },
  { key: "mature", label: "Truong thanh", birthYear: 1985 }
];

const createProfile = (birthYear) => ({
  id_khach_hang: "KH-PROOF",
  id: "KH-PROOF",
  ten_khach_hang: "Minh Chung",
  ho_ten: "Minh Chung",
  displayName: "Minh Chung",
  email: "minhchung@example.com",
  sdt: "0900000000",
  dia_chi: "Ha Noi",
  loai_tai_khoan: "khach_hang",
  ten_vai_tro: "Khach hang",
  nam_sinh: birthYear,
  hinh_anh: ""
});

const json = (body) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body)
});

const petsResponse = {
  content: [
    { id_thu_cung: "TC-001", ten_thu_cung: "Bong", loai: "Meo", ngay_sinh: "2024-03-10" }
  ],
  totalElements: 1,
  totalPages: 1
};

const appointmentsResponse = {
  content: [
    {
      id_lich_hen: "LH-001",
      id_thu_cung: "TC-001",
      id_dich_vu: "DV-001",
      ngay_kham: "2026-06-05",
      gio_kham: "09:00:00",
      ngay_gio: "2026-06-05T09:00:00",
      trang_thai: "CHO_XAC_NHAN",
      ten_thu_cung: "Bong",
      ten_dich_vu: "Kham tong quat"
    }
  ],
  totalElements: 1,
  totalPages: 1
};

const invoicesResponse = {
  content: [
    {
      id_hoa_don: "HD-001",
      tong_tien: 250000,
      tong_tien_cuoi: 250000,
      ngay_lap_hoa_don: "2026-06-02T08:00:00",
      trang_thai: "da_thanh_toan",
      ten_thu_cung: "Bong"
    },
    {
      id_hoa_don: "HD-002",
      tong_tien: 180000,
      tong_tien_cuoi: 180000,
      ngay_lap_hoa_don: "2026-06-01T08:00:00",
      trang_thai: "cho_thanh_toan",
      ten_thu_cung: "Bong"
    }
  ],
  totalElements: 2,
  totalPages: 1
};

async function runScenario(browser, scenario) {
  const profile = createProfile(scenario.birthYear);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    deviceScaleFactor: 1
  });

  await context.addInitScript((user) => {
    localStorage.setItem("token", "proof-token");
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("rexi_app_name", "Rexi - Phong Kham Thu Y");
  }, profile);

  await context.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/system/public-cau-hinh")) {
      await route.fulfill(json({ app_name: "Rexi - Phong Kham Thu Y" }));
      return;
    }
    if (url.includes("/api/khach-hang/")) {
      await route.fulfill(json(profile));
      return;
    }
    if (url.includes("/api/thu-cung/khach/")) {
      await route.fulfill(json(petsResponse));
      return;
    }
    if (url.includes("/api/lich-hen/khach/")) {
      await route.fulfill(json(appointmentsResponse));
      return;
    }
    if (url.includes("/api/hoa-don/khach/")) {
      await route.fulfill(json(invoicesResponse));
      return;
    }
    if (url.includes("/api/dich-vu/active")) {
      await route.fulfill(json([
        { id_dich_vu: "DV-001", ten_dich_vu: "Kham tong quat", gia: 250000 },
        { id_dich_vu: "DV-002", ten_dich_vu: "Tiem phong", gia: 180000 }
      ]));
      return;
    }
    if (url.includes("/api/bac-si")) {
      await route.fulfill(json([
        { id_nhan_vien: "BS-001", ho_ten: "BS Rexi", chuyen_mon: "Tong quat" }
      ]));
      return;
    }
    if (url.includes("/api/lich-hen/gio-ranh") || url.includes("/api/lich-lam-viec") || url.includes("available-slots")) {
      await route.fulfill(json(["09:00", "10:00", "14:00"]));
      return;
    }
    await route.fulfill(json({ content: [], totalElements: 0, totalPages: 0 }));
  });

  const page = await context.newPage();

  await page.goto(`${FRONTEND_URL}/khach-hang/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", {
    name: scenario.key === "genz" ? /Hế lô Sen/i : /Kính chào Quý khách/i
  }).waitFor({ timeout: 15000 });
  await page.screenshot({
    path: path.join(outputDir, `01-dashboard-${scenario.key}-${scenario.birthYear}.png`),
    fullPage: true
  });

  await page.goto(`${FRONTEND_URL}/khach-hang/thong-tin-ca-nhan`, { waitUntil: "domcontentloaded" });
  await page.getByText(
    scenario.key === "genz" ? /2000 \(Gen Z vui vẻ/ : /1985 \(Trưởng thành chuẩn mực/
  ).waitFor({ timeout: 15000 });
  await page.screenshot({
    path: path.join(outputDir, `02-profile-${scenario.key}-${scenario.birthYear}.png`),
    fullPage: true
  });

  await page.goto(`${FRONTEND_URL}/khach-hang/dat-lich-hen`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", {
    name: scenario.key === "genz" ? /Book lịch cho boss/i : /Đặt lịch khám/i
  }).waitFor({ timeout: 15000 });
  await page.screenshot({
    path: path.join(outputDir, `03-booking-${scenario.key}-${scenario.birthYear}.png`),
    fullPage: true
  });

  await page.goto(`${FRONTEND_URL}/khach-hang/hoa-don-thanh-toan`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", {
    name: scenario.key === "genz" ? /Bill & thanh toán/i : /Hóa đơn & Thanh toán/i
  }).waitFor({ timeout: 15000 });
  await page.screenshot({
    path: path.join(outputDir, `04-invoices-${scenario.key}-${scenario.birthYear}.png`),
    fullPage: true
  });

  await page.goto(`${FRONTEND_URL}/khach-hang/lich-su-lich-hen`, { waitUntil: "domcontentloaded" });
  await page.screenshot({
    path: path.join(outputDir, `05-appointments-${scenario.key}-${scenario.birthYear}.png`),
    fullPage: true
  });

  await context.close();
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const scenario of scenarios) {
      await runScenario(browser, scenario);
    }
  } finally {
    await browser.close();
  }
  console.log(`Saved screenshots to ${outputDir}`);
})();
