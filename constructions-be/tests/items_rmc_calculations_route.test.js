// tests/items_rmc_calculations_route.test.js
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
      thickness FLOAT,
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
    CREATE TABLE IF NOT EXISTS items_rmc_calculations (
      calculation_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      element_id INT NOT NULL,
      measurement_id INT NOT NULL,
      concrete_grade VARCHAR(10),
      concrete_mix_ratio VARCHAR(20),
      length DECIMAL(10,2),
      width DECIMAL(10,2),
      height DECIMAL(10,2),
      thickness DECIMAL(10,2),
      gross_volume DECIMAL(12,2) GENERATED ALWAYS AS (length * width * height) STORED,
      net_volume DECIMAL(12,2) GENERATED ALWAYS AS (length * width * thickness) STORED,
      plasticizer_percentage DECIMAL(5,2) DEFAULT 0.50,
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
  await pool.query('DROP TABLE IF EXISTS items_rmc_calculations CASCADE');
  await pool.query('DROP TABLE IF EXISTS architect_measurements_structural CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items_rmc_calculations');
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
    INSERT INTO architect_measurements_structural (structural_measurement_id, project_id, element_id, length, width, height, thickness)
    VALUES 
      (1, 1, 1, 10.0, 8.0, 1.5, 1.5),
      (2, 1, 2, 0.5, 0.5, 3.0, 0.5)
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
  await pool.query("SELECT setval('items_rmc_calculations_calculation_id_seq', 1, false)");
});

describe('Items RMC Calculations API', () => {
  // Test GET all calculations
  test('GET /items-rmc-calculations - should return all calculations', async () => {
    // Insert test calculation
    await pool.query(`
      INSERT INTO items_rmc_calculations 
      (project_id, element_id, measurement_id, concrete_grade, concrete_mix_ratio, length, width, height, thickness, calculated_by)
      VALUES (1, 1, 1, 'M25', '1:1:2', 10.0, 8.0, 1.5, 1.5, 1)
    `);

    const response = await request(app).get('/items-rmc-calculations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('calculation_id');
    expect(response.body[0]).toHaveProperty('concrete_grade', 'M25');
    expect(response.body[0]).toHaveProperty('gross_volume', '120.00');
    expect(response.body[0]).toHaveProperty('net_volume', '120.00');
  });

  // Test GET with filters
  test('GET /items-rmc-calculations - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO items_rmc_calculations 
      (project_id, element_id, measurement_id, concrete_grade, concrete_mix_ratio, length, width, height, thickness, calculated_by, status)
      VALUES 
        (1, 1, 1, 'M25', '1:1:2', 10.0, 8.0, 1.5, 1.5, 1, 'Draft'),
        (1, 2, 2, 'M30', '1:0.75:1.5', 0.5, 0.5, 3.0, 0.5, 1, 'Verified')
    `);

    // Filter by project_id
    const response1 = await request(app).get('/items-rmc-calculations?project_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by element_id
    const response2 = await request(app).get('/items-rmc-calculations?element_id=2');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by status
    const response3 = await request(app).get('/items-rmc-calculations?status=Verified');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /items-rmc-calculations/:id - should return specific calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_rmc_calculations 
      (project_id, element_id, measurement_id, concrete_grade, concrete_mix_ratio, length, width, height, thickness, calculated_by)
      VALUES (1, 1, 1, 'M25', '1:1:2', 10.0, 8.0, 1.5, 1.5, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).get(`/items-rmc-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', id);
    expect(response.body).toHaveProperty('element_name', 'Foundation');
    expect(response.body).toHaveProperty('project_name', 'Green Valley Residences');
  });

  // Test GET by ID - not found
  test('GET /items-rmc-calculations/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/items-rmc-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Calculation not found');
  });

  // Test POST new calculation
  test('POST /items-rmc-calculations - should create new calculation', async () => {
    const newCalculation = {
      project_id: 1,
      element_id: 1,
      measurement_id: 1,
      concrete_grade: 'M30',
      concrete_mix_ratio: '1:0.75:1.5',
      length: 12.0,
      width: 10.0,
      height: 2.0,
      thickness: 2.0,
      plasticizer_percentage: 0.75,
      calculated_by: 1
    };

    const response = await request(app)
      .post('/items-rmc-calculations')
      .send(newCalculation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calculation_id');
    expect(response.body).toHaveProperty('concrete_grade', 'M30');
    expect(response.body).toHaveProperty('gross_volume', '240.00');
    expect(response.body).toHaveProperty('net_volume', '240.00');
  });

  // Test POST - missing required fields
  test('POST /items-rmc-calculations - should return 400 for missing fields', async () => {
    const incompleteData = {
      project_id: 1,
      element_id: 1,
      // missing other required fields
    };

    const response = await request(app)
      .post('/items-rmc-calculations')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  // Test PUT update
  test('PUT /items-rmc-calculations/:id - should update calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_rmc_calculations 
      (project_id, element_id, measurement_id, concrete_grade, concrete_mix_ratio, length, width, height, thickness, calculated_by)
      VALUES (1, 1, 1, 'M25', '1:1:2', 10.0, 8.0, 1.5, 1.5, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const updateData = {
      concrete_grade: 'M35',
      plasticizer_percentage: 1.00,
      status: 'Verified'
    };

    const response = await request(app)
      .put(`/items-rmc-calculations/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('concrete_grade', 'M35');
    expect(response.body).toHaveProperty('plasticizer_percentage', '1.00');
    expect(response.body).toHaveProperty('status', 'Verified');
  });

  // Test DELETE
  test('DELETE /items-rmc-calculations/:id - should delete calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_rmc_calculations 
      (project_id, element_id, measurement_id, concrete_grade, concrete_mix_ratio, length, width, height, thickness, calculated_by)
      VALUES (1, 1, 1, 'M25', '1:1:2', 10.0, 8.0, 1.5, 1.5, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).delete(`/items-rmc-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Calculation deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM items_rmc_calculations WHERE calculation_id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });
});
