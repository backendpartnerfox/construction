// tests/projects_route.test.js
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
      client_type VARCHAR(50),
      email VARCHAR(100),
      phone VARCHAR(20),
      city VARCHAR(100),
      state VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT,
      FOREIGN KEY (created_by) REFERENCES employees(employee_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      project_code VARCHAR(50),
      client_id INT NOT NULL,
      project_manager_id INT,
      architect_id INT,
      description TEXT,
      project_type VARCHAR(100),
      location VARCHAR(255),
      site_address TEXT,
      site_coordinates POINT,
      start_date DATE,
      estimated_end_date DATE,
      actual_end_date DATE,
      status VARCHAR(50) CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled')) DEFAULT 'Planning',
      completion_percentage DECIMAL(5,2) DEFAULT 0,
      estimated_budget DECIMAL(15,2),
      actual_cost DECIMAL(15,2),
      currency VARCHAR(3) DEFAULT 'INR',
      contract_number VARCHAR(100),
      contract_date DATE,
      contract_file_path VARCHAR(255),
      total_area DECIMAL(12,2),
      area_unit VARCHAR(20) DEFAULT 'sqft',
      number_of_floors INT,
      tags TEXT[],
      priority INT CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
      notes TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      FOREIGN KEY (client_id) REFERENCES clients(client_id),
      FOREIGN KEY (project_manager_id) REFERENCES employees(employee_id),
      FOREIGN KEY (architect_id) REFERENCES employees(employee_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM clients');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com'),
      (3, 'Bob', 'Johnson', 'bob.johnson@company.com')
  `);
  
  await pool.query(`
    INSERT INTO clients (client_id, client_name, client_type, email, phone, city, state, created_by)
    VALUES 
      (1, 'ABC Corporation', 'Company', 'info@abccorp.com', '9876543210', 'Mumbai', 'Maharashtra', 1),
      (2, 'XYZ Ltd', 'Company', 'contact@xyzltd.com', '9876543211', 'Delhi', 'Delhi', 1),
      (3, 'John Smith', 'Individual', 'john.smith@example.com', '9876543212', 'Bangalore', 'Karnataka', 2)
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code, client_id, project_manager_id, architect_id, 
                         description, project_type, location, start_date, estimated_end_date, status, 
                         estimated_budget, total_area, number_of_floors, created_by)
    VALUES 
      (1, 'Green Valley Residences', 'GVR-2024-01', 1, 1, 3, 
       'Luxury residential apartment complex', 'Residential', 'Hyderabad', 
       '2024-05-15', '2026-06-30', 'In Progress', 240000000, 25000, 12, 1),
      (2, 'Tech Park Phase II', 'TP2-2024-02', 2, 1, 3, 
       'Commercial tech park', 'Commercial', 'Mumbai', 
       '2024-07-01', '2025-12-31', 'Planning', 350000000, 50000, 8, 1),
      (3, 'Serenity Villa', 'SV-2024-03', 3, 2, 3, 
       'Luxury individual villa', 'Residential', 'Bangalore', 
       '2024-04-10', '2025-04-30', 'In Progress', 45000000, 5000, 2, 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('clients_client_id_seq', 3)");
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
});

describe('Projects API', () => {
  // Test GET all projects
  test('GET /projects - should return all projects', async () => {
    const response = await request(app).get('/projects');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('client_id');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test GET project by ID
  test('GET /projects/:id - should return a specific project', async () => {
    const response = await request(app).get('/projects/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Green Valley Residences');
    expect(response.body).toHaveProperty('project_code', 'GVR-2024-01');
    expect(response.body).toHaveProperty('client_id', 1);
    expect(response.body).toHaveProperty('project_type', 'Residential');
    expect(response.body).toHaveProperty('status', 'In Progress');
    expect(response.body).toHaveProperty('estimated_budget', '240000000');
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
      project_name: 'Metro Mall',
      project_code: 'MM-2024-04',
      client_id: 2,
      project_manager_id: 1,
      architect_id: 3,
      description: 'Shopping mall project',
      project_type: 'Commercial',
      location: 'Pune',
      site_address: '123 Main Road, Pune',
      start_date: '2024-09-01',
      estimated_end_date: '2026-08-31',
      status: 'Planning',
      estimated_budget: 420000000,
      total_area: 75000,
      number_of_floors: 6,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/projects')
      .send(newProject);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('project_id', 4);
    expect(response.body).toHaveProperty('project_name', 'Metro Mall');
    expect(response.body).toHaveProperty('project_code', 'MM-2024-04');
    expect(response.body).toHaveProperty('client_id', 2);
    expect(response.body).toHaveProperty('status', 'Planning');
    
    // Verify project was actually created
    const allProjects = await request(app).get('/projects');
    expect(allProjects.body.length).toBe(4);
  });
  
  // Test POST project - missing required fields
  test('POST /projects - should return 400 for missing project name', async () => {
    const incompleteProject = {
      client_id: 1,
      project_type: 'Residential'
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
      project_name: 'Green Valley Residences Phase 1',
      description: 'Updated luxury residential complex',
      status: 'In Progress',
      completion_percentage: 35.5,
      actual_cost: 85000000,
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/projects/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('project_name', 'Green Valley Residences Phase 1');
    expect(response.body).toHaveProperty('description', 'Updated luxury residential complex');
    expect(response.body).toHaveProperty('completion_percentage', '35.5');
    expect(response.body).toHaveProperty('actual_cost', '85000000');
    expect(response.body).toHaveProperty('updated_by', 2);
  });
  
  // Test DELETE project
  test('DELETE /projects/:id - should delete a project', async () => {
    const response = await request(app).delete('/projects/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Project deleted successfully');
    
    // Verify project was actually deleted
    const deletedProject = await request(app).get('/projects/3');
    expect(deletedProject.status).toBe(404);
    
    const allProjects = await request(app).get('/projects');
    expect(allProjects.body.length).toBe(2);
  });
  
  // Test GET projects by client
  test('GET /projects/client/:clientId - should return projects for a specific client', async () => {
    const response = await request(app).get('/projects/client/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_name', 'Green Valley Residences');
    expect(response.body[0]).toHaveProperty('client_id', 1);
  });
  
  // Test GET projects by status
  test('GET /projects/status/:status - should return projects with specific status', async () => {
    const response = await request(app).get('/projects/status/In Progress');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(project => {
      expect(project.status).toBe('In Progress');
    });
  });
  
  // Test GET projects by type
  test('GET /projects/type/:projectType - should return projects of specific type', async () => {
    const response = await request(app).get('/projects/type/Residential');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(project => {
      expect(project.project_type).toBe('Residential');
    });
  });
});
