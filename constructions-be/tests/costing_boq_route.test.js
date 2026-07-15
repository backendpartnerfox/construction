// tests/costing_boq_route.test.js
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
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS units (
      id SERIAL PRIMARY KEY,
      unit_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS elements (
      id SERIAL PRIMARY KEY,
      element_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      item_code VARCHAR(100)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      id SERIAL PRIMARY KEY,
      choice_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY,
      vendor_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS costing_boq (
      costing_boq_id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      unit_id INTEGER NOT NULL REFERENCES units(id),
      uid VARCHAR(255) NOT NULL,
      boq_code VARCHAR(255),
      boq_description TEXT,
      element_id INTEGER REFERENCES elements(id),
      item_id INTEGER REFERENCES items(id),
      choice_option_id INTEGER REFERENCES item_choices(id),
      quantity NUMERIC NOT NULL,
      unit VARCHAR(255) NOT NULL,
      unit_rate NUMERIC,
      material_cost NUMERIC,
      labor_cost NUMERIC,
      equipment_cost NUMERIC,
      overhead_cost NUMERIC,
      base_amount NUMERIC,
      total_cost NUMERIC,
      gst_percentage NUMERIC DEFAULT 18.00,
      gst_amount NUMERIC,
      total_amount NUMERIC,
      vendor_id INTEGER REFERENCES vendors(id),
      quotation_reference VARCHAR(255),
      price_validity_date DATE,
      status VARCHAR(50) DEFAULT 'Draft',
      approval_status VARCHAR(50) DEFAULT 'Pending',
      revision_number INTEGER DEFAULT 1,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER REFERENCES users(id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS costing_boq');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.query('DROP TABLE IF EXISTS vendors');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.query('DROP TABLE IF EXISTS units');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM costing_boq');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM vendors');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM units');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (id, project_name)
    VALUES 
      (1, 'Residential Complex A'),
      (2, 'Commercial Tower B')
  `);
  
  await pool.query(`
    INSERT INTO units (id, unit_name)
    VALUES 
      (1, 'Unit A1'),
      (2, 'Unit A2')
  `);
  
  await pool.query(`
    INSERT INTO elements (id, element_name)
    VALUES 
      (1, 'Foundation'),
      (2, 'Structure')
  `);
  
  await pool.query(`
    INSERT INTO items (id, item_name, item_code)
    VALUES 
      (1, 'Concrete', 'CON001'),
      (2, 'Steel', 'STL001')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (id, choice_name)
    VALUES 
      (1, 'M25 Grade'),
      (2, 'Fe500 Grade')
  `);
  
  await pool.query(`
    INSERT INTO vendors (id, vendor_name)
    VALUES 
      (1, 'ABC Suppliers'),
      (2, 'XYZ Materials')
  `);
  
  await pool.query(`
    INSERT INTO users (id, username)
    VALUES 
      (1, 'testuser'),
      (2, 'admin')
  `);
  
  await pool.query(`
    INSERT INTO costing_boq (
      costing_boq_id, project_id, unit_id, uid, boq_code, boq_description,
      element_id, item_id, choice_option_id, quantity, unit, unit_rate,
      material_cost, labor_cost, equipment_cost, overhead_cost,
      base_amount, total_cost, gst_percentage, gst_amount, total_amount,
      vendor_id, created_by
    )
    VALUES 
      (1, 1, 1, 'BOQ001', 'BOQ-001', 'Foundation concrete work',
       1, 1, 1, 100.00, 'cu.m', 5000.00,
       400000.00, 50000.00, 25000.00, 25000.00,
       500000.00, 500000.00, 18.00, 90000.00, 590000.00,
       1, 1),
      (2, 1, 2, 'BOQ002', 'BOQ-002', 'Steel reinforcement',
       2, 2, 2, 1000.00, 'kg', 60.00,
       50000.00, 8000.00, 2000.00, 0.00,
       60000.00, 60000.00, 18.00, 10800.00, 70800.00,
       2, 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_id_seq', 2)");
  await pool.query("SELECT setval('units_id_seq', 2)");
  await pool.query("SELECT setval('elements_id_seq', 2)");
  await pool.query("SELECT setval('items_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_id_seq', 2)");
  await pool.query("SELECT setval('vendors_id_seq', 2)");
  await pool.query("SELECT setval('users_id_seq', 2)");
  await pool.query("SELECT setval('costing_boq_costing_boq_id_seq', 2)");
});

describe('Costing BOQ API', () => {
  // Test GET all BOQ entries
  test('GET /costing-boq - should return all BOQ entries', async () => {
    const response = await request(app).get('/costing-boq');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('costing_boq_id');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('uid');
    expect(response.body[0]).toHaveProperty('quantity');
    expect(response.body[0]).toHaveProperty('total_amount');
    expect(response.body[0]).toHaveProperty('project_name');
  });
  
  // Test GET BOQ entry by ID
  test('GET /costing-boq/:id - should return a specific BOQ entry', async () => {
    const response = await request(app).get('/costing-boq/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('costing_boq_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('uid', 'BOQ001');
    expect(response.body).toHaveProperty('boq_code', 'BOQ-001');
    expect(response.body).toHaveProperty('quantity', '100.00');
    expect(response.body).toHaveProperty('total_amount', '590000.00');
  });
  
  // Test GET BOQ entry by ID - not found
  test('GET /costing-boq/:id - should return 404 for non-existent BOQ entry', async () => {
    const response = await request(app).get('/costing-boq/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ costing entry not found');
  });
  
  // Test GET BOQ entries by project ID
  test('GET /costing-boq/project/:projectId - should return BOQ entries for a project', async () => {
    const response = await request(app).get('/costing-boq/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
    
    // Check UIDs
    const uids = response.body.map(boq => boq.uid);
    expect(uids).toContain('BOQ001');
    expect(uids).toContain('BOQ002');
  });
  
  // Test GET BOQ entries by project ID - project not found
  test('GET /costing-boq/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/costing-boq/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test POST new BOQ entry
  test('POST /costing-boq - should create a new BOQ entry', async () => {
    const newBoq = {
      project_id: 2,
      unit_id: 1,
      uid: 'BOQ003',
      boq_code: 'BOQ-003',
      boq_description: 'Electrical work',
      element_id: 1,
      item_id: 1,
      choice_option_id: 1,
      quantity: 50.00,
      unit: 'points',
      unit_rate: 2000.00,
      material_cost: 80000.00,
      labor_cost: 15000.00,
      equipment_cost: 5000.00,
      overhead_cost: 0.00,
      vendor_id: 1,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/costing-boq')
      .send(newBoq);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('costing_boq_id', 3);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('uid', 'BOQ003');
    expect(response.body).toHaveProperty('quantity', '50.00');
    expect(response.body).toHaveProperty('total_cost', '100000.00'); // 50 * 2000
    
    // Verify BOQ entry was actually created
    const allBoq = await request(app).get('/costing-boq');
    expect(allBoq.body.length).toBe(3);
  });
  
  // Test POST BOQ entry - missing required fields
  test('POST /costing-boq - should return 400 for missing project_id', async () => {
    const incompleteBoq = {
      unit_id: 1,
      uid: 'BOQ003',
      quantity: 50.00,
      unit: 'points'
      // Missing project_id
    };
    
    const response = await request(app)
      .post('/costing-boq')
      .send(incompleteBoq);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID is required');
  });
  
  // Test POST BOQ entry - non-existent project
  test('POST /costing-boq - should return 404 for non-existent project', async () => {
    const invalidBoq = {
      project_id: 999,
      unit_id: 1,
      uid: 'BOQ003',
      quantity: 50.00,
      unit: 'points'
    };
    
    const response = await request(app)
      .post('/costing-boq')
      .send(invalidBoq);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test PUT update BOQ entry
  test('PUT /costing-boq/:id - should update a BOQ entry', async () => {
    const updatedData = {
      quantity: 150.00,
      unit_rate: 5500.00,
      material_cost: 600000.00,
      labor_cost: 75000.00,
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/costing-boq/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('costing_boq_id', 1);
    expect(response.body).toHaveProperty('quantity', '150.00');
    expect(response.body).toHaveProperty('unit_rate', '5500.00');
    expect(response.body).toHaveProperty('total_cost', '825000.00'); // 150 * 5500
    
    // Verify BOQ entry was actually updated
    const updatedBoq = await request(app).get('/costing-boq/1');
    expect(updatedBoq.body.quantity).toBe('150.00');
  });
  
  // Test PUT BOQ entry - not found
  test('PUT /costing-boq/:id - should return 404 for non-existent BOQ entry', async () => {
    const updatedData = {
      quantity: 100.00,
      unit_rate: 5000.00
    };
    
    const response = await request(app)
      .put('/costing-boq/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ costing entry not found');
  });
  
  // Test DELETE BOQ entry - success
  test('DELETE /costing-boq/:id - should delete a BOQ entry', async () => {
    const response = await request(app).delete('/costing-boq/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'BOQ costing entry deleted successfully');
    
    // Verify BOQ entry was actually deleted
    const deletedBoq = await request(app).get('/costing-boq/2');
    expect(deletedBoq.status).toBe(404);
    
    const allBoq = await request(app).get('/costing-boq');
    expect(allBoq.body.length).toBe(1);
  });
  
  // Test DELETE BOQ entry - approved entry
  test('DELETE /costing-boq/:id - should return 400 for approved BOQ entry', async () => {
    // First approve the BOQ entry
    await pool.query(`UPDATE costing_boq SET approval_status = 'Approved' WHERE costing_boq_id = 1`);
    
    const response = await request(app).delete('/costing-boq/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete approved BOQ costing entry. Change approval status first.');
  });
  
  // Test DELETE BOQ entry - not found
  test('DELETE /costing-boq/:id - should return 404 for non-existent BOQ entry', async () => {
    const response = await request(app).delete('/costing-boq/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ costing entry not found');
  });
  
  // Test GET project summary
  test('GET /costing-boq/project/:projectId/summary - should return project cost summary', async () => {
    const response = await request(app).get('/costing-boq/project/1/summary');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_items', '2');
    expect(response.body).toHaveProperty('total_base_cost', '560000.00');
    expect(response.body).toHaveProperty('total_gst', '100800.00');
    expect(response.body).toHaveProperty('total_project_cost', '660800.00');
    expect(response.body).toHaveProperty('avg_gst_percentage', '18.00');
    expect(response.body).toHaveProperty('approved_items', '0');
    expect(response.body).toHaveProperty('pending_items', '2');
  });
  
  // Test GET project summary - project not found
  test('GET /costing-boq/project/:projectId/summary - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/costing-boq/project/999/summary');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test GET with filters
  test('GET /costing-boq with filters - should filter by project_id', async () => {
    const response = await request(app).get('/costing-boq?project_id=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
  });
  
  // Test GET with status filter
  test('GET /costing-boq with status filter - should filter by status', async () => {
    const response = await request(app).get('/costing-boq?status=Draft');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('status', 'Draft');
    expect(response.body[1]).toHaveProperty('status', 'Draft');
  });
});