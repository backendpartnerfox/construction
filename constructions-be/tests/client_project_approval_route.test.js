// tests/client_project_approval_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for client project approvals
const testData = {
  seedData: [
    {
      id: 1,
      drawings_id: 1,
      client_id: 1,
      project_id: 1,
      drawing_version: 'v1.0'
    },
    {
      id: 2,
      drawings_id: 2,
      client_id: 1,
      project_id: 1,
      drawing_version: 'v1.1'
    },
    {
      id: 3,
      drawings_id: 3,
      client_id: 2,
      project_id: 2,
      drawing_version: 'v2.0'
    },
    {
      id: 4,
      drawings_id: 1,
      client_id: 3,
      project_id: 3,
      drawing_version: 'v1.0-draft'
    }
  ],

  createData: {
    valid: {
      complete: {
        drawings_id: 4,
        client_id: 2,
        project_id: 2,
        drawing_version: 'v3.0'
      },
      minimal: {
        drawings_id: 5,
        client_id: 1,
        project_id: 1,
        drawing_version: null
      },
      withSpecialVersion: {
        drawings_id: 6,
        client_id: 3,
        project_id: 3,
        drawing_version: 'v2.1-beta-RC1'
      }
    },
    invalid: {
      allNull: {
        drawings_id: null,
        client_id: null,
        project_id: null,
        drawing_version: null
      }
    }
  },

  updateData: {
    valid: {
      changeVersion: {
        drawings_id: 1,
        client_id: 1,
        project_id: 1,
        drawing_version: 'v1.0-final'
      },
      changeDrawing: {
        drawings_id: 7,
        client_id: 2,
        project_id: 2,
        drawing_version: 'v2.1'
      },
      changeClient: {
        drawings_id: 3,
        client_id: 4,
        project_id: 2,
        drawing_version: 'v2.0-approved'
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create client_project_approval table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_project_approval (
      id SERIAL PRIMARY KEY,
      drawings_id INTEGER,
      client_id INTEGER,
      project_id INTEGER,
      drawing_version VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_approval_client ON client_project_approval(client_id);
    CREATE INDEX IF NOT EXISTS idx_approval_project ON client_project_approval(project_id);
    CREATE INDEX IF NOT EXISTS idx_approval_drawing ON client_project_approval(drawings_id);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS client_project_approval CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE client_project_approval RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const approval of testData.seedData) {
    await pool.query(
      'INSERT INTO client_project_approval (id, drawings_id, client_id, project_id, drawing_version) VALUES ($1, $2, $3, $4, $5)',
      [approval.id, approval.drawings_id, approval.client_id, approval.project_id, approval.drawing_version]
    );
  }
  
  await pool.query("SELECT setval('client_project_approval_id_seq', 4)");
});

describe('Client Project Approval API', () => {
  
  describe('GET /client-project-approval', () => {
    test('should return all approvals ordered by id DESC', async () => {
      const response = await request(app).get('/client-project-approval');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(4);
      
      // Check ordering (DESC)
      expect(response.body[0].id).toBe(4);
      expect(response.body[3].id).toBe(1);
      
      // Check structure
      const approval = response.body[0];
      expect(approval).toHaveProperty('id');
      expect(approval).toHaveProperty('drawings_id');
      expect(approval).toHaveProperty('client_id');
      expect(approval).toHaveProperty('project_id');
      expect(approval).toHaveProperty('drawing_version');
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE client_project_approval RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/client-project-approval');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /client-project-approval/:id', () => {
    test('should return specific approval', async () => {
      const response = await request(app).get('/client-project-approval/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        drawings_id: 1,
        client_id: 1,
        project_id: 1,
        drawing_version: 'v1.0'
      });
    });
    
    test('should return 404 for non-existent approval', async () => {
      const response = await request(app).get('/client-project-approval/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client project approval not found');
    });
  });
  
  describe('POST /client-project-approval', () => {
    test('should create approval with all fields', async () => {
      const newApproval = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/client-project-approval')
        .send(newApproval);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 5,
        ...newApproval
      });
      
      // Verify creation
      const checkResponse = await request(app).get('/client-project-approval/5');
      expect(checkResponse.status).toBe(200);
    });
    
    test('should create approval with null version', async () => {
      const newApproval = testData.createData.valid.minimal;
      
      const response = await request(app)
        .post('/client-project-approval')
        .send(newApproval);
      
      expect(response.status).toBe(201);
      expect(response.body.drawing_version).toBeNull();
    });
    
    test('should handle special characters in version', async () => {
      const newApproval = testData.createData.valid.withSpecialVersion;
      
      const response = await request(app)
        .post('/client-project-approval')
        .send(newApproval);
      
      expect(response.status).toBe(201);
      expect(response.body.drawing_version).toBe('v2.1-beta-RC1');
    });
    
    test('should create with all null values', async () => {
      const response = await request(app)
        .post('/client-project-approval')
        .send(testData.createData.invalid.allNull);
      
      // Should succeed as there are no NOT NULL constraints
      expect(response.status).toBe(201);
      expect(response.body.drawings_id).toBeNull();
      expect(response.body.client_id).toBeNull();
      expect(response.body.project_id).toBeNull();
    });
  });
  
  describe('PUT /client-project-approval/:id', () => {
    test('should update approval version', async () => {
      const response = await request(app)
        .put('/client-project-approval/1')
        .send(testData.updateData.valid.changeVersion);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        drawing_version: 'v1.0-final'
      });
    });
    
    test('should update drawing reference', async () => {
      const response = await request(app)
        .put('/client-project-approval/3')
        .send(testData.updateData.valid.changeDrawing);
      
      expect(response.status).toBe(200);
      expect(response.body.drawings_id).toBe(7);
    });
    
    test('should update client assignment', async () => {
      const response = await request(app)
        .put('/client-project-approval/3')
        .send(testData.updateData.valid.changeClient);
      
      expect(response.status).toBe(200);
      expect(response.body.client_id).toBe(4);
      expect(response.body.drawing_version).toBe('v2.0-approved');
    });
    
    test('should return 404 for non-existent approval', async () => {
      const response = await request(app)
        .put('/client-project-approval/999')
        .send(testData.updateData.valid.changeVersion);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client project approval not found');
    });
  });
  
  describe('DELETE /client-project-approval/:id', () => {
    test('should delete existing approval', async () => {
      const response = await request(app).delete('/client-project-approval/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Client project approval deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/client-project-approval/4');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent approval', async () => {
      const response = await request(app).delete('/client-project-approval/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client project approval not found');
    });
  });
  
  describe('GET /client-project-approval/client/:clientId', () => {
    test('should return approvals for specific client', async () => {
      const response = await request(app).get('/client-project-approval/client/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(approval => {
        expect(approval.client_id).toBe(1);
      });
      
      // Should be ordered by id DESC
      expect(response.body[0].id).toBe(2);
      expect(response.body[1].id).toBe(1);
    });
    
    test('should return empty array for client with no approvals', async () => {
      const response = await request(app).get('/client-project-approval/client/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /client-project-approval/project/:projectId', () => {
    test('should return approvals for specific project', async () => {
      const response = await request(app).get('/client-project-approval/project/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(approval => {
        expect(approval.project_id).toBe(1);
      });
    });
    
    test('should return single approval for project', async () => {
      const response = await request(app).get('/client-project-approval/project/2');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].project_id).toBe(2);
    });
  });
  
  describe('GET /client-project-approval/drawing/:drawingId', () => {
    test('should return approvals for specific drawing', async () => {
      const response = await request(app).get('/client-project-approval/drawing/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(approval => {
        expect(approval.drawings_id).toBe(1);
      });
    });
    
    test('should return empty array for drawing with no approvals', async () => {
      const response = await request(app).get('/client-project-approval/drawing/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      // Mix of operations
      promises.push(request(app).get('/client-project-approval'));
      promises.push(request(app).get('/client-project-approval/1'));
      promises.push(request(app).get('/client-project-approval/client/1'));
      promises.push(request(app).get('/client-project-approval/project/1'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
    
    test('should handle invalid ID formats', async () => {
      const invalidIds = ['abc', 'null', '1.5', '-1'];
      
      for (const id of invalidIds) {
        const response = await request(app).get(`/client-project-approval/${id}`);
        expect([404, 500]).toContain(response.status);
      }
    });
    
    test('should handle version strings with various formats', async () => {
      const versions = [
        'v1.0.0',
        '2.3.4-alpha',
        'RC-1',
        'FINAL',
        'draft_v3',
        '1.0 (approved)',
        null
      ];
      
      for (let i = 0; i < versions.length; i++) {
        const approval = {
          drawings_id: i + 10,
          client_id: 1,
          project_id: 1,
          drawing_version: versions[i]
        };
        
        const response = await request(app)
          .post('/client-project-approval')
          .send(approval);
        
        expect(response.status).toBe(201);
        expect(response.body.drawing_version).toBe(versions[i]);
      }
    });
  });
});
