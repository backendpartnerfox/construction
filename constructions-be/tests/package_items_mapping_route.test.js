// tests/package_items_mapping_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      total_price_per_sqft NUMERIC NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      item_code VARCHAR(100),
      unit VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      id SERIAL PRIMARY KEY,
      choice_name VARCHAR(255) NOT NULL,
      item_id INTEGER REFERENCES items(id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS package_items_mapping (
      id SERIAL PRIMARY KEY,
      package_id INTEGER REFERENCES packages(id),
      item_id INTEGER REFERENCES items(id),
      item_choice_id INTEGER REFERENCES item_choices(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS package_items_mapping');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS packages');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM package_items_mapping');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM packages');
  
  // Insert test data
  await pool.query(`
    INSERT INTO packages (id, package_name, total_price_per_sqft)
    VALUES 
      (1, 'Basic Package', 1500.00),
      (2, 'Premium Package', 2500.00)
  `);
  
  await pool.query(`
    INSERT INTO items (id, item_name, item_code, unit)
    VALUES 
      (1, 'Cement', 'CEM001', 'bags'),
      (2, 'Steel', 'STL001', 'kg'),
      (3, 'Bricks', 'BRK001', 'nos')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (id, choice_name, item_id)
    VALUES 
      (1, 'Premium Cement', 1),
      (2, 'Standard Steel', 2),
      (3, 'Red Bricks', 3)
  `);
  
  await pool.query(`
    INSERT INTO package_items_mapping (id, package_id, item_id, item_choice_id)
    VALUES 
      (1, 1, 1, 1),
      (2, 1, 2, 2),
      (3, 2, 3, 3)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('packages_id_seq', 2)");
  await pool.query("SELECT setval('items_id_seq', 3)");
  await pool.query("SELECT setval('item_choices_id_seq', 3)");
  await pool.query("SELECT setval('package_items_mapping_id_seq', 3)");
});

describe('Package Items Mapping API', () => {
  // Test GET all mappings
  test('GET /package-items-mapping - should return all mappings with details', async () => {
    const response = await request(app).get('/package-items-mapping');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('package_id');
    expect(response.body[0]).toHaveProperty('item_id');
    expect(response.body[0]).toHaveProperty('item_choice_id');
    expect(response.body[0]).toHaveProperty('package_name');
    expect(response.body[0]).toHaveProperty('item_name');
    expect(response.body[0]).toHaveProperty('choice_name');
  });
  
  // Test GET mapping by ID
  test('GET /package-items-mapping/:id - should return a specific mapping', async () => {
    const response = await request(app).get('/package-items-mapping/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('package_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('item_choice_id', 1);
    expect(response.body).toHaveProperty('package_name', 'Basic Package');
    expect(response.body).toHaveProperty('item_name', 'Cement');
    expect(response.body).toHaveProperty('choice_name', 'Premium Cement');
  });
  
  // Test GET mapping by ID - not found
  test('GET /package-items-mapping/:id - should return 404 for non-existent mapping', async () => {
    const response = await request(app).get('/package-items-mapping/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package-item mapping not found');
  });
  
  // Test GET mappings by package ID
  test('GET /package-items-mapping/package/:packageId - should return mappings for a package', async () => {
    const response = await request(app).get('/package-items-mapping/package/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('package_id', 1);
    expect(response.body[1]).toHaveProperty('package_id', 1);
    
    // Check item names
    const itemNames = response.body.map(mapping => mapping.item_name);
    expect(itemNames).toContain('Cement');
    expect(itemNames).toContain('Steel');
  });
  
  // Test GET mappings by package ID - package not found
  test('GET /package-items-mapping/package/:packageId - should return 404 for non-existent package', async () => {
    const response = await request(app).get('/package-items-mapping/package/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package not found');
  });
  
  // Test POST new mapping
  test('POST /package-items-mapping - should create a new mapping', async () => {
    const newMapping = {
      package_id: 2,
      item_id: 1,
      item_choice_id: 1
    };
    
    const response = await request(app)
      .post('/package-items-mapping')
      .send(newMapping);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 4);
    expect(response.body).toHaveProperty('package_id', 2);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('item_choice_id', 1);
    
    // Verify mapping was actually created
    const allMappings = await request(app).get('/package-items-mapping');
    expect(allMappings.body.length).toBe(4);
  });
  
  // Test POST mapping - missing required fields
  test('POST /package-items-mapping - should return 400 for missing package_id', async () => {
    const incompleteMapping = {
      item_id: 1,
      item_choice_id: 1
      // Missing package_id
    };
    
    const response = await request(app)
      .post('/package-items-mapping')
      .send(incompleteMapping);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Package ID is required');
  });
  
  // Test POST mapping - non-existent package
  test('POST /package-items-mapping - should return 404 for non-existent package', async () => {
    const invalidMapping = {
      package_id: 999,
      item_id: 1,
      item_choice_id: 1
    };
    
    const response = await request(app)
      .post('/package-items-mapping')
      .send(invalidMapping);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package not found');
  });
  
  // Test POST mapping - non-existent item
  test('POST /package-items-mapping - should return 404 for non-existent item', async () => {
    const invalidMapping = {
      package_id: 1,
      item_id: 999,
      item_choice_id: 1
    };
    
    const response = await request(app)
      .post('/package-items-mapping')
      .send(invalidMapping);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });
  
  // Test POST mapping - non-existent item choice
  test('POST /package-items-mapping - should return 404 for non-existent item choice', async () => {
    const invalidMapping = {
      package_id: 1,
      item_id: 1,
      item_choice_id: 999
    };
    
    const response = await request(app)
      .post('/package-items-mapping')
      .send(invalidMapping);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice not found');
  });
  
  // Test POST mapping - duplicate mapping
  test('POST /package-items-mapping - should return 409 for duplicate mapping', async () => {
    const duplicateMapping = {
      package_id: 1,
      item_id: 1, // Already exists for package 1
      item_choice_id: 1
    };
    
    const response = await request(app)
      .post('/package-items-mapping')
      .send(duplicateMapping);
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', 'Mapping already exists for this package and item');
  });
  
  // Test PUT update mapping
  test('PUT /package-items-mapping/:id - should update a mapping', async () => {
    const updatedData = {
      package_id: 2,
      item_id: 2,
      item_choice_id: 2
    };
    
    const response = await request(app)
      .put('/package-items-mapping/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('package_id', 2);
    expect(response.body).toHaveProperty('item_id', 2);
    expect(response.body).toHaveProperty('item_choice_id', 2);
    
    // Verify mapping was actually updated
    const updatedMapping = await request(app).get('/package-items-mapping/1');
    expect(updatedMapping.body.package_id).toBe(2);
  });
  
  // Test PUT mapping - not found
  test('PUT /package-items-mapping/:id - should return 404 for non-existent mapping', async () => {
    const updatedData = {
      package_id: 1,
      item_id: 1,
      item_choice_id: 1
    };
    
    const response = await request(app)
      .put('/package-items-mapping/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package-item mapping not found');
  });
  
  // Test PUT mapping - would create duplicate
  test('PUT /package-items-mapping/:id - should return 409 for duplicate mapping', async () => {
    const updatedData = {
      package_id: 1,
      item_id: 2, // This combination already exists in mapping id 2
      item_choice_id: 2
    };
    
    const response = await request(app)
      .put('/package-items-mapping/1')
      .send(updatedData);
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', 'Another mapping already exists for this package and item');
  });
  
  // Test DELETE mapping
  test('DELETE /package-items-mapping/:id - should delete a mapping', async () => {
    const response = await request(app).delete('/package-items-mapping/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Package-item mapping deleted successfully');
    
    // Verify mapping was actually deleted
    const deletedMapping = await request(app).get('/package-items-mapping/1');
    expect(deletedMapping.status).toBe(404);
    
    const allMappings = await request(app).get('/package-items-mapping');
    expect(allMappings.body.length).toBe(2);
  });
  
  // Test DELETE mapping - not found
  test('DELETE /package-items-mapping/:id - should return 404 for non-existent mapping', async () => {
    const response = await request(app).delete('/package-items-mapping/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package-item mapping not found');
  });
  
  // Test DELETE mapping by package and item IDs
  test('DELETE /package-items-mapping/package/:packageId/item/:itemId - should delete mapping by package and item', async () => {
    const response = await request(app).delete('/package-items-mapping/package/1/item/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Package-item mapping deleted successfully');
    
    // Verify mapping was actually deleted
    const allMappings = await request(app).get('/package-items-mapping');
    expect(allMappings.body.length).toBe(2);
    
    // Verify the specific mapping is gone
    const remainingMappings = allMappings.body.filter(m => m.package_id === 1 && m.item_id === 1);
    expect(remainingMappings.length).toBe(0);
  });
  
  // Test DELETE mapping by package and item IDs - not found
  test('DELETE /package-items-mapping/package/:packageId/item/:itemId - should return 404 for non-existent mapping', async () => {
    const response = await request(app).delete('/package-items-mapping/package/999/item/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package-item mapping not found');
  });
});