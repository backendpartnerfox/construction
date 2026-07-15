// tests/run-all-tests.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running all API tests...\n');

// Get all test files
const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .sort();

console.log(`Found ${testFiles.length} test files:\n`);
testFiles.forEach(file => console.log(`  - ${file}`));
console.log('\n');

let totalPassed = 0;
let totalFailed = 0;

// Run each test file
testFiles.forEach(testFile => {
  console.log(`\n📋 Running ${testFile}...`);
  console.log('─'.repeat(50));
  
  try {
    const result = execSync(`npm test ${path.join('tests', testFile)}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Parse test results
    const passMatch = result.match(/Tests:\s+(\d+) passed/);
    const failMatch = result.match(/Tests:\s+(\d+) failed/);
    
    if (passMatch) {
      const passed = parseInt(passMatch[1]);
      totalPassed += passed;
      console.log(`✅ ${passed} tests passed`);
    }
    
    if (failMatch) {
      const failed = parseInt(failMatch[1]);
      totalFailed += failed;
      console.log(`❌ ${failed} tests failed`);
    }
  } catch (error) {
    console.log(`❌ Error running ${testFile}:`);
    console.error(error.message);
    totalFailed++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Total Passed: ${totalPassed}`);
console.log(`❌ Total Failed: ${totalFailed}`);
console.log(`📋 Total Tests: ${totalPassed + totalFailed}`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(totalFailed > 0 ? 1 : 0);
