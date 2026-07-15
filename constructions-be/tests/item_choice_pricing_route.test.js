// tests/item_choice_pricing_route.test.js
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
      item_name VARCHAR(255) NOT NULL,
      item_description TEXT,
      item_unit VARCHAR(255),
      item_category VARCHAR(255),
      is_active BOOLEAN DEFAULT true
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES items(item_id),
      item_material_type VARCHAR(255),
      brand VARCHAR(255),
      series VARCHAR(255),
      sub_series VARCHAR(255),
      model VARCHAR(255),
      code VARCHAR(255),
      parent_choice_id INTEGER,
      display_name VARCHAR(255),
      description TEXT,
      image_url VARCHAR(255),
      is_premium BOOLEAN DEFAULT false,
      package NUMERIC DEFAULT 0.00,
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choice_pricing (
      id SERIAL PRIMARY KEY,
      choice_option_id INTEGER NOT NULL REFERENCES item_choices(choice_option_id),
      base_price NUMERIC NOT NULL,
      unit_of_measurement VARCHAR(255) NOT NULL,
      gst_percentage NUMERIC NOT NULL DEFAULT 18.00,
      gst_amount NUMERIC,
      total_price NUMERIC,
      effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
      effective_to DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS item_choice_pricing');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM item_choice_pricing');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  
  // Insert test data
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category)
    VALUES 
      (1, 'Cement', 'Construction Materials'),
      (2, 'Steel', 'Construction Materials')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (choice_option_id, display_name, item_id)
    VALUES 
      (1, 'Premium Cement', 1),
      (2, 'Standard Cement', 1),
      (3, 'Fe500 Steel', 2)
  `);
  
  await pool.query(`
    INSERT INTO item_choice_pricing (
      id, choice_option_id, base_price, unit_of_measurement, gst_percentage,
      gst_amount, total_price, effective_from, effective_to, is_active
    )
    VALUES 
      (1, 1, 500.00, 'bag', 18.00, 90.00, 590.00, '2024-01-01', null, true),
      (2, 2, 450.00, 'bag', 18.00, 81.00, 531.00, '2024-01-01', null, true),
      (3, 3, 65.00, 'kg', 18.00, 11.70, 76.70, '2024-01-01', '2024-06-30', false)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 3)");
  await pool.query("SELECT setval('item_choice_pricing_id_seq', 3)");
});

describe('Item Choice Pricing API', () => {
  // Test GET all pricing entries
  test('GET /item-choice-pricing - should return all pricing entries', async () => {
    const response = await request(app).get('/item-choice-pricing');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('choice_option_id');
    expect(response.body[0]).toHaveProperty('base_price');
    expect(response.body[0]).toHaveProperty('unit_of_measurement');
    expect(response.body[0]).toHaveProperty('total_price');
    expect(response.body[0]).toHaveProperty('choice_name');
    expect(response.body[0]).toHaveProperty('item_name');
  });
  
  // Test GET pricing by ID
  test('GET /item-choice-pricing/:id - should return a specific pricing entry', async () => {
    const response = await request(app).get('/item-choice-pricing/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('choice_option_id', 1);
    expect(response.body).toHaveProperty('base_price', '500.00');
    expect(response.body).toHaveProperty('unit_of_measurement', 'bag');
    expect(response.body).toHaveProperty('gst_percentage', '18.00');
    expect(response.body).toHaveProperty('total_price', '590.00');
    expect(response.body).toHaveProperty('choice_name', 'Premium Cement');
    expect(response.body).toHaveProperty('item_name', 'Cement');
  });
  
  // Test GET pricing by ID - not found
  test('GET /item-choice-pricing/:id - should return 404 for non-existent pricing', async () => {
    const response = await request(app).get('/item-choice-pricing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice pricing not found');
  });
  
  // Test GET pricing by choice ID
  test('GET /item-choice-pricing/choice/:choiceId - should return pricing for a choice', async () => {
    const response = await request(app).get('/item-choice-pricing/choice/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('choice_option_id', 1);
    expect(response.body[0]).toHaveProperty('base_price', '500.00');
  });
  
  // Test GET pricing by choice ID - choice not found
  test('GET /item-choice-pricing/choice/:choiceId - should return 404 for non-existent choice', async () => {
    const response = await request(app).get('/item-choice-pricing/choice/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Choice option not found');
  });
  
  // Test GET current pricing by choice ID
  test('GET /item-choice-pricing/choice/:choiceId/current - should return current active pricing', async () => {
    const response = await request(app).get('/item-choice-pricing/choice/1/current');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_option_id', 1);
    expect(response.body).toHaveProperty('is_active', true);
    expect(response.body).toHaveProperty('base_price', '500.00');
    expect(response.body).toHaveProperty('choice_name', 'Premium Cement');
  });
  
  // Test GET current pricing - no current pricing found
  test('GET /item-choice-pricing/choice/:choiceId/current - should return 404 for no current pricing', async () => {
    const response = await request(app).get('/item-choice-pricing/choice/3/current'); // Inactive pricing
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'No current pricing found for this choice option');
  });
  
  // Test POST new pricing
  test('POST /item-choice-pricing - should create a new pricing entry', async () => {
    const newPricing = {
      choice_option_id: 3,
      base_price: 70.00,
      unit_of_measurement: 'kg',
      gst_percentage: 18.00,
      effective_from: '2024-07-01',
      is_active: true
    };
    
    const response = await request(app)
      .post('/item-choice-pricing')
      .send(newPricing);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 4);
    expect(response.body).toHaveProperty('choice_option_id', 3);
    expect(response.body).toHaveProperty('base_price', '70.00');
    expect(response.body).toHaveProperty('gst_amount', '12.60'); // 70 * 0.18
    expect(response.body).toHaveProperty('total_price', '82.60'); // 70 + 12.60
    
    // Verify pricing was actually created
    const allPricing = await request(app).get('/item-choice-pricing');
    expect(allPricing.body.length).toBe(4);
  });
  
  // Test POST pricing - missing required fields
  test('POST /item-choice-pricing - should return 400 for missing choice_option_id', async () => {
    const incompletePricing = {
      base_price: 500.00,
      unit_of_measurement: 'bag',
      effective_from: '2024-01-01'
      // Missing choice_option_id
    };
    
    const response = await request(app)
      .post('/item-choice-pricing')
      .send(incompletePricing);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Choice option ID is required');
  });
  
  // Test POST pricing - non-existent choice option
  test('POST /item-choice-pricing - should return 404 for non-existent choice option', async () => {
    const invalidPricing = {
      choice_option_id: 999,
      base_price: 500.00,
      unit_of_measurement: 'bag',
      effective_from: '2024-01-01'
    };
    
    const response = await request(app)
      .post('/item-choice-pricing')
      .send(invalidPricing);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Choice option not found');
  });
  
  // Test PUT update pricing
  test('PUT /item-choice-pricing/:id - should update a pricing entry', async () => {
    const updatedData = {
      base_price: 550.00,
      unit_of_measurement: 'bag',
      gst_percentage: 18.00
    };
    
    const response = await request(app)
      .put('/item-choice-pricing/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('base_price', '550.00');
    expect(response.body).toHaveProperty('gst_amount', '99.00'); // 550 * 0.18
    expect(response.body).toHaveProperty('total_price', '649.00'); // 550 + 99
    
    // Verify pricing was actually updated
    const updatedPricing = await request(app).get('/item-choice-pricing/1');
    expect(updatedPricing.body.base_price).toBe('550.00');
  });
  
  // Test PUT pricing - not found
  test('PUT /item-choice-pricing/:id - should return 404 for non-existent pricing', async () => {
    const updatedData = {
      base_price: 550.00,
      unit_of_measurement: 'bag'
    };
    
    const response = await request(app)
      .put('/item-choice-pricing/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice pricing not found');
  });
  
  // Test PATCH deactivate pricing
  test('PATCH /item-choice-pricing/:id/deactivate - should deactivate a pricing entry', async () => {
    const response = await request(app).patch('/item-choice-pricing/1/deactivate');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('is_active', false);
    expect(response.body).toHaveProperty('effective_to');
    
    // Verify pricing was actually deactivated
    const deactivatedPricing = await request(app).get('/item-choice-pricing/1');
    expect(deactivatedPricing.body.is_active).toBe(false);
  });
  
  // Test PATCH deactivate pricing - not found
  test('PATCH /item-choice-pricing/:id/deactivate - should return 404 for non-existent pricing', async () => {
    const response = await request(app).patch('/item-choice-pricing/999/deactivate');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice pricing not found');
  });
  
  // Test DELETE pricing - success
  test('DELETE /item-choice-pricing/:id - should delete an inactive pricing entry', async () => {
    const response = await request(app).delete('/item-choice-pricing/3'); // Inactive pricing
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Item choice pricing deleted successfully');
    
    // Verify pricing was actually deleted
    const deletedPricing = await request(app).get('/item-choice-pricing/3');
    expect(deletedPricing.status).toBe(404);
    
    const allPricing = await request(app).get('/item-choice-pricing');
    expect(allPricing.body.length).toBe(2);
  });
  
  // Test DELETE pricing - active pricing
  test('DELETE /item-choice-pricing/:id - should return 400 for active pricing', async () => {
    const response = await request(app).delete('/item-choice-pricing/1'); // Active pricing
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete currently active pricing. Deactivate it first.');
  });
  
  // Test DELETE pricing - not found
  test('DELETE /item-choice-pricing/:id - should return 404 for non-existent pricing', async () => {
    const response = await request(app).delete('/item-choice-pricing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice pricing not found');
  });
  
  // Test GET with filters
  test('GET /item-choice-pricing with filters - should filter by choice_option_id', async () => {
    const response = await request(app).get('/item-choice-pricing?choice_option_id=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('choice_option_id', 1);
  });
  
  // Test GET with is_active filter
  test('GET /item-choice-pricing with is_active filter - should filter by active status', async () => {
    const response = await request(app).get('/item-choice-pricing?is_active=true');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('is_active', true);
    expect(response.body[1]).toHaveProperty('is_active', true);
  });
});