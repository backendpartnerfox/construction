// tests/sequencing_route.test.js
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

describe('sequencing API', () => {
  // Test GET all
  test('GET /sequencing - should return all sequencings', async () => {
    const response = await request(app).get('/sequencing');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });
  
  // Test GET by ID
  test('GET /sequencing/:id - should return a specific sequencing', async () => {
    const response = await request(app).get('/sequencing/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect(response.status).toBe(404);
    }
  });
  
  // Test POST
  test('POST /sequencing - should create a new sequencing', async () => {
    const newItem = {
      // Add appropriate fields here
      name: 'Test sequencing'
    };
    
    const response = await request(app)
      .post('/sequencing')
      .send(newItem);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test PUT
  test('PUT /sequencing/:id - should update a sequencing', async () => {
    const updateData = {
      // Add appropriate fields here
      name: 'Updated sequencing'
    };
    
    const response = await request(app)
      .put('/sequencing/1')
      .send(updateData);
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
    } else {
      expect([400, 404, 405]).toContain(response.status);
    }
  });
  
  // Test DELETE
  test('DELETE /sequencing/:id - should delete a sequencing', async () => {
    const response = await request(app).delete('/sequencing/1');
    
    if (response.status === 200) {
      expect(response.body).toHaveProperty('message');
    } else {
      expect([404, 405]).toContain(response.status);
    }
  });
});
