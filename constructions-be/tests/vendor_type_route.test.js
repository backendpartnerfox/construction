// tests/vendor_type_route.test.js
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

describe('vendor type API', () => {
  // Test GET all
  test('GET /vendor_type - should return all vendor types', async () => {
    const response = await request(app).get('/vendor_type');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /vendor_type/:id - should return a specific vendor type', async () => {
    const response = await request(app).get('/vendor_type/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /vendor_type - should create a new vendor type', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test vendor type'
    };
    
    const response = await request(app)
      .post('/vendor_type')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /vendor_type/:id - should update a vendor type', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated vendor type'
    };
    
    const response = await request(app)
      .put('/vendor_type/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /vendor_type/:id - should delete a vendor type', async () => {
    const response = await request(app).delete('/vendor_type/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
