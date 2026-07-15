// tests/items_brick_calculations_route.test.js
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
      project_code VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Planning'
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
    CREATE TABLE IF NOT EXISTS architect_walls_measurement (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      floor VARCHAR(50),
      room VARCHAR(100),
      wall_direction VARCHAR(20),
      wall_thickness DECIMAL(5,2),
      actual_wall_width DECIMAL(10,2),
      height DECIMAL(10,2),
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
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
    CREATE TABLE IF NOT EXISTS items_brick_calculations (
      calculation_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      measurement_id INT NOT NULL,
      wall_area DECIMAL(10,2),
      wall_thickness DECIMAL(10,2),
      brick_size VARCHAR(50),
      bricks_per_sqft DECIMAL(10,2) DEFAULT 4.5,
      mortar_ratio VARCHAR(10) DEFAULT '1:6',
      mortar_thickness DECIMAL(5,2) DEFAULT 12,
      total_bricks INT,
      cement_bags_for_mortar DECIMAL(10,2),
      sand_cum_for_mortar DECIMAL(10,2),
      calculated_by INT,
      calculation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INT,
      verification_date TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'Draft',
      element_id INT,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (element_id) REFERENCES elements(element_id),
      FOREIGN KEY (measurement_id) REFERENCES architect_walls_measurement(measurement_id),
      FOREIGN KEY (calculated_by) REFERENCES employees(employee_id),
      FOREIGN KEY (verified_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS items_brick_calculations CASCADE');
  await pool.query('DROP TABLE IF EXISTS architect_walls_measurement CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items_brick_calculations');
  await pool.query('DELETE FROM architect_walls_measurement');
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
      (1, 'External Wall', 'Walls'),
      (2, 'Internal Wall', 'Walls')
  `);

  await pool.query(`
    INSERT INTO architect_walls_measurement (measurement_id, project_id, floor, room, wall_direction, wall_thickness, actual_wall_width, height)
    VALUES 
      (1, 1, 'Ground Floor', 'Living Room', 'North', 0.23, 5.5, 3.0),
      (2, 1, 'Ground Floor', 'Bedroom 1', 'South', 0.15, 4.0, 3.0)
  `);

  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('elements_element_id_seq', 2)");
  await pool.query("SELECT setval('architect_walls_measurement_measurement_id_seq', 2)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('items_brick_calculations_calculation_id_seq', 1, false)");
});

describe('Items Brick Calculations API', () => {
  // Test GET all calculations
  test('GET /items-brick-calculations - should return all calculations', async () => {
    // Insert test calculation
    await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, bricks_per_sqft, mortar_ratio, mortar_thickness, total_bricks, calculated_by)
      VALUES (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 4.5, '1:6', 12, 75, 1)
    `);

    const response = await request(app).get('/items-brick-calculations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('calculation_id');
    expect(response.body[0]).toHaveProperty('brick_size', '9x4x3');
    expect(response.body[0]).toHaveProperty('project_name', 'Green Valley Residences');
  });

  // Test GET with filters
  test('GET /items-brick-calculations - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, status, calculated_by)
      VALUES 
        (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 'Draft', 1),
        (1, 2, 2, 2, 12.0, 0.15, '8x4x3', 'Verified', 1)
    `);

    // Filter by project_id
    const response1 = await request(app).get('/items-brick-calculations?project_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by element_id
    const response2 = await request(app).get('/items-brick-calculations?element_id=2');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by status
    const response3 = await request(app).get('/items-brick-calculations?status=Verified');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /items-brick-calculations/:id - should return specific calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, calculated_by)
      VALUES (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).get(`/items-brick-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', id);
    expect(response.body).toHaveProperty('floor', 'Ground Floor');
    expect(response.body).toHaveProperty('room', 'Living Room');
  });

  // Test GET by ID - not found
  test('GET /items-brick-calculations/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/items-brick-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Calculation not found');
  });

  // Test POST new calculation
  test('POST /items-brick-calculations - should create new calculation', async () => {
    const newCalculation = {
      project_id: 1,
      component_id: 1,
      measurement_id: 1,
      element_id: 1,
      wall_area: 16.5,
      wall_thickness: 0.23,
      brick_size: '9x4x3',
      bricks_per_sqft: 4.5,
      mortar_ratio: '1:6',
      mortar_thickness: 12,
      total_bricks: 75,
      cement_bags_for_mortar: 2.5,
      sand_cum_for_mortar: 0.5,
      calculated_by: 1
    };

    const response = await request(app)
      .post('/items-brick-calculations')
      .send(newCalculation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calculation_id');
    expect(response.body).toHaveProperty('brick_size', '9x4x3');
    expect(response.body).toHaveProperty('wall_area', '16.50');
    expect(response.body).toHaveProperty('total_bricks', 75);
  });

  // Test POST - missing required fields
  test('POST /items-brick-calculations - should return 400 for missing fields', async () => {
    const incompleteData = {
      project_id: 1,
      element_id: 1,
      // missing component_id and measurement_id
    };

    const response = await request(app)
      .post('/items-brick-calculations')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  // Test PUT update
  test('PUT /items-brick-calculations/:id - should update calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, calculated_by)
      VALUES (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const updateData = {
      brick_size: '8x4x3',
      total_bricks: 80,
      status: 'Verified'
    };

    const response = await request(app)
      .put(`/items-brick-calculations/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('brick_size', '8x4x3');
    expect(response.body).toHaveProperty('total_bricks', 80);
    expect(response.body).toHaveProperty('status', 'Verified');
  });

  // Test DELETE
  test('DELETE /items-brick-calculations/:id - should delete calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, calculated_by)
      VALUES (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).delete(`/items-brick-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Calculation deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM items_brick_calculations WHERE calculation_id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });

  // Test POST verify
  test('POST /items-brick-calculations/:id/verify - should verify calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, calculated_by)
      VALUES (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app)
      .post(`/items-brick-calculations/${id}/verify`)
      .send({ verified_by: 2 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('verification_date');
  });

  // Test GET project summary
  test('GET /items-brick-calculations/project/:projectId/summary - should return summary', async () => {
    await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, total_bricks, calculated_by, status)
      VALUES 
        (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 75, 1, 'Verified'),
        (1, 2, 2, 2, 12.0, 0.15, '9x4x3', 55, 1, 'Draft')
    `);

    const response = await request(app).get('/items-brick-calculations/project/1/summary');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('brick_size', '9x4x3');
    expect(response.body[0]).toHaveProperty('calculation_count', '2');
    expect(response.body[0]).toHaveProperty('verified_count', '1');
    expect(response.body[0]).toHaveProperty('draft_count', '1');
  });

  // Test GET by measurement ID
  test('GET /items-brick-calculations/measurement/:measurementId - should return calculation for measurement', async () => {
    await pool.query(`
      INSERT INTO items_brick_calculations 
      (project_id, component_id, measurement_id, element_id, wall_area, wall_thickness, brick_size, calculated_by)
      VALUES (1, 1, 1, 1, 16.5, 0.23, '9x4x3', 1)
    `);

    const response = await request(app).get('/items-brick-calculations/measurement/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('element_name', 'External Wall');
  });
});
