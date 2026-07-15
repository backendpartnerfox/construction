// tests/lead_quotation_history_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      lead_number VARCHAR(50) UNIQUE,
      lead_title VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_quotations (
      lead_quotation_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      lead_quotation_number VARCHAR(50) UNIQUE,
      quotation_date DATE DEFAULT CURRENT_DATE,
      version_number INT DEFAULT 1,
      total_amount DECIMAL(15,2),
      status VARCHAR(50) DEFAULT 'Draft',
      is_current_version BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_quotation_history (
      history_id SERIAL PRIMARY KEY,
      lead_quotation_id INT NOT NULL,
      version_number INT NOT NULL,
      change_type VARCHAR(50),
      change_description TEXT,
      total_amount_snapshot DECIMAL(15,2),
      package_rate_snapshot DECIMAL(10,2),
      habitable_area_snapshot DECIMAL(12,2),
      balcony_area_snapshot DECIMAL(12,2),
      stilt_area_snapshot DECIMAL(12,2),
      changes_made TEXT,
      reason_for_change TEXT,
      client_feedback_received TEXT,
      negotiation_stage VARCHAR(100),
      client_counter_offer DECIMAL(15,2),
      our_response TEXT,
      status_at_time VARCHAR(50),
      changed_by INT,
      change_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      quotation_file_path VARCHAR(255),
      history_notes TEXT,
      FOREIGN KEY (lead_quotation_id) REFERENCES lead_quotations(lead_quotation_id),
      FOREIGN KEY (changed_by) REFERENCES employees(employee_id),
      UNIQUE(lead_quotation_id, version_number)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS lead_quotation_history CASCADE');
  await pool.query('DROP TABLE IF EXISTS lead_quotations CASCADE');
  await pool.query('DROP TABLE IF EXISTS leads CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM lead_quotation_history');
  await pool.query('DELETE FROM lead_quotations');
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO leads (lead_id, lead_number, lead_title)
    VALUES 
      (1, 'LED-2024-001', 'Villa Construction Project'),
      (2, 'LED-2024-002', 'Office Building Project')
  `);

  await pool.query(`
    INSERT INTO lead_quotations (lead_quotation_id, lead_id, lead_quotation_number, total_amount, status)
    VALUES 
      (1, 1, 'LQ-2024-001', 5000000.00, 'Sent'),
      (2, 2, 'LQ-2024-002', 8000000.00, 'Draft')
  `);

  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com')
  `);

  // Reset sequences
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('lead_quotations_lead_quotation_id_seq', 2)");
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('lead_quotation_history_history_id_seq', 1, false)");
});

describe('Lead Quotation History API', () => {
  // Test GET all history records
  test('GET /lead-quotation-history - should return all history records', async () => {
    // Insert test history
    await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, change_description, total_amount_snapshot, status_at_time, changed_by)
      VALUES (1, 1, 'Created', 'Initial quotation created', 5000000.00, 'Draft', 1)
    `);

    const response = await request(app).get('/lead-quotation-history');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('history_id');
    expect(response.body[0]).toHaveProperty('change_type', 'Created');
    expect(response.body[0]).toHaveProperty('total_amount_snapshot', '5000000.00');
  });

  // Test GET with filters
  test('GET /lead-quotation-history - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, change_description, total_amount_snapshot, status_at_time, changed_by)
      VALUES 
        (1, 1, 'Created', 'Initial quotation created', 5000000.00, 'Draft', 1),
        (1, 2, 'Modified', 'Price updated after negotiation', 4800000.00, 'Sent', 1),
        (2, 1, 'Created', 'Initial quotation created', 8000000.00, 'Draft', 2)
    `);

    // Filter by lead_quotation_id
    const response1 = await request(app).get('/lead-quotation-history?lead_quotation_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(2);

    // Filter by change_type
    const response2 = await request(app).get('/lead-quotation-history?change_type=Modified');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(1);

    // Filter by changed_by
    const response3 = await request(app).get('/lead-quotation-history?changed_by=2');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /lead-quotation-history/:id - should return specific history record', async () => {
    const result = await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, change_description, total_amount_snapshot, changed_by)
      VALUES (1, 1, 'Created', 'Initial quotation created', 5000000.00, 1)
      RETURNING history_id
    `);
    const id = result.rows[0].history_id;

    const response = await request(app).get(`/lead-quotation-history/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('history_id', id);
    expect(response.body).toHaveProperty('lead_quotation_number', 'LQ-2024-001');
    expect(response.body).toHaveProperty('lead_title', 'Villa Construction Project');
  });

  // Test GET by ID - not found
  test('GET /lead-quotation-history/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/lead-quotation-history/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'History record not found');
  });

  // Test GET history for quotation
  test('GET /lead-quotation-history/quotation/:quotationId - should return history for specific quotation', async () => {
    await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, change_description, total_amount_snapshot, changed_by)
      VALUES 
        (1, 1, 'Created', 'Initial quotation created', 5000000.00, 1),
        (1, 2, 'Modified', 'Price updated', 4800000.00, 1),
        (1, 3, 'Sent', 'Quotation sent to client', 4800000.00, 2)
    `);

    const response = await request(app).get('/lead-quotation-history/quotation/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('version_number', 3);
    expect(response.body[2]).toHaveProperty('version_number', 1);
  });

  // Test POST new history record
  test('POST /lead-quotation-history - should create new history record', async () => {
    const newHistory = {
      lead_quotation_id: 1,
      version_number: 2,
      change_type: 'Modified',
      change_description: 'Updated pricing after client feedback',
      total_amount_snapshot: 4500000.00,
      package_rate_snapshot: 1800.00,
      habitable_area_snapshot: 2000.00,
      changes_made: 'Reduced package rate by 10%',
      reason_for_change: 'Client budget constraints',
      client_feedback_received: 'Price too high, need reduction',
      negotiation_stage: 'Price Negotiation',
      client_counter_offer: 4200000.00,
      our_response: 'Agreed to 10% reduction',
      status_at_time: 'Under Discussion',
      changed_by: 1
    };

    const response = await request(app)
      .post('/lead-quotation-history')
      .send(newHistory);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('history_id');
    expect(response.body).toHaveProperty('change_type', 'Modified');
    expect(response.body).toHaveProperty('total_amount_snapshot', '4500000.00');
  });

  // Test POST - missing required fields
  test('POST /lead-quotation-history - should return 400 for missing fields', async () => {
    const incompleteData = {
      lead_quotation_id: 1,
      // missing version_number and changed_by
    };

    const response = await request(app)
      .post('/lead-quotation-history')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test POST - duplicate version
  test('POST /lead-quotation-history - should return 409 for duplicate version', async () => {
    await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, changed_by)
      VALUES (1, 1, 'Created', 1)
    `);

    const duplicateVersion = {
      lead_quotation_id: 1,
      version_number: 1,
      change_type: 'Modified',
      changed_by: 1
    };

    const response = await request(app)
      .post('/lead-quotation-history')
      .send(duplicateVersion);
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('already exists');
  });

  // Test PUT update
  test('PUT /lead-quotation-history/:id - should update history record', async () => {
    const result = await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, change_description, changed_by)
      VALUES (1, 1, 'Created', 'Initial creation', 1)
      RETURNING history_id
    `);
    const id = result.rows[0].history_id;

    const updateData = {
      change_description: 'Updated description',
      client_feedback_received: 'Client approved with minor changes',
      history_notes: 'Additional notes added'
    };

    const response = await request(app)
      .put(`/lead-quotation-history/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('change_description', 'Updated description');
    expect(response.body).toHaveProperty('client_feedback_received', 'Client approved with minor changes');
    expect(response.body).toHaveProperty('history_notes', 'Additional notes added');
  });

  // Test DELETE
  test('DELETE /lead-quotation-history/:id - should delete history record', async () => {
    const result = await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, changed_by)
      VALUES (1, 1, 'Created', 1)
      RETURNING history_id
    `);
    const id = result.rows[0].history_id;

    const response = await request(app).delete(`/lead-quotation-history/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'History record deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM lead_quotation_history WHERE history_id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });

  // Test GET latest version
  test('GET /lead-quotation-history/quotation/:quotationId/latest - should return latest version', async () => {
    await pool.query(`
      INSERT INTO lead_quotation_history 
      (lead_quotation_id, version_number, change_type, total_amount_snapshot, changed_by)
      VALUES 
        (1, 1, 'Created', 5000000.00, 1),
        (1, 2, 'Modified', 4800000.00, 1),
        (1, 3, 'Sent', 4800000.00, 2)
    `);

    const response = await request(app).get('/lead-quotation-history/quotation/1/latest');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version_number', 3);
    expect(response.body).toHaveProperty('change_type', 'Sent');
  });
});
