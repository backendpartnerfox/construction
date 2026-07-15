// tests/enquiry_sources_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for enquiry sources
const testData = {
  seedData: [
    {
      source_id: 1,
      source_name: 'Website',
      source_type: 'Online',
      is_active: true
    },
    {
      source_id: 2,
      source_name: 'Social Media',
      source_type: 'Online',
      is_active: true
    },
    {
      source_id: 3,
      source_name: 'Referral',
      source_type: 'Personal',
      is_active: true
    },
    {
      source_id: 4,
      source_name: 'Trade Show',
      source_type: 'Event',
      is_active: false
    },
    {
      source_id: 5,
      source_name: 'Cold Call',
      source_type: 'Direct',
      is_active: true
    }
  ],

  createData: {
    valid: {
      complete: {
        source_name: 'Email Campaign',
        source_type: 'Marketing',
        is_active: true
      },
      minimal: {
        source_name: 'Walk-in'
      },
      inactive: {
        source_name: 'Old Campaign',
        source_type: 'Marketing',
        is_active: false
      },
      withNullType: {
        source_name: 'Unknown Source',
        source_type: null,
        is_active: true
      }
    },
    invalid: {
      missingName: {
        source_type: 'Online',
        is_active: true
      },
      emptyName: {
        source_name: '',
        source_type: 'Online'
      },
      nullName: {
        source_name: null,
        source_type: 'Test'
      }
    }
  },

  updateData: {
    valid: {
      updateName: {
        source_name: 'Updated Website',
        source_type: 'Online',
        is_active: true
      },
      updateType: {
        source_name: 'Social Media',
        source_type: 'Digital Marketing',
        is_active: true
      },
      deactivate: {
        source_name: 'Referral',
        source_type: 'Personal',
        is_active: false
      },
      reactivate: {
        source_name: 'Trade Show',
        source_type: 'Event',
        is_active: true
      }
    },
    invalid: {
      emptyName: {
        source_name: '',
        source_type: 'Test'
      },
      missingName: {
        source_type: 'Online',
        is_active: true
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create enquiry_sources table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_sources (
      source_id SERIAL PRIMARY KEY,
      source_name VARCHAR(100) NOT NULL,
      source_type VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_enquiry_sources_type ON enquiry_sources(source_type);
    CREATE INDEX IF NOT EXISTS idx_enquiry_sources_active ON enquiry_sources(is_active);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS enquiry_sources CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE enquiry_sources RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const source of testData.seedData) {
    await pool.query(
      'INSERT INTO enquiry_sources (source_id, source_name, source_type, is_active) VALUES ($1, $2, $3, $4)',
      [source.source_id, source.source_name, source.source_type, source.is_active]
    );
  }
  
  await pool.query("SELECT setval('enquiry_sources_source_id_seq', 5)");
});

describe('Enquiry Sources API', () => {
  
  describe('GET /enquiry_sources', () => {
    test('should return all enquiry sources', async () => {
      const response = await request(app).get('/enquiry_sources');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(5);
      
      // Check structure
      const source = response.body[0];
      expect(source).toHaveProperty('source_id');
      expect(source).toHaveProperty('source_name');
      expect(source).toHaveProperty('source_type');
      expect(source).toHaveProperty('is_active');
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE enquiry_sources RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/enquiry_sources');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /enquiry_sources/:id', () => {
    test('should return specific enquiry source', async () => {
      const response = await request(app).get('/enquiry_sources/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        source_id: 1,
        source_name: 'Website',
        source_type: 'Online',
        is_active: true
      });
    });
    
    test('should return 404 for non-existent source', async () => {
      const response = await request(app).get('/enquiry_sources/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Enquiry source not found');
    });
  });
  
  describe('POST /enquiry_sources', () => {
    test('should create source with all fields', async () => {
      const newSource = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/enquiry_sources')
        .send(newSource);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        source_id: 6,
        ...newSource
      });
      
      // Verify creation
      const checkResponse = await request(app).get('/enquiry_sources/6');
      expect(checkResponse.status).toBe(200);
    });
    
    test('should create source with minimal fields', async () => {
      const newSource = testData.createData.valid.minimal;
      
      const response = await request(app)
        .post('/enquiry_sources')
        .send(newSource);
      
      expect(response.status).toBe(201);
      expect(response.body.source_name).toBe('Walk-in');
      expect(response.body.source_type).toBeNull();
      expect(response.body.is_active).toBe(true); // Default value
    });
    
    test('should create inactive source', async () => {
      const newSource = testData.createData.valid.inactive;
      
      const response = await request(app)
        .post('/enquiry_sources')
        .send(newSource);
      
      expect(response.status).toBe(201);
      expect(response.body.is_active).toBe(false);
    });
    
    test('should handle null source_type', async () => {
      const newSource = testData.createData.valid.withNullType;
      
      const response = await request(app)
        .post('/enquiry_sources')
        .send(newSource);
      
      expect(response.status).toBe(201);
      expect(response.body.source_type).toBeNull();
    });
    
    test('should fail without source_name', async () => {
      const response = await request(app)
        .post('/enquiry_sources')
        .send(testData.createData.invalid.missingName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Source name is required');
    });
    
    test('should fail with empty source_name', async () => {
      const response = await request(app)
        .post('/enquiry_sources')
        .send(testData.createData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Source name is required');
    });
  });
  
  describe('PUT /enquiry_sources/:id', () => {
    test('should update source name', async () => {
      const response = await request(app)
        .put('/enquiry_sources/1')
        .send(testData.updateData.valid.updateName);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        source_id: 1,
        source_name: 'Updated Website',
        source_type: 'Online',
        is_active: true
      });
    });
    
    test('should update source type', async () => {
      const response = await request(app)
        .put('/enquiry_sources/2')
        .send(testData.updateData.valid.updateType);
      
      expect(response.status).toBe(200);
      expect(response.body.source_type).toBe('Digital Marketing');
    });
    
    test('should deactivate source', async () => {
      const response = await request(app)
        .put('/enquiry_sources/3')
        .send(testData.updateData.valid.deactivate);
      
      expect(response.status).toBe(200);
      expect(response.body.is_active).toBe(false);
    });
    
    test('should reactivate source', async () => {
      const response = await request(app)
        .put('/enquiry_sources/4')
        .send(testData.updateData.valid.reactivate);
      
      expect(response.status).toBe(200);
      expect(response.body.is_active).toBe(true);
    });
    
    test('should return 404 for non-existent source', async () => {
      const response = await request(app)
        .put('/enquiry_sources/999')
        .send(testData.updateData.valid.updateName);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Enquiry source not found');
    });
    
    test('should fail with empty name', async () => {
      const response = await request(app)
        .put('/enquiry_sources/1')
        .send(testData.updateData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Source name is required');
    });
  });
  
  describe('DELETE /enquiry_sources/:id', () => {
    test('should delete existing source', async () => {
      const response = await request(app).delete('/enquiry_sources/5');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Enquiry source deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/enquiry_sources/5');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent source', async () => {
      const response = await request(app).delete('/enquiry_sources/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Enquiry source not found');
    });
  });
  
  describe('GET /enquiry_sources/type/:type', () => {
    test('should return sources by type', async () => {
      const response = await request(app).get('/enquiry_sources/type/Online');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      
      response.body.forEach(source => {
        expect(source.source_type).toBe('Online');
      });
    });
    
    test('should return empty array for non-existent type', async () => {
      const response = await request(app).get('/enquiry_sources/type/NonExistent');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
    
    test('should be case-sensitive', async () => {
      const response1 = await request(app).get('/enquiry_sources/type/online');
      const response2 = await request(app).get('/enquiry_sources/type/Online');
      
      expect(response1.body.length).toBe(0); // lowercase
      expect(response2.body.length).toBe(2); // proper case
    });
  });
  
  describe('GET /enquiry_sources/active', () => {
    test('should return only active sources', async () => {
      const response = await request(app).get('/enquiry_sources/active');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(4); // All except Trade Show
      
      response.body.forEach(source => {
        expect(source.is_active).toBe(true);
      });
      
      // Verify inactive source is not included
      const names = response.body.map(s => s.source_name);
      expect(names).not.toContain('Trade Show');
    });
    
    test('should return empty array if all inactive', async () => {
      // Deactivate all sources
      await pool.query('UPDATE enquiry_sources SET is_active = false');
      
      const response = await request(app).get('/enquiry_sources/active');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      promises.push(request(app).get('/enquiry_sources'));
      promises.push(request(app).get('/enquiry_sources/1'));
      promises.push(request(app).get('/enquiry_sources/type/Online'));
      promises.push(request(app).get('/enquiry_sources/active'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
    
    test('should handle special characters in source name', async () => {
      const source = {
        source_name: 'Test & Special "Source" <Type>',
        source_type: 'Special @#$%^&*()',
        is_active: true
      };
      
      const response = await request(app)
        .post('/enquiry_sources')
        .send(source);
      
      expect(response.status).toBe(201);
      expect(response.body.source_name).toBe(source.source_name);
      expect(response.body.source_type).toBe(source.source_type);
    });
    
    test('should handle boolean conversion correctly', async () => {
      const booleanTests = [
        { is_active: true, expected: true },
        { is_active: false, expected: false },
        { is_active: 'true', expected: true },
        { is_active: 'false', expected: false },
        { is_active: 1, expected: true },
        { is_active: 0, expected: false },
        { is_active: null, expected: true }, // Default to true
        { is_active: undefined, expected: true } // Default to true
      ];
      
      for (let i = 0; i < booleanTests.length; i++) {
        const test = booleanTests[i];
        const response = await request(app)
          .post('/enquiry_sources')
          .send({
            source_name: `Boolean Test ${i}`,
            is_active: test.is_active
          });
        
        expect(response.status).toBe(201);
        expect(response.body.is_active).toBe(test.expected);
      }
    });
  });
  
  describe('Route ordering and precedence', () => {
    test('should correctly route to /enquiry_sources/active (not /enquiry_sources/:id)', async () => {
      const response = await request(app).get('/enquiry_sources/active');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // Should not try to find source with id 'active'
    });
    
    test('should correctly route to /enquiry_sources/type/:type', async () => {
      const response = await request(app).get('/enquiry_sources/type/Online');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // Should not try to find source with id 'type'
    });
  });
});
