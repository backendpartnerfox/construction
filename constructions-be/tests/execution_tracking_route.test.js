// tests/execution_tracking_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS execution_tracking (
      execution_id SERIAL PRIMARY KEY,
      work_package_id INT NOT NULL,
      execution_date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      progress_percentage DECIMAL(5,2),
      status VARCHAR(50) NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold', 'Delayed')),
      work_description TEXT,
      issues_faced TEXT,
      resolution TEXT,
      materials_used JSONB,
      labor_count INT,
      supervisor_id INT,
      quality_check_done BOOLEAN DEFAULT FALSE,
      quality_check_notes TEXT,
      photos_path VARCHAR(255),
      created_by INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      updated_at TIMESTAMP WITH TIME ZONE
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS execution_tracking CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM execution_tracking');
  
  // Insert test data
  await pool.query(`
    INSERT INTO execution_tracking (execution_id, work_package_id, execution_date, status, progress_percentage, work_description, labor_count, supervisor_id, quality_check_done)
    VALUES 
      (1, 1, '2024-01-15', 'In Progress', 50.00, 'Foundation work started', 10, 5, true),
      (2, 1, '2024-01-16', 'In Progress', 75.00, 'Foundation work continued', 12, 5, true),
      (3, 2, '2024-01-15', 'Completed', 100.00, 'Site preparation completed', 8, 6, false)
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('execution_tracking_execution_id_seq', 3)");
});

describe('Execution Tracking API', () => {
  // Test GET all execution tracking records
  test('GET /execution-tracking - should return all execution tracking records', async () => {
    const response = await request(app).get('/execution-tracking');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('execution_id');
    expect(response.body[0]).toHaveProperty('work_package_id');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test GET with filters
  test('GET /execution-tracking - should filter by work_package_id', async () => {
    const response = await request(app).get('/execution-tracking?work_package_id=1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(record => {
      expect(record.work_package_id).toBe(1);
    });
  });
  
  test('GET /execution-tracking - should filter by status', async () => {
    const response = await request(app).get('/execution-tracking?status=Completed');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].status).toBe('Completed');
  });
  
  test('GET /execution-tracking - should filter by execution_date', async () => {
    const response = await request(app).get('/execution-tracking?execution_date=2024-01-15');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });
  
  test('GET /execution-tracking - should filter by supervisor_id', async () => {
    const response = await request(app).get('/execution-tracking?supervisor_id=5');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(record => {
      expect(record.supervisor_id).toBe(5);
    });
  });
  
  // Test GET by ID
  test('GET /execution-tracking/:id - should return specific execution tracking record', async () => {
    const response = await request(app).get('/execution-tracking/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('execution_id', 1);
    expect(response.body).toHaveProperty('work_package_id', 1);
    expect(response.body).toHaveProperty('work_description', 'Foundation work started');
  });
  
  // Test GET by ID - not found
  test('GET /execution-tracking/:id - should return 404 for non-existent record', async () => {
    const response = await request(app).get('/execution-tracking/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Execution tracking record not found');
  });
  
  // Test POST new execution tracking record
  test('POST /execution-tracking - should create new execution tracking record', async () => {
    const newRecord = {
      work_package_id: 3,
      execution_date: '2024-01-17',
      start_time: '09:00:00',
      end_time: '17:00:00',
      progress_percentage: 25.00,
      status: 'In Progress',
      work_description: 'Started excavation work',
      labor_count: 15,
      supervisor_id: 7,
      quality_check_done: true,
      quality_check_notes: 'Depth measurements verified',
      materials_used: { excavator: '1 unit', diesel: '50 liters' },
      created_by: 1
    };
    
    const response = await request(app)
      .post('/execution-tracking')
      .send(newRecord);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('execution_id', 4);
    expect(response.body).toHaveProperty('work_package_id', 3);
    expect(response.body).toHaveProperty('status', 'In Progress');
    expect(response.body).toHaveProperty('progress_percentage', '25.00');
    expect(response.body).toHaveProperty('materials_used');
  });
  
  // Test POST - missing required fields
  test('POST /execution-tracking - should return 400 for missing required fields', async () => {
    const incompleteRecord = {
      work_package_id: 3,
      // missing execution_date and status
    };
    
    const response = await request(app)
      .post('/execution-tracking')
      .send(incompleteRecord);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'work_package_id, execution_date, and status are required');
  });
  
  // Test PUT update execution tracking record
  test('PUT /execution-tracking/:id - should update execution tracking record', async () => {
    const updatedData = {
      work_package_id: 1,
      execution_date: '2024-01-15',
      status: 'Completed',
      progress_percentage: 100.00,
      work_description: 'Foundation work completed',
      end_time: '18:00:00',
      issues_faced: 'Minor delay due to material delivery',
      resolution: 'Worked extra hour to complete',
      updated_by: 2
    };
    
    const response = await request(app)
      .put('/execution-tracking/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('execution_id', 1);
    expect(response.body).toHaveProperty('status', 'Completed');
    expect(response.body).toHaveProperty('progress_percentage', '100.00');
    expect(response.body).toHaveProperty('issues_faced', 'Minor delay due to material delivery');
  });
  
  // Test PUT - not found
  test('PUT /execution-tracking/:id - should return 404 for non-existent record', async () => {
    const updatedData = {
      work_package_id: 1,
      execution_date: '2024-01-15',
      status: 'Completed'
    };
    
    const response = await request(app)
      .put('/execution-tracking/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Execution tracking record not found');
  });
  
  // Test DELETE execution tracking record
  test('DELETE /execution-tracking/:id - should delete execution tracking record', async () => {
    const response = await request(app).delete('/execution-tracking/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Execution tracking record deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/execution-tracking/3');
    expect(getResponse.status).toBe(404);
  });
  
  // Test DELETE - not found
  test('DELETE /execution-tracking/:id - should return 404 for non-existent record', async () => {
    const response = await request(app).delete('/execution-tracking/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Execution tracking record not found');
  });
  
  // Test GET by work package ID
  test('GET /execution-tracking/work-package/:work_package_id - should return records for work package', async () => {
    const response = await request(app).get('/execution-tracking/work-package/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(record => {
      expect(record.work_package_id).toBe(1);
    });
  });
  
  // Test GET progress summary
  test('GET /execution-tracking/progress-summary/:work_package_id - should return progress summary', async () => {
    const response = await request(app).get('/execution-tracking/progress-summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('work_package_id', '1');
    expect(response.body).toHaveProperty('total_records', '2');
    expect(response.body).toHaveProperty('average_progress', '62.50');
    expect(response.body).toHaveProperty('total_labor_days', '22');
    expect(response.body).toHaveProperty('quality_checks_done', '2');
    expect(response.body).toHaveProperty('issues_count', '0');
    expect(response.body).toHaveProperty('latest_status', 'In Progress');
  });
  
  // Test GET progress summary - no records
  test('GET /execution-tracking/progress-summary/:work_package_id - should return empty summary for no records', async () => {
    const response = await request(app).get('/execution-tracking/progress-summary/999');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('work_package_id', 999);
    expect(response.body).toHaveProperty('total_records', 0);
    expect(response.body).toHaveProperty('average_progress', 0);
    expect(response.body).toHaveProperty('total_labor_days', 0);
    expect(response.body).toHaveProperty('quality_checks_done', 0);
    expect(response.body).toHaveProperty('issues_count', 0);
    expect(response.body).toHaveProperty('latest_status', null);
  });
});
