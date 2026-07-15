// tests/client_requirement_package_item_choice_customise_route.test.js
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
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      package_id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL
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
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INT,
      display_name VARCHAR(255),
      description TEXT,
      is_premium BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_requirement_package_customise (
      customise_id SERIAL PRIMARY KEY,
      client_requirement_id INT,
      package_id INT,
      customise_name VARCHAR(255),
      FOREIGN KEY (client_requirement_id) REFERENCES client_requirements(client_requirement_id),
      FOREIGN KEY (package_id) REFERENCES packages(package_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_requirement_package_item_choice_customise (
      item_choice_customise_id SERIAL PRIMARY KEY,
      client_requirement_id INT NOT NULL,
      package_customise_id INT NOT NULL,
      item_id INT NOT NULL,
      original_choice_id INT,
      new_choice_id INT NOT NULL,
      customise_reason TEXT,
      price_difference DECIMAL(12,2) DEFAULT 0,
      is_upgrade BOOLEAN DEFAULT FALSE,
      additional_specifications TEXT,
      quantity_change INT DEFAULT 0,
      is_approved BOOLEAN DEFAULT FALSE,
      approved_by INT,
      approved_date TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_requirement_id) REFERENCES client_requirements(client_requirement_id),
      FOREIGN KEY (package_customise_id) REFERENCES client_requirement_package_customise(customise_id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (original_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (new_choice_id) REFERENCES item_choices(choice_option_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS client_requirement_package_item_choice_customise CASCADE');
  await pool.query('DROP TABLE IF EXISTS client_requirement_package_customise CASCADE');
  await pool.query('DROP TABLE IF EXISTS item_choices CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS packages CASCADE');
  await pool.query('DROP TABLE IF EXISTS client_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM client_requirement_package_item_choice_customise');
  await pool.query('DELETE FROM client_requirement_package_customise');
  await pool.query('DELETE FROM item_choices');
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
    INSERT INTO packages (package_id, package_name)
    VALUES 
      (1, 'Basic Package'),
      (2, 'Premium Package'),
      (3, 'Luxury Package')
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category)
    VALUES 
      (1, 'TMT Bar', 'Structural'),
      (2, 'Flooring', 'Finishing'),
      (3, 'Paint', 'Finishing'),
      (4, 'Doors', 'Fixtures')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (choice_option_id, item_id, display_name, description, is_premium)
    VALUES 
      (1, 1, 'TATA FE 500D', 'Standard TMT bars', false),
      (2, 1, 'TATA FE 600D', 'Premium TMT bars', true),
      (3, 2, 'Ceramic Tiles', 'Standard ceramic tiles', false),
      (4, 2, 'Marble Flooring', 'Premium marble flooring', true),
      (5, 3, 'Asian Paints', 'Standard paint', false),
      (6, 3, 'Berger Premium', 'Premium paint', true),
      (7, 4, 'Flush Doors', 'Standard doors', false),
      (8, 4, 'Teak Wood Doors', 'Premium teak doors', true)
  `);
  
  await pool.query(`
    INSERT INTO client_requirements (client_requirement_id, client_id, requirement_title)
    VALUES 
      (1, 1, 'Office Building Construction'),
      (2, 2, 'Warehouse Construction'),
      (3, 3, 'Luxury Villa')
  `);
  
  await pool.query(`
    INSERT INTO client_requirement_package_customise (customise_id, client_requirement_id, package_id, customise_name)
    VALUES 
      (1, 1, 2, 'Premium Plus'),
      (2, 2, 1, 'Basic Enhanced'),
      (3, 3, 3, 'Ultra Luxury')
  `);
  
  await pool.query(`
    INSERT INTO client_requirement_package_item_choice_customise (
      item_choice_customise_id, client_requirement_id, package_customise_id, item_id,
      original_choice_id, new_choice_id, customise_reason, price_difference,
      is_upgrade, additional_specifications, quantity_change, is_approved
    )
    VALUES 
      (1, 1, 1, 1, 1, 2, 'Higher strength required', 50000.00, true, 'For high-rise structure', 0, true),
      (2, 1, 1, 2, 3, 4, 'Client preference for marble', 200000.00, true, 'Italian marble preferred', 0, false),
      (3, 2, 2, 3, 5, 6, 'Better finish quality', 30000.00, true, 'Weather resistant coating', 0, false),
      (4, 3, 3, 4, 7, 8, 'Luxury requirement', 150000.00, true, 'Carved teak doors', 2, true)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('clients_client_id_seq', 3)");
  await pool.query("SELECT setval('packages_package_id_seq', 3)");
  await pool.query("SELECT setval('items_item_id_seq', 4)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 8)");
  await pool.query("SELECT setval('client_requirements_client_requirement_id_seq', 3)");
  await pool.query("SELECT setval('client_requirement_package_customise_customise_id_seq', 3)");
  await pool.query("SELECT setval('client_requirement_package_item_choice_customise_item_choice_customise_id_seq', 4)");
});

describe('Client Requirement Package Item Choice Customise API', () => {
  // Test GET all item choice customisations
  test('GET /client-requirement-package-item-choice-customise - should return all item choice customisations', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('item_choice_customise_id');
    expect(response.body[0]).toHaveProperty('customise_reason');
    expect(response.body[0]).toHaveProperty('price_difference');
  });

  // Test GET item choice customisation by ID
  test('GET /client-requirement-package-item-choice-customise/:id - should return a specific item choice customisation', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_choice_customise_id', 1);
    expect(response.body).toHaveProperty('customise_reason', 'Higher strength required');
    expect(response.body).toHaveProperty('price_difference', '50000.00');
    expect(response.body).toHaveProperty('is_upgrade', true);
  });

  test('GET /client-requirement-package-item-choice-customise/:id - should return 404 for non-existent customisation', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice customisation not found');
  });

  // Test GET customisations by client requirement
  test('GET /client-requirement-package-item-choice-customise/requirement/:requirementId - should return customisations for a requirement', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/requirement/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(customisation => {
      expect(customisation.client_requirement_id).toBe(1);
    });
  });

  // Test GET customisations by package customise
  test('GET /client-requirement-package-item-choice-customise/package-customise/:packageCustomiseId - should return customisations for a package customise', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/package-customise/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(customisation => {
      expect(customisation.package_customise_id).toBe(1);
    });
  });

  // Test GET customisations by item
  test('GET /client-requirement-package-item-choice-customise/item/:itemId - should return customisations for an item', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/item/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].item_id).toBe(1);
  });

  // Test POST new item choice customisation
  test('POST /client-requirement-package-item-choice-customise - should create a new item choice customisation', async () => {
    const newCustomisation = {
      client_requirement_id: 2,
      package_customise_id: 2,
      item_id: 4,
      original_choice_id: 7,
      new_choice_id: 8,
      customise_reason: 'Client wants premium doors',
      price_difference: 100000.00,
      is_upgrade: true,
      additional_specifications: 'Brass handles required',
      quantity_change: 1,
      is_approved: false
    };
    
    const response = await request(app)
      .post('/client-requirement-package-item-choice-customise')
      .send(newCustomisation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('item_choice_customise_id', 5);
    expect(response.body).toHaveProperty('customise_reason', 'Client wants premium doors');
    expect(response.body).toHaveProperty('price_difference', '100000.00');
  });

  test('POST /client-requirement-package-item-choice-customise - should return 400 for missing required fields', async () => {
    const incompleteCustomisation = {
      customise_reason: 'Test reason'
    };
    
    const response = await request(app)
      .post('/client-requirement-package-item-choice-customise')
      .send(incompleteCustomisation);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test PUT update item choice customisation
  test('PUT /client-requirement-package-item-choice-customise/:id - should update an item choice customisation', async () => {
    const updatedData = {
      customise_reason: 'Updated reason - Higher quality marble needed',
      price_difference: 250000.00,
      additional_specifications: 'Imported Italian marble with specific pattern',
      is_approved: true,
      approved_by: 1,
      approved_date: '2024-01-20'
    };
    
    const response = await request(app)
      .put('/client-requirement-package-item-choice-customise/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item_choice_customise_id', 2);
    expect(response.body).toHaveProperty('customise_reason', 'Updated reason - Higher quality marble needed');
    expect(response.body).toHaveProperty('price_difference', '250000.00');
    expect(response.body).toHaveProperty('is_approved', true);
  });

  test('PUT /client-requirement-package-item-choice-customise/:id - should return 404 for non-existent customisation', async () => {
    const updatedData = {
      customise_reason: 'Updated reason'
    };
    
    const response = await request(app)
      .put('/client-requirement-package-item-choice-customise/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice customisation not found');
  });

  // Test DELETE item choice customisation
  test('DELETE /client-requirement-package-item-choice-customise/:id - should delete an item choice customisation', async () => {
    const response = await request(app).delete('/client-requirement-package-item-choice-customise/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Item choice customisation deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/client-requirement-package-item-choice-customise/3');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /client-requirement-package-item-choice-customise/:id - should return 404 for non-existent customisation', async () => {
    const response = await request(app).delete('/client-requirement-package-item-choice-customise/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item choice customisation not found');
  });

  // Test PATCH approve customisation
  test('PATCH /client-requirement-package-item-choice-customise/:id/approve - should approve a customisation', async () => {
    const approvalData = {
      approved_by: 1,
      approved_date: '2024-01-20'
    };
    
    const response = await request(app)
      .patch('/client-requirement-package-item-choice-customise/3/approve')
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_approved', true);
    expect(response.body).toHaveProperty('approved_by', 1);
  });

  // Test GET upgrades only
  test('GET /client-requirement-package-item-choice-customise/upgrades - should return only upgrade customisations', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/upgrades');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    response.body.forEach(customisation => {
      expect(customisation.is_upgrade).toBe(true);
    });
  });

  // Test GET approved customisations
  test('GET /client-requirement-package-item-choice-customise/approved - should return approved customisations', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/approved');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(customisation => {
      expect(customisation.is_approved).toBe(true);
    });
  });

  // Test GET customisation summary
  test('GET /client-requirement-package-item-choice-customise/summary/:requirementId - should return customisation summary', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_customisations');
    expect(response.body).toHaveProperty('total_price_impact');
    expect(response.body).toHaveProperty('total_upgrades');
    expect(response.body).toHaveProperty('approved_count');
    expect(response.body).toHaveProperty('pending_count');
  });

  // Test GET price impact summary
  test('GET /client-requirement-package-item-choice-customise/price-impact/:packageCustomiseId - should return price impact summary', async () => {
    const response = await request(app).get('/client-requirement-package-item-choice-customise/price-impact/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_price_increase');
    expect(response.body).toHaveProperty('item_wise_impact');
    expect(Array.isArray(response.body.item_wise_impact)).toBeTruthy();
  });
});
