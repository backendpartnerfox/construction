#!/usr/bin/env node
// tests/run-tests-individually.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Tests Individually to Identify Failures\n');

// Get all test files
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .sort();

const results = {
  passed: [],
  failed: [],
  errors: {}
};

console.log(`Found ${testFiles.length} test files\n`);
console.log('Running tests (this may take a while)...\n');

// Run each test individually
testFiles.forEach((file, index) => {
  process.stdout.write(`[${index + 1}/${testFiles.length}] ${file.padEnd(50, '.')}`);
  
  try {
    execSync(`npx jest ${path.join(testDir, file)} --silent`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    results.passed.push(file);
    console.log(' ✅ PASSED');
  } catch (error) {
    results.failed.push(file);
    
    // Extract error message
    const output = error.stdout || error.stderr || error.message;
    const errorLines = output.split('\n').slice(0, 10).join('\n');
    results.errors[file] = errorLines;
    
    console.log(' ❌ FAILED');
  }
});

// Generate summary report
console.log('\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${testFiles.length}`);
console.log(`Passed: ${results.passed.length} (${Math.round(results.passed.length / testFiles.length * 100)}%)`);
console.log(`Failed: ${results.failed.length} (${Math.round(results.failed.length / testFiles.length * 100)}%)`);

// Show failed tests with error snippets
if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  console.log('-'.repeat(80));
  
  results.failed.slice(0, 10).forEach(file => {
    console.log(`\n📁 ${file}`);
    const error = results.errors[file];
    if (error) {
      // Try to extract the most relevant error message
      const lines = error.split('\n');
      const relevantLines = lines.filter(line => 
        line.includes('Error:') || 
        line.includes('Cannot') || 
        line.includes('not exist') ||
        line.includes('ECONNREFUSED') ||
        line.includes('undefined')
      ).slice(0, 3);
      
      if (relevantLines.length > 0) {
        relevantLines.forEach(line => console.log(`   ${line.trim()}`));
      } else {
        console.log(`   ${lines[0]}`);
      }
    }
  });
  
  if (results.failed.length > 10) {
    console.log(`\n... and ${results.failed.length - 10} more failed tests`);
  }
}

// Categorize errors
console.log('\n📈 ERROR CATEGORIES:');
console.log('-'.repeat(80));

const errorCategories = {
  'Cannot find module': 0,
  'relation .* does not exist': 0,
  'ECONNREFUSED': 0,
  'Cannot read property': 0,
  'timeout': 0,
  'other': 0
};

results.failed.forEach(file => {
  const error = results.errors[file] || '';
  let categorized = false;
  
  if (error.includes('Cannot find module')) {
    errorCategories['Cannot find module']++;
    categorized = true;
  } else if (error.match(/relation .* does not exist/)) {
    errorCategories['relation .* does not exist']++;
    categorized = true;
  } else if (error.includes('ECONNREFUSED')) {
    errorCategories['ECONNREFUSED']++;
    categorized = true;
  } else if (error.includes('Cannot read property')) {
    errorCategories['Cannot read property']++;
    categorized = true;
  } else if (error.includes('timeout')) {
    errorCategories['timeout']++;
    categorized = true;
  }
  
  if (!categorized) {
    errorCategories['other']++;
  }
});

Object.entries(errorCategories).forEach(([category, count]) => {
  if (count > 0) {
    console.log(`${category}: ${count} errors`);
  }
});

// Save detailed results
const reportPath = path.join(__dirname, 'test-results-detailed.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Detailed results saved to: ${reportPath}`);

// Provide recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('-'.repeat(80));

if (errorCategories['Cannot find module'] > 0) {
  console.log('\n1. Module Import Issues:');
  console.log('   Run: node tests/fix-common-test-issues.js');
  console.log('   This will regenerate testApp.js with all route imports');
}

if (errorCategories['relation .* does not exist'] > 0) {
  console.log('\n2. Missing Database Tables:');
  console.log('   Run: npm run test:setup');
  console.log('   This will create the test database and basic tables');
}

if (errorCategories['ECONNREFUSED'] > 0) {
  console.log('\n3. Database Connection Issues:');
  console.log('   - Ensure PostgreSQL is running');
  console.log('   - Check .env.test has correct database credentials');
  console.log('   - Verify testdb2 database exists');
}

console.log('\n🎯 QUICK FIXES:');
console.log('1. Fix all import issues: node tests/fix-common-test-issues.js');
console.log('2. Setup database: npm run test:setup');
console.log('3. Run working example: npx jest tests/example-working.test.js');
console.log('4. Test a specific file: npm run test:clients');

process.exit(results.failed.length > 0 ? 1 : 0);
