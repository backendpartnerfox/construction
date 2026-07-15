// tests/cities_route.test.js
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
      name VARCHAR(100) NOT NULL,
      code VARCHAR(10) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      state_id INTEGER REFERENCES states(id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      city_id INTEGER REFERENCES cities(id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.query('DROP TABLE IF EXISTS cities');
  await pool.query('DROP TABLE IF EXISTS states');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM cities');
  await pool.query('DELETE FROM states');
  
  // Insert test data
  await pool.query(`
    INSERT INTO states (id, name, code)
    VALUES 
      (1, 'Maharashtra', 'MH'),
      (2, 'Tamil Nadu', 'TN'),
      (3, 'Karnataka', 'KA')
  `);
  
  await pool.query(`
    INSERT INTO cities (id, name, state_id)
    VALUES 
      (1, 'Mumbai', 1),
      (2, 'Pune', 1),
      (3, 'Chennai', 2),
      (4, 'Bengaluru', 3)
  `);
  
  await pool.query(`
    INSERT INTO users (id, name, city_id)
    VALUES 
      (1, 'John Doe', 1),
      (2, 'Jane Smith', 3)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('states_id_seq', 3)");
  await pool.query("SELECT setval('cities_id_seq', 4)");
  await pool.query("SELECT setval('users_id_seq', 2)");
});

describe('Cities API', () => {
  // Test GET all cities
  test('GET /cities - should return all cities with state info', async () => {
    const response = await request(app).get('/cities');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('state_id');
    expect(response.body[0]).toHaveProperty('state_name');
    expect(response.body[0]).toHaveProperty('state_code');
    
    // Check a couple of cities
    const mumbai = response.body.find(city => city.name === 'Mumbai');
    expect(mumbai).toBeDefined();
    expect(mumbai.state_name).toBe('Maharashtra');
    expect(mumbai.state_code).toBe('MH');
    
    const bengaluru = response.body.find(city => city.name === 'Bengaluru');
    expect(bengaluru).toBeDefined();
    expect(bengaluru.state_name).toBe('Karnataka');
    expect(bengaluru.state_code).toBe('KA');
  });
  
  // Test GET city by ID
  test('GET /cities/:id - should return a specific city', async () => {
    const response = await request(app).get('/cities/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'Mumbai');
    expect(response.body).toHaveProperty('state_id', 1);
    expect(response.body).toHaveProperty('state_name', 'Maharashtra');
    expect(response.body).toHaveProperty('state_code', 'MH');
  });
  
  // Test GET city by ID - not found
  test('GET /cities/:id - should return 404 for non-existent city', async () => {
    const response = await request(app).get('/cities/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'City not found');
  });
  
  // Test GET cities by state
  test('GET /cities/state/:stateId - should return cities for a specific state', async () => {
    const response = await request(app).get('/cities/state/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('state_id', 1);
    expect(response.body[1]).toHaveProperty('state_id', 1);
    
    // Check city names
    const cityNames = response.body.map(city => city.name);
    expect(cityNames).toContain('Mumbai');
    expect(cityNames).toContain('Pune');
  });
  
  // Test GET cities by state - not found
  test('GET /cities/state/:stateId - should return 404 for non-existent state', async () => {
    const response = await request(app).get('/cities/state/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'State not found');
  });
  
  // Test POST new city
  test('POST /cities - should create a new city', async () => {
    const newCity = {
      name: 'Hyderabad',
      state_id: 3
    };
    
    const response = await request(app)
      .post('/cities')
      .send(newCity);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 5);
    expect(response.body).toHaveProperty('name', 'Hyderabad');
    expect(response.body).toHaveProperty('state_id', 3);
    
    // Verify city was actually created
    const allCities = await request(app).get('/cities');
    expect(allCities.body.length).toBe(5);
    
    const hyderabad = allCities.body.find(city => city.name === 'Hyderabad');
    expect(hyderabad).toBeDefined();
    expect(hyderabad.state_name).toBe('Karnataka');
  });
  
  // Test POST city - missing required fields
  test('POST /cities - should return 400 for missing name', async () => {
    const incompleteCity = {
      state_id: 1
      // Missing name
    };
    
    const response = await request(app)
      .post('/cities')
      .send(incompleteCity);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'City name is required');
  });
  
  // Test POST city - missing state_id
  test('POST /cities - should return 400 for missing state_id', async () => {
    const incompleteCity = {
      name: 'Hyderabad'
      // Missing state_id
    };
    
    const response = await request(app)
      .post('/cities')
      .send(incompleteCity);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'State ID is required');
  });
  
  // Test POST city - non-existent state
  test('POST /cities - should return 404 for non-existent state', async () => {
    const invalidCity = {
      name: 'Hyderabad',
      state_id: 999
    };
    
    const response = await request(app)
      .post('/cities')
      .send(invalidCity);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'State not found');
  });
  
  // Test PUT update city
  test('PUT /cities/:id - should update a city', async () => {
    const updatedData = {
      name: 'Mumbai City',
      state_id: 1
    };
    
    const response = await request(app)
      .put('/cities/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'Mumbai City');
    expect(response.body).toHaveProperty('state_id', 1);
    
    // Verify city was actually updated
    const updatedCity = await request(app).get('/cities/1');
    expect(updatedCity.body.name).toBe('Mumbai City');
  });
  
  // Test PUT city - missing required fields
  test('PUT /cities/:id - should return 400 for missing name', async () => {
    const incompleteCity = {
      state_id: 1
      // Missing name
    };
    
    const response = await request(app)
      .put('/cities/1')
      .send(incompleteCity);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'City name is required');
  });
  
  // Test PUT city - non-existent state
  test('PUT /cities/:id - should return 404 for non-existent state', async () => {
    const invalidCity = {
      name: 'Mumbai City',
      state_id: 999
    };
    
    const response = await request(app)
      .put('/cities/1')
      .send(invalidCity);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'State not found');
  });
  
  // Test PUT city - not found
  test('PUT /cities/:id - should return 404 for non-existent city', async () => {
    const updatedData = {
      name: 'Non-existent City',
      state_id: 1
    };
    
    const response = await request(app)
      .put('/cities/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'City not found');
  });
  
  // Test DELETE city
  test('DELETE /cities/:id - should delete a city', async () => {
    // First try to delete city with no associations
    const response = await request(app).delete('/cities/2'); // Pune
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'City deleted successfully');
    
    // Verify city was actually deleted
    const deletedCity = await request(app).get('/cities/2');
    expect(deletedCity.status).toBe(404);
    
    const allCities = await request(app).get('/cities');
    expect(allCities.body.length).toBe(3);
  });
  
  // Test DELETE city - with associations
  test('DELETE /cities/:id - should return 400 for city with user associations', async () => {
    const response = await request(app).delete('/cities/1'); // Mumbai - has a user
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete city because it has associated users. Update the users first.');
  });
  
  // Test DELETE city - not found
  test('DELETE /cities/:id - should return 404 for non-existent city', async () => {
    const response = await request(app).delete('/cities/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'City not found');
  });
  
  // Test search cities by name
  test('GET /cities/search/:name - should search cities by name', async () => {
    const response = await request(app).get('/cities/search/mu');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('name', 'Mumbai');
    
    // Search for multiple results
    const multiResponse = await request(app).get('/cities/search/u');
    expect(multiResponse.status).toBe(200);
    expect(multiResponse.body.length).toBeGreaterThan(1);
    
    // Search with no results
    const emptyResponse = await request(app).get('/cities/search/nonexistent');
    expect(emptyResponse.status).toBe(200);
    expect(emptyResponse.body.length).toBe(0);
  });
});
