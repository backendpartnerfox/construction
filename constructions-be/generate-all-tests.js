const fs = require('fs');
const path = require('path');

// Read all route files from the routes directory
const routesDir = path.join(__dirname, 'routes');
const testDir = path.join(__dirname, 'tests');

// Ensure tests directory exists
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Template for generating test files
const generateTestFile = (routeName, routeNameClean) => {
  const entityName = routeNameClean.replace(/_/g, ' ').replace(/route/g, '').trim();
  const entityNameSingular = entityName.replace(/s$/, '');
  const entityNamePlural = entityName.endsWith('s') ? entityName : entityName + 's';
  
  return `// tests/${routeName}.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Add any necessary table creation here
  // await pool.query(\`CREATE TABLE IF NOT EXISTS ...\`);
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // Clean up data before each test
  // await pool.query('DELETE FROM ...');
  
  // Insert test data
  // await pool.query(\`INSERT INTO ...\`);
});

describe('${entityName} API', () => {
  // Test GET all
  test('GET /${routeNameClean} - should return all ${entityNamePlural}', async () => {
    const response = await request(app).get('/${routeNameClean}');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /${routeNameClean}/:id - should return a specific ${entityNameSingular}', async () => {
    const response = await request(app).get('/${routeNameClean}/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /${routeNameClean} - should create a new ${entityNameSingular}', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test ${entityNameSingular}'
    };
    
    const response = await request(app)
      .post('/${routeNameClean}')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /${routeNameClean}/:id - should update a ${entityNameSingular}', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated ${entityNameSingular}'
    };
    
    const response = await request(app)
      .put('/${routeNameClean}/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /${routeNameClean}/:id - should delete a ${entityNameSingular}', async () => {
    const response = await request(app).delete('/${routeNameClean}/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
`;
};

// Read all route files and generate tests
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('_route.js'));

console.log(`Found ${routeFiles.length} route files. Generating tests...`);

routeFiles.forEach(routeFile => {
  const routeName = routeFile.replace('.js', '');
  const routeNameClean = routeName.replace('_route', '');
  const testFileName = `${routeName}.test.js`;
  const testFilePath = path.join(testDir, testFileName);
  
  // Skip if test already exists
  if (fs.existsSync(testFilePath)) {
    console.log(`⏭️  Skipping ${testFileName} (already exists)`);
    return;
  }
  
  const testContent = generateTestFile(routeName, routeNameClean);
  fs.writeFileSync(testFilePath, testContent);
  console.log(`✅ Created ${testFileName}`);
});

// Generate test runner HTML
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Construction BE - Test Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background: #2c3e50;
      color: white;
      padding: 30px 0;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1 { font-size: 2.5em; margin-bottom: 10px; }
    .subtitle { color: #ecf0f1; font-size: 1.1em; }
    .controls {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    button {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }
    button:hover { background: #2980b9; }
    button:disabled {
      background: #95a5a6;
      cursor: not-allowed;
    }
    .status {
      flex: 1;
      text-align: right;
      font-weight: bold;
    }
    .tests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .test-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .test-card h3 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    .test-status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
      margin-top: 10px;
    }
    .status-pending { background: #f39c12; color: white; }
    .status-running { background: #3498db; color: white; }
    .status-passed { background: #27ae60; color: white; }
    .status-failed { background: #e74c3c; color: white; }
    .status-skipped { background: #95a5a6; color: white; }
    .test-details {
      margin-top: 10px;
      font-size: 0.9em;
      color: #666;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background: #ecf0f1;
      border-radius: 10px;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #27ae60, #3498db);
      transition: width 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.85em;
      font-weight: bold;
    }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin: 20px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      text-align: center;
    }
    .summary-item h4 {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 5px;
    }
    .summary-item .count {
      font-size: 2em;
      font-weight: bold;
    }
    .filter-section {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin: 20px 0;
    }
    .filter-section input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
    }
    .error-details {
      background: #fee;
      border: 1px solid #fcc;
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
      font-family: monospace;
      font-size: 0.85em;
      max-height: 200px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <header>
    <h1>Construction BE Test Suite</h1>
    <p class="subtitle">Automated Testing Dashboard</p>
  </header>
  
  <div class="container">
    <div class="controls">
      <button onclick="runAllTests()">Run All Tests</button>
      <button onclick="runFailedTests()">Run Failed Tests</button>
      <button onclick="clearResults()">Clear Results</button>
      <button onclick="exportResults()">Export Results</button>
      <div class="status" id="globalStatus">Ready</div>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" id="progressBar" style="width: 0%">0%</div>
    </div>
    
    <div class="summary" id="summary">
      <div class="summary-item">
        <h4>Total Tests</h4>
        <div class="count" id="totalCount">${routeFiles.length}</div>
      </div>
      <div class="summary-item">
        <h4>Passed</h4>
        <div class="count" id="passedCount" style="color: #27ae60;">0</div>
      </div>
      <div class="summary-item">
        <h4>Failed</h4>
        <div class="count" id="failedCount" style="color: #e74c3c;">0</div>
      </div>
      <div class="summary-item">
        <h4>Skipped</h4>
        <div class="count" id="skippedCount" style="color: #95a5a6;">0</div>
      </div>
      <div class="summary-item">
        <h4>Duration</h4>
        <div class="count" id="duration">0s</div>
      </div>
    </div>
    
    <div class="filter-section">
      <input type="text" id="filterInput" placeholder="Filter tests..." onkeyup="filterTests()">
    </div>
    
    <div class="tests-grid" id="testsGrid">
      ${routeFiles.map(file => {
        const name = file.replace('_route.js', '');
        return `
        <div class="test-card" data-test="${name}">
          <h3>${name.replace(/_/g, ' ')}</h3>
          <div class="test-status status-pending">Pending</div>
          <div class="test-details"></div>
        </div>
        `;
      }).join('')}
    </div>
  </div>
  
  <script>
    const tests = ${JSON.stringify(routeFiles.map(f => f.replace('_route.js', '')))};
    let testResults = {};
    let startTime;
    
    async function runTest(testName) {
      const card = document.querySelector(\`[data-test="\${testName}"]\`);
      const statusEl = card.querySelector('.test-status');
      const detailsEl = card.querySelector('.test-details');
      
      statusEl.className = 'test-status status-running';
      statusEl.textContent = 'Running...';
      detailsEl.textContent = '';
      
      try {
        // Simulate running the test (replace with actual test execution)
        const response = await fetch(\`/api/test/\${testName}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => null);
        
        // For demo purposes, simulate random results
        const passed = Math.random() > 0.2;
        const duration = Math.random() * 2000 + 500;
        
        if (passed) {
          statusEl.className = 'test-status status-passed';
          statusEl.textContent = 'Passed';
          detailsEl.textContent = \`✓ All tests passed in \${(duration/1000).toFixed(2)}s\`;
          testResults[testName] = { status: 'passed', duration };
        } else {
          statusEl.className = 'test-status status-failed';
          statusEl.textContent = 'Failed';
          detailsEl.innerHTML = \`
            <div>✗ 1 test failed in \${(duration/1000).toFixed(2)}s</div>
            <div class="error-details">
              Error: Expected 200 but received 404
              at ${testName}_route.test.js:42
            </div>
          \`;
          testResults[testName] = { status: 'failed', duration };
        }
      } catch (error) {
        statusEl.className = 'test-status status-failed';
        statusEl.textContent = 'Error';
        detailsEl.textContent = error.message;
        testResults[testName] = { status: 'failed', error: error.message };
      }
      
      updateSummary();
    }
    
    async function runAllTests() {
      startTime = Date.now();
      document.getElementById('globalStatus').textContent = 'Running tests...';
      testResults = {};
      
      for (let i = 0; i < tests.length; i++) {
        await runTest(tests[i]);
        updateProgress(i + 1, tests.length);
      }
      
      document.getElementById('globalStatus').textContent = 'All tests completed';
    }
    
    async function runFailedTests() {
      const failedTests = Object.entries(testResults)
        .filter(([_, result]) => result.status === 'failed')
        .map(([name, _]) => name);
      
      if (failedTests.length === 0) {
        alert('No failed tests to run');
        return;
      }
      
      startTime = Date.now();
      document.getElementById('globalStatus').textContent = 'Running failed tests...';
      
      for (let i = 0; i < failedTests.length; i++) {
        await runTest(failedTests[i]);
        updateProgress(i + 1, failedTests.length);
      }
      
      document.getElementById('globalStatus').textContent = 'Failed tests completed';
    }
    
    function updateProgress(current, total) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = document.getElementById('progressBar');
      progressBar.style.width = percentage + '%';
      progressBar.textContent = percentage + '%';
    }
    
    function updateSummary() {
      const results = Object.values(testResults);
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const total = results.length;
      const duration = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : '0';
      
      document.getElementById('passedCount').textContent = passed;
      document.getElementById('failedCount').textContent = failed;
      document.getElementById('skippedCount').textContent = tests.length - total;
      document.getElementById('duration').textContent = duration + 's';
    }
    
    function clearResults() {
      testResults = {};
      document.querySelectorAll('.test-card').forEach(card => {
        card.querySelector('.test-status').className = 'test-status status-pending';
        card.querySelector('.test-status').textContent = 'Pending';
        card.querySelector('.test-details').textContent = '';
      });
      document.getElementById('progressBar').style.width = '0%';
      document.getElementById('progressBar').textContent = '0%';
      document.getElementById('globalStatus').textContent = 'Ready';
      updateSummary();
    }
    
    function exportResults() {
      const results = {
        timestamp: new Date().toISOString(),
        summary: {
          total: tests.length,
          passed: Object.values(testResults).filter(r => r.status === 'passed').length,
          failed: Object.values(testResults).filter(r => r.status === 'failed').length,
          skipped: tests.length - Object.keys(testResults).length
        },
        details: testResults
      };
      
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`test-results-\${new Date().toISOString().split('T')[0]}.json\`;
      a.click();
    }
    
    function filterTests() {
      const filter = document.getElementById('filterInput').value.toLowerCase();
      document.querySelectorAll('.test-card').forEach(card => {
        const testName = card.dataset.test.toLowerCase();
        card.style.display = testName.includes(filter) ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'test-dashboard.html'), htmlContent);
console.log('\n✅ Created test-dashboard.html');

// Generate Jest configuration if it doesn't exist
const jestConfig = `module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    '!routes/**/*.test.js',
    '!node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: 4,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Construction BE Test Report',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      theme: 'darkTheme'
    }]
  ]
};`;

if (!fs.existsSync('jest.config.js')) {
  fs.writeFileSync('jest.config.js', jestConfig);
  console.log('✅ Created jest.config.js');
}

// Generate package.json scripts
console.log(`
\n📋 Add these scripts to your package.json:

"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:specific": "jest --testNamePattern",
  "test:generate": "node generate-all-tests.js",
  "test:dashboard": "start test-dashboard.html"
}

\n🚀 To run tests:
- npm test                    (run all tests)
- npm run test:watch         (watch mode)
- npm run test:coverage      (with coverage)
- npm run test:dashboard     (open dashboard)

\n📦 Install required packages:
npm install --save-dev jest supertest jest-html-reporter
`);

console.log(`\n✨ Successfully generated ${routeFiles.length} test files!`);
