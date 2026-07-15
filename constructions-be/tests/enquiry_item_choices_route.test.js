// tests/enquiry_item_choices_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(100),
      contact_person_name VARCHAR(100) NOT NULL
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
    CREATE TABLE IF NOT EXISTS enquiry_item_choices (
      enquiry_choice_id SERIAL PRIMARY KEY,
      enquiry_id INTEGER REFERENCES enquiries(enquiry_id),
      item_id INTEGER REFERENCES items(item_id),
      choice_id INTEGER REFERENCES item_choices(choice_id),
      selected_choice_value TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS enquiry_item_choices');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS enquiries');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM enquiry_item_choices');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM enquiries');
  
  // Insert test data
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name)
    VALUES 
      (1, 'ENQ-001', 'John Doe'),
      (2, 'ENQ-002', 'Jane Smith')
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
      (1, 1, 'White'),
      (2, 1, 'Beige'),
      (3, 2, 'Ceramic'),
      (4, 2, 'Marble'),
      (5, 3, 'Granite')
  `);
  
  await pool.query(`
    INSERT INTO enquiry_item_choices (
      enquiry_choice_id, enquiry_id, item_id, choice_id, 
      selected_choice_value, notes
    )
    VALUES 
      (1, 1, 1, 1, 'Off White', 'Client preferred color'),
      (2, 1, 2, 3, 'White Ceramic', 'For bathroom area'),
      (3, 2, 1, 2, 'Light Beige', 'Neutral tone'),
      (4, 2, 3, 5, 'Black Granite', 'Premium finish')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 3)");
  await pool.query("SELECT setval('item_choices_choice_id_seq', 5)");
  await pool.query("SELECT setval('enquiry_item_choices_enquiry_choice_id_seq', 4)");
});

describe('Enquiry Item Choices API', () => {
  // Test GET all choices
  test('GET /enquiry-item-choices - should return all enquiry item choices', async () => {
    const response = await request(app).get('/enquiry-item-choices');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('enquiry_choice_id');
    expect(response.body[0]).toHaveProperty('enquiry_id');
    expect(response.body[0]).toHaveProperty('item_id');
  });
  
  // Test GET choice by ID
  test('GET /enquiry-item-choices/:id - should return a specific choice', async () => {
    const response = await request(app).get('/enquiry-item-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_choice_id', 1);
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('choice_id', 1);
    expect(response.body).toHaveProperty('selected_choice_value', 'Off White');
    expect(response.body).toHaveProperty('notes', 'Client preferred color');
  });
  
  // Test GET choice by ID - not found
  test('GET /enquiry-item-choices/:id - should return 404 for non-existent choice', async () => {
    const response = await request(app).get('/enquiry-item-choices/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry item choice not found');
  });
  
  // Test POST new choice
  test('POST /enquiry-item-choices - should create a new enquiry item choice', async () => {
    const newChoice = {
      enquiry_id: 2,
      item_id: 2,
      choice_id: 4,
      selected_choice_value: 'White Marble',
      notes: 'Premium selection'
    };
    
    const response = await request(app)
      .post('/enquiry-item-choices')
      .send(newChoice);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_choice_id', 5);
    expect(response.body).toHaveProperty('enquiry_id', 2);
    expect(response.body).toHaveProperty('item_id', 2);
    expect(response.body).toHaveProperty('choice_id', 4);
    expect(response.body).toHaveProperty('selected_choice_value', 'White Marble');
  });
  
  // Test POST choice - missing required fields
  test('POST /enquiry-item-choices - should return 400 for missing required fields', async () => {
    const incompleteChoice = {
      enquiry_id: 1,
      // Missing item_id and choice_id
      selected_choice_value: 'Some value'
    };
    
    const response = await request(app)
      .post('/enquiry-item-choices')
      .send(incompleteChoice);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update choice
  test('PUT /enquiry-item-choices/:id - should update an enquiry item choice', async () => {
    const updatedChoice = {
      enquiry_id: 1,
      item_id: 1,
      choice_id: 2,
      selected_choice_value: 'Light Beige',
      notes: 'Updated color preference'
    };
    
    const response = await request(app)
      .put('/enquiry-item-choices/1')
      .send(updatedChoice);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_choice_id', 1);
    expect(response.body).toHaveProperty('choice_id', 2);
    expect(response.body).toHaveProperty('selected_choice_value', 'Light Beige');
    expect(response.body).toHaveProperty('notes', 'Updated color preference');
  });
  
  // Test DELETE choice
  test('DELETE /enquiry-item-choices/:id - should delete an enquiry item choice', async () => {
    const response = await request(app).delete('/enquiry-item-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Enquiry item choice deleted successfully');
    
    // Verify choice was deleted
    const getResponse = await request(app).get('/enquiry-item-choices/1');
    expect(getResponse.status).toBe(404);
  });
  
  // Test GET choices by enquiry
  test('GET /enquiry-item-choices/enquiry/:enquiryId - should return choices for an enquiry', async () => {
    const response = await request(app).get('/enquiry-item-choices/enquiry/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.enquiry_id === 1)).toBeTruthy();
  });
  
  // Test GET choices by item
  test('GET /enquiry-item-choices/item/:itemId - should return choices for an item', async () => {
    const response = await request(app).get('/enquiry-item-choices/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.item_id === 1)).toBeTruthy();
  });
  
  // Test search functionality
  test('GET /enquiry-item-choices/search?query=White - should search choices', async () => {
    const response = await request(app).get('/enquiry-item-choices/search?query=White');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });
  
  // Test search without query
  test('GET /enquiry-item-choices/search - should return 400 for missing query', async () => {
    const response = await request(app).get('/enquiry-item-choices/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
});