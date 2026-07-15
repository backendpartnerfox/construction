// tests/client_selections_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      client_id INT,
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_category VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_choices (
      choice_option_id SERIAL PRIMARY KEY,
      item_id INT,
      display_name VARCHAR(255),
      description TEXT,
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_selections (
      selection_id SERIAL PRIMARY KEY,
      client_id INT NOT NULL,
      project_id INT NOT NULL,
      item_id INT NOT NULL,
      selected_choice_id INT NOT NULL,
      selection_date DATE DEFAULT CURRENT_DATE,
      selection_reason TEXT,
      specifications TEXT,
      quantity INT DEFAULT 1,
      color VARCHAR(100),
      size VARCHAR(100),
      finish VARCHAR(100),
      brand_preference VARCHAR(100),
      special_requirements TEXT,
      deadline_date DATE,
      is_finalized BOOLEAN DEFAULT FALSE,
      finalized_date DATE,
      approved_by INT,
      approval_date DATE,
      status VARCHAR(50) DEFAULT 'Pending',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(client_id),
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (item_id) REFERENCES items(item_id),
      FOREIGN KEY (selected_choice_id) REFERENCES item_choices(choice_option_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS client_selections CASCADE');
  await pool.query('DROP TABLE IF EXISTS item_choices CASCADE');
  await pool.query('DROP TABLE IF EXISTS items CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM client_selections');
  await pool.query('DELETE FROM item_choices');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM clients');
  
  // Insert test data
  await pool.query(`
    INSERT INTO clients (client_id, client_name)
    VALUES 
      (1, 'ABC Corporation'),
      (2, 'XYZ Industries'),
      (3, 'Tech Solutions Ltd')
  `);
  
  await pool.query(`
    INSERT INTO projects (project_id, project_name, client_id)
    VALUES 
      (1, 'Green Valley Residences', 1),
      (2, 'Tech Park Phase II', 2),
      (3, 'Serenity Villa', 3)
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category)
    VALUES 
      (1, 'Flooring', 'Finishing'),
      (2, 'Paint', 'Finishing'),
      (3, 'Doors', 'Fixtures'),
      (4, 'Windows', 'Fixtures')
  `);
  
  await pool.query(`
    INSERT INTO item_choices (choice_option_id, item_id, display_name, description)
    VALUES 
      (1, 1, 'Vitrified Tiles', 'Standard vitrified tiles'),
      (2, 1, 'Marble Flooring', 'Premium marble flooring'),
      (3, 2, 'Asian Paints Royale', 'Premium interior paint'),
      (4, 2, 'Berger Silk', 'Luxury finish paint'),
      (5, 3, 'Flush Doors', 'Standard flush doors'),
      (6, 3, 'Panel Doors', 'Decorative panel doors'),
      (7, 4, 'UPVC Windows', 'Energy efficient windows'),
      (8, 4, 'Aluminum Windows', 'Sleek aluminum windows')
  `);
  
  await pool.query(`
    INSERT INTO client_selections (
      selection_id, client_id, project_id, item_id, selected_choice_id,
      selection_date, selection_reason, specifications, quantity, color,
      size, finish, brand_preference, special_requirements, deadline_date,
      is_finalized, status, notes
    )
    VALUES 
      (1, 1, 1, 1, 2, '2024-01-15', 'Premium look required', 'Italian marble', 1000, 'White', '2x2 ft', 'Polished', 'Imported', 'Anti-slip coating', '2024-02-15', true, 'Approved', 'Client approved design'),
      (2, 1, 1, 2, 3, '2024-01-16', 'Durability', 'Washable paint', 5000, 'Off-white', NULL, 'Matt', 'Asian Paints', 'Low VOC', '2024-02-20', false, 'Pending', 'Awaiting color samples'),
      (3, 2, 2, 3, 6, '2024-01-17', 'Aesthetic appeal', 'Teak wood panels', 50, 'Natural', '7x3 ft', 'Varnished', NULL, 'Fire resistant', '2024-03-01', true, 'Approved', 'All specifications confirmed'),
      (4, 3, 3, 4, 7, '2024-01-18', 'Energy efficiency', 'Double glazed', 20, 'White', '4x5 ft', NULL, 'Fenesta', 'Mosquito mesh required', '2024-03-15', false, 'Under Review', 'Reviewing specifications')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('clients_client_id_seq', 3)");
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('items_item_id_seq', 4)");
  await pool.query("SELECT setval('item_choices_choice_option_id_seq', 8)");
  await pool.query("SELECT setval('client_selections_selection_id_seq', 4)");
});

describe('Client Selections API', () => {
  // Test GET all selections
  test('GET /client-selections - should return all client selections', async () => {
    const response = await request(app).get('/client-selections');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('selection_id');
    expect(response.body[0]).toHaveProperty('client_name');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('item_name');
    expect(response.body[0]).toHaveProperty('selected_choice_name');
  });

  // Test GET selection by ID
  test('GET /client-selections/:id - should return a specific selection', async () => {
    const response = await request(app).get('/client-selections/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selection_id', 1);
    expect(response.body).toHaveProperty('selected_choice_id', 2);
    expect(response.body).toHaveProperty('color', 'White');
    expect(response.body).toHaveProperty('finish', 'Polished');
    expect(response.body).toHaveProperty('is_finalized', true);
  });

  test('GET /client-selections/:id - should return 404 for non-existent selection', async () => {
    const response = await request(app).get('/client-selections/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Selection not found');
  });

  // Test GET selections by client
  test('GET /client-selections/client/:clientId - should return selections for a client', async () => {
    const response = await request(app).get('/client-selections/client/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(selection => {
      expect(selection.client_id).toBe(1);
    });
  });

  // Test GET selections by project
  test('GET /client-selections/project/:projectId - should return selections for a project', async () => {
    const response = await request(app).get('/client-selections/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(selection => {
      expect(selection.project_id).toBe(1);
    });
  });

  // Test POST new selection
  test('POST /client-selections - should create a new selection', async () => {
    const newSelection = {
      client_id: 1,
      project_id: 1,
      item_id: 3,
      selected_choice_id: 5,
      selection_date: '2024-01-20',
      selection_reason: 'Budget constraints',
      specifications: 'Standard flush doors with laminate',
      quantity: 25,
      color: 'Walnut',
      size: '7x3 ft',
      finish: 'Laminated',
      brand_preference: 'Greenply',
      special_requirements: 'Sound proof coating',
      deadline_date: '2024-03-30',
      status: 'Pending',
      notes: 'Client to confirm final color'
    };
    
    const response = await request(app)
      .post('/client-selections')
      .send(newSelection);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('selection_id', 5);
    expect(response.body).toHaveProperty('color', 'Walnut');
    expect(response.body).toHaveProperty('quantity', 25);
    expect(response.body).toHaveProperty('is_finalized', false);
  });

  test('POST /client-selections - should return 400 for missing required fields', async () => {
    const incompleteSelection = {
      client_id: 1,
      project_id: 1
    };
    
    const response = await request(app)
      .post('/client-selections')
      .send(incompleteSelection);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /client-selections - should return 404 for non-existent client', async () => {
    const invalidSelection = {
      client_id: 999,
      project_id: 1,
      item_id: 1,
      selected_choice_id: 1
    };
    
    const response = await request(app)
      .post('/client-selections')
      .send(invalidSelection);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Client not found');
  });

  // Test PUT update selection
  test('PUT /client-selections/:id - should update a selection', async () => {
    const updatedData = {
      color: 'Cream',
      finish: 'Semi-glossy',
      quantity: 6000,
      special_requirements: 'Low VOC and washable',
      status: 'Approved',
      is_finalized: true,
      finalized_date: '2024-01-20',
      approved_by: 1,
      approval_date: '2024-01-20'
    };
    
    const response = await request(app)
      .put('/client-selections/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selection_id', 2);
    expect(response.body).toHaveProperty('color', 'Cream');
    expect(response.body).toHaveProperty('finish', 'Semi-glossy');
    expect(response.body).toHaveProperty('is_finalized', true);
    expect(response.body).toHaveProperty('status', 'Approved');
  });

  test('PUT /client-selections/:id - should return 404 for non-existent selection', async () => {
    const updatedData = {
      color: 'Blue'
    };
    
    const response = await request(app)
      .put('/client-selections/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Selection not found');
  });

  // Test DELETE selection
  test('DELETE /client-selections/:id - should delete a selection', async () => {
    const response = await request(app).delete('/client-selections/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Selection deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/client-selections/4');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /client-selections/:id - should return 404 for non-existent selection', async () => {
    const response = await request(app).delete('/client-selections/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Selection not found');
  });

  // Test PATCH finalize selection
  test('PATCH /client-selections/:id/finalize - should finalize a selection', async () => {
    const finalizationData = {
      finalized_date: '2024-01-20',
      approved_by: 1,
      approval_date: '2024-01-20'
    };
    
    const response = await request(app)
      .patch('/client-selections/2/finalize')
      .send(finalizationData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('is_finalized', true);
    expect(response.body).toHaveProperty('status', 'Approved');
    expect(response.body).toHaveProperty('finalized_date', '2024-01-20');
  });

  // Test GET pending selections
  test('GET /client-selections/pending - should return pending selections', async () => {
    const response = await request(app).get('/client-selections/pending');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    response.body.forEach(selection => {
      expect(selection.status).toBe('Pending');
    });
  });

  // Test GET finalized selections
  test('GET /client-selections/finalized - should return finalized selections', async () => {
    const response = await request(app).get('/client-selections/finalized');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(selection => {
      expect(selection.is_finalized).toBe(true);
    });
  });

  // Test GET selections by status
  test('GET /client-selections/status/:status - should return selections by status', async () => {
    const response = await request(app).get('/client-selections/status/Approved');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(selection => {
      expect(selection.status).toBe('Approved');
    });
  });

  // Test GET selections by item
  test('GET /client-selections/item/:itemId - should return selections for an item', async () => {
    const response = await request(app).get('/client-selections/item/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].item_id).toBe(1);
  });

  // Test GET selections summary
  test('GET /client-selections/summary/:projectId - should return project selections summary', async () => {
    const response = await request(app).get('/client-selections/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_selections');
    expect(response.body).toHaveProperty('finalized_count');
    expect(response.body).toHaveProperty('pending_count');
    expect(response.body).toHaveProperty('approved_count');
    expect(response.body).toHaveProperty('category_wise_count');
  });

  // Test GET overdue selections
  test('GET /client-selections/overdue - should return overdue selections', async () => {
    // First update a selection to have past deadline
    await pool.query(`
      UPDATE client_selections 
      SET deadline_date = '2024-01-01', is_finalized = false, status = 'Pending'
      WHERE selection_id = 4
    `);
    
    const response = await request(app).get('/client-selections/overdue');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    response.body.forEach(selection => {
      expect(selection.is_finalized).toBe(false);
      expect(new Date(selection.deadline_date)).toBeLessThan(new Date());
    });
  });

  // Test PATCH update status
  test('PATCH /client-selections/:id/status - should update selection status', async () => {
    const statusData = {
      status: 'Under Review',
      notes: 'Reviewing color options with client'
    };
    
    const response = await request(app)
      .patch('/client-selections/2/status')
      .send(statusData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Under Review');
    expect(response.body).toHaveProperty('notes', 'Reviewing color options with client');
  });
});
