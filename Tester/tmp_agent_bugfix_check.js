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

function replyOf(payload) {
  return payload?.json?.finalAnswer || payload?.json?.reply || payload?.json?.message || JSON.stringify(payload?.json || {});
}

async function main() {
  const login = await post('/api/auth/login', { username: 'admin', password: 'admin@rexi.com' });
  const token = login.json.token;
  if (!token) throw new Error(`Login failed ${login.status}: ${JSON.stringify(login.json)}`);

  const cases = [
    'Mở danh sách ca khám hôm nay của bác sĩ',
    'Lên mạng tìm tài liệu điều trị mèo bị giảm bạch cầu',
  ];
  const results = [];
  for (const query of cases) {
    const response = await post('/api/agent/react', { query }, token);
    const reply = replyOf(response);
    results.push({ query, status: response.status, provider: response.json.provider, steps: response.json.steps, reply });
    console.log(`\n# ${query}`);
    console.log(`status=${response.status} provider=${response.json.provider}`);
    console.log(reply);
  }

  const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'chat-evidence', 'agent-bugfix');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'api-results.json');
  fs.writeFileSync(outFile, JSON.stringify({ api: API, generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');
  console.log(`\nSaved: ${outFile}`);
}

main().catch(err => { console.error(err); process.exit(1); });
