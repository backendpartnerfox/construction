// tests/modules_route.test.js
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
      last_name VARCHAR(50) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id SERIAL PRIMARY KEY,
      vendor_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      block_id SERIAL PRIMARY KEY,
      block_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_packages (
      work_package_id SERIAL PRIMARY KEY,
      module_id INT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS modules (
      module_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(project_id),
      module_name VARCHAR(100) NOT NULL,
      module_type VARCHAR(50) NOT NULL,
      description TEXT,
      parent_module_id INT REFERENCES modules(module_id),
      sequence_order INT,
      block_id INT REFERENCES blocks(block_id),
      work_order_number VARCHAR(50),
      purchase_order_number VARCHAR(50),
      vendor_id INT REFERENCES vendors(vendor_id),
      material_ready BOOLEAN DEFAULT FALSE,
      manpower_ready BOOLEAN DEFAULT FALSE,
      payment_cleared BOOLEAN DEFAULT FALSE,
      total_amount DECIMAL(15,2) DEFAULT 0,
      paid_amount DECIMAL(15,2) DEFAULT 0,
      balance_amount DECIMAL(15,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      assigned_to INT REFERENCES employees(employee_id),
      priority VARCHAR(20) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'Pending',
      metadata JSONB,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT REFERENCES employees(employee_id),
      updated_at TIMESTAMP WITH TIME ZONE,
      updated_by INT REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS modules');
  await pool.query('DROP TABLE IF EXISTS work_packages');
  await pool.query('DROP TABLE IF EXISTS blocks');
  await pool.query('DROP TABLE IF EXISTS vendors');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM work_packages');
  await pool.query('DELETE FROM modules');
  await pool.query('DELETE FROM blocks');
  await pool.query('DELETE FROM vendors');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'John', 'Doe'),
      (2, 'Jane', 'Smith')
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Green Valley Residences'),
      (2, 'Tech Park Phase II')
  `);
  
  await pool.query(`
    INSERT INTO vendors (vendor_id, vendor_name)
    VALUES 
      (1, 'BuildTech Materials'),
      (2, 'ConstructPro Services')
  `);
  
  await pool.query(`
    INSERT INTO blocks (block_id, block_name)
    VALUES 
      (1, 'Foundation Block'),
      (2, 'Structure Block')
  `);
  
  await pool.query(`
    INSERT INTO modules (
      module_id, project_id, module_name, module_type, description,
      parent_module_id, sequence_order, block_id, work_order_number,
      purchase_order_number, vendor_id, material_ready, manpower_ready,
      payment_cleared, total_amount, paid_amount, balance_amount,
      start_date, end_date, assigned_to, priority, status, notes, created_by
    ) VALUES 
      (1, 1, 'Foundation Work', 'Work Order', 'Foundation construction module', 
       NULL, 1, 1, 'WO-001', 'PO-001', 1, true, true, true, 
       500000, 400000, 100000, '2024-01-01', '2024-02-01', 
       1, 'High', 'In Progress', 'Critical path item', 1),
      (2, 1, 'Column Work', 'Work Order', 'Column construction module', 
       1, 2, 2, 'WO-002', 'PO-002', 2, true, false, false, 
       300000, 0, 300000, '2024-02-01', '2024-03-01', 
       1, 'High', 'Pending', 'Waiting for manpower', 1),
      (3, 1, 'Beam Work', 'Purchase Order', 'Beam materials purchase', 
       2, 3, 2, NULL, 'PO-003', 1, false, false, true, 
       200000, 200000, 0, '2024-03-01', '2024-03-15', 
       2, 'Medium', 'Pending', 'Payment completed', 2),
      (4, 2, 'Site Preparation', 'Work Order', 'Initial site preparation', 
       NULL, 1, NULL, 'WO-004', NULL, NULL, true, true, false, 
       100000, 50000, 50000, '2024-01-15', '2024-01-31', 
       2, 'Low', 'Draft', 'Initial phase', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('vendors_vendor_id_seq', 2)");
  await pool.query("SELECT setval('blocks_block_id_seq', 2)");
  await pool.query("SELECT setval('modules_module_id_seq', 4)");
});

describe('Modules API', () => {
  // Test GET all modules
  test('GET /modules - should return all modules with details', async () => {
    const response = await request(app).get('/modules');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('module_id');
    expect(response.body[0]).toHaveProperty('module_name');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('created_by_name');
  });

  // Test GET module by ID
  test('GET /modules/:id - should return a specific module', async () => {
    const response = await request(app).get('/modules/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('module_id', 1);
    expect(response.body).toHaveProperty('module_name', 'Foundation Work');
    expect(response.body).toHaveProperty('module_type', 'Work Order');
    expect(response.body).toHaveProperty('work_order_number', 'WO-001');
    expect(response.body).toHaveProperty('material_ready', true);
    expect(response.body).toHaveProperty('manpower_ready', true);
    expect(response.body).toHaveProperty('payment_cleared', true);
  });

  test('GET /modules/:id - should return 404 for non-existent module', async () => {
    const response = await request(app).get('/modules/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Module not found');
  });

  // Test GET modules by project
  test('GET /modules/project/:projectId - should return modules for a project', async () => {
    const response = await request(app).get('/modules/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(module => {
      expect(module.project_id).toBe(1);
    });
    // Verify ordering by sequence_order
    expect(response.body[0].sequence_order).toBe(1);
    expect(response.body[1].sequence_order).toBe(2);
    expect(response.body[2].sequence_order).toBe(3);
  });

  test('GET /modules/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/modules/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new module
  test('POST /modules - should create a new module', async () => {
    const newModule = {
      project_id: 2,
      module_name: 'Electrical Work',
      module_type: 'Work Order',
      description: 'Electrical installations',
      sequence_order: 2,
      work_order_number: 'WO-005',
      vendor_id: 1,
      total_amount: 150000,
      start_date: '2024-02-01',
      end_date: '2024-02-28',
      assigned_to: 1,
      priority: 'Medium',
      notes: 'Electrical wiring and fixtures',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/modules')
      .send(newModule);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('module_id', 5);
    expect(response.body).toHaveProperty('module_name', 'Electrical Work');
    expect(response.body).toHaveProperty('material_ready', false);
    expect(response.body).toHaveProperty('manpower_ready', false);
    expect(response.body).toHaveProperty('payment_cleared', false);
    expect(response.body).toHaveProperty('status', 'Pending');
  });

  test('POST /modules - should use default values', async () => {
    const minimalModule = {
      project_id: 1,
      module_name: 'Minimal Module',
      module_type: 'Purchase Order'
    };
    
    const response = await request(app)
      .post('/modules')
      .send(minimalModule);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('material_ready', false);
    expect(response.body).toHaveProperty('manpower_ready', false);
    expect(response.body).toHaveProperty('payment_cleared', false);
    expect(response.body).toHaveProperty('total_amount', '0.00');
    expect(response.body).toHaveProperty('paid_amount', '0.00');
    expect(response.body).toHaveProperty('balance_amount', '0.00');
    expect(response.body).toHaveProperty('priority', 'Medium');
    expect(response.body).toHaveProperty('status', 'Pending');
  });

  test('POST /modules - should return 400 for missing required fields', async () => {
    const incompleteModule = {
      project_id: 1,
      module_name: 'Test Module'
      // Missing module_type
    };
    
    const response = await request(app)
      .post('/modules')
      .send(incompleteModule);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required fields: project_id, module_name, module_type');
  });

  test('POST /modules - should return 404 for non-existent project', async () => {
    const invalidModule = {
      project_id: 999,
      module_name: 'Test Module',
      module_type: 'Work Order'
    };
    
    const response = await request(app)
      .post('/modules')
      .send(invalidModule);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test PUT update module
  test('PUT /modules/:id - should update a module', async () => {
    const updatedData = {
      module_name: 'Updated Foundation Work',
      description: 'Updated description',
      material_ready: false,
      manpower_ready: true,
      paid_amount: 450000,
      balance_amount: 50000,
      status: 'Completed',
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/modules/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('module_id', 1);
    expect(response.body).toHaveProperty('module_name', 'Updated Foundation Work');
    expect(response.body).toHaveProperty('description', 'Updated description');
    expect(response.body).toHaveProperty('material_ready', false);
    expect(response.body).toHaveProperty('status', 'Completed');
    expect(response.body).toHaveProperty('updated_at');
  });

  test('PUT /modules/:id - should return 404 for non-existent module', async () => {
    const updatedData = {
      module_name: 'Updated Module'
    };
    
    const response = await request(app)
      .put('/modules/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Module not found');
  });

  test('PUT /modules/:id - should return 400 for no valid fields', async () => {
    const invalidData = {
      module_id: 999, // This field shouldn't be updated
      project_id: 2, // This field shouldn't be updated
      created_at: '2024-01-01', // This field shouldn't be updated
      created_by: 2 // This field shouldn't be updated
    };
    
    const response = await request(app)
      .put('/modules/1')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'No valid fields to update');
  });

  // Test DELETE module
  test('DELETE /modules/:id - should delete a module without dependencies', async () => {
    const response = await request(app).delete('/modules/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Module deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/modules/4');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /modules/:id - should return 400 for module with child modules', async () => {
    const response = await request(app).delete('/modules/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete module because it has child modules. Delete child modules first.');
  });

  test('DELETE /modules/:id - should return 400 for module with work packages', async () => {
    // First add a work package
    await pool.query('INSERT INTO work_packages (work_package_id, module_id) VALUES (1, 3)');
    
    const response = await request(app).delete('/modules/3');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete module because it has associated work packages.');
  });

  test('DELETE /modules/:id - should return 404 for non-existent module', async () => {
    const response = await request(app).delete('/modules/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Module not found');
  });

  // Test GET modules by readiness
  test('GET /modules/readiness/:projectId - should filter by readiness criteria', async () => {
    const response = await request(app).get('/modules/readiness/1?material_ready=true&manpower_ready=true&payment_cleared=true');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('module_name', 'Foundation Work');
    expect(response.body[0]).toHaveProperty('material_ready', true);
    expect(response.body[0]).toHaveProperty('manpower_ready', true);
    expect(response.body[0]).toHaveProperty('payment_cleared', true);
  });

  test('GET /modules/readiness/:projectId - should filter by material readiness', async () => {
    const response = await request(app).get('/modules/readiness/1?material_ready=false');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('module_name', 'Beam Work');
    expect(response.body[0]).toHaveProperty('material_ready', false);
  });

  test('GET /modules/readiness/:projectId - should filter by payment status', async () => {
    const response = await request(app).get('/modules/readiness/1?payment_cleared=false');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('module_name', 'Column Work');
    expect(response.body[0]).toHaveProperty('payment_cleared', false);
  });

  // Test with parent-child relationships
  test('POST /modules - should create module with parent', async () => {
    const childModule = {
      project_id: 1,
      module_name: 'Foundation Excavation',
      module_type: 'Work Order',
      parent_module_id: 1,
      sequence_order: 1,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/modules')
      .send(childModule);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('parent_module_id', 1);
  });
});
