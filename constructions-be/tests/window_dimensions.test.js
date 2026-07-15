// tests/window_dimensions.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS window_dimensions (
      dimension_id SERIAL PRIMARY KEY,
      width NUMERIC(8,2) NOT NULL,
      height NUMERIC(8,2) NOT NULL,
      thickness NUMERIC(5,2) NOT NULL,
      description TEXT,
      window_type VARCHAR(50),
      is_standard BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE
    );
    
    CREATE TABLE IF NOT EXISTS windows (
      window_id SERIAL PRIMARY KEY,
      dimension_id INTEGER REFERENCES window_dimensions(dimension_id)
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS windows');
  await pool.query('DROP TABLE IF EXISTS window_dimensions');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM windows');
  await pool.query('DELETE FROM window_dimensions');
  
  // Insert test data
  await pool.query(`
    INSERT INTO window_dimensions (
      dimension_id, width, height, thickness, 
      description, window_type, is_standard, is_active
    )
    VALUES 
      (1, 120.00, 150.00, 7.50, 'Standard bedroom window', 'Sliding', true, true),
      (2, 180.00, 200.00, 8.00, 'Living room large window', 'Picture', true, true),
      (3, 60.00, 90.00, 6.00, 'Bathroom window', 'Casement', true, true),
      (4, 100.00, 120.00, 7.00, 'Custom size', 'Sliding', false, true),
      (5, 90.00, 90.00, 6.50, 'Square window', 'Awning', true, false)
  `);
  
  // Reference a window dimension in windows table to test foreign key constraints
  await pool.query(`
    INSERT INTO windows (window_id, dimension_id)
    VALUES (1, 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('window_dimensions_dimension_id_seq', 5)");
  await pool.query("SELECT setval('windows_window_id_seq', 1)");
});

describe('Window Dimensions API', () => {
  // Test GET all window dimensions
  test('GET /window-dimensions - should return all window dimensions', async () => {
    const response = await request(app).get('/window-dimensions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('dimension_id', 1);
    expect(response.body[0]).toHaveProperty('width', '120.00');
    expect(response.body[0]).toHaveProperty('height', '150.00');
    expect(response.body[1]).toHaveProperty('window_type', 'Picture');
  });
  
  // Test GET window dimension by ID
  test('GET /window-dimensions/:id - should return a specific window dimension', async () => {
    const response = await request(app).get('/window-dimensions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dimension_id', 1);
    expect(response.body).toHaveProperty('width', '120.00');
    expect(response.body).toHaveProperty('height', '150.00');
    expect(response.body).toHaveProperty('thickness', '7.50');
    expect(response.body).toHaveProperty('description', 'Standard bedroom window');
    expect(response.body).toHaveProperty('window_type', 'Sliding');
    expect(response.body).toHaveProperty('is_standard', true);
  });
  
  // Test GET window dimension by ID - not found
  test('GET /window-dimensions/:id - should return 404 for non-existent dimension', async () => {
    const response = await request(app).get('/window-dimensions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Window dimension not found');
  });
  
  // Test POST new window dimension
  test('POST /window-dimensions - should create a new window dimension', async () => {
    const newDimension = {
      width: 150.00,
      height: 120.00,
      thickness: 7.00,
      description: 'New test window',
      window_type: 'Double-hung',
      is_standard: true,
      is_active: true
    };
    
    const response = await request(app)
      .post('/window-dimensions')
      .send(newDimension);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('dimension_id', 6);
    expect(response.body).toHaveProperty('width', '150.00');
    expect(response.body).toHaveProperty('height', '120.00');
    expect(response.body).toHaveProperty('window_type', 'Double-hung');
    
    // Verify dimension was created
    const allDimensions = await request(app).get('/window-dimensions');
    expect(allDimensions.body.length).toBe(6);
  });
  
  // Test POST window dimension - missing required fields
  test('POST /window-dimensions - should return 400 for missing required fields', async () => {
    const incompleteDimension = {
      width: 100.00,
      height: 100.00
      // Missing thickness which is required
    };
    
    const response = await request(app)
      .post('/window-dimensions')
      .send(incompleteDimension);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Width, height, and thickness are required');
  });
  
  // Test PUT update window dimension
  test('PUT /window-dimensions/:id - should update an existing window dimension', async () => {
    const updatedData = {
      width: 125.00,
      height: 155.00,
      thickness: 8.00,
      description: 'Updated bedroom window',
      window_type: 'Sliding',
      is_standard: true,
      is_active: true
    };
    
    const response = await request(app)
      .put('/window-dimensions/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dimension_id', 1);
    expect(response.body).toHaveProperty('width', '125.00');
    expect(response.body).toHaveProperty('height', '155.00');
    expect(response.body).toHaveProperty('description', 'Updated bedroom window');
    
    // Verify dimension was updated
    const dimension = await request(app).get('/window-dimensions/1');
    expect(dimension.body.width).toBe('125.00');
    expect(dimension.body.height).toBe('155.00');
  });
  
  // Test PUT window dimension - not found
  test('PUT /window-dimensions/:id - should return 404 for non-existent dimension', async () => {
    const updatedData = {
      width: 100.00,
      height: 100.00,
      thickness: 6.00
    };
    
    const response = await request(app)
      .put('/window-dimensions/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Window dimension not found');
  });
  
  // Test DELETE window dimension
  test('DELETE /window-dimensions/:id - should delete a window dimension with no references', async () => {
    const response = await request(app).delete('/window-dimensions/2');
    
    expect(response.status).toBe(204);
    
    // Verify dimension was deleted
    const checkResponse = await request(app).get('/window-dimensions/2');
    expect(checkResponse.status).toBe(404);
    
    const allDimensions = await request(app).get('/window-dimensions');
    expect(allDimensions.body.length).toBe(4);
  });
  
  // Test DELETE window dimension with references
  test('DELETE /window-dimensions/:id - should return 400 for dimension with references', async () => {
    const response = await request(app).delete('/window-dimensions/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete. Window dimension is referenced by existing windows.');
  });
  
  // Test DELETE window dimension - not found
  test('DELETE /window-dimensions/:id - should return 404 for non-existent dimension', async () => {
    const response = await request(app).delete('/window-dimensions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Window dimension not found');
  });
  
  // Test GET standard window dimensions
  test('GET /window-dimensions/standard - should return all standard and active dimensions', async () => {
    const response = await request(app).get('/window-dimensions/standard');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // Only standard AND active dimensions
    expect(response.body.every(dim => dim.is_standard === true && dim.is_active === true)).toBeTruthy();
  });
  
  // Test GET window dimensions by type
  test('GET /window-dimensions/type/:windowType - should return dimensions of a specific type', async () => {
    const response = await request(app).get('/window-dimensions/type/Sliding');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(dim => dim.window_type === 'Sliding')).toBeTruthy();
  });
});
