// tests/units_route.test.js
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
      uid VARCHAR(100) NOT NULL UNIQUE,
      project_id INTEGER NOT NULL,
      component_id INTEGER NOT NULL,
      unit_code VARCHAR(50),
      unit_name VARCHAR(255) NOT NULL,
      unit_description TEXT,
      unit_category VARCHAR(100),
      element_id INTEGER,
      item_id INTEGER,
      quantity DECIMAL(15,3) NOT NULL,
      unit_measure VARCHAR(50) NOT NULL,
      unit_rate DECIMAL(15,2),
      total_amount DECIMAL(15,2),
      work_method TEXT,
      quality_standards TEXT,
      status VARCHAR(50) DEFAULT 'Planned',
      completion_percentage DECIMAL(5,2) DEFAULT 0.00,
      labor_hours DECIMAL(10,2),
      material_cost DECIMAL(15,2),
      equipment_cost DECIMAL(15,2),
      overhead_cost DECIMAL(15,2),
      planned_duration_days INTEGER,
      planned_start_date DATE,
      planned_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      building_block VARCHAR(100),
      floor VARCHAR(50),
      zone VARCHAR(100),
      grid_reference VARCHAR(50),
      notes TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (component_id) REFERENCES components(component_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS units');
  await pool.query('DROP TABLE IF EXISTS components');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM units');
  await pool.query('DELETE FROM components');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Residential Complex A'),
      (2, 'Commercial Building B')
  `);

  await pool.query(`
    INSERT INTO components (component_id, component_name)
    VALUES 
      (1, 'Foundation'),
      (2, 'Structure'),
      (3, 'Electrical')
  `);
  
  await pool.query(`
    INSERT INTO units (unit_id, uid, project_id, component_id, unit_code, unit_name, quantity, unit_measure, unit_rate, status, floor, created_by)
    VALUES 
      (1, 'UNIT001', 1, 1, 'FND001', 'Foundation Unit 1', 100.00, 'sqm', 500.00, 'Planned', 'Ground', 1),
      (2, 'UNIT002', 1, 2, 'STR001', 'Structural Unit 1', 50.00, 'cum', 1200.00, 'In Progress', '1st Floor', 1),
      (3, 'UNIT003', 2, 3, 'ELE001', 'Electrical Unit 1', 25.00, 'points', 300.00, 'Completed', 'Ground', 2),
      (4, 'UNIT004', 1, 1, 'FND002', 'Foundation Unit 2', 80.00, 'sqm', 500.00, 'Planned', 'Ground', 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('components_component_id_seq', 3)");
  await pool.query("SELECT setval('units_unit_id_seq', 4)");
});

describe('Units API', () => {
  // Test GET all units
  test('GET /units - should return all units', async () => {
    const response = await request(app).get('/units');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('unit_id');
    expect(response.body[0]).toHaveProperty('uid');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('component_id');
    expect(response.body[0]).toHaveProperty('unit_name');
    expect(response.body[0]).toHaveProperty('quantity');
    expect(response.body[0]).toHaveProperty('unit_measure');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test GET unit by ID
  test('GET /units/:id - should return a specific unit', async () => {
    const response = await request(app).get('/units/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('unit_id', 1);
    expect(response.body).toHaveProperty('uid', 'UNIT001');
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('component_id', 1);
    expect(response.body).toHaveProperty('unit_name', 'Foundation Unit 1');
    expect(response.body).toHaveProperty('quantity', '100.000');
    expect(response.body).toHaveProperty('unit_measure', 'sqm');
    expect(response.body).toHaveProperty('status', 'Planned');
    expect(response.body).toHaveProperty('floor', 'Ground');
  });
  
  // Test GET unit by ID - not found
  test('GET /units/:id - should return 404 for non-existent unit', async () => {
    const response = await request(app).get('/units/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Unit not found');
  });
  
  // Test POST new unit
  test('POST /units - should create a new unit', async () => {
    const newUnit = {
      uid: 'UNIT005',
      project_id: 2,
      component_id: 2,
      unit_code: 'STR002',
      unit_name: 'Structural Unit 2',
      unit_description: 'Second structural unit',
      quantity: 75.50,
      unit_measure: 'cum',
      unit_rate: 1300.00,
      status: 'Planned',
      floor: '2nd Floor',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/units')
      .send(newUnit);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('unit_id', 5);
    expect(response.body).toHaveProperty('uid', 'UNIT005');
    expect(response.body).toHaveProperty('project_id', 2);
    expect(response.body).toHaveProperty('component_id', 2);
    expect(response.body).toHaveProperty('unit_name', 'Structural Unit 2');
    expect(response.body).toHaveProperty('quantity', 75.50);
    expect(response.body).toHaveProperty('unit_measure', 'cum');
    expect(response.body).toHaveProperty('floor', '2nd Floor');
    
    // Verify unit was actually created
    const allUnits = await request(app).get('/units');
    expect(allUnits.body.length).toBe(5);
  });
  
  // Test POST unit - missing required fields
  test('POST /units - should return 400 for missing required fields', async () => {
    const incompleteUnit = {
      project_id: 1,
      unit_name: 'Incomplete Unit'
    };
    
    const response = await request(app)
      .post('/units')
      .send(incompleteUnit);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'UID, project ID, component ID, unit name, quantity, and unit measure are required');
  });
  
  // Test PUT update unit
  test('PUT /units/:id - should update a unit', async () => {
    const updatedData = {
      uid: 'UNIT001',
      project_id: 1,
      component_id: 1,
      unit_code: 'FND001-UPD',
      unit_name: 'Updated Foundation Unit 1',
      unit_description: 'Updated foundation unit description',
      quantity: 120.00,
      unit_measure: 'sqm',
      unit_rate: 550.00,
      status: 'In Progress',
      floor: 'Ground',
      notes: 'Updated unit details',
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/units/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('unit_id', 1);
    expect(response.body).toHaveProperty('unit_name', 'Updated Foundation Unit 1');
    expect(response.body).toHaveProperty('quantity', 120.00);
    expect(response.body).toHaveProperty('unit_rate', 550.00);
    expect(response.body).toHaveProperty('status', 'In Progress');
    expect(response.body).toHaveProperty('notes', 'Updated unit details');
  });
  
  // Test PUT unit - not found
  test('PUT /units/:id - should return 404 for non-existent unit', async () => {
    const updatedData = {
      uid: 'UNIT999',
      project_id: 1,
      component_id: 1,
      unit_name: 'Non-existent Unit',
      quantity: 100.00,
      unit_measure: 'sqm'
    };
    
    const response = await request(app)
      .put('/units/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Unit not found');
  });
  
  // Test DELETE unit
  test('DELETE /units/:id - should delete a unit', async () => {
    const response = await request(app).delete('/units/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Unit deleted successfully');
    
    // Verify unit was actually deleted
    const deletedUnit = await request(app).get('/units/4');
    expect(deletedUnit.status).toBe(404);
    
    const allUnits = await request(app).get('/units');
    expect(allUnits.body.length).toBe(3);
  });
  
  // Test DELETE unit - not found
  test('DELETE /units/:id - should return 404 for non-existent unit', async () => {
    const response = await request(app).delete('/units/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Unit not found');
  });
  
  // Test GET units by project ID
  test('GET /units/project/:projectId - should return units for specific project', async () => {
    const response = await request(app).get('/units/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(unit => {
      expect(unit.project_id).toBe(1);
    });
    
    // Check units are ordered by unit name
    const unitNames = response.body.map(unit => unit.unit_name);
    expect(unitNames).toEqual(unitNames.sort());
  });
  
  // Test GET units by component ID
  test('GET /units/component/:componentId - should return units for specific component', async () => {
    const response = await request(app).get('/units/component/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(unit => {
      expect(unit.component_id).toBe(1);
    });
    
    // Check specific units
    const unitNames = response.body.map(unit => unit.unit_name);
    expect(unitNames).toContain('Foundation Unit 1');
    expect(unitNames).toContain('Foundation Unit 2');
  });
  
  // Test GET units by status
  test('GET /units/status/:status - should return units with specific status', async () => {
    const response = await request(app).get('/units/status/Planned');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(unit => {
      expect(unit.status).toBe('Planned');
    });
  });
  
  // Test GET units by category
  test('GET /units/category/:category - should return units with specific category', async () => {
    // First, add a unit with category
    await pool.query(`
      UPDATE units SET unit_category = 'Structural' WHERE unit_id = 2
    `);
    
    const response = await request(app).get('/units/category/Structural');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('unit_category', 'Structural');
    expect(response.body[0]).toHaveProperty('unit_name', 'Structural Unit 1');
  });
  
  // Test GET units by floor
  test('GET /units/floor/:floor - should return units on specific floor', async () => {
    const response = await request(app).get('/units/floor/Ground');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(unit => {
      expect(unit.floor).toBe('Ground');
    });
    
    // Check specific units
    const unitNames = response.body.map(unit => unit.unit_name);
    expect(unitNames).toContain('Foundation Unit 1');
    expect(unitNames).toContain('Foundation Unit 2');
  });
  
  // Test GET units by floor - partial match
  test('GET /units/floor/:floor - should return units with partial floor match', async () => {
    const response = await request(app).get('/units/floor/1st');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('floor', '1st Floor');
    expect(response.body[0]).toHaveProperty('unit_name', 'Structural Unit 1');
  });
  
  // Test edge cases
  test('GET /units/project/:projectId - should return empty array for project with no units', async () => {
    // Create a new project with no units
    await pool.query(`
      INSERT INTO projects (project_id, project_name)
      VALUES (99, 'Empty Project')
    `);
    
    const response = await request(app).get('/units/project/99');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  test('GET /units/status/:status - should return empty array for non-existent status', async () => {
    const response = await request(app).get('/units/status/NonExistentStatus');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
});
