const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'http://127.0.0.1:8081';

async function post(pathname, body, token) {
  const res = await fetch(`${API}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

function getReply(payload) {
  return payload?.json?.finalAnswer
    || payload?.json?.reply
    || payload?.json?.message
    || payload?.json?.data?.reply
    || JSON.stringify(payload?.json || {});
}

function judge(reply) {
  const normalized = String(reply || '').toLowerCase();
  const hasFile = /frontend\/src\/|backend\/src\//i.test(reply);
  const hasLine = /dòng\s+\d+|dong\s+\d+|- dòng\s+\d+/i.test(reply);
  const noSecret = !/(api[_-]?key|bearer\s+[a-z0-9._-]{12,}|password\s*[=:]\s*[^\s]+)/i.test(reply);
  const noNavigate = !normalized.includes('[navigate:');
  return { ok: hasFile && hasLine && noSecret && noNavigate, hasFile, hasLine, noSecret, noNavigate };
}

async function main() {
  const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'chat-evidence', 'admin-code-lookup');
  fs.mkdirSync(outDir, { recursive: true });

  const login = await post('/api/auth/login', { username: 'admin', password: 'admin@rexi.com' });
  const token = login.json.token;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(login));

  const queries = [
    'muốn đổi màu chữ trong chatbot thì sửa file nào dòng nào?',
    'muốn chỉnh màu nền khung chat thì sửa code đoạn nào file nào dòng nào?',
    'nút đặt lịch nằm file nào dòng nào?',
    'muốn đổi màu chữ Header thì sửa file nào dòng nào?',
    'muốn chỉnh màu nền Header thì sửa đoạn code nào?',
  ];

  const results = [];
  for (const query of queries) {
    const response = await post('/api/agent/react', { query }, token);
    const reply = getReply(response);
    results.push({ query, status: response.status, judge: judge(reply), reply });
  }

  const reportPath = path.join(outDir, 'admin-code-lookup-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({ api: API, generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');
  for (const item of results) {
    console.log(`\n## ${item.query}`);
    console.log(JSON.stringify(item.judge));
    console.log(String(item.reply).slice(0, 1200));
  }
  console.log(`\nSaved: ${reportPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
