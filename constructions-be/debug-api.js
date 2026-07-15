// Simple test to check server and run a test
const http = require('http');

console.log('1. Checking if server is running...');

// First check if server is up
http.get('http://localhost:3002/health', (res) => {
  console.log('✓ Server is running\n');
  
  console.log('2. Testing API endpoint...');
  
  // Now test the API endpoint
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/test/clients_route',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('API Response Status:', res.statusCode);
      console.log('API Response:', data.substring(0, 200));
      
      if (res.statusCode !== 200) {
        console.log('\n❌ API endpoint is not working properly');
        console.log('This is why you see "Failed to fetch" errors');
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('API request error:', e.message);
  });
  
  req.write(postData);
  req.end();
  
}).on('error', (e) => {
  console.log('✗ Server is NOT running!');
  console.log('Error:', e.message);
  console.log('\nPlease start the server with:');
  console.log('  node test-server-improved.js');
});
