// tests/client_quotation_history_route.test.js
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
      client_name VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50),
      last_name VARCHAR(50)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_requirements (
      client_requirement_id SERIAL PRIMARY KEY,
      client_id INT,
      requirement_title VARCHAR(255),
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_quotations (
      client_quotation_id SERIAL PRIMARY KEY,
      client_id INT NOT NULL,
      client_requirement_id INT,
      client_quotation_number VARCHAR(50) UNIQUE,
      quotation_date DATE DEFAULT CURRENT_DATE,
      version_number INT DEFAULT 1,
      contract_value DECIMAL(15,2),
      status VARCHAR(50) DEFAULT 'Draft',
      FOREIGN KEY (client_id) REFERENCES clients(client_id),
      FOREIGN KEY (client_requirement_id) REFERENCES client_requirements(client_requirement_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_quotation_history (
      history_id SERIAL PRIMARY KEY,
      client_quotation_id INT NOT NULL,
      version_number INT NOT NULL,
      change_type VARCHAR(50),
      change_category VARCHAR(50),
      change_description TEXT,
      change_reason TEXT,
      change_requested_by VARCHAR(100),
      change_approved_by INT,
      contract_value_before DECIMAL(15,2),
      contract_value_after DECIMAL(15,2),
      value_change DECIMAL(15,2) GENERATED ALWAYS AS (contract_value_after - contract_value_before) STORED,
      total_area_before DECIMAL(12,2),
      total_area_after DECIMAL(12,2),
      completion_date_before DATE,
      completion_date_after DATE,
      scope_changes TEXT,
      material_changes TEXT,
      specification_changes TEXT,
      additional_work_details TEXT,
      cost_impact DECIMAL(15,2),
      time_impact_days INT,
      resource_impact TEXT,
      client_approval_required BOOLEAN DEFAULT FALSE,
      client_approved BOOLEAN DEFAULT FALSE,
      client_approval_date DATE,
      change_order_number VARCHAR(50),
      change_order_date DATE,
      change_status VARCHAR(50) DEFAULT 'Proposed',
      implementation_date DATE,
      implementation_notes TEXT,
      created_by INT,
      change_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved_date TIMESTAMP WITH TIME ZONE,
      history_notes TEXT,
      internal_notes TEXT,
      client_communication_notes TEXT,
      FOREIGN KEY (client_quotation_id) REFERENCES client_quotations(client_quotation_id),
      FOREIGN KEY (change_approved_by) REFERENCES employees(employee_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      UNIQUE(client_quotation_id, version_number)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS client_quotation_history CASCADE');
  await pool.query('DROP TABLE IF EXISTS client_quotations CASCADE');
  await pool.query('DROP TABLE IF EXISTS client_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM client_quotation_history');
  await pool.query('DELETE FROM client_quotations');
  await pool.query('DELETE FROM client_requirements');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM clients');
  
  // Insert test data
  await pool.query(`
    INSERT INTO clients (client_id, client_name, email, phone)
    VALUES 
      (1, 'ABC Corporation', 'abc@corp.com', '9876543210'),
      (2, 'XYZ Industries', 'xyz@industries.com', '8765432109'),
      (3, 'Tech Solutions Ltd', 'info@techsolutions.com', '7654321098')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'John', 'Doe'),
      (2, 'Jane', 'Smith'),
      (3, 'Bob', 'Johnson')
  `);
  
  await pool.query(`
    INSERT INTO client_requirements (client_requirement_id, client_id, requirement_title)
    VALUES 
      (1, 1, 'Office Building Construction'),
      (2, 2, 'Warehouse Renovation'),
      (3, 3, 'IT Park Development')
  `);
  
  await pool.query(`
    INSERT INTO client_quotations (client_quotation_id, client_id, client_requirement_id, client_quotation_number, quotation_date, version_number, contract_value, status)
    VALUES 
      (1, 1, 1, 'CQ-2024-001', '2024-01-15', 3, 5000000.00, 'Active'),
      (2, 2, 2, 'CQ-2024-002', '2024-02-01', 2, 3000000.00, 'Under Review'),
      (3, 3, 3, 'CQ-2024-003', '2024-03-01', 1, 8000000.00, 'Draft')
  `);
  
  await pool.query(`
    INSERT INTO client_quotation_history (
      history_id, client_quotation_id, version_number, change_type, change_category,
      change_description, change_reason, change_requested_by, change_approved_by,
      contract_value_before, contract_value_after, total_area_before, total_area_after,
      scope_changes, cost_impact, time_impact_days, client_approval_required,
      client_approved, change_status, created_by
    )
    VALUES 
      (1, 1, 1, 'Created', 'Initial', 'Initial quotation created', 'New project', 'Sales Team', 1, 0, 4500000.00, 0, 5000, 'Initial scope defined', 4500000.00, 0, false, false, 'Implemented', 1),
      (2, 1, 2, 'Modified', 'Scope_Change', 'Added parking area', 'Client request', 'Client', 1, 4500000.00, 4800000.00, 5000, 5500, 'Added 500 sqft parking', 300000.00, 15, true, true, 'Implemented', 1),
      (3, 1, 3, 'Modified', 'Price_Change', 'Material cost increase', 'Market rates', 'Project Manager', 2, 4800000.00, 5000000.00, 5500, 5500, NULL, 200000.00, 0, true, true, 'Approved', 2),
      (4, 2, 1, 'Created', 'Initial', 'Initial quotation created', 'New project', 'Sales Team', 1, 0, 2800000.00, 0, 3000, 'Initial scope defined', 2800000.00, 0, false, false, 'Implemented', 1),
      (5, 2, 2, 'Modified', 'Timeline_Change', 'Accelerated timeline', 'Client urgency', 'Client', 2, 2800000.00, 3000000.00, 3000, 3000, 'Fast-track construction', 200000.00, -30, true, false, 'Client_Approval_Pending', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('clients_client_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('client_requirements_client_requirement_id_seq', 3)");
  await pool.query("SELECT setval('client_quotations_client_quotation_id_seq', 3)");
  await pool.query("SELECT setval('client_quotation_history_history_id_seq', 5)");
});

describe('Client Quotation History API', () => {
  // Test GET all history records
  test('GET /client-quotation-history - should return all history records', async () => {
    const response = await request(app).get('/client-quotation-history');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(5);
    expect(response.body[0]).toHaveProperty('history_id');
    expect(response.body[0]).toHaveProperty('client_quotation_id');
    expect(response.body[0]).toHaveProperty('change_type');
    expect(response.body[0]).toHaveProperty('value_change');
  });

  // Test GET history by ID
  test('GET /client-quotation-history/:id - should return a specific history record', async () => {
    const response = await request(app).get('/client-quotation-history/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('history_id', 1);
    expect(response.body).toHaveProperty('change_type', 'Created');
    expect(response.body).toHaveProperty('change_category', 'Initial');
    expect(response.body).toHaveProperty('contract_value_after', '4500000.00');
  });

  test('GET /client-quotation-history/:id - should return 404 for non-existent history', async () => {
    const response = await request(app).get('/client-quotation-history/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'History record not found');
  });

  // Test GET history by quotation
  test('GET /client-quotation-history/quotation/:quotationId - should return history for a quotation', async () => {
    const response = await request(app).get('/client-quotation-history/quotation/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(history => {
      expect(history.client_quotation_id).toBe(1);
    });
  });

  // Test GET history by client
  test('GET /client-quotation-history/client/:clientId - should return history for a client', async () => {
    const response = await request(app).get('/client-quotation-history/client/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
  });

  // Test POST new history record
  test('POST /client-quotation-history - should create a new history record', async () => {
    const newHistory = {
      client_quotation_id: 3,
      version_number: 2,
      change_type: 'Modified',
      change_category: 'Scope_Change',
      change_description: 'Added additional floor',
      change_reason: 'Client expansion plans',
      change_requested_by: 'Client CEO',
      change_approved_by: 1,
      contract_value_before: 8000000.00,
      contract_value_after: 9500000.00,
      total_area_before: 10000,
      total_area_after: 12000,
      scope_changes: 'Added 2000 sqft additional floor',
      material_changes: 'Additional steel and concrete required',
      cost_impact: 1500000.00,
      time_impact_days: 60,
      resource_impact: 'Additional workforce needed',
      client_approval_required: true,
      change_order_number: 'CO-2024-001',
      change_status: 'Proposed',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/client-quotation-history')
      .send(newHistory);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('history_id', 6);
    expect(response.body).toHaveProperty('value_change', '1500000');
    expect(response.body).toHaveProperty('change_status', 'Proposed');
  });

  test('POST /client-quotation-history - should return 400 for duplicate version', async () => {
    const duplicateHistory = {
      client_quotation_id: 1,
      version_number: 1,
      change_type: 'Modified',
      created_by: 1
    };
    
    const response = await request(app)
      .post('/client-quotation-history')
      .send(duplicateHistory);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test PUT update history record
  test('PUT /client-quotation-history/:id - should update a history record', async () => {
    const updatedData = {
      change_description: 'Updated description',
      client_approved: true,
      client_approval_date: '2024-01-20',
      change_status: 'Approved',
      implementation_date: '2024-01-25',
      implementation_notes: 'Successfully implemented'
    };
    
    const response = await request(app)
      .put('/client-quotation-history/5')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('history_id', 5);
    expect(response.body).toHaveProperty('client_approved', true);
    expect(response.body).toHaveProperty('change_status', 'Approved');
  });

  test('PUT /client-quotation-history/:id - should return 404 for non-existent history', async () => {
    const updatedData = {
      change_status: 'Approved'
    };
    
    const response = await request(app)
      .put('/client-quotation-history/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'History record not found');
  });

  // Test DELETE history record
  test('DELETE /client-quotation-history/:id - should delete a history record', async () => {
    const response = await request(app).delete('/client-quotation-history/5');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'History record deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/client-quotation-history/5');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /client-quotation-history/:id - should return 404 for non-existent history', async () => {
    const response = await request(app).delete('/client-quotation-history/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'History record not found');
  });

  // Test GET history by change type
  test('GET /client-quotation-history/by-change-type/:changeType - should return history by change type', async () => {
    const response = await request(app).get('/client-quotation-history/by-change-type/Modified');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach(history => {
      expect(history.change_type).toBe('Modified');
    });
  });

  // Test GET pending approvals
  test('GET /client-quotation-history/pending-approvals - should return pending client approvals', async () => {
    const response = await request(app).get('/client-quotation-history/pending-approvals');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('client_approval_required', true);
    expect(response.body[0]).toHaveProperty('client_approved', false);
  });

  // Test GET summary
  test('GET /client-quotation-history/summary/:quotationId - should return change summary', async () => {
    const response = await request(app).get('/client-quotation-history/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_changes');
    expect(response.body).toHaveProperty('total_value_change');
    expect(response.body).toHaveProperty('total_area_change');
    expect(response.body).toHaveProperty('total_time_impact');
    expect(response.body).toHaveProperty('change_categories');
  });

  // Test PATCH approve change
  test('PATCH /client-quotation-history/:id/approve - should approve a change', async () => {
    const approvalData = {
      client_approval_date: '2024-01-20',
      client_communication_notes: 'Approved via email'
    };
    
    const response = await request(app)
      .patch('/client-quotation-history/5/approve')
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_approved', true);
    expect(response.body).toHaveProperty('change_status', 'Approved');
  });

  // Test PATCH implement change
  test('PATCH /client-quotation-history/:id/implement - should mark change as implemented', async () => {
    const implementationData = {
      implementation_date: '2024-01-25',
      implementation_notes: 'Successfully completed'
    };
    
    const response = await request(app)
      .patch('/client-quotation-history/3/implement')
      .send(implementationData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('change_status', 'Implemented');
    expect(response.body).toHaveProperty('implementation_date', '2024-01-25');
  });
});
