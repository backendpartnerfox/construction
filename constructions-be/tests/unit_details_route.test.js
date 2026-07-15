// tests/unit_details_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for unit details
const testData = {
  // Projects needed for unit details
  projects: [
    { id: 1, project_name: 'Office Building' },
    { id: 2, project_name: 'Residential Complex' },
    { id: 3, project_name: 'Shopping Mall' }
  ],
  
  // Unit details seed data
  seedData: [
    {
      unit_id: 1,
      uid: 'UNIT-001',
      project_id: 1,
      unit_name: 'Foundation Work',
      unit_category: 'Structural',
      quantity: 1000,
      unit_measure: 'cum',
      unit_rate: 5000,
      unit_total: 5000000,
      unit_status: 'Completed',
      element_name: 'Foundation',
      element_category: 'Substructure',
      item_name: 'Concrete M25',
      item_category: 'Material',
      component_name: 'Foundation Component',
      component_category: 'Base',
      boq_total_cost: 5500000,
      material_cost: 3000000,
      labor_cost: 1500000,
      equipment_cost: 500000,
      overhead_cost: 500000
    },
    {
      unit_id: 2,
      uid: 'UNIT-002',
      project_id: 1,
      unit_name: 'Column Work',
      unit_category: 'Structural',
      quantity: 500,
      unit_measure: 'cum',
      unit_rate: 6000,
      unit_total: 3000000,
      unit_status: 'In Progress',
      element_name: 'Column',
      element_category: 'Superstructure',
      item_name: 'Concrete M30',
      item_category: 'Material',
      component_name: 'Column Component',
      component_category: 'Vertical',
      boq_total_cost: 3200000,
      material_cost: 1800000,
      labor_cost: 900000,
      equipment_cost: 300000,
      overhead_cost: 200000
    },
    {
      unit_id: 3,
      uid: 'UNIT-003',
      project_id: 1,
      unit_name: 'Electrical Wiring',
      unit_category: 'MEP',
      quantity: 5000,
      unit_measure: 'sqm',
      unit_rate: 500,
      unit_total: 2500000,
      unit_status: 'Planned',
      element_name: 'Electrical',
      element_category: 'Services',
      item_name: 'Copper Wire',
      item_category: 'Electrical',
      component_name: 'Wiring Component',
      component_category: 'Electrical',
      boq_total_cost: 2700000,
      material_cost: 1500000,
      labor_cost: 800000,
      equipment_cost: 200000,
      overhead_cost: 200000
    },
    {
      unit_id: 4,
      uid: 'UNIT-004',
      project_id: 2,
      unit_name: 'Plumbing Installation',
      unit_category: 'MEP',
      quantity: 2000,
      unit_measure: 'sqm',
      unit_rate: 800,
      unit_total: 1600000,
      unit_status: 'In Progress',
      element_name: 'Plumbing',
      element_category: 'Services',
      item_name: 'PVC Pipes',
      item_category: 'Plumbing',
      component_name: 'Plumbing Component',
      component_category: 'Water Supply',
      boq_total_cost: 1750000,
      material_cost: 900000,
      labor_cost: 600000,
      equipment_cost: 150000,
      overhead_cost: 100000
    },
    {
      unit_id: 5,
      uid: 'UNIT-005',
      project_id: 2,
      unit_name: 'Flooring Work',
      unit_category: 'Finishing',
      quantity: 3000,
      unit_measure: 'sqm',
      unit_rate: 1200,
      unit_total: 3600000,
      unit_status: 'On Hold',
      element_name: 'Flooring',
      element_category: 'Interior',
      item_name: 'Vitrified Tiles',
      item_category: 'Finishing',
      component_name: 'Floor Component',
      component_category: 'Interior',
      boq_total_cost: 3800000,
      material_cost: 2200000,
      labor_cost: 1000000,
      equipment_cost: 400000,
      overhead_cost: 200000
    }
  ]
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create required tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS unit_details (
      unit_id SERIAL PRIMARY KEY,
      uid VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER REFERENCES projects(id),
      unit_name VARCHAR(200) NOT NULL,
      unit_category VARCHAR(100),
      quantity DECIMAL(12,2),
      unit_measure VARCHAR(20),
      unit_rate DECIMAL(12,2),
      unit_total DECIMAL(15,2),
      unit_status VARCHAR(50),
      element_name VARCHAR(200),
      element_category VARCHAR(100),
      item_name VARCHAR(200),
      item_category VARCHAR(100),
      component_name VARCHAR(200),
      component_category VARCHAR(100),
      boq_total_cost DECIMAL(15,2),
      material_cost DECIMAL(15,2),
      labor_cost DECIMAL(15,2),
      equipment_cost DECIMAL(15,2),
      overhead_cost DECIMAL(15,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_unit_details_project ON unit_details(project_id);
    CREATE INDEX IF NOT EXISTS idx_unit_details_uid ON unit_details(uid);
    CREATE INDEX IF NOT EXISTS idx_unit_details_category ON unit_details(unit_category);
    CREATE INDEX IF NOT EXISTS idx_unit_details_status ON unit_details(unit_status);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS unit_details CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE unit_details RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE projects RESTART IDENTITY CASCADE');
  
  // Insert projects
  for (const project of testData.projects) {
    await pool.query(
      'INSERT INTO projects (id, project_name) VALUES ($1, $2)',
      [project.id, project.project_name]
    );
  }
  
  // Insert unit details
  for (const unit of testData.seedData) {
    const columns = Object.keys(unit).join(', ');
    const placeholders = Object.keys(unit).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(unit);
    
    await pool.query(
      `INSERT INTO unit_details (${columns}) VALUES (${placeholders})`,
      values
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('projects_id_seq', 3)");
  await pool.query("SELECT setval('unit_details_unit_id_seq', 5)");
});

describe('Unit Details API', () => {
  
  describe('GET /unit-details', () => {
    test('should return all unit details with project info', async () => {
      const response = await request(app).get('/unit-details');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(5);
      
      // Check structure
      const unit = response.body[0];
      expect(unit).toHaveProperty('unit_id');
      expect(unit).toHaveProperty('uid');
      expect(unit).toHaveProperty('project_id');
      expect(unit).toHaveProperty('unit_name');
      expect(unit).toHaveProperty('project_name');
    });
    
    test('should filter by project_id', async () => {
      const response = await request(app).get('/unit-details?project_id=1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      response.body.forEach(unit => {
        expect(unit.project_id).toBe(1);
      });
    });
    
    test('should filter by unit_category', async () => {
      const response = await request(app).get('/unit-details?unit_category=MEP');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach(unit => {
        expect(unit.unit_category).toBe('MEP');
      });
    });
    
    test('should filter by unit_status', async () => {
      const response = await request(app).get('/unit-details?unit_status=In Progress');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach(unit => {
        expect(unit.unit_status).toBe('In Progress');
      });
    });
    
    test('should apply multiple filters', async () => {
      const response = await request(app).get('/unit-details?project_id=1&unit_category=Structural');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach(unit => {
        expect(unit.project_id).toBe(1);
        expect(unit.unit_category).toBe('Structural');
      });
    });
  });
  
  describe('GET /unit-details/unit/:unitId', () => {
    test('should return specific unit detail', async () => {
      const response = await request(app).get('/unit-details/unit/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        unit_id: 1,
        uid: 'UNIT-001',
        unit_name: 'Foundation Work',
        project_name: 'Office Building'
      });
    });
    
    test('should return 404 for non-existent unit', async () => {
      const response = await request(app).get('/unit-details/unit/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Unit detail not found');
    });
  });
  
  describe('GET /unit-details/project/:projectId', () => {
    test('should return units for specific project', async () => {
      const response = await request(app).get('/unit-details/project/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      response.body.forEach(unit => {
        expect(unit.project_id).toBe(1);
      });
    });
    
    test('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/unit-details/project/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
    });
    
    test('should return empty array for project with no units', async () => {
      const response = await request(app).get('/unit-details/project/3');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /unit-details/uid/:uid', () => {
    test('should return unit by UID', async () => {
      const response = await request(app).get('/unit-details/uid/UNIT-001');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        uid: 'UNIT-001',
        unit_name: 'Foundation Work'
      });
    });
    
    test('should return 404 for non-existent UID', async () => {
      const response = await request(app).get('/unit-details/uid/UNIT-999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Unit detail not found');
    });
  });
  
  describe('GET /unit-details/project/:projectId/category/:category', () => {
    test('should return units by project and category', async () => {
      const response = await request(app).get('/unit-details/project/1/category/Structural');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach(unit => {
        expect(unit.project_id).toBe(1);
        expect(unit.unit_category).toBe('Structural');
      });
    });
    
    test('should return empty array for no matches', async () => {
      const response = await request(app).get('/unit-details/project/2/category/Structural');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /unit-details/project/:projectId/summary', () => {
    test('should return project summary statistics', async () => {
      const response = await request(app).get('/unit-details/project/1/summary');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_units', '3');
      expect(response.body).toHaveProperty('total_categories', '2');
      expect(response.body).toHaveProperty('completed_units', '1');
      expect(response.body).toHaveProperty('in_progress_units', '1');
      expect(response.body).toHaveProperty('planned_units', '1');
      expect(response.body).toHaveProperty('on_hold_units', '0');
      
      // Check cost calculations
      expect(Number(response.body.total_unit_cost)).toBe(10500000);
      expect(Number(response.body.total_material_cost)).toBe(6300000);
    });
    
    test('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/unit-details/project/999/summary');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
    });
  });
  
  describe('GET /unit-details/categories', () => {
    test('should return unique categories', async () => {
      const response = await request(app).get('/unit-details/categories');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body).toEqual(['Finishing', 'MEP', 'Structural']);
    });
  });
  
  describe('GET /unit-details/search', () => {
    test('should search by unit name', async () => {
      const response = await request(app).get('/unit-details/search?query=foundation');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].unit_name).toBe('Foundation Work');
    });
    
    test('should search by UID', async () => {
      const response = await request(app).get('/unit-details/search?query=UNIT-002');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].uid).toBe('UNIT-002');
    });
    
    test('should search by element name', async () => {
      const response = await request(app).get('/unit-details/search?query=electrical');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].element_name).toBe('Electrical');
    });
    
    test('should be case-insensitive', async () => {
      const response = await request(app).get('/unit-details/search?query=PLUMBING');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });
    
    test('should return 400 for missing query', async () => {
      const response = await request(app).get('/unit-details/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
  
  describe('GET /unit-details/cost-analysis/:projectId', () => {
    test('should return cost analysis by category', async () => {
      const response = await request(app).get('/unit-details/cost-analysis/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2); // Structural and MEP
      
      // Check structural category
      const structural = response.body.find(c => c.unit_category === 'Structural');
      expect(Number(structural.unit_count)).toBe(2);
      expect(Number(structural.category_total_cost)).toBe(8000000);
      
      // Check percentages
      expect(Number(structural.material_cost_percentage)).toBeCloseTo(60, 0);
    });
    
    test('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/unit-details/cost-analysis/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
    });
  });
  
  describe('POST /unit-details/refresh/:projectId', () => {
    test('should refresh unit details for project', async () => {
      const response = await request(app)
        .post('/unit-details/refresh/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Unit details refresh completed successfully');
      expect(response.body).toHaveProperty('project_id', 1);
      expect(response.body).toHaveProperty('units_refreshed', '3');
    });
    
    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post('/unit-details/refresh/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project not found');
    });
  });
  
  describe('Edge cases', () => {
    test('should handle null categories correctly', async () => {
      // Add a unit with null category
      await pool.query(`
        INSERT INTO unit_details (unit_id, uid, project_id, unit_name, unit_category, quantity, unit_measure, unit_rate, unit_total)
        VALUES (6, 'UNIT-006', 1, 'Test Unit', NULL, 100, 'nos', 100, 10000)
      `);
      
      const response = await request(app).get('/unit-details/categories');
      
      expect(response.status).toBe(200);
      expect(response.body).not.toContain(null);
    });
    
    test('should handle division by zero in cost analysis', async () => {
      // Add units with zero total cost
      await pool.query(`
        INSERT INTO unit_details (unit_id, uid, project_id, unit_name, unit_category, quantity, unit_measure, unit_rate, unit_total, material_cost)
        VALUES (7, 'UNIT-007', 3, 'Zero Cost Unit', 'Test', 1, 'nos', 0, 0, 100)
      `);
      
      const response = await request(app).get('/unit-details/cost-analysis/3');
      
      expect(response.status).toBe(200);
      // Should not crash due to division by zero
    });
    
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      promises.push(request(app).get('/unit-details'));
      promises.push(request(app).get('/unit-details/project/1'));
      promises.push(request(app).get('/unit-details/categories'));
      promises.push(request(app).get('/unit-details/search?query=work'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
