// tests/items_flooring_calculations_route.test.js
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
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items_flooring_calculations (
      calculation_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      element_id INT NOT NULL,
      floor VARCHAR(50),
      room VARCHAR(100),
      flooring_type VARCHAR(100) NOT NULL,
      room_length DECIMAL(10,2) NOT NULL,
      room_width DECIMAL(10,2) NOT NULL,
      room_area DECIMAL(12,2) GENERATED ALWAYS AS (room_length * room_width) STORED,
      skirting_length DECIMAL(10,2),
      skirting_height DECIMAL(5,2),
      skirting_area DECIMAL(10,2) GENERATED ALWAYS AS (skirting_length * skirting_height) STORED,
      wastage_percentage DECIMAL(5,2) DEFAULT 5.00,
      total_flooring_area DECIMAL(12,2) GENERATED ALWAYS AS (room_length * room_width * (1 + wastage_percentage/100)) STORED,
      calculated_by INT,
      calculation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INT,
      verification_date TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) CHECK (status IN ('Draft', 'Verified', 'Pending')) DEFAULT 'Draft',
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (element_id) REFERENCES elements(element_id),
      FOREIGN KEY (calculated_by) REFERENCES employees(employee_id),
      FOREIGN KEY (verified_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS items_flooring_calculations CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items_flooring_calculations');
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
      (1, 'Flooring', 'Interior'),
      (2, 'Skirting', 'Interior')
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
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('items_flooring_calculations_calculation_id_seq', 1, false)");
});

describe('Items Flooring Calculations API', () => {
  // Test GET all calculations
  test('GET /items-flooring-calculations - should return all calculations', async () => {
    // Insert test calculation
    await pool.query(`
      INSERT INTO items_flooring_calculations 
      (project_id, element_id, floor, room, flooring_type, room_length, room_width, skirting_length, skirting_height, calculated_by)
      VALUES (1, 1, 'Ground Floor', 'Living Room', 'Vitrified Tiles', 5.5, 4.0, 19.0, 0.10, 1)
    `);

    const response = await request(app).get('/items-flooring-calculations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('calculation_id');
    expect(response.body[0]).toHaveProperty('flooring_type', 'Vitrified Tiles');
    expect(response.body[0]).toHaveProperty('room_area', '22.00');
  });

  // Test GET with filters
  test('GET /items-flooring-calculations - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO items_flooring_calculations 
      (project_id, element_id, floor, room, flooring_type, room_length, room_width, calculated_by, status)
      VALUES 
        (1, 1, 'Ground Floor', 'Living Room', 'Vitrified Tiles', 5.5, 4.0, 1, 'Draft'),
        (2, 1, 'First Floor', 'Bedroom', 'Wooden Flooring', 4.0, 3.5, 1, 'Verified')
    `);

    // Filter by project_id
    const response1 = await request(app).get('/items-flooring-calculations?project_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(1);

    // Filter by flooring_type
    const response2 = await request(app).get('/items-flooring-calculations?flooring_type=Wooden Flooring');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by status
    const response3 = await request(app).get('/items-flooring-calculations?status=Verified');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /items-flooring-calculations/:id - should return specific calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_flooring_calculations 
      (project_id, element_id, floor, room, flooring_type, room_length, room_width, calculated_by)
      VALUES (1, 1, 'Ground Floor', 'Living Room', 'Vitrified Tiles', 5.5, 4.0, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).get(`/items-flooring-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', id);
    expect(response.body).toHaveProperty('floor', 'Ground Floor');
    expect(response.body).toHaveProperty('room', 'Living Room');
  });

  // Test POST new calculation
  test('POST /items-flooring-calculations - should create new calculation', async () => {
    const newCalculation = {
      project_id: 1,
      element_id: 1,
      floor: 'Ground Floor',
      room: 'Living Room',
      flooring_type: 'Marble',
      room_length: 6.0,
      room_width: 4.5,
      skirting_length: 21.0,
      skirting_height: 0.12,
      wastage_percentage: 7.00,
      calculated_by: 1
    };

    const response = await request(app)
      .post('/items-flooring-calculations')
      .send(newCalculation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calculation_id');
    expect(response.body).toHaveProperty('flooring_type', 'Marble');
    expect(response.body).toHaveProperty('room_area', '27.00');
    expect(response.body).toHaveProperty('total_flooring_area', '28.89');
  });

  // Test PUT update
  test('PUT /items-flooring-calculations/:id - should update calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_flooring_calculations 
      (project_id, element_id, floor, room, flooring_type, room_length, room_width, calculated_by)
      VALUES (1, 1, 'Ground Floor', 'Living Room', 'Vitrified Tiles', 5.5, 4.0, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const updateData = {
      flooring_type: 'Granite',
      wastage_percentage: 8.00,
      status: 'Verified'
    };

    const response = await request(app)
      .put(`/items-flooring-calculations/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('flooring_type', 'Granite');
    expect(response.body).toHaveProperty('wastage_percentage', '8.00');
    expect(response.body).toHaveProperty('status', 'Verified');
  });

  // Test DELETE
  test('DELETE /items-flooring-calculations/:id - should delete calculation', async () => {
    const result = await pool.query(`
      INSERT INTO items_flooring_calculations 
      (project_id, element_id, floor, room, flooring_type, room_length, room_width, calculated_by)
      VALUES (1, 1, 'Ground Floor', 'Living Room', 'Vitrified Tiles', 5.5, 4.0, 1)
      RETURNING calculation_id
    `);
    const id = result.rows[0].calculation_id;

    const response = await request(app).delete(`/items-flooring-calculations/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Calculation deleted successfully');
  });
});
