// tests/architect_measurements_doors_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS components (
      component_id SERIAL PRIMARY KEY,
      component_name VARCHAR(100) NOT NULL
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
      component_id INT REFERENCES components(component_id),
      element_id INT REFERENCES elements(element_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_floors (
      floor_id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(project_id),
      floor_name VARCHAR(50) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      display_name VARCHAR(255)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_walls_measurement (
      wall_measurement_id SERIAL PRIMARY KEY,
      wall_name VARCHAR(100)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_measurements_doors (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(project_id),
      component_id INT NOT NULL REFERENCES components(component_id),
      component_element_id INT REFERENCES component_elements(component_element_id),
      floor_id INT NOT NULL REFERENCES project_floors(floor_id),
      room VARCHAR(100),
      door_location VARCHAR(255),
      wall_direction VARCHAR(20),
      door_width DECIMAL(10,2) NOT NULL,
      door_height DECIMAL(10,2) NOT NULL,
      door_thickness DECIMAL(10,2),
      frame_width DECIMAL(10,2),
      frame_thickness DECIMAL(10,2),
      door_type VARCHAR(100),
      door_material VARCHAR(100),
      door_style VARCHAR(100),
      quantity INT DEFAULT 1,
      door_choice_id INT REFERENCES item_choices(choice_option_id),
      requires_client_selection BOOLEAN DEFAULT TRUE,
      recorded_by INT REFERENCES employees(employee_id),
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_by INT REFERENCES employees(employee_id),
      verified_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'Draft',
      wall_measurement_id INT REFERENCES architect_walls_measurement(wall_measurement_id),
      wall_code VARCHAR(50),
      door_area DECIMAL(10,2)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_measurements_doors');
  await pool.query('DROP TABLE IF EXISTS architect_walls_measurement');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS project_floors');
  await pool.query('DROP TABLE IF EXISTS component_elements');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.query('DROP TABLE IF EXISTS components');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_measurements_doors');
  await pool.query('DELETE FROM architect_walls_measurement');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM project_floors');
  await pool.query('DELETE FROM component_elements');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM components');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com')
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Green Valley Residences'),
      (2, 'Tech Park Phase II')
  `);
  
  await pool.query(`
    INSERT INTO components (component_id, component_name)
    VALUES 
      (1, 'Doors'),
      (2, 'Windows')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name)
    VALUES 
      (1, 'Main Door'),
      (2, 'Internal Door')
  `);
  
  await pool.query(`
    INSERT INTO component_elements (component_element_id, component_id, element_id)
    VALUES 
      (1, 1, 1),
      (2, 1, 2)
  `);
  
  await pool.query(`
    INSERT INTO project_floors (floor_id, project_id, floor_name)
    VALUES 
      (1, 1, 'Ground Floor'),
      (2, 1, 'First Floor'),
      (3, 2, 'Ground Floor')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (choice_option_id, display_name)
    VALUES 
      (1, 'Teak Wood Door'),
      (2, 'Engineered Wood Door')
  `);
  
  await pool.query(`
    INSERT INTO architect_walls_measurement (wall_measurement_id, wall_name)
    VALUES 
      (1, 'North Wall - Living Room'),
      (2, 'South Wall - Bedroom')
  `);
  
  await pool.query(`
    INSERT INTO architect_measurements_doors (
      measurement_id, project_id, component_id, component_element_id, floor_id,
      room, door_location, wall_direction, door_width, door_height, door_thickness,
      door_type, door_material, quantity, door_choice_id, requires_client_selection,
      recorded_by, status, wall_measurement_id, door_area
    ) VALUES 
      (1, 1, 1, 1, 1, 'Living Room', 'Main Entrance', 'North', 3.5, 7.0, 0.15, 
       'Single', 'Wood', 1, 1, false, 1, 'Draft', 1, 24.5),
      (2, 1, 1, 2, 1, 'Bedroom', 'Room Entry', 'East', 3.0, 6.75, 0.10, 
       'Single', 'Wood', 1, NULL, true, 1, 'Draft', 2, 20.25),
      (3, 1, 1, 2, 2, 'Master Bedroom', 'Room Entry', 'West', 3.0, 6.75, 0.10, 
       'Single', 'Wood', 1, 2, false, 1, 'Verified', NULL, 20.25),
      (4, 2, 1, 1, 3, 'Office Entrance', 'Main Entry', 'South', 6.0, 7.0, 0.20, 
       'Double', 'Glass', 1, NULL, true, 2, 'Draft', NULL, 42.0)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('components_component_id_seq', 2)");
  await pool.query("SELECT setval('elements_element_id_seq', 2)");
  await pool.query("SELECT setval('component_elements_component_element_id_seq', 2)");
  await pool.query("SELECT setval('project_floors_floor_id_seq', 3)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 2)");
  await pool.query("SELECT setval('architect_walls_measurement_wall_measurement_id_seq', 2)");
  await pool.query("SELECT setval('architect_measurements_doors_measurement_id_seq', 4)");
});

describe('Architect Measurements Doors API', () => {
  // Test GET all door measurements
  test('GET /architect-measurements-doors - should return all door measurements', async () => {
    const response = await request(app).get('/architect-measurements-doors');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('measurement_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('door_width');
    expect(response.body[0]).toHaveProperty('door_height');
  });

  // Test GET door measurement by ID
  test('GET /architect-measurements-doors/:id - should return a specific door measurement', async () => {
    const response = await request(app).get('/architect-measurements-doors/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('door_location', 'Main Entrance');
    expect(response.body).toHaveProperty('door_width', '3.50');
    expect(response.body).toHaveProperty('door_height', '7.00');
    expect(response.body).toHaveProperty('door_choice_name', 'Teak Wood Door');
    expect(response.body).toHaveProperty('wall_name', 'North Wall - Living Room');
  });

  test('GET /architect-measurements-doors/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).get('/architect-measurements-doors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door measurement not found');
  });

  // Test GET door measurements by project
  test('GET /architect-measurements-doors/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/architect-measurements-doors/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
    });
  });

  test('GET /architect-measurements-doors/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-measurements-doors/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new door measurement
  test('POST /architect-measurements-doors - should create a new door measurement', async () => {
    const newMeasurement = {
      project_id: 1,
      component_id: 1,
      component_element_id: 2,
      floor_id: 2,
      room: 'Guest Room',
      door_location: 'Room Entry',
      wall_direction: 'North',
      door_width: 3.0,
      door_height: 6.75,
      door_thickness: 0.10,
      door_type: 'Single',
      door_material: 'Wood',
      quantity: 1,
      recorded_by: 1
    };
    
    const response = await request(app)
      .post('/architect-measurements-doors')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 5);
    expect(response.body).toHaveProperty('room', 'Guest Room');
    expect(response.body).toHaveProperty('door_area', 20.25);
    expect(response.body).toHaveProperty('requires_client_selection', true);
  });

  test('POST /architect-measurements-doors - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      project_id: 1,
      component_id: 1,
      // Missing floor_id, door_width, door_height
    };
    
    const response = await request(app)
      .post('/architect-measurements-doors')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required fields: project_id, component_id, floor_id, door_width, door_height');
  });

  test('POST /architect-measurements-doors - should return 404 for non-existent project', async () => {
    const invalidMeasurement = {
      project_id: 999,
      component_id: 1,
      floor_id: 1,
      door_width: 3.0,
      door_height: 6.75
    };
    
    const response = await request(app)
      .post('/architect-measurements-doors')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  test('POST /architect-measurements-doors - should return 404 for non-existent component', async () => {
    const invalidMeasurement = {
      project_id: 1,
      component_id: 999,
      floor_id: 1,
      door_width: 3.0,
      door_height: 6.75
    };
    
    const response = await request(app)
      .post('/architect-measurements-doors')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component not found');
  });

  test('POST /architect-measurements-doors - should return 404 for non-existent floor', async () => {
    const invalidMeasurement = {
      project_id: 1,
      component_id: 1,
      floor_id: 999,
      door_width: 3.0,
      door_height: 6.75
    };
    
    const response = await request(app)
      .post('/architect-measurements-doors')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Floor not found');
  });

  test('POST /architect-measurements-doors - should return 404 for non-existent door choice', async () => {
    const invalidMeasurement = {
      project_id: 1,
      component_id: 1,
      floor_id: 1,
      door_width: 3.0,
      door_height: 6.75,
      door_choice_id: 999
    };
    
    const response = await request(app)
      .post('/architect-measurements-doors')
      .send(invalidMeasurement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door choice not found');
  });

  // Test PUT update door measurement
  test('PUT /architect-measurements-doors/:id - should update a door measurement', async () => {
    const updatedData = {
      room: 'Updated Living Room',
      door_width: 4.0,
      door_height: 7.5,
      door_material: 'Glass',
      door_choice_id: 2
    };
    
    const response = await request(app)
      .put('/architect-measurements-doors/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Updated Living Room');
    expect(response.body).toHaveProperty('door_width', '4.00');
    expect(response.body).toHaveProperty('door_height', '7.50');
    expect(response.body).toHaveProperty('door_material', 'Glass');
    expect(response.body).toHaveProperty('door_area', 30);
  });

  test('PUT /architect-measurements-doors/:id - should return 404 for non-existent measurement', async () => {
    const updatedData = {
      room: 'Updated Room'
    };
    
    const response = await request(app)
      .put('/architect-measurements-doors/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door measurement not found');
  });

  test('PUT /architect-measurements-doors/:id - should return 404 for invalid door choice', async () => {
    const updatedData = {
      door_choice_id: 999
    };
    
    const response = await request(app)
      .put('/architect-measurements-doors/1')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door choice not found');
  });

  test('PUT /architect-measurements-doors/:id - should return 400 for no valid fields', async () => {
    const invalidData = {
      project_id: 2, // This field shouldn't be updated
      measurement_id: 999 // This field shouldn't be updated
    };
    
    const response = await request(app)
      .put('/architect-measurements-doors/1')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'No valid fields to update');
  });

  // Test PATCH verify door measurement
  test('PATCH /architect-measurements-doors/:id/verify - should verify a door measurement', async () => {
    const response = await request(app)
      .patch('/architect-measurements-doors/1/verify')
      .send({ verified_by: 2 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('verified_at');
  });

  test('PATCH /architect-measurements-doors/:id/verify - should return 400 for missing verified_by', async () => {
    const response = await request(app)
      .patch('/architect-measurements-doors/1/verify')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'verified_by is required');
  });

  test('PATCH /architect-measurements-doors/:id/verify - should return 404 for non-existent measurement', async () => {
    const response = await request(app)
      .patch('/architect-measurements-doors/999/verify')
      .send({ verified_by: 2 });
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door measurement not found');
  });

  // Test DELETE door measurement
  test('DELETE /architect-measurements-doors/:id - should delete a door measurement', async () => {
    const response = await request(app).delete('/architect-measurements-doors/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Door measurement deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/architect-measurements-doors/1');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /architect-measurements-doors/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).delete('/architect-measurements-doors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door measurement not found');
  });

  // Test GET door measurements by floor
  test('GET /architect-measurements-doors/floor/:projectId/:floorId - should return measurements for a floor', async () => {
    const response = await request(app).get('/architect-measurements-doors/floor/1/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
      expect(measurement.floor_id).toBe(1);
    });
  });

  // Test GET door measurements by wall
  test('GET /architect-measurements-doors/wall/:wallMeasurementId - should return measurements for a wall', async () => {
    const response = await request(app).get('/architect-measurements-doors/wall/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('wall_measurement_id', 1);
    expect(response.body[0]).toHaveProperty('door_location', 'Main Entrance');
  });

  // Test GET pending selections
  test('GET /architect-measurements-doors/pending-selection/:projectId - should return pending selections', async () => {
    const response = await request(app).get('/architect-measurements-doors/pending-selection/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('requires_client_selection', true);
    expect(response.body[0]).toHaveProperty('door_choice_id', null);
    expect(response.body[0]).toHaveProperty('room', 'Bedroom');
  });
});
