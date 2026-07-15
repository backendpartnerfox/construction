// tests/architect_measurements_plumbing_route.test.js
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
      project_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50),
      last_name VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS components (
      component_id SERIAL PRIMARY KEY,
      component_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS elements (
      element_id SERIAL PRIMARY KEY,
      element_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS component_elements (
      component_element_id SERIAL PRIMARY KEY,
      component_id INT,
      element_id INT,
      FOREIGN KEY (component_id) REFERENCES components(component_id),
      FOREIGN KEY (element_id) REFERENCES elements(element_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_floors (
      floor_id SERIAL PRIMARY KEY,
      project_id INT,
      floor_name VARCHAR(50),
      floor_number INT,
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_measurements_plumbing (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      component_element_id INT,
      floor_id INT NOT NULL,
      room VARCHAR(100),
      fixture_type VARCHAR(100),
      fixture_description VARCHAR(255),
      quantity INT DEFAULT 1,
      water_supply_points INT,
      drainage_points INT,
      hot_water_points INT,
      cold_water_points INT,
      pipe_material VARCHAR(100),
      pipe_diameter VARCHAR(50),
      pipe_length DECIMAL(10,2),
      requires_client_selection BOOLEAN DEFAULT FALSE,
      special_requirements TEXT,
      recorded_by INT,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INT,
      verified_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'draft',
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (component_id) REFERENCES components(component_id),
      FOREIGN KEY (component_element_id) REFERENCES component_elements(component_element_id),
      FOREIGN KEY (floor_id) REFERENCES project_floors(floor_id),
      FOREIGN KEY (recorded_by) REFERENCES employees(employee_id),
      FOREIGN KEY (verified_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_measurements_plumbing CASCADE');
  await pool.query('DROP TABLE IF EXISTS project_floors CASCADE');
  await pool.query('DROP TABLE IF EXISTS component_elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS components CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_measurements_plumbing');
  await pool.query('DELETE FROM project_floors');
  await pool.query('DELETE FROM component_elements');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM components');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Green Valley Residences'),
      (2, 'Tech Park Phase II'),
      (3, 'Serenity Villa')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'John', 'Doe'),
      (2, 'Jane', 'Smith'),
      (3, 'Bob', 'Johnson')
  `);
  
  await pool.query(`
    INSERT INTO components (component_id, component_name)
    VALUES 
      (1, 'Bathroom Plumbing'),
      (2, 'Kitchen Plumbing'),
      (3, 'External Plumbing')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name)
    VALUES 
      (1, 'Water Supply'),
      (2, 'Drainage'),
      (3, 'Fixtures')
  `);
  
  await pool.query(`
    INSERT INTO component_elements (component_element_id, component_id, element_id)
    VALUES 
      (1, 1, 1),
      (2, 1, 2),
      (3, 2, 1)
  `);
  
  await pool.query(`
    INSERT INTO project_floors (floor_id, project_id, floor_name, floor_number)
    VALUES 
      (1, 1, 'Ground Floor', 0),
      (2, 1, 'First Floor', 1),
      (3, 2, 'Ground Floor', 0)
  `);
  
  await pool.query(`
    INSERT INTO architect_measurements_plumbing (
      measurement_id, project_id, component_id, component_element_id, floor_id, 
      room, fixture_type, fixture_description, quantity, water_supply_points, 
      drainage_points, hot_water_points, cold_water_points, pipe_material, 
      pipe_diameter, pipe_length, recorded_by, status
    )
    VALUES 
      (1, 1, 1, 1, 1, 'Master Bathroom', 'Wash Basin', 'Wall Mounted Basin', 1, 2, 1, 1, 1, 'CPVC', '1/2 inch', 5.5, 1, 'draft'),
      (2, 1, 1, 2, 1, 'Master Bathroom', 'WC', 'Wall Hung WC', 1, 1, 1, 0, 1, 'PVC', '4 inch', 2.0, 1, 'verified'),
      (3, 1, 2, 3, 1, 'Kitchen', 'Kitchen Sink', 'Double Bowl Sink', 1, 2, 1, 1, 1, 'CPVC', '3/4 inch', 8.0, 2, 'draft'),
      (4, 2, 3, 1, 3, 'External', 'Garden Tap', 'Bib Cock', 2, 2, 0, 0, 2, 'GI', '1/2 inch', 15.0, 1, 'draft')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('components_component_id_seq', 3)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('component_elements_component_element_id_seq', 3)");
  await pool.query("SELECT setval('project_floors_floor_id_seq', 3)");
  await pool.query("SELECT setval('architect_measurements_plumbing_measurement_id_seq', 4)");
});

describe('Architect Measurements Plumbing API', () => {
  // Test GET all plumbing measurements
  test('GET /architect-measurements-plumbing - should return all plumbing measurements', async () => {
    const response = await request(app).get('/architect-measurements-plumbing');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('measurement_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('recorded_by_name');
  });

  // Test GET plumbing measurement by ID
  test('GET /architect-measurements-plumbing/:id - should return a specific plumbing measurement', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Master Bathroom');
    expect(response.body).toHaveProperty('fixture_type', 'Wash Basin');
    expect(response.body).toHaveProperty('fixture_description', 'Wall Mounted Basin');
    expect(response.body).toHaveProperty('pipe_material', 'CPVC');
  });

  test('GET /architect-measurements-plumbing/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Plumbing measurement not found');
  });

  // Test GET plumbing measurements by project
  test('GET /architect-measurements-plumbing/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
    });
  });

  test('GET /architect-measurements-plumbing/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new plumbing measurement
  test('POST /architect-measurements-plumbing - should create a new plumbing measurement', async () => {
    const newMeasurement = {
      project_id: 1,
      component_id: 1,
      component_element_id: 1,
      floor_id: 2,
      room: 'Guest Bathroom',
      fixture_type: 'Shower',
      fixture_description: 'Glass Shower Enclosure',
      quantity: 1,
      water_supply_points: 1,
      drainage_points: 1,
      hot_water_points: 1,
      cold_water_points: 1,
      pipe_material: 'CPVC',
      pipe_diameter: '3/4 inch',
      pipe_length: 6.5,
      requires_client_selection: true,
      special_requirements: 'Rain shower head required',
      recorded_by: 1,
      status: 'draft'
    };
    
    const response = await request(app)
      .post('/architect-measurements-plumbing')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 5);
    expect(response.body).toHaveProperty('room', 'Guest Bathroom');
    expect(response.body).toHaveProperty('fixture_type', 'Shower');
    expect(response.body).toHaveProperty('requires_client_selection', true);
  });

  test('POST /architect-measurements-plumbing - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      room: 'Guest Bathroom',
      fixture_type: 'Shower'
    };
    
    const response = await request(app)
      .post('/architect-measurements-plumbing')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /architect-measurements-plumbing - should return 404 for non-existent project', async () => {
    const invalidMeasurement = {
      project_id: 999,
      component_id: 1,
      floor_id: 1
    };
    
    const response = await request(app)
      .post('/architect-measurements-plumbing')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test PUT update plumbing measurement
  test('PUT /architect-measurements-plumbing/:id - should update a plumbing measurement', async () => {
    const updatedData = {
      fixture_description: 'Premium Wall Mounted Basin',
      pipe_length: 6.0,
      hot_water_points: 2,
      special_requirements: 'Dual faucet installation',
      verified_by: 2,
      status: 'verified'
    };
    
    const response = await request(app)
      .put('/architect-measurements-plumbing/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('fixture_description', 'Premium Wall Mounted Basin');
    expect(response.body).toHaveProperty('pipe_length', '6.00');
    expect(response.body).toHaveProperty('hot_water_points', 2);
    expect(response.body).toHaveProperty('verified_by', 2);
  });

  test('PUT /architect-measurements-plumbing/:id - should return 404 for non-existent measurement', async () => {
    const updatedData = {
      pipe_length: 10.0
    };
    
    const response = await request(app)
      .put('/architect-measurements-plumbing/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Plumbing measurement not found');
  });

  // Test DELETE plumbing measurement
  test('DELETE /architect-measurements-plumbing/:id - should delete a plumbing measurement', async () => {
    const response = await request(app).delete('/architect-measurements-plumbing/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Plumbing measurement deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/architect-measurements-plumbing/1');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /architect-measurements-plumbing/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).delete('/architect-measurements-plumbing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Plumbing measurement not found');
  });

  // Test GET summary
  test('GET /architect-measurements-plumbing/summary/:projectId - should return project plumbing summary', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_floors');
    expect(response.body).toHaveProperty('total_rooms');
    expect(response.body).toHaveProperty('total_fixtures');
    expect(response.body).toHaveProperty('total_water_points');
    expect(response.body).toHaveProperty('total_drainage_points');
    expect(response.body).toHaveProperty('fixture_types');
  });

  // Test GET by floor
  test('GET /architect-measurements-plumbing/by-floor/:floorId - should return measurements for a floor', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/by-floor/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.floor_id).toBe(1);
    });
  });

  // Test GET by fixture type
  test('GET /architect-measurements-plumbing/by-fixture-type - should return measurements grouped by fixture type', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/by-fixture-type?projectId=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('fixture_type');
    expect(response.body[0]).toHaveProperty('total_quantity');
    expect(response.body[0]).toHaveProperty('total_water_points');
    expect(response.body[0]).toHaveProperty('rooms');
  });

  test('GET /architect-measurements-plumbing/by-fixture-type - should return 400 for missing projectId', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/by-fixture-type');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'projectId query parameter is required');
  });

  // Test GET pipe materials summary
  test('GET /architect-measurements-plumbing/pipe-materials/:projectId - should return pipe materials summary', async () => {
    const response = await request(app).get('/architect-measurements-plumbing/pipe-materials/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('pipe_material');
    expect(response.body[0]).toHaveProperty('total_length');
    expect(response.body[0]).toHaveProperty('usage_count');
  });
});
