// tests/site_visits_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for site visits
const testData = {
  seedData: [
    {
      id: 1,
      created_by: 'john_doe',
      project_id: 1,
      mom_id: 1
    },
    {
      id: 2,
      created_by: 'jane_smith',
      project_id: 1,
      mom_id: 2
    },
    {
      id: 3,
      created_by: 'john_doe',
      project_id: 2,
      mom_id: 3
    },
    {
      id: 4,
      created_by: 'bob_jones',
      project_id: 3,
      mom_id: null
    }
  ],

  createData: {
    valid: {
      complete: {
        created_by: 'alice_brown',
        project_id: 2,
        mom_id: 4
      },
      withoutMom: {
        created_by: 'john_doe',
        project_id: 3,
        mom_id: null
      },
      minimal: {
        created_by: 'test_user',
        project_id: 1,
        mom_id: null
      }
    },
    invalid: {
      allNull: {
        created_by: null,
        project_id: null,
        mom_id: null
      }
    }
  },

  updateData: {
    valid: {
      changeProject: {
        created_by: 'john_doe',
        project_id: 3,
        mom_id: 1
      },
      changeMom: {
        created_by: 'jane_smith',
        project_id: 1,
        mom_id: 5
      },
      removeMom: {
        created_by: 'bob_jones',
        project_id: 2,
        mom_id: null
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create site_visits table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id SERIAL PRIMARY KEY,
      created_by VARCHAR(100),
      project_id INTEGER,
      mom_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_site_visits_project ON site_visits(project_id);
    CREATE INDEX IF NOT EXISTS idx_site_visits_mom ON site_visits(mom_id);
    CREATE INDEX IF NOT EXISTS idx_site_visits_created_by ON site_visits(created_by);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS site_visits CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE site_visits RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const visit of testData.seedData) {
    await pool.query(
      'INSERT INTO site_visits (id, created_by, project_id, mom_id) VALUES ($1, $2, $3, $4)',
      [visit.id, visit.created_by, visit.project_id, visit.mom_id]
    );
  }
  
  await pool.query("SELECT setval('site_visits_id_seq', 4)");
});

describe('Site Visits API', () => {
  
  describe('GET /site-visits', () => {
    test('should return all site visits ordered by id DESC', async () => {
      const response = await request(app).get('/site-visits');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(4);
      
      // Check ordering (DESC)
      expect(response.body[0].id).toBe(4);
      expect(response.body[3].id).toBe(1);
      
      // Check structure
      const visit = response.body[0];
      expect(visit).toHaveProperty('id');
      expect(visit).toHaveProperty('created_by');
      expect(visit).toHaveProperty('project_id');
      expect(visit).toHaveProperty('mom_id');
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE site_visits RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/site-visits');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /site-visits/:id', () => {
    test('should return specific site visit', async () => {
      const response = await request(app).get('/site-visits/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        created_by: 'john_doe',
        project_id: 1,
        mom_id: 1
      });
    });
    
    test('should return 404 for non-existent site visit', async () => {
      const response = await request(app).get('/site-visits/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Site visit not found');
    });
    
    test('should handle null mom_id', async () => {
      const response = await request(app).get('/site-visits/4');
      
      expect(response.status).toBe(200);
      expect(response.body.mom_id).toBeNull();
    });
  });
  
  describe('POST /site-visits', () => {
    test('should create site visit with all fields', async () => {
      const newVisit = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/site-visits')
        .send(newVisit);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 5,
        ...newVisit
      });
      
      // Verify creation
      const checkResponse = await request(app).get('/site-visits/5');
      expect(checkResponse.status).toBe(200);
    });
    
    test('should create site visit without mom_id', async () => {
      const newVisit = testData.createData.valid.withoutMom;
      
      const response = await request(app)
        .post('/site-visits')
        .send(newVisit);
      
      expect(response.status).toBe(201);
      expect(response.body.mom_id).toBeNull();
    });
    
    test('should handle null values', async () => {
      const response = await request(app)
        .post('/site-visits')
        .send(testData.createData.invalid.allNull);
      
      // Should create but with null values
      expect(response.status).toBe(201);
      expect(response.body.created_by).toBeNull();
      expect(response.body.project_id).toBeNull();
      expect(response.body.mom_id).toBeNull();
    });
  });
  
  describe('PUT /site-visits/:id', () => {
    test('should update site visit', async () => {
      const response = await request(app)
        .put('/site-visits/1')
        .send(testData.updateData.valid.changeProject);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        created_by: 'john_doe',
        project_id: 3,
        mom_id: 1
      });
    });
    
    test('should update mom_id', async () => {
      const response = await request(app)
        .put('/site-visits/2')
        .send(testData.updateData.valid.changeMom);
      
      expect(response.status).toBe(200);
      expect(response.body.mom_id).toBe(5);
    });
    
    test('should remove mom_id (set to null)', async () => {
      const response = await request(app)
        .put('/site-visits/1')
        .send(testData.updateData.valid.removeMom);
      
      expect(response.status).toBe(200);
      expect(response.body.mom_id).toBeNull();
    });
    
    test('should return 404 for non-existent site visit', async () => {
      const response = await request(app)
        .put('/site-visits/999')
        .send(testData.updateData.valid.changeProject);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Site visit not found');
    });
  });
  
  describe('DELETE /site-visits/:id', () => {
    test('should delete existing site visit', async () => {
      const response = await request(app).delete('/site-visits/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Site visit deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/site-visits/4');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent site visit', async () => {
      const response = await request(app).delete('/site-visits/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Site visit not found');
    });
  });
  
  describe('GET /site-visits/project/:projectId', () => {
    test('should return visits for specific project', async () => {
      const response = await request(app).get('/site-visits/project/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(visit => {
        expect(visit.project_id).toBe(1);
      });
      
      // Should be ordered by id DESC
      expect(response.body[0].id).toBe(2);
      expect(response.body[1].id).toBe(1);
    });
    
    test('should return empty array for project with no visits', async () => {
      const response = await request(app).get('/site-visits/project/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /site-visits/mom/:momId', () => {
    test('should return visits for specific MOM', async () => {
      const response = await request(app).get('/site-visits/mom/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].mom_id).toBe(1);
    });
    
    test('should return empty array for MOM with no visits', async () => {
      const response = await request(app).get('/site-visits/mom/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      // Mix of operations
      promises.push(request(app).get('/site-visits'));
      promises.push(request(app).get('/site-visits/1'));
      promises.push(request(app).get('/site-visits/project/1'));
      promises.push(request(app).get('/site-visits/mom/1'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
    
    test('should handle invalid ID formats', async () => {
      const invalidIds = ['abc', 'null', '1.5', '-1'];
      
      for (const id of invalidIds) {
        const response = await request(app).get(`/site-visits/${id}`);
        expect([404, 500]).toContain(response.status);
      }
    });
    
    test('should handle special characters in created_by', async () => {
      const visit = {
        created_by: "user@example.com",
        project_id: 1,
        mom_id: 1
      };
      
      const response = await request(app)
        .post('/site-visits')
        .send(visit);
      
      expect(response.status).toBe(201);
      expect(response.body.created_by).toBe("user@example.com");
    });
  });
});
