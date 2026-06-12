const https = require('https');

https.get('https://rexi-vet-clinic.vercel.app/dich-vu/kham-lam-sang-tong-quat', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('HTML Length:', data.length);
    // Find all js script tags
    const scriptRegex = /<script[^>]+src="([^"]+)"/g;
    let match;
    console.log('Scripts:');
    while ((match = scriptRegex.exec(data)) !== null) {
      console.log(match[1]);
    }
  });
}).on('error', console.error);
