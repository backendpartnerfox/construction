// tests/vendors.test.js
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
      vendor_type_id INTEGER REFERENCES vendor_type(vendor_type_id),
      contact_person VARCHAR(100),
      contact_number VARCHAR(20),
      email VARCHAR(100),
      address TEXT
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
    INSERT INTO vendors (vendor_id, vendor_name, vendor_type_id, contact_person, contact_number, email, address)
    VALUES 
      (1, 'ABC Suppliers', 1, 'John Smith', '1234567890', 'john@abcsuppliers.com', '123 Supply St'),
      (2, 'XYZ Contractors', 2, 'Jane Doe', '9876543210', 'jane@xyzcontractors.com', '456 Builder Ave')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('vendor_type_vendor_type_id_seq', 2)");
  await pool.query("SELECT setval('vendors_vendor_id_seq', 2)");
});

describe('Vendors API', () => {
  // Test GET all vendors
  test('GET /vendors - should return all vendors', async () => {
    const response = await request(app).get('/vendors');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('vendor_id', 1);
    expect(response.body[0]).toHaveProperty('vendor_name', 'ABC Suppliers');
    expect(response.body[0]).toHaveProperty('vendor_type_id', 1);
    expect(response.body[1]).toHaveProperty('vendor_name', 'XYZ Contractors');
  });
  
  // Test GET vendor by ID
  test('GET /vendors/:id - should return a specific vendor', async () => {
    const response = await request(app).get('/vendors/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('vendor_id', 1);
    expect(response.body).toHaveProperty('vendor_name', 'ABC Suppliers');
    expect(response.body).toHaveProperty('contact_person', 'John Smith');
    expect(response.body).toHaveProperty('email', 'john@abcsuppliers.com');
  });
  
  // Test GET vendor by ID - not found
  test('GET /vendors/:id - should return 404 for non-existent vendor', async () => {
    const response = await request(app).get('/vendors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor not found');
  });
  
  // Test GET vendors by type
  test('GET /vendors/type/:vendorTypeId - should return vendors of a specific type', async () => {
    const response = await request(app).get('/vendors/type/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('vendor_name', 'ABC Suppliers');
    expect(response.body[0]).toHaveProperty('vendor_type_id', 1);
  });
  
  // Test POST new vendor
  test('POST /vendors - should create a new vendor', async () => {
    const newVendor = {
      vendor_name: 'PQR Manufacturers',
      vendor_type_id: 1,
      contact_person: 'Bob Johnson',
      contact_number: '5555555555',
      email: 'bob@pqrmanufacturers.com',
      address: '789 Manufacturing Blvd'
    };
    
    const response = await request(app)
      .post('/vendors')
      .send(newVendor);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('vendor_id', 3);
    expect(response.body).toHaveProperty('vendor_name', 'PQR Manufacturers');
    expect(response.body).toHaveProperty('contact_person', 'Bob Johnson');
    
    // Verify vendor was created
    const allVendors = await request(app).get('/vendors');
    expect(allVendors.body.length).toBe(3);
  });
  
  // Test POST vendor - missing required field
  test('POST /vendors - should return 400 for missing vendor name', async () => {
    const incompleteVendor = {
      vendor_type_id: 1,
      contact_person: 'Missing Name'
      // Missing vendor_name
    };
    
    const response = await request(app)
      .post('/vendors')
      .send(incompleteVendor);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Vendor name is required');
  });
  
  // Test POST vendor - invalid vendor type
  test('POST /vendors - should return 400 for invalid vendor type', async () => {
    const vendorWithInvalidType = {
      vendor_name: 'Invalid Type Vendor',
      vendor_type_id: 999, // Non-existent vendor type
      contact_person: 'Test Person'
    };
    
    const response = await request(app)
      .post('/vendors')
      .send(vendorWithInvalidType);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid vendor type');
  });
  
  // Test PUT update vendor
  test('PUT /vendors/:id - should update an existing vendor', async () => {
    const updatedData = {
      vendor_name: 'ABC Suppliers Updated',
      vendor_type_id: 1,
      contact_person: 'John Smith Jr',
      contact_number: '1234567899',
      email: 'john.jr@abcsuppliers.com',
      address: '123 Supply Street, Suite 100'
    };
    
    const response = await request(app)
      .put('/vendors/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('vendor_id', 1);
    expect(response.body).toHaveProperty('vendor_name', 'ABC Suppliers Updated');
    expect(response.body).toHaveProperty('contact_person', 'John Smith Jr');
    expect(response.body).toHaveProperty('email', 'john.jr@abcsuppliers.com');
    
    // Verify vendor was updated
    const vendor = await request(app).get('/vendors/1');
    expect(vendor.body.vendor_name).toBe('ABC Suppliers Updated');
    expect(vendor.body.contact_person).toBe('John Smith Jr');
  });
  
  // Test PUT vendor - not found
  test('PUT /vendors/:id - should return 404 for non-existent vendor', async () => {
    const updatedData = {
      vendor_name: 'Non-existent Vendor',
      vendor_type_id: 1
    };
    
    const response = await request(app)
      .put('/vendors/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor not found');
  });
  
  // Test DELETE vendor
  test('DELETE /vendors/:id - should delete a vendor', async () => {
    const response = await request(app).delete('/vendors/2');
    
    expect(response.status).toBe(204);
    
    // Verify vendor was deleted
    const checkResponse = await request(app).get('/vendors/2');
    expect(checkResponse.status).toBe(404);
    
    const allVendors = await request(app).get('/vendors');
    expect(allVendors.body.length).toBe(1);
  });
  
  // Test DELETE vendor - not found
  test('DELETE /vendors/:id - should return 404 for non-existent vendor', async () => {
    const response = await request(app).delete('/vendors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Vendor not found');
  });
});
