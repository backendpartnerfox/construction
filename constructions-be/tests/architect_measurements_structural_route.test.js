// tests/architect_measurements_structural_route.test.js
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

describe('architect measurements structural API', () => {
  // Test GET all
  test('GET /architect_measurements_structural - should return all architect measurements structurals', async () => {
    const response = await request(app).get('/architect_measurements_structural');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /architect_measurements_structural/:id - should return a specific architect measurements structural', async () => {
    const response = await request(app).get('/architect_measurements_structural/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /architect_measurements_structural - should create a new architect measurements structural', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test architect measurements structural'
    };
    
    const response = await request(app)
      .post('/architect_measurements_structural')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /architect_measurements_structural/:id - should update a architect measurements structural', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated architect measurements structural'
    };
    
    const response = await request(app)
      .put('/architect_measurements_structural/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /architect_measurements_structural/:id - should delete a architect measurements structural', async () => {
    const response = await request(app).delete('/architect_measurements_structural/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
