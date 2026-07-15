// tests/architect_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for architect assignments
const testData = {
  seedData: [
    {
      id: 1,
      project_id: 1,
      client_requirement_id: 1,
      user_id: 1
    },
    {
      id: 2,
      project_id: 1,
      client_requirement_id: 1,
      user_id: 2
    },
    {
      id: 3,
      project_id: 2,
      client_requirement_id: 2,
      user_id: 1
    },
    {
      id: 4,
      project_id: 3,
      client_requirement_id: 3,
      user_id: 3
    }
  ],

  createData: {
    valid: {
      complete: {
        project_id: 4,
        client_requirement_id: 4,
        user_id: 2
      },
      minimal: {
        project_id: 5,
        client_requirement_id: 5,
        user_id: 1
      },
      duplicate: {
        project_id: 1,
        client_requirement_id: 1,
        user_id: 3  // Different user for same project/requirement
      }
    },
    invalid: {
      missingFields: {
        project_id: 1
        // Missing client_requirement_id and user_id
      },
      nullValues: {
        project_id: null,
        client_requirement_id: null,
        user_id: null
      }
    }
  },

  updateData: {
    valid: {
      changeUser: {
        project_id: 1,
        client_requirement_id: 1,
        user_id: 3  // Change architect
      },
      changeProject: {
        project_id: 4,
        client_requirement_id: 4,
        user_id: 2
      }
    },
    invalid: {
      nullUser: {
        project_id: 1,
        client_requirement_id: 1,
        user_id: null
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create architect table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect (
      id SERIAL PRIMARY KEY,
      project_id INTEGER,
      client_requirement_id INTEGER,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_architect_project ON architect(project_id);
    CREATE INDEX IF NOT EXISTS idx_architect_user ON architect(user_id);
    CREATE INDEX IF NOT EXISTS idx_architect_requirement ON architect(client_requirement_id);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS architect CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE architect RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const assignment of testData.seedData) {
    await pool.query(
      'INSERT INTO architect (id, project_id, client_requirement_id, user_id) VALUES ($1, $2, $3, $4)',
      [assignment.id, assignment.project_id, assignment.client_requirement_id, assignment.user_id]
    );
  }
  
  await pool.query("SELECT setval('architect_id_seq', 4)");
});

describe('Architect API', () => {
  
  describe('GET /architect', () => {
    test('should return all architect assignments ordered by id DESC', async () => {
      const response = await request(app).get('/architect');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(4);
      
      // Check ordering (DESC)
      expect(response.body[0].id).toBe(4);
      expect(response.body[3].id).toBe(1);
      
      // Check structure
      const assignment = response.body[0];
      expect(assignment).toHaveProperty('id');
      expect(assignment).toHaveProperty('project_id');
      expect(assignment).toHaveProperty('client_requirement_id');
      expect(assignment).toHaveProperty('user_id');
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE architect RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/architect');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /architect/:id', () => {
    test('should return specific architect assignment', async () => {
      const response = await request(app).get('/architect/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        project_id: 1,
        client_requirement_id: 1,
        user_id: 1
      });
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app).get('/architect/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Architect assignment not found');
    });
  });
  
  describe('POST /architect', () => {
    test('should create architect assignment', async () => {
      const newAssignment = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/architect')
        .send(newAssignment);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 5,
        ...newAssignment
      });
      
      // Verify creation
      const checkResponse = await request(app).get('/architect/5');
      expect(checkResponse.status).toBe(200);
    });
    
    test('should allow multiple architects for same project', async () => {
      const newAssignment = testData.createData.valid.duplicate;
      
      const response = await request(app)
        .post('/architect')
        .send(newAssignment);
      
      expect(response.status).toBe(201);
      
      // Verify both assignments exist
      const projectResponse = await request(app).get('/architect/project/1');
      expect(projectResponse.body.length).toBe(3); // 2 original + 1 new
    });
    
    test('should handle null values', async () => {
      const response = await request(app)
        .post('/architect')
        .send(testData.createData.invalid.nullValues);
      
      // Should create but with null values
      expect(response.status).toBe(201);
      expect(response.body.project_id).toBeNull();
      expect(response.body.user_id).toBeNull();
    });
  });
  
  describe('PUT /architect/:id', () => {
    test('should update architect assignment', async () => {
      const response = await request(app)
        .put('/architect/1')
        .send(testData.updateData.valid.changeUser);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        project_id: 1,
        client_requirement_id: 1,
        user_id: 3
      });
    });
    
    test('should update to different project', async () => {
      const response = await request(app)
        .put('/architect/2')
        .send(testData.updateData.valid.changeProject);
      
      expect(response.status).toBe(200);
      expect(response.body.project_id).toBe(4);
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app)
        .put('/architect/999')
        .send(testData.updateData.valid.changeUser);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Architect assignment not found');
    });
  });
  
  describe('DELETE /architect/:id', () => {
    test('should delete existing assignment', async () => {
      const response = await request(app).delete('/architect/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Architect assignment deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/architect/4');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent assignment', async () => {
      const response = await request(app).delete('/architect/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Architect assignment not found');
    });
  });
  
  describe('GET /architect/project/:projectId', () => {
    test('should return assignments for specific project', async () => {
      const response = await request(app).get('/architect/project/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(assignment => {
        expect(assignment.project_id).toBe(1);
      });
      
      // Should be ordered by id DESC
      expect(response.body[0].id).toBe(2);
      expect(response.body[1].id).toBe(1);
    });
    
    test('should return empty array for project with no assignments', async () => {
      const response = await request(app).get('/architect/project/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /architect/user/:userId', () => {
    test('should return assignments for specific user', async () => {
      const response = await request(app).get('/architect/user/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(assignment => {
        expect(assignment.user_id).toBe(1);
      });
    });
    
    test('should return empty array for user with no assignments', async () => {
      const response = await request(app).get('/architect/user/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /architect/requirement/:requirementId', () => {
    test('should return assignments for specific requirement', async () => {
      const response = await request(app).get('/architect/requirement/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(assignment => {
        expect(assignment.client_requirement_id).toBe(1);
      });
    });
    
    test('should return empty array for requirement with no assignments', async () => {
      const response = await request(app).get('/architect/requirement/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      // Mix of operations
      promises.push(request(app).get('/architect'));
      promises.push(request(app).get('/architect/1'));
      promises.push(request(app).get('/architect/project/1'));
      promises.push(request(app).get('/architect/user/1'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
    
    test('should handle invalid ID formats', async () => {
      const invalidIds = ['abc', 'null', '1.5', '-1'];
      
      for (const id of invalidIds) {
        const response = await request(app).get(`/architect/${id}`);
        expect([404, 500]).toContain(response.status);
      }
    });
  });
});
