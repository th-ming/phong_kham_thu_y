const API = process.env.API_BASE || 'http://127.0.0.1:8081';

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

  const query = 'bác sĩ minh hôm nay có những ca trực nào';
  const agent = await post('/api/agent/react', { query }, token);
  console.log(JSON.stringify({ query, status: agent.status, response: agent.json }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
