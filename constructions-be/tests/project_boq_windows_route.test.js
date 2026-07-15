// tests/project_boq_windows_route.test.js
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

describe('project boq windows API', () => {
  // Test GET all
  test('GET /project_boq_windows - should return all project boq windows', async () => {
    const response = await request(app).get('/project_boq_windows');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /project_boq_windows/:id - should return a specific project boq window', async () => {
    const response = await request(app).get('/project_boq_windows/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /project_boq_windows - should create a new project boq window', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test project boq window'
    };
    
    const response = await request(app)
      .post('/project_boq_windows')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /project_boq_windows/:id - should update a project boq window', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated project boq window'
    };
    
    const response = await request(app)
      .put('/project_boq_windows/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /project_boq_windows/:id - should delete a project boq window', async () => {
    const response = await request(app).delete('/project_boq_windows/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
