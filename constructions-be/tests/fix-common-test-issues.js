// tests/fix-common-test-issues.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Common Test Issues...\n');

// 1. Fix testApp.js to include all missing routes
const testAppPath = path.join(__dirname, 'testApp.js');
const routesDir = path.join(__dirname, '..', 'routes');

// Get all route files
const routeFiles = fs.readdirSync(routesDir)
  .filter(file => file.endsWith('_route.js') && !file.includes('backup') && !file.includes('original'))
  .sort();

console.log(`Found ${routeFiles.length} route files\n`);

// Generate imports for testApp.js
let imports = `// tests/testApp.js - AUTO-GENERATED IMPORTS
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

// Import all routes\n`;

const routeVariables = [];

routeFiles.forEach(file => {
  const variableName = file.replace('.js', '').replace(/-/g, '_');
  imports += `const ${variableName} = require('../routes/${file}');\n`;
  routeVariables.push(variableName);
});

// Generate the complete testApp.js content
const testAppContent = `${imports}

// Database configuration for testing
const testConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'nopassword',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'testdb2',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

function createTestApp() {
  const app = express();
  const pool = new Pool(testConfig);
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add db to request object
  app.use((req, res, next) => {
    req.db = pool;
    next();
  });
  
  // Register all routes
${routeVariables.map(route => `  app.use('/', ${route});`).join('\n')}
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });
  
  return { app, pool };
}

module.exports = createTestApp;
`;

// Write the updated testApp.js
fs.writeFileSync(testAppPath, testAppContent);
console.log('✅ Updated testApp.js with all routes\n');

// 2. Create a base test template
const baseTestTemplate = `// Base test template with proper setup and teardown
const request = require('supertest');
const createTestApp = require('./testApp');

describe('API Tests', () => {
  let app, pool;
  
  beforeAll(async () => {
    try {
      const testApp = createTestApp();
      app = testApp.app;
      pool = testApp.pool;
      
      // Wait for database connection
      await pool.query('SELECT 1');
    } catch (error) {
      console.error('Failed to initialize test app:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });
  
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
`;

fs.writeFileSync(path.join(__dirname, 'test-template.js'), baseTestTemplate);
console.log('✅ Created base test template\n');

// 3. Create database schema for tests
const schemaSQL = `-- Test database schema
-- Run this to create all necessary tables in testdb2

-- Basic tables that many tests depend on
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    client_id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES employees(employee_id)
);

CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_id INT NOT NULL REFERENCES clients(client_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    item_description TEXT,
    item_unit VARCHAR(20),
    item_category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Add more tables as needed based on your tests
`;

fs.writeFileSync(path.join(__dirname, 'setup', 'test-schema.sql'), schemaSQL);
console.log('✅ Created test database schema file\n');

// 4. Create a script to set up test database with schema
const setupDbScript = `// tests/setup/setupTestDb.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

async function setupTestDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'nopassword',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'testdb2'
  });

  try {
    await client.connect();
    console.log('Connected to test database');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'test-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('Test database schema created successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  setupTestDatabase();
}

module.exports = setupTestDatabase;
`;

fs.writeFileSync(path.join(__dirname, 'setup', 'setupTestDb.js'), setupDbScript);
console.log('✅ Created test database setup script\n');

console.log('📝 Next Steps:');
console.log('1. Run: node tests/setup/setupTestDb.js');
console.log('2. Run: npm test');
console.log('3. Check specific failing tests and add required table creation in their beforeAll()');
