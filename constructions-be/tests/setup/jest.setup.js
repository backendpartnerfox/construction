// tests/setup/jest.setup.js
// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console.log to reduce noise during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  };
}

// Suppress specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    args[0].includes('experimental')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};