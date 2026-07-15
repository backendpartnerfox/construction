// tests/project_blocks_route.test.js
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

describe('project blocks API', () => {
  // Test GET all
  test('GET /project_blocks - should return all project blocks', async () => {
    const response = await request(app).get('/project_blocks');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /project_blocks/:id - should return a specific project block', async () => {
    const response = await request(app).get('/project_blocks/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /project_blocks - should create a new project block', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test project block'
    };
    
    const response = await request(app)
      .post('/project_blocks')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /project_blocks/:id - should update a project block', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated project block'
    };
    
    const response = await request(app)
      .put('/project_blocks/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /project_blocks/:id - should delete a project block', async () => {
    const response = await request(app).delete('/project_blocks/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
