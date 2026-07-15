// tests/component_units_route.test.js
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
      project_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS components (
      component_id SERIAL PRIMARY KEY,
      component_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS units (
      unit_id SERIAL PRIMARY KEY,
      unit_name VARCHAR(255) NOT NULL,
      unit_type VARCHAR(100),
      description TEXT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS component_units (
      component_unit_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      component_id INT NOT NULL,
      unit_id INT NOT NULL,
      quantity DECIMAL(12,2) DEFAULT 1,
      unit_cost DECIMAL(12,2),
      total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
      specifications TEXT,
      location VARCHAR(255),
      floor_number INT,
      is_active BOOLEAN DEFAULT TRUE,
      start_date DATE,
      end_date DATE,
      completion_percentage DECIMAL(5,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (component_id) REFERENCES components(component_id),
      FOREIGN KEY (unit_id) REFERENCES units(unit_id),
      UNIQUE(project_id, component_id, unit_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS component_units CASCADE');
  await pool.query('DROP TABLE IF EXISTS units CASCADE');
  await pool.query('DROP TABLE IF EXISTS components CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM component_units');
  await pool.query('DELETE FROM units');
  await pool.query('DELETE FROM components');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Green Valley Residences'),
      (2, 'Tech Park Phase II'),
      (3, 'Serenity Villa')
  `);
  
  await pool.query(`
    INSERT INTO components (component_id, component_name)
    VALUES 
      (1, 'Foundation'),
      (2, 'Structural'),
      (3, 'Electrical'),
      (4, 'Plumbing')
  `);
  
  await pool.query(`
    INSERT INTO units (unit_id, unit_name, unit_type, description)
    VALUES 
      (1, 'Ground Floor Foundation', 'Foundation', 'Foundation work for ground floor'),
      (2, 'First Floor Foundation', 'Foundation', 'Foundation work for first floor'),
      (3, 'Ground Floor Columns', 'Structural', 'Column work for ground floor'),
      (4, 'First Floor Columns', 'Structural', 'Column work for first floor'),
      (5, 'Ground Floor Wiring', 'Electrical', 'Electrical wiring for ground floor'),
      (6, 'Ground Floor Plumbing', 'Plumbing', 'Plumbing work for ground floor')
  `);
  
  await pool.query(`
    INSERT INTO component_units (
      component_unit_id, project_id, component_id, unit_id, quantity,
      unit_cost, specifications, location, floor_number, is_active,
      start_date, end_date, completion_percentage, notes
    )
    VALUES 
      (1, 1, 1, 1, 100, 5000.00, 'M25 grade concrete', 'Ground Floor', 0, true, '2024-01-01', '2024-01-15', 100.00, 'Completed'),
      (2, 1, 1, 2, 100, 5000.00, 'M25 grade concrete', 'First Floor', 1, true, '2024-01-16', '2024-01-30', 50.00, 'In progress'),
      (3, 1, 2, 3, 50, 10000.00, 'RCC columns', 'Ground Floor', 0, true, '2024-02-01', '2024-02-15', 25.00, 'Started'),
      (4, 2, 3, 5, 200, 2500.00, 'FR cables', 'Ground Floor', 0, true, '2024-03-01', '2024-03-20', 0.00, 'Not started'),
      (5, 1, 4, 6, 150, 3000.00, 'CPVC pipes', 'Ground Floor', 0, false, '2024-04-01', '2024-04-15', 0.00, 'On hold')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('components_component_id_seq', 4)");
  await pool.query("SELECT setval('units_unit_id_seq', 6)");
  await pool.query("SELECT setval('component_units_component_unit_id_seq', 5)");
});

describe('Component Units API', () => {
  // Test GET all component units
  test('GET /component-units - should return all component units', async () => {
    const response = await request(app).get('/component-units');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('component_unit_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('unit_name');
    expect(response.body[0]).toHaveProperty('total_cost');
  });

  // Test GET active component units only
  test('GET /component-units?active=true - should return only active component units', async () => {
    const response = await request(app).get('/component-units?active=true');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    response.body.forEach(cu => {
      expect(cu.is_active).toBe(true);
    });
  });

  // Test GET component unit by ID
  test('GET /component-units/:id - should return a specific component unit', async () => {
    const response = await request(app).get('/component-units/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('component_unit_id', 1);
    expect(response.body).toHaveProperty('quantity', '100.00');
    expect(response.body).toHaveProperty('unit_cost', '5000.00');
    expect(response.body).toHaveProperty('total_cost', '500000.00');
    expect(response.body).toHaveProperty('completion_percentage', '100.00');
  });

  test('GET /component-units/:id - should return 404 for non-existent component unit', async () => {
    const response = await request(app).get('/component-units/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component unit not found');
  });

  // Test GET component units by project
  test('GET /component-units/project/:projectId - should return units for a project', async () => {
    const response = await request(app).get('/component-units/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    response.body.forEach(cu => {
      expect(cu.project_id).toBe(1);
    });
  });

  // Test GET component units by component
  test('GET /component-units/component/:componentId - should return units for a component', async () => {
    const response = await request(app).get('/component-units/component/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(cu => {
      expect(cu.component_id).toBe(1);
    });
  });

  // Test GET component units by floor
  test('GET /component-units/floor/:projectId/:floorNumber - should return units for a floor', async () => {
    const response = await request(app).get('/component-units/floor/1/0');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(cu => {
      expect(cu.floor_number).toBe(0);
    });
  });

  // Test POST new component unit
  test('POST /component-units - should create a new component unit', async () => {
    const newComponentUnit = {
      project_id: 2,
      component_id: 2,
      unit_id: 4,
      quantity: 60,
      unit_cost: 12000.00,
      specifications: 'RCC columns for first floor',
      location: 'First Floor',
      floor_number: 1,
      is_active: true,
      start_date: '2024-02-20',
      end_date: '2024-03-05',
      completion_percentage: 0,
      notes: 'Ready to start'
    };
    
    const response = await request(app)
      .post('/component-units')
      .send(newComponentUnit);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('component_unit_id', 6);
    expect(response.body).toHaveProperty('quantity', '60.00');
    expect(response.body).toHaveProperty('total_cost', '720000.00');
  });

  test('POST /component-units - should return 400 for missing required fields', async () => {
    const incompleteComponentUnit = {
      quantity: 100
    };
    
    const response = await request(app)
      .post('/component-units')
      .send(incompleteComponentUnit);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /component-units - should return 400 for duplicate component unit', async () => {
    const duplicateComponentUnit = {
      project_id: 1,
      component_id: 1,
      unit_id: 1
    };
    
    const response = await request(app)
      .post('/component-units')
      .send(duplicateComponentUnit);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test PUT update component unit
  test('PUT /component-units/:id - should update a component unit', async () => {
    const updatedData = {
      quantity: 120,
      unit_cost: 5500.00,
      completion_percentage: 75.00,
      specifications: 'Updated M30 grade concrete',
      notes: 'Progress update - 75% complete'
    };
    
    const response = await request(app)
      .put('/component-units/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('component_unit_id', 2);
    expect(response.body).toHaveProperty('quantity', '120.00');
    expect(response.body).toHaveProperty('unit_cost', '5500.00');
    expect(response.body).toHaveProperty('total_cost', '660000.00');
    expect(response.body).toHaveProperty('completion_percentage', '75.00');
  });

  test('PUT /component-units/:id - should return 404 for non-existent component unit', async () => {
    const updatedData = {
      quantity: 200
    };
    
    const response = await request(app)
      .put('/component-units/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component unit not found');
  });

  // Test DELETE component unit
  test('DELETE /component-units/:id - should delete a component unit', async () => {
    const response = await request(app).delete('/component-units/5');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Component unit deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/component-units/5');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /component-units/:id - should return 404 for non-existent component unit', async () => {
    const response = await request(app).delete('/component-units/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component unit not found');
  });

  // Test PATCH toggle active status
  test('PATCH /component-units/:id/toggle-active - should toggle active status', async () => {
    const response = await request(app)
      .patch('/component-units/5/toggle-active');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_active', true);
    
    // Toggle again
    const response2 = await request(app)
      .patch('/component-units/5/toggle-active');
    
    expect(response2.status).toBe(200);
    expect(response2.body).toHaveProperty('is_active', false);
  });

  // Test PATCH update completion
  test('PATCH /component-units/:id/completion - should update completion percentage', async () => {
    const completionData = {
      completion_percentage: 85.50,
      notes: 'Almost complete, final touches remaining'
    };
    
    const response = await request(app)
      .patch('/component-units/2/completion')
      .send(completionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('completion_percentage', '85.50');
    expect(response.body).toHaveProperty('notes', 'Almost complete, final touches remaining');
  });

  // Test GET progress summary
  test('GET /component-units/progress/:projectId - should return project progress summary', async () => {
    const response = await request(app).get('/component-units/progress/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_units');
    expect(response.body).toHaveProperty('completed_units');
    expect(response.body).toHaveProperty('in_progress_units');
    expect(response.body).toHaveProperty('not_started_units');
    expect(response.body).toHaveProperty('average_completion');
    expect(response.body).toHaveProperty('total_cost');
    expect(response.body).toHaveProperty('completed_cost');
  });

  // Test GET cost summary
  test('GET /component-units/cost-summary/:projectId - should return project cost summary', async () => {
    const response = await request(app).get('/component-units/cost-summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_budget');
    expect(response.body).toHaveProperty('active_units_cost');
    expect(response.body).toHaveProperty('inactive_units_cost');
    expect(response.body).toHaveProperty('component_wise_cost');
    expect(Array.isArray(response.body.component_wise_cost)).toBeTruthy();
  });

  // Test GET timeline overview
  test('GET /component-units/timeline/:projectId - should return project timeline overview', async () => {
    const response = await request(app).get('/component-units/timeline/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('earliest_start_date');
    expect(response.body).toHaveProperty('latest_end_date');
    expect(response.body).toHaveProperty('ongoing_units');
    expect(response.body).toHaveProperty('upcoming_units');
    expect(response.body).toHaveProperty('overdue_units');
  });

  // Test bulk update component units
  test('PATCH /component-units/bulk-update - should bulk update component units', async () => {
    const bulkUpdateData = {
      unit_ids: [1, 2],
      updates: {
        is_active: true,
        notes: 'Bulk update applied'
      }
    };
    
    const response = await request(app)
      .patch('/component-units/bulk-update')
      .send(bulkUpdateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('updated_count', 2);
    expect(Array.isArray(response.body.updated_units)).toBeTruthy();
  });

  // Test GET units by date range
  test('GET /component-units/date-range - should return units within date range', async () => {
    const response = await request(app)
      .get('/component-units/date-range')
      .query({
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(cu => {
      expect(new Date(cu.start_date) >= new Date('2024-01-01')).toBe(true);
      expect(new Date(cu.start_date) <= new Date('2024-01-31')).toBe(true);
    });
  });
});
