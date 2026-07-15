module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup/jest.setup.js"],
  coveragePathIgnorePatterns: ["/node_modules/"],
  transform: {},
  transformIgnorePatterns: [
    "node_modules/"
  ],
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  moduleFileExtensions: ["js", "json"],
  testTimeout: 30000, // 30 seconds timeout
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "API Test Report",
        outputPath: "./test-report.html",
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
  ],
  // Add test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: '3001'
  },
  // Ignore certain test files if needed
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/setup/",
    "/tests/testData/"
  ]
};