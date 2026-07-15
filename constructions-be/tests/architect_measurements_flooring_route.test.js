// tests/architect_measurements_flooring_route.test.js
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
    CREATE TABLE IF NOT EXISTS architect_measurements_flooring (
      measurement_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      component_element_id INT,
      floor_id INT NOT NULL,
      room VARCHAR(100),
      area_description TEXT,
      length DECIMAL(10,2),
      width DECIMAL(10,2),
      area DECIMAL(12,2),
      flooring_type VARCHAR(100),
      base_preparation_required BOOLEAN DEFAULT FALSE,
      base_thickness DECIMAL(5,2),
      skirting_required BOOLEAN DEFAULT FALSE,
      skirting_height DECIMAL(5,2),
      skirting_length DECIMAL(10,2),
      tile_size VARCHAR(50),
      pattern_type VARCHAR(100),
      flooring_choice_id INT,
      skirting_choice_id INT,
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
  await pool.query('DROP TABLE IF EXISTS architect_measurements_flooring CASCADE');
  await pool.query('DROP TABLE IF EXISTS project_floors CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS components CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_measurements_flooring');
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
      (1, 'Flooring'),
      (2, 'Walls'),
      (3, 'Ceiling')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Floor Tiles', 'Flooring'),
      (2, 'Skirting', 'Flooring'),
      (3, 'Base Preparation', 'Flooring')
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
    INSERT INTO architect_measurements_flooring (
      measurement_id, project_id, component_id, component_element_id, floor_id,
      room, area_description, length, width, area, flooring_type,
      base_preparation_required, base_thickness, skirting_required,
      skirting_height, skirting_length, tile_size, pattern_type,
      recorded_by, status
    ) VALUES 
      (1, 1, 1, 1, 1, 'Living Room', 'Main living area', 20.0, 15.0, 300.0, 'Vitrified Tiles', true, 2.5, true, 4.0, 70.0, '2x2 feet', 'Straight', 1, 'draft'),
      (2, 1, 1, 1, 1, 'Master Bedroom', 'Master bedroom flooring', 15.0, 12.0, 180.0, 'Wooden Flooring', false, 0.0, true, 4.0, 54.0, null, 'Herringbone', 1, 'verified'),
      (3, 1, 1, 2, 2, 'Bedroom 1', 'First floor bedroom', 12.0, 10.0, 120.0, 'Laminate', false, 0.0, true, 3.5, 44.0, null, 'Straight', 2, 'draft'),
      (4, 2, 1, 1, 3, 'Office Area', 'Open office flooring', 30.0, 25.0, 750.0, 'Granite', true, 3.0, true, 5.0, 110.0, '2x2 feet', 'Diagonal', 2, 'draft')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('components_component_id_seq', 3)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('project_floors_floor_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('architect_measurements_flooring_measurement_id_seq', 4)");
});

describe('Architect Measurements Flooring API', () => {
  // Test GET all flooring measurements
  test('GET /architect-measurements-flooring - should return all flooring measurements', async () => {
    const response = await request(app).get('/architect-measurements-flooring');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('measurement_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('floor_name');
    expect(response.body[0]).toHaveProperty('flooring_type');
    expect(response.body[0]).toHaveProperty('area');
  });
  
  // Test GET flooring measurement by ID
  test('GET /architect-measurements-flooring/:id - should return a specific flooring measurement', async () => {
    const response = await request(app).get('/architect-measurements-flooring/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('length', '20');
    expect(response.body).toHaveProperty('width', '15');
    expect(response.body).toHaveProperty('area', '300');
    expect(response.body).toHaveProperty('flooring_type', 'Vitrified Tiles');
    expect(response.body).toHaveProperty('tile_size', '2x2 feet');
    expect(response.body).toHaveProperty('base_preparation_required', true);
    expect(response.body).toHaveProperty('recorded_by_name', 'John Doe');
  });
  
  // Test GET flooring measurement by ID - not found
  test('GET /architect-measurements-flooring/:id - should return 404 for non-existent measurement', async () => {
    const response = await request(app).get('/architect-measurements-flooring/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Flooring measurement not found');
  });
  
  // Test GET flooring measurements by project
  test('GET /architect-measurements-flooring/project/:projectId - should return measurements for a project', async () => {
    const response = await request(app).get('/architect-measurements-flooring/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
    });
  });
  
  // Test GET flooring measurements by project - project not found
  test('GET /architect-measurements-flooring/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-measurements-flooring/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test POST new flooring measurement
  test('POST /architect-measurements-flooring - should create a new flooring measurement', async () => {
    const newMeasurement = {
      project_id: 1,
      component_id: 1,
      component_element_id: 1,
      floor_id: 2,
      room: 'Kitchen',
      area_description: 'Kitchen flooring area',
      length: 10.0,
      width: 8.0,
      area: 80.0,
      flooring_type: 'Anti-skid Tiles',
      base_preparation_required: true,
      base_thickness: 2.0,
      skirting_required: true,
      skirting_height: 3.5,
      skirting_length: 36.0,
      tile_size: '1x1 feet',
      pattern_type: 'Straight',
      flooring_choice_id: null,
      skirting_choice_id: null,
      requires_client_selection: true,
      recorded_by: 1,
      status: 'draft'
    };
    
    const response = await request(app)
      .post('/architect-measurements-flooring')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 5);
    expect(response.body).toHaveProperty('room', 'Kitchen');
    expect(response.body).toHaveProperty('flooring_type', 'Anti-skid Tiles');
    expect(response.body).toHaveProperty('area', '80');
    expect(response.body).toHaveProperty('requires_client_selection', true);
    
    // Verify measurement was actually created
    const allMeasurements = await request(app).get('/architect-measurements-flooring/project/1');
    expect(allMeasurements.body.length).toBe(4);
  });
  
  // Test POST flooring measurement - missing required fields
  test('POST /architect-measurements-flooring - should return 400 for missing required fields', async () => {
    const incompleteMeasurement = {
      room: 'Test Room',
      area: 100.0
    };
    
    const response = await request(app)
      .post('/architect-measurements-flooring')
      .send(incompleteMeasurement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required fields: project_id, component_id, floor_id');
  });
  
  // Test POST flooring measurement - project not found
  test('POST /architect-measurements-flooring - should return 404 for non-existent project', async () => {
    const measurementWithBadProject = {
      project_id: 999,
      component_id: 1,
      floor_id: 1,
      room: 'Test Room'
    };
    
    const response = await request(app)
      .post('/architect-measurements-flooring')
      .send(measurementWithBadProject);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test PUT update flooring measurement
  test('PUT /architect-measurements-flooring/:id - should update a flooring measurement', async () => {
    const updatedData = {
      room: 'Updated Living Room',
      length: 22.0,
      width: 16.0,
      area: 352.0,
      flooring_type: 'Marble',
      tile_size: '3x3 feet',
      verified_by: 2,
      status: 'verified'
    };
    
    const response = await request(app)
      .put('/architect-measurements-flooring/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Updated Living Room');
    expect(response.body).toHaveProperty('length', '22');
    expect(response.body).toHaveProperty('width', '16');
    expect(response.body).toHaveProperty('area', '352');
    expect(response.body).toHaveProperty('flooring_type', 'Marble');
    expect(response.body).toHaveProperty('verified_by', 2);
    expect(response.body).toHaveProperty('status', 'verified');
    expect(response.body).toHaveProperty('verified_at');
  });
  
  // Test PUT flooring measurement - not found
  test('PUT /architect-measurements-flooring/:id - should return 404 for non-existent measurement', async () => {
    const updatedData = {
      room: 'Non-existent Room'
    };
    
    const response = await request(app)
      .put('/architect-measurements-flooring/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Flooring measurement not found');
  });
  
  // Test DELETE flooring measurement
  test('DELETE /architect-measurements-flooring/:id - should delete a flooring measurement', async () => {
    const response = await request(app).delete('/architect-measurements-flooring/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Flooring measurement deleted successfully');
    
    // Verify measurement was actually deleted
    const deletedMeasurement = await request(app).get('/architect-measurements-flooring/4');
    expect(deletedMeasurement.status).toBe(404);
    
    const allMeasurements = await request(app).get('/architect-measurements-flooring');
    expect(allMeasurements.body.length).toBe(3);
  });
  
  // Test GET flooring measurements by floor
  test('GET /architect-measurements-flooring/floor/:projectId/:floorId - should return measurements for a specific floor', async () => {
    const response = await request(app).get('/architect-measurements-flooring/floor/1/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(measurement => {
      expect(measurement.project_id).toBe(1);
      expect(measurement.floor_id).toBe(1);
    });
  });
  
  // Test GET flooring summary
  test('GET /architect-measurements-flooring/summary/:projectId - should return flooring summary for project', async () => {
    const response = await request(app).get('/architect-measurements-flooring/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_floors', '2');
    expect(response.body).toHaveProperty('total_rooms', '3');
    expect(response.body).toHaveProperty('total_area', '600');
    expect(response.body).toHaveProperty('total_skirting_length', '168');
    expect(response.body).toHaveProperty('flooring_types_count', '3');
    expect(response.body).toHaveProperty('flooring_types');
    expect(response.body.flooring_types).toContain('Vitrified Tiles');
    expect(response.body.flooring_types).toContain('Wooden Flooring');
    expect(response.body.flooring_types).toContain('Laminate');
    expect(response.body).toHaveProperty('base_prep_required', '1');
    expect(response.body).toHaveProperty('skirting_required_count', '3');
  });
});
