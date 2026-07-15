// tests/components_route.test.js
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
    CREATE TABLE IF NOT EXISTS client_requirements (
      client_requirement_id SERIAL PRIMARY KEY,
      requirement_title VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS components (
      component_id SERIAL PRIMARY KEY,
      client_requirement_id INT REFERENCES client_requirements(client_requirement_id),
      project_id INT REFERENCES projects(project_id),
      component_code VARCHAR(50),
      component_name VARCHAR(100) NOT NULL,
      component_description TEXT,
      component_category VARCHAR(50),
      component_type VARCHAR(50),
      area DECIMAL(12,2),
      volume DECIMAL(12,2),
      quantity DECIMAL(12,2),
      unit VARCHAR(20),
      status VARCHAR(50) DEFAULT 'Planned',
      priority VARCHAR(20) DEFAULT 'Medium',
      parent_component_id INT REFERENCES components(component_id),
      planned_start_date DATE,
      planned_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INT REFERENCES employees(employee_id),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS components');
  await pool.query('DROP TABLE IF EXISTS client_requirements');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM components');
  await pool.query('DELETE FROM client_requirements');
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
    INSERT INTO client_requirements (client_requirement_id, requirement_title)
    VALUES 
      (1, 'Residential Building Requirements'),
      (2, 'Commercial Building Requirements')
  `);
  
  await pool.query(`
    INSERT INTO components (
      component_id, client_requirement_id, project_id, component_code, 
      component_name, component_description, component_category, component_type,
      area, volume, quantity, unit, status, priority, parent_component_id,
      planned_start_date, planned_end_date, notes, created_by
    ) VALUES 
      (1, 1, 1, 'COMP-001', 'Foundation', 'Foundation work for building', 
       'Structural', 'Primary', 500, 150, 1, 'cum', 
       'In Progress', 'High', NULL, '2024-01-01', '2024-02-01', 
       'Critical component', 1),
      (2, 1, 1, 'COMP-002', 'Structure', 'Structural framework', 
       'Structural', 'Primary', 1000, 300, 1, 'sqm', 
       'Planned', 'High', NULL, '2024-02-01', '2024-04-01', 
       'Main structure', 1),
      (3, 1, 1, 'COMP-003', 'Walls', 'Internal and external walls', 
       'Non-Structural', 'Secondary', 800, NULL, 50, 'sqm', 
       'Planned', 'Medium', 2, '2024-03-01', '2024-04-15', 
       'All walls', 2),
      (4, 2, 2, 'COMP-004', 'Flooring', 'Floor finishing', 
       'Finishing', 'Secondary', 2000, NULL, 1, 'sqm', 
       'Planned', 'Low', NULL, '2024-04-01', '2024-05-01', 
       'Floor work', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('client_requirements_client_requirement_id_seq', 2)");
  await pool.query("SELECT setval('components_component_id_seq', 4)");
});

describe('Components API', () => {
  // Test GET all components
  test('GET /components - should return all components', async () => {
    const response = await request(app).get('/components');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('component_id');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('component_category');
    expect(response.body[0]).toHaveProperty('status');
  });

  // Test GET component by ID
  test('GET /components/:id - should return a specific component', async () => {
    const response = await request(app).get('/components/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('component_id', 1);
    expect(response.body).toHaveProperty('component_code', 'COMP-001');
    expect(response.body).toHaveProperty('component_name', 'Foundation');
    expect(response.body).toHaveProperty('component_category', 'Structural');
    expect(response.body).toHaveProperty('status', 'In Progress');
    expect(response.body).toHaveProperty('priority', 'High');
  });

  test('GET /components/:id - should return 404 for non-existent component', async () => {
    const response = await request(app).get('/components/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component not found');
  });

  // Test GET components by project
  test('GET /components/project/:projectId - should return components for a project', async () => {
    const response = await request(app).get('/components/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(component => {
      expect(component.project_id).toBe(1);
    });
  });

  // Test GET components by status
  test('GET /components/status/:status - should return components by status', async () => {
    const response = await request(app).get('/components/status/Planned');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(component => {
      expect(component.status).toBe('Planned');
    });
  });

  // Test POST new component
  test('POST /components - should create a new component', async () => {
    const newComponent = {
      client_requirement_id: 1,
      project_id: 1,
      component_code: 'COMP-005',
      component_name: 'Electrical',
      component_description: 'Electrical work',
      component_category: 'MEP',
      component_type: 'Primary',
      area: 1500,
      quantity: 1,
      unit: 'sqm',
      status: 'Planned',
      priority: 'Medium',
      planned_start_date: '2024-05-01',
      planned_end_date: '2024-06-01',
      notes: 'Electrical installations',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/components')
      .send(newComponent);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('component_id', 5);
    expect(response.body).toHaveProperty('component_code', 'COMP-005');
    expect(response.body).toHaveProperty('component_name', 'Electrical');
    expect(response.body).toHaveProperty('status', 'Planned');
    expect(response.body).toHaveProperty('priority', 'Medium');
  });

  test('POST /components - should use default values when optional fields are missing', async () => {
    const minimalComponent = {
      client_requirement_id: 2,
      project_id: 2,
      component_name: 'Plumbing'
    };
    
    const response = await request(app)
      .post('/components')
      .send(minimalComponent);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('component_id', 5);
    expect(response.body).toHaveProperty('component_name', 'Plumbing');
    expect(response.body).toHaveProperty('quantity', 1);
    expect(response.body).toHaveProperty('status', 'Planned');
    expect(response.body).toHaveProperty('priority', 'Medium');
  });

  test('POST /components - should return 400 for missing required fields', async () => {
    const incompleteComponent = {
      component_name: 'Test Component'
      // Missing client_requirement_id and project_id
    };
    
    const response = await request(app)
      .post('/components')
      .send(incompleteComponent);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Client requirement ID, project ID, and component name are required');
  });

  // Test PUT update component
  test('PUT /components/:id - should update a component', async () => {
    const updatedData = {
      client_requirement_id: 1,
      project_id: 1,
      component_name: 'Updated Foundation',
      component_description: 'Updated foundation work',
      status: 'Completed',
      priority: 'Critical',
      actual_start_date: '2024-01-01',
      actual_end_date: '2024-01-31',
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/components/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('component_id', 1);
    expect(response.body).toHaveProperty('component_name', 'Updated Foundation');
    expect(response.body).toHaveProperty('component_description', 'Updated foundation work');
    expect(response.body).toHaveProperty('status', 'Completed');
    expect(response.body).toHaveProperty('priority', 'Critical');
  });

  test('PUT /components/:id - should return 404 for non-existent component', async () => {
    const updatedData = {
      component_name: 'Updated Component'
    };
    
    const response = await request(app)
      .put('/components/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component not found');
  });

  test('PUT /components/:id - should return 400 for missing component name', async () => {
    const incompleteData = {
      component_description: 'Updated description'
      // Missing component_name
    };
    
    const response = await request(app)
      .put('/components/1')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Component name is required');
  });

  // Test DELETE component
  test('DELETE /components/:id - should delete a component', async () => {
    const response = await request(app).delete('/components/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Component deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/components/4');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /components/:id - should return 404 for non-existent component', async () => {
    const response = await request(app).delete('/components/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component not found');
  });

  // Test with parent-child relationships
  test('POST /components - should create component with parent', async () => {
    const childComponent = {
      client_requirement_id: 1,
      project_id: 1,
      component_name: 'Foundation Excavation',
      component_category: 'Structural',
      parent_component_id: 1,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/components')
      .send(childComponent);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('parent_component_id', 1);
  });
});
