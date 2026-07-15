// tests/groups_route.test.js
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
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_id SERIAL PRIMARY KEY,
      choice_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS selections (
      selection_id SERIAL PRIMARY KEY,
      item_id INT REFERENCES items(item_id),
      current_choice_id INT REFERENCES item_choices(choice_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups (
      group_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(project_id),
      group_code VARCHAR(50),
      group_name VARCHAR(100) NOT NULL,
      group_type VARCHAR(50),
      selection_ids INTEGER[],
      original_cost DECIMAL(15,2),
      revised_cost DECIMAL(15,2),
      cost_difference DECIMAL(15,2),
      requires_additional_payment BOOLEAN DEFAULT FALSE,
      payment_received BOOLEAN DEFAULT FALSE,
      payment_amount DECIMAL(15,2),
      payment_date DATE,
      client_notified BOOLEAN DEFAULT FALSE,
      notification_date DATE,
      client_approved BOOLEAN DEFAULT FALSE,
      approval_date DATE,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS groups');
  await pool.query('DROP TABLE IF EXISTS selections');
  await pool.query('DROP TABLE IF EXISTS item_choices');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM groups');
  await pool.query('DELETE FROM selections');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
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
    INSERT INTO items (item_id, item_name)
    VALUES 
      (1, 'Flooring'),
      (2, 'Paint')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (choice_id, choice_name)
    VALUES 
      (1, 'Marble Flooring'),
      (2, 'Granite Flooring'),
      (3, 'Premium Paint'),
      (4, 'Standard Paint')
  `);
  
  await pool.query(`
    INSERT INTO selections (selection_id, item_id, current_choice_id)
    VALUES 
      (1, 1, 1),
      (2, 1, 2),
      (3, 2, 3),
      (4, 2, 4)
  `);
  
  await pool.query(`
    INSERT INTO groups (
      group_id, project_id, group_code, group_name, group_type, selection_ids,
      original_cost, revised_cost, cost_difference, requires_additional_payment,
      payment_received, payment_amount, payment_date, client_notified,
      notification_date, client_approved, approval_date, status, created_by
    ) VALUES 
      (1, 1, 'GRP-001', 'Flooring Selections', 'Material', '{1,2}', 
       100000, 120000, 20000, true, 
       false, NULL, NULL, true, 
       '2024-01-15', false, NULL, 'Pending', 1),
      (2, 1, 'GRP-002', 'Paint Selections', 'Material', '{3,4}', 
       50000, 45000, -5000, false, 
       false, NULL, NULL, false, 
       NULL, false, NULL, 'Pending', 1),
      (3, 1, 'GRP-003', 'Approved Changes', 'Mixed', '{}', 
       75000, 80000, 5000, true, 
       true, 5000, '2024-01-20', true, 
       '2024-01-18', true, '2024-01-19', 'Approved', 2),
      (4, 2, 'GRP-004', 'Office Selections', 'Material', '{1}', 
       200000, 200000, 0, false, 
       false, NULL, NULL, false, 
       NULL, false, NULL, 'Draft', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 2)");
  await pool.query("SELECT setval('item_choices_choice_id_seq', 4)");
  await pool.query("SELECT setval('selections_selection_id_seq', 4)");
  await pool.query("SELECT setval('groups_group_id_seq', 4)");
});

describe('Groups API', () => {
  // Test GET all groups
  test('GET /groups - should return all groups with details', async () => {
    const response = await request(app).get('/groups');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('group_id');
    expect(response.body[0]).toHaveProperty('group_name');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('created_by_name');
    expect(response.body[0]).toHaveProperty('selection_count');
  });

  // Test GET group by ID
  test('GET /groups/:id - should return a specific group with selection details', async () => {
    const response = await request(app).get('/groups/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('group_id', 1);
    expect(response.body).toHaveProperty('group_code', 'GRP-001');
    expect(response.body).toHaveProperty('group_name', 'Flooring Selections');
    expect(response.body).toHaveProperty('selection_ids', [1, 2]);
    expect(response.body).toHaveProperty('selections_details');
    expect(response.body.selections_details.length).toBe(2);
    expect(response.body).toHaveProperty('requires_additional_payment', true);
    expect(response.body).toHaveProperty('cost_difference', '20000.00');
  });

  test('GET /groups/:id - should return 404 for non-existent group', async () => {
    const response = await request(app).get('/groups/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Group not found');
  });

  // Test GET groups by project
  test('GET /groups/project/:projectId - should return groups for a project', async () => {
    const response = await request(app).get('/groups/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(group => {
      expect(group.project_id).toBe(1);
    });
  });

  test('GET /groups/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/groups/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new group
  test('POST /groups - should create a new group', async () => {
    const newGroup = {
      project_id: 2,
      group_code: 'GRP-005',
      group_name: 'New Material Group',
      group_type: 'Material',
      selection_ids: [3, 4],
      original_cost: 150000,
      revised_cost: 160000,
      requires_additional_payment: true,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/groups')
      .send(newGroup);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('group_id', 5);
    expect(response.body).toHaveProperty('group_code', 'GRP-005');
    expect(response.body).toHaveProperty('group_name', 'New Material Group');
    expect(response.body).toHaveProperty('cost_difference', '10000.00');
    expect(response.body).toHaveProperty('status', 'Pending');
  });

  test('POST /groups - should calculate cost_difference automatically', async () => {
    const newGroup = {
      project_id: 1,
      group_name: 'Auto Calculate Group',
      original_cost: 100000,
      revised_cost: 85000,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/groups')
      .send(newGroup);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('cost_difference', '-15000.00');
  });

  test('POST /groups - should return 400 for missing required fields', async () => {
    const incompleteGroup = {
      project_id: 1
      // Missing group_name
    };
    
    const response = await request(app)
      .post('/groups')
      .send(incompleteGroup);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required fields: project_id, group_name');
  });

  test('POST /groups - should return 404 for non-existent project', async () => {
    const invalidGroup = {
      project_id: 999,
      group_name: 'Test Group'
    };
    
    const response = await request(app)
      .post('/groups')
      .send(invalidGroup);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  test('POST /groups - should return 404 for non-existent selections', async () => {
    const invalidGroup = {
      project_id: 1,
      group_name: 'Test Group',
      selection_ids: [999, 1000]
    };
    
    const response = await request(app)
      .post('/groups')
      .send(invalidGroup);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'One or more selections not found');
  });

  // Test PUT update group
  test('PUT /groups/:id - should update a group', async () => {
    const updatedData = {
      group_name: 'Updated Flooring Selections',
      revised_cost: 130000,
      payment_received: true,
      payment_amount: 30000,
      payment_date: '2024-01-25',
      client_approved: true,
      approval_date: '2024-01-24',
      status: 'Approved'
    };
    
    const response = await request(app)
      .put('/groups/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('group_id', 1);
    expect(response.body).toHaveProperty('group_name', 'Updated Flooring Selections');
    expect(response.body).toHaveProperty('revised_cost', '130000.00');
    expect(response.body).toHaveProperty('cost_difference', '30000.00');
    expect(response.body).toHaveProperty('payment_received', true);
    expect(response.body).toHaveProperty('status', 'Approved');
  });

  test('PUT /groups/:id - should return 404 for non-existent group', async () => {
    const updatedData = {
      group_name: 'Updated Group'
    };
    
    const response = await request(app)
      .put('/groups/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Group not found');
  });

  test('PUT /groups/:id - should return 400 for no valid fields', async () => {
    const invalidData = {
      group_id: 999, // This field shouldn't be updated
      project_id: 2, // This field shouldn't be updated
      created_at: '2024-01-01', // This field shouldn't be updated
      created_by: 2 // This field shouldn't be updated
    };
    
    const response = await request(app)
      .put('/groups/1')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'No valid fields to update');
  });

  // Test DELETE group
  test('DELETE /groups/:id - should delete a group', async () => {
    const response = await request(app).delete('/groups/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Group deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/groups/4');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /groups/:id - should return 404 for non-existent group', async () => {
    const response = await request(app).delete('/groups/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Group not found');
  });

  // Test GET groups by payment status
  test('GET /groups/payment-status/:projectId - should filter by payment criteria', async () => {
    const response = await request(app).get('/groups/payment-status/1?requires_payment=true&payment_received=false');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('requires_additional_payment', true);
    expect(response.body[0]).toHaveProperty('payment_received', false);
  });

  // Test GET groups by approval status
  test('GET /groups/approval-status/:projectId - should filter by approval criteria', async () => {
    const response = await request(app).get('/groups/approval-status/1?client_notified=true&client_approved=false');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('client_notified', true);
    expect(response.body[0]).toHaveProperty('client_approved', false);
  });

  // Test POST add selections to group
  test('POST /groups/:id/add-selections - should add selections to a group', async () => {
    const response = await request(app)
      .post('/groups/3/add-selections')
      .send({ selection_ids: [1, 2] });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selection_ids', [1, 2]);
  });

  test('POST /groups/:id/add-selections - should return 400 for missing selection_ids', async () => {
    const response = await request(app)
      .post('/groups/1/add-selections')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'selection_ids array is required');
  });

  test('POST /groups/:id/add-selections - should return 404 for non-existent group', async () => {
    const response = await request(app)
      .post('/groups/999/add-selections')
      .send({ selection_ids: [1] });
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Group not found');
  });

  // Test POST remove selections from group
  test('POST /groups/:id/remove-selections - should remove selections from a group', async () => {
    const response = await request(app)
      .post('/groups/1/remove-selections')
      .send({ selection_ids: [1] });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selection_ids', [2]);
  });

  test('POST /groups/:id/remove-selections - should handle removing all selections', async () => {
    const response = await request(app)
      .post('/groups/1/remove-selections')
      .send({ selection_ids: [1, 2] });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selection_ids', null);
  });
});
