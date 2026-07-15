// tests/elements_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS elements (
      element_id SERIAL PRIMARY KEY,
      element_name VARCHAR(100) NOT NULL,
      element_category VARCHAR(50),
      element_description TEXT
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.end();
});

beforeEach(async () => {
  // Clear table before each test
  await pool.query('DELETE FROM elements');
  
  // Insert test data
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category, element_description)
    VALUES 
      (1, 'Column', 'Structural', 'Vertical structural element'),
      (2, 'Beam', 'Structural', 'Horizontal structural element'),
      (3, 'Slab', 'Structural', 'Horizontal flat surface element')
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
});

describe('Elements API', () => {
  // Test GET all elements
  test('GET /elements - should return all elements', async () => {
    const response = await request(app).get('/elements');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('element_name', 'Column');
    expect(response.body[1]).toHaveProperty('element_name', 'Beam');
    expect(response.body[2]).toHaveProperty('element_name', 'Slab');
  });
  
  // Test GET element by ID
  test('GET /elements/:id - should return a specific element', async () => {
    const response = await request(app).get('/elements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('element_name', 'Column');
    expect(response.body).toHaveProperty('element_category', 'Structural');
    expect(response.body).toHaveProperty('element_description', 'Vertical structural element');
  });
  
  // Test GET element by ID - not found
  test('GET /elements/:id - should return 404 for non-existent element', async () => {
    const response = await request(app).get('/elements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Element not found');
  });
  
  // Test POST new element
  test('POST /elements - should create a new element', async () => {
    const newElement = {
      element_name: 'Foundation',
      element_category: 'Structural',
      element_description: 'Base structural element'
    };
    
    const response = await request(app)
      .post('/elements')
      .send(newElement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('element_id', 4);
    expect(response.body).toHaveProperty('element_name', 'Foundation');
    expect(response.body).toHaveProperty('element_category', 'Structural');
    expect(response.body).toHaveProperty('element_description', 'Base structural element');
    
    // Verify element was actually created
    const allElements = await request(app).get('/elements');
    expect(allElements.body.length).toBe(4);
  });
  
  // Test POST element - missing required field
  test('POST /elements - should return 400 for missing element_name', async () => {
    const incompleteElement = {
      element_category: 'Structural',
      element_description: 'Missing name element'
    };
    
    const response = await request(app)
      .post('/elements')
      .send(incompleteElement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Element name is required');
  });
  
  // Test PUT update element
  test('PUT /elements/:id - should update an element', async () => {
    const updatedData = {
      element_name: 'Updated Column',
      element_category: 'Structural',
      element_description: 'Updated description for column'
    };
    
    const response = await request(app)
      .put('/elements/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('element_name', 'Updated Column');
    expect(response.body).toHaveProperty('element_description', 'Updated description for column');
    
    // Verify element was actually updated
    const updatedElement = await request(app).get('/elements/1');
    expect(updatedElement.body.element_name).toBe('Updated Column');
  });
  
  // Test PUT element - missing required field
  test('PUT /elements/:id - should return 400 for missing element_name', async () => {
    const incompleteElement = {
      element_category: 'Structural',
      element_description: 'Updated description'
    };
    
    const response = await request(app)
      .put('/elements/1')
      .send(incompleteElement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Element name is required');
  });
  
  // Test PUT element - not found
  test('PUT /elements/:id - should return 404 for non-existent element', async () => {
    const updatedData = {
      element_name: 'Non-existent Element',
      element_category: 'Structural'
    };
    
    const response = await request(app)
      .put('/elements/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Element not found');
  });
  
  // Test DELETE element
  test('DELETE /elements/:id - should delete an element', async () => {
    const response = await request(app).delete('/elements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Element deleted successfully');
    
    // Verify element was actually deleted
    const deletedElement = await request(app).get('/elements/1');
    expect(deletedElement.status).toBe(404);
    
    const allElements = await request(app).get('/elements');
    expect(allElements.body.length).toBe(2);
  });
  
  // Test DELETE element - not found
  test('DELETE /elements/:id - should return 404 for non-existent element', async () => {
    const response = await request(app).delete('/elements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Element not found');
  });
  
  // Test GET elements by category
  test('GET /elements/category/:category - should return elements by category', async () => {
    // Insert an element with a different category
    await pool.query(`
      INSERT INTO elements (element_name, element_category, element_description)
      VALUES ('Window', 'Architectural', 'Window element')
    `);
    
    const response = await request(app).get('/elements/category/Structural');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('element_category', 'Structural');
    expect(response.body[1]).toHaveProperty('element_category', 'Structural');
    expect(response.body[2]).toHaveProperty('element_category', 'Structural');
    
    // Test with the other category
    const otherResponse = await request(app).get('/elements/category/Architectural');
    expect(otherResponse.status).toBe(200);
    expect(otherResponse.body.length).toBe(1);
    expect(otherResponse.body[0]).toHaveProperty('element_name', 'Window');
  });
  
  // Test GET elements - empty category
  test('GET /elements/category/:category - should return empty array for non-existent category', async () => {
    const response = await request(app).get('/elements/category/NonExistent');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  // Test search elements
  test('GET /elements/search/:term - should search elements by name or description', async () => {
    const response = await request(app).get('/elements/search/horizontal');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('element_name', 'Beam');
    expect(response.body[1]).toHaveProperty('element_name', 'Slab');
    
    // Search by name
    const nameSearch = await request(app).get('/elements/search/column');
    expect(nameSearch.status).toBe(200);
    expect(nameSearch.body.length).toBe(1);
    expect(nameSearch.body[0]).toHaveProperty('element_name', 'Column');
    
    // Search with no results
    const emptySearch = await request(app).get('/elements/search/nonexistent');
    expect(emptySearch.status).toBe(200);
    expect(emptySearch.body.length).toBe(0);
  });
});
