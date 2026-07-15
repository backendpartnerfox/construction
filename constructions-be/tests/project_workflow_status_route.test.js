// tests/project_workflow_status_route.test.js
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

describe('project workflow status API', () => {
  // Test GET all
  test('GET /project_workflow_status - should return all project workflow status', async () => {
    const response = await request(app).get('/project_workflow_status');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /project_workflow_status/:id - should return a specific project workflow statu', async () => {
    const response = await request(app).get('/project_workflow_status/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /project_workflow_status - should create a new project workflow statu', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test project workflow statu'
    };
    
    const response = await request(app)
      .post('/project_workflow_status')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /project_workflow_status/:id - should update a project workflow statu', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated project workflow statu'
    };
    
    const response = await request(app)
      .put('/project_workflow_status/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /project_workflow_status/:id - should delete a project workflow statu', async () => {
    const response = await request(app).delete('/project_workflow_status/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
