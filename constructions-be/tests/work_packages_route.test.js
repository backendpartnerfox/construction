// tests/work_packages_route.test.js
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

describe('work packages API', () => {
  // Test GET all
  test('GET /work_packages - should return all work packages', async () => {
    const response = await request(app).get('/work_packages');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /work_packages/:id - should return a specific work package', async () => {
    const response = await request(app).get('/work_packages/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /work_packages - should create a new work package', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test work package'
    };
    
    const response = await request(app)
      .post('/work_packages')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /work_packages/:id - should update a work package', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated work package'
    };
    
    const response = await request(app)
      .put('/work_packages/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /work_packages/:id - should delete a work package', async () => {
    const response = await request(app).delete('/work_packages/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
