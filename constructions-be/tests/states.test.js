// tests/states.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS states (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(10)
    );
    
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      state_id INTEGER NOT NULL REFERENCES states(id)
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS cities');
  await pool.query('DROP TABLE IF EXISTS states');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM cities');
  await pool.query('DELETE FROM states');
  
  // Insert test data
  await pool.query(`
    INSERT INTO states (id, name, code)
    VALUES 
      (1, 'Maharashtra', 'MH'),
      (2, 'Karnataka', 'KA')
  `);
  
  await pool.query(`
    INSERT INTO cities (id, name, state_id)
    VALUES 
      (1, 'Mumbai', 1),
      (2, 'Pune', 1),
      (3, 'Bangalore', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('states_id_seq', 2)");
  await pool.query("SELECT setval('cities_id_seq', 3)");
});

describe('States API', () => {
  // Test GET all states
  test('GET /states - should return all states', async () => {
    const response = await request(app).get('/states');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('name', 'Maharashtra');
    expect(response.body[1]).toHaveProperty('name', 'Karnataka');
  });
  
  // Test GET state by ID
  test('GET /states/:id - should return a specific state', async () => {
    const response = await request(app).get('/states/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'Maharashtra');
    expect(response.body).toHaveProperty('code', 'MH');
  });
  
  // Test GET state by ID - not found
  test('GET /states/:id - should return 404 for non-existent state', async () => {
    const response = await request(app).get('/states/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'State not found');
  });
  
  // Test POST new state
  test('POST /states - should create a new state', async () => {
    const newState = {
      name: 'Tamil Nadu',
      code: 'TN'
    };
    
    const response = await request(app)
      .post('/states')
      .send(newState);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('name', 'Tamil Nadu');
    expect(response.body).toHaveProperty('code', 'TN');
    
    // Verify state was actually created
    const allStates = await request(app).get('/states');
    expect(allStates.body.length).toBe(3);
  });
  
  // Test POST state - missing required field
  test('POST /states - should return 400 for missing name', async () => {
    const incompleteState = {
      code: 'XX'
    };
    
    const response = await request(app)
      .post('/states')
      .send(incompleteState);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'State name is required');
  });
  
  // Test POST state - duplicate name
  test('POST /states - should return 400 for duplicate name', async () => {
    const duplicateState = {
      name: 'Maharashtra',
      code: 'MH'
    };
    
    const response = await request(app)
      .post('/states')
      .send(duplicateState);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'State with this name already exists');
  });
  
  // Test PUT update state
  test('PUT /states/:id - should update a state', async () => {
    const updatedData = {
      name: 'Maharashtra Updated',
      code: 'MU'
    };
    
    const response = await request(app)
      .put('/states/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'Maharashtra Updated');
    expect(response.body).toHaveProperty('code', 'MU');
    
    // Verify state was actually updated
    const updatedState = await request(app).get('/states/1');
    expect(updatedState.body.name).toBe('Maharashtra Updated');
  });
  
  // Test PUT state - not found
  test('PUT /states/:id - should return 404 for non-existent state', async () => {
    const updatedData = {
      name: 'Non-existent State',
      code: 'NE'
    };
    
    const response = await request(app)
      .put('/states/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'State not found');
  });
  
  // Test DELETE state
  test('DELETE /states/:id - should delete a state with no cities', async () => {
    // First delete all cities in state 2
    await pool.query('DELETE FROM cities WHERE state_id = 2');
    
    const response = await request(app).delete('/states/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'State deleted successfully');
    
    // Verify state was actually deleted
    const deletedState = await request(app).get('/states/2');
    expect(deletedState.status).toBe(404);
    
    const allStates = await request(app).get('/states');
    expect(allStates.body.length).toBe(1);
  });
  
  // Test DELETE state with associated cities
  test('DELETE /states/:id - should return 400 for state with associated cities', async () => {
    const response = await request(app).delete('/states/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete state because it has associated cities. Delete the cities first.');
  });
  
  // Test GET cities by state ID
  test('GET /states/:id/cities - should return cities for a specific state', async () => {
    const response = await request(app).get('/states/1/cities');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('name', 'Mumbai');
    expect(response.body[1]).toHaveProperty('name', 'Pune');
  });
  
  // Test GET cities by state ID - not found
  test('GET /states/:id/cities - should return 404 for non-existent state', async () => {
    const response = await request(app).get('/states/999/cities');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'State not found');
  });
});
