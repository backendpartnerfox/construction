const { exec } = require('child_process');
const { spawn } = require('child_process');

console.log('Checking port 3002...\n');

// Function to kill process on port
function killPort(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Windows
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (err || !stdout) {
          console.log(`Port ${port} is free`);
          resolve();
          return;
        }
        
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        });
        
        if (pids.size > 0) {
          console.log(`Found processes on port ${port}: ${Array.from(pids).join(', ')}`);
          pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, (err) => {
              if (!err) console.log(`Killed process ${pid}`);
            });
          });
          setTimeout(resolve, 1000);
        } else {
          resolve();
        }
      });
    } else {
      // Linux/Mac
      exec(`lsof -ti:${port} | xargs kill -9`, () => {
        resolve();
      });
    }
  });
}

// Start the server
async function startServer() {
  await killPort(3002);
  
  console.log('\nStarting test server...\n');
  
  const server = spawn('node', ['test-server-improved.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
  
  // Open browser after 2 seconds
  setTimeout(() => {
    console.log('\nOpening dashboard in browser...');
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${start} http://localhost:3002`);
  }, 2000);
}

startServer();
