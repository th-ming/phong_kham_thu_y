const API = process.env.API_BASE || 'http://127.0.0.1:8081';

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
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

async function main() {
  const login = await post('/api/auth/login', { username: 'admin', password: 'admin@rexi.com' });
  const token = login.json.token;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(login));
  const queries = [
    'đổi màu Rexi Agent ở khung chatbot thành xanh',
    'đổi màu Rexi Agent ở khung chatbot',
    'muốn đổi màu Rexi Agent ở khung chatbot thì sửa file nào dòng nào',
    'hoàn tác chỉnh thử giao diện',
  ];
  for (const query of queries) {
    const r = await post('/api/agent/react', { query }, token);
    const reply = r.json.finalAnswer || r.json.reply || r.json.message || JSON.stringify(r.json);
    console.log('\n### ' + query);
    console.log('status=' + r.status);
    console.log(String(reply).slice(0, 1200));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
