// tests/enquiry_status_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for enquiry status
const testData = {
  seedData: [
    {
      status_id: 1,
      status_name: 'New',
      status_order: 1,
      color_code: '#0066CC',
      is_active: true
    },
    {
      status_id: 2,
      status_name: 'In Progress',
      status_order: 2,
      color_code: '#FFA500',
      is_active: true
    },
    {
      status_id: 3,
      status_name: 'Follow Up',
      status_order: 3,
      color_code: '#FFD700',
      is_active: true
    },
    {
      status_id: 4,
      status_name: 'Converted',
      status_order: 4,
      color_code: '#00CC00',
      is_active: true
    },
    {
      status_id: 5,
      status_name: 'Lost',
      status_order: 5,
      color_code: '#CC0000',
      is_active: false
    }
  ],

  createData: {
    valid: {
      complete: {
        status_name: 'On Hold',
        status_order: 6,
        color_code: '#808080',
        is_active: true
      },
      minimal: {
        status_name: 'Pending'
      },
      withoutColor: {
        status_name: 'Review',
        status_order: 7,
        color_code: null,
        is_active: true
      },
      inactive: {
        status_name: 'Cancelled',
        status_order: 8,
        color_code: '#000000',
        is_active: false
      }
    },
    invalid: {
      missingName: {
        status_order: 9,
        color_code: '#123456',
        is_active: true
      },
      emptyName: {
        status_name: '',
        status_order: 10
      },
      nullName: {
        status_name: null,
        color_code: '#654321'
      }
    }
  },

  updateData: {
    valid: {
      updateName: {
        status_name: 'Updated New',
        status_order: 1,
        color_code: '#0066CC',
        is_active: true
      },
      updateOrder: {
        status_name: 'In Progress',
        status_order: 10,
        color_code: '#FFA500',
        is_active: true
      },
      updateColor: {
        status_name: 'Follow Up',
        status_order: 3,
        color_code: '#FF69B4',
        is_active: true
      },
      deactivate: {
        status_name: 'Converted',
        status_order: 4,
        color_code: '#00CC00',
        is_active: false
      }
    },
    invalid: {
      emptyName: {
        status_name: '',
        status_order: 1
      },
      missingName: {
        status_order: 2,
        color_code: '#000000'
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create enquiry_status table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_status (
      status_id SERIAL PRIMARY KEY,
      status_name VARCHAR(100) NOT NULL,
      status_order INTEGER,
      color_code VARCHAR(20),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_enquiry_status_order ON enquiry_status(status_order);
    CREATE INDEX IF NOT EXISTS idx_enquiry_status_active ON enquiry_status(is_active);
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS enquiry_status CASCADE');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE enquiry_status RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const status of testData.seedData) {
    await pool.query(
      'INSERT INTO enquiry_status (status_id, status_name, status_order, color_code, is_active) VALUES ($1, $2, $3, $4, $5)',
      [status.status_id, status.status_name, status.status_order, status.color_code, status.is_active]
    );
  }
  
  await pool.query("SELECT setval('enquiry_status_status_id_seq', 5)");
});

describe('Enquiry Status API', () => {
  
  describe('GET /enquiry_status', () => {
    test('should return all status ordered by status_order', async () => {
      const response = await request(app).get('/enquiry_status');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(5);
      
      // Check ordering by status_order
      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].status_order).toBeLessThanOrEqual(response.body[i + 1].status_order);
      }
      
      // Check structure
      const status = response.body[0];
      expect(status).toHaveProperty('status_id');
      expect(status).toHaveProperty('status_name');
      expect(status).toHaveProperty('status_order');
      expect(status).toHaveProperty('color_code');
      expect(status).toHaveProperty('is_active');
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE enquiry_status RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/enquiry_status');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /enquiry_status/:id', () => {
    test('should return specific status', async () => {
      const response = await request(app).get('/enquiry_status/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status_id: 1,
        status_name: 'New',
        status_order: 1,
        color_code: '#0066CC',
        is_active: true
      });
    });
    
    test('should return 404 for non-existent status', async () => {
      const response = await request(app).get('/enquiry_status/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Enquiry status not found');
    });
  });
  
  describe('POST /enquiry_status', () => {
    test('should create status with all fields', async () => {
      const newStatus = testData.createData.valid.complete;
      
      const response = await request(app)
        .post('/enquiry_status')
        .send(newStatus);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status_id: 6,
        ...newStatus
      });
      
      // Verify creation
      const checkResponse = await request(app).get('/enquiry_status/6');
      expect(checkResponse.status).toBe(200);
    });
    
    test('should create status with minimal fields', async () => {
      const newStatus = testData.createData.valid.minimal;
      
      const response = await request(app)
        .post('/enquiry_status')
        .send(newStatus);
      
      expect(response.status).toBe(201);
      expect(response.body.status_name).toBe('Pending');
      expect(response.body.status_order).toBeNull();
      expect(response.body.color_code).toBeNull();
      expect(response.body.is_active).toBe(true); // Default value
    });
    
    test('should create status with null color_code', async () => {
      const newStatus = testData.createData.valid.withoutColor;
      
      const response = await request(app)
        .post('/enquiry_status')
        .send(newStatus);
      
      expect(response.status).toBe(201);
      expect(response.body.color_code).toBeNull();
    });
    
    test('should create inactive status', async () => {
      const newStatus = testData.createData.valid.inactive;
      
      const response = await request(app)
        .post('/enquiry_status')
        .send(newStatus);
      
      expect(response.status).toBe(201);
      expect(response.body.is_active).toBe(false);
    });
    
    test('should fail without status_name', async () => {
      const response = await request(app)
        .post('/enquiry_status')
        .send(testData.createData.invalid.missingName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Status name is required');
    });
    
    test('should fail with empty status_name', async () => {
      const response = await request(app)
        .post('/enquiry_status')
        .send(testData.createData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Status name is required');
    });
  });
  
  describe('PUT /enquiry_status/:id', () => {
    test('should update status name', async () => {
      const response = await request(app)
        .put('/enquiry_status/1')
        .send(testData.updateData.valid.updateName);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status_id: 1,
        status_name: 'Updated New'
      });
    });
    
    test('should update status order', async () => {
      const response = await request(app)
        .put('/enquiry_status/2')
        .send(testData.updateData.valid.updateOrder);
      
      expect(response.status).toBe(200);
      expect(response.body.status_order).toBe(10);
    });
    
    test('should update color code', async () => {
      const response = await request(app)
        .put('/enquiry_status/3')
        .send(testData.updateData.valid.updateColor);
      
      expect(response.status).toBe(200);
      expect(response.body.color_code).toBe('#FF69B4');
    });
    
    test('should deactivate status', async () => {
      const response = await request(app)
        .put('/enquiry_status/4')
        .send(testData.updateData.valid.deactivate);
      
      expect(response.status).toBe(200);
      expect(response.body.is_active).toBe(false);
    });
    
    test('should return 404 for non-existent status', async () => {
      const response = await request(app)
        .put('/enquiry_status/999')
        .send(testData.updateData.valid.updateName);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Enquiry status not found');
    });
    
    test('should fail with empty name', async () => {
      const response = await request(app)
        .put('/enquiry_status/1')
        .send(testData.updateData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Status name is required');
    });
  });
  
  describe('DELETE /enquiry_status/:id', () => {
    test('should delete existing status', async () => {
      const response = await request(app).delete('/enquiry_status/5');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Enquiry status deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/enquiry_status/5');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent status', async () => {
      const response = await request(app).delete('/enquiry_status/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Enquiry status not found');
    });
  });
  
  describe('GET /enquiry_status/active', () => {
    test('should return only active status ordered by status_order', async () => {
      const response = await request(app).get('/enquiry_status/active');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(4); // All except 'Lost'
      
      response.body.forEach(status => {
        expect(status.is_active).toBe(true);
      });
      
      // Should be ordered by status_order
      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].status_order).toBeLessThanOrEqual(response.body[i + 1].status_order);
      }
      
      // Verify inactive status is not included
      const names = response.body.map(s => s.status_name);
      expect(names).not.toContain('Lost');
    });
    
    test('should return empty array if all inactive', async () => {
      // Deactivate all status
      await pool.query('UPDATE enquiry_status SET is_active = false');
      
      const response = await request(app).get('/enquiry_status/active');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
  
  describe('GET /enquiry_status/order/:order', () => {
    test('should return status by order', async () => {
      const response = await request(app).get('/enquiry_status/order/2');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status_order).toBe(2);
      expect(response.body[0].status_name).toBe('In Progress');
    });
    
    test('should return empty array for non-existent order', async () => {
      const response = await request(app).get('/enquiry_status/order/999');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
    
    test('should handle multiple status with same order', async () => {
      // Add another status with order 1
      await pool.query(
        "INSERT INTO enquiry_status (status_name, status_order, is_active) VALUES ('Duplicate Order', 1, true)"
      );
      
      const response = await request(app).get('/enquiry_status/order/1');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach(status => {
        expect(status.status_order).toBe(1);
      });
    });
  });
  
  describe('Edge cases', () => {
    test('should handle hex color codes correctly', async () => {
      const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#123ABC'];
      
      for (let i = 0; i < colors.length; i++) {
        const status = {
          status_name: `Color Test ${i}`,
          status_order: 20 + i,
          color_code: colors[i],
          is_active: true
        };
        
        const response = await request(app)
          .post('/enquiry_status')
          .send(status);
        
        expect(response.status).toBe(201);
        expect(response.body.color_code).toBe(colors[i]);
      }
    });
    
    test('should handle invalid color codes', async () => {
      const status = {
        status_name: 'Invalid Color',
        status_order: 30,
        color_code: 'not-a-color',
        is_active: true
      };
      
      const response = await request(app)
        .post('/enquiry_status')
        .send(status);
      
      // Should still accept it as it's just a string
      expect(response.status).toBe(201);
      expect(response.body.color_code).toBe('not-a-color');
    });
    
    test('should handle null status_order', async () => {
      const status = {
        status_name: 'No Order',
        status_order: null,
        color_code: '#999999',
        is_active: true
      };
      
      const response = await request(app)
        .post('/enquiry_status')
        .send(status);
      
      expect(response.status).toBe(201);
      expect(response.body.status_order).toBeNull();
    });
    
    test('should handle concurrent operations', async () => {
      const promises = [];
      
      promises.push(request(app).get('/enquiry_status'));
      promises.push(request(app).get('/enquiry_status/1'));
      promises.push(request(app).get('/enquiry_status/active'));
      promises.push(request(app).get('/enquiry_status/order/1'));
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Route ordering and precedence', () => {
    test('should correctly route to /enquiry_status/active (not /enquiry_status/:id)', async () => {
      const response = await request(app).get('/enquiry_status/active');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // Should not try to find status with id 'active'
    });
    
    test('should correctly route to /enquiry_status/order/:order', async () => {
      const response = await request(app).get('/enquiry_status/order/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // Should not try to find status with id 'order'
    });
  });
});
