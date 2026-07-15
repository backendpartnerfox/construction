// tests/project_boq.test.js
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
      project_name VARCHAR(200) NOT NULL,
      project_code VARCHAR(50)
    );
    
    CREATE TABLE IF NOT EXISTS elements (
      element_id SERIAL PRIMARY KEY,
      element_name VARCHAR(100) NOT NULL,
      element_category VARCHAR(50)
    );
    
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_unit VARCHAR(20),
      item_category VARCHAR(50)
    );
    
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      employee_name VARCHAR(100) NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS project_boq (
      boq_id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(project_id),
      element_id INTEGER NOT NULL REFERENCES elements(element_id),
      item_id INTEGER NOT NULL REFERENCES items(item_id),
      main_bar_dia NUMERIC,
      distribution_bar_dia NUMERIC,
      qty_main_bars INTEGER,
      qty_distribution_bards INTEGER,
      rmc_grade VARCHAR(20),
      element_length NUMERIC,
      element_width NUMERIC,
      element_height NUMERIC,
      element_thickness NUMERIC,
      quantity NUMERIC NOT NULL,
      unit VARCHAR(20),
      calculation_id INTEGER,
      unit_rate NUMERIC,
      total_amount NUMERIC GENERATED ALWAYS AS (quantity * unit_rate) STORED,
      status VARCHAR(20) DEFAULT 'Draft',
      revision_number INTEGER DEFAULT 0,
      remarks TEXT,
      created_by INTEGER REFERENCES employees(employee_id),
      approved_by INTEGER REFERENCES employees(employee_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS project_boq');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS elements');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM project_boq');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code)
    VALUES 
      (1, 'Residential Tower A', 'RES-A'),
      (2, 'Commercial Plaza B', 'COM-B')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Column', 'Structural'),
      (2, 'Beam', 'Structural'),
      (3, 'Slab', 'Structural')
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_description, item_unit, item_category)
    VALUES 
      (1, 'Concrete M25', 'Ready mix concrete M25 grade', 'm³', 'Concrete'),
      (2, 'Steel Reinforcement', 'TMT steel bars', 'kg', 'Steel'),
      (3, 'Formwork', 'Shuttering for concrete', 'm²', 'Formwork')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, employee_name)
    VALUES 
      (1, 'John Doe'),
      (2, 'Jane Smith')
  `);
  
  await pool.query(`
    INSERT INTO project_boq (
      boq_id, project_id, element_id, item_id, 
      quantity, unit, unit_rate, status, 
      created_by, created_at
    )
    VALUES 
      (1, 1, 1, 1, 10.5, 'm³', 5500, 'Draft', 1, CURRENT_TIMESTAMP - interval '1 day'),
      (2, 1, 2, 2, 1200, 'kg', 85, 'Approved', 1, CURRENT_TIMESTAMP - interval '2 days')
  `);
  
  // Set the approved_by and approved_at for the approved BOQ entry
  await pool.query(`
    UPDATE project_boq 
    SET approved_by = 2, approved_at = CURRENT_TIMESTAMP - interval '1 day'
    WHERE boq_id = 2
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('elements_element_id_seq', 3)");
  await pool.query("SELECT setval('items_item_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('project_boq_boq_id_seq', 2)");
});

describe('Project BOQ API', () => {
  // Test GET all BOQ entries with pagination
  test('GET /boq - should return all BOQ entries with pagination', async () => {
    const response = await request(app).get('/boq');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBeTruthy();
    expect(response.body.total).toBe(2);
    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0]).toHaveProperty('boq_id');
    expect(response.body.data[0]).toHaveProperty('quantity');
  });
  
  // Test GET BOQ entry by ID
  test('GET /boq/:id - should return a specific BOQ entry', async () => {
    const response = await request(app).get('/boq/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('boq_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('element_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('quantity', '10.5');
    expect(response.body).toHaveProperty('unit_rate', '5500');
    expect(response.body).toHaveProperty('status', 'Draft');
  });
  
  // Test GET BOQ entry by ID - not found
  test('GET /boq/:id - should return 404 for non-existent BOQ entry', async () => {
    const response = await request(app).get('/boq/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ entry not found');
  });
  
  // Test POST new BOQ entry
  test('POST /boq - should create a new BOQ entry', async () => {
    const newBoqEntry = {
      project_id: 1,
      element_id: 3,
      item_id: 3,
      quantity: 85.2,
      unit: 'm²',
      unit_rate: 450,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/boq')
      .send(newBoqEntry);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('boq_id', 3);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('element_id', 3);
    expect(response.body).toHaveProperty('quantity', '85.2');
    expect(response.body).toHaveProperty('unit_rate', '450');
    expect(response.body).toHaveProperty('status', 'Draft');
    expect(response.body).toHaveProperty('revision_number', 0);
  });
  
  // Test POST BOQ entry - missing required fields
  test('POST /boq - should return 400 for missing required fields', async () => {
    const incompleteBoqEntry = {
      project_id: 1,
      element_id: 2
      // Missing item_id and quantity which are required
    };
    
    const response = await request(app)
      .post('/boq')
      .send(incompleteBoqEntry);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, element ID, item ID, and quantity are required');
  });
  
  // Test PUT update BOQ entry
  test('PUT /boq/:id - should update a BOQ entry', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      item_id: 1,
      quantity: 12.5,
      unit: 'm³',
      unit_rate: 5800,
      remarks: 'Updated quantity and rate'
    };
    
    const response = await request(app)
      .put('/boq/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('boq_id', 1);
    expect(response.body).toHaveProperty('quantity', '12.5');
    expect(response.body).toHaveProperty('unit_rate', '5800');
    expect(response.body).toHaveProperty('remarks', 'Updated quantity and rate');
    
    // Verify BOQ entry was actually updated
    const updatedBoq = await request(app).get('/boq/1');
    expect(updatedBoq.body.quantity).toBe('12.5');
  });
  
  // Test PUT update BOQ entry - not found
  test('PUT /boq/:id - should return 404 for non-existent BOQ entry', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 1,
      item_id: 1,
      quantity: 10
    };
    
    const response = await request(app)
      .put('/boq/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ entry not found');
  });
  
  // Test PUT update approved BOQ entry
  test('PUT /boq/:id - should return 400 for updating an approved BOQ entry', async () => {
    const updatedData = {
      project_id: 1,
      element_id: 2,
      item_id: 2,
      quantity: 1500,
      unit: 'kg',
      unit_rate: 90
    };
    
    const response = await request(app)
      .put('/boq/2')
      .send(updatedData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot update an approved BOQ entry. Create a revision instead.');
  });
  
  // Test DELETE BOQ entry
  test('DELETE /boq/:id - should delete a BOQ entry', async () => {
    const response = await request(app).delete('/boq/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'BOQ entry deleted successfully');
    
    // Verify BOQ entry was actually deleted
    const deletedBoq = await request(app).get('/boq/1');
    expect(deletedBoq.status).toBe(404);
  });
  
  // Test DELETE approved BOQ entry
  test('DELETE /boq/:id - should return 400 for deleting an approved BOQ entry', async () => {
    const response = await request(app).delete('/boq/2');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete an approved BOQ entry. Create a revision instead.');
  });
  
  // Test GET BOQ entries by project ID
  test('GET /boq/project/:projectId - should return BOQ entries for a specific project', async () => {
    const response = await request(app).get('/boq/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
  });
  
  // Test GET BOQ entries by element ID
  test('GET /boq/element/:elementId - should return BOQ entries for a specific element', async () => {
    const response = await request(app).get('/boq/element/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('element_id', 1);
  });
  
  // Test GET BOQ entries by item ID
  test('GET /boq/item/:itemId - should return BOQ entries for a specific item', async () => {
    const response = await request(app).get('/boq/item/2');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('item_id', 2);
  });
  
  // Test GET BOQ entries by status
  test('GET /boq/status/:status - should return BOQ entries with a specific status', async () => {
    const response = await request(app).get('/boq/status/Draft');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Draft');
  });
  
  // Test PUT approve BOQ entry
  test('PUT /boq/approve/:id - should approve a BOQ entry', async () => {
    const approvalData = {
      approved_by: 2
    };
    
    const response = await request(app)
      .put('/boq/approve/1')
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('boq_id', 1);
    expect(response.body).toHaveProperty('status', 'Approved');
    expect(response.body).toHaveProperty('approved_by', 2);
    expect(response.body).toHaveProperty('approved_at');
    
    // Verify BOQ entry was actually approved
    const approvedBoq = await request(app).get('/boq/1');
    expect(approvedBoq.body.status).toBe('Approved');
  });
  
  // Test PUT approve BOQ entry - not found
  test('PUT /boq/approve/:id - should return 404 for non-existent BOQ entry', async () => {
    const approvalData = {
      approved_by: 2
    };
    
    const response = await request(app)
      .put('/boq/approve/999')
      .send(approvalData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ entry not found');
  });
  
  // Test POST revise BOQ entry
  test('POST /boq/revise/:id - should create a revised version of a BOQ entry', async () => {
    const revisionData = {
      created_by: 1,
      quantity: 1300,
      unit_rate: 90,
      remarks: 'Revised quantity and rate'
    };
    
    const response = await request(app)
      .post('/boq/revise/2')
      .send(revisionData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('boq_id', 3);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('element_id', 2);
    expect(response.body).toHaveProperty('item_id', 2);
    expect(response.body).toHaveProperty('quantity', '1300');
    expect(response.body).toHaveProperty('unit_rate', '90');
    expect(response.body).toHaveProperty('status', 'Revised');
    expect(response.body).toHaveProperty('revision_number', 1);
    expect(response.body).toHaveProperty('remarks', 'Revised quantity and rate');
  });
  
  // Test POST revise BOQ entry - not found
  test('POST /boq/revise/:id - should return 404 for non-existent BOQ entry', async () => {
    const revisionData = {
      created_by: 1,
      quantity: 1000
    };
    
    const response = await request(app)
      .post('/boq/revise/999')
      .send(revisionData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ entry not found');
  });
  
  // Test GET detailed BOQ information
  test('GET /boq/detailed/:id - should return detailed BOQ information', async () => {
    const response = await request(app).get('/boq/detailed/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('boq_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body).toHaveProperty('element_name', 'Column');
    expect(response.body).toHaveProperty('item_name', 'Concrete M25');
    expect(response.body).toHaveProperty('creator_name', 'John Doe');
  });
  
  // Test GET detailed BOQ information - not found
  test('GET /boq/detailed/:id - should return 404 for non-existent BOQ entry', async () => {
    const response = await request(app).get('/boq/detailed/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'BOQ entry not found');
  });
  
  // Test GET project BOQ summary
  test('GET /boq/summary/project/:projectId - should return BOQ summary for a project', async () => {
    const response = await request(app).get('/boq/summary/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body).toHaveProperty('total_entries');
    expect(response.body).toHaveProperty('draft_count');
    expect(response.body).toHaveProperty('approved_count');
  });
  
  // Test POST bulk BOQ entries
  test('POST /boq/bulk - should create multiple BOQ entries at once', async () => {
    const bulkEntries = {
      entries: [
        {
          project_id: 2,
          element_id: 1,
          item_id: 1,
          quantity: 25.5,
          unit: 'm³',
          unit_rate: 5500,
          created_by: 1
        },
        {
          project_id: 2,
          element_id: 2,
          item_id: 2,
          quantity: 2800,
          unit: 'kg',
          unit_rate: 85,
          created_by: 1
        }
      ]
    };
    
    const response = await request(app)
      .post('/boq/bulk')
      .send(bulkEntries);
    
    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_id', 2);
    expect(response.body[1]).toHaveProperty('project_id', 2);
    
    // Verify BOQ entries were actually created
    const projectBoq = await request(app).get('/boq/project/2');
    expect(projectBoq.body.length).toBe(2);
  });
  
  // Test POST bulk BOQ entries - invalid entries
  test('POST /boq/bulk - should return 400 for invalid entries', async () => {
    const invalidBulkEntries = {
      entries: [
        {
          project_id: 2,
          // Missing element_id which is required
          item_id: 1,
          quantity: 25.5
        }
      ]
    };
    
    const response = await request(app)
      .post('/boq/bulk')
      .send(invalidBulkEntries);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test GET BOQ report for project
  test('GET /boq/report/:projectId - should generate a BOQ report for a project', async () => {
    const response = await request(app).get('/boq/report/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project');
    expect(response.body).toHaveProperty('elements');
    expect(response.body).toHaveProperty('total_amount');
    expect(response.body).toHaveProperty('item_count');
    expect(response.body.project).toHaveProperty('project_name', 'Residential Tower A');
    expect(Array.isArray(response.body.elements)).toBeTruthy();
  });
});
