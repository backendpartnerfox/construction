const http = require('http');

console.log('Checking if test server is running...\n');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✓ Test server is running!');
    console.log('Response:', data);
    console.log('\nYou can access the dashboard at: http://localhost:3002');
  });
});

req.on('error', (err) => {
  console.log('✗ Test server is NOT running');
  console.log('Error:', err.message);
  console.log('\nTo start the server, run:');
  console.log('  node test-server-improved.js');
  console.log('\nOr use the restart script:');
  console.log('  node restart-test-server.js');
});

req.on('timeout', () => {
  console.log('✗ Request timeout - server might be starting up');
  req.destroy();
});

req.end();
