// tests/lead_requirement_package_item_choice_customise_route.test.js
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
      project_type VARCHAR(100),
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      package_id SERIAL PRIMARY KEY,
      package_name VARCHAR(255) NOT NULL,
      package_type VARCHAR(100)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_unit VARCHAR(20)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INT NOT NULL,
      display_name VARCHAR(255),
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
      customization_id SERIAL PRIMARY KEY,
      lead_requirement_id INT NOT NULL,
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
      FOREIGN KEY (lead_requirement_id) REFERENCES lead_requirements(lead_requirement_id),
      FOREIGN KEY (package_id) REFERENCES packages(package_id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (default_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (selected_choice_id) REFERENCES item_choices(choice_option_id),
      FOREIGN KEY (customized_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
      UNIQUE(lead_requirement_id, package_id, item_id)
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
    INSERT INTO lead_requirements (lead_requirement_id, lead_id, requirement_title, project_type)
    VALUES 
      (1, 1, 'G+2 Villa Construction', 'Residential'),
      (2, 2, 'G+4 Office Building', 'Commercial')
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
      (1, 'John', 'Doe', 'john.doe@example.com'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirements_lead_requirement_id_seq', 2)");
  await pool.query("SELECT setval('packages_package_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 4)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirement_package_item_choice_customise_customization_id_seq', 1, false)");
});

describe('Lead Requirement Package Item Choice Customise API', () => {
  // Test GET all customizations
  test('GET /lead-requirement-package-item-choice-customise - should return all customizations', async () => {
    // Insert test customization
    await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, is_upgraded, upgrade_cost, customized_by)
      VALUES (1, 1, 1, 1, 2, true, 5000.00, 1)
    `);

    const response = await request(app).get('/lead-requirement-package-item-choice-customise');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('lead_requirement_id', 1);
    expect(response.body[0]).toHaveProperty('is_upgraded', true);
    expect(response.body[0]).toHaveProperty('upgrade_cost', '5000.00');
  });

  // Test GET with filters
  test('GET /lead-requirement-package-item-choice-customise - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, is_upgraded, customized_by)
      VALUES 
        (1, 1, 1, 1, 2, true, 1),
        (1, 1, 2, 3, 4, true, 1),
        (2, 2, 1, 1, 1, false, 1)
    `);

    // Filter by lead_requirement_id
    const response1 = await request(app).get('/lead-requirement-package-item-choice-customise?lead_requirement_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by is_upgraded
    const response2 = await request(app).get('/lead-requirement-package-item-choice-customise?is_upgraded=false');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /lead-requirement-package-item-choice-customise/:id - should return specific customization', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 2, 1)
      RETURNING customization_id
    `);
    const id = result.rows[0].customization_id;

    const response = await request(app).get(`/lead-requirement-package-item-choice-customise/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customization_id', id);
    expect(response.body).toHaveProperty('requirement_title', 'G+2 Villa Construction');
  });

  // Test POST new customization
  test('POST /lead-requirement-package-item-choice-customise - should create new customization', async () => {
    const newCustomization = {
      lead_requirement_id: 1,
      package_id: 1,
      item_id: 1,
      default_choice_id: 1,
      selected_choice_id: 2,
      upgrade_cost: 5000,
      customization_notes: 'Upgraded to premium brand',
      customized_by: 1
    };

    const response = await request(app)
      .post('/lead-requirement-package-item-choice-customise')
      .send(newCustomization);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('lead_requirement_id', 1);
    expect(response.body).toHaveProperty('is_upgraded', true);
    expect(response.body).toHaveProperty('upgrade_cost', '5000.00');
  });

  // Test POST - duplicate entry
  test('POST /lead-requirement-package-item-choice-customise - should return 409 for duplicate', async () => {
    const customization = {
      lead_requirement_id: 1,
      package_id: 1,
      item_id: 1,
      default_choice_id: 1,
      selected_choice_id: 2,
      customized_by: 1
    };

    // Create first
    await request(app).post('/lead-requirement-package-item-choice-customise').send(customization);

    // Try to create duplicate
    const response = await request(app)
      .post('/lead-requirement-package-item-choice-customise')
      .send(customization);
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('already exists');
  });

  // Test PUT update
  test('PUT /lead-requirement-package-item-choice-customise/:id - should update customization', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 1, 1)
      RETURNING customization_id
    `);
    const id = result.rows[0].customization_id;

    const updateData = {
      selected_choice_id: 2,
      upgrade_cost: 3000,
      customization_notes: 'Updated selection',
      updated_by: 2
    };

    const response = await request(app)
      .put(`/lead-requirement-package-item-choice-customise/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selected_choice_id', 2);
    expect(response.body).toHaveProperty('is_upgraded', true);
    expect(response.body).toHaveProperty('upgrade_cost', '3000.00');
  });

  // Test DELETE
  test('DELETE /lead-requirement-package-item-choice-customise/:id - should delete customization', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, customized_by)
      VALUES (1, 1, 1, 1, 2, 1)
      RETURNING customization_id
    `);
    const id = result.rows[0].customization_id;

    const response = await request(app).delete(`/lead-requirement-package-item-choice-customise/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Customization deleted successfully');
  });

  // Test GET summary
  test('GET /lead-requirement-package-item-choice-customise/requirement/:requirementId/summary - should return summary', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_package_item_choice_customise 
      (lead_requirement_id, package_id, item_id, default_choice_id, selected_choice_id, is_upgraded, upgrade_cost, customized_by)
      VALUES 
        (1, 1, 1, 1, 2, true, 5000, 1),
        (1, 1, 2, 3, 4, true, 3000, 1)
    `);

    const response = await request(app).get('/lead-requirement-package-item-choice-customise/requirement/1/summary');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_customizations', '2');
    expect(response.body).toHaveProperty('upgraded_items', '2');
    expect(response.body).toHaveProperty('total_upgrade_cost', '8000.00');
  });

  // Test POST bulk create
  test('POST /lead-requirement-package-item-choice-customise/bulk-create - should create multiple', async () => {
    const bulkData = {
      lead_requirement_id: 1,
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
      .post('/lead-requirement-package-item-choice-customise/bulk-create')
      .send(bulkData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.created.length).toBe(2);
  });
});
