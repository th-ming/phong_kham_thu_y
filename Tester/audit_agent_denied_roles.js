const fs = require("fs");
const path = require("path");

const BASE = process.env.API_BASE || "http://127.0.0.1:8081";
const outDir = path.resolve(__dirname, "..", "Frontend", "output", "playwright");
fs.mkdirSync(outDir, { recursive: true });

const cases = [
  { role: "bac_si", username: "bacsi", password: "bacsi@rexi.com", query: "thong ke doanh thu hom nay", expect: "deny" },
  { role: "y_ta", username: "yta", password: "yta@rexi.com", query: "thong ke doanh thu hom nay", expect: "deny" },
  { role: "tiep_tan", username: "tieptan", password: "tieptan@rexi.com", query: "tim benh an gan day cua be Muc", expect: "deny" },
  { role: "tiep_tan", username: "tieptan", password: "tieptan@rexi.com", query: "thong ke doanh thu hom nay", expect: "deny" },
  { role: "ke_toan", username: "ketoan", password: "ketoan@rexi.com", query: "tim benh an gan day cua be Muc", expect: "deny" },
  { role: "khach_hang", username: "testcustomer2", password: "Password123!", query: "tim benh an gan day cua be Muc", expect: "deny" },
  { role: "khach_hang", username: "testcustomer2", password: "Password123!", query: "thong ke doanh thu hom nay", expect: "deny" },
  { role: "khach_hang", username: "testcustomer2", password: "Password123!", query: "kiem tra cau hinh AI va provider hien tai", expect: "deny" },
];

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function isDenied(text) {
  const n = normalize(text);
  return [
    "khong co quyen",
    "chua duoc cap quyen",
    "chi danh cho",
    "khong kha dung",
    "tinh nang nay khong kha dung",
    "bao cao doanh thu chi danh",
    "benh an la thong tin y te mat",
    "thong tin benh an chi danh",
  ].some((needle) => n.includes(needle));
}

async function post(url, body, token, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${BASE}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: response.status, text, json };
  } catch (error) {
    return { status: 0, text: String(error), json: null };
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  const report = { base: BASE, testedAt: new Date().toISOString(), cases: [] };
  const tokenCache = new Map();

  for (const item of cases) {
    const key = item.username;
    if (!tokenCache.has(key)) {
      const login = await post("/api/auth/login", { username: item.username, password: item.password }, null, 15000);
      tokenCache.set(key, login.json?.token || "");
    }
    const token = tokenCache.get(key);
    const result = await post("/api/agent/react", { query: item.query }, token);
    const ok = item.expect === "deny"
      ? (result.status === 401 || result.status === 403 || isDenied(result.text))
      : result.status === 200 && !isDenied(result.text);
    const row = {
      role: item.role,
      query: item.query,
      status: result.status,
      ok,
      preview: result.text.replace(/\s+/g, " ").trim().slice(0, 500),
    };
    report.cases.push(row);
    console.log(`${ok ? "PASS" : "FAIL"} ${item.role} :: ${item.query}`);
    if (!ok) console.log(row.preview);
  }

  report.summary = {
    total: report.cases.length,
    failed: report.cases.filter((item) => !item.ok).length,
  };
  const file = path.join(outDir, "agent-denied-role-report.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  console.log(`REPORT ${file}`);
  if (report.summary.failed) process.exitCode = 2;
})();
