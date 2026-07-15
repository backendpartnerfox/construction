// tests/architect_measurements_structural_route.test.js
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
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_measurements_structural (
      structural_measurement_id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(project_id),
      element_id INTEGER NOT NULL REFERENCES elements(element_id),
      length DECIMAL(10,2),
      width DECIMAL(10,2),
      height DECIMAL(10,2),
      depth DECIMAL(10,2),
      diameter DECIMAL(10,2),
      radius DECIMAL(10,2),
      slab_thickness DECIMAL(10,2),
      slab_type VARCHAR(50),
      area DECIMAL(10,2),
      volume DECIMAL(10,2),
      perimeter DECIMAL(10,2),
      thickness DECIMAL(10,2),
      cross_sectional_area DECIMAL(10,2),
      horizontal_projection DECIMAL(10,2),
      vertical_projection DECIMAL(10,2),
      rise DECIMAL(10,2),
      run DECIMAL(10,2),
      stair_width DECIMAL(10,2),
      number_of_steps INTEGER,
      angle DECIMAL(10,2),
      slope_percentage DECIMAL(10,2),
      curvature_radius DECIMAL(10,2),
      tmt_main_bar_dia DECIMAL(10,2),
      tmt_distribution_bar_dia DECIMAL(10,2),
      qty_main_bars INTEGER,
      qty_distribution_bars INTEGER,
      rmc_grade VARCHAR(50),
      stirrup_dia DECIMAL(10,2),
      stirrup_spacing DECIMAL(10,2),
      concrete_cover DECIMAL(10,2),
      design_load DECIMAL(10,2),
      live_load DECIMAL(10,2),
      dead_load DECIMAL(10,2),
      reinforcement_type VARCHAR(50),
      concrete_mix_ratio VARCHAR(50),
      expansion_joint_width DECIMAL(10,2),
      thermal_conductivity DECIMAL(10,2),
      fire_rating VARCHAR(50),
      sound_insulation_rating DECIMAL(10,2),
      recorded_by INTEGER REFERENCES employees(employee_id),
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INTEGER REFERENCES employees(employee_id),
      verified_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) CHECK (status IN ('Draft', 'Verified', 'Pending Verification')) DEFAULT 'Draft'
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_measurements_structural');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_measurements_structural');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code)
    VALUES 
      (1, 'Test Project', 'TP-001'),
      (2, 'Second Project', 'SP-002')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Column', 'Structural'),
      (2, 'Beam', 'Structural'),
      (3, 'Slab', 'Structural')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'John', 'Doe'),
      (2, 'Jane', 'Smith'),
      (3, 'Robert', 'Johnson')
  `);
  
  await pool.query(`
    INSERT INTO architect_measurements_structural (
      structural_measurement_id, project_id, element_id, length, width, height, 
      tmt_main_bar_dia, tmt_distribution_bar_dia, qty_main_bars, qty_distribution_bars,
      rmc_grade, recorded_by, status
    )
    VALUES 
      (1, 1, 1, 5.00, 0.30, 0.45, 12.00, 8.00, 6, 4, 'M25', 1, 'Draft'),
      (2, 1, 2, 4.50, 0.25, 0.40, 16.00, 8.00, 4, 6, 'M20', 1, 'Pending Verification'),
      (3, 2, 3, 6.00, 3.50, 0.15, 10.00, 8.00, 8, 12, 'M30', 2, 'Verified')
  `);
  
  // Reset sequence to make IDs predictable
  await pool.query("SELECT setval('architect_measurements_structural_structural_measurement_id_seq', 3)");
});

describe('Architectural Structural Measurements API', () => {
  // Test GET all measurements
  test('GET /structural-measurements - should return all measurements', async () => {
    const response = await request(app).get('/structural-measurements');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('project_name', 'Test Project');
    expect(response.body[0]).toHaveProperty('element_name', 'Column');
    expect(response.body[1]).toHaveProperty('element_name', 'Beam');
    expect(response.body[2]).toHaveProperty('project_name', 'Second Project');
  });
  
  // Test GET measurement by ID
  test('GET /structural-measurements/:id - should return a specific measurement', async () => {
    const response = await request(app).get('/structural-measurements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('structural_measurement_id', 1);
    expect(response.body).toHaveProperty('element_name', 'Column');
    expect(response.body).toHaveProperty('length', '5.00');
    expect(response.body).toHaveProperty('width', '0.30');
    expect(response.body).toHaveProperty('height', '0.45');
    expect(response.body).toHaveProperty('tmt_main_bar_dia', '12.00');
  });
  
  // Test GET measurement by ID - not found
  test('GET /structural-measurements/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).get('/structural-measurements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Structural measurement not found');
  });
  
  // Test POST new measurement
  test('POST /structural-measurements - should create a new measurement', async () => {
    const newMeasurement = {
      project_id: 2,
      element_id: 1,
      length: 6.50,
      width: 0.35,
      height: 0.50,
      depth: 0.55,
      tmt_main_bar_dia: 20.00,
      tmt_distribution_bar_dia: 10.00,
      qty_main_bars: 8,
      qty_distribution_bars: 6,
      rmc_grade: 'M30',
      recorded_by: 3,
      status: 'Draft'
    };
    
    const response = await request(app)
      .post('/structural-measurements')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('length', '6.50');
    expect(response.body).toHaveProperty('width', '0.35');
    expect(response.body).toHaveProperty('depth', '0.55');
    expect(response.body).toHaveProperty('structural_measurement_id', 4);
    expect(response.body).toHaveProperty('recorded_by', 3);
    
    // Verify measurement was actually created
    const allMeasurements = await request(app).get('/structural-measurements');
    expect(allMeasurements.body.length).toBe(4);
  });
  
  // Test POST new measurement with all possible fields
  test('POST /structural-measurements - should create a measurement with all fields', async () => {
    const completeMeasurement = {
      project_id: 2,
      element_id: 2,
      length: 7.50,
      width: 0.40,
      height: 0.55,
      depth: 0.60,
      diameter: 0.30,
      radius: 0.15,
      slab_thickness: 0.20,
      slab_type: 'One-way',
      area: 3.00,
      volume: 1.80,
      perimeter: 15.80,
      thickness: 0.25,
      cross_sectional_area: 0.22,
      horizontal_projection: 7.50,
      vertical_projection: 0.55,
      rise: 0.30,
      run: 1.20,
      stair_width: 1.50,
      number_of_steps: 10,
      angle: 15.00,
      slope_percentage: 25.00,
      curvature_radius: 3.00,
      tmt_main_bar_dia: 16.00,
      tmt_distribution_bar_dia: 12.00,
      qty_main_bars: 6,
      qty_distribution_bars: 8,
      rmc_grade: 'M35',
      stirrup_dia: 8.00,
      stirrup_spacing: 200.00,
      concrete_cover: 40.00,
      design_load: 15.00,
      live_load: 3.50,
      dead_load: 11.50,
      reinforcement_type: 'HYSD Bars',
      concrete_mix_ratio: '1:1.5:3',
      expansion_joint_width: 25.00,
      thermal_conductivity: 1.80,
      fire_rating: '2 hours',
      sound_insulation_rating: 45.00,
      recorded_by: 2,
      status: 'Pending Verification'
    };
    
    const response = await request(app)
      .post('/structural-measurements')
      .send(completeMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('structural_measurement_id', 4);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('element_id', 2);
    expect(response.body).toHaveProperty('length', '7.50');
    expect(response.body).toHaveProperty('slab_thickness', '0.20');
    expect(response.body).toHaveProperty('reinforcement_type', 'HYSD Bars');
    expect(response.body).toHaveProperty('status', 'Pending Verification');
  });
  
  // Test POST new measurement - missing required fields
  test('POST /structural-measurements - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      project_id: 1,
      // Missing element_id and recorded_by
      length: 6.50,
      width: 0.35
    };
    
    const response = await request(app)
      .post('/structural-measurements')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, Element ID, and Recorded By are required');
  });

  // Test POST with only required fields
  test('POST /structural-measurements - should create with only required fields', async () => {
    const minimalMeasurement = {
      project_id: 1,
      element_id: 3,
      recorded_by: 1
    };
    
    const response = await request(app)
      .post('/structural-measurements')
      .send(minimalMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('element_id', 3);
    expect(response.body).toHaveProperty('recorded_by', 1);
    expect(response.body).toHaveProperty('status', 'Draft');
  });
  
  // Test PUT update measurement
  test('PUT /structural-measurements/:id - should update a measurement', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      length: 5.50,
      width: 0.32,
      height: 0.48,
      tmt_main_bar_dia: 14.00,
      tmt_distribution_bar_dia: 10.00,
      qty_main_bars: 8,
      qty_distribution_bars: 4,
      rmc_grade: 'M35',
      status: 'Pending Verification'
    };
    
    const response = await request(app)
      .put('/structural-measurements/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('length', '5.50');
    expect(response.body).toHaveProperty('width', '0.32');
    expect(response.body).toHaveProperty('height', '0.48');
    expect(response.body).toHaveProperty('rmc_grade', 'M35');
    expect(response.body).toHaveProperty('status', 'Pending Verification');
    
    // Verify measurement was actually updated
    const updatedMeasurement = await request(app).get('/structural-measurements/1');
    expect(updatedMeasurement.body.length).toBe('5.50');
    expect(updatedMeasurement.body.rmc_grade).toBe('M35');
  });
  
  // Test PUT update all fields
  test('PUT /structural-measurements/:id - should update all fields of a measurement', async () => {
    const completeUpdate = {
      project_id: 2,
      element_id: 3,
      length: 8.00,
      width: 0.45,
      height: 0.60,
      depth: 0.65,
      diameter: 0.35,
      radius: 0.175,
      slab_thickness: 0.25,
      slab_type: 'Two-way',
      area: 3.60,
      volume: 2.16,
      perimeter: 16.90,
      thickness: 0.30,
      cross_sectional_area: 0.27,
      horizontal_projection: 8.00,
      vertical_projection: 0.60,
      rise: 0.35,
      run: 1.40,
      stair_width: 1.80,
      number_of_steps: 12,
      angle: 18.00,
      slope_percentage: 30.00,
      curvature_radius: 3.50,
      tmt_main_bar_dia: 20.00,
      tmt_distribution_bar_dia: 16.00,
      qty_main_bars: 8,
      qty_distribution_bars: 10,
      rmc_grade: 'M40',
      stirrup_dia: 10.00,
      stirrup_spacing: 150.00,
      concrete_cover: 50.00,
      design_load: 18.00,
      live_load: 4.00,
      dead_load: 14.00,
      reinforcement_type: 'TMT Bars',
      concrete_mix_ratio: '1:2:4',
      expansion_joint_width: 30.00,
      thermal_conductivity: 2.00,
      fire_rating: '3 hours',
      sound_insulation_rating: 50.00,
      status: 'Verified'
    };
    
    const response = await request(app)
      .put('/structural-measurements/2')
      .send(completeUpdate);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('element_id', 3);
    expect(response.body).toHaveProperty('slab_type', 'Two-way');
    expect(response.body).toHaveProperty('design_load', '18.00');
    expect(response.body).toHaveProperty('fire_rating', '3 hours');
    
    // Verify all fields were updated
    const updatedMeasurement = await request(app).get('/structural-measurements/2');
    expect(updatedMeasurement.body.fire_rating).toBe('3 hours');
    expect(updatedMeasurement.body.concrete_mix_ratio).toBe('1:2:4');
  });
  
  // Test PUT update measurement - not found
  test('PUT /structural-measurements/:id - should return 404 for non-existent ID', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      length: 5.50,
      width: 0.32
    };
    
    const response = await request(app)
      .put('/structural-measurements/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Structural measurement not found');
  });
  
  // Test PUT update - missing required fields
  test('PUT /structural-measurements/:id - should return 400 for missing required fields', async () => {
    const incompleteUpdate = {
      // Missing project_id and element_id
      length: 7.00,
      width: 0.40
    };
    
    const response = await request(app)
      .put('/structural-measurements/1')
      .send(incompleteUpdate);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID and Element ID are required');
  });
  
  // Test DELETE measurement
  test('DELETE /structural-measurements/:id - should delete a measurement', async () => {
    const response = await request(app).delete('/structural-measurements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Structural measurement deleted successfully');
    
    // Verify measurement was actually deleted
    const allMeasurements = await request(app).get('/structural-measurements');
    expect(allMeasurements.body.length).toBe(2);
    
    const deletedMeasurement = await request(app).get('/structural-measurements/1');
    expect(deletedMeasurement.status).toBe(404);
  });
  
  // Test DELETE - not found
  test('DELETE /structural-measurements/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).delete('/structural-measurements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Structural measurement not found');
  });
  
  // Test GET measurements by project
  test('GET /structural-measurements/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/structural-measurements/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
  });
  
  // Test GET measurements by project - no results
  test('GET /structural-measurements/project/:projectId - should return empty array for no results', async () => {
    // Add a project without measurements
    await pool.query(`
      INSERT INTO projects (project_id, project_name, project_code)
      VALUES (3, 'Empty Project', 'EP-003')
    `);
    
    const response = await request(app).get('/structural-measurements/project/3');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  // Test GET measurements by element
  test('GET /structural-measurements/element/:elementId - should return measurements for an element', async () => {
    const response = await request(app).get('/structural-measurements/element/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('element_id', 1);
    expect(response.body[0]).toHaveProperty('element_name', 'Column');
  });
  
  // Test GET measurements by element - multiple results
  test('GET /structural-measurements/element/:elementId - should return multiple measurements for an element', async () => {
    // Add another measurement for the same element
    await pool.query(`
      INSERT INTO architect_measurements_structural (
        project_id, element_id, length, width, height, recorded_by, status
      )
      VALUES (2, 2, 5.20, 0.30, 0.42, 3, 'Draft')
    `);
    
    const response = await request(app).get('/structural-measurements/element/2');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('element_id', 2);
    expect(response.body[1]).toHaveProperty('element_id', 2);
    expect(response.body[0]).toHaveProperty('element_name', 'Beam');
    expect(response.body[1]).toHaveProperty('element_name', 'Beam');
  });
  
  // Test GET measurements by status
  test('GET /structural-measurements/status/:status - should return measurements with specific status', async () => {
    const response = await request(app).get('/structural-measurements/status/Pending Verification');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Pending Verification');
    expect(response.body[0]).toHaveProperty('element_name', 'Beam');
  });
  
  // Test GET measurements by status - multiple results
  test('GET /structural-measurements/status/:status - should return multiple measurements with specific status', async () => {
    // Add another Draft measurement
    await pool.query(`
      INSERT INTO architect_measurements_structural (
        project_id, element_id, length, width, height, recorded_by, status
      )
      VALUES (2, 2, 4.80, 0.28, 0.38, 3, 'Draft')
    `);
    
    const response = await request(app).get('/structural-measurements/status/Draft');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('status', 'Draft');
    expect(response.body[1]).toHaveProperty('status', 'Draft');
  });
  
  // Test PATCH verify measurement
  test('PATCH /structural-measurements/verify/:id - should verify a measurement', async () => {
    const verifyData = {
      verified_by: 2
    };
    
    const response = await request(app)
      .patch('/structural-measurements/verify/1')
      .send(verifyData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('verified_at');
    
    // Verify status was actually updated
    const verifiedMeasurement = await request(app).get('/structural-measurements/1');
    expect(verifiedMeasurement.body.status).toBe('Verified');
    expect(verifiedMeasurement.body.verified_by).toBe(2);
  });
  
  // Test PATCH verify measurement - already verified
  test('PATCH /structural-measurements/verify/:id - should update verification info for already verified measurement', async () => {
    const verifyData = {
      verified_by: 3
    };
    
    const response = await request(app)
      .patch('/structural-measurements/verify/3')
      .send(verifyData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_by', 3);
    
    // Verify info was actually updated
    const verifiedMeasurement = await request(app).get('/structural-measurements/3');
    expect(verifiedMeasurement.body.verified_by).toBe(3);
  });
  
  // Test PATCH verify measurement - missing verified_by
  test('PATCH /structural-measurements/verify/:id - should return 400 for missing verified_by', async () => {
    const response = await request(app)
      .patch('/structural-measurements/verify/1')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Verified by is required');
  });
  
  // Test PATCH verify measurement - not found
  test('PATCH /structural-measurements/verify/:id - should return 404 for non-existent ID', async () => {
    const verifyData = {
      verified_by: 2
    };
    
    const response = await request(app)
      .patch('/structural-measurements/verify/999')
      .send(verifyData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Structural measurement not found');
  });
});
