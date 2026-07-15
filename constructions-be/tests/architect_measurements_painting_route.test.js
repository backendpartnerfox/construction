// tests/architect_measurements_painting_route.test.js
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
    CREATE TABLE IF NOT EXISTS architect_measurements_painting (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      component_element_id INT,
      floor_id INT NOT NULL,
      room VARCHAR(100),
      surface_description VARCHAR(255),
      surface_type VARCHAR(100),
      length DECIMAL(10,2),
      height DECIMAL(10,2),
      area DECIMAL(12,2),
      door_window_area DECIMAL(12,2),
      net_area DECIMAL(12,2),
      surface_preparation VARCHAR(100),
      primer_coats INT,
      putty_coats INT,
      paint_coats INT,
      paint_finish VARCHAR(100),
      paint_brand_choice_id INT,
      paint_color VARCHAR(100),
      requires_client_selection BOOLEAN DEFAULT FALSE,
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
  await pool.query('DROP TABLE IF EXISTS architect_measurements_painting CASCADE');
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
  await pool.query('DELETE FROM architect_measurements_painting');
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
      (1, 'Interior Painting'),
      (2, 'Exterior Painting'),
      (3, 'Ceiling Painting')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name)
    VALUES 
      (1, 'Walls'),
      (2, 'Ceilings'),
      (3, 'Doors')
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
    INSERT INTO architect_measurements_painting (
      measurement_id, project_id, component_id, component_element_id, floor_id, 
      room, surface_description, surface_type, length, height, area, 
      door_window_area, net_area, paint_finish, paint_color, recorded_by, status
    )
    VALUES 
      (1, 1, 1, 1, 1, 'Living Room', 'North Wall', 'Wall', 4.5, 3.0, 13.5, 2.0, 11.5, 'Matte', 'White', 1, 'draft'),
      (2, 1, 1, 1, 1, 'Living Room', 'South Wall', 'Wall', 4.5, 3.0, 13.5, 3.0, 10.5, 'Matte', 'White', 1, 'verified'),
      (3, 1, 1, 2, 2, 'Bedroom 1', 'Ceiling', 'Ceiling', 4.0, 3.5, 14.0, 0, 14.0, 'Flat', 'Off-White', 2, 'draft'),
      (4, 2, 2, 3, 3, 'Exterior', 'Front Wall', 'External Wall', 10.0, 3.5, 35.0, 5.0, 30.0, 'Weather Coat', 'Beige', 1, 'draft')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('components_component_id_seq', 3)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('component_elements_component_element_id_seq', 3)");
  await pool.query("SELECT setval('project_floors_floor_id_seq', 3)");
  await pool.query("SELECT setval('architect_measurements_painting_measurement_id_seq', 4)");
});

describe('Architect Measurements Painting API', () => {
  // Test GET all painting measurements
  test('GET /architect-measurements-painting - should return all painting measurements', async () => {
    const response = await request(app).get('/architect-measurements-painting');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('measurement_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('recorded_by_name');
  });

  // Test GET painting measurement by ID
  test('GET /architect-measurements-painting/:id - should return a specific painting measurement', async () => {
    const response = await request(app).get('/architect-measurements-painting/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('surface_description', 'North Wall');
    expect(response.body).toHaveProperty('paint_finish', 'Matte');
    expect(response.body).toHaveProperty('paint_color', 'White');
  });

  test('GET /architect-measurements-painting/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).get('/architect-measurements-painting/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Painting measurement not found');
  });

  // Test GET painting measurements by project
  test('GET /architect-measurements-painting/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/architect-measurements-painting/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
    });
  });

  test('GET /architect-measurements-painting/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-measurements-painting/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new painting measurement
  test('POST /architect-measurements-painting - should create a new painting measurement', async () => {
    const newMeasurement = {
      project_id: 1,
      component_id: 1,
      component_element_id: 1,
      floor_id: 1,
      room: 'Master Bedroom',
      surface_description: 'East Wall',
      surface_type: 'Wall',
      length: 4.0,
      height: 3.0,
      area: 12.0,
      door_window_area: 2.0,
      net_area: 10.0,
      surface_preparation: 'Putty + Primer',
      primer_coats: 1,
      putty_coats: 2,
      paint_coats: 2,
      paint_finish: 'Satin',
      paint_color: 'Light Blue',
      requires_client_selection: true,
      recorded_by: 1,
      status: 'draft'
    };
    
    const response = await request(app)
      .post('/architect-measurements-painting')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 5);
    expect(response.body).toHaveProperty('room', 'Master Bedroom');
    expect(response.body).toHaveProperty('paint_finish', 'Satin');
    expect(response.body).toHaveProperty('requires_client_selection', true);
  });

  test('POST /architect-measurements-painting - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      room: 'Master Bedroom',
      surface_type: 'Wall'
    };
    
    const response = await request(app)
      .post('/architect-measurements-painting')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /architect-measurements-painting - should return 404 for non-existent project', async () => {
    const invalidMeasurement = {
      project_id: 999,
      component_id: 1,
      floor_id: 1
    };
    
    const response = await request(app)
      .post('/architect-measurements-painting')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test PUT update painting measurement
  test('PUT /architect-measurements-painting/:id - should update a painting measurement', async () => {
    const updatedData = {
      surface_description: 'North Wall (Updated)',
      paint_finish: 'Glossy',
      paint_color: 'Cream',
      area: 14.0,
      net_area: 12.0,
      verified_by: 2,
      status: 'verified'
    };
    
    const response = await request(app)
      .put('/architect-measurements-painting/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('surface_description', 'North Wall (Updated)');
    expect(response.body).toHaveProperty('paint_finish', 'Glossy');
    expect(response.body).toHaveProperty('paint_color', 'Cream');
    expect(response.body).toHaveProperty('verified_by', 2);
  });

  test('PUT /architect-measurements-painting/:id - should return 404 for non-existent measurement', async () => {
    const updatedData = {
      paint_color: 'Green'
    };
    
    const response = await request(app)
      .put('/architect-measurements-painting/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Painting measurement not found');
  });

  // Test DELETE painting measurement
  test('DELETE /architect-measurements-painting/:id - should delete a painting measurement', async () => {
    const response = await request(app).delete('/architect-measurements-painting/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Painting measurement deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/architect-measurements-painting/1');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /architect-measurements-painting/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).delete('/architect-measurements-painting/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Painting measurement not found');
  });

  // Test GET summary
  test('GET /architect-measurements-painting/summary/:projectId - should return project painting summary', async () => {
    const response = await request(app).get('/architect-measurements-painting/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_floors');
    expect(response.body).toHaveProperty('total_rooms');
    expect(response.body).toHaveProperty('total_area');
    expect(response.body).toHaveProperty('total_net_area');
    expect(response.body).toHaveProperty('surface_types');
    expect(response.body).toHaveProperty('paint_finishes');
  });

  // Test GET by floor
  test('GET /architect-measurements-painting/by-floor/:floorId - should return measurements for a floor', async () => {
    const response = await request(app).get('/architect-measurements-painting/by-floor/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(measurement => {
      expect(measurement.floor_id).toBe(1);
    });
  });

  // Test GET by room
  test('GET /architect-measurements-painting/by-room - should return measurements grouped by room', async () => {
    const response = await request(app).get('/architect-measurements-painting/by-room?projectId=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0]).toHaveProperty('room');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('surface_count');
    expect(response.body[0]).toHaveProperty('total_area');
    expect(response.body[0]).toHaveProperty('total_net_area');
  });

  test('GET /architect-measurements-painting/by-room - should return 400 for missing projectId', async () => {
    const response = await request(app).get('/architect-measurements-painting/by-room');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'projectId query parameter is required');
  });
});
