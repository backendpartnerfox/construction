// tests/blocks_route.test.js
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
    CREATE TABLE IF NOT EXISTS phases (
      phase_id SERIAL PRIMARY KEY,
      phase_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      block_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(project_id),
      block_code VARCHAR(50),
      block_name VARCHAR(100) NOT NULL,
      block_type VARCHAR(50),
      phase_id INT REFERENCES phases(phase_id),
      unit_ids INTEGER[],
      total_units_count INT DEFAULT 0,
      requires_client_selection BOOLEAN DEFAULT FALSE,
      selection_completed BOOLEAN DEFAULT FALSE,
      estimated_cost DECIMAL(15,2),
      approved_cost DECIMAL(15,2),
      planned_start_date DATE,
      planned_end_date DATE,
      status VARCHAR(50) DEFAULT 'Draft',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS blocks');
  await pool.query('DROP TABLE IF EXISTS phases');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM blocks');
  await pool.query('DELETE FROM phases');
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
    INSERT INTO phases (phase_id, phase_name)
    VALUES 
      (1, 'Foundation'),
      (2, 'Structure'),
      (3, 'Finishing')
  `);
  
  await pool.query(`
    INSERT INTO blocks (
      block_id, project_id, block_code, block_name, block_type, phase_id,
      unit_ids, total_units_count, requires_client_selection, selection_completed,
      estimated_cost, approved_cost, planned_start_date, planned_end_date,
      status, created_by
    ) VALUES 
      (1, 1, 'BLK-001', 'Foundation Block A', 'Foundation', 1, 
       '{1,2,3}', 3, false, false, 
       500000, 480000, '2024-01-01', '2024-02-01', 
       'In Progress', 1),
      (2, 1, 'BLK-002', 'Structure Block A', 'Structure', 2, 
       '{4,5,6}', 3, true, false, 
       800000, NULL, '2024-02-01', '2024-04-01', 
       'Draft', 1),
      (3, 1, 'BLK-003', 'Finishing Block A', 'Finishing', 3, 
       '{7,8}', 2, true, true, 
       300000, 300000, '2024-04-01', '2024-05-01', 
       'Planned', 2),
      (4, 2, 'BLK-004', 'Foundation Block B', 'Foundation', 1, 
       '{}', 0, false, false, 
       1000000, NULL, '2024-03-01', '2024-04-15', 
       'Draft', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('phases_phase_id_seq', 3)");
  await pool.query("SELECT setval('blocks_block_id_seq', 4)");
});

describe('Blocks API', () => {
  // Test GET all blocks
  test('GET /blocks - should return all blocks with details', async () => {
    const response = await request(app).get('/blocks');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('block_id');
    expect(response.body[0]).toHaveProperty('block_name');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('phase_name');
    expect(response.body[0]).toHaveProperty('created_by_name');
  });

  // Test GET block by ID
  test('GET /blocks/:id - should return a specific block', async () => {
    const response = await request(app).get('/blocks/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('block_id', 1);
    expect(response.body).toHaveProperty('block_code', 'BLK-001');
    expect(response.body).toHaveProperty('block_name', 'Foundation Block A');
    expect(response.body).toHaveProperty('block_type', 'Foundation');
    expect(response.body).toHaveProperty('project_name', 'Green Valley Residences');
    expect(response.body).toHaveProperty('phase_name', 'Foundation');
    expect(response.body).toHaveProperty('unit_ids');
    expect(response.body.unit_ids).toEqual([1, 2, 3]);
  });

  test('GET /blocks/:id - should return 404 for non-existent block', async () => {
    const response = await request(app).get('/blocks/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Block not found');
  });

  // Test GET blocks by project
  test('GET /blocks/project/:projectId - should return blocks for a project', async () => {
    const response = await request(app).get('/blocks/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(block => {
      expect(block.project_id).toBe(1);
    });
  });

  test('GET /blocks/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/blocks/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test GET blocks by phase
  test('GET /blocks/phase/:phaseId - should return blocks for a phase', async () => {
    const response = await request(app).get('/blocks/phase/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(block => {
      expect(block.phase_id).toBe(1);
    });
  });

  // Test POST new block
  test('POST /blocks - should create a new block', async () => {
    const newBlock = {
      project_id: 2,
      block_code: 'BLK-005',
      block_name: 'Structure Block B',
      block_type: 'Structure',
      phase_id: 2,
      unit_ids: [9, 10, 11],
      total_units_count: 3,
      requires_client_selection: true,
      estimated_cost: 750000,
      planned_start_date: '2024-05-01',
      planned_end_date: '2024-07-01',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/blocks')
      .send(newBlock);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('block_id', 5);
    expect(response.body).toHaveProperty('block_code', 'BLK-005');
    expect(response.body).toHaveProperty('block_name', 'Structure Block B');
    expect(response.body).toHaveProperty('status', 'Draft');
    expect(response.body).toHaveProperty('selection_completed', false);
  });

  test('POST /blocks - should return 400 for missing required fields', async () => {
    const incompleteBlock = {
      project_id: 1,
      // Missing block_name
    };
    
    const response = await request(app)
      .post('/blocks')
      .send(incompleteBlock);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Required fields: project_id, block_name');
  });

  test('POST /blocks - should return 404 for non-existent project', async () => {
    const invalidBlock = {
      project_id: 999,
      block_name: 'Test Block'
    };
    
    const response = await request(app)
      .post('/blocks')
      .send(invalidBlock);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  test('POST /blocks - should return 404 for non-existent phase', async () => {
    const invalidBlock = {
      project_id: 1,
      block_name: 'Test Block',
      phase_id: 999
    };
    
    const response = await request(app)
      .post('/blocks')
      .send(invalidBlock);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Phase not found');
  });

  // Test PUT update block
  test('PUT /blocks/:id - should update a block', async () => {
    const updatedData = {
      block_name: 'Updated Foundation Block A',
      block_type: 'Updated Foundation',
      estimated_cost: 550000,
      status: 'Completed'
    };
    
    const response = await request(app)
      .put('/blocks/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('block_id', 1);
    expect(response.body).toHaveProperty('block_name', 'Updated Foundation Block A');
    expect(response.body).toHaveProperty('block_type', 'Updated Foundation');
    expect(response.body).toHaveProperty('estimated_cost', '550000.00');
    expect(response.body).toHaveProperty('status', 'Completed');
  });

  test('PUT /blocks/:id - should return 404 for non-existent block', async () => {
    const updatedData = {
      block_name: 'Updated Block'
    };
    
    const response = await request(app)
      .put('/blocks/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Block not found');
  });

  test('PUT /blocks/:id - should return 404 for invalid phase', async () => {
    const updatedData = {
      phase_id: 999
    };
    
    const response = await request(app)
      .put('/blocks/1')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Phase not found');
  });

  test('PUT /blocks/:id - should return 400 for no valid fields', async () => {
    const invalidData = {
      block_id: 999, // This field shouldn't be updated
      project_id: 2, // This field shouldn't be updated
      created_at: '2024-01-01', // This field shouldn't be updated
      created_by: 2 // This field shouldn't be updated
    };
    
    const response = await request(app)
      .put('/blocks/1')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'No valid fields to update');
  });

  // Test DELETE block
  test('DELETE /blocks/:id - should delete a block without units', async () => {
    const response = await request(app).delete('/blocks/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Block deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/blocks/4');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /blocks/:id - should return 400 for block with units', async () => {
    const response = await request(app).delete('/blocks/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete block because it has associated units.');
  });

  test('DELETE /blocks/:id - should return 404 for non-existent block', async () => {
    const response = await request(app).delete('/blocks/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Block not found');
  });

  // Test GET blocks by status
  test('GET /blocks/status/:projectId/:status - should return blocks by status', async () => {
    const response = await request(app).get('/blocks/status/1/Draft');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Draft');
    expect(response.body[0]).toHaveProperty('project_id', 1);
    
    const inProgressResponse = await request(app).get('/blocks/status/1/In Progress');
    expect(inProgressResponse.status).toBe(200);
    expect(inProgressResponse.body.length).toBe(1);
    expect(inProgressResponse.body[0]).toHaveProperty('status', 'In Progress');
  });

  // Test GET blocks by selection status
  test('GET /blocks/selection-status/:requiresSelection - should return blocks by selection requirement', async () => {
    const response = await request(app).get('/blocks/selection-status/true');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(block => {
      expect(block.requires_client_selection).toBe(true);
    });
    
    const falseResponse = await request(app).get('/blocks/selection-status/false');
    expect(falseResponse.status).toBe(200);
    expect(falseResponse.body.length).toBe(2);
    falseResponse.body.forEach(block => {
      expect(block.requires_client_selection).toBe(false);
    });
  });
});
