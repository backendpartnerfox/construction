// tests/component_categories_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS component_categories (
      category_id SERIAL PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL UNIQUE,
      category_description TEXT,
      parent_category_id INT,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_category_id) REFERENCES component_categories(category_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS component_categories CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM component_categories');
  
  // Insert test data
  await pool.query(`
    INSERT INTO component_categories (category_id, category_name, category_description, parent_category_id, display_order, is_active)
    VALUES 
      (1, 'Structural', 'Structural components of the building', NULL, 1, true),
      (2, 'Finishing', 'Finishing work components', NULL, 2, true),
      (3, 'MEP', 'Mechanical, Electrical and Plumbing', NULL, 3, true),
      (4, 'Foundation', 'Foundation related components', 1, 1, true),
      (5, 'Superstructure', 'Above ground structural components', 1, 2, true),
      (6, 'Interior Finishing', 'Interior finishing works', 2, 1, true),
      (7, 'Exterior Finishing', 'Exterior finishing works', 2, 2, true),
      (8, 'Electrical', 'Electrical components', 3, 1, true),
      (9, 'Plumbing', 'Plumbing components', 3, 2, false)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('component_categories_category_id_seq', 9)");
});

describe('Component Categories API', () => {
  // Test GET all categories
  test('GET /component-categories - should return all component categories', async () => {
    const response = await request(app).get('/component-categories');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(9);
    expect(response.body[0]).toHaveProperty('category_id');
    expect(response.body[0]).toHaveProperty('category_name');
    expect(response.body[0]).toHaveProperty('display_order');
  });

  // Test GET active categories only
  test('GET /component-categories?active=true - should return only active categories', async () => {
    const response = await request(app).get('/component-categories?active=true');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(8);
    response.body.forEach(category => {
      expect(category.is_active).toBe(true);
    });
  });

  // Test GET category by ID
  test('GET /component-categories/:id - should return a specific category', async () => {
    const response = await request(app).get('/component-categories/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('category_id', 1);
    expect(response.body).toHaveProperty('category_name', 'Structural');
    expect(response.body).toHaveProperty('parent_category_id', null);
  });

  test('GET /component-categories/:id - should return 404 for non-existent category', async () => {
    const response = await request(app).get('/component-categories/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Category not found');
  });

  // Test GET parent categories
  test('GET /component-categories/parents - should return only parent categories', async () => {
    const response = await request(app).get('/component-categories/parents');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(category => {
      expect(category.parent_category_id).toBeNull();
    });
  });

  // Test GET child categories
  test('GET /component-categories/:id/children - should return child categories', async () => {
    const response = await request(app).get('/component-categories/1/children');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(category => {
      expect(category.parent_category_id).toBe(1);
    });
  });

  // Test POST new category
  test('POST /component-categories - should create a new category', async () => {
    const newCategory = {
      category_name: 'HVAC',
      category_description: 'Heating, Ventilation and Air Conditioning',
      parent_category_id: 3,
      display_order: 3,
      is_active: true
    };
    
    const response = await request(app)
      .post('/component-categories')
      .send(newCategory);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('category_id', 10);
    expect(response.body).toHaveProperty('category_name', 'HVAC');
    expect(response.body).toHaveProperty('parent_category_id', 3);
  });

  test('POST /component-categories - should return 400 for missing category name', async () => {
    const incompleteCategory = {
      category_description: 'Test description'
    };
    
    const response = await request(app)
      .post('/component-categories')
      .send(incompleteCategory);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Category name is required');
  });

  test('POST /component-categories - should return 400 for duplicate category name', async () => {
    const duplicateCategory = {
      category_name: 'Structural',
      category_description: 'Duplicate category'
    };
    
    const response = await request(app)
      .post('/component-categories')
      .send(duplicateCategory);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /component-categories - should return 404 for non-existent parent category', async () => {
    const invalidCategory = {
      category_name: 'Test Category',
      parent_category_id: 999
    };
    
    const response = await request(app)
      .post('/component-categories')
      .send(invalidCategory);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Parent category not found');
  });

  // Test PUT update category
  test('PUT /component-categories/:id - should update a category', async () => {
    const updatedData = {
      category_name: 'Structural Works',
      category_description: 'All structural components and works',
      display_order: 10,
      is_active: true
    };
    
    const response = await request(app)
      .put('/component-categories/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('category_id', 1);
    expect(response.body).toHaveProperty('category_name', 'Structural Works');
    expect(response.body).toHaveProperty('display_order', 10);
  });

  test('PUT /component-categories/:id - should return 404 for non-existent category', async () => {
    const updatedData = {
      category_name: 'Updated Name'
    };
    
    const response = await request(app)
      .put('/component-categories/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Category not found');
  });

  test('PUT /component-categories/:id - should return 400 for duplicate category name', async () => {
    const updatedData = {
      category_name: 'Finishing'
    };
    
    const response = await request(app)
      .put('/component-categories/1')
      .send(updatedData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test DELETE category
  test('DELETE /component-categories/:id - should delete a category without children', async () => {
    const response = await request(app).delete('/component-categories/9');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Category deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/component-categories/9');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /component-categories/:id - should return 400 when deleting category with children', async () => {
    const response = await request(app).delete('/component-categories/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete category with child categories');
  });

  test('DELETE /component-categories/:id - should return 404 for non-existent category', async () => {
    const response = await request(app).delete('/component-categories/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Category not found');
  });

  // Test PATCH toggle active status
  test('PATCH /component-categories/:id/toggle-active - should toggle active status', async () => {
    const response = await request(app)
      .patch('/component-categories/9/toggle-active');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_active', true);
    
    // Toggle again
    const response2 = await request(app)
      .patch('/component-categories/9/toggle-active');
    
    expect(response2.status).toBe(200);
    expect(response2.body).toHaveProperty('is_active', false);
  });

  // Test GET category tree
  test('GET /component-categories/tree - should return hierarchical category tree', async () => {
    const response = await request(app).get('/component-categories/tree');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // Only parent categories at root
    
    // Check if children are nested properly
    const structural = response.body.find(cat => cat.category_name === 'Structural');
    expect(structural).toHaveProperty('children');
    expect(structural.children.length).toBe(2);
  });

  // Test PATCH update display order
  test('PATCH /component-categories/:id/order - should update display order', async () => {
    const orderData = {
      display_order: 5
    };
    
    const response = await request(app)
      .patch('/component-categories/1/order')
      .send(orderData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('display_order', 5);
  });

  // Test GET search categories
  test('GET /component-categories/search - should search categories by name', async () => {
    const response = await request(app).get('/component-categories/search?q=finish');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3); // Finishing, Interior Finishing, Exterior Finishing
    response.body.forEach(category => {
      expect(category.category_name.toLowerCase()).toContain('finish');
    });
  });

  // Test GET category breadcrumb
  test('GET /component-categories/:id/breadcrumb - should return category breadcrumb', async () => {
    const response = await request(app).get('/component-categories/4/breadcrumb');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2); // Structural > Foundation
    expect(response.body[0].category_name).toBe('Structural');
    expect(response.body[1].category_name).toBe('Foundation');
  });
});
