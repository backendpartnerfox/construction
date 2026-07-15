// tests/items_route.test.js
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
      item_unit VARCHAR(20),
      item_category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items');
  
  // Insert test data
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_description, item_unit, item_category, is_active)
    VALUES 
      (1, 'TMT Bar', 'Thermo-Mechanically Treated reinforcement steel bars', 'kg', 'Structural', true),
      (2, 'RMC', 'Ready Mix Concrete', 'cum', 'Concrete', true),
      (3, 'Brick', 'Standard clay bricks for construction', 'pcs', 'Masonry', true),
      (4, 'Cement', 'Portland cement for construction', 'bag', 'Binding Material', true),
      (5, 'Sand', 'Fine aggregate for concrete and mortar', 'cum', 'Aggregate', false)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('items_item_id_seq', 5)");
});

describe('Items API', () => {
  // Test GET all items
  test('GET /items - should return all items', async () => {
    const response = await request(app).get('/items');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('item_id');
    expect(response.body[0]).toHaveProperty('item_name');
    expect(response.body[0]).toHaveProperty('item_category');
    expect(response.body[0]).toHaveProperty('is_active');
  });
  
  // Test GET item by ID
  test('GET /items/:id - should return a specific item', async () => {
    const response = await request(app).get('/items/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('item_name', 'TMT Bar');
    expect(response.body).toHaveProperty('item_description', 'Thermo-Mechanically Treated reinforcement steel bars');
    expect(response.body).toHaveProperty('item_unit', 'kg');
    expect(response.body).toHaveProperty('item_category', 'Structural');
    expect(response.body).toHaveProperty('is_active', true);
  });
  
  // Test GET item by ID - not found
  test('GET /items/:id - should return 404 for non-existent item', async () => {
    const response = await request(app).get('/items/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });
  
  // Test POST new item
  test('POST /items - should create a new item', async () => {
    const newItem = {
      item_name: 'Aggregate',
      item_description: 'Coarse stone aggregate for concrete',
      item_unit: 'cum',
      item_category: 'Aggregate',
      is_active: true
    };
    
    const response = await request(app)
      .post('/items')
      .send(newItem);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('item_id', 6);
    expect(response.body).toHaveProperty('item_name', 'Aggregate');
    expect(response.body).toHaveProperty('item_description', 'Coarse stone aggregate for concrete');
    expect(response.body).toHaveProperty('item_unit', 'cum');
    expect(response.body).toHaveProperty('item_category', 'Aggregate');
    expect(response.body).toHaveProperty('is_active', true);
    
    // Verify item was actually created
    const allItems = await request(app).get('/items');
    expect(allItems.body.length).toBe(6);
  });
  
  // Test POST item - missing required field
  test('POST /items - should return 400 for missing item name', async () => {
    const incompleteItem = {
      item_description: 'Some description',
      item_unit: 'kg'
    };
    
    const response = await request(app)
      .post('/items')
      .send(incompleteItem);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item name is required');
  });
  
  // Test PUT update item
  test('PUT /items/:id - should update an item', async () => {
    const updatedData = {
      item_name: 'TMT Steel Bar',
      item_description: 'Updated TMT steel reinforcement bars',
      item_unit: 'kg',
      item_category: 'Steel',
      is_active: true
    };
    
    const response = await request(app)
      .put('/items/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('item_name', 'TMT Steel Bar');
    expect(response.body).toHaveProperty('item_description', 'Updated TMT steel reinforcement bars');
    expect(response.body).toHaveProperty('item_category', 'Steel');
  });
  
  // Test PUT item - not found
  test('PUT /items/:id - should return 404 for non-existent item', async () => {
    const updatedData = {
      item_name: 'Non-existent Item'
    };
    
    const response = await request(app)
      .put('/items/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });
  
  // Test DELETE item
  test('DELETE /items/:id - should delete an item', async () => {
    const response = await request(app).delete('/items/5');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Item deleted successfully');
    
    // Verify item was actually deleted
    const deletedItem = await request(app).get('/items/5');
    expect(deletedItem.status).toBe(404);
    
    const allItems = await request(app).get('/items');
    expect(allItems.body.length).toBe(4);
  });
  
  // Test GET items by category
  test('GET /items/category/:category - should return items of specific category', async () => {
    const response = await request(app).get('/items/category/Aggregate');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('item_category', 'Aggregate');
    expect(response.body[0]).toHaveProperty('item_name', 'Sand');
  });
  
  // Test GET active items
  test('GET /items/active - should return only active items', async () => {
    const response = await request(app).get('/items/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    response.body.forEach(item => {
      expect(item.is_active).toBe(true);
    });
    
    // Verify inactive item is not included
    const itemNames = response.body.map(item => item.item_name);
    expect(itemNames).not.toContain('Sand');
  });
  
  // Test search items
  test('GET /items/search - should search items by name or description', async () => {
    const response = await request(app).get('/items/search?query=concrete');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    
    // Should find both RMC and Sand (which mentions concrete in description)
    const itemNames = response.body.map(item => item.item_name);
    expect(itemNames).toContain('RMC');
    expect(itemNames).toContain('Sand');
  });
  
  // Test search items - missing query
  test('GET /items/search - should return 400 for missing query', async () => {
    const response = await request(app).get('/items/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
});
