// tests/payment_methods_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      payment_method_id SERIAL PRIMARY KEY,
      method_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS payment_methods');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM payment_methods');
  
  // Insert test data
  await pool.query(`
    INSERT INTO payment_methods (payment_method_id, method_name, is_active)
    VALUES 
      (1, 'Cash', true),
      (2, 'Cheque', true),
      (3, 'Bank Transfer', true),
      (4, 'Credit Card', true),
      (5, 'UPI', true),
      (6, 'Net Banking', true),
      (7, 'RTGS', true),
      (8, 'NEFT', false)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('payment_methods_payment_method_id_seq', 8)");
});

describe('Payment Methods API', () => {
  // Test GET all payment methods
  test('GET /payment-methods - should return all payment methods', async () => {
    const response = await request(app).get('/payment-methods');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(8);
    expect(response.body[0]).toHaveProperty('payment_method_id');
    expect(response.body[0]).toHaveProperty('method_name');
    expect(response.body[0]).toHaveProperty('is_active');
  });
  
  // Test GET payment method by ID
  test('GET /payment-methods/:id - should return a specific payment method', async () => {
    const response = await request(app).get('/payment-methods/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_method_id', 1);
    expect(response.body).toHaveProperty('method_name', 'Cash');
    expect(response.body).toHaveProperty('is_active', true);
  });
  
  // Test GET payment method by ID - not found
  test('GET /payment-methods/:id - should return 404 for non-existent payment method', async () => {
    const response = await request(app).get('/payment-methods/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment method not found');
  });
  
  // Test POST new payment method
  test('POST /payment-methods - should create a new payment method', async () => {
    const newPaymentMethod = {
      method_name: 'Mobile Wallet',
      is_active: true
    };
    
    const response = await request(app)
      .post('/payment-methods')
      .send(newPaymentMethod);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('payment_method_id', 9);
    expect(response.body).toHaveProperty('method_name', 'Mobile Wallet');
    expect(response.body).toHaveProperty('is_active', true);
  });
  
  // Test POST payment method - missing required fields
  test('POST /payment-methods - should return 400 for missing method name', async () => {
    const incompletePaymentMethod = {
      is_active: true
    };
    
    const response = await request(app)
      .post('/payment-methods')
      .send(incompletePaymentMethod);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Method name is required');
  });
  
  // Test PUT update payment method
  test('PUT /payment-methods/:id - should update a payment method', async () => {
    const updatedPaymentMethod = {
      method_name: 'Updated Cash Payment',
      is_active: false
    };
    
    const response = await request(app)
      .put('/payment-methods/1')
      .send(updatedPaymentMethod);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_method_id', 1);
    expect(response.body).toHaveProperty('method_name', 'Updated Cash Payment');
    expect(response.body).toHaveProperty('is_active', false);
  });
  
  // Test PUT payment method - not found
  test('PUT /payment-methods/:id - should return 404 for non-existent payment method', async () => {
    const updatedPaymentMethod = {
      method_name: 'Updated Method',
      is_active: true
    };
    
    const response = await request(app)
      .put('/payment-methods/999')
      .send(updatedPaymentMethod);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment method not found');
  });
  
  // Test PUT payment method - missing required fields
  test('PUT /payment-methods/:id - should return 400 for missing method name', async () => {
    const incompletePaymentMethod = {
      is_active: true
    };
    
    const response = await request(app)
      .put('/payment-methods/1')
      .send(incompletePaymentMethod);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Method name is required');
  });
  
  // Test DELETE payment method
  test('DELETE /payment-methods/:id - should delete a payment method', async () => {
    const response = await request(app).delete('/payment-methods/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Payment method deleted successfully');
    
    // Verify payment method was deleted
    const getResponse = await request(app).get('/payment-methods/1');
    expect(getResponse.status).toBe(404);
  });
  
  // Test DELETE payment method - not found
  test('DELETE /payment-methods/:id - should return 404 for non-existent payment method', async () => {
    const response = await request(app).delete('/payment-methods/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment method not found');
  });
  
  // Test GET active payment methods
  test('GET /payment-methods/active - should return only active payment methods', async () => {
    const response = await request(app).get('/payment-methods/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(7); // 7 active methods
    expect(response.body.every(method => method.is_active === true)).toBeTruthy();
  });
  
  // Test search payment methods
  test('GET /payment-methods/search?query=Bank - should search payment methods', async () => {
    const response = await request(app).get('/payment-methods/search?query=Bank');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    // Should find 'Bank Transfer' and 'Net Banking'
    expect(response.body.some(method => method.method_name.includes('Bank'))).toBeTruthy();
  });
  
  // Test search payment methods - missing query
  test('GET /payment-methods/search - should return 400 for missing search query', async () => {
    const response = await request(app).get('/payment-methods/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
  
  // Test search payment methods - no results
  test('GET /payment-methods/search?query=NonExistentMethod - should return empty array for no matches', async () => {
    const response = await request(app).get('/payment-methods/search?query=NonExistentMethod');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
});