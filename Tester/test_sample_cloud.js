const https = require('https');
const http  = require('http');

const BASE = 'https://phong-kham-thu-y.onrender.com';

const ACCOUNTS = {
  admin:    { username: 'admin',          password: 'admin@rexi.com'         },
  customer: { username: '***REMOVED***', password: '***REMOVED***'         },
};

const SAMPLE_CASES = [
  { role: 'GUEST', q: 'mở trang đặt lịch hẹn', expect: ['NAVIGATE','dat-lich'], token: null },
  { role: 'GUEST', q: 'chó bị sốt bỏ ăn phải làm sao', expect: ['bác sĩ','phòng khám'], token: null },
  { role: 'CUSTOMER', q: 'mở trang hồ sơ cá nhân của tôi', expect: ['NAVIGATE','ho-so'], useToken: 'customer' },
  { role: 'ADMIN', q: 'kiểm tra cấu hình model AI đang chạy', expect: ['Gemini','Groq','model'], useToken: 'admin' }
];

function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method, headers,
    }, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('TIMEOUT')); });
    if (data) req.write(data);
    req.end();
  });
}

async function getAuthToken(username, password) {
  try {
    const res = await request('POST', `${BASE}/api/auth/login`, { username, password });
    return res.body.token || res.body.accessToken || null;
  } catch (err) { return null; }
}

(async () => {
  console.log('--- TEST MẪU TRÊN CLOUD ---');
  const tokens = {
    admin: await getAuthToken(ACCOUNTS.admin.username, ACCOUNTS.admin.password),
    customer: await getAuthToken(ACCOUNTS.customer.username, ACCOUNTS.customer.password)
  };

  for (const tc of SAMPLE_CASES) {
    const token = tc.useToken ? tokens[tc.useToken] : null;
    process.stdout.write(`[${tc.role}] Hỏi: "${tc.q}" ... `);
    try {
      const res = await request('POST', `${BASE}/api/agent/react`, { query: tc.q }, token);
      const reply = res.body?.finalAnswer || res.body?.reply || 'No reply';
      console.log(`\n   => Bot: "${reply.substring(0, 150)}..."`);
    } catch (e) {
      console.log(`\n   => Lỗi: ${e.message}`);
    }
  }
})();
