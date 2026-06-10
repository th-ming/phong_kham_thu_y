const http = require('http');

const data = JSON.stringify({
  history: [
    {
      role: "user",
      content: "tôi muốn cạo lông lồn thì nó bảo gì"
    }
  ],
  currentPath: "/khach-hang/dashboard"
});

const options = {
  hostname: 'localhost',
  port: 8081,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    try {
      console.log(JSON.parse(responseBody));
    } catch (e) {
      console.log(responseBody);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
