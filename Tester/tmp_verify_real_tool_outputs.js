const BASE = process.env.API_BASE || 'http://127.0.0.1:8081';
const accounts = {
  customer: { username: 'testcustomer2', password: 'Password123!' },
  doctor: { username: 'bacsi', password: 'bacsi@rexi.com' },
  accountant: { username: 'ketoan', password: 'ketoan@rexi.com' },
  admin: { username: 'admin', password: 'admin@rexi.com' },
};
const tests = [
  ['customer', 'danh sách thú cưng của tôi'],
  ['customer', 'amoxicillin còn bao nhiêu viên trong kho'],
  ['doctor', 'amoxicillin còn bao nhiêu viên trong kho'],
  ['customer', 'ngày mai còn slot nào'],
  ['accountant', 'hóa đơn chưa thanh toán'],
  ['admin', 'bsi nao nhieu ca nhat tuan nay'],
];
async function post(path, body, token) {
  const headers = {'Content-Type':'application/json'};
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { text }; }
}
async function login(a) { return (await post('/api/auth/login', a)).token; }
(async () => {
  const tokens = {};
  for (const [k, v] of Object.entries(accounts)) tokens[k] = await login(v);
  for (const [role, q] of tests) {
    const res = await post('/api/chat', { history: [{ role: 'user', content: q }] }, tokens[role]);
    console.log(`ROLE=${role} Q=${q}`);
    console.log(String(res.reply || res.response || JSON.stringify(res)).replace(/\s+/g, ' ').slice(0, 500));
  }
})();
