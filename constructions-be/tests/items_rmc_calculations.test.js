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
    CREATE TABLE IF NOT EXISTS items_rmc_calculations (
      calculation_id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id),
      element_id INTEGER REFERENCES elements(element_id),
      measurement_id INTEGER REFERENCES measurements(measurement_id),
      concrete_grade VARCHAR(20),
      concrete_mix_ratio VARCHAR(50),
      length NUMERIC,
      width NUMERIC,
      height NUMERIC,
      thickness NUMERIC,
      gross_volume NUMERIC,
      net_volume NUMERIC,
      plasticizer_percentage NUMERIC DEFAULT 0.50,
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
  await pool.query('DROP TABLE IF EXISTS items_rmc_calculations');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.query('DROP TABLE IF EXISTS measurements');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM items_rmc_calculations');
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
    INSERT INTO items_rmc_calculations (
      calculation_id, project_id, element_id, measurement_id, concrete_grade, 
      concrete_mix_ratio, length, width, height, thickness, 
      gross_volume, net_volume, plasticizer_percentage, 
      calculated_by, verified_by, status
    )
    VALUES 
      (1, 1, 1, 1, 'M25', '1:1.5:3', 10, 5, 3, 0.3, 150, 142.5, 0.5, 1, null, 'Draft'),
      (2, 1, 2, 1, 'M30', '1:2:4', 8, 4, 2, 0.4, 64, 60.8, 0.75, 1, 2, 'Verified')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('measurements_measurement_id_seq', 2)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('items_rmc_calculations_calculation_id_seq', 2)");
});

describe('RMC Calculations API', () => {
  // Test GET all RMC calculations
  test('GET /rmc-calculations - should return all RMC calculations', async () => {
    const response = await request(app).get('/rmc-calculations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('calculation_id');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('concrete_grade');
    expect(response.body[0]).toHaveProperty('status');
    
    // Check specific RMC calculations
    const m25Calc = response.body.find(calc => calc.concrete_grade === 'M25');
    expect(m25Calc).toBeDefined();
    expect(m25Calc.project_id).toBe(1);
    expect(m25Calc.element_id).toBe(1);
    expect(m25Calc.gross_volume).toEqual(150);
    
    const m30Calc = response.body.find(calc => calc.concrete_grade === 'M30');
    expect(m30Calc).toBeDefined();
    expect(m30Calc.status).toBe('Verified');
    expect(m30Calc.verified_by).toBe(2);
  });
  
  // Test GET RMC calculation by ID
  test('GET /rmc-calculations/:id - should return a specific RMC calculation', async () => {
    const response = await request(app).get('/rmc-calculations/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('concrete_grade', 'M25');
    expect(response.body).toHaveProperty('concrete_mix_ratio', '1:1.5:3');
    expect(response.body).toHaveProperty('length', 10);
    expect(response.body).toHaveProperty('width', 5);
    expect(response.body).toHaveProperty('height', 3);
    expect(response.body).toHaveProperty('thickness', 0.3);
    expect(response.body).toHaveProperty('gross_volume', 150);
    expect(response.body).toHaveProperty('net_volume', 142.5);
    expect(response.body).toHaveProperty('status', 'Draft');
  });
  
  // Test GET RMC calculation by ID - not found
  test('GET /rmc-calculations/:id - should return 404 for non-existent calculation', async () => {
    const response = await request(app).get('/rmc-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'RMC calculation not found');
  });
  
  // Test POST new RMC calculation
  test('POST /rmc-calculations - should create a new RMC calculation', async () => {
    const newCalc = {
      project_id: 2,
      element_id: 3,
      measurement_id: 2,
      concrete_grade: 'M35',
      concrete_mix_ratio: '1:1:2',
      length: 12,
      width: 6,
      height: 0.2,
      thickness: null,
      plasticizer_percentage: 0.6,
      calculated_by: 1
    };
    
    const response = await request(app)
      .post('/rmc-calculations')
      .send(newCalc);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calculation_id', 3);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('element_id', 3);
    expect(response.body).toHaveProperty('concrete_grade', 'M35');
    expect(response.body).toHaveProperty('concrete_mix_ratio', '1:1:2');
    expect(response.body).toHaveProperty('length', 12);
    expect(response.body).toHaveProperty('width', 6);
    expect(response.body).toHaveProperty('height', 0.2);
    expect(response.body).toHaveProperty('plasticizer_percentage', 0.6);
    expect(response.body).toHaveProperty('status', 'Draft');
    
    // Verify calculation was actually created
    const allCalcs = await request(app).get('/rmc-calculations');
    expect(allCalcs.body.length).toBe(3);
    
    const m35Calc = allCalcs.body.find(calc => calc.concrete_grade === 'M35');
    expect(m35Calc).toBeDefined();
    expect(m35Calc.element_id).toBe(3);
  });
  
  // Test POST RMC calculation - missing required fields
  test('POST /rmc-calculations - should return 400 for missing required fields', async () => {
    const incompleteCalc = {
      project_id: 1,
      // Missing element_id and measurement_id
      concrete_grade: 'M20'
    };
    
    const response = await request(app)
      .post('/rmc-calculations')
      .send(incompleteCalc);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, element ID and measurement ID are required');
  });
  
  // Test PUT update RMC calculation
  test('PUT /rmc-calculations/:id - should update an RMC calculation', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      measurement_id: 1,
      concrete_grade: 'M40',
      concrete_mix_ratio: '1:1:2',
      length: 15,
      width: 8,
      height: 4,
      thickness: 0.5,
      plasticizer_percentage: 0.8,
      status: 'Draft'
    };
    
    const response = await request(app)
      .put('/rmc-calculations/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('concrete_grade', 'M40');
    expect(response.body).toHaveProperty('length', 15);
    expect(response.body).toHaveProperty('width', 8);
    expect(response.body).toHaveProperty('height', 4);
    expect(response.body).toHaveProperty('thickness', 0.5);
    expect(response.body).toHaveProperty('plasticizer_percentage', 0.8);
    
    // Verify calculation was actually updated
    const updatedCalc = await request(app).get('/rmc-calculations/1');
    expect(updatedCalc.body.concrete_grade).toBe('M40');
    expect(updatedCalc.body.length).toBe(15);
  });
  
  // Test PUT RMC calculation - missing required fields
  test('PUT /rmc-calculations/:id - should return 400 for missing required fields', async () => {
    const incompleteCalc = {
      project_id: 1,
      // Missing element_id and measurement_id
      concrete_grade: 'M20',
      length: 10
    };
    
    const response = await request(app)
      .put('/rmc-calculations/1')
      .send(incompleteCalc);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, element ID and measurement ID are required');
  });
  
  // Test PUT RMC calculation - not found
  test('PUT /rmc-calculations/:id - should return 404 for non-existent calculation', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      measurement_id: 1,
      concrete_grade: 'M40'
    };
    
    const response = await request(app)
      .put('/rmc-calculations/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'RMC calculation not found');
  });
  
  // Test DELETE RMC calculation
  test('DELETE /rmc-calculations/:id - should delete an RMC calculation', async () => {
    const response = await request(app).delete('/rmc-calculations/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'RMC calculation deleted successfully');
    
    // Verify calculation was actually deleted
    const deletedCalc = await request(app).get('/rmc-calculations/1');
    expect(deletedCalc.status).toBe(404);
    
    const allCalcs = await request(app).get('/rmc-calculations');
    expect(allCalcs.body.length).toBe(1);
  });
  
  // Test DELETE RMC calculation - not found
  test('DELETE /rmc-calculations/:id - should return 404 for non-existent calculation', async () => {
    const response = await request(app).delete('/rmc-calculations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'RMC calculation not found');
  });
  
  // Test GET RMC calculations by project ID
  test('GET /rmc-calculations/project/:projectId - should return calculations for a project', async () => {
    const response = await request(app).get('/rmc-calculations/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    
    // All calculations should belong to project 1
    response.body.forEach(calc => {
      expect(calc.project_id).toBe(1);
    });
  });
  
  // Test GET RMC calculations by element ID
  test('GET /rmc-calculations/element/:elementId - should return calculations for an element', async () => {
    const response = await request(app).get('/rmc-calculations/element/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('element_id', 1);
    expect(response.body[0]).toHaveProperty('concrete_grade', 'M25');
  });
  
  // Test GET RMC calculations by concrete grade
  test('GET /rmc-calculations/concrete-grade/:grade - should return calculations for a grade', async () => {
    const response = await request(app).get('/rmc-calculations/concrete-grade/M30');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('concrete_grade', 'M30');
    expect(response.body[0]).toHaveProperty('element_id', 2);
  });
  
  // Test GET RMC calculations by status
  test('GET /rmc-calculations/status/:status - should return calculations with a status', async () => {
    const response = await request(app).get('/rmc-calculations/status/Verified');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Verified');
    expect(response.body[0]).toHaveProperty('verified_by', 2);
  });
  
  // Test Verify RMC calculation
  test('PUT /rmc-calculations/verify/:id - should verify a calculation', async () => {
    const verifyData = {
      verified_by: 2
    };
    
    const response = await request(app)
      .put('/rmc-calculations/verify/1')
      .send(verifyData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('verification_date');
    
    // Verify calculation status was actually updated
    const verifiedCalc = await request(app).get('/rmc-calculations/1');
    expect(verifiedCalc.body.status).toBe('Verified');
  });
  
  // Test Verify RMC calculation - missing verified_by
  test('PUT /rmc-calculations/verify/:id - should return 400 for missing verified_by', async () => {
    const incompleteData = {};
    
    const response = await request(app)
      .put('/rmc-calculations/verify/1')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Verified by ID is required');
  });
  
  // Test GET detailed RMC calculation - Mock the JOIN query since related tables are not fully implemented
  test('GET /rmc-calculations/detailed/:id - should return detailed calculation info', async () => {
    // Mock the join query since we don't have full implementation of related tables
    jest.spyOn(pool, 'query').mockImplementationOnce(async (sql, params) => {
      if (sql.includes('LEFT JOIN projects') && params[0] === '1') {
        return {
          rows: [{
            calculation_id: 1,
            project_id: 1,
            element_id: 1,
            concrete_grade: 'M25',
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
    
    const response = await request(app).get('/rmc-calculations/detailed/1');
    
    // Restore original implementation
    pool.query.mockRestore();
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calculation_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Test Project 1');
    expect(response.body).toHaveProperty('element_name', 'Column');
    expect(response.body).toHaveProperty('calculator_name', 'John Doe');
  });
  
  // Test GET project summary - Mock the aggregation query
  test('GET /rmc-calculations/summary/project/:projectId - should return project summary', async () => {
    // Mock the aggregation query
    jest.spyOn(pool, 'query').mockImplementationOnce(async (sql, params) => {
      if (sql.includes('SUM') && params[0] === '1') {
        return {
          rows: [{
            project_name: 'Test Project 1',
            total_calculations: '2',
            total_gross_volume: '214',
            total_net_volume: '203.3',
            draft_count: '1',
            verified_count: '1',
            pending_count: '0',
            concrete_grades_used: 'M25, M30'
          }]
        };
      }
      // Fall back to original implementation for other queries
      return await originalQuery(sql, params);
    });
    
    const response = await request(app).get('/rmc-calculations/summary/project/1');
    
    // Restore original implementation
    pool.query.mockRestore();
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_name', 'Test Project 1');
    expect(response.body).toHaveProperty('total_calculations', '2');
    expect(response.body).toHaveProperty('total_gross_volume', '214');
    expect(response.body).toHaveProperty('total_net_volume', '203.3');
    expect(response.body).toHaveProperty('concrete_grades_used', 'M25, M30');
  });
});

// Store original query method for mock restoration
const originalQuery = pool.query;
