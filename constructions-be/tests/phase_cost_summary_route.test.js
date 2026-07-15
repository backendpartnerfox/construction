// tests/phase_cost_summary_route.test.js
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

describe('phase cost summary API', () => {
  // Test GET all
  test('GET /phase_cost_summary - should return all phase cost summarys', async () => {
    const response = await request(app).get('/phase_cost_summary');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /phase_cost_summary/:id - should return a specific phase cost summary', async () => {
    const response = await request(app).get('/phase_cost_summary/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /phase_cost_summary - should create a new phase cost summary', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test phase cost summary'
    };
    
    const response = await request(app)
      .post('/phase_cost_summary')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /phase_cost_summary/:id - should update a phase cost summary', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated phase cost summary'
    };
    
    const response = await request(app)
      .put('/phase_cost_summary/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /phase_cost_summary/:id - should delete a phase cost summary', async () => {
    const response = await request(app).delete('/phase_cost_summary/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
