// tests/architect_walls_measurement_route.test.js
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
      project_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS brick_choices (
      brick_choice_id SERIAL PRIMARY KEY,
      brick_name VARCHAR(100) NOT NULL
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
    CREATE TABLE IF NOT EXISTS architect_walls_measurement (
      measurement_id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id),
      floor VARCHAR(50),
      room VARCHAR(100),
      walltype VARCHAR(50),
      wall_direction VARCHAR(50),
      wall_thickness DECIMAL(10,2),
      brick_choice_id INTEGER REFERENCES brick_choices(brick_choice_id),
      width DECIMAL(10,2),
      height DECIMAL(10,2),
      total_wall_width DECIMAL(10,2),
      window_width DECIMAL(10,2),
      window_height DECIMAL(10,2),
      window2_width DECIMAL(10,2),
      window2_height DECIMAL(10,2),
      door_width DECIMAL(10,2),
      door_height DECIMAL(10,2),
      door2_width DECIMAL(10,2),
      door2_height DECIMAL(10,2),
      lintel_width DECIMAL(10,2),
      lintel_height DECIMAL(10,2),
      created_by INTEGER REFERENCES employees(employee_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_walls_measurement');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.query('DROP TABLE IF EXISTS brick_choices');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_walls_measurement');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM brick_choices');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Test Project 1'),
      (2, 'Test Project 2')
  `);
  
  await pool.query(`
    INSERT INTO brick_choices (brick_choice_id, brick_name)
    VALUES 
      (1, 'Red Brick'),
      (2, 'Clay Brick')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'John', 'Doe'),
      (2, 'Jane', 'Smith')
  `);
  
  await pool.query(`
    INSERT INTO architect_walls_measurement (
      measurement_id, project_id, floor, room, walltype, wall_direction, 
      wall_thickness, brick_choice_id, width, height, total_wall_width,
      window_width, window_height, door_width, door_height, created_by
    )
    VALUES 
      (1, 1, 'Ground Floor', 'Living Room', 'Exterior', 'North', 
       9.00, 1, 15.00, 10.00, 15.00, 4.00, 4.00, 3.50, 7.00, 1),
      (2, 1, 'First Floor', 'Bedroom', 'Interior', 'East', 
       4.50, 2, 12.00, 10.00, 12.00, 3.00, 3.00, 3.00, 7.00, 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('brick_choices_brick_choice_id_seq', 2)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('architect_walls_measurement_measurement_id_seq', 2)");
});

describe('Architect Wall Measurements API', () => {
  // Test GET all wall measurements
  test('GET /architect-walls-measurements - should return all measurements', async () => {
    const response = await request(app).get('/architect-walls-measurements');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('measurement_id', 1);
    expect(response.body[0]).toHaveProperty('room', 'Living Room');
    expect(response.body[1]).toHaveProperty('measurement_id', 2);
    expect(response.body[1]).toHaveProperty('room', 'Bedroom');
  });
  
  // Test GET wall measurement by ID
  test('GET /architect-walls-measurements/:id - should return a specific measurement', async () => {
    const response = await request(app).get('/architect-walls-measurements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('floor', 'Ground Floor');
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('walltype', 'Exterior');
    expect(response.body).toHaveProperty('wall_direction', 'North');
    expect(response.body).toHaveProperty('wall_thickness', '9.00');
    expect(response.body).toHaveProperty('width', '15.00');
    expect(response.body).toHaveProperty('height', '10.00');
  });
  
  // Test GET wall measurement by ID - not found
  test('GET /architect-walls-measurements/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).get('/architect-walls-measurements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect wall measurement not found');
  });
  
  // Test POST new wall measurement
  test('POST /architect-walls-measurements - should create a new measurement', async () => {
    const newMeasurement = {
      project_id: 2,
      floor: 'Second Floor',
      room: 'Study Room',
      walltype: 'Interior',
      wall_direction: 'West',
      wall_thickness: 4.50,
      brick_choice_id: 1,
      width: 10.00,
      height: 9.00,
      total_wall_width: 10.00,
      window_width: 2.50,
      window_height: 3.00,
      door_width: 3.00,
      door_height: 7.00,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/architect-walls-measurements')
      .send(newMeasurement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('measurement_id', 3);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('floor', 'Second Floor');
    expect(response.body).toHaveProperty('room', 'Study Room');
    expect(response.body).toHaveProperty('wall_thickness', '4.50');
    
    // Verify measurement was actually created
    const allMeasurements = await request(app).get('/architect-walls-measurements');
    expect(allMeasurements.body.length).toBe(3);
  });
  
  // Test POST wall measurement - missing required fields
  test('POST /architect-walls-measurements - should handle validation errors', async () => {
    // This test will depend on how your route handles validation
    // For example, if project_id is required in your implementation:
    const incompleteMeasurement = {
      floor: 'Second Floor',
      room: 'Study Room',
      // Missing required fields like project_id
    };
    
    const response = await request(app)
      .post('/architect-walls-measurements')
      .send(incompleteMeasurement);
    
    // If your route checks for required fields, status should be 400
    // If it passes to DB and DB rejects due to NOT NULL constraint, status might be 500 with a specific message
    expect(response.status).toBe(400);
    // Test the response based on your implementation
  });
  
  // Test PUT update wall measurement
  test('PUT /architect-walls-measurements/:id - should update a measurement', async () => {
    const updatedData = {
      project_id: 1,
      floor: 'Ground Floor',
      room: 'Living Room Updated',
      walltype: 'Exterior',
      wall_direction: 'South',
      wall_thickness: 10.00,
      brick_choice_id: 2,
      width: 16.00,
      height: 11.00,
      total_wall_width: 16.00,
      window_width: 5.00,
      window_height: 5.00,
      door_width: 4.00,
      door_height: 8.00
    };
    
    const response = await request(app)
      .put('/architect-walls-measurements/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('measurement_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room Updated');
    expect(response.body).toHaveProperty('wall_direction', 'South');
    expect(response.body).toHaveProperty('wall_thickness', '10.00');
    expect(response.body).toHaveProperty('width', '16.00');
    
    // Verify measurement was actually updated
    const updatedMeasurement = await request(app).get('/architect-walls-measurements/1');
    expect(updatedMeasurement.body.room).toBe('Living Room Updated');
    expect(updatedMeasurement.body.width).toBe('16.00');
  });
  
  // Test PUT update wall measurement - not found
  test('PUT /architect-walls-measurements/:id - should return 404 for non-existent ID', async () => {
    const updatedData = {
      project_id: 1,
      floor: 'Ground Floor',
      room: 'Living Room Updated',
      walltype: 'Exterior',
      wall_direction: 'South',
      wall_thickness: 10.00,
      brick_choice_id: 2,
      width: 16.00,
      height: 11.00
    };
    
    const response = await request(app)
      .put('/architect-walls-measurements/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect wall measurement not found');
  });
  
  // Test DELETE wall measurement
  test('DELETE /architect-walls-measurements/:id - should delete a measurement', async () => {
    const response = await request(app).delete('/architect-walls-measurements/1');
    
    expect(response.status).toBe(204);
    
    // Verify measurement was actually deleted
    const deletedMeasurement = await request(app).get('/architect-walls-measurements/1');
    expect(deletedMeasurement.status).toBe(404);
    
    const allMeasurements = await request(app).get('/architect-walls-measurements');
    expect(allMeasurements.body.length).toBe(1);
  });
  
  // Test DELETE wall measurement - not found
  test('DELETE /architect-walls-measurements/:id - should return 404 for non-existent ID', async () => {
    const response = await request(app).delete('/architect-walls-measurements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect wall measurement not found');
  });
  
  // Test GET measurements by project
  test('GET /architect-walls-measurements/project/:projectId - should return measurements for a project', async () => {
    // Add another measurement for a different project
    await pool.query(`
      INSERT INTO architect_walls_measurement (
        project_id, floor, room, walltype, wall_direction, 
        wall_thickness, brick_choice_id, width, height, total_wall_width,
        window_width, window_height, door_width, door_height, created_by
      )
      VALUES (
        2, 'Ground Floor', 'Kitchen', 'Interior', 'North', 
        4.50, 1, 10.00, 9.00, 10.00, 0.00, 0.00, 3.00, 7.00, 1
      )
    `);
    
    const response = await request(app).get('/architect-walls-measurements/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
    
    // Test with the other project
    const otherResponse = await request(app).get('/architect-walls-measurements/project/2');
    expect(otherResponse.status).toBe(200);
    expect(otherResponse.body.length).toBe(1);
    expect(otherResponse.body[0]).toHaveProperty('project_id', 2);
    expect(otherResponse.body[0]).toHaveProperty('room', 'Kitchen');
  });
  
  // Test GET measurements by room
  test('GET /architect-walls-measurements/room - should return measurements for a specific room', async () => {
    // Add another measurement for the same room
    await pool.query(`
      INSERT INTO architect_walls_measurement (
        project_id, floor, room, walltype, wall_direction, 
        wall_thickness, brick_choice_id, width, height, total_wall_width,
        window_width, window_height, door_width, door_height, created_by
      )
      VALUES (
        1, 'Ground Floor', 'Living Room', 'Interior', 'East', 
        4.50, 1, 12.00, 10.00, 12.00, 0.00, 0.00, 0.00, 0.00, 1
      )
    `);
    
    const response = await request(app).get('/architect-walls-measurements/room')
      .query({ 
        projectId: 1, 
        floor: 'Ground Floor', 
        room: 'Living Room' 
      });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[0]).toHaveProperty('floor', 'Ground Floor');
    expect(response.body[0]).toHaveProperty('room', 'Living Room');
    expect(response.body[1]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('floor', 'Ground Floor');
    expect(response.body[1]).toHaveProperty('room', 'Living Room');
  });
  
  // Test GET measurements by room - missing required parameters
  test('GET /architect-walls-measurements/room - should return 400 for missing parameters', async () => {
    const response = await request(app).get('/architect-walls-measurements/room')
      .query({ 
        projectId: 1,
        // Missing floor and room
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, floor, and room are required');
  });
  
  // Test GET measurements by room - no results
  test('GET /architect-walls-measurements/room - should return empty array for no results', async () => {
    const response = await request(app).get('/architect-walls-measurements/room')
      .query({ 
        projectId: 1, 
        floor: 'Third Floor', 
        room: 'Non-existent Room' 
      });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
});
