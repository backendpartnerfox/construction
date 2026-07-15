// tests/client_requirement_package_customise_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_requirements (
      client_requirement_id SERIAL PRIMARY KEY,
      client_id INT,
      requirement_title VARCHAR(255),
      package_type VARCHAR(100),
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      package_id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      package_type VARCHAR(100),
      description TEXT,
      base_price DECIMAL(12,2)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_category VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS package_items_mapping (
      mapping_id SERIAL PRIMARY KEY,
      package_id INT,
      item_id INT,
      is_standard BOOLEAN DEFAULT TRUE,
      is_customizable BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (package_id) REFERENCES packages(package_id),
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_requirement_package_customise (
      customise_id SERIAL PRIMARY KEY,
      client_requirement_id INT NOT NULL,
      package_id INT NOT NULL,
      customise_name VARCHAR(255),
      customise_description TEXT,
      price_adjustment DECIMAL(12,2) DEFAULT 0,
      percentage_adjustment DECIMAL(5,2) DEFAULT 0,
      items_added TEXT[],
      items_removed TEXT[],
      special_conditions TEXT,
      is_approved BOOLEAN DEFAULT FALSE,
      approved_by INT,
      approved_date TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_requirement_id) REFERENCES client_requirements(client_requirement_id),
      FOREIGN KEY (package_id) REFERENCES packages(package_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS client_requirement_package_customise CASCADE');
  await pool.query('DROP TABLE IF EXISTS package_items_mapping CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS packages CASCADE');
  await pool.query('DROP TABLE IF EXISTS client_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM client_requirement_package_customise');
  await pool.query('DELETE FROM package_items_mapping');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM packages');
  await pool.query('DELETE FROM client_requirements');
  await pool.query('DELETE FROM clients');
  
  // Insert test data
  await pool.query(`
    INSERT INTO clients (client_id, client_name)
    VALUES 
      (1, 'ABC Corporation'),
      (2, 'XYZ Industries'),
      (3, 'Tech Solutions Ltd')
  `);
  
  await pool.query(`
    INSERT INTO packages (package_id, package_name, package_type, description, base_price)
    VALUES 
      (1, 'Basic Construction Package', 'Basic', 'Essential construction features', 1500000.00),
      (2, 'Premium Construction Package', 'Premium', 'All inclusive premium features', 3000000.00),
      (3, 'Luxury Construction Package', 'Luxury', 'Ultra luxury features', 5000000.00)
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category)
    VALUES 
      (1, 'TMT Bar', 'Structural'),
      (2, 'RMC', 'Concrete'),
      (3, 'Marble Flooring', 'Flooring'),
      (4, 'Premium Paint', 'Finishing')
  `);
  
  await pool.query(`
    INSERT INTO package_items_mapping (mapping_id, package_id, item_id, is_standard, is_customizable)
    VALUES 
      (1, 1, 1, true, false),
      (2, 1, 2, true, false),
      (3, 2, 1, true, false),
      (4, 2, 2, true, false),
      (5, 2, 3, true, true),
      (6, 3, 4, true, true)
  `);
  
  await pool.query(`
    INSERT INTO client_requirements (client_requirement_id, client_id, requirement_title, package_type)
    VALUES 
      (1, 1, 'Office Building Construction', 'Premium'),
      (2, 2, 'Warehouse Construction', 'Basic'),
      (3, 3, 'Luxury Villa', 'Luxury')
  `);
  
  await pool.query(`
    INSERT INTO client_requirement_package_customise (
      customise_id, client_requirement_id, package_id, customise_name,
      customise_description, price_adjustment, percentage_adjustment,
      items_added, items_removed, special_conditions, is_approved
    )
    VALUES 
      (1, 1, 2, 'Premium Plus', 'Added marble flooring', 200000.00, 0, '{Marble Flooring}', '{}', 'Premium marble only', true),
      (2, 2, 1, 'Basic Minimal', 'Reduced specifications', -100000.00, -5.0, '{}', '{Premium Paint}', 'Cost reduction focus', false),
      (3, 3, 3, 'Ultra Luxury', 'All premium additions', 500000.00, 10.0, '{Gold Fittings, Italian Marble}', '{}', 'No expense spared', true)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('clients_client_id_seq', 3)");
  await pool.query("SELECT setval('packages_package_id_seq', 3)");
  await pool.query("SELECT setval('items_item_id_seq', 4)");
  await pool.query("SELECT setval('package_items_mapping_mapping_id_seq', 6)");
  await pool.query("SELECT setval('client_requirements_client_requirement_id_seq', 3)");
  await pool.query("SELECT setval('client_requirement_package_customise_customise_id_seq', 3)");
});

describe('Client Requirement Package Customise API', () => {
  // Test GET all customisations
  test('GET /client-requirement-package-customise - should return all customisations', async () => {
    const response = await request(app).get('/client-requirement-package-customise');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('customise_id');
    expect(response.body[0]).toHaveProperty('customise_name');
    expect(response.body[0]).toHaveProperty('price_adjustment');
  });

  // Test GET customisation by ID
  test('GET /client-requirement-package-customise/:id - should return a specific customisation', async () => {
    const response = await request(app).get('/client-requirement-package-customise/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customise_id', 1);
    expect(response.body).toHaveProperty('customise_name', 'Premium Plus');
    expect(response.body).toHaveProperty('price_adjustment', '200000.00');
    expect(response.body).toHaveProperty('is_approved', true);
  });

  test('GET /client-requirement-package-customise/:id - should return 404 for non-existent customisation', async () => {
    const response = await request(app).get('/client-requirement-package-customise/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Customisation not found');
  });

  // Test GET customisations by client requirement
  test('GET /client-requirement-package-customise/requirement/:requirementId - should return customisations for a requirement', async () => {
    const response = await request(app).get('/client-requirement-package-customise/requirement/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].client_requirement_id).toBe(1);
  });

  // Test GET customisations by package
  test('GET /client-requirement-package-customise/package/:packageId - should return customisations for a package', async () => {
    const response = await request(app).get('/client-requirement-package-customise/package/2');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].package_id).toBe(2);
  });

  // Test POST new customisation
  test('POST /client-requirement-package-customise - should create a new customisation', async () => {
    const newCustomisation = {
      client_requirement_id: 2,
      package_id: 1,
      customise_name: 'Basic Enhanced',
      customise_description: 'Added some premium features to basic package',
      price_adjustment: 300000.00,
      percentage_adjustment: 20.0,
      items_added: ['Premium Tiles', 'Designer Lighting'],
      items_removed: [],
      special_conditions: 'Client specific requirements',
      is_approved: false
    };
    
    const response = await request(app)
      .post('/client-requirement-package-customise')
      .send(newCustomisation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('customise_id', 4);
    expect(response.body).toHaveProperty('customise_name', 'Basic Enhanced');
    expect(response.body).toHaveProperty('price_adjustment', '300000.00');
  });

  test('POST /client-requirement-package-customise - should return 400 for missing required fields', async () => {
    const incompleteCustomisation = {
      customise_name: 'Test Package'
    };
    
    const response = await request(app)
      .post('/client-requirement-package-customise')
      .send(incompleteCustomisation);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test PUT update customisation
  test('PUT /client-requirement-package-customise/:id - should update a customisation', async () => {
    const updatedData = {
      customise_name: 'Basic Minimal Updated',
      customise_description: 'Further cost reductions',
      price_adjustment: -150000.00,
      percentage_adjustment: -7.5,
      special_conditions: 'Budget constraints',
      is_approved: true,
      approved_by: 1,
      approved_date: '2024-01-20'
    };
    
    const response = await request(app)
      .put('/client-requirement-package-customise/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customise_id', 2);
    expect(response.body).toHaveProperty('customise_name', 'Basic Minimal Updated');
    expect(response.body).toHaveProperty('price_adjustment', '-150000.00');
    expect(response.body).toHaveProperty('is_approved', true);
  });

  test('PUT /client-requirement-package-customise/:id - should return 404 for non-existent customisation', async () => {
    const updatedData = {
      customise_name: 'Updated Name'
    };
    
    const response = await request(app)
      .put('/client-requirement-package-customise/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Customisation not found');
  });

  // Test DELETE customisation
  test('DELETE /client-requirement-package-customise/:id - should delete a customisation', async () => {
    const response = await request(app).delete('/client-requirement-package-customise/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Customisation deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/client-requirement-package-customise/2');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /client-requirement-package-customise/:id - should return 404 for non-existent customisation', async () => {
    const response = await request(app).delete('/client-requirement-package-customise/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Customisation not found');
  });

  // Test PATCH approve customisation
  test('PATCH /client-requirement-package-customise/:id/approve - should approve a customisation', async () => {
    const approvalData = {
      approved_by: 1,
      approved_date: '2024-01-20'
    };
    
    const response = await request(app)
      .patch('/client-requirement-package-customise/2/approve')
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_approved', true);
    expect(response.body).toHaveProperty('approved_by', 1);
  });

  // Test GET approved customisations
  test('GET /client-requirement-package-customise/approved - should return approved customisations', async () => {
    const response = await request(app).get('/client-requirement-package-customise/approved');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(customisation => {
      expect(customisation.is_approved).toBe(true);
    });
  });

  // Test GET pending customisations
  test('GET /client-requirement-package-customise/pending - should return pending customisations', async () => {
    const response = await request(app).get('/client-requirement-package-customise/pending');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    response.body.forEach(customisation => {
      expect(customisation.is_approved).toBe(false);
    });
  });

  // Test GET customisation summary
  test('GET /client-requirement-package-customise/summary/:requirementId - should return customisation summary', async () => {
    const response = await request(app).get('/client-requirement-package-customise/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_customisations');
    expect(response.body).toHaveProperty('total_price_adjustment');
    expect(response.body).toHaveProperty('approved_count');
    expect(response.body).toHaveProperty('pending_count');
  });
});
