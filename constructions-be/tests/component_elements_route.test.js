// tests/component_elements_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS components (
      component_id SERIAL PRIMARY KEY,
      component_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS elements (
      element_id SERIAL PRIMARY KEY,
      element_name VARCHAR(100) NOT NULL,
      element_category VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS component_elements (
      component_element_id SERIAL PRIMARY KEY,
      component_id INT NOT NULL,
      element_id INT NOT NULL,
      is_mandatory BOOLEAN DEFAULT TRUE,
      quantity_factor DECIMAL(10,2) DEFAULT 1.00,
      description TEXT,
      specifications TEXT,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (component_id) REFERENCES components(component_id),
      FOREIGN KEY (element_id) REFERENCES elements(element_id),
      UNIQUE(component_id, element_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS component_elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS elements CASCADE');
  await pool.query('DROP TABLE IF EXISTS components CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM component_elements');
  await pool.query('DELETE FROM elements');
  await pool.query('DELETE FROM components');
  
  // Insert test data
  await pool.query(`
    INSERT INTO components (component_id, component_name)
    VALUES 
      (1, 'Foundation Work'),
      (2, 'Structural Work'),
      (3, 'Finishing Work'),
      (4, 'Electrical Work')
  `);
  
  await pool.query(`
    INSERT INTO elements (element_id, element_name, element_category)
    VALUES 
      (1, 'Footings', 'Foundation'),
      (2, 'Foundation', 'Foundation'),
      (3, 'Columns', 'Structural'),
      (4, 'Beams', 'Structural'),
      (5, 'Slab', 'Structural'),
      (6, 'Plastering', 'Finishing'),
      (7, 'Painting', 'Finishing'),
      (8, 'Wiring', 'Electrical'),
      (9, 'Switches', 'Electrical')
  `);
  
  await pool.query(`
    INSERT INTO component_elements (
      component_element_id, component_id, element_id, is_mandatory, 
      quantity_factor, description, specifications, display_order, is_active
    )
    VALUES 
      (1, 1, 1, true, 1.00, 'Concrete footings', 'M25 grade concrete', 1, true),
      (2, 1, 2, true, 1.00, 'Foundation walls', 'Reinforced concrete', 2, true),
      (3, 2, 3, true, 1.00, 'RCC columns', 'As per structural drawing', 1, true),
      (4, 2, 4, true, 1.00, 'RCC beams', 'As per structural drawing', 2, true),
      (5, 2, 5, true, 1.00, 'RCC slab', 'As per structural drawing', 3, true),
      (6, 3, 6, true, 1.20, 'Wall plastering', '12mm thick plaster', 1, true),
      (7, 3, 7, true, 1.15, 'Interior painting', '2 coats primer + 2 coats paint', 2, true),
      (8, 4, 8, true, 1.00, 'Electrical wiring', 'FR cables', 1, false)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('components_component_id_seq', 4)");
  await pool.query("SELECT setval('elements_element_id_seq', 9)");
  await pool.query("SELECT setval('component_elements_component_element_id_seq', 8)");
});

describe('Component Elements API', () => {
  // Test GET all component elements
  test('GET /component-elements - should return all component elements', async () => {
    const response = await request(app).get('/component-elements');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(8);
    expect(response.body[0]).toHaveProperty('component_element_id');
    expect(response.body[0]).toHaveProperty('component_name');
    expect(response.body[0]).toHaveProperty('element_name');
    expect(response.body[0]).toHaveProperty('quantity_factor');
  });

  // Test GET active component elements only
  test('GET /component-elements?active=true - should return only active component elements', async () => {
    const response = await request(app).get('/component-elements?active=true');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(7);
    response.body.forEach(ce => {
      expect(ce.is_active).toBe(true);
    });
  });

  // Test GET component element by ID
  test('GET /component-elements/:id - should return a specific component element', async () => {
    const response = await request(app).get('/component-elements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('component_element_id', 1);
    expect(response.body).toHaveProperty('description', 'Concrete footings');
    expect(response.body).toHaveProperty('specifications', 'M25 grade concrete');
    expect(response.body).toHaveProperty('is_mandatory', true);
  });

  test('GET /component-elements/:id - should return 404 for non-existent component element', async () => {
    const response = await request(app).get('/component-elements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component element not found');
  });

  // Test GET elements by component
  test('GET /component-elements/component/:componentId - should return elements for a component', async () => {
    const response = await request(app).get('/component-elements/component/2');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(ce => {
      expect(ce.component_id).toBe(2);
    });
  });

  // Test GET components by element
  test('GET /component-elements/element/:elementId - should return components using an element', async () => {
    const response = await request(app).get('/component-elements/element/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].element_id).toBe(1);
  });

  // Test POST new component element
  test('POST /component-elements - should create a new component element', async () => {
    const newComponentElement = {
      component_id: 4,
      element_id: 9,
      is_mandatory: true,
      quantity_factor: 1.10,
      description: 'Electrical switches and sockets',
      specifications: 'Modular switches',
      display_order: 2,
      is_active: true
    };
    
    const response = await request(app)
      .post('/component-elements')
      .send(newComponentElement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('component_element_id', 9);
    expect(response.body).toHaveProperty('description', 'Electrical switches and sockets');
    expect(response.body).toHaveProperty('quantity_factor', '1.10');
  });

  test('POST /component-elements - should return 400 for missing required fields', async () => {
    const incompleteComponentElement = {
      description: 'Test description'
    };
    
    const response = await request(app)
      .post('/component-elements')
      .send(incompleteComponentElement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /component-elements - should return 400 for duplicate component-element pair', async () => {
    const duplicateComponentElement = {
      component_id: 1,
      element_id: 1
    };
    
    const response = await request(app)
      .post('/component-elements')
      .send(duplicateComponentElement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /component-elements - should return 404 for non-existent component', async () => {
    const invalidComponentElement = {
      component_id: 999,
      element_id: 1
    };
    
    const response = await request(app)
      .post('/component-elements')
      .send(invalidComponentElement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component not found');
  });

  test('POST /component-elements - should return 404 for non-existent element', async () => {
    const invalidComponentElement = {
      component_id: 1,
      element_id: 999
    };
    
    const response = await request(app)
      .post('/component-elements')
      .send(invalidComponentElement);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Element not found');
  });

  // Test PUT update component element
  test('PUT /component-elements/:id - should update a component element', async () => {
    const updatedData = {
      is_mandatory: false,
      quantity_factor: 1.25,
      description: 'Updated concrete footings description',
      specifications: 'M30 grade concrete',
      display_order: 10
    };
    
    const response = await request(app)
      .put('/component-elements/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('component_element_id', 1);
    expect(response.body).toHaveProperty('quantity_factor', '1.25');
    expect(response.body).toHaveProperty('specifications', 'M30 grade concrete');
    expect(response.body).toHaveProperty('is_mandatory', false);
  });

  test('PUT /component-elements/:id - should return 404 for non-existent component element', async () => {
    const updatedData = {
      description: 'Updated description'
    };
    
    const response = await request(app)
      .put('/component-elements/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component element not found');
  });

  // Test DELETE component element
  test('DELETE /component-elements/:id - should delete a component element', async () => {
    const response = await request(app).delete('/component-elements/8');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Component element deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/component-elements/8');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /component-elements/:id - should return 404 for non-existent component element', async () => {
    const response = await request(app).delete('/component-elements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Component element not found');
  });

  // Test PATCH toggle active status
  test('PATCH /component-elements/:id/toggle-active - should toggle active status', async () => {
    const response = await request(app)
      .patch('/component-elements/8/toggle-active');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_active', true);
    
    // Toggle again
    const response2 = await request(app)
      .patch('/component-elements/8/toggle-active');
    
    expect(response2.status).toBe(200);
    expect(response2.body).toHaveProperty('is_active', false);
  });

  // Test GET mandatory elements for component
  test('GET /component-elements/component/:componentId/mandatory - should return mandatory elements', async () => {
    const response = await request(app).get('/component-elements/component/2/mandatory');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(ce => {
      expect(ce.is_mandatory).toBe(true);
    });
  });

  // Test PATCH update display order
  test('PATCH /component-elements/:id/order - should update display order', async () => {
    const orderData = {
      display_order: 5
    };
    
    const response = await request(app)
      .patch('/component-elements/1/order')
      .send(orderData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('display_order', 5);
  });

  // Test GET component elements summary
  test('GET /component-elements/summary/:componentId - should return component elements summary', async () => {
    const response = await request(app).get('/component-elements/summary/2');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_elements');
    expect(response.body).toHaveProperty('mandatory_count');
    expect(response.body).toHaveProperty('optional_count');
    expect(response.body).toHaveProperty('active_count');
    expect(response.body).toHaveProperty('elements_list');
  });

  // Test bulk create component elements
  test('POST /component-elements/bulk - should create multiple component elements', async () => {
    const bulkData = {
      component_id: 4,
      elements: [
        {
          element_id: 9,
          is_mandatory: true,
          quantity_factor: 1.0,
          description: 'Switches and sockets'
        }
      ]
    };
    
    const response = await request(app)
      .post('/component-elements/bulk')
      .send(bulkData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('created_count', 1);
    expect(Array.isArray(response.body.created_elements)).toBeTruthy();
  });
});
