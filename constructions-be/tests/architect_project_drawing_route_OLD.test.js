// tests/architect_project_drawing_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with the ACTUAL table structure
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(100) NOT NULL,
      primary_phone VARCHAR(20),
      email VARCHAR(100)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(200) NOT NULL,
      client_id INTEGER REFERENCES clients(client_id),
      status VARCHAR(50) DEFAULT 'Planning'
    )
  `);
  
  // ACTUAL table structure - only 5 columns!
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_project_drawing (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id),
      architect_id INTEGER REFERENCES users(id),
      client_id INTEGER REFERENCES clients(client_id),
      upload_architect_documents VARCHAR(255)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_project_drawing CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_project_drawing');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM clients');
  await pool.query('DELETE FROM users');
  
  // Insert test data
  await pool.query(`
    INSERT INTO users (id, username, email, first_name, last_name)
    VALUES 
      (1, 'architect1', 'arch1@test.com', 'John', 'Architect'),
      (2, 'architect2', 'arch2@test.com', 'Jane', 'Designer'),
      (3, 'manager1', 'mgr1@test.com', 'Mike', 'Manager')
  `);
  
  await pool.query(`
    INSERT INTO clients (client_id, client_name, primary_phone, email)
    VALUES 
      (1, 'ABC Construction', '9876543210', 'abc@construction.com'),
      (2, 'XYZ Developers', '9876543211', 'xyz@developers.com')
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name, client_id, status)
    VALUES 
      (1, 'Riverside Township', 1, 'In Progress'),
      (2, 'Green Valley Residences', 1, 'Planning'),
      (3, 'Tech Park Phase II', 2, 'Planning')
  `);
  
  // Insert test drawings with ACTUAL column structure
  await pool.query(`
    INSERT INTO architect_project_drawing (
      id, project_id, architect_id, client_id, upload_architect_documents
    )
    VALUES 
      (1, 1, 1, 1, '/uploads/riverside_master_plan.pdf'),
      (2, 1, 1, 1, '/uploads/riverside_elevation.pdf'),
      (3, 2, 2, 1, '/uploads/green_valley_plan.pdf'),
      (4, 3, 2, 2, '/uploads/tech_park_site.pdf')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('users_id_seq', 3)");
  await pool.query("SELECT setval('clients_client_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('architect_project_drawing_id_seq', 4)");
});

describe('Architect Project Drawing API - ACTUAL TABLE TESTS', () => {
  
  // The route file is completely wrong for the actual table structure!
  // These tests will show all the failures
  
  test('GET /architect-project-drawing - should FAIL because route expects wrong columns', async () => {
    const response = await request(app).get('/architect-project-drawing');
    
    // This will likely fail because route orders by 'upload_date' which doesn't exist
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
  test('GET /architect-project-drawing/:id - should FAIL because route uses wrong column name', async () => {
    const response = await request(app).get('/architect-project-drawing/1');
    
    // This will fail because route looks for 'drawing_id' but table has 'id'
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect project drawing not found');
  });
  
  test('POST /architect-project-drawing - should FAIL because route tries to insert wrong columns', async () => {
    const newDrawing = {
      project_id: 2,
      architect_id: 1,
      client_id: 1,
      drawing_type: 'Floor Plan', // This column doesn't exist!
      drawing_title: 'Test Drawing', // This column doesn't exist!
      file_path: '/uploads/test.pdf' // This should be upload_architect_documents
    };
    
    const response = await request(app)
      .post('/architect-project-drawing')
      .send(newDrawing);
    
    // This will fail because the route tries to insert into non-existent columns
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
  test('PUT /architect-project-drawing/:id - should FAIL because route updates wrong columns', async () => {
    const updatedData = {
      project_id: 1,
      architect_id: 1,
      drawing_type: 'Floor Plan', // Doesn't exist
      drawing_title: 'Updated Drawing', // Doesn't exist
      file_path: '/uploads/updated.pdf' // Wrong column name
    };
    
    const response = await request(app)
      .put('/architect-project-drawing/1')
      .send(updatedData);
    
    // This will fail because route tries to update non-existent columns
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
  test('DELETE /architect-project-drawing/:id - should FAIL because route uses wrong ID column', async () => {
    const response = await request(app).delete('/architect-project-drawing/1');
    
    // This will fail because route looks for 'drawing_id' but table has 'id'
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect project drawing not found');
  });
  
  test('GET by project - should FAIL because route orders by non-existent column', async () => {
    const response = await request(app).get('/architect-project-drawing/project/1');
    
    // This will fail because route orders by 'upload_date' which doesn't exist
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
  test('PATCH approval status - should FAIL because columns do not exist', async () => {
    const approvalData = {
      approval_status: 'Approved' // This column doesn't exist!
    };
    
    const response = await request(app)
      .patch('/architect-project-drawing/1/approval-status')
      .send(approvalData);
    
    // This will fail because approval_status column doesn't exist
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
  test('PATCH client visibility - should FAIL because column does not exist', async () => {
    const visibilityData = {
      client_visibility: true // This column doesn't exist!
    };
    
    const response = await request(app)
      .patch('/architect-project-drawing/1/client-visibility')
      .send(visibilityData);
    
    // This will fail because client_visibility column doesn't exist
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
});

describe('What the tests SHOULD be for the ACTUAL table', () => {
  
  // These are the tests that would work with the actual simple table structure
  
  test('Direct SQL query - should return actual data structure', async () => {
    const result = await pool.query('SELECT * FROM architect_project_drawing WHERE id = 1');
    
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toHaveProperty('id', 1);
    expect(result.rows[0]).toHaveProperty('project_id', 1);
    expect(result.rows[0]).toHaveProperty('architect_id', 1);
    expect(result.rows[0]).toHaveProperty('client_id', 1);
    expect(result.rows[0]).toHaveProperty('upload_architect_documents', '/uploads/riverside_master_plan.pdf');
    
    // These columns DO NOT exist in the actual table:
    expect(result.rows[0]).not.toHaveProperty('drawing_id');
    expect(result.rows[0]).not.toHaveProperty('drawing_type');
    expect(result.rows[0]).not.toHaveProperty('drawing_title');
    expect(result.rows[0]).not.toHaveProperty('file_path');
    expect(result.rows[0]).not.toHaveProperty('approval_status');
    expect(result.rows[0]).not.toHaveProperty('client_visibility');
    expect(result.rows[0]).not.toHaveProperty('upload_date');
  });
  
  test('What a correct route should look like', async () => {
    // This is what the route should actually do with the real table:
    const result = await pool.query('SELECT * FROM architect_project_drawing ORDER BY id DESC');
    
    expect(result.rows.length).toBe(4);
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0]).toHaveProperty('project_id');
    expect(result.rows[0]).toHaveProperty('architect_id');
    expect(result.rows[0]).toHaveProperty('client_id');
    expect(result.rows[0]).toHaveProperty('upload_architect_documents');
  });
  
});

// Summary of the problems:
/*
THE ROUTE FILE IS COMPLETELY WRONG FOR THE ACTUAL TABLE!

ACTUAL TABLE COLUMNS:
- id (PRIMARY KEY)
- project_id
- architect_id  
- client_id
- upload_architect_documents

ROUTE EXPECTS THESE NON-EXISTENT COLUMNS:
- drawing_id (should be 'id')
- drawing_type (doesn't exist)
- drawing_title (doesn't exist)
- drawing_description (doesn't exist)
- file_path (should be 'upload_architect_documents')
- upload_date (doesn't exist)
- client_visibility (doesn't exist)
- approval_status (doesn't exist)
- approval_date (doesn't exist)
- approval_comments (doesn't exist)
- approved_by (doesn't exist)
- version (doesn't exist)
- drawing_category (doesn't exist)
- drawing_scale (doesn't exist)
- drawing_size (doesn't exist)
- revision_notes (doesn't exist)
- technical_specifications (doesn't exist)
- created_at (doesn't exist)
- created_by (doesn't exist)
- updated_at (doesn't exist)
- updated_by (doesn't exist)

THE ROUTE NEEDS TO BE COMPLETELY REWRITTEN TO MATCH THE ACTUAL TABLE!
*/