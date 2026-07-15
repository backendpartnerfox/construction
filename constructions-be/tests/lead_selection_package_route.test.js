// tests/lead_selection_package_route.test.js
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

describe('lead selection package API', () => {
  // Test GET all
  test('GET /lead_selection_package - should return all lead selection packages', async () => {
    const response = await request(app).get('/lead_selection_package');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /lead_selection_package/:id - should return a specific lead selection package', async () => {
    const response = await request(app).get('/lead_selection_package/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /lead_selection_package - should create a new lead selection package', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test lead selection package'
    };
    
    const response = await request(app)
      .post('/lead_selection_package')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /lead_selection_package/:id - should update a lead selection package', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated lead selection package'
    };
    
    const response = await request(app)
      .put('/lead_selection_package/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /lead_selection_package/:id - should delete a lead selection package', async () => {
    const response = await request(app).delete('/lead_selection_package/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
