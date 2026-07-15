// tests/phase_summary_route.test.js
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
      project_name VARCHAR(255) NOT NULL,
      project_code VARCHAR(50)
    )
  `);
  
  // Create phase_summary as a regular table for testing
  // In production, this would be a VIEW
  await pool.query(`
    CREATE TABLE IF NOT EXISTS phase_summary (
      phase_id INTEGER,
      project_id INTEGER REFERENCES projects(project_id),
      phase_code VARCHAR(255),
      phase_name VARCHAR(255),
      phase_type VARCHAR(255),
      phase_sequence INTEGER,
      phase_status VARCHAR(255),
      total_units_count INTEGER,
      completion_percentage NUMERIC,
      planned_start_date DATE,
      planned_end_date DATE,
      planned_duration_days INTEGER,
      total_phase_cost NUMERIC,
      total_material_cost NUMERIC,
      total_labor_cost NUMERIC,
      unit_names TEXT,
      unit_uids TEXT
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS phase_summary');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM phase_summary');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name, project_code)
    VALUES 
      (1, 'Residential Complex A', 'RCA-2024'),
      (2, 'Commercial Tower B', 'CTB-2024')
  `);
  
  await pool.query(`
    INSERT INTO phase_summary (
      phase_id, project_id, phase_code, phase_name, phase_type, phase_sequence,
      phase_status, total_units_count, completion_percentage, planned_start_date,
      planned_end_date, planned_duration_days, total_phase_cost, total_material_cost,
      total_labor_cost, unit_names, unit_uids
    )
    VALUES 
      (1, 1, 'PH001', 'Foundation Phase', 'Foundation', 1, 'Completed', 10, 100.00,
       '2024-01-01', '2024-02-29', 60, 5000000.00, 3000000.00, 2000000.00,
       'Unit A1, Unit A2', 'UA1, UA2'),
      (2, 1, 'PH002', 'Structure Phase', 'Structure', 2, 'In Progress', 10, 65.00,
       '2024-03-01', '2024-05-31', 92, 8000000.00, 5000000.00, 3000000.00,
       'Unit A1, Unit A2', 'UA1, UA2'),
      (3, 1, 'PH003', 'Finishing Phase', 'Finishing', 3, 'Planned', 10, 0.00,
       '2024-06-01', '2024-08-31', 92, 6000000.00, 3500000.00, 2500000.00,
       'Unit A1, Unit A2', 'UA1, UA2'),
      (4, 2, 'PH101', 'Foundation Phase', 'Foundation', 1, 'In Progress', 20, 40.00,
       '2024-02-01', '2024-04-30', 89, 10000000.00, 6000000.00, 4000000.00,
       'Tower B Units', 'TB1-TB20')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
});

describe('Phase Summary API', () => {
  // Test GET all phase summaries
  test('GET /phase-summary - should return all phase summaries', async () => {
    const response = await request(app).get('/phase-summary');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('phase_id');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('phase_code');
    expect(response.body[0]).toHaveProperty('phase_name');
    expect(response.body[0]).toHaveProperty('phase_type');
    expect(response.body[0]).toHaveProperty('phase_status');
    expect(response.body[0]).toHaveProperty('total_phase_cost');
    expect(response.body[0]).toHaveProperty('project_name');
  });
  
  // Test GET phase summary by phase ID
  test('GET /phase-summary/phase/:phaseId - should return a specific phase summary', async () => {
    const response = await request(app).get('/phase-summary/phase/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('phase_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('phase_code', 'PH001');
    expect(response.body).toHaveProperty('phase_name', 'Foundation Phase');
    expect(response.body).toHaveProperty('phase_type', 'Foundation');
    expect(response.body).toHaveProperty('phase_status', 'Completed');
    expect(response.body).toHaveProperty('completion_percentage', '100.00');
    expect(response.body).toHaveProperty('project_name', 'Residential Complex A');
  });
  
  // Test GET phase summary by phase ID - not found
  test('GET /phase-summary/phase/:phaseId - should return 404 for non-existent phase', async () => {
    const response = await request(app).get('/phase-summary/phase/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Phase summary not found');
  });
  
  // Test GET phase summaries by project ID
  test('GET /phase-summary/project/:projectId - should return phase summaries for a project', async () => {
    const response = await request(app).get('/phase-summary/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
    expect(response.body[2]).toHaveProperty('project_id', 1);
    
    // Check phases are ordered by sequence
    const sequences = response.body.map(phase => phase.phase_sequence);
    expect(sequences).toEqual([1, 2, 3]);
    
    // Check phase names
    const phaseNames = response.body.map(phase => phase.phase_name);
    expect(phaseNames).toContain('Foundation Phase');
    expect(phaseNames).toContain('Structure Phase');
    expect(phaseNames).toContain('Finishing Phase');
  });
  
  // Test GET phase summaries by project ID - project not found
  test('GET /phase-summary/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/phase-summary/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test GET phase summaries by project and status
  test('GET /phase-summary/project/:projectId/status/:status - should return phases with specific status', async () => {
    const response = await request(app).get('/phase-summary/project/1/status/Completed');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('phase_status', 'Completed');
    expect(response.body[0]).toHaveProperty('phase_name', 'Foundation Phase');
  });
  
  // Test GET project overview
  test('GET /phase-summary/project/:projectId/overview - should return project overview', async () => {
    const response = await request(app).get('/phase-summary/project/1/overview');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_phases', '3');
    expect(response.body).toHaveProperty('total_units', '30'); // 10 + 10 + 10
    expect(response.body).toHaveProperty('total_project_cost', '19000000.00'); // 5M + 8M + 6M
    expect(response.body).toHaveProperty('total_material_cost', '11500000.00'); // 3M + 5M + 3.5M
    expect(response.body).toHaveProperty('total_labor_cost', '7500000.00'); // 2M + 3M + 2.5M
    expect(response.body).toHaveProperty('completed_phases', '1');
    expect(response.body).toHaveProperty('in_progress_phases', '1');
    expect(response.body).toHaveProperty('planned_phases', '1');
    expect(response.body).toHaveProperty('project_start_date', '2024-01-01');
    expect(response.body).toHaveProperty('project_end_date', '2024-08-31');
  });
  
  // Test GET project overview - project not found
  test('GET /phase-summary/project/:projectId/overview - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/phase-summary/project/999/overview');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });
  
  // Test POST refresh view
  test('POST /phase-summary/refresh - should handle view refresh', async () => {
    const response = await request(app).post('/phase-summary/refresh');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    // In test environment, it's a regular table, so expect appropriate message
    expect(response.body.message).toContain('view');
  });
  
  // Test GET search phases
  test('GET /phase-summary/search - should search phases by name or code', async () => {
    const response = await request(app).get('/phase-summary/search?query=foundation');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Two foundation phases
    expect(response.body[0]).toHaveProperty('phase_type', 'Foundation');
    expect(response.body[1]).toHaveProperty('phase_type', 'Foundation');
  });
  
  // Test GET search phases - missing query
  test('GET /phase-summary/search - should return 400 for missing query', async () => {
    const response = await request(app).get('/phase-summary/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
  
  // Test GET search phases - no results
  test('GET /phase-summary/search - should return empty array for no matches', async () => {
    const response = await request(app).get('/phase-summary/search?query=nonexistent');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  // Test GET overall statistics
  test('GET /phase-summary/statistics - should return overall phase statistics', async () => {
    const response = await request(app).get('/phase-summary/statistics');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_projects', '2');
    expect(response.body).toHaveProperty('total_phases', '4');
    expect(response.body).toHaveProperty('total_units', '50'); // 10+10+10+20
    expect(response.body).toHaveProperty('total_all_projects_cost', '29000000.00');
    expect(response.body).toHaveProperty('completed_phases', '1');
    expect(response.body).toHaveProperty('in_progress_phases', '2');
    expect(response.body).toHaveProperty('planned_phases', '1');
    expect(response.body).toHaveProperty('foundation_phases', '2');
    expect(response.body).toHaveProperty('structure_phases', '1');
    expect(response.body).toHaveProperty('finishing_phases', '1');
  });
  
  // Test GET with filters
  test('GET /phase-summary with filters - should filter by project_id', async () => {
    const response = await request(app).get('/phase-summary?project_id=1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
    expect(response.body[2]).toHaveProperty('project_id', 1);
  });
  
  // Test GET with phase_status filter
  test('GET /phase-summary with phase_status filter - should filter by status', async () => {
    const response = await request(app).get('/phase-summary?phase_status=In Progress');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('phase_status', 'In Progress');
    expect(response.body[1]).toHaveProperty('phase_status', 'In Progress');
  });
  
  // Test GET with phase_type filter
  test('GET /phase-summary with phase_type filter - should filter by type', async () => {
    const response = await request(app).get('/phase-summary?phase_type=Foundation');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('phase_type', 'Foundation');
    expect(response.body[1]).toHaveProperty('phase_type', 'Foundation');
  });
  
  // Test GET with multiple filters
  test('GET /phase-summary with multiple filters - should apply all filters', async () => {
    const response = await request(app).get('/phase-summary?project_id=1&phase_status=Completed');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[0]).toHaveProperty('phase_status', 'Completed');
    expect(response.body[0]).toHaveProperty('phase_name', 'Foundation Phase');
  });
  
  // Test GET cost analysis
  test('GET /phase-summary/cost-analysis - should return cost analysis by phase type', async () => {
    const response = await request(app).get('/phase-summary/cost-analysis');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('phase_type');
    expect(response.body[0]).toHaveProperty('phase_count');
    expect(response.body[0]).toHaveProperty('total_cost');
    expect(response.body[0]).toHaveProperty('material_cost_percentage');
    expect(response.body[0]).toHaveProperty('labor_cost_percentage');
  });
  
  // Test GET timeline
  test('GET /phase-summary/timeline/:projectId - should return phase timeline', async () => {
    const response = await request(app).get('/phase-summary/timeline/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('phase_id');
    expect(response.body[0]).toHaveProperty('current_status');
    expect(response.body[0]).toHaveProperty('planned_start_date');
    expect(response.body[0]).toHaveProperty('planned_end_date');
  });
});