// tests/phases_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      client_id INT,
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS phases (
      phase_id SERIAL PRIMARY KEY,
      phase_name VARCHAR(100) NOT NULL,
      phase_order INT NOT NULL,
      description TEXT,
      duration_days INT,
      is_milestone BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phase_name)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_phases (
      project_phase_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      phase_id INT NOT NULL,
      planned_start_date DATE,
      planned_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      progress_percentage DECIMAL(5,2) DEFAULT 0,
      status VARCHAR(50) CHECK (status IN ('Not_Started', 'In_Progress', 'Completed', 'On_Hold', 'Delayed')) DEFAULT 'Not_Started',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (phase_id) REFERENCES phases(phase_id),
      UNIQUE(project_id, phase_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS phase_dependencies (
      dependency_id SERIAL PRIMARY KEY,
      phase_id INT NOT NULL,
      depends_on_phase_id INT NOT NULL,
      dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
      lag_days INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (phase_id) REFERENCES phases(phase_id),
      FOREIGN KEY (depends_on_phase_id) REFERENCES phases(phase_id),
      UNIQUE(phase_id, depends_on_phase_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS phase_dependencies');
  await pool.query('DROP TABLE IF EXISTS project_phases');
  await pool.query('DROP TABLE IF EXISTS phases');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.query('DROP TABLE IF EXISTS clients');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM phase_dependencies');
  await pool.query('DELETE FROM project_phases');
  await pool.query('DELETE FROM phases');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM clients');
  
  // Insert test data
  await pool.query(`
    INSERT INTO clients (client_id, client_name)
    VALUES 
      (1, 'Rahul Sharma'),
      (2, 'Priya Patel')
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name, client_id)
    VALUES 
      (1, 'Green Valley Residences', 1),
      (2, 'Tech Park Phase II', 2)
  `);
  
  await pool.query(`
    INSERT INTO phases (phase_id, phase_name, phase_order, description, duration_days, is_milestone, is_active)
    VALUES 
      (1, 'Project Initiation', 1, 'Initial project setup and planning', 7, false, true),
      (2, 'Site Preparation', 2, 'Clear and prepare the construction site', 14, false, true),
      (3, 'Foundation', 3, 'Excavation and foundation work', 30, true, true),
      (4, 'Structure', 4, 'Structural framework construction', 60, true, true),
      (5, 'Roofing', 5, 'Roof construction and waterproofing', 21, false, true),
      (6, 'MEP Installation', 6, 'Mechanical, Electrical, and Plumbing', 45, false, true),
      (7, 'Finishing', 7, 'Interior and exterior finishing work', 60, false, true),
      (8, 'Handover', 8, 'Final inspection and project handover', 7, true, true),
      (9, 'Inactive Phase', 9, 'Test inactive phase', 10, false, false)
  `);
  
  await pool.query(`
    INSERT INTO project_phases (project_id, phase_id, planned_start_date, planned_end_date, 
                               actual_start_date, progress_percentage, status)
    VALUES 
      (1, 1, '2024-01-01', '2024-01-07', '2024-01-01', 100, 'Completed'),
      (1, 2, '2024-01-08', '2024-01-21', '2024-01-08', 100, 'Completed'),
      (1, 3, '2024-01-22', '2024-02-20', '2024-01-22', 75, 'In_Progress'),
      (1, 4, '2024-02-21', '2024-04-20', NULL, 0, 'Not_Started'),
      (2, 1, '2024-03-01', '2024-03-07', '2024-03-01', 50, 'In_Progress')
  `);
  
  await pool.query(`
    INSERT INTO phase_dependencies (phase_id, depends_on_phase_id, dependency_type, lag_days)
    VALUES 
      (2, 1, 'finish_to_start', 0),
      (3, 2, 'finish_to_start', 0),
      (4, 3, 'finish_to_start', 0),
      (5, 4, 'finish_to_start', -7),
      (6, 4, 'start_to_start', 14),
      (7, 6, 'finish_to_start', 0)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('clients_client_id_seq', 2)");
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('phases_phase_id_seq', 9)");
});

describe('Phases API', () => {
  // Test GET all phases
  test('GET /phases - should return all phases', async () => {
    const response = await request(app).get('/phases');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(9);
    expect(response.body[0]).toHaveProperty('phase_id');
    expect(response.body[0]).toHaveProperty('phase_name');
    expect(response.body[0]).toHaveProperty('phase_order');
    expect(response.body[0]).toHaveProperty('duration_days');
    expect(response.body[0]).toHaveProperty('is_milestone');
    
    // Check order
    expect(response.body[0].phase_order).toBe(1);
    expect(response.body[1].phase_order).toBe(2);
  });
  
  // Test GET phase by ID
  test('GET /phases/:id - should return a specific phase with dependencies', async () => {
    const response = await request(app).get('/phases/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('phase_id', 3);
    expect(response.body).toHaveProperty('phase_name', 'Foundation');
    expect(response.body).toHaveProperty('phase_order', 3);
    expect(response.body).toHaveProperty('duration_days', 30);
    expect(response.body).toHaveProperty('is_milestone', true);
    expect(response.body).toHaveProperty('dependencies');
    expect(response.body).toHaveProperty('dependent_phases');
  });
  
  // Test GET phase by ID - not found
  test('GET /phases/:id - should return 404 for non-existent phase', async () => {
    const response = await request(app).get('/phases/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Phase not found');
  });
  
  // Test POST new phase
  test('POST /phases - should create a new phase', async () => {
    const newPhase = {
      phase_name: 'Quality Inspection',
      phase_order: 10,
      description: 'Final quality checks and snagging',
      duration_days: 14,
      is_milestone: true,
      is_active: true
    };
    
    const response = await request(app)
      .post('/phases')
      .send(newPhase);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('phase_id', 10);
    expect(response.body).toHaveProperty('phase_name', 'Quality Inspection');
    expect(response.body).toHaveProperty('phase_order', 10);
    expect(response.body).toHaveProperty('duration_days', 14);
    expect(response.body).toHaveProperty('is_milestone', true);
  });
  
  // Test POST phase - duplicate name
  test('POST /phases - should return 409 for duplicate phase name', async () => {
    const duplicatePhase = {
      phase_name: 'Foundation',
      phase_order: 15,
      duration_days: 30
    };
    
    const response = await request(app)
      .post('/phases')
      .send(duplicatePhase);
    
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error', 'Phase name already exists');
  });
  
  // Test POST phase - missing required fields
  test('POST /phases - should return 400 for missing required fields', async () => {
    const incompletePhase = {
      phase_name: 'Test Phase'
      // Missing phase_order
    };
    
    const response = await request(app)
      .post('/phases')
      .send(incompletePhase);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update phase
  test('PUT /phases/:id - should update a phase', async () => {
    const updatedData = {
      phase_name: 'Foundation Work',
      phase_order: 3,
      description: 'Excavation, footings, and foundation construction',
      duration_days: 35,
      is_milestone: true,
      is_active: true
    };
    
    const response = await request(app)
      .put('/phases/3')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('phase_id', 3);
    expect(response.body).toHaveProperty('phase_name', 'Foundation Work');
    expect(response.body).toHaveProperty('duration_days', 35);
  });
  
  // Test PUT phase - not found
  test('PUT /phases/:id - should return 404 for non-existent phase', async () => {
    const updatedData = {
      phase_name: 'Updated Phase',
      phase_order: 20
    };
    
    const response = await request(app)
      .put('/phases/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Phase not found');
  });
  
  // Test DELETE phase
  test('DELETE /phases/:id - should delete a phase without project assignments', async () => {
    const response = await request(app).delete('/phases/9'); // Inactive phase (no projects)
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Phase deleted successfully');
    
    // Verify phase was actually deleted
    const deletedPhase = await request(app).get('/phases/9');
    expect(deletedPhase.status).toBe(404);
  });
  
  // Test DELETE phase with projects
  test('DELETE /phases/:id - should return 400 for phase with project assignments', async () => {
    const response = await request(app).delete('/phases/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete phase assigned to projects');
  });
  
  // Test GET active phases
  test('GET /phases/active - should return only active phases', async () => {
    const response = await request(app).get('/phases/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(8); // All except inactive phase
    response.body.forEach(phase => {
      expect(phase.is_active).toBe(true);
    });
  });
  
  // Test GET milestone phases
  test('GET /phases/milestones - should return only milestone phases', async () => {
    const response = await request(app).get('/phases/milestones');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // Foundation, Structure, Handover
    response.body.forEach(phase => {
      expect(phase.is_milestone).toBe(true);
    });
  });
  
  // Test GET phase dependencies
  test('GET /phases/:id/dependencies - should return phase dependencies', async () => {
    const response = await request(app).get('/phases/4/dependencies');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('depends_on');
    expect(response.body).toHaveProperty('dependent_phases');
    expect(Array.isArray(response.body.depends_on)).toBeTruthy();
    expect(response.body.depends_on.length).toBe(1); // Structure depends on Foundation
    expect(response.body.depends_on[0]).toHaveProperty('phase_name', 'Foundation');
  });
  
  // Test POST add phase dependency
  test('POST /phases/:id/dependencies - should add a phase dependency', async () => {
    const dependencyData = {
      depends_on_phase_id: 7,
      dependency_type: 'finish_to_start',
      lag_days: 3
    };
    
    const response = await request(app)
      .post('/phases/8/dependencies')
      .send(dependencyData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Dependency added successfully');
    
    // Verify dependency was added
    const dependencies = await request(app).get('/phases/8/dependencies');
    expect(dependencies.body.depends_on.length).toBe(1);
  });
  
  // Test DELETE phase dependency
  test('DELETE /phases/:id/dependencies/:dependsOnId - should remove phase dependency', async () => {
    const response = await request(app).delete('/phases/3/dependencies/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Dependency removed successfully');
    
    // Verify dependency was removed
    const dependencies = await request(app).get('/phases/3/dependencies');
    expect(dependencies.body.depends_on.length).toBe(0);
  });
  
  // Test GET phases by project
  test('GET /phases/project/:projectId - should return phases for a project', async () => {
    const response = await request(app).get('/phases/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4); // Project 1 has 4 phases assigned
    expect(response.body[0]).toHaveProperty('phase_name');
    expect(response.body[0]).toHaveProperty('progress_percentage');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test reorder phases
  test('PUT /phases/reorder - should reorder phases', async () => {
    const reorderData = {
      phase_orders: [
        { phase_id: 1, phase_order: 1 },
        { phase_id: 3, phase_order: 2 }, // Foundation moved up
        { phase_id: 2, phase_order: 3 }, // Site Prep moved down
        { phase_id: 4, phase_order: 4 }
      ]
    };
    
    const response = await request(app)
      .put('/phases/reorder')
      .send(reorderData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Phases reordered successfully');
    
    // Verify new order
    const phase2 = await request(app).get('/phases/2');
    expect(phase2.body.phase_order).toBe(3);
    
    const phase3 = await request(app).get('/phases/3');
    expect(phase3.body.phase_order).toBe(2);
  });
  
  // Test phase templates
  test('GET /phases/templates - should return standard phase templates', async () => {
    const response = await request(app).get('/phases/templates');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('residential');
    expect(response.body).toHaveProperty('commercial');
    expect(response.body).toHaveProperty('industrial');
    expect(Array.isArray(response.body.residential)).toBeTruthy();
  });
  
  // Test apply phase template
  test('POST /phases/apply-template - should create phases from template', async () => {
    // First delete existing phases to avoid conflicts
    await pool.query('DELETE FROM phase_dependencies');
    await pool.query('DELETE FROM project_phases');
    await pool.query('DELETE FROM phases');
    
    const templateData = {
      template_type: 'residential',
      custom_phases: [
        { phase_name: 'Custom Phase 1', phase_order: 9, duration_days: 10 }
      ]
    };
    
    const response = await request(app)
      .post('/phases/apply-template')
      .send(templateData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('phases_created');
    expect(response.body.phases_created).toBeGreaterThan(0);
  });
  
  // Test GET phase timeline
  test('GET /phases/:id/timeline - should return phase timeline calculation', async () => {
    const response = await request(app).get('/phases/3/timeline?project_id=1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('phase_id', 3);
    expect(response.body).toHaveProperty('planned_start_date');
    expect(response.body).toHaveProperty('planned_end_date');
    expect(response.body).toHaveProperty('duration_days');
    expect(response.body).toHaveProperty('dependencies_met');
    expect(response.body).toHaveProperty('critical_path');
  });
  
  // Test bulk update project phases
  test('PUT /phases/project/:projectId/bulk-update - should bulk update project phases', async () => {
    const bulkUpdateData = {
      phase_updates: [
        {
          phase_id: 3,
          progress_percentage: 85,
          status: 'In_Progress',
          notes: 'Foundation work nearing completion'
        },
        {
          phase_id: 4,
          progress_percentage: 10,
          status: 'In_Progress',
          actual_start_date: '2024-02-20'
        }
      ]
    };
    
    const response = await request(app)
      .put('/phases/project/1/bulk-update')
      .send(bulkUpdateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Project phases updated successfully');
    expect(response.body).toHaveProperty('updated_count', 2);
    
    // Verify updates
    const projectPhases = await request(app).get('/phases/project/1');
    const foundation = projectPhases.body.find(p => p.phase_id === 3);
    expect(foundation.progress_percentage).toBe('85.00');
  });
  
  // Test phase completion validation
  test('PUT /phases/:id/complete - should mark phase as complete with validation', async () => {
    // First complete dependencies
    await pool.query(`
      UPDATE project_phases 
      SET progress_percentage = 100, status = 'Completed', actual_end_date = '2024-02-20'
      WHERE project_id = 1 AND phase_id = 3
    `);
    
    const completionData = {
      project_id: 1,
      actual_end_date: '2024-04-20',
      completion_notes: 'Structure phase completed successfully'
    };
    
    const response = await request(app)
      .put('/phases/4/complete')
      .send(completionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Phase marked as complete');
    expect(response.body).toHaveProperty('phase_id', 4);
    expect(response.body).toHaveProperty('status', 'Completed');
    expect(response.body).toHaveProperty('progress_percentage', 100);
  });
  
  // Test phase statistics
  test('GET /phases/statistics - should return phase statistics', async () => {
    const response = await request(app).get('/phases/statistics');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_phases');
    expect(response.body).toHaveProperty('active_phases');
    expect(response.body).toHaveProperty('milestone_phases');
    expect(response.body).toHaveProperty('average_duration');
    expect(response.body).toHaveProperty('phases_by_project');
    expect(response.body).toHaveProperty('completion_rates');
  });
});
