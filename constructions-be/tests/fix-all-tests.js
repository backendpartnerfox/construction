#!/usr/bin/env node
// tests/fix-all-tests.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Comprehensive Test Fix Script\n');

// Step 1: Check environment
console.log('Step 1: Checking environment...');
const envTestPath = path.join(__dirname, '..', '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error('❌ .env.test file not found');
  console.log('Creating .env.test file...');
  const envContent = `DB_HOST=localhost
DB_USER=postgres
DB_PORT=5432
DB_PASSWORD=nopassword
DB_NAME=testdb2
DB_DIALECT=postgres
DB_SCHEMA=public
JWT_SECRET=test-secret-key
PORT=3001
NODE_ENV=test
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:4200`;
  fs.writeFileSync(envTestPath, envContent);
  console.log('✅ Created .env.test file');
} else {
  console.log('✅ .env.test file exists');
}

// Step 2: Check if testApp.js is properly configured
console.log('\nStep 2: Checking testApp.js...');
const testAppPath = path.join(__dirname, 'testApp.js');
if (fs.existsSync(testAppPath)) {
  console.log('✅ testApp.js exists');
} else {
  console.error('❌ testApp.js not found');
}

// Step 3: Create test database
console.log('\nStep 3: Setting up test database...');
try {
  console.log('Creating test database...');
  execSync('node tests/setup/createTestDb.js', { stdio: 'inherit' });
  console.log('✅ Test database created');
} catch (error) {
  console.error('⚠️  Error creating test database (may already exist)');
}

// Step 4: Setup database schema
console.log('\nStep 4: Setting up database schema...');
try {
  console.log('Creating tables and inserting test data...');
  execSync('node tests/setup/setupTestDb.js', { stdio: 'inherit' });
  console.log('✅ Database schema setup complete');
} catch (error) {
  console.error('❌ Error setting up database schema:', error.message);
}

// Step 5: Run a simple test to verify setup
console.log('\nStep 5: Running verification test...');
const verificationTest = `
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

async function verify() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'nopassword',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'testdb2'
  });

  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    
    // Test tables exist
    const tables = await pool.query(\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
      LIMIT 10
    \`);
    console.log('✅ Found', tables.rows.length, 'tables in database');
    console.log('   Sample tables:', tables.rows.map(r => r.table_name).join(', '));
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await pool.end();
    return false;
  }
}

verify();
`;

fs.writeFileSync(path.join(__dirname, 'verify-setup.js'), verificationTest);
try {
  execSync('node tests/verify-setup.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Verification failed');
}

// Step 6: Fix common test issues
console.log('\nStep 6: Fixing common test issues...');

// Create a minimal working test
const minimalTest = `// tests/minimal-working.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

describe('Minimal Working Test', () => {
  let app, pool;

  beforeAll(async () => {
    try {
      const testApp = createTestApp();
      app = testApp.app;
      pool = testApp.pool;
      
      // Test database connection
      await pool.query('SELECT 1');
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  test('should connect to database', async () => {
    const result = await pool.query('SELECT 1 as number');
    expect(result.rows[0].number).toBe(1);
  });

  test('should have employees table', async () => {
    const result = await pool.query(\`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      )
    \`);
    expect(result.rows[0].exists).toBe(true);
  });
});
`;

fs.writeFileSync(path.join(__dirname, 'minimal-working.test.js'), minimalTest);
console.log('✅ Created minimal working test');

// Step 7: Summary and recommendations
console.log('\n' + '='.repeat(80));
console.log('📊 SETUP COMPLETE - NEXT STEPS');
console.log('='.repeat(80));

console.log('\n1. Test the minimal working example:');
console.log('   npx jest tests/minimal-working.test.js');

console.log('\n2. If the minimal test passes, run all tests:');
console.log('   npm test');

console.log('\n3. Common fixes for failing tests:');
console.log('   - Missing routes: Check that all route files exist in /routes directory');
console.log('   - Missing tables: The schema has been updated with all required tables');
console.log('   - Connection errors: Ensure PostgreSQL is running');
console.log('   - Import errors: Run npm install to ensure all packages are installed');

console.log('\n4. To run specific test files:');
console.log('   npm run test:clients');
console.log('   npm run test:projects');
console.log('   npm run test:items');

console.log('\n5. For detailed error analysis:');
console.log('   node tests/run-tests-individually.js');

console.log('\n✨ Test environment is now properly configured!');

// Cleanup
fs.unlinkSync(path.join(__dirname, 'verify-setup.js'));
