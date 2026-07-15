// tests/doors_route.test.js
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
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      client_id INT,
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS door_dimensions (
      dimension_id SERIAL PRIMARY KEY,
      width DECIMAL(10,2) NOT NULL,
      height DECIMAL(10,2) NOT NULL,
      thickness DECIMAL(10,2) NOT NULL,
      description VARCHAR(100),
      is_standard BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doors (
      door_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      floor VARCHAR(50) NOT NULL,
      room VARCHAR(100) NOT NULL,
      location_description VARCHAR(255),
      wall_direction VARCHAR(20),
      door_material VARCHAR(100),
      door_style VARCHAR(100),
      door_finish VARCHAR(100),
      dimension_id INT NOT NULL,
      quantity INT DEFAULT 1,
      custom_design BOOLEAN DEFAULT FALSE,
      custom_design_description TEXT,
      custom_image_path VARCHAR(255),
      polish_type VARCHAR(100),
      polish_color VARCHAR(100),
      polish_coats INT,
      special_treatment VARCHAR(255),
      unit_price DECIMAL(12,2),
      gst_percentage DECIMAL(5,2),
      gst_amount DECIMAL(12,2) GENERATED ALWAYS AS (ROUND((unit_price * quantity * gst_percentage / 100)::numeric, 2)) STORED,
      total_amount DECIMAL(12,2) GENERATED ALWAYS AS (ROUND((unit_price * quantity * (1 + gst_percentage / 100))::numeric, 2)) STORED,
      has_frame BOOLEAN DEFAULT TRUE,
      frame_material VARCHAR(100),
      frame_finish VARCHAR(100),
      frame_width DECIMAL(10,2),
      frame_height DECIMAL(10,2),
      frame_thickness DECIMAL(10,2),
      frame_depth DECIMAL(10,2),
      frame_profile VARCHAR(100),
      frame_price DECIMAL(12,2),
      lock_type VARCHAR(100),
      handle_type VARCHAR(100),
      hinge_type VARCHAR(100),
      hinge_quantity INT DEFAULT 3,
      hardware_finish VARCHAR(100),
      hardware_price DECIMAL(12,2),
      has_peephole BOOLEAN DEFAULT FALSE,
      has_door_closer BOOLEAN DEFAULT FALSE,
      has_weather_strip BOOLEAN DEFAULT FALSE,
      has_threshold BOOLEAN DEFAULT FALSE,
      additional_features TEXT,
      installation_required BOOLEAN DEFAULT TRUE,
      installation_price DECIMAL(12,2),
      delivery_date DATE,
      installation_date DATE,
      status VARCHAR(50) DEFAULT 'Planned',
      is_approved BOOLEAN DEFAULT FALSE,
      approved_by INT,
      approval_date DATE,
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      updated_at TIMESTAMP WITH TIME ZONE,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (dimension_id) REFERENCES door_dimensions(dimension_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
      FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS doors');
  await pool.query('DROP TABLE IF EXISTS door_dimensions');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS clients');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM doors');
  await pool.query('DELETE FROM door_dimensions');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM clients');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com')
  `);
  
  await pool.query(`
    INSERT INTO clients (client_id, client_name, email, phone)
    VALUES 
      (1, 'Rahul Sharma', 'rahul@example.com', '9876543210'),
      (2, 'ABC Corporation', 'info@abccorp.com', '9876543211')
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name, client_id)
    VALUES 
      (1, 'Green Valley Residences', 1),
      (2, 'Tech Park Phase II', 2)
  `);
  
  await pool.query(`
    INSERT INTO door_dimensions (dimension_id, width, height, thickness, description, is_standard)
    VALUES 
      (1, 3.00, 7.00, 0.15, 'Standard Interior', true),
      (2, 3.50, 7.00, 0.15, 'Standard Bedroom', true),
      (3, 4.00, 7.00, 0.20, 'Main Door', true),
      (4, 2.50, 7.00, 0.15, 'Bathroom', true)
  `);
  
  await pool.query(`
    INSERT INTO doors (door_id, project_id, floor, room, location_description, door_material, 
                       door_style, door_finish, dimension_id, quantity, unit_price, gst_percentage,
                       frame_price, hardware_price, installation_price, status, created_by)
    VALUES 
      (1, 1, 'Ground Floor', 'Living Room', 'Main Entry', 'Teak Wood', 'Panel', 'Polished', 1, 1, 
       15000.00, 18.00, 3000.00, 2000.00, 1000.00, 'Ordered', 1),
      (2, 1, 'First Floor', 'Master Bedroom', 'Bedroom Entry', 'Engineered Wood', 'Flush', 'Laminate', 2, 1,
       10000.00, 18.00, 2000.00, 1500.00, 800.00, 'Planned', 1),
      (3, 1, 'Ground Floor', 'Kitchen', 'Kitchen Entry', 'WPC', 'Flush', 'Waterproof', 1, 1,
       8000.00, 18.00, 1500.00, 1000.00, 600.00, 'Delivered', 1),
      (4, 2, 'Ground Floor', 'Office', 'Office Entry', 'Glass', 'Frameless', 'Clear', 3, 2,
       20000.00, 18.00, 0.00, 3000.00, 2000.00, 'Planned', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('clients_client_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('door_dimensions_dimension_id_seq', 4)");
  await pool.query("SELECT setval('doors_door_id_seq', 4)");
});

describe('Doors API', () => {
  // Test GET all doors
  test('GET /doors - should return all doors', async () => {
    const response = await request(app).get('/doors');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('door_id');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('floor');
    expect(response.body[0]).toHaveProperty('room');
    expect(response.body[0]).toHaveProperty('door_material');
    expect(response.body[0]).toHaveProperty('unit_price');
    expect(response.body[0]).toHaveProperty('total_amount');
  });
  
  // Test GET door by ID
  test('GET /doors/:id - should return a specific door', async () => {
    const response = await request(app).get('/doors/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('door_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('floor', 'Ground Floor');
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('door_material', 'Teak Wood');
    expect(response.body).toHaveProperty('door_style', 'Panel');
    expect(response.body).toHaveProperty('unit_price', '15000.00');
    expect(response.body).toHaveProperty('gst_amount', '2700.00');
    expect(response.body).toHaveProperty('total_amount', '17700.00');
    expect(response.body).toHaveProperty('status', 'Ordered');
  });
  
  // Test GET door by ID - not found
  test('GET /doors/:id - should return 404 for non-existent door', async () => {
    const response = await request(app).get('/doors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door not found');
  });
  
  // Test GET doors by project
  test('GET /doors/project/:projectId - should return doors for a specific project', async () => {
    const response = await request(app).get('/doors/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(door => {
      expect(door.project_id).toBe(1);
    });
  });
  
  // Test POST new door
  test('POST /doors - should create a new door', async () => {
    const newDoor = {
      project_id: 1,
      floor: 'Second Floor',
      room: 'Guest Bedroom',
      location_description: 'Bedroom Entry',
      wall_direction: 'North',
      door_material: 'Pine Wood',
      door_style: 'Flush',
      door_finish: 'Painted',
      dimension_id: 2,
      quantity: 1,
      custom_design: true,
      custom_design_description: 'Modern geometric pattern',
      polish_type: 'Matte',
      polish_color: 'White',
      polish_coats: 2,
      unit_price: 9000.00,
      gst_percentage: 18.00,
      has_frame: true,
      frame_material: 'Pine Wood',
      frame_finish: 'Painted',
      frame_price: 1800.00,
      lock_type: 'Cylindrical Lock',
      handle_type: 'SS Lever',
      hinge_type: 'SS Butt Hinge',
      hardware_price: 1200.00,
      installation_required: true,
      installation_price: 700.00,
      status: 'Planned',
      notes: 'Guest bedroom door with custom design',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/doors')
      .send(newDoor);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('door_id', 5);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('floor', 'Second Floor');
    expect(response.body).toHaveProperty('room', 'Guest Bedroom');
    expect(response.body).toHaveProperty('door_material', 'Pine Wood');
    expect(response.body).toHaveProperty('custom_design', true);
    expect(response.body).toHaveProperty('custom_design_description', 'Modern geometric pattern');
    expect(response.body).toHaveProperty('unit_price', '9000.00');
    expect(response.body).toHaveProperty('gst_amount', '1620.00');
    expect(response.body).toHaveProperty('total_amount', '10620.00');
  });
  
  // Test POST door - missing required fields
  test('POST /doors - should return 400 for missing required fields', async () => {
    const incompleteDoor = {
      project_id: 1,
      floor: 'Ground Floor'
      // Missing room, dimension_id
    };
    
    const response = await request(app)
      .post('/doors')
      .send(incompleteDoor);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update door
  test('PUT /doors/:id - should update a door', async () => {
    const updatedData = {
      project_id: 1,
      floor: 'Ground Floor',
      room: 'Living Room',
      location_description: 'Main Entry - Updated',
      door_material: 'Teak Wood',
      door_style: 'Carved Panel',
      door_finish: 'High Gloss',
      dimension_id: 1,
      quantity: 1,
      unit_price: 18000.00,
      gst_percentage: 18.00,
      frame_price: 3500.00,
      hardware_price: 2500.00,
      installation_price: 1200.00,
      status: 'Delivered',
      notes: 'Updated with carved design',
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/doors/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('door_id', 1);
    expect(response.body).toHaveProperty('location_description', 'Main Entry - Updated');
    expect(response.body).toHaveProperty('door_style', 'Carved Panel');
    expect(response.body).toHaveProperty('door_finish', 'High Gloss');
    expect(response.body).toHaveProperty('unit_price', '18000.00');
    expect(response.body).toHaveProperty('status', 'Delivered');
    expect(response.body).toHaveProperty('updated_by', 2);
  });
  
  // Test PUT door - not found
  test('PUT /doors/:id - should return 404 for non-existent door', async () => {
    const updatedData = {
      project_id: 1,
      floor: 'Ground Floor',
      room: 'Test Room',
      dimension_id: 1
    };
    
    const response = await request(app)
      .put('/doors/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door not found');
  });
  
  // Test DELETE door
  test('DELETE /doors/:id - should delete a door', async () => {
    const response = await request(app).delete('/doors/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Door deleted successfully');
    
    // Verify door was actually deleted
    const deletedDoor = await request(app).get('/doors/4');
    expect(deletedDoor.status).toBe(404);
    
    const allDoors = await request(app).get('/doors');
    expect(allDoors.body.length).toBe(3);
  });
  
  // Test DELETE door - not found
  test('DELETE /doors/:id - should return 404 for non-existent door', async () => {
    const response = await request(app).delete('/doors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Door not found');
  });
  
  // Test GET doors by status
  test('GET /doors/status/:status - should return doors with specific status', async () => {
    const response = await request(app).get('/doors/status/Ordered');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Ordered');
    expect(response.body[0]).toHaveProperty('door_id', 1);
  });
  
  // Test GET doors by floor
  test('GET /doors/floor/:floor - should return doors on specific floor', async () => {
    const response = await request(app).get('/doors/floor/Ground Floor');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(door => {
      expect(door.floor).toBe('Ground Floor');
    });
  });
  
  // Test GET door summary by project
  test('GET /doors/summary/project/:projectId - should return door summary for project', async () => {
    const response = await request(app).get('/doors/summary/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_doors', 3);
    expect(response.body).toHaveProperty('total_cost');
    expect(response.body).toHaveProperty('doors_by_status');
    expect(response.body).toHaveProperty('doors_by_material');
  });
  
  // Test door approval
  test('PUT /doors/:id/approve - should approve a door', async () => {
    const approvalData = {
      approved_by: 2,
      approval_notes: 'Approved for installation'
    };
    
    const response = await request(app)
      .put('/doors/2/approve')
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('door_id', 2);
    expect(response.body).toHaveProperty('is_approved', true);
    expect(response.body).toHaveProperty('approved_by', 2);
    expect(response.body).toHaveProperty('approval_date');
  });
  
  // Test GET doors with custom design
  test('GET /doors/custom-design - should return doors with custom design', async () => {
    // First create a door with custom design
    await pool.query(`
      UPDATE doors SET custom_design = true, custom_design_description = 'Custom pattern'
      WHERE door_id = 1
    `);
    
    const response = await request(app).get('/doors/custom-design');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach(door => {
      expect(door.custom_design).toBe(true);
      expect(door.custom_design_description).toBeTruthy();
    });
  });
});
