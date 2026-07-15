// tests/lead_requirement_package_customise_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      lead_number VARCHAR(50) UNIQUE,
      lead_title VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_requirements (
      lead_requirement_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      requirement_title VARCHAR(255) NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      package_type VARCHAR(100),
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
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_requirement_package_item_choice_customise (
      id SERIAL PRIMARY KEY,
      lead_requirement_id INT NOT NULL,
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
      FOREIGN KEY (lead_requirement_id) REFERENCES lead_requirements(lead_requirement_id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (item_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS lead_requirement_package_item_choice_customise CASCADE');
  await pool.query('DROP TABLE IF EXISTS item_choices CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS packages CASCADE');
  await pool.query('DROP TABLE IF EXISTS lead_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS leads CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM lead_requirement_package_item_choice_customise');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM packages');
  await pool.query('DELETE FROM lead_requirements');
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO leads (lead_id, lead_number, lead_title)
    VALUES 
      (1, 'LED-2024-001', 'Villa Construction'),
      (2, 'LED-2024-002', 'Office Building')
  `);

  await pool.query(`
    INSERT INTO lead_requirements (lead_requirement_id, lead_id, requirement_title)
    VALUES 
      (1, 1, 'G+2 Villa Construction'),
      (2, 2, 'G+4 Office Building')
  `);

  await pool.query(`
    INSERT INTO packages (id, package_name, package_type)
    VALUES 
      (1, 'Basic Package', 'Standard'),
      (2, 'Premium Package', 'Premium')
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
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirements_lead_requirement_id_seq', 2)");
  await pool.query("SELECT setval('packages_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 4)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirement_package_item_choice_customise_id_seq', 1, false)");
});

describe('Lead Requirement Package Customise API', () => {
  // Test GET all customizations
  test('GET /lead-requirement-package-customise - should return all customizations', async () => {
    // Insert test customization
    await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, 1, true, 1)
    `);

    const response = await request(app).get('/lead-requirement-package-customise');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('lead_requirement_id', 1);
    expect(response.body[0]).toHaveProperty('choice_status', true);
    expect(response.body[0]).toHaveProperty('is_current', true);
  });

  // Test GET with filters
  test('GET /lead-requirement-package-customise - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES 
        (1, 1, 1, 1, true, 1),
        (1, 1, 2, 3, false, 1),
        (2, 2, 1, 2, true, 1)
    `);

    // Filter by lead_requirement_id
    const response1 = await request(app).get('/lead-requirement-package-customise?lead_requirement_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by package_id
    const response2 = await request(app).get('/lead-requirement-package-customise?package_id=2');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by choice_status
    const response3 = await request(app).get('/lead-requirement-package-customise?choice_status=false');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /lead-requirement-package-customise/:id - should return specific customization', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, 1, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app).get(`/lead-requirement-package-customise/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', id);
    expect(response.body).toHaveProperty('requirement_title', 'G+2 Villa Construction');
  });

  // Test POST new customization
  test('POST /lead-requirement-package-customise - should create new customization', async () => {
    const newCustomization = {
      lead_requirement_id: 1,
      package_id: 1,
      item_id: 1,
      item_choice_id: 2,
      choice_status: true,
      created_by: 1
    };

    const response = await request(app)
      .post('/lead-requirement-package-customise')
      .send(newCustomization);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('lead_requirement_id', 1);
    expect(response.body).toHaveProperty('choice_status', true);
    expect(response.body).toHaveProperty('version', 1);
  });

  // Test PUT update
  test('PUT /lead-requirement-package-customise/:id - should update customization', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, 1, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const updateData = {
      choice_status: false,
      updated_by: 2
    };

    const response = await request(app)
      .put(`/lead-requirement-package-customise/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_status', false);
  });

  // Test DELETE
  test('DELETE /lead-requirement-package-customise/:id - should soft delete', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, item_choice_id, choice_status, created_by)
      VALUES (1, 1, 1, 1, true, 1)
      RETURNING id
    `);
    const id = result.rows[0].id;

    const response = await request(app)
      .delete(`/lead-requirement-package-customise/${id}?updated_by=2`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Customization deactivated successfully');
  });
});
