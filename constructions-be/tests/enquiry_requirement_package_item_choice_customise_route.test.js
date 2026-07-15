// tests/enquiry_requirement_package_item_choice_customise_route.test.js
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
      company_name VARCHAR(255),
      primary_phone VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_requirements (
      enquiry_requirement_id SERIAL PRIMARY KEY,
      enquiry_id INT NOT NULL,
      requirement_title VARCHAR(255) NOT NULL,
      project_type VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      package_id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      package_type VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_unit VARCHAR(20),
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
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_requirement_package_item_choice_customise (
      customization_id SERIAL PRIMARY KEY,
      enquiry_requirement_id INT NOT NULL,
      package_id INT NOT NULL,
      item_id INT NOT NULL,
      default_choice_id INT NOT NULL,
      selected_choice_id INT NOT NULL,
      is_upgraded BOOLEAN DEFAULT FALSE,
      upgrade_cost DECIMAL(12,2) DEFAULT 0,
      customization_notes TEXT,
      customized_by INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      FOREIGN KEY (enquiry_requirement_id) REFERENCES enquiry_requirements(enquiry_requirement_id),
      FOREIGN KEY (package_id) REFERENCES packages(package_id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (default_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (selected_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (customized_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
      UNIQUE(enquiry_requirement_id, package_id, item_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS enquiry_requirement_package_item_choice_customise CASCADE');
  await pool.query('DROP TABLE IF EXISTS item_choices CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS packages CASCADE');
  await pool.query('DROP TABLE IF EXISTS enquiry_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS enquiries CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM enquiry_requirement_package_item_choice_customise');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM packages');
  await pool.query('DELETE FROM enquiry_requirements');
  await pool.query('DELETE FROM enquiries');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name, company_name, primary_phone, email)
    VALUES 
      (1, 'ENQ-2024-001', 'John Doe', 'ABC Company', '1234567890', 'john@abc.com'),
      (2, 'ENQ-2024-002', 'Jane Smith', 'XYZ Corp', '0987654321', 'jane@xyz.com')
  `);

  await pool.query(`
    INSERT INTO enquiry_requirements (enquiry_requirement_id, enquiry_id, requirement_title, project_type)
    VALUES 
      (1, 1, 'Villa Construction', 'Residential'),
      (2, 2, 'Office Building', 'Commercial')
  `);

  await pool.query(`
    INSERT INTO packages (package_id, package_name, package_type)
    VALUES 
      (1, 'Basic Package', 'Standard'),
      (2, 'Premium Package', 'Premium')
  `);

  await pool.query(`
    INSERT INTO items (item_id, item_name, item_unit)
    VALUES 
      (1, 'TMT Bar', 'kg'),
      (2, 'RMC', 'cum')
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
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'Admin', 'User', 'admin@example.com'),
      (2, 'Sales', 'User', 'sales@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 2)");
  await pool.query("SELECT setval('enquiry_requirements_enquiry_requirement_id_seq', 2)");
  await pool.query("SELECT setval('packages_package_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 4)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('enquiry_requirement_package_item_choice_customise_customization_id_seq', 1, false)");
});

describe('Enquiry Requirement Package Item Choice Customise API', () => {
  // Test GET all customizations
  test('GET /enquiry-requirement-package-customise - should return all customizations', async () => {
    // Insert test customization
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, is_upgraded, upgrade_cost, customized_by)
      VALUES (1, 1, 1, 1, 2, true, 5000.00, 1)
    `);

    const response = await request(app).get('/enquiry-requirement-package-customise');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('enquiry_requirement_id', 1);
    expect(response.body[0]).toHaveProperty('package_id', 1);
    expect(response.body[0]).toHaveProperty('is_upgraded', true);
  });

  // Test GET with filters
  test('GET /enquiry-requirement-package-customise - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, is_upgraded, customized_by)
      VALUES 
        (1, 1, 1, 1, 2, true, 1),
        (2, 2, 2, 3, 4, true, 1),
        (1, 1, 2, 3, 3, false, 1)
    `);

    // Filter by enquiry_requirement_id
    const response1 = await request(app).get('/enquiry-requirement-package-customise?enquiry_requirement_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by package_id
    const response2 = await request(app).get('/enquiry-requirement-package-customise?package_id=2');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by is_upgraded
    const response3 = await request(app).get('/enquiry-requirement-package-customise?is_upgraded=false');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /enquiry-requirement-package-customise/:id - should return specific customization', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 2, 1)
      RETURNING customization_id
    `);
    const id = result.rows[0].customization_id;

    const response = await request(app).get(`/enquiry-requirement-package-customise/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customization_id', id);
    expect(response.body).toHaveProperty('requirement_title', 'Villa Construction');
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
      enquiry_requirement_id: 1,
      package_id: 1,
      item_id: 1,
      default_choice_id: 1,
      selected_choice_id: 2,
      upgrade_cost: 5000,
      customization_notes: 'Upgraded to premium',
      customized_by: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(newCustomization);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_requirement_id', 1);
    expect(response.body).toHaveProperty('is_upgraded', true);
    expect(response.body).toHaveProperty('upgrade_cost', '5000.00');
  });

  // Test POST - missing required fields
  test('POST /enquiry-requirement-package-customise - should return 400 for missing fields', async () => {
    const incompleteData = {
      enquiry_requirement_id: 1,
      package_id: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test POST - duplicate entry
  test('POST /enquiry-requirement-package-customise - should return 409 for duplicate', async () => {
    const customization = {
      enquiry_requirement_id: 1,
      package_id: 1,
      item_id: 1,
      default_choice_id: 1,
      selected_choice_id: 2,
      customized_by: 1
    };

    // Create first
    await request(app).post('/enquiry-requirement-package-customise').send(customization);

    // Try to create duplicate
    const response = await request(app)
      .post('/enquiry-requirement-package-customise')
      .send(customization);
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('already exists');
  });

  // Test PUT update
  test('PUT /enquiry-requirement-package-customise/:id - should update customization', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 1, 1)
      RETURNING customization_id
    `);
    const id = result.rows[0].customization_id;

    const updateData = {
      selected_choice_id: 2,
      upgrade_cost: 3000,
      customization_notes: 'Changed selection',
      updated_by: 2
    };

    const response = await request(app)
      .put(`/enquiry-requirement-package-customise/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selected_choice_id', 2);
    expect(response.body).toHaveProperty('is_upgraded', true);
    expect(response.body).toHaveProperty('upgrade_cost', '3000.00');
  });

  // Test DELETE
  test('DELETE /enquiry-requirement-package-customise/:id - should delete customization', async () => {
    const result = await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 2, 1)
      RETURNING customization_id
    `);
    const id = result.rows[0].customization_id;

    const response = await request(app).delete(`/enquiry-requirement-package-customise/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Customization deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM enquiry_requirement_package_item_choice_customise WHERE customization_id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });

  // Test GET summary
  test('GET /enquiry-requirement-package-customise/requirement/:requirementId/summary - should return summary', async () => {
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, is_upgraded, upgrade_cost, customized_by)
      VALUES 
        (1, 1, 1, 1, 2, true, 5000, 1),
        (1, 1, 2, 3, 4, true, 3000, 1)
    `);

    const response = await request(app).get('/enquiry-requirement-package-customise/requirement/1/summary');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_customizations', '2');
    expect(response.body).toHaveProperty('upgraded_items', '2');
    expect(response.body).toHaveProperty('total_upgrade_cost', '8000.00');
  });

  // Test POST bulk create
  test('POST /enquiry-requirement-package-customise/bulk-create - should create multiple customizations', async () => {
    const bulkData = {
      enquiry_requirement_id: 1,
      package_id: 1,
      customizations: [
        {
          item_id: 1,
          default_choice_id: 1,
          selected_choice_id: 2,
          upgrade_cost: 5000
        },
        {
          item_id: 2,
          default_choice_id: 3,
          selected_choice_id: 4,
          upgrade_cost: 3000
        }
      ],
      customized_by: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise/bulk-create')
      .send(bulkData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.created.length).toBe(2);
  });

  // Test POST copy to lead
  test('POST /enquiry-requirement-package-customise/copy-to-lead - should prepare copy', async () => {
    await pool.query(`
      INSERT INTO enquiry_requirement_package_item_choice_customise 
      (enquiry_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 2, 1)
    `);

    const copyData = {
      enquiry_requirement_id: 1,
      lead_requirement_id: 10,
      copied_by: 1
    };

    const response = await request(app)
      .post('/enquiry-requirement-package-customise/copy-to-lead')
      .send(copyData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customizations_count', 1);
  });
});
