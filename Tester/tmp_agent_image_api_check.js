const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

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
  const res = await post('/api/agent/react', { query: 'phân tích ảnh này ngắn gọn', images: [PNG_1PX] }, token);
  console.log(JSON.stringify({ status: res.status, provider: res.json.provider, finalAnswer: String(res.json.finalAnswer || res.json.error || '').slice(0, 1200), totalSteps: res.json.totalSteps }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
