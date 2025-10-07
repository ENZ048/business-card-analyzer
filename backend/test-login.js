const http = require('http');

const postData = JSON.stringify({
  email: 'bd@troikatech.net',
  password: 'p22gM27B7@iY'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing login...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const parsed = JSON.parse(data);
      if (parsed.success && parsed.user && parsed.user.isDemo) {
        console.log('✅ Demo user login successful!');
        console.log('SessionScans:', parsed.user.sessionScans);
        console.log('Token (first 50 chars):', parsed.token.substring(0, 50) + '...');
      } else {
        console.log('❌ Login failed or not demo user');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
