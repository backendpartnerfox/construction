// tests/client_choices_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      item_description TEXT,
      item_category VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_choices (
      choice_id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id),
      item_id INTEGER REFERENCES items(item_id),
      choice_value TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_by INTEGER REFERENCES employees(employee_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS client_choices');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.query('DROP TABLE IF EXISTS items');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM client_choices');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Residential Project'),
      (2, 'Commercial Project')
  `);
  
  await pool.query(`
    INSERT INTO items (item_id, item_name, item_category)
    VALUES 
      (1, 'Wall Paint', 'Finishing'),
      (2, 'Floor Tile', 'Flooring'),
      (3, 'Kitchen Counter', 'Interior')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'John', 'Doe'),
      (2, 'Jane', 'Smith')
  `);
  
  await pool.query(`
    INSERT INTO client_choices (
      choice_id, project_id, item_id, choice_value, 
      is_default, notes, created_by
    )
    VALUES 
      (1, 1, 1, 'Off White', true, 'Client preferred this color', 1),
      (2, 1, 2, 'Ceramic Tile', false, 'Selected for bathroom', 1),
      (3, 2, 1, 'Light Blue', true, 'Standard office color', 2),
      (4, 2, 3, 'Granite', false, 'For office kitchen', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('items_item_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('client_choices_choice_id_seq', 4)");
});

describe('Client Choices API', () => {
  // Test GET all choices
  test('GET /client-choices - should return all choices', async () => {
    const response = await request(app).get('/client-choices');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('choice_id', 1);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[0]).toHaveProperty('choice_value', 'Off White');
  });
  
  // Test GET choice by ID
  test('GET /client-choices/:id - should return a specific choice', async () => {
    const response = await request(app).get('/client-choices/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('item_id', 1);
    expect(response.body).toHaveProperty('choice_value', 'Off White');
    expect(response.body).toHaveProperty('is_default', true);
    expect(response.body).toHaveProperty('notes', 'Client preferred this color');
    expect(response.body).toHaveProperty('created_by', 1);
  });
  
  // Test GET choice by ID - not found
  test('GET /client-choices/:id - should return 404 for non-existent choice', async () => {
    const response = await request(app).get('/client-choices/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Client choice not found');
  });
  
  // Test POST new choice
  test('POST /client-choices - should create a new choice', async () => {
    const newChoice = {
      project_id: 1,
      item_id: 3,
      choice_value: 'Marble',
      is_default: false,
      notes: 'For kitchen counter',
      created_by: 2
    };
    
    const response = await request(app)
      .post('/client-choices')
      .send(newChoice);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('choice_id', 5); // Next ID in sequence
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('item_id', 3);
    expect(response.body).toHaveProperty('choice_value', 'Marble');
    expect(response.body).toHaveProperty('is_default', false);
    
    // Verify choice was actually created
    const allChoices = await request(app).get('/client-choices');
    expect(allChoices.body.length).toBe(5);
  });
  
  // Test POST choice - missing required fields
  test('POST /client-choices - should return 400 for missing required fields', async () => {
    const incompleteChoice = {
      project_id: 1,
      // Missing item_id
      // Missing choice_value
      is_default: false,
      created_by: 1
    };
    
    const response = await request(app)
      .post('/client-choices')
      .send(incompleteChoice);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, Item ID, and Choice Value are required');
  });
  
  // Test PUT update choice
  test('PUT /client-choices/:id - should update a choice', async () => {
    const updatedChoice = {
      project_id: 1,
      item_id: 1,
      choice_value: 'Beige', // Changed from 'Off White'
      is_default: true,
      notes: 'Updated color choice',
      created_by: 1
    };
    
    const response = await request(app)
      .put('/client-choices/1')
      .send(updatedChoice);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('choice_id', 1);
    expect(response.body).toHaveProperty('choice_value', 'Beige');
    expect(response.body).toHaveProperty('notes', 'Updated color choice');
    
    // Verify choice was actually updated
    const updatedChoiceResponse = await request(app).get('/client-choices/1');
    expect(updatedChoiceResponse.body.choice_value).toBe('Beige');
    expect(updatedChoiceResponse.body.notes).toBe('Updated color choice');
  });
  
  // Test PUT choice - not found
  test('PUT /client-choices/:id - should return 404 for non-existent choice', async () => {
    const updatedChoice = {
      project_id: 1,
      item_id: 1,
      choice_value: 'Updated Value',
      is_default: true,
      created_by: 1
    };
    
    const response = await request(app)
      .put('/client-choices/999')
      .send(updatedChoice);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Client choice not found');
  });
  
  // Test PUT choice - missing required fields
  test('PUT /client-choices/:id - should return 400 for missing required fields', async () => {
    const incompleteChoice = {
      project_id: 1,
      item_id: 1,
      // Missing choice_value
      is_default: true,
      created_by: 1
    };
    
    const response = await request(app)
      .put('/client-choices/1')
      .send(incompleteChoice);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID, Item ID, and Choice Value are required');
  });
  
  // Test GET choices by project
  test('GET /client-choices/project/:projectId - should return choices for a project', async () => {
    const response = await request(app).get('/client-choices/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.project_id === 1)).toBeTruthy();
    
    // Check specific choice_ids
    const choiceIds = response.body.map(choice => choice.choice_id).sort();
    expect(choiceIds).toEqual([1, 2]);
  });
  
  // Test GET choices by item
  test('GET /client-choices/item/:itemId - should return choices for an item', async () => {
    const response = await request(app).get('/client-choices/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.item_id === 1)).toBeTruthy();
    
    // Check specific projects
    const projectIds = response.body.map(choice => choice.project_id).sort();
    expect(projectIds).toEqual([1, 2]);
  });
  
  // Test GET choices by project and item
  test('GET /client-choices/project/:projectId/item/:itemId - should return choices for a project and item', async () => {
    const response = await request(app).get('/client-choices/project/1/item/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[0]).toHaveProperty('item_id', 1);
    expect(response.body[0]).toHaveProperty('choice_value', 'Off White');
  });
  
  // Test GET default choices
  test('GET /client-choices/default - should return default choices', async () => {
    const response = await request(app).get('/client-choices/default');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(choice => choice.is_default === true)).toBeTruthy();
    
    // Check specific choice_ids for default choices
    const choiceIds = response.body.map(choice => choice.choice_id).sort();
    expect(choiceIds).toEqual([1, 3]);
  });
});
