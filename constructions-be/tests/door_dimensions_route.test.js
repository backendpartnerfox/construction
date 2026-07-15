// tests/door_dimensions_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS door_dimensions (
      dimension_id SERIAL PRIMARY KEY,
      width DECIMAL(10,2) NOT NULL,
      height DECIMAL(10,2) NOT NULL,
      thickness DECIMAL(10,2) NOT NULL,
      description TEXT,
      is_standard BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS door_dimensions');
  await pool.end();
});

beforeEach(async () => {
  // Clear table before each test
  await pool.query('DELETE FROM door_dimensions');
  
  // Insert test data
  await pool.query(`
    INSERT INTO door_dimensions (dimension_id, width, height, thickness, description, is_standard, is_active)
    VALUES 
      (1, 32.00, 80.00, 1.75, 'Standard interior door', TRUE, TRUE),
      (2, 36.00, 80.00, 1.75, 'Standard exterior door', TRUE, TRUE),
      (3, 30.00, 78.00, 1.50, 'Custom bathroom door', FALSE, TRUE),
      (4, 48.00, 96.00, 2.00, 'Double door', TRUE, FALSE)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('door_dimensions_dimension_id_seq', 4)");
});

describe('Door Dimensions API', () => {
  // Test GET all door dimensions
  test('GET /door-dimensions - should return all dimensions', async () => {
    const response = await request(app).get('/door-dimensions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('dimension_id', 1);
    expect(response.body[1]).toHaveProperty('dimension_id', 2);
    expect(response.body[0]).toHaveProperty('width', '32.00');
    expect(response.body[1]).toHaveProperty('width', '36.00');
  });
  
  // Test GET door dimension by ID
  test('GET /door-dimensions/:id - should return a specific dimension', async () => {
    const response = await request(app).get('/door-dimensions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dimension_id', 1);
    expect(response.body).toHaveProperty('width', '32.00');
    expect(response.body).toHaveProperty('height', '80.00');
    expect(response.body).toHaveProperty('thickness', '1.75');
    expect(response.body).toHaveProperty('description', 'Standard interior door');
    expect(response.body).toHaveProperty('is_standard', true);
  });
  
  // Test GET door dimension by ID - not found
  test('GET /door-dimensions/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).get('/door-dimensions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door dimension not found');
  });
  
  // Test POST new door dimension
  test('POST /door-dimensions - should create a new dimension', async () => {
    const newDimension = {
      width: 40.00,
      height: 84.00,
      thickness: 2.00,
      description: 'Large custom door',
      is_standard: false,
      is_active: true
    };
    
    const response = await request(app)
      .post('/door-dimensions')
      .send(newDimension);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('dimension_id', 5);
    expect(response.body).toHaveProperty('width', '40.00');
    expect(response.body).toHaveProperty('height', '84.00');
    expect(response.body).toHaveProperty('thickness', '2.00');
    
    // Verify dimension was actually created
    const allDimensions = await request(app).get('/door-dimensions');
    expect(allDimensions.body.length).toBe(5);
  });
  
  // Test POST door dimension - missing required fields
  test('POST /door-dimensions - should return 400 for missing required fields', async () => {
    const incompleteDimension = {
      width: 40.00,
      // Missing height and thickness
      description: 'Incomplete dimension'
    };
    
    const response = await request(app)
      .post('/door-dimensions')
      .send(incompleteDimension);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });
  
  // Test PUT update door dimension
  test('PUT /door-dimensions/:id - should update a dimension', async () => {
    const updatedData = {
      width: 34.00,
      height: 82.00,
      thickness: 1.75,
      description: 'Updated interior door',
      is_standard: true,
      is_active: true
    };
    
    const response = await request(app)
      .put('/door-dimensions/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dimension_id', 1);
    expect(response.body).toHaveProperty('width', '34.00');
    expect(response.body).toHaveProperty('height', '82.00');
    expect(response.body).toHaveProperty('description', 'Updated interior door');
    
    // Verify dimension was actually updated
    const updatedDimension = await request(app).get('/door-dimensions/1');
    expect(updatedDimension.body.width).toBe('34.00');
    expect(updatedDimension.body.description).toBe('Updated interior door');
  });
  
  // Test PUT update door dimension - not found
  test('PUT /door-dimensions/:id - should return 404 for non-existent ID', async () => {
    const updatedData = {
      width: 34.00,
      height: 82.00,
      thickness: 1.75,
      description: 'Non-existent dimension',
      is_standard: true,
      is_active: true
    };
    
    const response = await request(app)
      .put('/door-dimensions/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door dimension not found');
  });
  
  // Test DELETE door dimension
  test('DELETE /door-dimensions/:id - should delete a dimension', async () => {
    const response = await request(app).delete('/door-dimensions/1');
    
    expect(response.status).toBe(204);
    
    // Verify dimension was actually deleted
    const deletedDimension = await request(app).get('/door-dimensions/1');
    expect(deletedDimension.status).toBe(404);
    
    const allDimensions = await request(app).get('/door-dimensions');
    expect(allDimensions.body.length).toBe(3);
  });
  
  // Test DELETE door dimension - not found
  test('DELETE /door-dimensions/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).delete('/door-dimensions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door dimension not found');
  });
  
  // Test GET standard door dimensions
  test('GET /door-dimensions/standard - should return only standard dimensions', async () => {
    const response = await request(app).get('/door-dimensions/standard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // 3 standard dimensions in test data
    expect(response.body.every(dim => dim.is_standard === true)).toBeTruthy();
  });
  
  // Test GET active door dimensions
  test('GET /door-dimensions/active - should return only active dimensions', async () => {
    const response = await request(app).get('/door-dimensions/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // 3 active dimensions in test data
    expect(response.body.every(dim => dim.is_active === true)).toBeTruthy();
    
    // Check inactive dimension is not included
    const inactiveDimIds = response.body.map(dim => dim.dimension_id);
    expect(inactiveDimIds).not.toContain(4);
  });
  
  // Test both standard and active filters combined
  test('Combination of standard and active filters works correctly', async () => {
    // First get standard dimensions
    const standardResponse = await request(app).get('/door-dimensions/standard');
    expect(standardResponse.body.length).toBe(3);
    
    // Then get active dimensions
    const activeResponse = await request(app).get('/door-dimensions/active');
    expect(activeResponse.body.length).toBe(3);
    
    // There should only be 2 dimensions that are both standard and active
    const standardAndActive = standardResponse.body
      .filter(dim => activeResponse.body.some(activeDim => activeDim.dimension_id === dim.dimension_id));
    expect(standardAndActive.length).toBe(2);
    
    // Those should be dimensions 1 and 2
    const ids = standardAndActive.map(dim => dim.dimension_id).sort();
    expect(ids).toEqual([1, 2]);
  });
});
