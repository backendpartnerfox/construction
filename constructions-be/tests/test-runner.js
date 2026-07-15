// tests/test-runner.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running Jest Test Diagnostics...\n');

// Check if test database exists
console.log('1. Checking test database...');
try {
  execSync('npm run test:setup', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to setup test database');
}

// Check environment variables
console.log('\n2. Checking environment variables...');
require('dotenv').config({ path: '.env.test' });
console.log(`   - DB_HOST: ${process.env.DB_HOST}`);
console.log(`   - DB_USER: ${process.env.DB_USER}`);
console.log(`   - DB_NAME: ${process.env.DB_NAME}`);
console.log(`   - PORT: ${process.env.PORT}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);

// Test database connection
console.log('\n3. Testing database connection...');
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'nopassword',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'testdb2'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connection successful:', res.rows[0].now);
  }
  pool.end();
});

// List available test files
console.log('\n4. Available test files:');
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .slice(0, 10); // Show first 10 test files

testFiles.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n5. Running a simple test...');
try {
  execSync('npx jest tests/clients_route.test.js --listTests', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to list tests');
}

console.log('\n✨ Diagnostics complete! To run tests:');
console.log('   npm test                    # Run all tests');
console.log('   npm run test:clients        # Run specific test');
console.log('   npm run test:watch          # Run tests in watch mode');
console.log('   npm run test:coverage       # Run tests with coverage');
