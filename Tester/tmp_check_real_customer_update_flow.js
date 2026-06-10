const BASE = process.env.API_BASE || 'http://127.0.0.1:8081';
async function post(path, body, token) {
  const headers = {'Content-Type':'application/json'};
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + path, { method:'POST', headers, body: JSON.stringify(body) });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { reply: text }; }
}
async function login(username, password) { return (await post('/api/auth/login', { username, password })).token; }
async function get(path, token) {
  const r = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + token } });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}
(async()=>{
  const token = await login('tieptan', 'tieptan@rexi.com');
  const customers = await get('/api/khach-hang', token);
  console.log('CUSTOMERS_SAMPLE');
  console.log(JSON.stringify(Array.isArray(customers) ? customers.slice(0, 5) : customers).slice(0, 1200));
  const queries = [
    'tìm khách Nguyễn',
    'sửa SĐT khách KH-TEST-002 thành 0901234567',
    'sửa SĐT khách KH-001 thành 0901234567',
  ];
  for (const q of queries) {
    const res = await post('/api/chat', { history: [{ role:'user', content:q }] }, token);
    console.log('Q=' + q);
    console.log(String(res.reply || res.response || JSON.stringify(res)).replace(/\s+/g, ' ').slice(0, 600));
  }
  const agent = await post('/api/agent/react', { query: 'tim khach Nguyen A' }, token);
  console.log('AGENT=tim khach Nguyen A');
  console.log(String(agent.finalAnswer || agent.reply || agent.response || JSON.stringify(agent)).replace(/\s+/g, ' ').slice(0, 900));
})();
