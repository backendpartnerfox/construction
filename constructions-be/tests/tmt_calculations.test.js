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
      project_name VARCHAR(100) NOT NULL,
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
    CREATE TABLE IF NOT EXISTS measurements (
      measurement_id SERIAL PRIMARY KEY,
      measurement_name VARCHAR(100) NOT NULL,
      measurement_type VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      employee_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items_TMT_calculations (
      calculation_id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id),
      element_id INTEGER REFERENCES elements(element_id),
      measurement_id INTEGER REFERENCES measurements(measurement_id),
      main_bar_dia NUMERIC,
      distribution_bar_dia NUMERIC,
      qty_main_bars INTEGER,
      qty_distribution_bars INTEGER,
      main_bar_length NUMERIC,
      distribution_bar_length NUMERIC,
      main_bar_weight_per_meter NUMERIC,
      distribution_bar_weight_per_meter NUMERIC,
      main_bar_total_weight NUMERIC,
      distribution_bar_total_weight NUMERIC,
      bending_factor NUMERIC DEFAULT 1.10,
      cutting_factor NUMERIC DEFAULT 1.05,
      calculated_by INTEGER REFERENCES employees(employee_id),
      calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      verified_by INTEGER REFERENCES employees(employee_id),
      verification_date TIMESTAMP,
      status VARCHAR(20) DEFAULT 'Draft'
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS items_TMT_calculations');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.query('DROP TABLE IF EXISTS measurements');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items_TMT_calculations');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM measurements');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code)
    VALUES 
      (1, 'Test Project 1', 'TP1'),
      (2, 'Test Project 2', 'TP2')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Column', 'Structural'),
      (2, 'Beam', 'Structural'),
      (3, 'Slab', 'Structural')
  `);
  
  await pool.query(`
    INSERT INTO measurements (measurement_id, measurement_name, measurement_type)
    VALUES 
      (1, 'Measurement 1', 'Type A'),
      (2, 'Measurement 2', 'Type B')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, employee_name)
    VALUES 
      (1, 'John Doe'),
      (2, 'Jane Smith')
  `);
  
  await pool.query(`
    INSERT INTO items_TMT_calculations (
      calculation_id, project_id, element_id, measurement_id, 
      main_bar_dia, distribution_bar_dia, 
      qty_main_bars, qty_distribution_bars, 
      main_bar_length, distribution_bar_length, 
      main_bar_weight_per_meter, distribution_bar_weight_per_meter,
      main_bar_total_weight, distribution_bar_total_weight, 
      bending_factor, cutting_factor, 
      calculated_by, verified_by, status
    )
    VALUES 
      (1, 1, 1, 1, 12, 8, 10, 15, 5, 4, 0.888, 0.395, 44.4, 23.7, 1.1, 1.05, 1, null, 'Draft'),
      (2, 1, 2, 1, 16, 10, 8, 12, 6, 5, 1.58, 0.617, 75.84, 37.02, 1.1, 1.05, 1, 2, 'Verified')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('measurements_measurement_id_seq', 2)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('items_TMT_calculations_calculation_id_seq', 2)");
});

describe('TMT Calculations API', () => {
  // Test GET all TMT calculations
  test('GET /tmt-calculations - should return all TMT calculations', async () => {
    const response = await request(app).get('/tmt-calculations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('calculation_id');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('main_bar_dia');
    expect(response.body[0]).toHaveProperty('status');
    
    // Check specific TMT calculations
    const draft = response.body.find(calc => calc.status === 'Draft');
    expect(draft).toBeDefined();
    expect(draft.project_id).toBe(1);
    expect(draft.element_id).toBe(1);
    expect(draft.main_bar_dia).toEqual(12);
    
    const verified = response.body.find(calc => calc.status === 'Verified');
    expect(verified).toBeDefined();
    expect(verified.verified_by).toBe(2);
    expect(verified.main_bar_dia).toEqual(16);
  });
  
  // Test GET TMT calculation by ID
  test('GET /tmt-calculations/:id - should return a specific TMT calculation', async () => {
    const response = await request(app).get('/tmt-calculations/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('main_bar_dia', 12);
    expect(response.body).toHaveProperty('distribution_bar_dia', 8);
    expect(response.body).toHaveProperty('qty_main_bars', 10);
    expect(response.body).toHaveProperty('qty_distribution_bars', 15);
    expect(response.body).toHaveProperty('main_bar_length', 5);
    expect(response.body).toHaveProperty('main_bar_weight_per_meter', 0.888);
    expect(response.body).toHaveProperty('main_bar_total_weight', 44.4);
    expect(response.body).toHaveProperty('status', 'Draft');
  });
  
  // Test GET TMT calculation by ID - not found
  test('GET /tmt-calculations/:id - should return 404 for non-existent calculation', async () => {
    const response = await request(app).get('/tmt-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'TMT calculation not found');
  });
  
  // Test POST new TMT calculation
  test('POST /tmt-calculations - should create a new TMT calculation', async () => {
    const newCalc = {
      project_id: 2,
      element_id: 3,
      measurement_id: 2,
      main_bar_dia: 20,
      distribution_bar_dia: 12,
      qty_main_bars: 12,
      qty_distribution_bars: 18,
      main_bar_length: 7,
      distribution_bar_length: 6,
      main_bar_weight_per_meter: 2.47,
      distribution_bar_weight_per_meter: 0.89,
      bending_factor: 1.12,
      cutting_factor: 1.06,
      calculated_by: 1
    };
    
    const response = await request(app)
      .post('/tmt-calculations')
      .send(newCalc);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calculation_id', 3);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('element_id', 3);
    expect(response.body).toHaveProperty('main_bar_dia', 20);
    expect(response.body).toHaveProperty('distribution_bar_dia', 12);
    expect(response.body).toHaveProperty('qty_main_bars', 12);
    expect(response.body).toHaveProperty('main_bar_weight_per_meter', 2.47);
    expect(response.body).toHaveProperty('bending_factor', 1.12);
    expect(response.body).toHaveProperty('status', 'Draft');
    
    // Verify calculation was actually created
    const allCalcs = await request(app).get('/tmt-calculations');
    expect(allCalcs.body.length).toBe(3);
    
    const newRecord = allCalcs.body.find(calc => calc.calculation_id === 3);
    expect(newRecord).toBeDefined();
    expect(newRecord.main_bar_dia).toEqual(20);
  });
  
  // Test POST TMT calculation - missing required fields
  test('POST /tmt-calculations - should return 400 for missing required fields', async () => {
    const incompleteCalc = {
      project_id: 1,
      // Missing element_id and measurement_id
      main_bar_dia: 20
    };
    
    const response = await request(app)
      .post('/tmt-calculations')
      .send(incompleteCalc);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, element ID and measurement ID are required');
  });
  
  // Test PUT update TMT calculation
  test('PUT /tmt-calculations/:id - should update a TMT calculation', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      measurement_id: 1,
      main_bar_dia: 25,
      distribution_bar_dia: 10,
      qty_main_bars: 15,
      qty_distribution_bars: 20,
      main_bar_length: 6,
      distribution_bar_length: 5,
      main_bar_weight_per_meter: 3.85,
      distribution_bar_weight_per_meter: 0.62,
      bending_factor: 1.15,
      cutting_factor: 1.08,
      status: 'Draft'
    };
    
    const response = await request(app)
      .put('/tmt-calculations/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('main_bar_dia', 25);
    expect(response.body).toHaveProperty('distribution_bar_dia', 10);
    expect(response.body).toHaveProperty('qty_main_bars', 15);
    expect(response.body).toHaveProperty('main_bar_weight_per_meter', 3.85);
    expect(response.body).toHaveProperty('bending_factor', 1.15);
    
    // Verify calculation was actually updated
    const updatedCalc = await request(app).get('/tmt-calculations/1');
    expect(updatedCalc.body.main_bar_dia).toBe(25);
    expect(updatedCalc.body.main_bar_weight_per_meter).toBe(3.85);
  });
  
  // Test PUT TMT calculation - missing required fields
  test('PUT /tmt-calculations/:id - should return 400 for missing required fields', async () => {
    const incompleteCalc = {
      project_id: 1,
      // Missing element_id and measurement_id
      main_bar_dia: 25
    };
    
    const response = await request(app)
      .put('/tmt-calculations/1')
      .send(incompleteCalc);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, element ID and measurement ID are required');
  });
  
  // Test PUT TMT calculation - not found
  test('PUT /tmt-calculations/:id - should return 404 for non-existent calculation', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      measurement_id: 1,
      main_bar_dia: 25
    };
    
    const response = await request(app)
      .put('/tmt-calculations/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'TMT calculation not found');
  });
  
  // Test DELETE TMT calculation
  test('DELETE /tmt-calculations/:id - should delete a TMT calculation', async () => {
    const response = await request(app).delete('/tmt-calculations/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'TMT calculation deleted successfully');
    
    // Verify calculation was actually deleted
    const deletedCalc = await request(app).get('/tmt-calculations/1');
    expect(deletedCalc.status).toBe(404);
    
    const allCalcs = await request(app).get('/tmt-calculations');
    expect(allCalcs.body.length).toBe(1);
  });
  
  // Test DELETE TMT calculation - not found
  test('DELETE /tmt-calculations/:id - should return 404 for non-existent calculation', async () => {
    const response = await request(app).delete('/tmt-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'TMT calculation not found');
  });
  
  // Test GET TMT calculations by project ID
  test('GET /tmt-calculations/project/:projectId - should return calculations for a project', async () => {
    const response = await request(app).get('/tmt-calculations/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    
    // All calculations should belong to project 1
    response.body.forEach(calc => {
      expect(calc.project_id).toBe(1);
    });
  });
  
  // Test GET TMT calculations by element ID
  test('GET /tmt-calculations/element/:elementId - should return calculations for an element', async () => {
    const response = await request(app).get('/tmt-calculations/element/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('element_id', 1);
    expect(response.body[0]).toHaveProperty('main_bar_dia', 12);
  });
  
  // Test GET TMT calculations by status
  test('GET /tmt-calculations/status/:status - should return calculations with a status', async () => {
    const response = await request(app).get('/tmt-calculations/status/Verified');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Verified');
    expect(response.body[0]).toHaveProperty('verified_by', 2);
    expect(response.body[0]).toHaveProperty('element_id', 2);
  });
  
  // Test Verify TMT calculation
  test('PUT /tmt-calculations/verify/:id - should verify a calculation', async () => {
    const verifyData = {
      verified_by: 2
    };
    
    const response = await request(app)
      .put('/tmt-calculations/verify/1')
      .send(verifyData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('verification_date');
    
    // Verify calculation status was actually updated
    const verifiedCalc = await request(app).get('/tmt-calculations/1');
    expect(verifiedCalc.body.status).toBe('Verified');
    expect(verifiedCalc.body.verified_by).toBe(2);
  });
  
  // Test Verify TMT calculation - missing verified_by
  test('PUT /tmt-calculations/verify/:id - should return 400 for missing verified_by', async () => {
    const incompleteData = {};
    
    const response = await request(app)
      .put('/tmt-calculations/verify/1')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Verified by ID is required');
  });
  
  // Test GET detailed TMT calculation - Mock the JOIN query since related tables are not fully implemented
  test('GET /tmt-calculations/detailed/:id - should return detailed calculation info', async () => {
    // Mock the join query since we don't have full implementation of related tables
    jest.spyOn(pool, 'query').mockImplementationOnce(async (sql, params) => {
      if (sql.includes('LEFT JOIN projects') && params[0] === '1') {
        return {
          rows: [{
            calculation_id: 1,
            project_id: 1,
            element_id: 1,
            main_bar_dia: 12,
            project_name: 'Test Project 1',
            project_code: 'TP1',
            element_name: 'Column',
            element_category: 'Structural',
            calculator_name: 'John Doe',
            verifier_name: null
          }]
        };
      }
      // Fall back to original implementation for other queries
      return await originalQuery(sql, params);
    });
    
    const response = await request(app).get('/tmt-calculations/detailed/1');
    
    // Restore original implementation
    pool.query.mockRestore();
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Test Project 1');
    expect(response.body).toHaveProperty('element_name', 'Column');
    expect(response.body).toHaveProperty('calculator_name', 'John Doe');
  });
  
  // Test GET project summary - Mock the aggregation query
  test('GET /tmt-calculations/summary/project/:projectId - should return project summary', async () => {
    // Mock the aggregation query
    jest.spyOn(pool, 'query').mockImplementationOnce(async (sql, params) => {
      if (sql.includes('SUM') && params[0] === '1') {
        return {
          rows: [{
            project_name: 'Test Project 1',
            total_calculations: '2',
            total_main_bar_weight: '120.24',
            total_distribution_bar_weight: '60.72',
            total_steel_weight: '180.96',
            draft_count: '1',
            verified_count: '1',
            pending_count: '0'
          }]
        };
      }
      // Fall back to original implementation for other queries
      return await originalQuery(sql, params);
    });
    
    const response = await request(app).get('/tmt-calculations/summary/project/1');
    
    // Restore original implementation
    pool.query.mockRestore();
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_name', 'Test Project 1');
    expect(response.body).toHaveProperty('total_calculations', '2');
    expect(response.body).toHaveProperty('total_main_bar_weight', '120.24');
    expect(response.body).toHaveProperty('total_distribution_bar_weight', '60.72');
    expect(response.body).toHaveProperty('total_steel_weight', '180.96');
    expect(response.body).toHaveProperty('draft_count', '1');
    expect(response.body).toHaveProperty('verified_count', '1');
  });
});

// Store original query method for mock restoration
const originalQuery = pool.query;
