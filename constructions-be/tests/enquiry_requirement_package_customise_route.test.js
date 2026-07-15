// tests/enquiry_requirement_package_customise_route.test.js
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
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_unit VARCHAR(20),
      item_category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INT NOT NULL,
      item_material_type VARCHAR(100),
      brand VARCHAR(100),
      display_name VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20),
      status VARCHAR(20) DEFAULT 'Active'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_requirement_package_item_choice_customise (
      id SERIAL PRIMARY KEY,
      package_id INT NOT NULL,
      item_id INT NOT NULL,
      item_choice_id INT NOT NULL,
      choice_status BOOLEAN NOT NULL,
      effective_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      effective_end_date TIMESTAMP WITH TIME ZONE,
      is_current BOOLEAN DEFAULT TRUE,
      version INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (item_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
    )
  `);

  // Create function for history tracking
  await pool.query(`
    CREATE OR REPLACE FUNCTION get_enquiry_req_choice_customise_history(
      p_package_id INT,
      p_item_id INT,
      p_item_choice_id INT
    )
    RETURNS TABLE (
      id INT,
      package_id INT,
      item_id INT,
      item_choice_id INT,
      choice_status BOOLEAN,
      effective_start_date TIMESTAMP WITH TIME ZONE,
      effective_end_date TIMESTAMP WITH TIME ZONE,
      is_current BOOLEAN,
      version INT,
      created_at TIMESTAMP WITH TIME ZONE,
      created_by INT,
      updated_at TIMESTAMP WITH TIME ZONE,
      updated_by INT
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT * FROM enquiry_requirement_package_item_choice_customise
      WHERE enquiry_requirement_package_item_choice_customise.package_id = p_package_id 
        AND enquiry_requirement_package_item_choice_customise.item_id = p_item_id
        AND enquiry_requirement_package_item_choice_customise.item_choice_id = p_item_choice_id
      ORDER BY version DESC;
    END;
    $$ LANGUAGE plpgsql;
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS enquiry_requirement_package_item_choice_customise CASCADE');
  await pool.query('DROP TABLE IF EXISTS item_choices CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS packages CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP FUNCTION IF EXISTS get_enquiry_req_choice_customise_history');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM enquiry_requirement_package_item_choice_customise');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM packages');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO packages (id, package_name, description, is_active)
    VALUES 
      (1, 'Basic Package', 'Basic construction package', true),
      (2, 'Premium Package', 'Premium construction package', true)
  `);

  await pool.query(`
    INSERT INTO items (item_id, item_name, item_description, item_unit, item_category, is_active)
    VALUES 
      (1, 'TMT Bar', 'Thermo-Mechanically Treated reinforcement steel bars', 'kg', 'Structural', true),
      (2, 'RMC', 'Ready Mix Concrete', 'cum', 'Concrete', true)
  `);

  await pool.query(`
    INSERT INTO item_choices (choice_option_id, item_id, item_material_type, brand, display_name, is_active)
    VALUES 
      (1, 1, 'Steel', 'TATA', 'TATA Steel TMT Bar', true),
      (2, 1, 'Steel', 'JSW', 'JSW Steel TMT Bar', true),
      (3, 2, 'Concrete', 'Ultratech', 'Ultratech RMC', true)
  `);

  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email, phone)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com', '1234567890'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com', '0987654321')
  `);

  // Reset sequences
  await pool.query("SELECT setval('packages_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('enquiry_requirement_package_item_choice_customise_id_seq', 1, false)");
});

describe('Enquiry Requirement Package Customise API', () => {
  // Test GET all customizations
  test('GET /enquiry-requirement-package-customise - should return all current customizations', async () => {
    // Insert test customization
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, true, 1)
    `);

    const response = await request(app).get('/enquiry-requirement-package-customise');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('package_id', 1);
    expect(response.body[0]).toHaveProperty('item_id', 1);
    expect(response.body[0]).toHaveProperty('choice_status', true);
    expect(response.body[0]).toHaveProperty('is_current', true);
  });

  // Test GET with filters
  test('GET /enquiry-requirement-package-customise - should filter by package_id', async () => {
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES 
        (1, 1, 1, true, 1),
        (2, 1, 2, true, 1)
    `);

    const response = await request(app).get('/enquiry-requirement-package-customise?package_id=1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('package_id', 1);
  });

  // Test GET by ID
  test('GET /enquiry-requirement-package-customise/:id - should return specific customization', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app).get(`/enquiry-requirement-package-customise/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', id);
    expect(response.body).toHaveProperty('package_id', 1);
  });

  // Test GET by ID - not found
  test('GET /enquiry-requirement-package-customise/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/enquiry-requirement-package-customise/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Customization not found');
  });

  // Test POST new customization
  test('POST /enquiry-requirement-package-customise - should create new customization', async () => {
    const newCustomization = {
      package_id: 1,
      item_id: 1,
      item_choice_id: 1,
      choice_status: true,
      created_by: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(newCustomization);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('package_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('choice_status', true);
    expect(response.body).toHaveProperty('version', 1);
  });

  // Test POST - missing required fields
  test('POST /enquiry-requirement-package-customise - should return 400 for missing fields', async () => {
    const incompleteData = {
      package_id: 1,
      item_id: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test POST - duplicate entry
  test('POST /enquiry-requirement-package-customise - should return 400 for duplicate', async () => {
    const customization = {
      package_id: 1,
      item_id: 1,
      item_choice_id: 1,
      choice_status: true,
      created_by: 1
    };

    // Create first
    await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(customization);

    // Try to create duplicate
    const response = await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(customization);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already exists');
  });

  // Test PUT update
  test('PUT /enquiry-requirement-package-customise/:id - should update choice_status', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const updateData = {
      choice_status: false,
      updated_by: 2
    };

    const response = await request(app)
      .put(`/enquiry-requirement-package-customise/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_status', false);
  });

  // Test DELETE (soft delete)
  test('DELETE /enquiry-requirement-package-customise/:id - should soft delete', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app)
      .delete(`/enquiry-requirement-package-customise/${id}?updated_by=2`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Customization deactivated successfully');
    
    // Verify it's marked as not current
    const checkResult = await pool.query(
      'SELECT is_current FROM enquiry_requirement_package_item_choice_customise WHERE id = $1',
      [id]
    );
    expect(checkResult.rows[0].is_current).toBe(false);
  });

  // Test GET history
  test('GET /enquiry-requirement-package-customise/history - should return history', async () => {
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, true, 1)
    `);

    const response = await request(app)
      .get('/enquiry-requirement-package-customise/history?package_id=1&item_id=1&item_choice_id=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  // Test POST bulk
  test('POST /enquiry-requirement-package-customise/bulk - should handle bulk operations', async () => {
    const bulkData = {
      customizations: [
        { package_id: 1, item_id: 1, item_choice_id: 1, choice_status: true },
        { package_id: 1, item_id: 2, item_choice_id: 3, choice_status: false }
      ],
      created_by: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise/bulk')
      .send(bulkData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Bulk operation completed successfully');
    expect(response.body).toHaveProperty('processed', 2);
  });

  // Test GET summary
  test('GET /enquiry-requirement-package-customise/summary/:packageId - should return summary', async () => {
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES 
        (1, 1, 1, true, 1),
        (1, 1, 2, false, 1)
    `);

    const response = await request(app).get('/enquiry-requirement-package-customise/summary/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('item_name');
    expect(response.body[0]).toHaveProperty('active_choices');
    expect(response.body[0]).toHaveProperty('inactive_choices');
  });
});
