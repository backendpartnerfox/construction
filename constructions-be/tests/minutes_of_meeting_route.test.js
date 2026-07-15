// tests/minutes_of_meeting_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for minutes of meeting
const testData = {
  seedData: [
    {
      mom_id: 1,
      meeting_id: 1,
      initial_mom: 'Initial discussion about project scope and timeline',
      mom_sending: 'Sent to all stakeholders via email on 2024-01-16',
      project_id: 1
    },
    {
      mom_id: 2,
      meeting_id: 2,
      initial_mom: 'Budget review and approval process discussed',
      mom_sending: 'Distributed to finance team and project managers',
      project_id: 1
    },
    {
      mom_id: 3,
      meeting_id: 3,
      initial_mom: 'Technical requirements and specifications finalized',
      mom_sending: 'Shared with technical team and architects',
      project_id: 2
    },
    {
      mom_id: 4,
      meeting_id: 4,
      initial_mom: 'Site visit observations and concerns',
      mom_sending: null,
      project_id: 2
    }
  ],

  createData: {
    valid: {
      complete: {
        meeting_id: 5,
        initial_mom: 'Progress review meeting - Phase 1 completion',
        mom_sending: 'Sent to client and internal team on 2024-02-01',
        project_id: 3
      },
      withNullSending: {
        meeting_id: 6,
        initial_mom: 'Emergency meeting regarding material shortage',
        mom_sending: null,
        project_id: 1
      },
      minimal: {
        meeting_id: 7,
        initial_mom: 'Quick sync meeting',
        mom_sending: null,
        project_id: 2
      }
    },
    invalid: {
      allNull: {
        meeting_id: null,
        initial_mom: null,
        mom_sending: null,
        project_id: null
      }
    }
  },

  updateData: {
    valid: {
      updateContent: {
        meeting_id: 1,
        initial_mom: 'Updated: Initial discussion about project scope, timeline, and resources',
        mom_sending: 'Sent to all stakeholders via email on 2024-01-16 (Updated)',
        project_id: 1
      },
      updateSending: {
        meeting_id: 4,
        initial_mom: 'Site visit observations and concerns',
        mom_sending: 'Finally sent to relevant parties on 2024-01-20',
        project_id: 2
      },
      changeProject: {
        meeting_id: 2,
        initial_mom: 'Budget review and approval process discussed',
        mom_sending: 'Distributed to finance team and project managers',
        project_id: 3
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create minutes_of_meeting table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS minutes_of_meeting (
      mom_id SERIAL PRIMARY KEY,
      meeting_id INTEGER,
      initial_mom TEXT,
      mom_sending TEXT,
      project_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_mom_meeting ON minutes_of_meeting(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_mom_project ON minutes_of_meeting(project_id);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS minutes_of_meeting CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE minutes_of_meeting RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const mom of testData.seedData) {
    await pool.query(
      'INSERT INTO minutes_of_meeting (mom_id, meeting_id, initial_mom, mom_sending, project_id) VALUES ($1, $2, $3, $4, $5)',
      [mom.mom_id, mom.meeting_id, mom.initial_mom, mom.mom_sending, mom.project_id]
    );
  }
  
  await pool.query("SELECT setval('minutes_of_meeting_mom_id_seq', 4)");
});

describe('Minutes of Meeting API', () => {
  
  describe('GET /minutes-of-meeting', () => {
    test('should return all minutes ordered by mom_id DESC', async () => {
      const response = await request(app).get('/minutes-of-meeting');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(4);
      
      // Check ordering (DESC)
      expect(response.body[0].mom_id).toBe(4);
      expect(response.body[3].mom_id).toBe(1);
      
      // Check structure
      const mom = response.body[0];
      expect(mom).toHaveProperty('mom_id');
      expect(mom).toHaveProperty('meeting_id');
      expect(mom).toHaveProperty('initial_mom');
      expect(mom).toHaveProperty('mom_sending');
      expect(mom).toHaveProperty('project_id');
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE minutes_of_meeting RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/minutes-of-meeting');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /minutes-of-meeting/:id', () => {
    test('should return specific minutes', async () => {
      const response = await request(app).get('/minutes-of-meeting/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        mom_id: 1,
        meeting_id: 1,
        initial_mom: 'Initial discussion about project scope and timeline',
        mom_sending: 'Sent to all stakeholders via email on 2024-01-16',
        project_id: 1
      });
    });
    
    test('should return 404 for non-existent minutes', async () => {
      const response = await request(app).get('/minutes-of-meeting/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Minutes of meeting not found');
    });
    
    test('should handle null mom_sending field', async () => {
      const response = await request(app).get('/minutes-of-meeting/4');
      
      expect(response.status).toBe(200);
      expect(response.body.mom_sending).toBeNull();
    });
  });
  
  describe('POST /minutes-of-meeting', () => {
    test('should create minutes with all fields', async () => {
      const newMom = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/minutes-of-meeting')
        .send(newMom);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        mom_id: 5,
        ...newMom
      });
      
      // Verify creation
      const checkResponse = await request(app).get('/minutes-of-meeting/5');
      expect(checkResponse.status).toBe(200);
    });
    
    test('should create minutes with null mom_sending', async () => {
      const newMom = testData.createData.valid.withNullSending;
      
      const response = await request(app)
        .post('/minutes-of-meeting')
        .send(newMom);
      
      expect(response.status).toBe(201);
      expect(response.body.mom_sending).toBeNull();
    });
    
    test('should handle all null values', async () => {
      const response = await request(app)
        .post('/minutes-of-meeting')
        .send(testData.createData.invalid.allNull);
      
      // Should succeed as there are no NOT NULL constraints
      expect(response.status).toBe(201);
      expect(response.body.meeting_id).toBeNull();
      expect(response.body.initial_mom).toBeNull();
    });
  });
  
  describe('PUT /minutes-of-meeting/:id', () => {
    test('should update minutes content', async () => {
      const response = await request(app)
        .put('/minutes-of-meeting/1')
        .send(testData.updateData.valid.updateContent);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        mom_id: 1,
        initial_mom: testData.updateData.valid.updateContent.initial_mom
      });
    });
    
    test('should update mom_sending from null', async () => {
      const response = await request(app)
        .put('/minutes-of-meeting/4')
        .send(testData.updateData.valid.updateSending);
      
      expect(response.status).toBe(200);
      expect(response.body.mom_sending).toBe('Finally sent to relevant parties on 2024-01-20');
    });
    
    test('should change project assignment', async () => {
      const response = await request(app)
        .put('/minutes-of-meeting/2')
        .send(testData.updateData.valid.changeProject);
      
      expect(response.status).toBe(200);
      expect(response.body.project_id).toBe(3);
    });
    
    test('should return 404 for non-existent minutes', async () => {
      const response = await request(app)
        .put('/minutes-of-meeting/999')
        .send(testData.updateData.valid.updateContent);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Minutes of meeting not found');
    });
  });
  
  describe('DELETE /minutes-of-meeting/:id', () => {
    test('should delete existing minutes', async () => {
      const response = await request(app).delete('/minutes-of-meeting/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Minutes of meeting deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/minutes-of-meeting/4');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent minutes', async () => {
      const response = await request(app).delete('/minutes-of-meeting/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Minutes of meeting not found');
    });
  });
  
  describe('GET /minutes-of-meeting/meeting/:meetingId', () => {
    test('should return minutes for specific meeting', async () => {
      const response = await request(app).get('/minutes-of-meeting/meeting/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].meeting_id).toBe(1);
    });
    
    test('should return empty array for meeting with no minutes', async () => {
      const response = await request(app).get('/minutes-of-meeting/meeting/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /minutes-of-meeting/project/:projectId', () => {
    test('should return minutes for specific project', async () => {
      const response = await request(app).get('/minutes-of-meeting/project/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(mom => {
        expect(mom.project_id).toBe(1);
      });
      
      // Should be ordered by mom_id DESC
      expect(response.body[0].mom_id).toBe(2);
      expect(response.body[1].mom_id).toBe(1);
    });
    
    test('should return minutes for project 2', async () => {
      const response = await request(app).get('/minutes-of-meeting/project/2');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });
  });
  
  describe('GET /minutes-of-meeting/search', () => {
    test('should search in initial_mom content', async () => {
      const response = await request(app).get('/minutes-of-meeting/search?query=budget');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].initial_mom).toContain('Budget');
    });
    
    test('should search in mom_sending content', async () => {
      const response = await request(app).get('/minutes-of-meeting/search?query=stakeholders');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].mom_sending).toContain('stakeholders');
    });
    
    test('should be case-insensitive', async () => {
      const response = await request(app).get('/minutes-of-meeting/search?query=TECHNICAL');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].initial_mom).toContain('Technical');
    });
    
    test('should return 400 for missing query', async () => {
      const response = await request(app).get('/minutes-of-meeting/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
    
    test('should return empty array for no matches', async () => {
      const response = await request(app).get('/minutes-of-meeting/search?query=xyz123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle long text content', async () => {
      const longText = 'A'.repeat(1000);
      const mom = {
        meeting_id: 8,
        initial_mom: longText,
        mom_sending: longText,
        project_id: 1
      };
      
      const response = await request(app)
        .post('/minutes-of-meeting')
        .send(mom);
      
      expect(response.status).toBe(201);
      expect(response.body.initial_mom.length).toBe(1000);
    });
    
    test('should handle special characters in text', async () => {
      const mom = {
        meeting_id: 9,
        initial_mom: 'Discussion about "special" requirements & budget @ 50%',
        mom_sending: 'Sent via email <project@company.com>',
        project_id: 1
      };
      
      const response = await request(app)
        .post('/minutes-of-meeting')
        .send(mom);
      
      expect(response.status).toBe(201);
      expect(response.body.initial_mom).toBe(mom.initial_mom);
    });
    
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      promises.push(request(app).get('/minutes-of-meeting'));
      promises.push(request(app).get('/minutes-of-meeting/1'));
      promises.push(request(app).get('/minutes-of-meeting/meeting/1'));
      promises.push(request(app).get('/minutes-of-meeting/project/1'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
