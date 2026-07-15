// tests/finance_payments_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_types (
      payment_type_id SERIAL PRIMARY KEY,
      payment_type_name VARCHAR(100) NOT NULL,
      payment_category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      payment_method_id SERIAL PRIMARY KEY,
      method_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(50) UNIQUE,
      contact_person_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      enquiry_id INT NOT NULL,
      lead_number VARCHAR(50) UNIQUE,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_quotations (
      quotation_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      lead_quotation_number VARCHAR(50) UNIQUE,
      total_amount DECIMAL(15,2),
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_payments (
      payment_id SERIAL PRIMARY KEY,
      payment_number VARCHAR(50) UNIQUE,
      receipt_number VARCHAR(50),
      lead_id INT,
      client_id INT,
      quotation_id INT,
      payment_type_id INT NOT NULL,
      payment_method_id INT NOT NULL,
      payment_amount DECIMAL(15,2) NOT NULL,
      payment_date DATE NOT NULL,
      cheque_number VARCHAR(50),
      cheque_date DATE,
      bank_name VARCHAR(200),
      branch_name VARCHAR(200),
      upi_transaction_id VARCHAR(100),
      online_reference_number VARCHAR(100),
      card_last_four_digits VARCHAR(4),
      paying_account_holder VARCHAR(255),
      paying_account_number VARCHAR(50),
      paying_bank_name VARCHAR(200),
      paying_ifsc_code VARCHAR(20),
      received_in_account VARCHAR(100),
      received_account_number VARCHAR(50),
      received_bank_name VARCHAR(200),
      payment_verified BOOLEAN DEFAULT FALSE,
      verified_by INT,
      verification_date DATE,
      verification_notes TEXT,
      payment_cleared BOOLEAN DEFAULT TRUE,
      clearance_date DATE,
      clearance_notes TEXT,
      payment_purpose TEXT NOT NULL,
      project_title VARCHAR(255),
      payment_stage VARCHAR(100),
      tds_applicable BOOLEAN DEFAULT FALSE,
      tds_percentage DECIMAL(5,2) DEFAULT 0,
      tds_amount DECIMAL(15,2) DEFAULT 0,
      tds_deducted_by VARCHAR(255),
      tds_certificate_number VARCHAR(100),
      gst_applicable BOOLEAN DEFAULT FALSE,
      gst_percentage DECIMAL(5,2) DEFAULT 0,
      gst_amount DECIMAL(15,2) DEFAULT 0,
      gross_amount DECIMAL(15,2) GENERATED ALWAYS AS (payment_amount + tds_amount) STORED,
      net_amount_received DECIMAL(15,2) GENERATED ALWAYS AS (payment_amount) STORED,
      status VARCHAR(50) CHECK (status IN ('Pending', 'Received', 'Verified', 'Cleared', 'Bounced', 'Cancelled')) DEFAULT 'Received',
      triggers_client_conversion BOOLEAN DEFAULT FALSE,
      conversion_threshold_met BOOLEAN DEFAULT FALSE,
      minimum_advance_required DECIMAL(15,2),
      acknowledgment_sent BOOLEAN DEFAULT FALSE,
      receipt_generated BOOLEAN DEFAULT FALSE,
      receipt_file_path VARCHAR(255),
      thank_you_message_sent BOOLEAN DEFAULT FALSE,
      accounting_entry_created BOOLEAN DEFAULT FALSE,
      accounting_entry_id VARCHAR(100),
      journal_entry_number VARCHAR(100),
      payment_proof_path VARCHAR(255),
      bank_statement_path VARCHAR(255),
      supporting_documents_path VARCHAR(255),
      payment_notes TEXT,
      internal_notes TEXT,
      follow_up_notes TEXT,
      received_by INT NOT NULL,
      processed_by INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id),
      FOREIGN KEY (client_id) REFERENCES clients(client_id),
      FOREIGN KEY (quotation_id) REFERENCES lead_quotations(quotation_id),
      FOREIGN KEY (payment_type_id) REFERENCES payment_types(payment_type_id),
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(payment_method_id),
      FOREIGN KEY (received_by) REFERENCES employees(employee_id),
      FOREIGN KEY (processed_by) REFERENCES employees(employee_id),
      FOREIGN KEY (verified_by) REFERENCES employees(employee_id),
      CHECK ((lead_id IS NOT NULL AND client_id IS NULL) OR 
             (lead_id IS NULL AND client_id IS NOT NULL) OR
             (lead_id IS NOT NULL AND client_id IS NOT NULL)),
      CHECK (payment_amount > 0),
      CHECK (tds_percentage >= 0 AND tds_percentage <= 50),
      CHECK (gst_percentage >= 0 AND gst_percentage <= 50)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS finance_payments');
  await pool.query('DROP TABLE IF EXISTS lead_quotations');
  await pool.query('DROP TABLE IF EXISTS leads');
  await pool.query('DROP TABLE IF EXISTS enquiries');
  await pool.query('DROP TABLE IF EXISTS clients');
  await pool.query('DROP TABLE IF EXISTS payment_methods');
  await pool.query('DROP TABLE IF EXISTS payment_types');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM finance_payments');
  await pool.query('DELETE FROM lead_quotations');
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM enquiries');
  await pool.query('DELETE FROM clients');
  await pool.query('DELETE FROM payment_methods');
  await pool.query('DELETE FROM payment_types');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com'),
      (3, 'Bob', 'Johnson', 'bob.johnson@company.com')
  `);
  
  await pool.query(`
    INSERT INTO payment_types (payment_type_id, payment_type_name, payment_category)
    VALUES 
      (1, 'Advance', 'Lead_Conversion'),
      (2, 'Progress_Payment', 'Project_Progress'),
      (3, 'Final_Payment', 'Project_Progress'),
      (4, 'Additional_Work', 'Additional_Work')
  `);
  
  await pool.query(`
    INSERT INTO payment_methods (payment_method_id, method_name)
    VALUES 
      (1, 'Bank_Transfer'),
      (2, 'Cheque'),
      (3, 'Cash'),
      (4, 'UPI'),
      (5, 'Card')
  `);
  
  await pool.query(`
    INSERT INTO clients (client_id, client_name)
    VALUES 
      (1, 'Rahul Sharma'),
      (2, 'Priya Patel')
  `);
  
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name)
    VALUES 
      (1, 'ENQ-24-001', 'Amit Kumar'),
      (2, 'ENQ-24-002', 'Neha Singh')
  `);
  
  await pool.query(`
    INSERT INTO leads (lead_id, enquiry_id, lead_number)
    VALUES 
      (1, 1, 'LED-24-001'),
      (2, 2, 'LED-24-002')
  `);
  
  await pool.query(`
    INSERT INTO lead_quotations (quotation_id, lead_id, lead_quotation_number, total_amount)
    VALUES 
      (1, 1, 'LQ-24-001', 5000000),
      (2, 2, 'LQ-24-002', 10000000)
  `);
  
  await pool.query(`
    INSERT INTO finance_payments (payment_id, payment_number, lead_id, quotation_id, payment_type_id,
                                 payment_method_id, payment_amount, payment_date, payment_purpose,
                                 project_title, payment_stage, status, received_by, created_at)
    VALUES 
      (1, 'PAY-24-001', 1, 1, 1, 1, 1000000, '2024-03-01', 'Advance payment for construction',
       'Residential Villa Project', 'Lead_Conversion', 'Verified', 1, CURRENT_TIMESTAMP),
      (2, 'PAY-24-002', NULL, NULL, 2, 2, 500000, '2024-03-05', 'Progress payment - Foundation',
       'Commercial Complex', 'Foundation', 'Received', 1, CURRENT_TIMESTAMP),
      (3, 'PAY-24-003', 2, 2, 1, 4, 2000000, '2024-03-10', 'Advance payment for project',
       'Office Building', 'Lead_Conversion', 'Pending', 2, CURRENT_TIMESTAMP),
      (4, 'PAY-24-004', NULL, NULL, 3, 1, 750000, '2024-03-15', 'Final payment settlement',
       'Apartment Renovation', 'Final', 'Cleared', 2, CURRENT_TIMESTAMP)
  `);
  
  // Update client_id for some payments
  await pool.query(`UPDATE finance_payments SET client_id = 1 WHERE payment_id IN (2, 4)`);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('payment_types_payment_type_id_seq', 4)");
  await pool.query("SELECT setval('payment_methods_payment_method_id_seq', 5)");
  await pool.query("SELECT setval('clients_client_id_seq', 2)");
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 2)");
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('lead_quotations_quotation_id_seq', 2)");
  await pool.query("SELECT setval('finance_payments_payment_id_seq', 4)");
});

describe('Finance Payments API', () => {
  // Test GET all payments
  test('GET /finance-payments - should return all payments', async () => {
    const response = await request(app).get('/finance-payments');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('payment_id');
    expect(response.body[0]).toHaveProperty('payment_number');
    expect(response.body[0]).toHaveProperty('payment_amount');
    expect(response.body[0]).toHaveProperty('payment_purpose');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test GET payment by ID
  test('GET /finance-payments/:id - should return a specific payment', async () => {
    const response = await request(app).get('/finance-payments/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_id', 1);
    expect(response.body).toHaveProperty('payment_number', 'PAY-24-001');
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('payment_amount', '1000000');
    expect(response.body).toHaveProperty('payment_purpose', 'Advance payment for construction');
    expect(response.body).toHaveProperty('status', 'Verified');
    expect(response.body).toHaveProperty('gross_amount', '1000000');
  });
  
  // Test GET payment by ID - not found
  test('GET /finance-payments/:id - should return 404 for non-existent payment', async () => {
    const response = await request(app).get('/finance-payments/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment not found');
  });
  
  // Test POST new payment from lead
  test('POST /finance-payments - should create a new payment from lead', async () => {
    const newPayment = {
      lead_id: 1,
      quotation_id: 1,
      payment_type_id: 1,
      payment_method_id: 1,
      payment_amount: 1500000,
      payment_date: '2024-03-20',
      payment_purpose: 'Advance payment for villa construction',
      project_title: 'Green Valley Villa',
      payment_stage: 'Lead_Conversion',
      bank_name: 'HDFC Bank',
      online_reference_number: 'REF123456789',
      paying_account_holder: 'Amit Kumar',
      paying_bank_name: 'ICICI Bank',
      received_in_account: 'Company Main Account',
      received_bank_name: 'HDFC Bank',
      triggers_client_conversion: true,
      minimum_advance_required: 1000000,
      payment_notes: 'First advance payment received',
      received_by: 1
    };
    
    const response = await request(app)
      .post('/finance-payments')
      .send(newPayment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('payment_id', 5);
    expect(response.body).toHaveProperty('payment_number');
    expect(response.body.payment_number).toMatch(/^PAY-\d{2}-\d{3}$/);
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('payment_amount', '1500000');
    expect(response.body).toHaveProperty('status', 'Received');
    expect(response.body).toHaveProperty('triggers_client_conversion', true);
  });
  
  // Test POST payment - missing required fields
  test('POST /finance-payments - should return 400 for missing required fields', async () => {
    const incompletePayment = {
      payment_amount: 500000,
      payment_date: '2024-03-20'
      // Missing payment_type_id, payment_method_id, payment_purpose, received_by
    };
    
    const response = await request(app)
      .post('/finance-payments')
      .send(incompletePayment);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test POST payment with TDS
  test('POST /finance-payments - should create payment with TDS deduction', async () => {
    const paymentWithTDS = {
      client_id: 1,
      payment_type_id: 2,
      payment_method_id: 1,
      payment_amount: 900000,
      payment_date: '2024-03-25',
      payment_purpose: 'Progress payment with TDS',
      project_title: 'Commercial Project',
      payment_stage: 'Structure',
      tds_applicable: true,
      tds_percentage: 10,
      tds_amount: 100000,
      tds_deducted_by: 'ABC Corporation',
      tds_certificate_number: 'TDS/2024/001',
      received_by: 1
    };
    
    const response = await request(app)
      .post('/finance-payments')
      .send(paymentWithTDS);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('payment_amount', '900000');
    expect(response.body).toHaveProperty('tds_amount', '100000');
    expect(response.body).toHaveProperty('gross_amount', '1000000'); // payment_amount + tds_amount
    expect(response.body).toHaveProperty('net_amount_received', '900000');
  });
  
  // Test PUT update payment
  test('PUT /finance-payments/:id - should update a payment', async () => {
    const updatedData = {
      payment_amount: 550000,
      cheque_number: 'CHQ123456',
      cheque_date: '2024-03-04',
      bank_name: 'SBI',
      branch_name: 'Main Branch',
      payment_verified: true,
      verified_by: 2,
      verification_date: '2024-03-06',
      verification_notes: 'Cheque cleared successfully',
      payment_cleared: true,
      clearance_date: '2024-03-07',
      status: 'Cleared',
      processed_by: 2,
      internal_notes: 'Payment verified and cleared'
    };
    
    const response = await request(app)
      .put('/finance-payments/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_id', 2);
    expect(response.body).toHaveProperty('payment_amount', '550000');
    expect(response.body).toHaveProperty('cheque_number', 'CHQ123456');
    expect(response.body).toHaveProperty('payment_verified', true);
    expect(response.body).toHaveProperty('status', 'Cleared');
    expect(response.body).toHaveProperty('verified_by', 2);
  });
  
  // Test PUT payment - not found
  test('PUT /finance-payments/:id - should return 404 for non-existent payment', async () => {
    const updatedData = {
      payment_amount: 100000,
      status: 'Verified'
    };
    
    const response = await request(app)
      .put('/finance-payments/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment not found');
  });
  
  // Test DELETE payment
  test('DELETE /finance-payments/:id - should delete a payment', async () => {
    const response = await request(app).delete('/finance-payments/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Payment deleted successfully');
    
    // Verify payment was actually deleted
    const deletedPayment = await request(app).get('/finance-payments/3');
    expect(deletedPayment.status).toBe(404);
  });
  
  // Test GET payments by lead
  test('GET /finance-payments/lead/:leadId - should return payments for specific lead', async () => {
    const response = await request(app).get('/finance-payments/lead/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('lead_id', 1);
    expect(response.body[0]).toHaveProperty('payment_number', 'PAY-24-001');
  });
  
  // Test GET payments by client
  test('GET /finance-payments/client/:clientId - should return payments for specific client', async () => {
    const response = await request(app).get('/finance-payments/client/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(payment => {
      expect(payment.client_id).toBe(1);
    });
  });
  
  // Test GET payments by status
  test('GET /finance-payments/status/:status - should return payments with specific status', async () => {
    const response = await request(app).get('/finance-payments/status/Verified');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'Verified');
  });
  
  // Test verify payment
  test('PUT /finance-payments/:id/verify - should verify a payment', async () => {
    const verificationData = {
      verified_by: 3,
      verification_notes: 'Payment confirmed in bank statement'
    };
    
    const response = await request(app)
      .put('/finance-payments/2/verify')
      .send(verificationData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_id', 2);
    expect(response.body).toHaveProperty('payment_verified', true);
    expect(response.body).toHaveProperty('verified_by', 3);
    expect(response.body).toHaveProperty('verification_date');
    expect(response.body).toHaveProperty('status', 'Verified');
  });
  
  // Test mark payment as bounced
  test('PUT /finance-payments/:id/bounce - should mark payment as bounced', async () => {
    const bounceData = {
      bounce_reason: 'Insufficient funds',
      follow_up_notes: 'Contact client for alternative payment'
    };
    
    const response = await request(app)
      .put('/finance-payments/2/bounce')
      .send(bounceData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_id', 2);
    expect(response.body).toHaveProperty('status', 'Bounced');
    expect(response.body).toHaveProperty('payment_cleared', false);
  });
  
  // Test GET payment summary
  test('GET /finance-payments/summary - should return payment summary statistics', async () => {
    const response = await request(app).get('/finance-payments/summary');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_payments');
    expect(response.body).toHaveProperty('total_amount');
    expect(response.body).toHaveProperty('by_status');
    expect(response.body).toHaveProperty('by_payment_type');
    expect(response.body).toHaveProperty('by_payment_method');
    expect(response.body).toHaveProperty('pending_verification');
    expect(response.body).toHaveProperty('recent_payments');
  });
  
  // Test GET payments by date range
  test('GET /finance-payments/date-range - should return payments within date range', async () => {
    const response = await request(app).get('/finance-payments/date-range?start=2024-03-01&end=2024-03-10');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(payment => {
      const paymentDate = new Date(payment.payment_date);
      expect(paymentDate >= new Date('2024-03-01')).toBe(true);
      expect(paymentDate <= new Date('2024-03-10')).toBe(true);
    });
  });
  
  // Test generate receipt
  test('POST /finance-payments/:id/generate-receipt - should generate receipt for payment', async () => {
    const receiptData = {
      receipt_template: 'standard',
      additional_notes: 'Thank you for your payment'
    };
    
    const response = await request(app)
      .post('/finance-payments/1/generate-receipt')
      .send(receiptData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payment_id', 1);
    expect(response.body).toHaveProperty('receipt_generated', true);
    expect(response.body).toHaveProperty('receipt_number');
    expect(response.body).toHaveProperty('receipt_file_path');
  });
});
