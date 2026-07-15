// tests/item_specification_types_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
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
    CREATE TABLE IF NOT EXISTS item_specification_types (
      item_id INTEGER PRIMARY KEY REFERENCES items(item_id),
      has_client_choice BOOLEAN DEFAULT FALSE,
      has_client_selection BOOLEAN DEFAULT FALSE,
      has_predefined_specs BOOLEAN DEFAULT FALSE,
      has_arch_inputs BOOLEAN DEFAULT FALSE,
      has_standards BOOLEAN DEFAULT FALSE,
      has_vendor_pricing BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS item_specification_types');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM item_specification_types');
  await pool.query('DELETE FROM items');
  
  // Insert test data
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category, item_unit)
    VALUES 
      (1, 'Paint', 'Finishing', 'liter'),
      (2, 'Floor Tile', 'Flooring', 'square meter'),
      (3, 'Door Handle', 'Hardware', 'piece'),
      (4, 'Window', 'Fenestration', 'piece'),
      (5, 'RMC', 'Structure', 'cubic meter')
  `);
  
  await pool.query(`
    INSERT INTO item_specification_types (
      item_id, has_client_choice, has_client_selection, has_predefined_specs,
      has_arch_inputs, has_standards, has_vendor_pricing
    )
    VALUES 
      (1, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE),
      (2, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE),
      (3, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE),
      (4, FALSE, FALSE, TRUE, TRUE, TRUE, FALSE)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('items_item_id_seq', 5)");
});

describe('Item Specification Types API', () => {
  // Test GET all item specification types
  test('GET /item-specification-types - should return all item specification types', async () => {
    const response = await request(app).get('/item-specification-types');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('item_id', 1);
    expect(response.body[0]).toHaveProperty('has_client_choice', true);
    expect(response.body[0]).toHaveProperty('has_client_selection', true);
    expect(response.body[1]).toHaveProperty('item_id', 2);
    expect(response.body[1]).toHaveProperty('has_predefined_specs', true);
  });
  
  // Test GET item specification type by item ID
  test('GET /item-specification-types/:itemId - should return specification type for a specific item', async () => {
    const response = await request(app).get('/item-specification-types/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('has_client_choice', true);
    expect(response.body).toHaveProperty('has_client_selection', true);
    expect(response.body).toHaveProperty('has_predefined_specs', false);
    expect(response.body).toHaveProperty('has_standards', true);
    expect(response.body).toHaveProperty('has_vendor_pricing', true);
  });
  
  // Test GET item specification type by item ID - not found
  test('GET /item-specification-types/:itemId - should return 404 for non-existent item ID', async () => {
    const response = await request(app).get('/item-specification-types/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item specification type not found');
  });
  
  // Test POST new item specification type
  test('POST /item-specification-types - should create a new item specification type', async () => {
    const newItemSpecType = {
      item_id: 5,
      has_client_choice: false,
      has_client_selection: false,
      has_predefined_specs: true,
      has_arch_inputs: true,
      has_standards: true,
      has_vendor_pricing: true
    };
    
    const response = await request(app)
      .post('/item-specification-types')
      .send(newItemSpecType);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('item_id', 5);
    expect(response.body).toHaveProperty('has_predefined_specs', true);
    expect(response.body).toHaveProperty('has_arch_inputs', true);
    expect(response.body).toHaveProperty('has_standards', true);
    expect(response.body).toHaveProperty('has_vendor_pricing', true);
    
    // Verify item specification type was actually created
    const allItemSpecTypes = await request(app).get('/item-specification-types');
    expect(allItemSpecTypes.body.length).toBe(5);
    
    const createdType = await request(app).get('/item-specification-types/5');
    expect(createdType.body).toHaveProperty('has_predefined_specs', true);
  });
  
  // Test POST item specification type - missing required fields
  test('POST /item-specification-types - should return 400 for missing item_id', async () => {
    const incompleteType = {
      // Missing item_id which is required
      has_client_choice: true,
      has_predefined_specs: true
    };
    
    const response = await request(app)
      .post('/item-specification-types')
      .send(incompleteType);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item ID is required');
  });
  
  // Test POST item specification type - already exists
  test('POST /item-specification-types - should return 409 for item ID that already has a specification type', async () => {
    const duplicateType = {
      item_id: 1, // Already exists in test data
      has_client_choice: false,
      has_predefined_specs: true
    };
    
    const response = await request(app)
      .post('/item-specification-types')
      .send(duplicateType);
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', 'Item specification type already exists for this item ID');
  });
  
  // Test PUT update item specification type
  test('PUT /item-specification-types/:itemId - should update a specification type', async () => {
    const updatedData = {
      has_client_choice: false,
      has_client_selection: false,
      has_predefined_specs: true,
      has_arch_inputs: true,
      has_standards: false,
      has_vendor_pricing: true
    };
    
    const response = await request(app)
      .put('/item-specification-types/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('has_client_choice', false);
    expect(response.body).toHaveProperty('has_client_selection', false);
    expect(response.body).toHaveProperty('has_predefined_specs', true);
    expect(response.body).toHaveProperty('has_arch_inputs', true);
    expect(response.body).toHaveProperty('has_standards', false);
    
    // Verify specification type was actually updated
    const updatedType = await request(app).get('/item-specification-types/1');
    expect(updatedType.body.has_client_choice).toBe(false);
    expect(updatedType.body.has_predefined_specs).toBe(true);
    expect(updatedType.body.has_arch_inputs).toBe(true);
  });
  
  // Test PUT item specification type - not found
  test('PUT /item-specification-types/:itemId - should return 404 for non-existent item ID', async () => {
    const updatedData = {
      has_client_choice: true,
      has_predefined_specs: true
    };
    
    const response = await request(app)
      .put('/item-specification-types/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item specification type not found');
  });
  
  // Test DELETE item specification type
  test('DELETE /item-specification-types/:itemId - should delete a specification type', async () => {
    const response = await request(app).delete('/item-specification-types/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Item specification type deleted successfully');
    
    // Verify specification type was actually deleted
    const deletedType = await request(app).get('/item-specification-types/1');
    expect(deletedType.status).toBe(404);
    
    const allItemSpecTypes = await request(app).get('/item-specification-types');
    expect(allItemSpecTypes.body.length).toBe(3);
  });
  
  // Test DELETE item specification type - not found
  test('DELETE /item-specification-types/:itemId - should return 404 for non-existent item ID', async () => {
    const response = await request(app).delete('/item-specification-types/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item specification type not found');
  });
  
  // Test GET items with client choice
  test('GET /item-specification-types/with-client-choice - should return items with client choice', async () => {
    const response = await request(app).get('/item-specification-types/with-client-choice');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // 3 items with client choice in test data
    expect(response.body.every(type => type.has_client_choice === true)).toBeTruthy();
    
    // Check specific item IDs
    const itemIds = response.body.map(type => type.item_id).sort();
    expect(itemIds).toEqual([1, 2, 3]);
  });
  
  // Test GET items with client selection
  test('GET /item-specification-types/with-client-selection - should return items with client selection', async () => {
    const response = await request(app).get('/item-specification-types/with-client-selection');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // 2 items with client selection in test data
    expect(response.body.every(type => type.has_client_selection === true)).toBeTruthy();
    
    // Check specific item IDs
    const itemIds = response.body.map(type => type.item_id).sort();
    expect(itemIds).toEqual([1, 2]);
  });
  
  // Test GET items with predefined specs
  test('GET /item-specification-types/with-predefined-specs - should return items with predefined specs', async () => {
    const response = await request(app).get('/item-specification-types/with-predefined-specs');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // 3 items with predefined specs in test data
    expect(response.body.every(type => type.has_predefined_specs === true)).toBeTruthy();
    
    // Check specific item IDs
    const itemIds = response.body.map(type => type.item_id).sort();
    expect(itemIds).toEqual([2, 3, 4]);
  });
});
