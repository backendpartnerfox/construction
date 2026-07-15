const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get test name from command line or use default
const testName = process.argv[2] || 'clients_route';
const testFile = path.join('tests', `${testName}.test.js`);

console.log(`=== Running Test: ${testName} ===\n`);

if (!fs.existsSync(testFile)) {
  console.error(`Test file not found: ${testFile}`);
  
  // Try alternate naming
  const altTestFile = path.join('tests', `${testName}_route.test.js`);
  if (fs.existsSync(altTestFile)) {
    console.log(`Found alternate: ${altTestFile}`);
    testFile = altTestFile;
  } else {
    console.log('\nAvailable test files:');
    const testsDir = path.join(__dirname, 'tests');
    if (fs.existsSync(testsDir)) {
      fs.readdirSync(testsDir)
        .filter(f => f.endsWith('.test.js'))
        .slice(0, 10)
        .forEach(f => console.log(`  - ${f}`));
      console.log('  ...');
    }
    process.exit(1);
  }
}

console.log(`Running: ${testFile}\n`);

// Run Jest with detailed output
const jest = spawn('npx', ['jest', testFile, '--verbose', '--no-coverage', '--detectOpenHandles'], {
  cwd: __dirname,
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'test',
    // Force color output
    FORCE_COLOR: '1'
  }
});

let output = '';
let errorOutput = '';

jest.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

jest.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  process.stderr.write(text);
});

jest.on('error', (error) => {
  console.error('\nFailed to start Jest:', error.message);
  console.error('Make sure Jest is installed: npm install --save-dev jest');
});

jest.on('close', (code) => {
  console.log(`\n=== Test completed with exit code: ${code} ===`);
  
  if (code !== 0) {
    console.log('\n=== Debugging Tips ===');
    
    // Check for common error patterns
    if (output.includes('Cannot find module') || errorOutput.includes('Cannot find module')) {
      console.log('✗ Missing module error detected');
      console.log('  Solution: Run "npm install" to install dependencies');
    }
    
    if (output.includes('ECONNREFUSED') || output.includes('connection') || errorOutput.includes('ECONNREFUSED')) {
      console.log('✗ Database connection error detected');
      console.log('  Solutions:');
      console.log('  1. Ensure PostgreSQL is running');
      console.log('  2. Check if database "testdb2" exists');
      console.log('  3. Verify .env.test configuration');
      console.log('  4. Run: psql -U postgres -c "CREATE DATABASE testdb2;"');
    }
    
    if (output.includes('relation') && output.includes('does not exist')) {
      console.log('✗ Database table missing error detected');
      console.log('  Solutions:');
      console.log('  1. Run schema setup scripts');
      console.log('  2. Check if tables exist in testdb2');
      console.log('  3. Run: psql -U postgres -d testdb2 -f schema.sql');
    }
    
    if (output.includes('timeout')) {
      console.log('✗ Test timeout detected');
      console.log('  Solutions:');
      console.log('  1. Increase test timeout in jest.config.js');
      console.log('  2. Check for hanging database connections');
      console.log('  3. Ensure afterAll() properly closes connections');
    }
  }
  
  process.exit(code);
});
