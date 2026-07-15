// tests/windows_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data
const testData = {
  seedData: {
    projects: [
      { project_id: 1, project_name: 'Test Villa Project', project_code: 'TVP-001' }
    ],
    employees: [
      { employee_id: 1, first_name: 'Test', last_name: 'Employee', email: 'test@example.com' }
    ],
    window_dimensions: [
      { dimension_id: 1, width: 3.0, height: 4.0, thickness: 0.15, description: 'Standard Window' },
      { dimension_id: 2, width: 5.0, height: 4.0, thickness: 0.20, description: 'Large Window' }
    ],
    windows: [
      {
        window_id: 1,
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Living Room',
        location_description: 'East wall',
        wall_direction: 'East',
        window_type: 'Sliding',
        opening_type: 'Horizontal Sliding',
        window_material: 'Aluminum',
        window_style: 'Modern',
        window_finish: 'Anodized',
        dimension_id: 1,
        quantity: 1,
        glass_type: 'Double Glazed',
        glass_thickness: 6.0,
        is_tempered: true,
        is_laminated: false,
        is_low_e: true,
        is_tinted: false,
        unit_price: 15000.00,
        gst_percentage: 18.00,
        has_frame: true,
        frame_material: 'Aluminum',
        frame_finish: 'Anodized',
        lock_type: 'Multi-point',
        handle_type: 'Lever',
        hardware_finish: 'Chrome',
        has_screen: true,
        screen_type: 'Mosquito Net',
        installation_required: true,
        installation_price: 2000.00,
        status: 'Planned',
        created_by: 1
      },
      {
        window_id: 2,
        project_id: 1,
        floor: 'First Floor',
        room: 'Master Bedroom',
        location_description: 'North wall',
        wall_direction: 'North',
        window_type: 'Casement',
        opening_type: 'Outward Opening',
        window_material: 'UPVC',
        window_style: 'Contemporary',
        window_finish: 'White',
        dimension_id: 2,
        quantity: 2,
        glass_type: 'Single Glazed',
        glass_thickness: 5.0,
        is_tempered: false,
        unit_price: 12000.00,
        gst_percentage: 18.00,
        has_frame: true,
        frame_material: 'UPVC',
        status: 'Ordered',
        created_by: 1
      }
    ]
  },
  createData: {
    valid: {
      complete: {
        project_id: 1,
        floor: 'Second Floor',
        room: 'Guest Bedroom',
        location_description: 'South wall overlooking garden',
        wall_direction: 'South',
        window_type: 'Bay Window',
        opening_type: 'Fixed + Casement',
        window_material: 'Wood',
        window_style: 'Traditional',
        window_finish: 'Polished Teak',
        dimension_id: 2,
        quantity: 1,
        glass_type: 'Triple Glazed',
        glass_thickness: 8.0,
        is_tempered: true,
        is_laminated: true,
        is_low_e: true,
        is_tinted: true,
        tint_color: 'Bronze',
        u_value: 1.2,
        shgc_value: 0.25,
        custom_design: true,
        custom_design_description: 'Traditional carved wooden frame with brass accents',
        unit_price: 45000.00,
        gst_percentage: 18.00,
        has_frame: true,
        frame_material: 'Teak Wood',
        frame_finish: 'Polished',
        frame_price: 15000.00,
        lock_type: 'Traditional Latch',
        handle_type: 'Brass Handle',
        hardware_finish: 'Antique Brass',
        hardware_price: 5000.00,
        has_screen: false,
        has_blinds: true,
        blinds_type: 'Wooden Venetian',
        has_grilles: true,
        grille_pattern: 'Traditional Jali',
        installation_required: true,
        installation_price: 5000.00,
        delivery_date: '2024-06-15',
        installation_date: '2024-06-20',
        status: 'Planned',
        notes: 'Premium window with traditional design',
        created_by: 1
      },
      minimal: {
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Kitchen',
        window_type: 'Fixed',
        dimension_id: 1
      }
    },
    invalid: {
      missingRequired: {
        floor: 'Ground Floor',
        room: 'Bathroom'
      },
      invalidProject: {
        project_id: 999,
        floor: 'Ground Floor',
        room: 'Study',
        window_type: 'Awning',
        dimension_id: 1
      },
      invalidDimension: {
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Utility',
        window_type: 'Louver',
        dimension_id: 999
      }
    }
  },
  updateData: {
    valid: {
      statusUpdate: {
        status: 'Delivered'
      },
      completeUpdate: {
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Living Room Updated',
        window_type: 'Sliding',
        dimension_id: 2,
        unit_price: 18000.00,
        glass_type: 'Triple Glazed',
        is_low_e: true,
        notes: 'Upgraded to triple glazing'
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      project_code VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS window_dimensions (
      dimension_id SERIAL PRIMARY KEY,
      width DECIMAL(10,2) NOT NULL,
      height DECIMAL(10,2) NOT NULL,
      thickness DECIMAL(10,2) NOT NULL,
      description VARCHAR(100),
      is_standard BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS windows (
      window_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      floor VARCHAR(50) NOT NULL,
      room VARCHAR(100) NOT NULL,
      location_description VARCHAR(255),
      wall_direction VARCHAR(20),
      window_type VARCHAR(100) NOT NULL,
      opening_type VARCHAR(100),
      window_material VARCHAR(100),
      window_style VARCHAR(100),
      window_finish VARCHAR(100),
      dimension_id INT NOT NULL,
      quantity INT DEFAULT 1,
      glass_type VARCHAR(100),
      glass_thickness DECIMAL(5,2),
      is_tempered BOOLEAN DEFAULT FALSE,
      is_laminated BOOLEAN DEFAULT FALSE,
      is_low_e BOOLEAN DEFAULT FALSE,
      is_tinted BOOLEAN DEFAULT FALSE,
      tint_color VARCHAR(50),
      u_value DECIMAL(5,2),
      shgc_value DECIMAL(5,2),
      custom_design BOOLEAN DEFAULT FALSE,
      custom_design_description TEXT,
      custom_image_path VARCHAR(255),
      privacy_level VARCHAR(50),
      special_treatment VARCHAR(255),
      unit_price DECIMAL(12,2),
      gst_percentage DECIMAL(5,2),
      gst_amount DECIMAL(12,2),
      total_amount DECIMAL(12,2),
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
      operation_mechanism VARCHAR(100),
      hardware_finish VARCHAR(100),
      hardware_price DECIMAL(12,2),
      has_screen BOOLEAN DEFAULT FALSE,
      screen_type VARCHAR(100),
      has_blinds BOOLEAN DEFAULT FALSE,
      blinds_type VARCHAR(100),
      has_grilles BOOLEAN DEFAULT FALSE,
      grille_pattern VARCHAR(100),
      has_weather_strip BOOLEAN DEFAULT FALSE,
      has_sill BOOLEAN DEFAULT FALSE,
      sill_material VARCHAR(100),
      is_egress_compliant BOOLEAN DEFAULT FALSE,
      additional_features TEXT,
      installation_required BOOLEAN DEFAULT TRUE,
      installation_price DECIMAL(12,2),
      delivery_date DATE,
      installation_date DATE,
      status VARCHAR(50) DEFAULT 'Planned',
      is_approved BOOLEAN DEFAULT FALSE,
      approved_by INT,
      approval_date DATE,
      room_id INT,
      window_wall_ratio DECIMAL(5,2),
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      updated_at TIMESTAMP WITH TIME ZONE,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (dimension_id) REFERENCES window_dimensions(dimension_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
      FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
      CHECK (status IN ('Planned', 'Ordered', 'Delivered', 'Installed', 'Completed'))
    )
  `);
});

afterAll(async () => {
  // Clean up
  await pool.query('DROP TABLE IF EXISTS windows CASCADE');
  await pool.query('DROP TABLE IF EXISTS window_dimensions CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data
  await pool.query('TRUNCATE TABLE windows, window_dimensions, employees, projects RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const project of testData.seedData.projects) {
    await pool.query(
      'INSERT INTO projects (project_id, project_name, project_code) VALUES ($1, $2, $3)',
      [project.project_id, project.project_name, project.project_code]
    );
  }
  
  for (const employee of testData.seedData.employees) {
    await pool.query(
      'INSERT INTO employees (employee_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
      [employee.employee_id, employee.first_name, employee.last_name, employee.email]
    );
  }
  
  for (const dimension of testData.seedData.window_dimensions) {
    await pool.query(
      'INSERT INTO window_dimensions (dimension_id, width, height, thickness, description) VALUES ($1, $2, $3, $4, $5)',
      [dimension.dimension_id, dimension.width, dimension.height, dimension.thickness, dimension.description]
    );
  }
  
  for (const window of testData.seedData.windows) {
    const columns = Object.keys(window).join(', ');
    const placeholders = Object.keys(window).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(window);
    
    await pool.query(
      `INSERT INTO windows (${columns}) VALUES (${placeholders})`,
      values
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 1)");
  await pool.query("SELECT setval('employees_employee_id_seq', 1)");
  await pool.query("SELECT setval('window_dimensions_dimension_id_seq', 2)");
  await pool.query("SELECT setval('windows_window_id_seq', 2)");
});

describe('Windows API', () => {
  
  describe('POST /windows', () => {
    test('should create window with complete data', async () => {
      const response = await request(app)
        .post('/windows')
        .send(testData.createData.valid.complete);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('window_id', 3);
      expect(response.body).toHaveProperty('project_id', 1);
      expect(response.body).toHaveProperty('floor', 'Second Floor');
      expect(response.body).toHaveProperty('room', 'Guest Bedroom');
      expect(response.body).toHaveProperty('window_type', 'Bay Window');
      expect(response.body).toHaveProperty('custom_design', true);
      expect(response.body).toHaveProperty('unit_price', '45000');
      expect(response.body).toHaveProperty('total_amount');
      expect(parseFloat(response.body.total_amount)).toBe(45000 * 1.18); // Including GST
    });
    
    test('should create window with minimal data', async () => {
      const response = await request(app)
        .post('/windows')
        .send(testData.createData.valid.minimal);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('window_id', 3);
      expect(response.body).toHaveProperty('quantity', 1); // Default value
      expect(response.body).toHaveProperty('has_frame', true); // Default value
      expect(response.body).toHaveProperty('installation_required', true); // Default value
      expect(response.body).toHaveProperty('status', 'Planned'); // Default value
    });
    
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/windows')
        .send(testData.createData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Required fields');
    });
    
    test('should fail with invalid project_id', async () => {
      const response = await request(app)
        .post('/windows')
        .send(testData.createData.invalid.invalidProject);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid reference: Check project_id, dimension_id, room_id, or created_by exists');
    });
    
    test('should fail with invalid dimension_id', async () => {
      const response = await request(app)
        .post('/windows')
        .send(testData.createData.invalid.invalidDimension);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid reference: Check project_id, dimension_id, room_id, or created_by exists');
    });
  });
  
  describe('DELETE /windows/:id', () => {
    test('should delete existing window', async () => {
      const response = await request(app).delete('/windows/1');
      
      expect(response.status).toBe(204);
      
      // Verify deletion
      const result = await pool.query('SELECT * FROM windows WHERE window_id = 1');
      expect(result.rows.length).toBe(0);
    });
    
    test('should return 404 for non-existent window', async () => {
      const response = await request(app).delete('/windows/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Window not found');
    });
  });
  
  describe('GET /windows/project/:projectId', () => {
    test('should return all windows for a project', async () => {
      const response = await request(app).get('/windows/project/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(window => {
        expect(window.project_id).toBe(1);
      });
    });
    
    test('should return empty array for project with no windows', async () => {
      // Create a new project
      await pool.query("INSERT INTO projects (project_id, project_name) VALUES (2, 'Empty Project')");
      
      const response = await request(app).get('/windows/project/2');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /windows/room', () => {
    test('should return windows for specific room', async () => {
      const response = await request(app)
        .get('/windows/room')
        .query({
          projectId: 1,
          floor: 'Ground Floor',
          room: 'Living Room'
        });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('room', 'Living Room');
      expect(response.body[0]).toHaveProperty('floor', 'Ground Floor');
    });
    
    test('should fail with missing parameters', async () => {
      const response = await request(app)
        .get('/windows/room')
        .query({ projectId: 1 });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Project ID, floor, and room are required');
    });
  });
  
  describe('GET /windows/status/:status', () => {
    test('should return windows by status', async () => {
      const response = await request(app).get('/windows/status/Planned');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('status', 'Planned');
    });
    
    test('should filter by status and project', async () => {
      const response = await request(app)
        .get('/windows/status/Ordered')
        .query({ projectId: 1 });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('status', 'Ordered');
      expect(response.body[0]).toHaveProperty('project_id', 1);
    });
  });
  
  describe('PUT /windows/:id/approve', () => {
    test('should approve window', async () => {
      const response = await request(app)
        .put('/windows/1/approve')
        .send({ approved_by: 1 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('is_approved', true);
      expect(response.body).toHaveProperty('approved_by', 1);
      expect(response.body).toHaveProperty('approval_date');
    });
    
    test('should fail without approver ID', async () => {
      const response = await request(app)
        .put('/windows/1/approve')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Approver ID is required');
    });
    
    test('should return 404 for non-existent window', async () => {
      const response = await request(app)
        .put('/windows/999/approve')
        .send({ approved_by: 1 });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Window not found');
    });
  });
  
  describe('PUT /windows/:id/update-status', () => {
    test('should update window status', async () => {
      const response = await request(app)
        .put('/windows/1/update-status')
        .send({
          status: 'Delivered',
          updated_by: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'Delivered');
      expect(response.body).toHaveProperty('updated_by', 1);
    });
    
    test('should fail with invalid status', async () => {
      const response = await request(app)
        .put('/windows/1/update-status')
        .send({
          status: 'InvalidStatus',
          updated_by: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid status');
    });
    
    test('should fail without required fields', async () => {
      const response = await request(app)
        .put('/windows/1/update-status')
        .send({ status: 'Delivered' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Status and updater ID are required');
    });
  });
});
