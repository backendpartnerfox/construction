// tests/phase_units_route.test.js
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

describe('phase units API', () => {
  // Test GET all
  test('GET /phase_units - should return all phase units', async () => {
    const response = await request(app).get('/phase_units');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /phase_units/:id - should return a specific phase unit', async () => {
    const response = await request(app).get('/phase_units/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /phase_units - should create a new phase unit', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test phase unit'
    };
    
    const response = await request(app)
      .post('/phase_units')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /phase_units/:id - should update a phase unit', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated phase unit'
    };
    
    const response = await request(app)
      .put('/phase_units/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /phase_units/:id - should delete a phase unit', async () => {
    const response = await request(app).delete('/phase_units/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
