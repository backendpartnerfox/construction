// tests/architect_drawings_route.test.js
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
      project_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS architect_drawings (
      id SERIAL PRIMARY KEY,
      drawing_id VARCHAR(100) NOT NULL,
      drawing_type VARCHAR(100) NOT NULL,
      project_id INT NOT NULL,
      status_of_drawing VARCHAR(50) DEFAULT 'Draft',
      submit_to_client BOOLEAN DEFAULT FALSE,
      client_finalising BOOLEAN DEFAULT FALSE,
      remarks TEXT,
      datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS architect_drawings');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM architect_drawings');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Green Valley Residences'),
      (2, 'Tech Park Phase II'),
      (3, 'Serenity Villa')
  `);
  
  await pool.query(`
    INSERT INTO architect_drawings (id, drawing_id, drawing_type, project_id, status_of_drawing, submit_to_client, client_finalising, remarks)
    VALUES 
      (1, 'DRW-001', 'Floor Plan', 1, 'Draft', false, false, 'Initial draft'),
      (2, 'DRW-002', 'Elevation', 1, 'Submitted to Client', true, false, 'Submitted for review'),
      (3, 'DRW-003', 'Structural', 2, 'Finalized', true, true, 'Client approved'),
      (4, 'DRW-004', 'Floor Plan', 3, 'Draft', false, false, 'Work in progress')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 3)");
  await pool.query("SELECT setval('architect_drawings_id_seq', 4)");
});

describe('Architect Drawings API', () => {
  // Test GET all drawings
  test('GET /architect-drawings - should return all drawings with project info', async () => {
    const response = await request(app).get('/architect-drawings');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('drawing_id');
    expect(response.body[0]).toHaveProperty('drawing_type');
    expect(response.body[0]).toHaveProperty('project_id');
    expect(response.body[0]).toHaveProperty('project_name');
    expect(response.body[0]).toHaveProperty('status_of_drawing');
  });

  // Test GET drawings with filters
  test('GET /architect-drawings - should filter by project_id', async () => {
    const response = await request(app).get('/architect-drawings?project_id=1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(drawing => {
      expect(drawing.project_id).toBe(1);
    });
  });

  test('GET /architect-drawings - should filter by drawing_type', async () => {
    const response = await request(app).get('/architect-drawings?drawing_type=Floor Plan');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(drawing => {
      expect(drawing.drawing_type).toBe('Floor Plan');
    });
  });

  test('GET /architect-drawings - should filter by status', async () => {
    const response = await request(app).get('/architect-drawings?status_of_drawing=Draft');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(drawing => {
      expect(drawing.status_of_drawing).toBe('Draft');
    });
  });

  // Test GET drawing by ID
  test('GET /architect-drawings/:id - should return a specific drawing', async () => {
    const response = await request(app).get('/architect-drawings/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('drawing_id', 'DRW-001');
    expect(response.body).toHaveProperty('drawing_type', 'Floor Plan');
    expect(response.body).toHaveProperty('project_name', 'Green Valley Residences');
  });

  test('GET /architect-drawings/:id - should return 404 for non-existent drawing', async () => {
    const response = await request(app).get('/architect-drawings/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect drawing not found');
  });

  // Test GET drawings by project
  test('GET /architect-drawings/project/:projectId - should return drawings for a project', async () => {
    const response = await request(app).get('/architect-drawings/project/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(drawing => {
      expect(drawing.project_id).toBe(1);
    });
  });

  test('GET /architect-drawings/project/:projectId - should return 404 for non-existent project', async () => {
    const response = await request(app).get('/architect-drawings/project/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test POST new drawing
  test('POST /architect-drawings - should create a new drawing', async () => {
    const newDrawing = {
      drawing_id: 'DRW-005',
      drawing_type: 'Site Plan',
      project_id: 2,
      status_of_drawing: 'Draft',
      remarks: 'Initial site plan'
    };
    
    const response = await request(app)
      .post('/architect-drawings')
      .send(newDrawing);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 5);
    expect(response.body).toHaveProperty('drawing_id', 'DRW-005');
    expect(response.body).toHaveProperty('drawing_type', 'Site Plan');
    expect(response.body).toHaveProperty('submit_to_client', false);
    expect(response.body).toHaveProperty('client_finalising', false);
  });

  test('POST /architect-drawings - should return 400 for missing drawing_id', async () => {
    const incompleteDrawing = {
      drawing_type: 'Site Plan',
      project_id: 2
    };
    
    const response = await request(app)
      .post('/architect-drawings')
      .send(incompleteDrawing);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Drawing ID is required');
  });

  test('POST /architect-drawings - should return 400 for missing drawing_type', async () => {
    const incompleteDrawing = {
      drawing_id: 'DRW-005',
      project_id: 2
    };
    
    const response = await request(app)
      .post('/architect-drawings')
      .send(incompleteDrawing);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Drawing type is required');
  });

  test('POST /architect-drawings - should return 400 for missing project_id', async () => {
    const incompleteDrawing = {
      drawing_id: 'DRW-005',
      drawing_type: 'Site Plan'
    };
    
    const response = await request(app)
      .post('/architect-drawings')
      .send(incompleteDrawing);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID is required');
  });

  test('POST /architect-drawings - should return 404 for non-existent project', async () => {
    const invalidDrawing = {
      drawing_id: 'DRW-005',
      drawing_type: 'Site Plan',
      project_id: 999
    };
    
    const response = await request(app)
      .post('/architect-drawings')
      .send(invalidDrawing);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test PUT update drawing
  test('PUT /architect-drawings/:id - should update a drawing', async () => {
    const updatedData = {
      drawing_type: 'Updated Floor Plan',
      status_of_drawing: 'In Review',
      remarks: 'Updated remarks'
    };
    
    const response = await request(app)
      .put('/architect-drawings/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('drawing_type', 'Updated Floor Plan');
    expect(response.body).toHaveProperty('status_of_drawing', 'In Review');
    expect(response.body).toHaveProperty('remarks', 'Updated remarks');
  });

  test('PUT /architect-drawings/:id - should return 404 for non-existent drawing', async () => {
    const updatedData = {
      drawing_type: 'Updated Plan'
    };
    
    const response = await request(app)
      .put('/architect-drawings/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect drawing not found');
  });

  test('PUT /architect-drawings/:id - should return 404 for invalid project_id', async () => {
    const updatedData = {
      project_id: 999
    };
    
    const response = await request(app)
      .put('/architect-drawings/1')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Project not found');
  });

  // Test PATCH submit to client
  test('PATCH /architect-drawings/:id/submit-to-client - should submit drawing to client', async () => {
    const response = await request(app)
      .patch('/architect-drawings/1/submit-to-client')
      .send({ remarks: 'Submitted for client review' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('submit_to_client', true);
    expect(response.body).toHaveProperty('status_of_drawing', 'Submitted to Client');
    expect(response.body).toHaveProperty('remarks', 'Submitted for client review');
  });

  test('PATCH /architect-drawings/:id/submit-to-client - should return 404 for non-existent drawing', async () => {
    const response = await request(app)
      .patch('/architect-drawings/999/submit-to-client')
      .send({});
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect drawing not found');
  });

  // Test PATCH finalize
  test('PATCH /architect-drawings/:id/finalize - should finalize drawing', async () => {
    const response = await request(app)
      .patch('/architect-drawings/2/finalize')
      .send({ remarks: 'Client approved' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_finalising', true);
    expect(response.body).toHaveProperty('status_of_drawing', 'Finalized');
    expect(response.body).toHaveProperty('remarks', 'Client approved');
  });

  test('PATCH /architect-drawings/:id/finalize - should return 404 for non-existent drawing', async () => {
    const response = await request(app)
      .patch('/architect-drawings/999/finalize')
      .send({});
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect drawing not found');
  });

  // Test DELETE drawing
  test('DELETE /architect-drawings/:id - should delete a drawing', async () => {
    const response = await request(app).delete('/architect-drawings/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Architect drawing deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/architect-drawings/1');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /architect-drawings/:id - should return 400 for finalized drawing', async () => {
    const response = await request(app).delete('/architect-drawings/3');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete finalized drawing. Change status first.');
  });

  test('DELETE /architect-drawings/:id - should return 404 for non-existent drawing', async () => {
    const response = await request(app).delete('/architect-drawings/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect drawing not found');
  });

  // Test search by drawing ID
  test('GET /architect-drawings/search/:drawingId - should search drawings by ID', async () => {
    const response = await request(app).get('/architect-drawings/search/DRW');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    
    const searchResponse = await request(app).get('/architect-drawings/search/001');
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.length).toBe(1);
    expect(searchResponse.body[0]).toHaveProperty('drawing_id', 'DRW-001');
  });

  // Test get drawing types
  test('GET /architect-drawings/drawing-types - should return unique drawing types', async () => {
    const response = await request(app).get('/architect-drawings/drawing-types');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body).toContain('Floor Plan');
    expect(response.body).toContain('Elevation');
    expect(response.body).toContain('Structural');
  });

  // Test get statuses
  test('GET /architect-drawings/statuses - should return unique statuses', async () => {
    const response = await request(app).get('/architect-drawings/statuses');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body).toContain('Draft');
    expect(response.body).toContain('Submitted to Client');
    expect(response.body).toContain('Finalized');
  });
});
