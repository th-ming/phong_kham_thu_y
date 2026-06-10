const fs = require("fs");
const path = require("path");

const BASE = process.env.API_BASE || "http://127.0.0.1:8081";
const outDir = path.resolve(__dirname, "..", "Frontend", "output", "playwright");
fs.mkdirSync(outDir, { recursive: true });

const accounts = [
  { role: "guest", username: null, password: null },
  { role: "admin", username: "admin", password: "admin@rexi.com" },
  { role: "quan_ly", username: "quanly", password: "quanly@rexi.com" },
  { role: "bac_si", username: "bacsi", password: "bacsi@rexi.com" },
  { role: "y_ta", username: "yta", password: "yta@rexi.com" },
  { role: "tiep_tan", username: "tieptan", password: "tieptan@rexi.com" },
  { role: "ke_toan", username: "ketoan", password: "ketoan@rexi.com" },
  { role: "khach_hang", username: "testcustomer2", password: "Password123!" },
];

const chatTests = [
  {
    id: "normal-smalltalk",
    body: { history: [{ role: "user", content: "chao Rexi" }] },
    expect: (r) => r.status === 200 && has(r.text, ["reply"]) && !has(r.text, ["agent_auth_required", "data-ai-id", "[CLICK", "[NAVIGATE"]),
  },
  {
    id: "public-price",
    body: { history: [{ role: "user", content: "bang gia kham tong quat bao nhieu" }] },
    expect: (r) => r.status === 200 && has(r.text, ["150,000", "Khám"]),
  },
  {
    id: "sensitive-in-standard",
    body: { history: [{ role: "user", content: "tim hoa don cua khach hang Nguyen Van A" }] },
    expect: (r) => r.status === 200 && has(r.text, ["agent", "đăng nhập", "quyền", "nội bộ", "Rexi Agent"]),
  },
];

const agentTests = [
  {
    id: "agent-sensitive-invoice",
    body: { query: "tim hoa don cua khach hang Nguyen Van A" },
    allowed: new Set(["admin", "quan_ly", "ke_toan", "tiep_tan"]),
    deniedNeedles: ["không có quyền", "chưa được cấp quyền", "không khả dụng", "cần đăng nhập", "Access Denied"],
  },
  {
    id: "agent-medical-record",
    body: { query: "tim benh an gan day cua be Muc" },
    allowed: new Set(["admin", "quan_ly", "bac_si", "y_ta"]),
    deniedNeedles: ["không có quyền", "chưa được cấp quyền", "không khả dụng", "chỉ dành", "cần đăng nhập"],
  },
  {
    id: "agent-revenue",
    body: { query: "thong ke doanh thu hom nay" },
    allowed: new Set(["admin", "quan_ly", "ke_toan"]),
    deniedNeedles: ["không có quyền", "chưa được cấp quyền", "chỉ dành", "cần đăng nhập"],
  },
  {
    id: "agent-admin-config",
    body: { query: "kiem tra cau hinh AI va provider hien tai" },
    allowed: new Set(["admin"]),
    deniedNeedles: ["chỉ dành cho Admin", "không có quyền", "chưa được cấp quyền", "cần đăng nhập"],
  },
];

function has(text, needles) {
  const normalized = normalize(text);
  return needles.some((needle) => normalized.includes(normalize(needle)));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

async function post(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const started = Date.now();
  try {
    const response = await fetch(`${BASE}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: response.status, ms: Date.now() - started, text, json };
  } catch (error) {
    return { status: 0, ms: Date.now() - started, text: String(error), json: null };
  }
}

async function login(account) {
  if (!account.username) return null;
  const result = await post("/api/auth/login", {
    username: account.username,
    password: account.password,
  });
  return result.json?.token || null;
}

function judgeAgent(role, test, result) {
  if (test.allowed.has(role)) {
    return result.status === 200 && !has(result.text, test.deniedNeedles);
  }
  return result.status === 401 || result.status === 403 || has(result.text, test.deniedNeedles);
}

(async () => {
  const report = {
    base: BASE,
    testedAt: new Date().toISOString(),
    rows: [],
  };

  for (const account of accounts) {
    const token = await login(account);
    const loginOk = account.role === "guest" || Boolean(token);
    const row = { role: account.role, username: account.username, loginOk, chat: [], agent: [] };

    for (const test of chatTests) {
      const result = await post("/api/chat", test.body, token);
      row.chat.push({
        id: test.id,
        status: result.status,
        ms: result.ms,
        ok: test.expect(result),
        preview: compact(result.text),
      });
    }

    for (const test of agentTests) {
      const result = await post("/api/agent/react", test.body, token);
      row.agent.push({
        id: test.id,
        status: result.status,
        ms: result.ms,
        ok: judgeAgent(account.role, test, result),
        allowedExpected: test.allowed.has(account.role),
        preview: compact(result.text),
      });
    }

    report.rows.push(row);
    console.log(`${account.role}: login=${loginOk} chat=${row.chat.filter(x => x.ok).length}/${row.chat.length} agent=${row.agent.filter(x => x.ok).length}/${row.agent.length}`);
  }

  const failed = report.rows.flatMap((row) => [
    ...row.chat.filter((item) => !item.ok).map((item) => ({ role: row.role, type: "chat", ...item })),
    ...row.agent.filter((item) => !item.ok).map((item) => ({ role: row.role, type: "agent", ...item })),
  ]);
  report.summary = {
    roles: report.rows.length,
    failed: failed.length,
    failures: failed,
  };

  const file = path.join(outDir, "chatbot-role-matrix-report.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  console.log(`REPORT ${file}`);
  if (failed.length) process.exitCode = 2;
})();

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 420);
}
