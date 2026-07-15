// tests/architect_measurements_windows_route.test.js
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
    CREATE TABLE IF NOT EXISTS architect_measurements_windows (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      component_element_id INT,
      floor_id INT NOT NULL,
      room VARCHAR(100),
      window_location VARCHAR(255),
      window_type VARCHAR(100),
      window_material VARCHAR(100),
      width DECIMAL(10,2),
      height DECIMAL(10,2),
      sill_height DECIMAL(10,2),
      glass_type VARCHAR(100),
      glass_thickness VARCHAR(50),
      opening_style VARCHAR(100),
      number_of_shutters INT,
      grills_required BOOLEAN DEFAULT FALSE,
      mosquito_mesh_required BOOLEAN DEFAULT FALSE,
      requires_client_selection BOOLEAN DEFAULT FALSE,
      hardware_specifications TEXT,
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
  await pool.query('DROP TABLE IF EXISTS architect_measurements_windows CASCADE');
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
  await pool.query('DELETE FROM architect_measurements_windows');
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
      (1, 'Interior Windows'),
      (2, 'Exterior Windows'),
      (3, 'Specialty Windows')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name)
    VALUES 
      (1, 'Window Frame'),
      (2, 'Glass Panel'),
      (3, 'Window Hardware')
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
    INSERT INTO architect_measurements_windows (
      measurement_id, project_id, component_id, component_element_id, floor_id, 
      room, window_location, window_type, window_material, width, height, 
      sill_height, glass_type, glass_thickness, opening_style, number_of_shutters,
      grills_required, mosquito_mesh_required, recorded_by, status
    )
    VALUES 
      (1, 1, 1, 1, 1, 'Living Room', 'North Wall', 'Sliding', 'UPVC', 6.0, 4.0, 3.0, 'Clear Float', '5mm', 'Horizontal Sliding', 2, true, true, 1, 'draft'),
      (2, 1, 1, 2, 1, 'Master Bedroom', 'East Wall', 'Casement', 'Aluminum', 4.0, 4.0, 3.5, 'Tinted', '6mm', 'Side Hung', 2, true, false, 1, 'verified'),
      (3, 1, 2, 3, 2, 'Bedroom 1', 'West Wall', 'Fixed', 'Wood', 3.0, 3.0, 4.0, 'Frosted', '5mm', 'Fixed', 0, false, false, 2, 'draft'),
      (4, 2, 2, 1, 3, 'Office', 'South Wall', 'Awning', 'Aluminum', 5.0, 2.0, 4.5, 'Reflective', '8mm', 'Top Hung', 1, false, true, 1, 'draft')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('components_component_id_seq', 3)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('component_elements_component_element_id_seq', 3)");
  await pool.query("SELECT setval('project_floors_floor_id_seq', 3)");
  await pool.query("SELECT setval('architect_measurements_windows_measurement_id_seq', 4)");
});

describe('Architect Measurements Windows API', () => {
  // Test GET all window measurements
  test('GET /architect-measurements-windows - should return all window measurements', async () => {
    const response = await request(app).get('/architect-measurements-windows');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('measurement_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('recorded_by_name');
  });

  // Test GET window measurement by ID
  test('GET /architect-measurements-windows/:id - should return a specific window measurement', async () => {
    const response = await request(app).get('/architect-measurements-windows/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('window_location', 'North Wall');
    expect(response.body).toHaveProperty('window_type', 'Sliding');
    expect(response.body).toHaveProperty('window_material', 'UPVC');
    expect(response.body).toHaveProperty('glass_type', 'Clear Float');
  });

  test('GET /architect-measurements-windows/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).get('/architect-measurements-windows/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Window measurement not found');
  });

  // Test GET window measurements by project
  test('GET /architect-measurements-windows/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/architect-measurements-windows/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
    });
  });

  test('GET /architect-measurements-windows/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-measurements-windows/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new window measurement
  test('POST /architect-measurements-windows - should create a new window measurement', async () => {
    const newMeasurement = {
      project_id: 1,
      component_id: 1,
      component_element_id: 1,
      floor_id: 2,
      room: 'Guest Bedroom',
      window_location: 'North Wall',
      window_type: 'Bay Window',
      window_material: 'Wood',
      width: 5.5,
      height: 4.5,
      sill_height: 3.0,
      glass_type: 'Double Glazed',
      glass_thickness: '12mm',
      opening_style: 'Fixed + Casement',
      number_of_shutters: 3,
      grills_required: true,
      mosquito_mesh_required: true,
      requires_client_selection: true,
      hardware_specifications: 'Premium brass handles',
      special_requirements: 'UV coating required',
      recorded_by: 1,
      status: 'draft'
    };
    
    const response = await request(app)
      .post('/architect-measurements-windows')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 5);
    expect(response.body).toHaveProperty('room', 'Guest Bedroom');
    expect(response.body).toHaveProperty('window_type', 'Bay Window');
    expect(response.body).toHaveProperty('requires_client_selection', true);
  });

  test('POST /architect-measurements-windows - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      room: 'Guest Bedroom',
      window_type: 'Bay Window'
    };
    
    const response = await request(app)
      .post('/architect-measurements-windows')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /architect-measurements-windows - should return 404 for non-existent project', async () => {
    const invalidMeasurement = {
      project_id: 999,
      component_id: 1,
      floor_id: 1
    };
    
    const response = await request(app)
      .post('/architect-measurements-windows')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test PUT update window measurement
  test('PUT /architect-measurements-windows/:id - should update a window measurement', async () => {
    const updatedData = {
      window_location: 'North-East Wall',
      width: 6.5,
      height: 4.5,
      glass_type: 'Triple Glazed',
      glass_thickness: '18mm',
      hardware_specifications: 'Premium stainless steel handles',
      verified_by: 2,
      status: 'verified'
    };
    
    const response = await request(app)
      .put('/architect-measurements-windows/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('window_location', 'North-East Wall');
    expect(response.body).toHaveProperty('width', '6.50');
    expect(response.body).toHaveProperty('glass_type', 'Triple Glazed');
    expect(response.body).toHaveProperty('verified_by', 2);
  });

  test('PUT /architect-measurements-windows/:id - should return 404 for non-existent measurement', async () => {
    const updatedData = {
      width: 7.0
    };
    
    const response = await request(app)
      .put('/architect-measurements-windows/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Window measurement not found');
  });

  // Test DELETE window measurement
  test('DELETE /architect-measurements-windows/:id - should delete a window measurement', async () => {
    const response = await request(app).delete('/architect-measurements-windows/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Window measurement deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/architect-measurements-windows/1');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /architect-measurements-windows/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).delete('/architect-measurements-windows/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Window measurement not found');
  });

  // Test GET summary
  test('GET /architect-measurements-windows/summary/:projectId - should return project window summary', async () => {
    const response = await request(app).get('/architect-measurements-windows/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_floors');
    expect(response.body).toHaveProperty('total_rooms');
    expect(response.body).toHaveProperty('total_windows');
    expect(response.body).toHaveProperty('total_area');
    expect(response.body).toHaveProperty('window_types');
    expect(response.body).toHaveProperty('window_materials');
  });

  // Test GET by floor
  test('GET /architect-measurements-windows/by-floor/:floorId - should return measurements for a floor', async () => {
    const response = await request(app).get('/architect-measurements-windows/by-floor/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(measurement => {
      expect(measurement.floor_id).toBe(1);
    });
  });

  // Test GET by window type
  test('GET /architect-measurements-windows/by-type - should return measurements grouped by window type', async () => {
    const response = await request(app).get('/architect-measurements-windows/by-type?projectId=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('window_type');
    expect(response.body[0]).toHaveProperty('count');
    expect(response.body[0]).toHaveProperty('total_area');
    expect(response.body[0]).toHaveProperty('materials');
  });

  test('GET /architect-measurements-windows/by-type - should return 400 for missing projectId', async () => {
    const response = await request(app).get('/architect-measurements-windows/by-type');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'projectId query parameter is required');
  });

  // Test GET glass types summary
  test('GET /architect-measurements-windows/glass-types/:projectId - should return glass types summary', async () => {
    const response = await request(app).get('/architect-measurements-windows/glass-types/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('glass_type');
    expect(response.body[0]).toHaveProperty('count');
    expect(response.body[0]).toHaveProperty('total_area');
  });

  // Test GET windows requiring accessories
  test('GET /architect-measurements-windows/accessories/:projectId - should return windows requiring accessories', async () => {
    const response = await request(app).get('/architect-measurements-windows/accessories/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('with_grills');
    expect(response.body).toHaveProperty('with_mosquito_mesh');
    expect(response.body).toHaveProperty('with_both');
    expect(response.body).toHaveProperty('requiring_client_selection');
  });
});
