const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'tests');

if (fs.existsSync(testsDir)) {
  const allFiles = fs.readdirSync(testsDir);
  const testFiles = allFiles.filter(file => file.endsWith('.test.js'));
  
  console.log(`Total files in tests directory: ${allFiles.length}`);
  console.log(`Test files (.test.js): ${testFiles.length}`);
  console.log('\nTest files:');
  testFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
} else {
  console.log('Tests directory not found!');
}
