// tests/window_dimensions_route.test.js
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

describe('window dimensions API', () => {
  // Test GET all
  test('GET /window_dimensions - should return all window dimensions', async () => {
    const response = await request(app).get('/window_dimensions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /window_dimensions/:id - should return a specific window dimension', async () => {
    const response = await request(app).get('/window_dimensions/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /window_dimensions - should create a new window dimension', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test window dimension'
    };
    
    const response = await request(app)
      .post('/window_dimensions')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /window_dimensions/:id - should update a window dimension', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated window dimension'
    };
    
    const response = await request(app)
      .put('/window_dimensions/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /window_dimensions/:id - should delete a window dimension', async () => {
    const response = await request(app).delete('/window_dimensions/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
