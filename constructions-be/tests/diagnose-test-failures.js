#!/usr/bin/env node

// tests/diagnose-test-failures.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Test Failures...\n');

// Function to run a single test and capture output
function runSingleTest(testFile) {
  try {
    const output = execSync(`npx jest ${testFile} --no-coverage 2>&1`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

// Get all test files
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .sort();

console.log(`Found ${testFiles.length} test files\n`);

// Categorize errors
const errorCategories = {
  'Cannot find module': [],
  'ECONNREFUSED': [],
  'relation does not exist': [],
  'column does not exist': [],
  'duplicate key': [],
  'syntax error': [],
  'timeout': [],
  'other': []
};

// Run first few tests to identify common issues
console.log('Running sample tests to identify common issues...\n');
const samplesToTest = testFiles.slice(0, 5);

samplesToTest.forEach(testFile => {
  console.log(`Testing: ${testFile}`);
  const result = runSingleTest(path.join(testDir, testFile));
  
  if (!result.success) {
    // Categorize the error
    let categorized = false;
    for (const [category, list] of Object.entries(errorCategories)) {
      if (result.output.toLowerCase().includes(category.toLowerCase())) {
        errorCategories[category].push({
          file: testFile,
          error: result.output.substring(0, 200) + '...'
        });
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      errorCategories.other.push({
        file: testFile,
        error: result.output.substring(0, 200) + '...'
      });
    }
    console.log('  ❌ Failed\n');
  } else {
    console.log('  ✅ Passed\n');
  }
});

// Report findings
console.log('\n📊 Error Summary:\n');
for (const [category, errors] of Object.entries(errorCategories)) {
  if (errors.length > 0) {
    console.log(`${category}: ${errors.length} errors`);
    errors.slice(0, 2).forEach(err => {
      console.log(`  - ${err.file}`);
      console.log(`    ${err.error.split('\n')[0]}`);
    });
    console.log('');
  }
}

// Common fixes
console.log('\n💡 Recommended Fixes:\n');

if (errorCategories['Cannot find module'].length > 0) {
  console.log('1. Module Import Issues:');
  console.log('   - Check that all route files exist in the routes/ directory');
  console.log('   - Run: npm install');
  console.log('   - Check for typos in require() statements\n');
}

if (errorCategories['ECONNREFUSED'].length > 0) {
  console.log('2. Database Connection Issues:');
  console.log('   - Ensure PostgreSQL is running');
  console.log('   - Check database credentials in .env.test');
  console.log('   - Run: npm run test:setup\n');
}

if (errorCategories['relation does not exist'].length > 0) {
  console.log('3. Missing Database Tables:');
  console.log('   - The test database needs all tables created');
  console.log('   - Consider creating a test database schema file');
  console.log('   - Each test should create its required tables in beforeAll()\n');
}

console.log('📝 Next Steps:');
console.log('1. Fix the most common issue first');
console.log('2. Run a single test file to verify: npm run test:clients');
console.log('3. Check test-report.html for detailed error messages');
