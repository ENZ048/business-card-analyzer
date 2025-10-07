const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU0YTMxZTVkZGMxZDdiMmVkNWI1Y2YiLCJzZXNzaW9uU2NhbnMiOjUsImlhdCI6MTc1OTgxOTkwMSwiZXhwIjoxNzYwNDI0NzAxfQ.ux0rPX4-S98iOuM4IBKX1VGPO51LeRSSBYbMhkIrxQU';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/usage',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('🚀 Testing usage endpoint...');
console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const parsed = JSON.parse(data);
      if (parsed.success && parsed.data) {
        console.log('✅ Usage data retrieved successfully!');
        console.log('isDemo:', parsed.data.isDemo);
        console.log('sessionScans:', parsed.data.sessionScans);
        console.log('planType:', parsed.data.planType);
        if (parsed.data.sessionScans === 5) {
          console.log('🎉 SESSION SCANS WORKING! User has 5 scans remaining!');
        } else {
          console.log('❌ Session scans not working properly');
        }
      } else {
        console.log('❌ Failed to get usage data');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem with request: ${e.message}`);
});

req.end();
