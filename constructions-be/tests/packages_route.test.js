// tests/packages_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      total_price_per_sqft NUMERIC NOT NULL,
      gst_percentage NUMERIC DEFAULT 18.00,
      base_price_per_sqft NUMERIC,
      gst_amount_per_sqft NUMERIC,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS package_items_mapping (
      id SERIAL PRIMARY KEY,
      package_id INTEGER REFERENCES packages(id),
      item_id INTEGER,
      item_choice_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_selection_package (
      id SERIAL PRIMARY KEY,
      package_id INTEGER REFERENCES packages(id),
      enquiry_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_selection_package (
      id SERIAL PRIMARY KEY,
      package_id INTEGER REFERENCES packages(id),
      lead_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS lead_selection_package');
  await pool.query('DROP TABLE IF EXISTS enquiry_selection_package');
  await pool.query('DROP TABLE IF EXISTS package_items_mapping');
  await pool.query('DROP TABLE IF EXISTS packages');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM lead_selection_package');
  await pool.query('DELETE FROM enquiry_selection_package');
  await pool.query('DELETE FROM package_items_mapping');
  await pool.query('DELETE FROM packages');
  
  // Insert test data
  await pool.query(`
    INSERT INTO packages (id, package_name, total_price_per_sqft, gst_percentage, base_price_per_sqft, gst_amount_per_sqft)
    VALUES 
      (1, 'Basic Package', 1500.00, 18.00, 1271.19, 228.81),
      (2, 'Premium Package', 2500.00, 18.00, 2118.64, 381.36),
      (3, 'Luxury Package', 3500.00, 18.00, 2966.10, 533.90)
  `);
  
  await pool.query(`
    INSERT INTO package_items_mapping (id, package_id, item_id, item_choice_id)
    VALUES 
      (1, 1, 101, 201),
      (2, 1, 102, 202),
      (3, 2, 103, 203)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('packages_id_seq', 3)");
  await pool.query("SELECT setval('package_items_mapping_id_seq', 3)");
});

describe('Packages API', () => {
  // Test GET all packages
  test('GET /packages - should return all packages', async () => {
    const response = await request(app).get('/packages');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('package_name');
    expect(response.body[0]).toHaveProperty('total_price_per_sqft');
    expect(response.body[0]).toHaveProperty('gst_percentage');
    
    // Check package names are ordered
    const packageNames = response.body.map(pkg => pkg.package_name);
    expect(packageNames).toContain('Basic Package');
    expect(packageNames).toContain('Premium Package');
    expect(packageNames).toContain('Luxury Package');
  });
  
  // Test GET package by ID
  test('GET /packages/:id - should return a specific package', async () => {
    const response = await request(app).get('/packages/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('package_name', 'Basic Package');
    expect(response.body).toHaveProperty('total_price_per_sqft', '1500.00');
    expect(response.body).toHaveProperty('gst_percentage', '18.00');
  });
  
  // Test GET package by ID - not found
  test('GET /packages/:id - should return 404 for non-existent package', async () => {
    const response = await request(app).get('/packages/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package not found');
  });
  
  // Test POST new package
  test('POST /packages - should create a new package', async () => {
    const newPackage = {
      package_name: 'Super Luxury Package',
      total_price_per_sqft: 4500.00,
      gst_percentage: 18.00,
      base_price_per_sqft: 3813.56,
      gst_amount_per_sqft: 686.44
    };
    
    const response = await request(app)
      .post('/packages')
      .send(newPackage);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 4);
    expect(response.body).toHaveProperty('package_name', 'Super Luxury Package');
    expect(response.body).toHaveProperty('total_price_per_sqft', '4500.00');
    
    // Verify package was actually created
    const allPackages = await request(app).get('/packages');
    expect(allPackages.body.length).toBe(4);
  });
  
  // Test POST package - missing required fields
  test('POST /packages - should return 400 for missing package_name', async () => {
    const incompletePackage = {
      total_price_per_sqft: 2000.00
      // Missing package_name
    };
    
    const response = await request(app)
      .post('/packages')
      .send(incompletePackage);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Package name is required');
  });
  
  // Test POST package - missing total_price_per_sqft
  test('POST /packages - should return 400 for missing total_price_per_sqft', async () => {
    const incompletePackage = {
      package_name: 'Test Package'
      // Missing total_price_per_sqft
    };
    
    const response = await request(app)
      .post('/packages')
      .send(incompletePackage);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Total price per sqft is required');
  });
  
  // Test PUT update package
  test('PUT /packages/:id - should update a package', async () => {
    const updatedData = {
      package_name: 'Updated Basic Package',
      total_price_per_sqft: 1600.00,
      gst_percentage: 18.00
    };
    
    const response = await request(app)
      .put('/packages/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('package_name', 'Updated Basic Package');
    expect(response.body).toHaveProperty('total_price_per_sqft', '1600.00');
    
    // Verify package was actually updated
    const updatedPackage = await request(app).get('/packages/1');
    expect(updatedPackage.body.package_name).toBe('Updated Basic Package');
  });
  
  // Test PUT package - not found
  test('PUT /packages/:id - should return 404 for non-existent package', async () => {
    const updatedData = {
      package_name: 'Non-existent Package',
      total_price_per_sqft: 2000.00
    };
    
    const response = await request(app)
      .put('/packages/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package not found');
  });
  
  // Test DELETE package - success
  test('DELETE /packages/:id - should delete a package with no dependencies', async () => {
    const response = await request(app).delete('/packages/3'); // Luxury Package with no dependencies
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Package deleted successfully');
    
    // Verify package was actually deleted
    const deletedPackage = await request(app).get('/packages/3');
    expect(deletedPackage.status).toBe(404);
  });
  
  // Test DELETE package - with dependencies
  test('DELETE /packages/:id - should return 400 for package with dependencies', async () => {
    const response = await request(app).delete('/packages/1'); // Basic Package has items mapping
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete package because it has associated items, enquiries, or leads. Remove dependencies first.');
  });
  
  // Test DELETE package - not found
  test('DELETE /packages/:id - should return 404 for non-existent package', async () => {
    const response = await request(app).delete('/packages/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package not found');
  });
  
  // Test search packages by name
  test('GET /packages/search/:name - should search packages by name', async () => {
    const response = await request(app).get('/packages/search/basic');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('package_name', 'Basic Package');
    
    // Search for multiple results
    const multiResponse = await request(app).get('/packages/search/package');
    expect(multiResponse.status).toBe(200);
    expect(multiResponse.body.length).toBe(3);
    
    // Search with no results
    const emptyResponse = await request(app).get('/packages/search/nonexistent');
    expect(emptyResponse.status).toBe(200);
    expect(emptyResponse.body.length).toBe(0);
  });
  
  // Test get package items
  test('GET /packages/:id/items - should return items for a package', async () => {
    const response = await request(app).get('/packages/1/items');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Basic Package has 2 items
    expect(response.body[0]).toHaveProperty('package_id', 1);
    expect(response.body[0]).toHaveProperty('item_id');
  });
  
  // Test get package items - package not found
  test('GET /packages/:id/items - should return 404 for non-existent package', async () => {
    const response = await request(app).get('/packages/999/items');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Package not found');
  });
});