const http = require('http');

const BASE = 'http://localhost:8081';

const ACCOUNTS = {
  admin:    { username: 'admin',          password: 'admin@rexi.com' },
  customer: { username: '***REMOVED***', password: '***REMOVED***' }
};

const UI_PREVIEW_CASES = [
  { 
    role: 'ADMIN (Quản trị)', 
    q: 'Đổi màu nút đặt lịch sang màu đỏ giúp tôi.', 
    useToken: 'admin',
    desc: 'Đổi màu sắc phần tử cụ thể'
  },
  { 
    role: 'ADMIN (Quản trị)', 
    q: 'Chỉnh chữ nút đặt lịch thành Khám Ngay Đi', 
    useToken: 'admin',
    desc: 'Đổi nội dung chữ phần tử'
  },
  { 
    role: 'ADMIN (Quản trị)', 
    q: 'Xóa hết các chỉnh thử nãy giờ đi', 
    useToken: 'admin',
    desc: 'Lệnh hoàn tác/reset giao diện'
  },
  { 
    role: 'ADMIN (Quản trị)', 
    q: 'Thêm đường link youtube.com/rexi vào đầu trang', 
    useToken: 'admin',
    desc: 'Thêm link tạm thời'
  },
  { 
    role: 'CUSTOMER (Khách hàng)', 
    q: 'Đổi nền trang web sang màu hồng đi', 
    useToken: 'customer',
    desc: 'Khách hàng thử đổi giao diện (Phải bị chặn/bỏ qua)'
  }
];

function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('TIMEOUT')); });
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
  console.log('🎨 BẮT ĐẦU TEST CHỨC NĂNG ĐỔI GIAO DIỆN (UI PREVIEW) 🎨\n');
  const tokens = {
    admin: await getAuthToken(ACCOUNTS.admin.username, ACCOUNTS.admin.password),
    customer: await getAuthToken(ACCOUNTS.customer.username, ACCOUNTS.customer.password)
  };

  for (const tc of UI_PREVIEW_CASES) {
    const token = tc.useToken ? tokens[tc.useToken] : null;
    console.log(`========================================================`);
    console.log(`👤 Vai trò: ${tc.role}`);
    console.log(`🎯 Test: ${tc.desc}`);
    console.log(`💬 Câu hỏi: "${tc.q}"`);
    
    try {
      const res = await request('POST', `${BASE}/api/agent/react`, { query: tc.q }, token);
      const reply = res.body?.finalAnswer || res.body?.reply || res.body?.message || 'Không có phản hồi';
      console.log(`🤖 Trả lời:\n   >> ${reply}`);
    } catch (e) {
      console.log(`❌ Lỗi: ${e.message}`);
    }
    console.log('');
  }
})();
