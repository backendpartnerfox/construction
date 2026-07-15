// tests/item_choices_route.test.js
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
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES items(item_id),
      item_material_type VARCHAR(100),
      brand VARCHAR(100),
      series VARCHAR(100),
      sub_series VARCHAR(100),
      model VARCHAR(100),
      code VARCHAR(50),
      parent_choice_id INTEGER,
      display_name VARCHAR(200) NOT NULL,
      description TEXT,
      image_url TEXT,
      is_premium BOOLEAN DEFAULT FALSE,
      package DECIMAL(10,2) DEFAULT 0.00,
      is_default BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  
  // Insert test data
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category, item_unit)
    VALUES 
      (1, 'Paint', 'Finishing', 'liter'),
      (2, 'Floor Tile', 'Flooring', 'square meter'),
      (3, 'Door Handle', 'Hardware', 'piece')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (
      choice_option_id, item_id, item_material_type, brand, series, 
      display_name, description, is_premium, is_default, is_active
    )
    VALUES 
      (1, 1, 'Emulsion', 'Asian Paints', 'Royale', 'Asian Paints Royale White', 'Premium white emulsion paint', TRUE, TRUE, TRUE),
      (2, 1, 'Distemper', 'Berger', 'Basic', 'Berger Basic White', 'Basic white distemper paint', FALSE, FALSE, TRUE),
      (3, 2, 'Ceramic', 'Kajaria', 'Premium', 'Kajaria Premium Ceramic Tile', 'High quality ceramic floor tile', TRUE, TRUE, TRUE),
      (4, 3, 'Brass', 'Godrej', 'Luxury', 'Godrej Luxury Brass Handle', 'Luxury brass door handle', TRUE, FALSE, TRUE),
      (5, 3, 'Stainless Steel', 'Dorset', 'Regular', 'Dorset Regular SS Handle', 'Regular stainless steel door handle', FALSE, TRUE, FALSE)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('items_item_id_seq', 3)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 5)");
});

describe('Item Choices API', () => {
  // Test GET all item choices
  test('GET /item-choices - should return all item choices', async () => {
    const response = await request(app).get('/item-choices');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('choice_option_id', 1);
    expect(response.body[0]).toHaveProperty('display_name', 'Asian Paints Royale White');
    expect(response.body[1]).toHaveProperty('display_name', 'Berger Basic White');
  });
  
  // Test GET item choice by ID
  test('GET /item-choices/:id - should return a specific item choice', async () => {
    const response = await request(app).get('/item-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_option_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('brand', 'Asian Paints');
    expect(response.body).toHaveProperty('series', 'Royale');
    expect(response.body).toHaveProperty('display_name', 'Asian Paints Royale White');
    expect(response.body).toHaveProperty('is_premium', true);
    expect(response.body).toHaveProperty('is_default', true);
    expect(response.body).toHaveProperty('is_active', true);
  });
  
  // Test GET item choice by ID - not found
  test('GET /item-choices/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).get('/item-choices/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice not found');
  });
  
  // Test POST new item choice
  test('POST /item-choices - should create a new item choice', async () => {
    const newItemChoice = {
      item_id: 2,
      item_material_type: 'Vitrified',
      brand: 'Somany',
      series: 'Designer',
      sub_series: 'Modern',
      model: 'GC-301',
      code: 'SM-VT-301',
      display_name: 'Somany Designer Vitrified Tile',
      description: 'Modern designer vitrified floor tile',
      is_premium: true,
      package: 10.50,
      is_default: false,
      is_active: true
    };
    
    const response = await request(app)
      .post('/item-choices')
      .send(newItemChoice);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('choice_option_id', 6);
    expect(response.body).toHaveProperty('item_id', 2);
    expect(response.body).toHaveProperty('brand', 'Somany');
    expect(response.body).toHaveProperty('display_name', 'Somany Designer Vitrified Tile');
    expect(response.body).toHaveProperty('is_premium', true);
    expect(response.body).toHaveProperty('package', '10.50');
    
    // Verify item choice was actually created
    const allItemChoices = await request(app).get('/item-choices');
    expect(allItemChoices.body.length).toBe(6);
  });
  
  // Test POST item choice - missing required fields
  test('POST /item-choices - should return 400 for missing required fields', async () => {
    const incompleteItemChoice = {
      item_id: 2,
      // Missing display_name which is required
      brand: 'Somany',
      is_premium: true
    };
    
    const response = await request(app)
      .post('/item-choices')
      .send(incompleteItemChoice);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item ID and display name are required');
  });
  
  // Test PUT update item choice
  test('PUT /item-choices/:id - should update an item choice', async () => {
    const updatedData = {
      item_id: 1,
      item_material_type: 'Emulsion',
      brand: 'Asian Paints',
      series: 'Royale Luxury',
      display_name: 'Asian Paints Royale Luxury White',
      description: 'Ultra premium white emulsion paint',
      is_premium: true,
      package: 15.00,
      is_default: true,
      is_active: true
    };
    
    const response = await request(app)
      .put('/item-choices/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_option_id', 1);
    expect(response.body).toHaveProperty('series', 'Royale Luxury');
    expect(response.body).toHaveProperty('display_name', 'Asian Paints Royale Luxury White');
    expect(response.body).toHaveProperty('description', 'Ultra premium white emulsion paint');
    
    // Verify item choice was actually updated
    const updatedItemChoice = await request(app).get('/item-choices/1');
    expect(updatedItemChoice.body.display_name).toBe('Asian Paints Royale Luxury White');
    expect(updatedItemChoice.body.series).toBe('Royale Luxury');
    expect(updatedItemChoice.body.description).toBe('Ultra premium white emulsion paint');
  });
  
  // Test PUT item choice - not found
  test('PUT /item-choices/:id - should return 404 for non-existent ID', async () => {
    const updatedData = {
      item_id: 1,
      display_name: 'Non-existent Item Choice',
      is_premium: true
    };
    
    const response = await request(app)
      .put('/item-choices/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice not found');
  });
  
  // Test PUT item choice - missing required fields
  test('PUT /item-choices/:id - should return 400 for missing required fields', async () => {
    const incompleteData = {
      item_id: 1,
      // Missing display_name which is required
      is_premium: true
    };
    
    const response = await request(app)
      .put('/item-choices/1')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item ID and display name are required');
  });
  
  // Test DELETE item choice
  test('DELETE /item-choices/:id - should delete an item choice', async () => {
    const response = await request(app).delete('/item-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Item choice deleted successfully');
    
    // Verify item choice was actually deleted
    const deletedItemChoice = await request(app).get('/item-choices/1');
    expect(deletedItemChoice.status).toBe(404);
    
    const allItemChoices = await request(app).get('/item-choices');
    expect(allItemChoices.body.length).toBe(4);
  });
  
  // Test DELETE item choice - not found
  test('DELETE /item-choices/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).delete('/item-choices/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice not found');
  });
  
  // Test GET item choices by item ID
  test('GET /item-choices/item/:itemId - should return choices for a specific item', async () => {
    const response = await request(app).get('/item-choices/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.item_id === 1)).toBeTruthy();
    
    // Check specific choice details
    const displayNames = response.body.map(choice => choice.display_name).sort();
    expect(displayNames).toEqual(['Asian Paints Royale White', 'Berger Basic White']);
  });
  
  // Test GET item choices by brand
  test('GET /item-choices/brand/:brand - should return choices for a specific brand', async () => {
    const response = await request(app).get('/item-choices/brand/Godrej');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('brand', 'Godrej');
    expect(response.body[0]).toHaveProperty('display_name', 'Godrej Luxury Brass Handle');
  });
  
  // Test GET active item choices
  test('GET /item-choices/active - should return only active choices', async () => {
    const response = await request(app).get('/item-choices/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4); // 4 active choices in test data
    expect(response.body.every(choice => choice.is_active === true)).toBeTruthy();
    
    // Check that inactive choice is not included
    const choiceIds = response.body.map(choice => choice.choice_option_id);
    expect(choiceIds).not.toContain(5);
  });
  
  // Test GET default item choices
  test('GET /item-choices/default - should return only default choices', async () => {
    const response = await request(app).get('/item-choices/default');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // 3 default choices in test data
    expect(response.body.every(choice => choice.is_default === true)).toBeTruthy();
    
    // Check specific default choices
    const choiceIds = response.body.map(choice => choice.choice_option_id).sort();
    expect(choiceIds).toEqual([1, 3, 5]);
  });
});
