// tests/items.test.js
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
      item_unit VARCHAR(50),
      item_category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.end();
});

beforeEach(async () => {
  // Clear table before each test
  await pool.query('DELETE FROM items');
  
  // Insert test data
  await pool.query(`
    INSERT INTO items (item_name, item_description, item_unit, item_category, is_active)
    VALUES 
      ('Test Item 1', 'Description 1', 'kg', 'Steel', true),
      ('Test Item 2', 'Description 2', 'm³', 'Concrete', true)
  `);
});

describe('Items API', () => {
  // Test GET all items
  test('GET /items - should return all items', async () => {
    const response = await request(app).get('/items');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('item_name', 'Test Item 1');
  });
  
  // Test GET item by ID
  test('GET /items/:id - should return a specific item', async () => {
    // First get all items to get a valid ID
    const allItems = await request(app).get('/items');
    const itemId = allItems.body[0].item_id;
    
    const response = await request(app).get(`/items/${itemId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_id', itemId);
    expect(response.body).toHaveProperty('item_name', 'Test Item 1');
  });
  
  // Test POST new item
  test('POST /items - should create a new item', async () => {
    const newItem = {
      item_name: 'New Test Item',
      item_description: 'New Description',
      item_unit: 'm',
      item_category: 'Length',
      is_active: true
    };
    
    const response = await request(app)
      .post('/items')
      .send(newItem);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('item_name', 'New Test Item');
    expect(response.body).toHaveProperty('item_id');
    
    // Verify item was actually created
    const allItems = await request(app).get('/items');
    expect(allItems.body.length).toBe(3);
  });
  
  // Test PUT update item
  test('PUT /items/:id - should update an item', async () => {
    // First get all items to get a valid ID
    const allItems = await request(app).get('/items');
    const itemId = allItems.body[0].item_id;
    
    const updatedData = {
      item_name: 'Updated Item',
      item_description: 'Updated Description',
      item_unit: 'kg',
      item_category: 'Steel',
      is_active: true
    };
    
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_name', 'Updated Item');
    expect(response.body).toHaveProperty('item_id', itemId);
    
    // Verify item was actually updated
    const updatedItem = await request(app).get(`/items/${itemId}`);
    expect(updatedItem.body.item_name).toBe('Updated Item');
  });
  
  // Test DELETE item
  test('DELETE /items/:id - should delete an item', async () => {
    // First get all items to get a valid ID
    const allItems = await request(app).get('/items');
    const itemId = allItems.body[0].item_id;
    
    const response = await request(app).delete(`/items/${itemId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Item deleted successfully');
    
    // Verify item was actually deleted
    const remainingItems = await request(app).get('/items');
    expect(remainingItems.body.length).toBe(1);
  });
});