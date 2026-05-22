const axios = require('axios');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc3OTQwMjc3NywiZXhwIjoxNzc5NDg5MTc3fQ.DQBYLnE1LcUjIEXQ1F8HWX9ZRM0EmdnMKajV2nhcmKE';
  const payload = {
    subject: '🎁 Ưu đãi đặc biệt từ Rexi - Giảm 50% dịch vụ Spa',
    content: `Kính gửi Quý khách,\n\nRexi xin gửi ưu đãi đặc biệt: giảm 50% cho dịch vụ Spa thú cưng trong tuần này. Đặt lịch ngay để nhận ưu đãi.\n\nTrân trọng,\nĐội ngũ Rexi`
  };

  try {
    const res = await axios.post('http://localhost:8081/api/system/send-mass-email', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      timeout: 120000
    });
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();
