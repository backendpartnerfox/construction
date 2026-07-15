// tests/element_item_mapping_route.test.js
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
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_category VARCHAR(50),
      item_unit VARCHAR(20)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS element_item_mapping (
      mapping_id SERIAL PRIMARY KEY,
      element_id INTEGER REFERENCES elements(element_id),
      item_id INTEGER REFERENCES items(item_id),
      is_required BOOLEAN DEFAULT false
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS element_item_mapping');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM element_item_mapping');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM elements');
  
  // Insert test data
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category, element_description)
    VALUES 
      (1, 'Column', 'Structural', 'Vertical structural element'),
      (2, 'Beam', 'Structural', 'Horizontal structural element'),
      (3, 'Slab', 'Structural', 'Horizontal flat surface element')
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_description, item_category, item_unit)
    VALUES 
      (1, 'Concrete', 'Ready-mix concrete', 'Material', 'cubic meter'),
      (2, 'Steel Bar', 'Reinforcement steel bars', 'Material', 'kg'),
      (3, 'Formwork', 'Wooden formwork', 'Material', 'square meter'),
      (4, 'Paint', 'Exterior paint', 'Finishing', 'liter')
  `);
  
  await pool.query(`
    INSERT INTO element_item_mapping (mapping_id, element_id, item_id, is_required)
    VALUES 
      (1, 1, 1, true), -- Column requires Concrete
      (2, 1, 2, true), -- Column requires Steel Bar
      (3, 1, 3, true), -- Column requires Formwork
      (4, 2, 1, true), -- Beam requires Concrete
      (5, 2, 2, true), -- Beam requires Steel Bar
      (6, 3, 1, true), -- Slab requires Concrete
      (7, 3, 4, false) -- Slab optionally uses Paint
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('items_item_id_seq', 4)");
  await pool.query("SELECT setval('element_item_mapping_mapping_id_seq', 7)");
});

describe('Element-Item Mapping API', () => {
  // Test GET all mappings
  test('GET /mappings - should return all mappings', async () => {
    const response = await request(app).get('/mappings');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(7);
    expect(response.body[0]).toHaveProperty('mapping_id', 1);
    expect(response.body[0]).toHaveProperty('element_id', 1);
    expect(response.body[0]).toHaveProperty('item_id', 1);
    expect(response.body[0]).toHaveProperty('is_required', true);
  });
  
  // Test GET mapping by ID
  test('GET /mappings/:id - should return a specific mapping', async () => {
    const response = await request(app).get('/mappings/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('mapping_id', 1);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('is_required', true);
  });
  
  // Test GET mapping by ID - not found
  test('GET /mappings/:id - should return 404 for non-existent mapping', async () => {
    const response = await request(app).get('/mappings/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Mapping not found');
  });
  
  // Test POST new mapping
  test('POST /mappings - should create a new mapping', async () => {
    const newMapping = {
      element_id: 2,
      item_id: 4,
      is_required: false
    };
    
    const response = await request(app)
      .post('/mappings')
      .send(newMapping);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('mapping_id', 8);
    expect(response.body).toHaveProperty('element_id', 2);
    expect(response.body).toHaveProperty('item_id', 4);
    expect(response.body).toHaveProperty('is_required', false);
    
    // Verify mapping was actually created
    const allMappings = await request(app).get('/mappings');
    expect(allMappings.body.length).toBe(8);
  });
  
  // Test POST mapping - missing required fields
  test('POST /mappings - should return 400 for missing element_id', async () => {
    const incompleteMapping = {
      item_id: 1,
      is_required: true
      // Missing element_id
    };
    
    const response = await request(app)
      .post('/mappings')
      .send(incompleteMapping);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Element ID and Item ID are required');
  });
  
  // Test POST mapping - missing item_id
  test('POST /mappings - should return 400 for missing item_id', async () => {
    const incompleteMapping = {
      element_id: 1,
      is_required: true
      // Missing item_id
    };
    
    const response = await request(app)
      .post('/mappings')
      .send(incompleteMapping);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Element ID and Item ID are required');
  });
  
  // Test POST mapping - non-existent element/item
  test('POST /mappings - should return 400 for non-existent element', async () => {
    const invalidMapping = {
      element_id: 999, // Non-existent element
      item_id: 1,
      is_required: true
    };
    
    const response = await request(app)
      .post('/mappings')
      .send(invalidMapping);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid element_id or item_id. Make sure both referenced IDs exist.');
  });
  
  // Test PUT update mapping
  test('PUT /mappings/:id - should update a mapping', async () => {
    const updatedMapping = {
      element_id: 1,
      item_id: 1,
      is_required: false // Change from true to false
    };
    
    const response = await request(app)
      .put('/mappings/1')
      .send(updatedMapping);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('mapping_id', 1);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('is_required', false);
    
    // Verify mapping was actually updated
    const updatedMappingResponse = await request(app).get('/mappings/1');
    expect(updatedMappingResponse.body.is_required).toBe(false);
  });
  
  // Test PUT mapping - not found
  test('PUT /mappings/:id - should return 404 for non-existent mapping', async () => {
    const updatedMapping = {
      element_id: 1,
      item_id: 1,
      is_required: false
    };
    
    const response = await request(app)
      .put('/mappings/999')
      .send(updatedMapping);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Mapping not found');
  });
  
  // Test PUT mapping - missing required fields
  test('PUT /mappings/:id - should return 400 for missing fields', async () => {
    const incompleteMapping = {
      element_id: 1
      // Missing item_id
    };
    
    const response = await request(app)
      .put('/mappings/1')
      .send(incompleteMapping);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Element ID and Item ID are required');
  });
  
  // Test DELETE mapping
  test('DELETE /mappings/:id - should delete a mapping', async () => {
    const response = await request(app).delete('/mappings/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Mapping deleted successfully');
    
    // Verify mapping was actually deleted
    const deletedMapping = await request(app).get('/mappings/1');
    expect(deletedMapping.status).toBe(404);
    
    const allMappings = await request(app).get('/mappings');
    expect(allMappings.body.length).toBe(6);
  });
  
  // Test DELETE mapping - not found
  test('DELETE /mappings/:id - should return 404 for non-existent mapping', async () => {
    const response = await request(app).delete('/mappings/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Mapping not found');
  });
  
  // Test GET mappings by element
  test('GET /mappings/element/:elementId - should return mappings for a specific element', async () => {
    const response = await request(app).get('/mappings/element/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body.every(mapping => mapping.element_id === 1)).toBeTruthy();
    
    // Check specific items mapped to this element
    const itemIds = response.body.map(mapping => mapping.item_id).sort();
    expect(itemIds).toEqual([1, 2, 3]);
  });
  
  // Test GET mappings by item
  test('GET /mappings/item/:itemId - should return mappings for a specific item', async () => {
    const response = await request(app).get('/mappings/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body.every(mapping => mapping.item_id === 1)).toBeTruthy();
    
    // Check specific elements mapped to this item
    const elementIds = response.body.map(mapping => mapping.element_id).sort();
    expect(elementIds).toEqual([1, 2, 3]);
  });
  
  // Test GET detailed item information for element
  test('GET /mappings/element/:elementId/details - should return detailed item info for element', async () => {
    const response = await request(app).get('/mappings/element/1/details');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body.every(mapping => mapping.element_id === 1)).toBeTruthy();
    
    // Check that item details are included
    expect(response.body[0]).toHaveProperty('item_name');
    expect(response.body[0]).toHaveProperty('item_description');
    expect(response.body[0]).toHaveProperty('item_category');
    expect(response.body[0]).toHaveProperty('item_unit');
    
    // Check specific item names
    const itemNames = response.body.map(mapping => mapping.item_name).sort();
    expect(itemNames).toEqual(['Concrete', 'Formwork', 'Steel Bar']);
  });
  
  // Test GET detailed element information for item
  test('GET /mappings/item/:itemId/details - should return detailed element info for item', async () => {
    const response = await request(app).get('/mappings/item/1/details');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body.every(mapping => mapping.item_id === 1)).toBeTruthy();
    
    // Check that element details are included
    expect(response.body[0]).toHaveProperty('element_name');
    expect(response.body[0]).toHaveProperty('element_category');
    expect(response.body[0]).toHaveProperty('element_description');
    
    // Check specific element names
    const elementNames = response.body.map(mapping => mapping.element_name).sort();
    expect(elementNames).toEqual(['Beam', 'Column', 'Slab']);
  });
  
  // Test GET required mappings
  test('GET /mappings/required - should return only required mappings', async () => {
    const response = await request(app).get('/mappings/required');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(6); // 6 required mappings in test data
    expect(response.body.every(mapping => mapping.is_required === true)).toBeTruthy();
    
    // Verify the non-required mapping is not included
    const mappingIds = response.body.map(mapping => mapping.mapping_id);
    expect(mappingIds).not.toContain(7); // ID 7 is the non-required mapping
  });
});
