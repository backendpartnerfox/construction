// tests/vendor_type.test.js
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
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS vendors');
  await pool.query('DROP TABLE IF EXISTS vendor_type');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
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
  
  // Reset sequences
  await pool.query("SELECT setval('vendor_type_vendor_type_id_seq', 2)");
  await pool.query("SELECT setval('vendors_vendor_id_seq', 2)");
});

describe('Vendor Types API', () => {
  // Test GET all vendor types
  test('GET /vendor-types - should return all vendor types', async () => {
    const response = await request(app).get('/vendor-types');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('vendor_type_id', 1);
    expect(response.body[0]).toHaveProperty('vendor_type', 'Supplier');
    expect(response.body[1]).toHaveProperty('vendor_type', 'Contractor');
  });
  
  // Test GET vendor type by ID
  test('GET /vendor-types/:id - should return a specific vendor type', async () => {
    const response = await request(app).get('/vendor-types/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('vendor_type_id', 1);
    expect(response.body).toHaveProperty('vendor_type', 'Supplier');
  });
  
  // Test GET vendor type by ID - not found
  test('GET /vendor-types/:id - should return 404 for non-existent vendor type', async () => {
    const response = await request(app).get('/vendor-types/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor type not found');
  });
  
  // Test POST new vendor type
  test('POST /vendor-types - should create a new vendor type', async () => {
    const newVendorType = {
      vendor_type: 'Manufacturer'
    };
    
    const response = await request(app)
      .post('/vendor-types')
      .send(newVendorType);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('vendor_type_id', 3);
    expect(response.body).toHaveProperty('vendor_type', 'Manufacturer');
    
    // Verify vendor type was created
    const allVendorTypes = await request(app).get('/vendor-types');
    expect(allVendorTypes.body.length).toBe(3);
  });
  
  // Test POST vendor type - missing required field
  test('POST /vendor-types - should return 400 for missing vendor type', async () => {
    const incompleteVendorType = {
      // Missing vendor_type
    };
    
    const response = await request(app)
      .post('/vendor-types')
      .send(incompleteVendorType);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Vendor type is required');
  });
  
  // Test POST vendor type - duplicate value
  test('POST /vendor-types - should return 400 for duplicate vendor type', async () => {
    const duplicateVendorType = {
      vendor_type: 'Supplier' // Already exists
    };
    
    const response = await request(app)
      .post('/vendor-types')
      .send(duplicateVendorType);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Vendor type already exists');
  });
  
  // Test PUT update vendor type
  test('PUT /vendor-types/:id - should update an existing vendor type', async () => {
    const updatedData = {
      vendor_type: 'Updated Supplier'
    };
    
    const response = await request(app)
      .put('/vendor-types/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('vendor_type_id', 1);
    expect(response.body).toHaveProperty('vendor_type', 'Updated Supplier');
    
    // Verify vendor type was updated
    const vendorType = await request(app).get('/vendor-types/1');
    expect(vendorType.body.vendor_type).toBe('Updated Supplier');
  });
  
  // Test PUT vendor type - not found
  test('PUT /vendor-types/:id - should return 404 for non-existent vendor type', async () => {
    const updatedData = {
      vendor_type: 'Non-existent Type'
    };
    
    const response = await request(app)
      .put('/vendor-types/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor type not found');
  });
  
  // Test DELETE vendor type
  test('DELETE /vendor-types/:id - should delete a vendor type without references', async () => {
    // First insert a new vendor type without references
    const newType = await request(app)
      .post('/vendor-types')
      .send({ vendor_type: 'Temporary Type' });
    
    const typeId = newType.body.vendor_type_id;
    
    // Now delete it
    const response = await request(app).delete(`/vendor-types/${typeId}`);
    
    expect(response.status).toBe(204);
    
    // Verify vendor type was deleted
    const checkResponse = await request(app).get(`/vendor-types/${typeId}`);
    expect(checkResponse.status).toBe(404);
  });
  
  // Test DELETE vendor type with references
  test('DELETE /vendor-types/:id - should return 400 for vendor type with references', async () => {
    const response = await request(app).delete('/vendor-types/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete. Vendor type is referenced by existing vendors.');
  });
  
  // Test DELETE vendor type - not found
  test('DELETE /vendor-types/:id - should return 404 for non-existent vendor type', async () => {
    const response = await request(app).delete('/vendor-types/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor type not found');
  });
});
