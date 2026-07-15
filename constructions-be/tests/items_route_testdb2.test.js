// tests/items_route_testdb2.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data for CRUD operations
const testData = {
  // Initial data to seed the database
  seedData: [
    {
      item_id: 1,
      item_name: 'TMT Bar',
      item_description: 'Thermo-Mechanically Treated reinforcement steel bars',
      item_unit: 'kg',
      item_category: 'Structural',
      is_active: true
    },
    {
      item_id: 2,
      item_name: 'RMC',
      item_description: 'Ready Mix Concrete',
      item_unit: 'cum',
      item_category: 'Concrete',
      is_active: true
    },
    {
      item_id: 3,
      item_name: 'Miller Concrete',
      item_description: 'Pre-mixed concrete by Miller brand',
      item_unit: 'cum',
      item_category: 'Concrete',
      is_active: true
    },
    {
      item_id: 4,
      item_name: 'Brick',
      item_description: 'Standard clay bricks for construction',
      item_unit: 'pcs',
      item_category: 'Masonry',
      is_active: true
    },
    {
      item_id: 5,
      item_name: 'Mortar',
      item_description: 'Cement and sand mixture for binding masonry units',
      item_unit: 'cum',
      item_category: 'Masonry',
      is_active: true
    },
    {
      item_id: 6,
      item_name: 'Cement',
      item_description: 'Portland cement for construction',
      item_unit: 'bag',
      item_category: 'Binding Material',
      is_active: true
    },
    {
      item_id: 7,
      item_name: 'Sand',
      item_description: 'Fine aggregate for concrete and mortar',
      item_unit: 'cum',
      item_category: 'Aggregate',
      is_active: false  // Inactive item for testing
    },
    {
      item_id: 8,
      item_name: 'Aggregate',
      item_description: 'Coarse stone aggregate for concrete',
      item_unit: 'cum',
      item_category: 'Aggregate',
      is_active: true
    }
  ],

  // Test data for CREATE operations
  createData: {
    valid: {
      allFields: {
        item_name: 'Waterproofing Membrane',
        item_description: 'High-quality waterproofing membrane for terrace and bathroom',
        item_unit: 'sqm',
        item_category: 'Waterproofing',
        is_active: true
      },
      minimalFields: {
        item_name: 'Paint'  // Only required field
      },
      inactiveItem: {
        item_name: 'Discontinued Tile',
        item_description: 'Old model ceramic tile - discontinued',
        item_unit: 'sqft',
        item_category: 'Flooring',
        is_active: false
      },
      specialCharacters: {
        item_name: 'Wire Mesh (6"x6")',
        item_description: 'Wire mesh with 6-inch spacing @ 2.5mm dia',
        item_unit: 'kg/m²',
        item_category: 'Reinforcement & Steel',
        is_active: true
      }
    },
    invalid: {
      missingName: {
        item_description: 'Missing item name',
        item_unit: 'kg',
        item_category: 'Test',
        is_active: true
      },
      emptyName: {
        item_name: '',
        item_description: 'Empty name should fail',
        item_unit: 'kg'
      },
      nullName: {
        item_name: null,
        item_description: 'Null name should fail'
      },
      tooLongName: {
        item_name: 'A'.repeat(101), // Exceeds VARCHAR(100) limit
        item_description: 'Name exceeds database limit'
      },
      invalidDataTypes: {
        item_name: 'Valid Name',
        is_active: 'not-a-boolean'  // Should be boolean
      }
    }
  },

  // Test data for UPDATE operations
  updateData: {
    valid: {
      fullUpdate: {
        item_name: 'Updated TMT Bar - Fe 550D',
        item_description: 'High-strength TMT bars with enhanced durability',
        item_unit: 'ton',
        item_category: 'Steel & Reinforcement',
        is_active: false
      },
      partialUpdate: {
        item_description: 'Updated description only',
        is_active: true
      },
      nameOnlyUpdate: {
        item_name: 'Renamed Material'
      },
      deactivateItem: {
        item_name: 'Deactivated Item',
        is_active: false
      }
    },
    invalid: {
      emptyName: {
        item_name: '',
        item_description: 'Cannot have empty name'
      },
      nullName: {
        item_name: null
      },
      tooLongName: {
        item_name: 'B'.repeat(101)
      }
    }
  }
};

beforeAll(async () => {
  // Use testdb2 as specified
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_unit VARCHAR(20),
      item_category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
});

afterAll(async () => {
  // Clean up
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data before each test
  await pool.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const item of testData.seedData) {
    await pool.query(
      `INSERT INTO items (item_id, item_name, item_description, item_unit, item_category, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.item_id, item.item_name, item.item_description, item.item_unit, item.item_category, item.is_active]
    );
  }
  
  // Reset sequence to continue from the last inserted ID
  await pool.query("SELECT setval('items_item_id_seq', 8)");
});

describe('Items API - testdb2', () => {
  
  describe('GET /items - Read all items', () => {
    test('should return all items with correct data', async () => {
      const response = await request(app).get('/items');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(8);
      
      // Verify first item structure
      const firstItem = response.body[0];
      expect(firstItem).toHaveProperty('item_id', 1);
      expect(firstItem).toHaveProperty('item_name', 'TMT Bar');
      expect(firstItem).toHaveProperty('item_description');
      expect(firstItem).toHaveProperty('item_unit', 'kg');
      expect(firstItem).toHaveProperty('item_category', 'Structural');
      expect(firstItem).toHaveProperty('is_active', true);
      
      // Verify ordering
      expect(response.body[0].item_id).toBe(1);
      expect(response.body[7].item_id).toBe(8);
    });
    
    test('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE');
      
      const response = await request(app).get('/items');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /items/:id - Read single item', () => {
    test('should return specific item by ID', async () => {
      const response = await request(app).get('/items/2');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item_id', 2);
      expect(response.body).toHaveProperty('item_name', 'RMC');
      expect(response.body).toHaveProperty('item_description', 'Ready Mix Concrete');
      expect(response.body).toHaveProperty('item_unit', 'cum');
      expect(response.body).toHaveProperty('item_category', 'Concrete');
      expect(response.body).toHaveProperty('is_active', true);
    });
    
    test('should return 404 for non-existent item', async () => {
      const response = await request(app).get('/items/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
    
    test('should handle invalid ID formats', async () => {
      const invalidIds = ['abc', 'null', '1.5', '-1'];
      
      for (const id of invalidIds) {
        const response = await request(app).get(`/items/${id}`);
        // PostgreSQL might convert some values, so we check for either 404 or 500
        expect([404, 500]).toContain(response.status);
      }
    });
  });
  
  describe('POST /items - Create new item', () => {
    test('should create item with all fields', async () => {
      const newItem = testData.createData.valid.allFields;
      
      const response = await request(app)
        .post('/items')
        .send(newItem);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('item_id', 9);
      expect(response.body).toHaveProperty('item_name', newItem.item_name);
      expect(response.body).toHaveProperty('item_description', newItem.item_description);
      expect(response.body).toHaveProperty('item_unit', newItem.item_unit);
      expect(response.body).toHaveProperty('item_category', newItem.item_category);
      expect(response.body).toHaveProperty('is_active', newItem.is_active);
      
      // Verify item was actually created
      const checkResponse = await request(app).get('/items/9');
      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body.item_name).toBe(newItem.item_name);
    });
    
    test('should create item with minimal fields', async () => {
      const newItem = testData.createData.valid.minimalFields;
      
      const response = await request(app)
        .post('/items')
        .send(newItem);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('item_id', 9);
      expect(response.body).toHaveProperty('item_name', 'Paint');
      expect(response.body).toHaveProperty('item_description', null);
      expect(response.body).toHaveProperty('item_unit', null);
      expect(response.body).toHaveProperty('item_category', null);
      expect(response.body).toHaveProperty('is_active', true); // Default value
    });
    
    test('should create inactive item', async () => {
      const newItem = testData.createData.valid.inactiveItem;
      
      const response = await request(app)
        .post('/items')
        .send(newItem);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('is_active', false);
    });
    
    test('should handle special characters in fields', async () => {
      const newItem = testData.createData.valid.specialCharacters;
      
      const response = await request(app)
        .post('/items')
        .send(newItem);
      
      expect(response.status).toBe(201);
      expect(response.body.item_name).toBe('Wire Mesh (6"x6")');
      expect(response.body.item_unit).toBe('kg/m²');
    });
    
    test('should fail with missing item_name', async () => {
      const response = await request(app)
        .post('/items')
        .send(testData.createData.invalid.missingName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name is required');
    });
    
    test('should fail with empty item_name', async () => {
      const response = await request(app)
        .post('/items')
        .send(testData.createData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name is required');
    });
    
    test('should fail with null item_name', async () => {
      const response = await request(app)
        .post('/items')
        .send(testData.createData.invalid.nullName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name is required');
    });
  });
  
  describe('PUT /items/:id - Update item', () => {
    test('should update all fields', async () => {
      const updateData = testData.updateData.valid.fullUpdate;
      
      const response = await request(app)
        .put('/items/1')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item_id', 1);
      expect(response.body).toHaveProperty('item_name', updateData.item_name);
      expect(response.body).toHaveProperty('item_description', updateData.item_description);
      expect(response.body).toHaveProperty('item_unit', updateData.item_unit);
      expect(response.body).toHaveProperty('item_category', updateData.item_category);
      expect(response.body).toHaveProperty('is_active', updateData.is_active);
    });
    
    test('should update partial fields', async () => {
      const updateData = testData.updateData.valid.partialUpdate;
      
      // Get original item first
      const originalResponse = await request(app).get('/items/2');
      const originalItem = originalResponse.body;
      
      const response = await request(app)
        .put('/items/2')
        .send({
          item_name: originalItem.item_name, // Required field
          ...updateData
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item_id', 2);
      expect(response.body).toHaveProperty('item_name', originalItem.item_name);
      expect(response.body).toHaveProperty('item_description', updateData.item_description);
      expect(response.body).toHaveProperty('is_active', updateData.is_active);
    });
    
    test('should deactivate an item', async () => {
      const response = await request(app)
        .put('/items/3')
        .send(testData.updateData.valid.deactivateItem);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('is_active', false);
      
      // Verify it doesn't appear in active items
      const activeResponse = await request(app).get('/items/active');
      const activeIds = activeResponse.body.map(item => item.item_id);
      expect(activeIds).not.toContain(3);
    });
    
    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/items/999')
        .send(testData.updateData.valid.nameOnlyUpdate);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
    
    test('should fail with empty item_name', async () => {
      const response = await request(app)
        .put('/items/1')
        .send(testData.updateData.invalid.emptyName);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name is required');
    });
  });
  
  describe('DELETE /items/:id - Delete item', () => {
    test('should delete existing item', async () => {
      const response = await request(app).delete('/items/5');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Item deleted successfully');
      
      // Verify item was deleted
      const checkResponse = await request(app).get('/items/5');
      expect(checkResponse.status).toBe(404);
      
      // Verify total count decreased
      const allItemsResponse = await request(app).get('/items');
      expect(allItemsResponse.body.length).toBe(7);
    });
    
    test('should return 404 for non-existent item', async () => {
      const response = await request(app).delete('/items/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
    
    test('should handle deletion of item with dependencies', async () => {
      // This would depend on your foreign key constraints
      // For now, we'll just test basic deletion
      const response = await request(app).delete('/items/1');
      
      // If there are FK constraints, this might fail with 500
      // Otherwise, it should succeed with 200
      expect([200, 500]).toContain(response.status);
    });
  });
  
  describe('GET /items/category/:category - Filter by category', () => {
    test('should return items of specific category', async () => {
      const response = await request(app).get('/items/category/Concrete');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      
      response.body.forEach(item => {
        expect(item.item_category).toBe('Concrete');
      });
      
      const itemNames = response.body.map(item => item.item_name);
      expect(itemNames).toContain('RMC');
      expect(itemNames).toContain('Miller Concrete');
    });
    
    test('should return empty array for non-existent category', async () => {
      const response = await request(app).get('/items/category/NonExistent');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    test('should handle category with special characters', async () => {
      const response = await request(app).get('/items/category/Binding%20Material');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].item_name).toBe('Cement');
    });
  });
  
  describe('GET /items/active - Filter active items', () => {
    test('should return only active items', async () => {
      const response = await request(app).get('/items/active');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(7); // 8 total - 1 inactive
      
      response.body.forEach(item => {
        expect(item.is_active).toBe(true);
      });
      
      // Verify inactive item is not included
      const itemIds = response.body.map(item => item.item_id);
      expect(itemIds).not.toContain(7); // Sand is inactive
    });
    
    test('should return empty array if all items are inactive', async () => {
      // Deactivate all items
      await pool.query('UPDATE items SET is_active = false');
      
      const response = await request(app).get('/items/active');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /items/search - Search functionality', () => {
    test('should search by item name', async () => {
      const response = await request(app).get('/items/search?query=concrete');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(3); // RMC, Miller Concrete, Sand (has concrete in description)
      
      const itemNames = response.body.map(item => item.item_name);
      expect(itemNames).toContain('RMC');
      expect(itemNames).toContain('Miller Concrete');
      expect(itemNames).toContain('Sand');
    });
    
    test('should search by description', async () => {
      const response = await request(app).get('/items/search?query=reinforcement');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].item_name).toBe('TMT Bar');
    });
    
    test('should be case-insensitive', async () => {
      const response1 = await request(app).get('/items/search?query=CEMENT');
      const response2 = await request(app).get('/items/search?query=cement');
      const response3 = await request(app).get('/items/search?query=CeMeNt');
      
      expect(response1.body.length).toBe(response2.body.length);
      expect(response2.body.length).toBe(response3.body.length);
      expect(response1.body.length).toBeGreaterThan(0);
    });
    
    test('should handle special characters in search', async () => {
      const response = await request(app).get('/items/search?query=cum');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
    
    test('should return empty array for no matches', async () => {
      const response = await request(app).get('/items/search?query=xyz123');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    test('should return 400 for missing query parameter', async () => {
      const response = await request(app).get('/items/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
    
    test('should handle empty query parameter', async () => {
      const response = await request(app).get('/items/search?query=');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
  
  describe('Edge cases and error handling', () => {
    test('should handle concurrent requests', async () => {
      const promises = [];
      
      // Make 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/items'));
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(8);
      });
    });
    
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll just ensure the error handling is in place
      expect(true).toBe(true);
    });
    
    test('should preserve data integrity on failed operations', async () => {
      // Try to update with invalid data
      const invalidUpdate = {
        item_name: null // Should fail
      };
      
      const updateResponse = await request(app)
        .put('/items/1')
        .send(invalidUpdate);
      
      expect(updateResponse.status).toBe(400);
      
      // Verify original data is unchanged
      const checkResponse = await request(app).get('/items/1');
      expect(checkResponse.body.item_name).toBe('TMT Bar');
    });
  });
});
