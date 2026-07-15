// tests/fix-specific-test-issues.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing and fixing specific test issues...\n');

// Common test fixes
const testFixes = {
  // Fix for tests that don't properly handle async database operations
  asyncFix: `
  beforeAll(async () => {
    try {
      const testApp = createTestApp();
      app = testApp.app;
      pool = testApp.pool;
      
      // Ensure database connection is ready
      await pool.query('SELECT 1');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  });`,

  // Fix for tests that don't close database connections
  cleanupFix: `
  afterAll(async () => {
    try {
      if (pool) {
        await pool.end();
      }
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  });`,

  // Fix for missing table creation
  tableCreationFix: `
    // Create required tables
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS table_name (
        id SERIAL PRIMARY KEY,
        -- Add columns here
      )
    \`);`
};

// Read all test files and categorize issues
const testDir = path.join(__dirname);
const issueReport = {
  missingImports: [],
  missingTables: [],
  asyncIssues: [],
  cleanupIssues: []
};

console.log('Scanning test files for common issues...\n');

fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .forEach(file => {
    const filePath = path.join(testDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for missing imports
    if (!content.includes("require('./testApp')") && !content.includes('require("./testApp")')) {
      issueReport.missingImports.push(file);
    }
    
    // Check for missing afterAll cleanup
    if (!content.includes('afterAll')) {
      issueReport.cleanupIssues.push(file);
    }
    
    // Check for potential async issues
    if (content.includes('beforeAll(') && !content.includes('async')) {
      issueReport.asyncIssues.push(file);
    }
    
    // Check for table creation issues (common tables that might be missing)
    const commonTables = ['employees', 'clients', 'projects', 'items'];
    commonTables.forEach(table => {
      if (content.includes(table) && !content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
        if (!issueReport.missingTables.includes(file)) {
          issueReport.missingTables.push(file);
        }
      }
    });
  });

// Generate report
console.log('📊 Issue Report:\n');
console.log(`Missing testApp import: ${issueReport.missingImports.length} files`);
console.log(`Missing cleanup: ${issueReport.cleanupIssues.length} files`);
console.log(`Async issues: ${issueReport.asyncIssues.length} files`);
console.log(`Potential missing tables: ${issueReport.missingTables.length} files\n`);

// Create a simple working test example
const workingTestExample = `// tests/example-working.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

describe('Example Working Test', () => {
  let app, pool;

  beforeAll(async () => {
    try {
      const testApp = createTestApp();
      app = testApp.app;
      pool = testApp.pool;
      
      // Wait for database connection
      await pool.query('SELECT 1');
      
      // Create any required tables
      await pool.query(\`
        CREATE TABLE IF NOT EXISTS test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      \`);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up
      await pool.query('DROP TABLE IF EXISTS test_table');
      
      // Close database connection
      if (pool) {
        await pool.end();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  beforeEach(async () => {
    // Clean data before each test
    await pool.query('DELETE FROM test_table');
  });

  test('database connection works', async () => {
    const result = await pool.query('SELECT 1 as number');
    expect(result.rows[0].number).toBe(1);
  });

  test('can insert and retrieve data', async () => {
    await pool.query("INSERT INTO test_table (name) VALUES ('Test')");
    const result = await pool.query('SELECT * FROM test_table');
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].name).toBe('Test');
  });
});
`;

fs.writeFileSync(path.join(__dirname, 'example-working.test.js'), workingTestExample);
console.log('✅ Created example working test\n');

// Create a batch fix script
const batchFixScript = `#!/usr/bin/env node
// tests/batch-fix-tests.js

const fs = require('fs');
const path = require('path');

const filesToFix = process.argv.slice(2);

if (filesToFix.length === 0) {
  console.log('Usage: node batch-fix-tests.js <test-file1> <test-file2> ...');
  process.exit(1);
}

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(\`File not found: \${file}\`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add testApp import if missing
  if (!content.includes("require('./testApp')")) {
    content = "const createTestApp = require('./testApp');\\n" + content;
  }
  
  // Add afterAll if missing
  if (!content.includes('afterAll')) {
    const afterAllCode = \`
  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });
\`;
    // Insert after beforeAll
    const beforeAllIndex = content.indexOf('beforeAll');
    if (beforeAllIndex !== -1) {
      const insertIndex = content.indexOf(');', beforeAllIndex) + 2;
      content = content.slice(0, insertIndex) + afterAllCode + content.slice(insertIndex);
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(\`Fixed: \${file}\`);
});
`;

fs.writeFileSync(path.join(__dirname, 'batch-fix-tests.js'), batchFixScript);
console.log('✅ Created batch fix script\n');

console.log('📝 Recommendations:\n');
console.log('1. Run the test setup to create all tables:');
console.log('   npm run test:setup\n');

console.log('2. Test the example working test:');
console.log('   npx jest tests/example-working.test.js\n');

console.log('3. Fix specific test files using the batch script:');
console.log('   node tests/batch-fix-tests.js clients_route.test.js projects_route.test.js\n');

console.log('4. For each failing test, check if it needs:');
console.log('   - The required tables created in beforeAll()');
console.log('   - Proper async/await handling');
console.log('   - Database connection cleanup in afterAll()');
console.log('   - Correct imports and setup');

// Save the issue report
fs.writeFileSync(
  path.join(__dirname, 'test-issues-report.json'),
  JSON.stringify(issueReport, null, 2)
);
console.log('\n✅ Issue report saved to test-issues-report.json');
