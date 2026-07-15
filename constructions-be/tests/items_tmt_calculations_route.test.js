// tests/items_tmt_calculations_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      project_code VARCHAR(50)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS elements (
      element_id SERIAL PRIMARY KEY,
      element_name VARCHAR(100) NOT NULL,
      element_category VARCHAR(50)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_measurements_structural (
      structural_measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      element_id INT NOT NULL,
      length FLOAT,
      width FLOAT,
      height FLOAT,
      tmt_main_bar_dia DECIMAL(5,2),
      tmt_distribution_bar_dia DECIMAL(5,2),
      qty_main_bars INT,
      qty_distribution_bars INT,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (element_id) REFERENCES elements(element_id)
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
    CREATE TABLE IF NOT EXISTS items_tmt_calculations (
      calculation_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      element_id INT NOT NULL,
      measurement_id INT NOT NULL,
      main_bar_dia DECIMAL(5,2),
      distribution_bar_dia DECIMAL(5,2),
      qty_main_bars INT,
      qty_distribution_bars INT,
      main_bar_length DECIMAL(10,2),
      distribution_bar_length DECIMAL(10,2),
      main_bar_weight_per_meter DECIMAL(8,4),
      distribution_bar_weight_per_meter DECIMAL(8,4),
      main_bar_total_weight DECIMAL(12,2) GENERATED ALWAYS AS (qty_main_bars * main_bar_length * main_bar_weight_per_meter) STORED,
      distribution_bar_total_weight DECIMAL(12,2) GENERATED ALWAYS AS (qty_distribution_bars * distribution_bar_length * distribution_bar_weight_per_meter) STORED,
      bending_factor DECIMAL(5,2) DEFAULT 1.10,
      cutting_factor DECIMAL(5,2) DEFAULT 1.05,
      calculated_by INT,
      calculation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INT,
      verification_date TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) CHECK (status IN ('Draft', 'Verified', 'Pending')) DEFAULT 'Draft',
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (element_id) REFERENCES elements(element_id),
      FOREIGN KEY (measurement_id) REFERENCES architect_measurements_structural(structural_measurement_id),
      FOREIGN KEY (calculated_by) REFERENCES employees(employee_id),
      FOREIGN KEY (verified_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS items_tmt_calculations CASCADE');
  await pool.query('DROP TABLE IF EXISTS architect_measurements_structural CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items_tmt_calculations');
  await pool.query('DELETE FROM architect_measurements_structural');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code)
    VALUES 
      (1, 'Green Valley Residences', 'GVR-2024-01'),
      (2, 'Tech Park Phase II', 'TP2-2024-02')
  `);

  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Foundation', 'Structural'),
      (2, 'Column', 'Structural'),
      (3, 'Beam', 'Structural'),
      (4, 'Slab', 'Structural')
  `);

  await pool.query(`
    INSERT INTO architect_measurements_structural (structural_measurement_id, project_id, element_id, length, width, height, tmt_main_bar_dia, tmt_distribution_bar_dia, qty_main_bars, qty_distribution_bars)
    VALUES 
      (1, 1, 1, 10.0, 8.0, 1.5, 16, 12, 25, 20),
      (2, 1, 2, 0.5, 0.5, 3.0, 20, 8, 8, 24)
  `);

  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('elements_element_id_seq', 4)");
  await pool.query("SELECT setval('architect_measurements_structural_structural_measurement_id_seq', 2)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('items_tmt_calculations_calculation_id_seq', 1, false)");
});

describe('Items TMT Calculations API', () => {
  // Test GET all calculations
  test('GET /items-tmt-calculations - should return all calculations', async () => {
    // Insert test calculation
    await pool.query(`
      INSERT INTO items_tmt_calculations 
      (project_id, element_id, measurement_id, main_bar_dia, distribution_bar_dia, qty_main_bars, qty_distribution_bars, main_bar_length, distribution_bar_length, main_bar_weight_per_meter, distribution_bar_weight_per_meter, calculated_by)
      VALUES (1, 1, 1, 16, 12, 25, 20, 10.5, 8.5, 1.579, 0.888, 1)
    `);

    const response = await request(app).get('/items-tmt-calculations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('calculation_id');
    expect(response.body[0]).toHaveProperty('main_bar_dia', '16.00');
    expect(response.body[0]).toHaveProperty('main_bar_total_weight');
  });

  // Test GET with filters
  test('GET /items-tmt-calculations - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO items_tmt_calculations 
      (project_id, element_id, measurement_id, main_bar_dia, distribution_bar_dia, qty_main_bars, qty_distribution_bars, main_bar_length, distribution_bar_length, main_bar_weight_per_meter, distribution_bar_weight_per_meter, calculated_by, status)
      VALUES 
        (1, 1, 1, 16, 12, 25, 20, 10.5, 8.5, 1.579, 0.888, 1, 'Draft'),
        (1, 2, 2, 20, 8, 8, 24, 3.3, 3.1, 2.466, 0.395, 1, 'Verified')
    `);

    // Filter by project_id
    const response1 = await request(app).get('/items-tmt-calculations?project_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by element_id
    const response2 = await request(app).get('/items-tmt-calculations?element_id=2');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by status
    const response3 = await request(app).get('/items-tmt-calculations?status=Verified');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /items-tmt-calculations/:id - should return specific calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_tmt_calculations 
      (project_id, element_id, measurement_id, main_bar_dia, distribution_bar_dia, qty_main_bars, qty_distribution_bars, main_bar_length, distribution_bar_length, main_bar_weight_per_meter, distribution_bar_weight_per_meter, calculated_by)
      VALUES (1, 1, 1, 16, 12, 25, 20, 10.5, 8.5, 1.579, 0.888, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).get(`/items-tmt-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', id);
    expect(response.body).toHaveProperty('element_name', 'Foundation');
    expect(response.body).toHaveProperty('project_name', 'Green Valley Residences');
  });

  // Test GET by ID - not found
  test('GET /items-tmt-calculations/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/items-tmt-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Calculation not found');
  });

  // Test POST new calculation
  test('POST /items-tmt-calculations - should create new calculation', async () => {
    const newCalculation = {
      project_id: 1,
      element_id: 1,
      measurement_id: 1,
      main_bar_dia: 16,
      distribution_bar_dia: 12,
      qty_main_bars: 30,
      qty_distribution_bars: 25,
      main_bar_length: 12.0,
      distribution_bar_length: 10.0,
      main_bar_weight_per_meter: 1.579,
      distribution_bar_weight_per_meter: 0.888,
      bending_factor: 1.15,
      cutting_factor: 1.10,
      calculated_by: 1
    };

    const response = await request(app)
      .post('/items-tmt-calculations')
      .send(newCalculation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calculation_id');
    expect(response.body).toHaveProperty('main_bar_dia', '16.00');
    expect(response.body).toHaveProperty('main_bar_total_weight', '568.44');
    expect(response.body).toHaveProperty('distribution_bar_total_weight', '222.00');
  });

  // Test POST - missing required fields
  test('POST /items-tmt-calculations - should return 400 for missing fields', async () => {
    const incompleteData = {
      project_id: 1,
      element_id: 1,
      // missing other required fields
    };

    const response = await request(app)
      .post('/items-tmt-calculations')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  // Test PUT update
  test('PUT /items-tmt-calculations/:id - should update calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_tmt_calculations 
      (project_id, element_id, measurement_id, main_bar_dia, distribution_bar_dia, qty_main_bars, qty_distribution_bars, main_bar_length, distribution_bar_length, main_bar_weight_per_meter, distribution_bar_weight_per_meter, calculated_by)
      VALUES (1, 1, 1, 16, 12, 25, 20, 10.5, 8.5, 1.579, 0.888, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const updateData = {
      qty_main_bars: 35,
      bending_factor: 1.20,
      status: 'Verified'
    };

    const response = await request(app)
      .put(`/items-tmt-calculations/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('qty_main_bars', 35);
    expect(response.body).toHaveProperty('bending_factor', '1.20');
    expect(response.body).toHaveProperty('status', 'Verified');
  });

  // Test DELETE
  test('DELETE /items-tmt-calculations/:id - should delete calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_tmt_calculations 
      (project_id, element_id, measurement_id, main_bar_dia, distribution_bar_dia, qty_main_bars, qty_distribution_bars, main_bar_length, distribution_bar_length, main_bar_weight_per_meter, distribution_bar_weight_per_meter, calculated_by)
      VALUES (1, 1, 1, 16, 12, 25, 20, 10.5, 8.5, 1.579, 0.888, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).delete(`/items-tmt-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Calculation deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM items_tmt_calculations WHERE calculation_id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });

  // Test POST verify
  test('POST /items-tmt-calculations/:id/verify - should verify calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_tmt_calculations 
      (project_id, element_id, measurement_id, main_bar_dia, distribution_bar_dia, qty_main_bars, qty_distribution_bars, main_bar_length, distribution_bar_length, main_bar_weight_per_meter, distribution_bar_weight_per_meter, calculated_by)
      VALUES (1, 1, 1, 16, 12, 25, 20, 10.5, 8.5, 1.579, 0.888, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app)
      .post(`/items-tmt-calculations/${id}/verify`)
      .send({ verified_by: 2 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('verification_date');
  });
});
