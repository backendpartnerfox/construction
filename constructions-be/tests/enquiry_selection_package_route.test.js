// tests/enquiry_selection_package_route.test.js
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
      enquiry_number VARCHAR(50) UNIQUE,
      contact_person_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INT NOT NULL,
      display_name VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_selection_package (
      id SERIAL PRIMARY KEY,
      enquiry_id INT NOT NULL,
      package_id INT NOT NULL,
      item_id INT NOT NULL,
      default_choice_id INT NOT NULL,
      default_choice_price DECIMAL(12,2) NOT NULL,
      selected_choice_id INT NOT NULL,
      selected_choice_price DECIMAL(12,2) NOT NULL,
      price_difference DECIMAL(12,2) GENERATED ALWAYS AS (selected_choice_price - default_choice_price) STORED,
      gst_percentage DECIMAL(5,2) DEFAULT 18.00,
      gst_on_difference DECIMAL(12,2) GENERATED ALWAYS AS ((selected_choice_price - default_choice_price) * gst_percentage / 100) STORED,
      total_difference DECIMAL(12,2) GENERATED ALWAYS AS ((selected_choice_price - default_choice_price) * (1 + gst_percentage / 100)) STORED,
      is_approved BOOLEAN DEFAULT FALSE,
      approved_by INT,
      approved_at TIMESTAMP WITH TIME ZONE,
      remarks TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (default_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (selected_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS enquiry_selection_package CASCADE');
  await pool.query('DROP TABLE IF EXISTS item_choices CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS packages CASCADE');
  await pool.query('DROP TABLE IF EXISTS enquiries CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM enquiry_selection_package');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM packages');
  await pool.query('DELETE FROM enquiries');
  await pool.query('DELETE FROM users');
  
  // Insert test data
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name)
    VALUES 
      (1, 'ENQ-2024-001', 'John Doe'),
      (2, 'ENQ-2024-002', 'Jane Smith')
  `);

  await pool.query(`
    INSERT INTO packages (id, package_name)
    VALUES 
      (1, 'Basic Package'),
      (2, 'Premium Package')
  `);

  await pool.query(`
    INSERT INTO items (item_id, item_name)
    VALUES 
      (1, 'TMT Bar'),
      (2, 'RMC')
  `);

  await pool.query(`
    INSERT INTO item_choices (choice_option_id, item_id, display_name)
    VALUES 
      (1, 1, 'TATA Steel TMT'),
      (2, 1, 'JSW Steel TMT'),
      (3, 2, 'Ultratech RMC'),
      (4, 2, 'ACC RMC')
  `);

  await pool.query(`
    INSERT INTO users (id, username, email)
    VALUES 
      (1, 'admin', 'admin@example.com'),
      (2, 'manager', 'manager@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 2)");
  await pool.query("SELECT setval('packages_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 4)");
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('enquiry_selection_package_id_seq', 1, false)");
});

describe('Enquiry Selection Package API', () => {
  // Test GET all selections
  test('GET /enquiry-selection-package - should return all selections', async () => {
    // Insert test selection
    await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price)
      VALUES (1, 1, 1, 1, 1000.00, 2, 1200.00)
    `);

    const response = await request(app).get('/enquiry-selection-package');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('enquiry_id', 1);
    expect(response.body[0]).toHaveProperty('price_difference', '200.00');
  });

  // Test GET with filters
  test('GET /enquiry-selection-package - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price, is_approved, approved_by)
      VALUES 
        (1, 1, 1, 1, 1000.00, 2, 1200.00, false, NULL),
        (2, 1, 1, 1, 1000.00, 2, 1300.00, true, 1),
        (1, 2, 2, 3, 2000.00, 4, 2500.00, false, NULL)
    `);

    // Filter by enquiry_id
    const response1 = await request(app).get('/enquiry-selection-package?enquiry_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by package_id
    const response2 = await request(app).get('/enquiry-selection-package?package_id=2');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by is_approved
    const response3 = await request(app).get('/enquiry-selection-package?is_approved=true');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /enquiry-selection-package/:id - should return specific selection', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price)
      VALUES (1, 1, 1, 1, 1000.00, 2, 1200.00)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app).get(`/enquiry-selection-package/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', id);
    expect(response.body).toHaveProperty('enquiry_number', 'ENQ-2024-001');
    expect(response.body).toHaveProperty('package_name', 'Basic Package');
  });

  // Test GET by ID - not found
  test('GET /enquiry-selection-package/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/enquiry-selection-package/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry package selection not found');
  });

  // Test GET by enquiry ID
  test('GET /enquiry-selection-package/enquiry/:enquiryId - should return selections for enquiry', async () => {
    await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price)
      VALUES 
        (1, 1, 1, 1, 1000.00, 2, 1200.00),
        (1, 1, 2, 3, 2000.00, 4, 2500.00)
    `);

    const response = await request(app).get('/enquiry-selection-package/enquiry/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });

  // Test POST new selection
  test('POST /enquiry-selection-package - should create new selection', async () => {
    const newSelection = {
      enquiry_id: 1,
      package_id: 1,
      item_id: 1,
      default_choice_id: 1,
      default_choice_price: 1000.00,
      selected_choice_id: 2,
      selected_choice_price: 1200.00,
      gst_percentage: 18.00,
      remarks: 'Customer preference'
    };

    const response = await request(app)
      .post('/enquiry-selection-package')
      .send(newSelection);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('price_difference', '200.00');
    expect(response.body).toHaveProperty('total_difference', '236.00'); // 200 + 18% GST
  });

  // Test POST - missing required fields
  test('POST /enquiry-selection-package - should return 400 for missing fields', async () => {
    const incompleteData = {
      enquiry_id: 1,
      package_id: 1
    };

    const response = await request(app)
      .post('/enquiry-selection-package')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test POST - invalid references
  test('POST /enquiry-selection-package - should return 404 for invalid references', async () => {
    const invalidData = {
      enquiry_id: 999,
      package_id: 1,
      item_id: 1,
      default_choice_id: 1,
      default_choice_price: 1000.00,
      selected_choice_id: 2,
      selected_choice_price: 1200.00
    };

    const response = await request(app)
      .post('/enquiry-selection-package')
      .send(invalidData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry not found');
  });

  // Test PUT update
  test('PUT /enquiry-selection-package/:id - should update selection', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price)
      VALUES (1, 1, 1, 1, 1000.00, 2, 1200.00)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const updateData = {
      selected_choice_id: 2,
      selected_choice_price: 1500.00,
      remarks: 'Price updated'
    };

    const response = await request(app)
      .put(`/enquiry-selection-package/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selected_choice_price', '1500.00');
    expect(response.body).toHaveProperty('price_difference', '500.00');
  });

  // Test PATCH approve
  test('PATCH /enquiry-selection-package/:id/approve - should approve selection', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price)
      VALUES (1, 1, 1, 1, 1000.00, 2, 1200.00)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const approvalData = {
      approved_by: 1,
      remarks: 'Approved by admin'
    };

    const response = await request(app)
      .patch(`/enquiry-selection-package/${id}/approve`)
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_approved', true);
    expect(response.body).toHaveProperty('approved_by', 1);
    expect(response.body).toHaveProperty('approved_at');
  });

  // Test DELETE
  test('DELETE /enquiry-selection-package/:id - should delete selection', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price)
      VALUES (1, 1, 1, 1, 1000.00, 2, 1200.00)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app).delete(`/enquiry-selection-package/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Enquiry package selection deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM enquiry_selection_package WHERE id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });

  // Test DELETE - approved selection
  test('DELETE /enquiry-selection-package/:id - should not delete approved selection', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price, is_approved, approved_by)
      VALUES (1, 1, 1, 1, 1000.00, 2, 1200.00, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app).delete(`/enquiry-selection-package/${id}`);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete approved selection. Remove approval first.');
  });

  // Test GET summary
  test('GET /enquiry-selection-package/enquiry/:enquiryId/summary - should return summary', async () => {
    await pool.query(`
      INSERT INTO enquiry_selection_package 
      (enquiry_id, package_id, item_id, default_choice_id, default_choice_price, selected_choice_id, selected_choice_price, is_approved, approved_by)
      VALUES 
        (1, 1, 1, 1, 1000.00, 2, 1200.00, true, 1),
        (1, 1, 2, 3, 2000.00, 4, 2500.00, false, NULL)
    `);

    const response = await request(app).get('/enquiry-selection-package/enquiry/1/summary');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_selections', '2');
    expect(response.body).toHaveProperty('total_price_difference', '700.00');
    expect(response.body).toHaveProperty('approved_selections', '1');
    expect(response.body).toHaveProperty('pending_selections', '1');
  });
});
