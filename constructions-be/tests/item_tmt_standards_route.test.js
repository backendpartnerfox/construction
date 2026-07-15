// tests/item_tmt_standards_route.test.js
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
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      item_code VARCHAR(100)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_tmt_standards (
      tmt_standard_id SERIAL PRIMARY KEY,
      tmt_item_id INTEGER REFERENCES items(id),
      dia DOUBLE PRECISION,
      length DOUBLE PRECISION NOT NULL DEFAULT 12,
      weight_per_meter DOUBLE PRECISION NOT NULL,
      weight_of_full_bar DOUBLE PRECISION
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS item_tmt_standards');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM item_tmt_standards');
  await pool.query('DELETE FROM items');
  
  // Insert test data
  await pool.query(`
    INSERT INTO items (id, item_name, item_code)
    VALUES 
      (1, 'TMT Steel Bar', 'TMT001'),
      (2, 'Reinforcement Steel', 'REI001')
  `);
  
  await pool.query(`
    INSERT INTO item_tmt_standards (
      tmt_standard_id, tmt_item_id, dia, length, weight_per_meter, weight_of_full_bar
    )
    VALUES 
      (1, 1, 8, 12, 0.395, 4.74),
      (2, 1, 10, 12, 0.617, 7.40),
      (3, 1, 12, 12, 0.888, 10.66),
      (4, 2, 16, 12, 1.580, 18.96)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('items_id_seq', 2)");
  await pool.query("SELECT setval('item_tmt_standards_tmt_standard_id_seq', 4)");
});

describe('Item TMT Standards API', () => {
  // Test GET all TMT standards
  test('GET /item-tmt-standards - should return all TMT standards', async () => {
    const response = await request(app).get('/item-tmt-standards');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('tmt_standard_id');
    expect(response.body[0]).toHaveProperty('tmt_item_id');
    expect(response.body[0]).toHaveProperty('dia');
    expect(response.body[0]).toHaveProperty('length');
    expect(response.body[0]).toHaveProperty('weight_per_meter');
    expect(response.body[0]).toHaveProperty('weight_of_full_bar');
    expect(response.body[0]).toHaveProperty('item_name');
  });
  
  // Test GET TMT standard by ID
  test('GET /item-tmt-standards/:id - should return a specific TMT standard', async () => {
    const response = await request(app).get('/item-tmt-standards/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tmt_standard_id', 1);
    expect(response.body).toHaveProperty('tmt_item_id', 1);
    expect(response.body).toHaveProperty('dia', 8);
    expect(response.body).toHaveProperty('length', 12);
    expect(response.body).toHaveProperty('weight_per_meter', 0.395);
    expect(response.body).toHaveProperty('weight_of_full_bar', 4.74);
    expect(response.body).toHaveProperty('item_name', 'TMT Steel Bar');
  });
  
  // Test GET TMT standard by ID - not found
  test('GET /item-tmt-standards/:id - should return 404 for non-existent TMT standard', async () => {
    const response = await request(app).get('/item-tmt-standards/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'TMT standard not found');
  });
  
  // Test GET TMT standards by item ID
  test('GET /item-tmt-standards/item/:itemId - should return TMT standards for an item', async () => {
    const response = await request(app).get('/item-tmt-standards/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('tmt_item_id', 1);
    expect(response.body[1]).toHaveProperty('tmt_item_id', 1);
    expect(response.body[2]).toHaveProperty('tmt_item_id', 1);
    
    // Check diameters are ordered
    const diameters = response.body.map(std => std.dia);
    expect(diameters).toEqual([8, 10, 12]);
  });
  
  // Test GET TMT standards by item ID - item not found
  test('GET /item-tmt-standards/item/:itemId - should return 404 for non-existent item', async () => {
    const response = await request(app).get('/item-tmt-standards/item/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });
  
  // Test GET TMT standards by diameter
  test('GET /item-tmt-standards/diameter/:dia - should return TMT standards for a diameter', async () => {
    const response = await request(app).get('/item-tmt-standards/diameter/12');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('dia', 12);
    expect(response.body[0]).toHaveProperty('weight_per_meter', 0.888);
  });
  
  // Test POST new TMT standard
  test('POST /item-tmt-standards - should create a new TMT standard', async () => {
    const newStandard = {
      tmt_item_id: 1,
      dia: 20,
      length: 12,
      weight_per_meter: 2.469
    };
    
    const response = await request(app)
      .post('/item-tmt-standards')
      .send(newStandard);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('tmt_standard_id', 5);
    expect(response.body).toHaveProperty('tmt_item_id', 1);
    expect(response.body).toHaveProperty('dia', 20);
    expect(response.body).toHaveProperty('weight_per_meter', 2.469);
    expect(response.body).toHaveProperty('weight_of_full_bar', 29.628); // 2.469 * 12
    
    // Verify TMT standard was actually created
    const allStandards = await request(app).get('/item-tmt-standards');
    expect(allStandards.body.length).toBe(5);
  });
  
  // Test POST TMT standard - missing required fields
  test('POST /item-tmt-standards - should return 400 for missing tmt_item_id', async () => {
    const incompleteStandard = {
      dia: 20,
      weight_per_meter: 2.469
      // Missing tmt_item_id
    };
    
    const response = await request(app)
      .post('/item-tmt-standards')
      .send(incompleteStandard);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'TMT item ID is required');
  });
  
  // Test POST TMT standard - non-existent item
  test('POST /item-tmt-standards - should return 404 for non-existent item', async () => {
    const invalidStandard = {
      tmt_item_id: 999,
      dia: 20,
      weight_per_meter: 2.469
    };
    
    const response = await request(app)
      .post('/item-tmt-standards')
      .send(invalidStandard);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });
  
  // Test PUT update TMT standard
  test('PUT /item-tmt-standards/:id - should update a TMT standard', async () => {
    const updatedData = {
      dia: 8,
      length: 12,
      weight_per_meter: 0.400 // Updated weight
    };
    
    const response = await request(app)
      .put('/item-tmt-standards/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tmt_standard_id', 1);
    expect(response.body).toHaveProperty('weight_per_meter', 0.400);
    expect(response.body).toHaveProperty('weight_of_full_bar', 4.8); // 0.400 * 12
    
    // Verify TMT standard was actually updated
    const updatedStandard = await request(app).get('/item-tmt-standards/1');
    expect(updatedStandard.body.weight_per_meter).toBe(0.400);
  });
  
  // Test PUT TMT standard - not found
  test('PUT /item-tmt-standards/:id - should return 404 for non-existent TMT standard', async () => {
    const updatedData = {
      dia: 8,
      weight_per_meter: 0.400
    };
    
    const response = await request(app)
      .put('/item-tmt-standards/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'TMT standard not found');
  });
  
  // Test DELETE TMT standard
  test('DELETE /item-tmt-standards/:id - should delete a TMT standard', async () => {
    const response = await request(app).delete('/item-tmt-standards/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'TMT standard deleted successfully');
    
    // Verify TMT standard was actually deleted
    const deletedStandard = await request(app).get('/item-tmt-standards/1');
    expect(deletedStandard.status).toBe(404);
    
    const allStandards = await request(app).get('/item-tmt-standards');
    expect(allStandards.body.length).toBe(3);
  });
  
  // Test DELETE TMT standard - not found
  test('DELETE /item-tmt-standards/:id - should return 404 for non-existent TMT standard', async () => {
    const response = await request(app).delete('/item-tmt-standards/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'TMT standard not found');
  });
  
  // Test POST calculate weight
  test('POST /item-tmt-standards/calculate-weight - should calculate weight for given diameter and length', async () => {
    const calculationData = {
      dia: 8,
      length: 6
    };
    
    const response = await request(app)
      .post('/item-tmt-standards/calculate-weight')
      .send(calculationData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('diameter', 8);
    expect(response.body).toHaveProperty('length', 6);
    expect(response.body).toHaveProperty('weight_per_meter', 0.395);
    expect(response.body).toHaveProperty('total_weight', 2.37); // 0.395 * 6
  });
  
  // Test POST calculate weight - missing fields
  test('POST /item-tmt-standards/calculate-weight - should return 400 for missing fields', async () => {
    const incompleteData = {
      dia: 8
      // Missing length
    };
    
    const response = await request(app)
      .post('/item-tmt-standards/calculate-weight')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Diameter and length are required');
  });
  
  // Test POST calculate weight - no standard found
  test('POST /item-tmt-standards/calculate-weight - should return 404 for unknown diameter', async () => {
    const calculationData = {
      dia: 25, // Non-existent diameter
      length: 12
    };
    
    const response = await request(app)
      .post('/item-tmt-standards/calculate-weight')
      .send(calculationData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'No TMT standard found for the given diameter');
  });
  
  // Test GET diameters
  test('GET /item-tmt-standards/diameters - should return all available diameters', async () => {
    const response = await request(app).get('/item-tmt-standards/diameters');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body).toEqual([8, 10, 12, 16]);
  });
  
  // Test GET with filters
  test('GET /item-tmt-standards with filters - should filter by tmt_item_id', async () => {
    const response = await request(app).get('/item-tmt-standards?tmt_item_id=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('tmt_item_id', 1);
    expect(response.body[1]).toHaveProperty('tmt_item_id', 1);
    expect(response.body[2]).toHaveProperty('tmt_item_id', 1);
  });
  
  // Test GET with diameter filter
  test('GET /item-tmt-standards with diameter filter - should filter by dia', async () => {
    const response = await request(app).get('/item-tmt-standards?dia=10');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('dia', 10);
  });
});