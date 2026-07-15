# API Route Tests

This directory contains comprehensive test suites for all API routes in the backend application.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Ensure PostgreSQL is running locally
   - The tests use a database named `testdb2`
   - Tests will automatically create and drop tables as needed

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Test clients routes
npm run test:clients

# Test projects routes  
npm run test:projects

# Test items routes
npm run test:items

# Test employees routes
npm run test:employees
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Structure

Each test file follows this pattern:

1. **Setup (beforeAll)**: Creates necessary database tables
2. **Teardown (afterAll)**: Drops tables and closes connections
3. **Reset (beforeEach)**: Clears data and inserts test fixtures
4. **Test Cases**: Comprehensive testing of all CRUD operations

## Test Files

- `clients_route.test.js`: Tests for client management endpoints
- `projects_route.test.js`: Tests for project management endpoints
- `items_route.test.js`: Tests for construction items endpoints
- `employees_route.test.js`: Tests for employee management endpoints

## Common Test Patterns

### Testing GET Endpoints
- Get all records
- Get by ID
- Get by specific criteria (type, status, etc.)
- Search functionality
- 404 handling

### Testing POST Endpoints
- Create with valid data
- Validation errors
- Duplicate handling

### Testing PUT Endpoints
- Update with valid data
- Partial updates
- 404 handling
- Validation errors

### Testing DELETE Endpoints
- Successful deletion
- 404 handling
- Cascade/constraint handling

## Database Connection

Tests use the following configuration:
```javascript
{
  user: 'postgres',
  password: 'nopassword',
  host: 'localhost',
  port: 5432,
  database: 'testdb2'
}
```

## Troubleshooting

### Babel/Parse Errors
If you encounter parsing errors, ensure:
- Babel dependencies are installed
- `.babelrc.json` is present
- Jest configuration includes proper transform settings

### Database Errors
- Ensure PostgreSQL service is running
- Check database credentials in `testApp.js`
- Verify `testdb2` database exists

### Port Conflicts
- Tests use the Express app without starting a server
- No port conflicts should occur
- If needed, use `PORT=3002 npm test`

## Adding New Tests

1. Create a new test file: `[route_name]_route.test.js`
2. Import test utilities:
   ```javascript
   const request = require('supertest');
   const createTestApp = require('./testApp');
   ```
3. Follow the existing test patterns
4. Add the route to `testApp.js` if not already included

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Assertions**: Test both success and error cases
4. **Descriptive**: Use clear test descriptions
5. **Complete**: Test all endpoints and edge cases
