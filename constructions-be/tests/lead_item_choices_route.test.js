// tests/lead_item_choices_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      lead_number VARCHAR(100),
      lead_title VARCHAR(200)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_id SERIAL PRIMARY KEY,
      item_id INTEGER REFERENCES items(item_id),
      choice_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_item_choices (
      lead_choice_id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(lead_id),
      item_id INTEGER REFERENCES items(item_id),
      choice_id INTEGER REFERENCES item_choices(choice_id),
      selected_choice_value TEXT,
      custom_specification TEXT,
      quantity NUMERIC,
      unit_price NUMERIC,
      total_price NUMERIC,
      priority_level VARCHAR(20),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS lead_item_choices');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS leads');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM lead_item_choices');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM leads');
  
  // Insert test data
  await pool.query(`
    INSERT INTO leads (lead_id, lead_number, lead_title)
    VALUES 
      (1, 'LEAD-001', 'Residential Villa Project'),
      (2, 'LEAD-002', 'Commercial Office Project')
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_description)
    VALUES 
      (1, 'Wall Paint', 'Interior wall paint'),
      (2, 'Floor Tile', 'Ceramic floor tiles'),
      (3, 'Kitchen Counter', 'Kitchen countertop material')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (choice_id, item_id, choice_name)
    VALUES 
      (1, 1, 'Premium White'),
      (2, 1, 'Luxury Beige'),
      (3, 2, 'Premium Ceramic'),
      (4, 2, 'Italian Marble'),
      (5, 3, 'Granite Supreme')
  `);
  
  await pool.query(`
    INSERT INTO lead_item_choices (
      lead_choice_id, lead_id, item_id, choice_id, 
      selected_choice_value, custom_specification, quantity, 
      unit_price, total_price, priority_level, notes
    )
    VALUES 
      (1, 1, 1, 1, 'Premium Off White', 'Anti-bacterial coating', 500.00, 45.00, 22500.00, 'High', 'Client preferred premium finish'),
      (2, 1, 2, 3, 'White Premium Ceramic', 'Non-slip surface', 150.00, 120.00, 18000.00, 'Medium', 'For main areas'),
      (3, 2, 1, 2, 'Luxury Light Beige', 'Washable finish', 800.00, 50.00, 40000.00, 'High', 'Office standard'),
      (4, 2, 3, 5, 'Black Granite Supreme', 'Polished finish', 25.00, 2500.00, 62500.00, 'High', 'Reception desk')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 3)");
  await pool.query("SELECT setval('item_choices_choice_id_seq', 5)");
  await pool.query("SELECT setval('lead_item_choices_lead_choice_id_seq', 4)");
});

describe('Lead Item Choices API', () => {
  // Test GET all choices
  test('GET /lead-item-choices - should return all lead item choices', async () => {
    const response = await request(app).get('/lead-item-choices');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('lead_choice_id');
    expect(response.body[0]).toHaveProperty('lead_id');
    expect(response.body[0]).toHaveProperty('item_id');
  });
  
  // Test GET choice by ID
  test('GET /lead-item-choices/:id - should return a specific choice', async () => {
    const response = await request(app).get('/lead-item-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_choice_id', 1);
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('choice_id', 1);
    expect(response.body).toHaveProperty('selected_choice_value', 'Premium Off White');
    expect(response.body).toHaveProperty('custom_specification', 'Anti-bacterial coating');
    expect(response.body).toHaveProperty('quantity', '500');
    expect(response.body).toHaveProperty('unit_price', '45');
    expect(response.body).toHaveProperty('total_price', '22500');
    expect(response.body).toHaveProperty('priority_level', 'High');
  });
  
  // Test GET choice by ID - not found
  test('GET /lead-item-choices/:id - should return 404 for non-existent choice', async () => {
    const response = await request(app).get('/lead-item-choices/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Lead item choice not found');
  });
  
  // Test POST new choice
  test('POST /lead-item-choices - should create a new lead item choice', async () => {
    const newChoice = {
      lead_id: 2,
      item_id: 2,
      choice_id: 4,
      selected_choice_value: 'White Italian Marble',
      custom_specification: 'High-gloss finish',
      quantity: 100.00,
      unit_price: 250.00,
      total_price: 25000.00,
      priority_level: 'High',
      notes: 'Premium selection for lobby'
    };
    
    const response = await request(app)
      .post('/lead-item-choices')
      .send(newChoice);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('lead_choice_id', 5);
    expect(response.body).toHaveProperty('lead_id', 2);
    expect(response.body).toHaveProperty('item_id', 2);
    expect(response.body).toHaveProperty('choice_id', 4);
    expect(response.body).toHaveProperty('selected_choice_value', 'White Italian Marble');
    expect(response.body).toHaveProperty('quantity', '100');
    expect(response.body).toHaveProperty('unit_price', '250');
    expect(response.body).toHaveProperty('total_price', '25000');
  });
  
  // Test POST choice - missing required fields
  test('POST /lead-item-choices - should return 400 for missing required fields', async () => {
    const incompleteChoice = {
      lead_id: 1,
      // Missing item_id and choice_id
      selected_choice_value: 'Some value'
    };
    
    const response = await request(app)
      .post('/lead-item-choices')
      .send(incompleteChoice);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update choice
  test('PUT /lead-item-choices/:id - should update a lead item choice', async () => {
    const updatedChoice = {
      lead_id: 1,
      item_id: 1,
      choice_id: 2,
      selected_choice_value: 'Updated Luxury Beige',
      custom_specification: 'Updated coating',
      quantity: 600.00,
      unit_price: 50.00,
      total_price: 30000.00,
      priority_level: 'Medium',
      notes: 'Updated specification'
    };
    
    const response = await request(app)
      .put('/lead-item-choices/1')
      .send(updatedChoice);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_choice_id', 1);
    expect(response.body).toHaveProperty('choice_id', 2);
    expect(response.body).toHaveProperty('selected_choice_value', 'Updated Luxury Beige');
    expect(response.body).toHaveProperty('quantity', '600');
    expect(response.body).toHaveProperty('unit_price', '50');
    expect(response.body).toHaveProperty('total_price', '30000');
  });
  
  // Test DELETE choice
  test('DELETE /lead-item-choices/:id - should delete a lead item choice', async () => {
    const response = await request(app).delete('/lead-item-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Lead item choice deleted successfully');
    
    // Verify choice was deleted
    const getResponse = await request(app).get('/lead-item-choices/1');
    expect(getResponse.status).toBe(404);
  });
  
  // Test GET choices by lead
  test('GET /lead-item-choices/lead/:leadId - should return choices for a lead', async () => {
    const response = await request(app).get('/lead-item-choices/lead/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.lead_id === 1)).toBeTruthy();
  });
  
  // Test GET choices by priority
  test('GET /lead-item-choices/priority/High - should return high priority choices', async () => {
    const response = await request(app).get('/lead-item-choices/priority/High');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body.every(choice => choice.priority_level === 'High')).toBeTruthy();
  });
  
  // Test search functionality
  test('GET /lead-item-choices/search?query=Premium - should search choices', async () => {
    const response = await request(app).get('/lead-item-choices/search?query=Premium');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });
  
  // Test GET choices by item
  test('GET /lead-item-choices/item/:itemId - should return choices for an item', async () => {
    const response = await request(app).get('/lead-item-choices/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.item_id === 1)).toBeTruthy();
  });
});