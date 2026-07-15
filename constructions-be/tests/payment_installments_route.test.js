// tests/payment_installments_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_installments (
      installment_id SERIAL PRIMARY KEY,
      payment_id INTEGER NOT NULL,
      installment_number INTEGER NOT NULL,
      installment_amount DECIMAL(15,2) NOT NULL,
      due_date DATE NOT NULL,
      paid_date DATE,
      status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS payment_installments');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM payment_installments');
  
  // Insert test data
  await pool.query(`
    INSERT INTO payment_installments (installment_id, payment_id, installment_number, installment_amount, due_date, status, notes)
    VALUES 
      (1, 101, 1, 50000.00, '2024-01-15', 'Paid', 'First installment'),
      (2, 101, 2, 50000.00, '2024-02-15', 'Pending', 'Second installment'),
      (3, 102, 1, 75000.00, '2024-01-20', 'Pending', 'Single payment'),
      (4, 103, 1, 25000.00, '2023-12-10', 'Pending', 'Overdue payment')
  `);
  
  // Reset sequence
  await pool.query("SELECT setval('payment_installments_installment_id_seq', 4)");
});

describe('Payment Installments API', () => {
  // Test GET all payment installments
  test('GET /payment-installments - should return all payment installments', async () => {
    const response = await request(app).get('/payment-installments');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('installment_id');
    expect(response.body[0]).toHaveProperty('payment_id');
    expect(response.body[0]).toHaveProperty('installment_number');
    expect(response.body[0]).toHaveProperty('installment_amount');
    expect(response.body[0]).toHaveProperty('due_date');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test GET payment installment by ID
  test('GET /payment-installments/:id - should return a specific payment installment', async () => {
    const response = await request(app).get('/payment-installments/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('installment_id', 1);
    expect(response.body).toHaveProperty('payment_id', 101);
    expect(response.body).toHaveProperty('installment_number', 1);
    expect(response.body).toHaveProperty('installment_amount', '50000.00');
    expect(response.body).toHaveProperty('status', 'Paid');
    expect(response.body).toHaveProperty('notes', 'First installment');
  });
  
  // Test GET payment installment by ID - not found
  test('GET /payment-installments/:id - should return 404 for non-existent installment', async () => {
    const response = await request(app).get('/payment-installments/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment installment not found');
  });
  
  // Test POST new payment installment
  test('POST /payment-installments - should create a new payment installment', async () => {
    const newInstallment = {
      payment_id: 104,
      installment_number: 1,
      installment_amount: 80000.00,
      due_date: '2024-03-15',
      status: 'Pending',
      notes: 'New installment'
    };
    
    const response = await request(app)
      .post('/payment-installments')
      .send(newInstallment);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('installment_id', 5);
    expect(response.body).toHaveProperty('payment_id', 104);
    expect(response.body).toHaveProperty('installment_number', 1);
    expect(response.body).toHaveProperty('installment_amount', '80000.00');
    expect(response.body).toHaveProperty('status', 'Pending');
    expect(response.body).toHaveProperty('notes', 'New installment');
    
    // Verify installment was actually created
    const allInstallments = await request(app).get('/payment-installments');
    expect(allInstallments.body.length).toBe(5);
  });
  
  // Test POST payment installment - missing required fields
  test('POST /payment-installments - should return 400 for missing required fields', async () => {
    const incompleteInstallment = {
      payment_id: 104,
      installment_amount: 80000.00
    };
    
    const response = await request(app)
      .post('/payment-installments')
      .send(incompleteInstallment);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Payment ID, Installment Number, Amount, and Due Date are required');
  });
  
  // Test PUT update payment installment
  test('PUT /payment-installments/:id - should update a payment installment', async () => {
    const updatedData = {
      payment_id: 101,
      installment_number: 2,
      installment_amount: 55000.00,
      due_date: '2024-02-20',
      status: 'Paid',
      paid_date: '2024-02-18',
      notes: 'Updated second installment'
    };
    
    const response = await request(app)
      .put('/payment-installments/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('installment_id', 2);
    expect(response.body).toHaveProperty('installment_amount', '55000.00');
    expect(response.body).toHaveProperty('status', 'Paid');
    expect(response.body).toHaveProperty('notes', 'Updated second installment');
  });
  
  // Test PUT payment installment - not found
  test('PUT /payment-installments/:id - should return 404 for non-existent installment', async () => {
    const updatedData = {
      payment_id: 999,
      installment_number: 1,
      installment_amount: 50000.00,
      due_date: '2024-03-15'
    };
    
    const response = await request(app)
      .put('/payment-installments/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment installment not found');
  });
  
  // Test DELETE payment installment
  test('DELETE /payment-installments/:id - should delete a payment installment', async () => {
    const response = await request(app).delete('/payment-installments/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Payment installment deleted successfully');
    
    // Verify installment was actually deleted
    const deletedInstallment = await request(app).get('/payment-installments/3');
    expect(deletedInstallment.status).toBe(404);
    
    const allInstallments = await request(app).get('/payment-installments');
    expect(allInstallments.body.length).toBe(3);
  });
  
  // Test DELETE payment installment - not found
  test('DELETE /payment-installments/:id - should return 404 for non-existent installment', async () => {
    const response = await request(app).delete('/payment-installments/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment installment not found');
  });
  
  // Test GET installments by payment ID
  test('GET /payment-installments/payment/:paymentId - should return installments for specific payment', async () => {
    const response = await request(app).get('/payment-installments/payment/101');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('payment_id', 101);
    expect(response.body[1]).toHaveProperty('payment_id', 101);
    
    // Check they are ordered by installment number
    expect(response.body[0].installment_number).toBe(1);
    expect(response.body[1].installment_number).toBe(2);
  });
  
  // Test GET installments by status
  test('GET /payment-installments/status/:status - should return installments by status', async () => {
    const response = await request(app).get('/payment-installments/status/Pending');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    response.body.forEach(installment => {
      expect(installment.status).toBe('Pending');
    });
  });
  
  // Test GET overdue installments
  test('GET /payment-installments/overdue - should return overdue installments', async () => {
    const response = await request(app).get('/payment-installments/overdue');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('installment_id', 4);
    expect(response.body[0]).toHaveProperty('status', 'Pending');
  });
  
  // Test GET upcoming installments
  test('GET /payment-installments/upcoming - should return upcoming installments', async () => {
    const response = await request(app).get('/payment-installments/upcoming');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    // Should return installments due within next 30 days with 'Pending' status
    response.body.forEach(installment => {
      expect(installment.status).toBe('Pending');
    });
  });
  
  // Test PATCH mark installment as paid
  test('PATCH /payment-installments/:id/mark-paid - should mark installment as paid', async () => {
    const paidData = {
      paid_date: '2024-02-18',
      notes: 'Payment completed via bank transfer'
    };
    
    const response = await request(app)
      .patch('/payment-installments/2/mark-paid')
      .send(paidData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('installment_id', 2);
    expect(response.body).toHaveProperty('status', 'Paid');
    expect(response.body).toHaveProperty('paid_date', '2024-02-18');
    expect(response.body).toHaveProperty('notes', 'Payment completed via bank transfer');
  });
  
  // Test PATCH mark installment as paid - not found
  test('PATCH /payment-installments/:id/mark-paid - should return 404 for non-existent installment', async () => {
    const paidData = {
      paid_date: '2024-02-18'
    };
    
    const response = await request(app)
      .patch('/payment-installments/999/mark-paid')
      .send(paidData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Payment installment not found');
  });
  
  // Test PATCH mark installment as paid - auto date
  test('PATCH /payment-installments/:id/mark-paid - should use current date if not provided', async () => {
    const response = await request(app)
      .patch('/payment-installments/3/mark-paid')
      .send({});
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('installment_id', 3);
    expect(response.body).toHaveProperty('status', 'Paid');
    expect(response.body).toHaveProperty('paid_date');
    // Should have today's date
    const today = new Date().toISOString().split('T')[0];
    expect(response.body.paid_date).toBe(today);
  });
});
