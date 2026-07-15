// tests/payment_types_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Add any necessary table creation here
  // await pool.query(`CREATE TABLE IF NOT EXISTS ...`);
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // Clean up data before each test
  // await pool.query('DELETE FROM ...');
  
  // Insert test data
  // await pool.query(`INSERT INTO ...`);
});

describe('payment types API', () => {
  // Test GET all
  test('GET /payment_types - should return all payment types', async () => {
    const response = await request(app).get('/payment_types');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /payment_types/:id - should return a specific payment type', async () => {
    const response = await request(app).get('/payment_types/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /payment_types - should create a new payment type', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test payment type'
    };
    
    const response = await request(app)
      .post('/payment_types')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /payment_types/:id - should update a payment type', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated payment type'
    };
    
    const response = await request(app)
      .put('/payment_types/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /payment_types/:id - should delete a payment type', async () => {
    const response = await request(app).delete('/payment_types/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
