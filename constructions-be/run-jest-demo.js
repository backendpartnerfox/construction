#!/usr/bin/env node

/**
 * Jest + Supertest Test Runner Example
 * This script demonstrates the complete flow of running tests
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Jest + Supertest Test Flow Demo\n');

// Step 1: Show available test commands
console.log('📋 Available Test Commands:');
console.log('  npm test                  - Run all tests');
console.log('  npm run test:watch        - Run tests in watch mode');
console.log('  npm run test:coverage     - Run tests with coverage');
console.log('  npm run test:clients      - Run client route tests');
console.log('  npm run test:projects     - Run project route tests\n');

// Step 2: Function to run a test command
function runTest(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Running: ${command} ${args.join(' ')}`);
    console.log('─'.repeat(50));
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname)
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Test failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Step 3: Main test flow
async function runTestFlow() {
  try {
    // Check if specific test file is provided as argument
    const testFile = process.argv[2];
    
    if (testFile) {
      // Run specific test file
      console.log(`\n📌 Running specific test: ${testFile}`);
      await runTest('npx', ['jest', testFile, '--verbose']);
    } else {
      // Show menu
      console.log('\n📊 Test Flow Options:');
      console.log('1. Run room dimensions tests only');
      console.log('2. Run all tests');
      console.log('3. Run tests with coverage');
      console.log('4. Run tests in watch mode\n');
      
      // For demo, we'll run room dimensions test
      console.log('🎯 Demo: Running room dimensions tests...\n');
      
      // First, check if test file exists
      const fs = require('fs');
      const testPath = path.join(__dirname, 'tests', 'room_dimensions_route.test.js');
      
      if (fs.existsSync(testPath)) {
        await runTest('npx', ['jest', 'tests/room_dimensions_route.test.js', '--verbose']);
        
        console.log('\n✅ Tests completed successfully!');
        console.log('\n📈 To see coverage report, run: npm run test:coverage');
        console.log('📄 To see HTML report, open: test-report.html');
      } else {
        console.log('⚠️  Test file not found. Creating a simple test...');
        
        // Create a minimal test
        const minimalTest = `
const request = require('supertest');
const express = require('express');

describe('Minimal Test Example', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.get('/test', (req, res) => {
      res.json({ message: 'Hello Jest!' });
    });
  });
  
  it('should return Hello Jest', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);
      
    expect(response.body).toEqual({ message: 'Hello Jest!' });
  });
});
`;
        
        fs.writeFileSync(path.join(__dirname, 'tests', 'minimal.test.js'), minimalTest);
        await runTest('npx', ['jest', 'tests/minimal.test.js', '--verbose']);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Step 4: Show test execution flow
console.log('\n🔄 Test Execution Flow:');
console.log('1. Jest loads configuration from jest.config.js');
console.log('2. Test files are discovered in tests/ directory');
console.log('3. Express app is created with mocked database');
console.log('4. Routes are mounted on the test app');
console.log('5. Supertest makes HTTP requests to the app');
console.log('6. Responses are validated with Jest matchers');
console.log('7. Results are reported in console and HTML\n');

// Run the test flow
runTestFlow();
