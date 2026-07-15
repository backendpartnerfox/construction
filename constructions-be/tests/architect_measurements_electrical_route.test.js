// tests/architect_measurements_electrical_route.test.js
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
      client_id INT,
      project_manager_id INT,
      architect_id INT,
      description TEXT,
      project_type VARCHAR(100),
      location VARCHAR(255),
      site_address TEXT,
      start_date DATE,
      estimated_end_date DATE,
      actual_end_date DATE,
      status VARCHAR(50) DEFAULT 'Planning',
      completion_percentage DECIMAL(5,2) DEFAULT 0,
      estimated_budget DECIMAL(15,2),
      actual_cost DECIMAL(15,2),
      currency VARCHAR(3) DEFAULT 'INR',
      total_area DECIMAL(12,2),
      area_unit VARCHAR(20) DEFAULT 'sqft',
      number_of_floors INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS components (
      component_id SERIAL PRIMARY KEY,
      component_name VARCHAR(100) NOT NULL,
      component_description TEXT,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS elements (
      element_id SERIAL PRIMARY KEY,
      element_name VARCHAR(100) NOT NULL,
      element_category VARCHAR(50),
      element_description TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_floors (
      floor_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      floor_name VARCHAR(50) NOT NULL,
      floor_number INT,
      floor_area DECIMAL(12,2),
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_measurements_electrical (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      component_element_id INT,
      floor_id INT NOT NULL,
      room VARCHAR(100),
      circuit_description TEXT,
      light_points INT DEFAULT 0,
      fan_points INT DEFAULT 0,
      power_outlets_5a INT DEFAULT 0,
      power_outlets_15a INT DEFAULT 0,
      ac_points INT DEFAULT 0,
      ups_points INT DEFAULT 0,
      data_points INT DEFAULT 0,
      tv_points INT DEFAULT 0,
      telephone_points INT DEFAULT 0,
      conduit_length_1_inch DECIMAL(10,2) DEFAULT 0,
      conduit_length_3_4_inch DECIMAL(10,2) DEFAULT 0,
      wire_length_1_5_sqmm DECIMAL(10,2) DEFAULT 0,
      wire_length_2_5_sqmm DECIMAL(10,2) DEFAULT 0,
      wire_length_4_sqmm DECIMAL(10,2) DEFAULT 0,
      mcb_required INT DEFAULT 0,
      db_required BOOLEAN DEFAULT FALSE,
      switch_brand_choice_id INT,
      wire_brand_choice_id INT,
      requires_client_selection BOOLEAN DEFAULT FALSE,
      recorded_by INT,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INT,
      verified_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'draft',
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (component_id) REFERENCES components(component_id),
      FOREIGN KEY (component_element_id) REFERENCES elements(element_id),
      FOREIGN KEY (floor_id) REFERENCES project_floors(floor_id),
      FOREIGN KEY (recorded_by) REFERENCES employees(employee_id),
      FOREIGN KEY (verified_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_measurements_electrical CASCADE');
  await pool.query('DROP TABLE IF EXISTS project_floors CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS components CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_measurements_electrical');
  await pool.query('DELETE FROM project_floors');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM components');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code, location)
    VALUES 
      (1, 'Green Valley Residences', 'GVR-2024-01', 'Hyderabad'),
      (2, 'Tech Park Phase II', 'TP2-2024-02', 'Mumbai')
  `);
  
  await pool.query(`
    INSERT INTO components (component_id, component_name)
    VALUES 
      (1, 'Electrical'),
      (2, 'Plumbing'),
      (3, 'HVAC')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Wiring', 'Electrical'),
      (2, 'Switches', 'Electrical'),
      (3, 'Distribution Board', 'Electrical')
  `);
  
  await pool.query(`
    INSERT INTO project_floors (floor_id, project_id, floor_name, floor_number)
    VALUES 
      (1, 1, 'Ground Floor', 0),
      (2, 1, 'First Floor', 1),
      (3, 2, 'Ground Floor', 0)
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com')
  `);
  
  await pool.query(`
    INSERT INTO architect_measurements_electrical (
      measurement_id, project_id, component_id, component_element_id, floor_id,
      room, circuit_description, light_points, fan_points, power_outlets_5a,
      power_outlets_15a, ac_points, conduit_length_1_inch, wire_length_1_5_sqmm,
      mcb_required, db_required, recorded_by, status
    ) VALUES 
      (1, 1, 1, 1, 1, 'Living Room', 'Main lighting circuit', 4, 2, 6, 2, 1, 50.5, 150.0, 3, true, 1, 'draft'),
      (2, 1, 1, 2, 1, 'Master Bedroom', 'Bedroom circuit', 3, 1, 4, 1, 1, 35.0, 120.0, 2, false, 1, 'verified'),
      (3, 1, 1, 1, 2, 'Bedroom 1', 'Secondary bedroom circuit', 2, 1, 3, 0, 0, 25.0, 80.0, 1, false, 2, 'draft'),
      (4, 2, 1, 3, 3, 'Office Area', 'Office power circuit', 8, 4, 12, 6, 4, 120.0, 350.0, 6, true, 2, 'draft')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('components_component_id_seq', 3)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('project_floors_floor_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('architect_measurements_electrical_measurement_id_seq', 4)");
});

describe('Architect Measurements Electrical API', () => {
  // Test GET all electrical measurements
  test('GET /architect-measurements-electrical - should return all electrical measurements', async () => {
    const response = await request(app).get('/architect-measurements-electrical');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('measurement_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('light_points');
    expect(response.body[0]).toHaveProperty('fan_points');
  });
  
  // Test GET electrical measurement by ID
  test('GET /architect-measurements-electrical/:id - should return a specific electrical measurement', async () => {
    const response = await request(app).get('/architect-measurements-electrical/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('light_points', 4);
    expect(response.body).toHaveProperty('fan_points', 2);
    expect(response.body).toHaveProperty('power_outlets_5a', 6);
    expect(response.body).toHaveProperty('db_required', true);
    expect(response.body).toHaveProperty('recorded_by_name', 'John Doe');
  });
  
  // Test GET electrical measurement by ID - not found
  test('GET /architect-measurements-electrical/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).get('/architect-measurements-electrical/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Electrical measurement not found');
  });
  
  // Test GET electrical measurements by project
  test('GET /architect-measurements-electrical/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/architect-measurements-electrical/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
    });
  });
  
  // Test GET electrical measurements by project - project not found
  test('GET /architect-measurements-electrical/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-measurements-electrical/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test POST new electrical measurement
  test('POST /architect-measurements-electrical - should create a new electrical measurement', async () => {
    const newMeasurement = {
      project_id: 1,
      component_id: 1,
      component_element_id: 1,
      floor_id: 2,
      room: 'Kitchen',
      circuit_description: 'Kitchen power circuit',
      light_points: 3,
      fan_points: 1,
      power_outlets_5a: 4,
      power_outlets_15a: 2,
      ac_points: 0,
      ups_points: 1,
      data_points: 0,
      tv_points: 0,
      telephone_points: 0,
      conduit_length_1_inch: 30.0,
      conduit_length_3_4_inch: 15.0,
      wire_length_1_5_sqmm: 100.0,
      wire_length_2_5_sqmm: 50.0,
      wire_length_4_sqmm: 20.0,
      mcb_required: 2,
      db_required: false,
      switch_brand_choice_id: null,
      wire_brand_choice_id: null,
      requires_client_selection: true,
      recorded_by: 1,
      status: 'draft'
    };
    
    const response = await request(app)
      .post('/architect-measurements-electrical')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 5);
    expect(response.body).toHaveProperty('room', 'Kitchen');
    expect(response.body).toHaveProperty('light_points', 3);
    expect(response.body).toHaveProperty('requires_client_selection', true);
    
    // Verify measurement was actually created
    const allMeasurements = await request(app).get('/architect-measurements-electrical/project/1');
    expect(allMeasurements.body.length).toBe(4);
  });
  
  // Test POST electrical measurement - missing required fields
  test('POST /architect-measurements-electrical - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      room: 'Test Room',
      light_points: 2
    };
    
    const response = await request(app)
      .post('/architect-measurements-electrical')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required fields: project_id, component_id, floor_id');
  });
  
  // Test POST electrical measurement - project not found
  test('POST /architect-measurements-electrical - should return 404 for non-existent project', async () => {
    const measurementWithBadProject = {
      project_id: 999,
      component_id: 1,
      floor_id: 1,
      room: 'Test Room'
    };
    
    const response = await request(app)
      .post('/architect-measurements-electrical')
      .send(measurementWithBadProject);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test PUT update electrical measurement
  test('PUT /architect-measurements-electrical/:id - should update an electrical measurement', async () => {
    const updatedData = {
      room: 'Updated Living Room',
      light_points: 6,
      fan_points: 3,
      power_outlets_5a: 8,
      verified_by: 2,
      status: 'verified'
    };
    
    const response = await request(app)
      .put('/architect-measurements-electrical/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Updated Living Room');
    expect(response.body).toHaveProperty('light_points', 6);
    expect(response.body).toHaveProperty('fan_points', 3);
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('status', 'verified');
    expect(response.body).toHaveProperty('verified_at');
  });
  
  // Test PUT electrical measurement - not found
  test('PUT /architect-measurements-electrical/:id - should return 404 for non-existent measurement', async () => {
    const updatedData = {
      room: 'Non-existent Room'
    };
    
    const response = await request(app)
      .put('/architect-measurements-electrical/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Electrical measurement not found');
  });
  
  // Test DELETE electrical measurement
  test('DELETE /architect-measurements-electrical/:id - should delete an electrical measurement', async () => {
    const response = await request(app).delete('/architect-measurements-electrical/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Electrical measurement deleted successfully');
    
    // Verify measurement was actually deleted
    const deletedMeasurement = await request(app).get('/architect-measurements-electrical/4');
    expect(deletedMeasurement.status).toBe(404);
    
    const allMeasurements = await request(app).get('/architect-measurements-electrical');
    expect(allMeasurements.body.length).toBe(3);
  });
  
  // Test GET electrical measurements by floor
  test('GET /architect-measurements-electrical/floor/:projectId/:floorId - should return measurements for a specific floor', async () => {
    const response = await request(app).get('/architect-measurements-electrical/floor/1/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
      expect(measurement.floor_id).toBe(1);
    });
  });
  
  // Test GET electrical summary
  test('GET /architect-measurements-electrical/summary/:projectId - should return electrical summary for project', async () => {
    const response = await request(app).get('/architect-measurements-electrical/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_floors', '2');
    expect(response.body).toHaveProperty('total_rooms', '3');
    expect(response.body).toHaveProperty('total_light_points', '9');
    expect(response.body).toHaveProperty('total_fan_points', '4');
    expect(response.body).toHaveProperty('total_power_outlets_5a', '13');
    expect(response.body).toHaveProperty('total_power_outlets_15a', '3');
    expect(response.body).toHaveProperty('total_ac_points', '2');
    expect(response.body).toHaveProperty('total_mcb_required', '6');
    expect(response.body).toHaveProperty('total_db_required', '1');
  });
});
