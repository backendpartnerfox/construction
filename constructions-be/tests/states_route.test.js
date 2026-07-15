// tests/states_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data
const testData = {
  seedData: {
    states: [
      { id: 1, name: 'Karnataka', code: 'KA' },
      { id: 2, name: 'Maharashtra', code: 'MH' },
      { id: 3, name: 'Tamil Nadu', code: 'TN' }
    ],
    cities: [
      { id: 1, name: 'Bangalore', state_id: 1 },
      { id: 2, name: 'Mysore', state_id: 1 },
      { id: 3, name: 'Mumbai', state_id: 2 }
    ]
  },
  createData: {
    valid: {
      withCode: {
        name: 'Telangana',
        code: 'TS'
      },
      withoutCode: {
        name: 'Kerala'
      }
    },
    invalid: {
      missingName: {
        code: 'AP'
      },
      emptyName: {
        name: '',
        code: 'AP'
      },
      duplicateName: {
        name: 'Karnataka',
        code: 'KA2'
      }
    }
  },
  updateData: {
    valid: {
      withCode: {
        name: 'Updated Karnataka',
        code: 'UK'
      },
      withoutCode: {
        name: 'Updated State'
      }
    },
    invalid: {
      missingName: {
        code: 'XX'
      },
      duplicateName: {
        name: 'Maharashtra',
        code: 'MH2'
      }
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS states (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      code VARCHAR(10),
      country_id INT
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      state_id INT,
      FOREIGN KEY (state_id) REFERENCES states(id)
    )
  `);
});

afterAll(async () => {
  // Clean up
  await pool.query('DROP TABLE IF EXISTS cities CASCADE');
  await pool.query('DROP TABLE IF EXISTS states CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data
  await pool.query('TRUNCATE TABLE cities, states RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const state of testData.seedData.states) {
    await pool.query(
      'INSERT INTO states (id, name, code) VALUES ($1, $2, $3)',
      [state.id, state.name, state.code]
    );
  }
  
  for (const city of testData.seedData.cities) {
    await pool.query(
      'INSERT INTO cities (id, name, state_id) VALUES ($1, $2, $3)',
      [city.id, city.name, city.state_id]
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('states_id_seq', 3)");
  await pool.query("SELECT setval('cities_id_seq', 3)");
});

describe('States API', () => {
  
  describe('GET /states', () => {
    test('should return all states ordered by name', async () => {
      const response = await request(app).get('/states');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(3);
      
      // Check ordering
      expect(response.body[0].name).toBe('Karnataka');
      expect(response.body[1].name).toBe('Maharashtra');
      expect(response.body[2].name).toBe('Tamil Nadu');
      
      // Check structure
      const firstState = response.body[0];
      expect(firstState).toHaveProperty('id');
      expect(firstState).toHaveProperty('name');
      expect(firstState).toHaveProperty('code');
    });
    
    test('should return empty array when no states exist', async () => {
      await pool.query('TRUNCATE TABLE cities, states RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/states');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /states/:id', () => {
    test('should return specific state by ID', async () => {
      const response = await request(app).get('/states/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'Karnataka');
      expect(response.body).toHaveProperty('code', 'KA');
    });
    
    test('should return 404 for non-existent state', async () => {
      const response = await request(app).get('/states/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'State not found');
    });
  });
  
  describe('POST /states', () => {
    test('should create state with code', async () => {
      const response = await request(app)
        .post('/states')
        .send(testData.createData.valid.withCode);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 4);
      expect(response.body).toHaveProperty('name', 'Telangana');
      expect(response.body).toHaveProperty('code', 'TS');
    });
    
    test('should create state without code', async () => {
      const response = await request(app)
        .post('/states')
        .send(testData.createData.valid.withoutCode);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 4);
      expect(response.body).toHaveProperty('name', 'Kerala');
      expect(response.body).toHaveProperty('code', null);
    });
    
    test('should fail with missing name', async () => {
      const response = await request(app)
        .post('/states')
        .send(testData.createData.invalid.missingName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'State name is required');
    });
    
    test('should fail with empty name', async () => {
      const response = await request(app)
        .post('/states')
        .send(testData.createData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'State name is required');
    });
    
    test('should fail with duplicate name', async () => {
      const response = await request(app)
        .post('/states')
        .send(testData.createData.invalid.duplicateName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'State with this name already exists');
    });
  });
  
  describe('PUT /states/:id', () => {
    test('should update state with all fields', async () => {
      const response = await request(app)
        .put('/states/1')
        .send(testData.updateData.valid.withCode);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'Updated Karnataka');
      expect(response.body).toHaveProperty('code', 'UK');
    });
    
    test('should update state name only', async () => {
      const response = await request(app)
        .put('/states/2')
        .send(testData.updateData.valid.withoutCode);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).toHaveProperty('name', 'Updated State');
      expect(response.body).toHaveProperty('code', null);
    });
    
    test('should fail with missing name', async () => {
      const response = await request(app)
        .put('/states/1')
        .send(testData.updateData.invalid.missingName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'State name is required');
    });
    
    test('should fail with duplicate name', async () => {
      const response = await request(app)
        .put('/states/1')
        .send(testData.updateData.invalid.duplicateName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'State with this name already exists');
    });
    
    test('should return 404 for non-existent state', async () => {
      const response = await request(app)
        .put('/states/999')
        .send(testData.updateData.valid.withCode);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'State not found');
    });
  });
  
  describe('DELETE /states/:id', () => {
    test('should delete state without cities', async () => {
      // Create a state without cities
      const createResponse = await request(app)
        .post('/states')
        .send({ name: 'Delete Me State', code: 'DM' });
      const stateId = createResponse.body.id;
      
      const response = await request(app).delete(`/states/${stateId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'State deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get(`/states/${stateId}`);
      expect(checkResponse.status).toBe(404);
    });
    
    test('should fail to delete state with cities', async () => {
      const response = await request(app).delete('/states/1');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 
        'Cannot delete state because it has associated cities. Delete the cities first.');
    });
    
    test('should return 404 for non-existent state', async () => {
      const response = await request(app).delete('/states/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'State not found');
    });
  });
  
  describe('GET /states/:id/cities', () => {
    test('should return cities for a state', async () => {
      const response = await request(app).get('/states/1/cities');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      
      // Check ordering
      expect(response.body[0].name).toBe('Bangalore');
      expect(response.body[1].name).toBe('Mysore');
      
      // Check all cities belong to the state
      response.body.forEach(city => {
        expect(city.state_id).toBe(1);
      });
    });
    
    test('should return empty array for state with no cities', async () => {
      const response = await request(app).get('/states/3/cities');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    test('should return 404 for non-existent state', async () => {
      const response = await request(app).get('/states/999/cities');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'State not found');
    });
  });
  
  describe('Edge cases', () => {
    test('should handle state with very long name', async () => {
      const longName = 'A'.repeat(255); // Maximum VARCHAR length
      
      const response = await request(app)
        .post('/states')
        .send({ name: longName, code: 'LN' });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe(longName);
    });
    
    test('should handle concurrent requests', async () => {
      const promises = [];
      
      // Make 5 concurrent GET requests
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/states'));
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
      });
    });
  });
});
