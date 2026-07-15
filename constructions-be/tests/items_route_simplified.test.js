// tests/items_route_simplified.test.js
const request = require('supertest');
const createTestApp = require('./testApp');
const itemsTestData = require('./testData/itemsTestData');

let app, pool;

beforeAll(async () => {
  // Use testdb2 as specified
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_unit VARCHAR(20),
      item_category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data
  await pool.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const item of itemsTestData.seedData) {
    await pool.query(
      `INSERT INTO items (item_id, item_name, item_description, item_unit, item_category, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.item_id, item.item_name, item.item_description, item.item_unit, item.item_category, item.is_active]
    );
  }
  
  await pool.query("SELECT setval('items_item_id_seq', 8)");
});

describe('Items API - Simplified Tests', () => {
  
  describe('CREATE Operations', () => {
    itemsTestData.validCreateData.forEach(testCase => {
      test(`should create item: ${testCase.name}`, async () => {
        const response = await request(app)
          .post('/items')
          .send(testCase.data);
        
        expect(response.status).toBe(201);
        
        if (testCase.expected) {
          Object.keys(testCase.expected).forEach(key => {
            expect(response.body[key]).toBe(testCase.expected[key]);
          });
        }
      });
    });
    
    itemsTestData.invalidCreateData.forEach(testCase => {
      test(`should fail to create item: ${testCase.name}`, async () => {
        const response = await request(app)
          .post('/items')
          .send(testCase.data);
        
        expect(response.status).toBe(testCase.expectedStatus);
        if (testCase.expectedError) {
          expect(response.body.error).toBe(testCase.expectedError);
        }
      });
    });
  });
  
  describe('READ Operations', () => {
    test('should read all items', async () => {
      const response = await request(app).get('/items');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(itemsTestData.seedData.length);
    });
    
    test('should read single item by ID', async () => {
      const testItem = itemsTestData.seedData[0];
      const response = await request(app).get(`/items/${testItem.item_id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.item_name).toBe(testItem.item_name);
      expect(response.body.item_description).toBe(testItem.item_description);
    });
    
    test('should return active items only', async () => {
      const response = await request(app).get('/items/active');
      
      expect(response.status).toBe(200);
      const activeCount = itemsTestData.seedData.filter(item => item.is_active).length;
      expect(response.body.length).toBe(activeCount);
    });
  });
  
  describe('UPDATE Operations', () => {
    itemsTestData.validUpdateData.forEach(testCase => {
      test(`should update item: ${testCase.name}`, async () => {
        const response = await request(app)
          .put(`/items/${testCase.itemId}`)
          .send(testCase.data);
        
        expect(response.status).toBe(200);
        Object.keys(testCase.data).forEach(key => {
          expect(response.body[key]).toBe(testCase.data[key]);
        });
      });
    });
    
    itemsTestData.invalidUpdateData.forEach(testCase => {
      test(`should fail to update: ${testCase.name}`, async () => {
        const response = await request(app)
          .put(`/items/${testCase.itemId}`)
          .send(testCase.data);
        
        expect(response.status).toBe(testCase.expectedStatus);
        expect(response.body.error).toBe(testCase.expectedError);
      });
    });
  });
  
  describe('DELETE Operations', () => {
    itemsTestData.deleteTestCases.forEach(testCase => {
      test(`should handle delete: ${testCase.name}`, async () => {
        const response = await request(app).delete(`/items/${testCase.itemId}`);
        
        expect(response.status).toBe(testCase.expectedStatus);
        if (testCase.expectedMessage) {
          expect(response.body.message).toBe(testCase.expectedMessage);
        }
        if (testCase.expectedError) {
          expect(response.body.error).toBe(testCase.expectedError);
        }
      });
    });
  });
  
  describe('SEARCH Operations', () => {
    itemsTestData.searchTestCases.forEach(testCase => {
      test(`should search: ${testCase.name}`, async () => {
        const response = await request(app).get(`/items/search?query=${testCase.query}`);
        
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(testCase.expectedCount);
        
        const itemNames = response.body.map(item => item.item_name);
        testCase.expectedItems.forEach(expectedItem => {
          expect(itemNames).toContain(expectedItem);
        });
      });
    });
    
    test('should require search query', async () => {
      const response = await request(app).get('/items/search');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Search query is required');
    });
  });
  
  describe('CATEGORY Filter', () => {
    itemsTestData.categoryTestCases.forEach(testCase => {
      test(`should filter by category: ${testCase.name}`, async () => {
        const response = await request(app).get(`/items/category/${testCase.category}`);
        
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(testCase.expectedCount);
        
        const itemNames = response.body.map(item => item.item_name);
        testCase.expectedItems.forEach(expectedItem => {
          expect(itemNames).toContain(expectedItem);
        });
      });
    });
  });
});
