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

describe('Architect Project Drawing API - CORRECTED TESTS', () => {
  
  // Test GET all drawings
  test('GET /architect-project-drawing - should return all drawings', async () => {
    const response = await request(app).get('/architect-project-drawing');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('architect_id');
    expect(response.body[0]).toHaveProperty('client_id');
    expect(response.body[0]).toHaveProperty('upload_architect_documents');
    
    // Check ordering (should be DESC by id)
    expect(response.body[0].id).toBe(4);
    expect(response.body[1].id).toBe(3);
    expect(response.body[2].id).toBe(2);
    expect(response.body[3].id).toBe(1);
  });
  
  // Test GET drawing by ID
  test('GET /architect-project-drawing/:id - should return a specific drawing', async () => {
    const response = await request(app).get('/architect-project-drawing/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('architect_id', 1);
    expect(response.body).toHaveProperty('client_id', 1);
    expect(response.body).toHaveProperty('upload_architect_documents', '/uploads/riverside_master_plan.pdf');
  });
  
  // Test GET drawing by ID - not found
  test('GET /architect-project-drawing/:id - should return 404 for non-existent drawing', async () => {
    const response = await request(app).get('/architect-project-drawing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect project drawing not found');
  });
  
  // Test POST new drawing
  test('POST /architect-project-drawing - should create a new drawing', async () => {
    const newDrawing = {
      project_id: 2,
      architect_id: 1,
      client_id: 1,
      upload_architect_documents: '/uploads/new_drawing.pdf'
    };
    
    const response = await request(app)
      .post('/architect-project-drawing')
      .send(newDrawing);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 5);
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('architect_id', 1);
    expect(response.body).toHaveProperty('client_id', 1);
    expect(response.body).toHaveProperty('upload_architect_documents', '/uploads/new_drawing.pdf');
    
    // Verify drawing was actually created
    const allDrawings = await request(app).get('/architect-project-drawing');
    expect(allDrawings.body.length).toBe(5);
  });
  
  // Test PUT update drawing
  test('PUT /architect-project-drawing/:id - should update a drawing', async () => {
    const updatedData = {
      project_id: 1,
      architect_id: 2,
      client_id: 2,
      upload_architect_documents: '/uploads/updated_drawing.pdf'
    };
    
    const response = await request(app)
      .put('/architect-project-drawing/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('architect_id', 2);
    expect(response.body).toHaveProperty('client_id', 2);
    expect(response.body).toHaveProperty('upload_architect_documents', '/uploads/updated_drawing.pdf');
  });
  
  // Test DELETE drawing
  test('DELETE /architect-project-drawing/:id - should delete a drawing', async () => {
    const response = await request(app).delete('/architect-project-drawing/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Architect project drawing deleted successfully');
    
    // Verify drawing was actually deleted
    const deletedDrawing = await request(app).get('/architect-project-drawing/3');
    expect(deletedDrawing.status).toBe(404);
    
    const allDrawings = await request(app).get('/architect-project-drawing');
    expect(allDrawings.body.length).toBe(3);
  });
  
});
