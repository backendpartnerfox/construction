// tests/projects.test.js
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
      project_code VARCHAR(50),
      client_id INTEGER NOT NULL,
      project_manager_id INTEGER,
      architect_id INTEGER,
      description TEXT,
      project_type VARCHAR(100),
      location VARCHAR(200),
      site_address TEXT,
      site_coordinates JSONB,
      start_date DATE,
      estimated_end_date DATE,
      actual_end_date DATE,
      status VARCHAR(20) DEFAULT 'Planning',
      completion_percentage NUMERIC DEFAULT 0,
      estimated_budget NUMERIC,
      actual_cost NUMERIC,
      currency VARCHAR(10) DEFAULT 'INR',
      contract_number VARCHAR(100),
      contract_date DATE,
      contract_file_path VARCHAR(255),
      total_area NUMERIC,
      area_unit VARCHAR(20) DEFAULT 'sqft',
      number_of_floors INTEGER,
      tags TEXT[],
      priority INTEGER DEFAULT 3,
      notes TEXT,
      metadata JSONB,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear table before each test
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (
      project_id, project_name, project_code, client_id, 
      project_manager_id, location, status, completion_percentage, 
      estimated_budget, start_date, estimated_end_date, tags
    )
    VALUES 
      (1, 'Residential Tower A', 'RES-A', 101, 201, 'Mumbai', 'In Progress', 35, 
       50000000, '2023-01-15', '2024-06-30', ARRAY['residential', 'high-rise']),
      (2, 'Commercial Plaza B', 'COM-B', 102, 202, 'Bangalore', 'Planning', 10, 
       75000000, '2023-03-10', '2024-12-31', ARRAY['commercial', 'retail'])
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
});

describe('Projects API', () => {
  // Test GET all projects
  test('GET /projects - should return all projects', async () => {
    const response = await request(app).get('/projects');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body[1]).toHaveProperty('project_name', 'Commercial Plaza B');
  });
  
  // Test GET project by ID
  test('GET /projects/:id - should return a specific project', async () => {
    const response = await request(app).get('/projects/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body).toHaveProperty('project_code', 'RES-A');
    expect(response.body).toHaveProperty('client_id', 101);
    expect(response.body).toHaveProperty('status', 'In Progress');
  });
  
  // Test GET project by ID - not found
  test('GET /projects/:id - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/projects/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test POST new project
  test('POST /projects - should create a new project', async () => {
    const newProject = {
      project_name: 'Educational Campus C',
      project_code: 'EDU-C',
      client_id: 103,
      project_manager_id: 203,
      location: 'Delhi',
      project_type: 'Educational',
      status: 'Planning',
      estimated_budget: 100000000,
      start_date: '2023-06-01',
      estimated_end_date: '2025-05-31',
      tags: ['educational', 'campus']
    };
    
    const response = await request(app)
      .post('/projects')
      .send(newProject);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('project_id', 3);
    expect(response.body).toHaveProperty('project_name', 'Educational Campus C');
    expect(response.body).toHaveProperty('client_id', 103);
    expect(response.body).toHaveProperty('project_code', 'EDU-C');
    
    // Verify project was actually created
    const allProjects = await request(app).get('/projects');
    expect(allProjects.body.length).toBe(3);
  });
  
  // Test POST project - missing required fields
  test('POST /projects - should return 400 for missing required fields', async () => {
    const incompleteProject = {
      project_code: 'INC-X',
      location: 'Chennai'
      // Missing project_name and client_id
    };
    
    const response = await request(app)
      .post('/projects')
      .send(incompleteProject);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project name and client ID are required');
  });
  
  // Test PUT update project
  test('PUT /projects/:id - should update a project', async () => {
    const updatedData = {
      project_name: 'Updated Residential Tower',
      project_code: 'RES-A-UPD',
      client_id: 101,
      completion_percentage: 40,
      estimated_budget: 55000000
    };
    
    const response = await request(app)
      .put('/projects/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Updated Residential Tower');
    expect(response.body).toHaveProperty('project_code', 'RES-A-UPD');
    expect(response.body).toHaveProperty('completion_percentage', '40');
    expect(response.body).toHaveProperty('estimated_budget', '55000000');
    
    // Verify project was actually updated
    const updatedProject = await request(app).get('/projects/1');
    expect(updatedProject.body.project_name).toBe('Updated Residential Tower');
  });
  
  // Test PUT project - not found
  test('PUT /projects/:id - should return 404 for non-existent project', async () => {
    const updatedData = {
      project_name: 'Non-existent Project',
      client_id: 101
    };
    
    const response = await request(app)
      .put('/projects/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test DELETE project
  test('DELETE /projects/:id - should delete a project', async () => {
    const response = await request(app).delete('/projects/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Project deleted successfully');
    
    // Verify project was actually deleted
    const deletedProject = await request(app).get('/projects/2');
    expect(deletedProject.status).toBe(404);
    
    const allProjects = await request(app).get('/projects');
    expect(allProjects.body.length).toBe(1);
  });
  
  // Test GET projects by client ID
  test('GET /projects/client/:clientId - should return projects for a specific client', async () => {
    const response = await request(app).get('/projects/client/101');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body[0]).toHaveProperty('client_id', 101);
  });
  
  // Test GET projects by manager ID
  test('GET /projects/manager/:managerId - should return projects for a specific manager', async () => {
    const response = await request(app).get('/projects/manager/201');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body[0]).toHaveProperty('project_manager_id', 201);
  });
  
  // Test GET projects by status
  test('GET /projects/status/:status - should return projects with a specific status', async () => {
    const response = await request(app).get('/projects/status/In Progress');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body[0]).toHaveProperty('status', 'In Progress');
  });
  
  // Test GET projects by location
  test('GET /projects/location/:location - should return projects in a specific location', async () => {
    const response = await request(app).get('/projects/location/Mumbai');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
    expect(response.body[0]).toHaveProperty('location', 'Mumbai');
  });
  
  // Test GET projects by tag
  test('GET /projects/tag/:tag - should return projects with a specific tag', async () => {
    const response = await request(app).get('/projects/tag/residential');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
  });
  
  // Test PATCH update project status
  test('PATCH /projects/update-status/:id - should update project status and completion', async () => {
    const statusUpdate = {
      status: 'On Hold',
      completion_percentage: 35,
      updated_by: 201
    };
    
    const response = await request(app)
      .patch('/projects/update-status/1')
      .send(statusUpdate);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('status', 'On Hold');
    expect(response.body).toHaveProperty('completion_percentage', '35');
    expect(response.body).toHaveProperty('updated_by', 201);
    
    // Verify project status was actually updated
    const updatedProject = await request(app).get('/projects/1');
    expect(updatedProject.body.status).toBe('On Hold');
  });
  
  // Test PATCH update status - not found
  test('PATCH /projects/update-status/:id - should return 404 for non-existent project', async () => {
    const statusUpdate = {
      status: 'Completed',
      completion_percentage: 100
    };
    
    const response = await request(app)
      .patch('/projects/update-status/999')
      .send(statusUpdate);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test search projects
  test('GET /projects/search - should search projects by name or code', async () => {
    const response = await request(app).get('/projects/search?term=Tower');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Residential Tower A');
  });
  
  // Test search projects - missing term
  test('GET /projects/search - should return 400 for missing search term', async () => {
    const response = await request(app).get('/projects/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search term is required');
  });
});
