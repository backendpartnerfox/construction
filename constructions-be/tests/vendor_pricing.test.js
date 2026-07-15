// tests/vendor_pricing.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_type (
      vendor_type_id SERIAL PRIMARY KEY,
      vendor_type VARCHAR(100) NOT NULL UNIQUE
    );
    
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id SERIAL PRIMARY KEY,
      vendor_name VARCHAR(100) NOT NULL,
      vendor_type_id INTEGER REFERENCES vendor_type(vendor_type_id)
    );
    
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_unit VARCHAR(20),
      item_category VARCHAR(50)
    );
    
    CREATE TABLE IF NOT EXISTS item_choices (
      item_choice_id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES items(item_id),
      choice_name VARCHAR(100) NOT NULL,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS vendor_pricing (
      pricing_id SERIAL PRIMARY KEY,
      vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id),
      item_id INTEGER NOT NULL REFERENCES items(item_id),
      item_choice_id INTEGER REFERENCES item_choices(item_choice_id),
      specification TEXT,
      unit_price NUMERIC(12,2) NOT NULL,
      gst_percentage NUMERIC(5,2),
      price_date DATE NOT NULL,
      is_current BOOLEAN DEFAULT true
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS vendor_pricing');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS vendors');
  await pool.query('DROP TABLE IF EXISTS vendor_type');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM vendor_pricing');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM vendors');
  await pool.query('DELETE FROM vendor_type');
  
  // Insert test data
  await pool.query(`
    INSERT INTO vendor_type (vendor_type_id, vendor_type)
    VALUES 
      (1, 'Supplier'),
      (2, 'Contractor')
  `);
  
  await pool.query(`
    INSERT INTO vendors (vendor_id, vendor_name, vendor_type_id)
    VALUES 
      (1, 'ABC Suppliers', 1),
      (2, 'XYZ Contractors', 2)
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_description, item_unit, item_category)
    VALUES 
      (1, 'Cement', 'Portland Cement', 'Bag', 'Building Materials'),
      (2, 'Brick', 'Standard Clay Brick', 'Piece', 'Building Materials')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (item_choice_id, item_id, choice_name, description)
    VALUES 
      (1, 1, 'Brand A Cement', 'Premium quality cement'),
      (2, 1, 'Brand B Cement', 'Standard quality cement'),
      (3, 2, 'Red Brick', 'Standard red clay brick')
  `);
  
  // Current date for pricing
  const currentDate = new Date().toISOString().split('T')[0];
  
  await pool.query(`
    INSERT INTO vendor_pricing (
      pricing_id, vendor_id, item_id, item_choice_id, 
      specification, unit_price, gst_percentage, 
      price_date, is_current
    )
    VALUES 
      (1, 1, 1, 1, 'Premium Grade', 350.50, 18.00, $1, true),
      (2, 1, 2, 3, 'Standard Size', 8.75, 12.00, $1, true),
      (3, 2, 1, 2, 'Bulk Purchase', 325.00, 18.00, $1, true)
  `, [currentDate]);
  
  // Reset sequences
  await pool.query("SELECT setval('vendor_type_vendor_type_id_seq', 2)");
  await pool.query("SELECT setval('vendors_vendor_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_item_choice_id_seq', 3)");
  await pool.query("SELECT setval('vendor_pricing_pricing_id_seq', 3)");
});

describe('Vendor Pricing API', () => {
  // Test GET all vendor pricing records
  test('GET /vendor-pricing - should return all vendor pricing records', async () => {
    const response = await request(app).get('/vendor-pricing');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('pricing_id', 1);
    expect(response.body[0]).toHaveProperty('vendor_id', 1);
    expect(response.body[0]).toHaveProperty('unit_price', '350.50');
    expect(response.body[1]).toHaveProperty('item_id', 2);
  });
  
  // Test GET vendor pricing by ID
  test('GET /vendor-pricing/:id - should return a specific pricing record', async () => {
    const response = await request(app).get('/vendor-pricing/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pricing_id', 1);
    expect(response.body).toHaveProperty('vendor_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('item_choice_id', 1);
    expect(response.body).toHaveProperty('specification', 'Premium Grade');
    expect(response.body).toHaveProperty('unit_price', '350.50');
    expect(response.body).toHaveProperty('gst_percentage', '18.00');
  });
  
  // Test GET vendor pricing by ID - not found
  test('GET /vendor-pricing/:id - should return 404 for non-existent pricing', async () => {
    const response = await request(app).get('/vendor-pricing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor pricing record not found');
  });
  
  // Test GET pricing records by vendor
  test('GET /vendor-pricing/vendor/:vendorId - should return pricing for a specific vendor', async () => {
    const response = await request(app).get('/vendor-pricing/vendor/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('vendor_id', 1);
    expect(response.body[1]).toHaveProperty('vendor_id', 1);
  });
  
  // Test POST new vendor pricing
  test('POST /vendor-pricing - should create a new pricing record', async () => {
    const newPricing = {
      vendor_id: 2,
      item_id: 2,
      item_choice_id: 3,
      specification: 'Bulk Order',
      unit_price: 7.50,
      gst_percentage: 12.00,
      price_date: new Date().toISOString().split('T')[0],
      is_current: true
    };
    
    const response = await request(app)
      .post('/vendor-pricing')
      .send(newPricing);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('pricing_id', 4);
    expect(response.body).toHaveProperty('vendor_id', 2);
    expect(response.body).toHaveProperty('item_id', 2);
    expect(response.body).toHaveProperty('unit_price', '7.50');
    
    // Verify pricing was created
    const allPricing = await request(app).get('/vendor-pricing');
    expect(allPricing.body.length).toBe(4);
  });
  
  // Test POST vendor pricing - missing required fields
  test('POST /vendor-pricing - should return 400 for missing required fields', async () => {
    const incompletePricing = {
      vendor_id: 1,
      item_id: 1
      // Missing item_choice_id, unit_price, and price_date
    };
    
    const response = await request(app)
      .post('/vendor-pricing')
      .send(incompletePricing);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });
  
  // Test PUT update vendor pricing
  test('PUT /vendor-pricing/:id - should update an existing pricing record', async () => {
    const updatedData = {
      vendor_id: 1,
      item_id: 1,
      item_choice_id: 1,
      specification: 'Premium Grade - Updated',
      unit_price: 375.25,
      gst_percentage: 18.00,
      price_date: new Date().toISOString().split('T')[0]
    };
    
    const response = await request(app)
      .put('/vendor-pricing/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pricing_id', 1);
    expect(response.body).toHaveProperty('specification', 'Premium Grade - Updated');
    expect(response.body).toHaveProperty('unit_price', '375.25');
    
    // Verify pricing was updated
    const pricing = await request(app).get('/vendor-pricing/1');
    expect(pricing.body.specification).toBe('Premium Grade - Updated');
    expect(pricing.body.unit_price).toBe('375.25');
  });
  
  // Test PUT vendor pricing - not found
  test('PUT /vendor-pricing/:id - should return 404 for non-existent pricing record', async () => {
    const updatedData = {
      vendor_id: 1,
      item_id: 1,
      item_choice_id: 1,
      unit_price: 300.00,
      price_date: new Date().toISOString().split('T')[0]
    };
    
    const response = await request(app)
      .put('/vendor-pricing/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor pricing record not found');
  });
  
  // Test DELETE vendor pricing
  test('DELETE /vendor-pricing/:id - should delete a pricing record', async () => {
    const response = await request(app).delete('/vendor-pricing/3');
    
    expect(response.status).toBe(204);
    
    // Verify pricing was deleted
    const checkResponse = await request(app).get('/vendor-pricing/3');
    expect(checkResponse.status).toBe(404);
    
    const allPricing = await request(app).get('/vendor-pricing');
    expect(allPricing.body.length).toBe(2);
  });
  
  // Test DELETE vendor pricing - not found
  test('DELETE /vendor-pricing/:id - should return 404 for non-existent pricing record', async () => {
    const response = await request(app).delete('/vendor-pricing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor pricing record not found');
  });
  
  // Test GET current pricing records
  test('GET /vendor-pricing/current-pricing - should return all current pricing records', async () => {
    const response = await request(app).get('/vendor-pricing/current-pricing');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // All test records are current
    
    // Add a non-current pricing record
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);
    
    await pool.query(`
      INSERT INTO vendor_pricing (
        pricing_id, vendor_id, item_id, item_choice_id, 
        specification, unit_price, gst_percentage, 
        price_date, is_current
      )
      VALUES (4, 1, 1, 1, 'Old Price', 325.00, 18.00, $1, false)
    `, [pastDate.toISOString().split('T')[0]]);
    
    // Verify only current records are returned
    const newResponse = await request(app).get('/vendor-pricing/current-pricing');
    expect(newResponse.body.length).toBe(3);
    expect(newResponse.body.every(record => record.is_current === true)).toBeTruthy();
  });
});
