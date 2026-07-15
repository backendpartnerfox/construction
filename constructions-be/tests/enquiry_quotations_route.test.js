// tests/enquiry_quotations_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(50) UNIQUE,
      contact_person_name VARCHAR(100) NOT NULL,
      primary_phone VARCHAR(20) NOT NULL,
      status VARCHAR(50) DEFAULT 'New'
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
    CREATE TABLE IF NOT EXISTS enquiry_requirements (
      enquiry_requirement_id SERIAL PRIMARY KEY,
      enquiry_id INT NOT NULL,
      requirement_number VARCHAR(50),
      requirement_title VARCHAR(255) NOT NULL,
      built_up_area DECIMAL(12,2),
      budget_range_min DECIMAL(15,2),
      budget_range_max DECIMAL(15,2),
      status VARCHAR(50) DEFAULT 'Draft',
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_quotations (
      enquiry_quotation_id SERIAL PRIMARY KEY,
      enquiry_id INT NOT NULL,
      enquiry_requirement_id INT NOT NULL,
      enquiry_quotation_number VARCHAR(50) UNIQUE,
      quotation_date DATE DEFAULT CURRENT_DATE,
      valid_until DATE,
      project_title VARCHAR(255),
      project_scope TEXT,
      built_up_area DECIMAL(12,2),
      construction_type VARCHAR(100),
      package_type VARCHAR(100),
      package_rate_per_sqft DECIMAL(10,2) NOT NULL,
      total_area DECIMAL(12,2) DEFAULT 0,
      base_construction_cost DECIMAL(15,2) GENERATED ALWAYS AS (total_area * package_rate_per_sqft) STORED,
      additional_work_amount DECIMAL(15,2) DEFAULT 0,
      discount_amount DECIMAL(15,2) DEFAULT 0,
      gst_percentage DECIMAL(5,2) DEFAULT 18.00,
      subtotal DECIMAL(15,2) GENERATED ALWAYS AS (base_construction_cost + additional_work_amount - discount_amount) STORED,
      gst_amount DECIMAL(15,2) GENERATED ALWAYS AS (ROUND((base_construction_cost + additional_work_amount - discount_amount) * gst_percentage / 100, 2)) STORED,
      total_amount DECIMAL(15,2) GENERATED ALWAYS AS (base_construction_cost + additional_work_amount - discount_amount + ROUND((base_construction_cost + additional_work_amount - discount_amount) * gst_percentage / 100, 2)) STORED,
      estimated_duration_months INT,
      advance_percentage DECIMAL(5,2) DEFAULT 20.00,
      advance_amount DECIMAL(15,2) GENERATED ALWAYS AS (ROUND((base_construction_cost + additional_work_amount - discount_amount + ROUND((base_construction_cost + additional_work_amount - discount_amount) * gst_percentage / 100, 2)) * advance_percentage / 100, 2)) STORED,
      payment_terms TEXT,
      terms_conditions TEXT,
      status VARCHAR(50) DEFAULT 'Draft',
      sent_date DATE,
      client_response_date DATE,
      lead_conversion_eligible BOOLEAN DEFAULT FALSE,
      converted_to_lead BOOLEAN DEFAULT FALSE,
      conversion_trigger VARCHAR(100),
      quotation_pdf_path VARCHAR(255),
      prepared_by INT NOT NULL,
      approved_by INT,
      preparation_notes TEXT,
      client_feedback TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id),
      FOREIGN KEY (enquiry_requirement_id) REFERENCES enquiry_requirements(enquiry_requirement_id),
      FOREIGN KEY (prepared_by) REFERENCES employees(employee_id),
      FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS enquiry_quotations CASCADE');
  await pool.query('DROP TABLE IF EXISTS enquiry_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS enquiries CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM enquiry_quotations');
  await pool.query('DELETE FROM enquiry_requirements');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM enquiries');
  
  // Insert test data
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name, primary_phone, status)
    VALUES 
      (1, 'ENQ-2024-001', 'John Doe', '9876543210', 'New'),
      (2, 'ENQ-2024-002', 'Jane Smith', '8765432109', 'In Progress'),
      (3, 'ENQ-2024-003', 'Bob Johnson', '7654321098', 'New')
  `);
  
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name)
    VALUES 
      (1, 'Rajesh', 'Kumar'),
      (2, 'Priya', 'Singh'),
      (3, 'Amit', 'Sharma')
  `);
  
  await pool.query(`
    INSERT INTO enquiry_requirements (
      enquiry_requirement_id, enquiry_id, requirement_number, requirement_title,
      built_up_area, budget_range_min, budget_range_max, status
    )
    VALUES 
      (1, 1, 'REQ-ENQ-2024-001-01', 'Basic 3BHK Villa', 2500, 4000000, 5000000, 'Finalized'),
      (2, 2, 'REQ-ENQ-2024-002-01', 'Commercial Complex', 10000, 15000000, 20000000, 'Finalized'),
      (3, 3, 'REQ-ENQ-2024-003-01', '2BHK Apartment', 1200, 2000000, 2500000, 'Draft')
  `);
  
  await pool.query(`
    INSERT INTO enquiry_quotations (
      enquiry_quotation_id, enquiry_id, enquiry_requirement_id, enquiry_quotation_number,
      quotation_date, valid_until, project_title, project_scope, built_up_area,
      construction_type, package_type, package_rate_per_sqft, total_area,
      additional_work_amount, discount_amount, estimated_duration_months,
      status, prepared_by, approved_by, lead_conversion_eligible
    )
    VALUES 
      (1, 1, 1, 'EQ-2024-001', '2024-01-15', '2024-02-15', 'Basic 3BHK Villa Construction', 'Complete villa construction', 2500, 'Residential', 'Basic Package', 1800.00, 2500, 500000, 100000, 12, 'Sent', 1, 2, true),
      (2, 2, 2, 'EQ-2024-002', '2024-01-16', '2024-02-16', 'Commercial Complex Project', 'Complete commercial building', 10000, 'Commercial', 'Premium Package', 2200.00, 10000, 2000000, 500000, 18, 'Draft', 2, NULL, false),
      (3, 1, 1, 'EQ-2024-003', '2024-01-17', '2024-02-17', 'Revised 3BHK Villa', 'Updated villa construction plan', 2500, 'Residential', 'Standard Package', 2000.00, 2500, 700000, 200000, 12, 'Approved', 1, 3, true),
      (4, 3, 3, 'EQ-2024-004', '2024-01-18', '2024-02-18', '2BHK Apartment Construction', 'Apartment construction', 1200, 'Residential', 'Basic Package', 1600.00, 1200, 200000, 50000, 8, 'Draft', 2, NULL, false)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 3)");
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('enquiry_requirements_enquiry_requirement_id_seq', 3)");
  await pool.query("SELECT setval('enquiry_quotations_enquiry_quotation_id_seq', 4)");
});

describe('Enquiry Quotations API', () => {
  // Test GET all enquiry quotations
  test('GET /enquiry-quotations - should return all enquiry quotations', async () => {
    const response = await request(app).get('/enquiry-quotations');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('enquiry_quotation_id');
    expect(response.body[0]).toHaveProperty('enquiry_quotation_number');
    expect(response.body[0]).toHaveProperty('total_amount');
    expect(response.body[0]).toHaveProperty('contact_person_name');
  });

  // Test GET enquiry quotation by ID
  test('GET /enquiry-quotations/:id - should return a specific enquiry quotation', async () => {
    const response = await request(app).get('/enquiry-quotations/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_quotation_id', 1);
    expect(response.body).toHaveProperty('enquiry_quotation_number', 'EQ-2024-001');
    expect(response.body).toHaveProperty('package_rate_per_sqft', '1800.00');
    expect(response.body).toHaveProperty('total_amount');
    expect(response.body).toHaveProperty('status', 'Sent');
  });

  test('GET /enquiry-quotations/:id - should return 404 for non-existent quotation', async () => {
    const response = await request(app).get('/enquiry-quotations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry quotation not found');
  });

  // Test GET quotations by enquiry
  test('GET /enquiry-quotations/enquiry/:enquiryId - should return quotations for an enquiry', async () => {
    const response = await request(app).get('/enquiry-quotations/enquiry/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(quotation => {
      expect(quotation.enquiry_id).toBe(1);
    });
  });

  // Test GET quotations by requirement
  test('GET /enquiry-quotations/requirement/:requirementId - should return quotations for a requirement', async () => {
    const response = await request(app).get('/enquiry-quotations/requirement/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(quotation => {
      expect(quotation.enquiry_requirement_id).toBe(1);
    });
  });

  // Test POST new enquiry quotation
  test('POST /enquiry-quotations - should create a new enquiry quotation', async () => {
    const newQuotation = {
      enquiry_id: 3,
      enquiry_requirement_id: 3,
      enquiry_quotation_number: 'EQ-2024-005',
      project_title: 'New 2BHK Apartment',
      project_scope: 'Complete apartment construction with amenities',
      built_up_area: 1200,
      construction_type: 'Residential',
      package_type: 'Standard Package',
      package_rate_per_sqft: 1700.00,
      total_area: 1200,
      additional_work_amount: 300000,
      discount_amount: 100000,
      estimated_duration_months: 10,
      advance_percentage: 25.00,
      payment_terms: 'As per agreement',
      terms_conditions: 'Standard terms apply',
      status: 'Draft',
      prepared_by: 1
    };
    
    const response = await request(app)
      .post('/enquiry-quotations')
      .send(newQuotation);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_quotation_id', 5);
    expect(response.body).toHaveProperty('enquiry_quotation_number', 'EQ-2024-005');
    expect(response.body).toHaveProperty('total_amount');
    expect(response.body).toHaveProperty('advance_amount');
  });

  test('POST /enquiry-quotations - should return 400 for missing required fields', async () => {
    const incompleteQuotation = {
      enquiry_id: 1,
      project_title: 'Test Project'
    };
    
    const response = await request(app)
      .post('/enquiry-quotations')
      .send(incompleteQuotation);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /enquiry-quotations - should return 404 for non-existent enquiry', async () => {
    const invalidQuotation = {
      enquiry_id: 999,
      enquiry_requirement_id: 1,
      enquiry_quotation_number: 'EQ-2024-006',
      package_rate_per_sqft: 1800.00,
      prepared_by: 1
    };
    
    const response = await request(app)
      .post('/enquiry-quotations')
      .send(invalidQuotation);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry not found');
  });

  // Test PUT update enquiry quotation
  test('PUT /enquiry-quotations/:id - should update an enquiry quotation', async () => {
    const updatedData = {
      project_title: 'Updated Commercial Complex',
      package_rate_per_sqft: 2300.00,
      additional_work_amount: 2500000,
      discount_amount: 600000,
      status: 'Under Review',
      client_feedback: 'Requested some changes'
    };
    
    const response = await request(app)
      .put('/enquiry-quotations/2')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_quotation_id', 2);
    expect(response.body).toHaveProperty('project_title', 'Updated Commercial Complex');
    expect(response.body).toHaveProperty('package_rate_per_sqft', '2300.00');
    expect(response.body).toHaveProperty('status', 'Under Review');
  });

  test('PUT /enquiry-quotations/:id - should return 404 for non-existent quotation', async () => {
    const updatedData = {
      project_title: 'Updated Title'
    };
    
    const response = await request(app)
      .put('/enquiry-quotations/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry quotation not found');
  });

  // Test DELETE enquiry quotation
  test('DELETE /enquiry-quotations/:id - should delete an enquiry quotation', async () => {
    const response = await request(app).delete('/enquiry-quotations/4');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Enquiry quotation deleted successfully');
    
    // Verify deletion
    const getResponse = await request(app).get('/enquiry-quotations/4');
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /enquiry-quotations/:id - should return 400 when deleting sent/approved quotation', async () => {
    const response = await request(app).delete('/enquiry-quotations/1');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Cannot delete sent or approved quotation');
  });

  test('DELETE /enquiry-quotations/:id - should return 404 for non-existent quotation', async () => {
    const response = await request(app).delete('/enquiry-quotations/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry quotation not found');
  });

  // Test PATCH send quotation
  test('PATCH /enquiry-quotations/:id/send - should send a quotation', async () => {
    const sendData = {
      sent_date: '2024-01-20'
    };
    
    const response = await request(app)
      .patch('/enquiry-quotations/2/send')
      .send(sendData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Sent');
    expect(response.body).toHaveProperty('sent_date', '2024-01-20');
  });

  // Test PATCH approve quotation
  test('PATCH /enquiry-quotations/:id/approve - should approve a quotation', async () => {
    const approvalData = {
      approved_by: 3,
      preparation_notes: 'Approved after review'
    };
    
    const response = await request(app)
      .patch('/enquiry-quotations/2/approve')
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'Approved');
    expect(response.body).toHaveProperty('approved_by', 3);
  });

  // Test PATCH client response
  test('PATCH /enquiry-quotations/:id/client-response - should record client response', async () => {
    const responseData = {
      client_response_date: '2024-01-22',
      client_feedback: 'Accepted with minor modifications',
      status: 'Accepted'
    };
    
    const response = await request(app)
      .patch('/enquiry-quotations/1/client-response')
      .send(responseData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_response_date', '2024-01-22');
    expect(response.body).toHaveProperty('client_feedback', 'Accepted with minor modifications');
    expect(response.body).toHaveProperty('status', 'Accepted');
  });

  // Test GET conversion eligible quotations
  test('GET /enquiry-quotations/conversion-eligible - should return conversion eligible quotations', async () => {
    const response = await request(app).get('/enquiry-quotations/conversion-eligible');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(quotation => {
      expect(quotation.lead_conversion_eligible).toBe(true);
      expect(quotation.converted_to_lead).toBe(false);
    });
  });

  // Test PATCH convert to lead
  test('PATCH /enquiry-quotations/:id/convert-to-lead - should mark quotation as converted to lead', async () => {
    const conversionData = {
      conversion_trigger: 'Client accepted quotation'
    };
    
    const response = await request(app)
      .patch('/enquiry-quotations/1/convert-to-lead')
      .send(conversionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('converted_to_lead', true);
    expect(response.body).toHaveProperty('conversion_trigger', 'Client accepted quotation');
  });

  // Test GET quotation summary
  test('GET /enquiry-quotations/summary/:enquiryId - should return enquiry quotation summary', async () => {
    const response = await request(app).get('/enquiry-quotations/summary/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_quotations');
    expect(response.body).toHaveProperty('latest_quotation');
    expect(response.body).toHaveProperty('status_breakdown');
    expect(response.body).toHaveProperty('total_value_quoted');
  });

  // Test GET quotations by status
  test('GET /enquiry-quotations/status/:status - should return quotations by status', async () => {
    const response = await request(app).get('/enquiry-quotations/status/Draft');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach(quotation => {
      expect(quotation.status).toBe('Draft');
    });
  });

  // Test duplicate quotation
  test('POST /enquiry-quotations/:id/duplicate - should duplicate a quotation', async () => {
    const duplicateData = {
      new_quotation_number: 'EQ-2024-006',
      modifications: {
        package_rate_per_sqft: 1900.00,
        status: 'Draft'
      }
    };
    
    const response = await request(app)
      .post('/enquiry-quotations/1/duplicate')
      .send(duplicateData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_quotation_number', 'EQ-2024-006');
    expect(response.body).toHaveProperty('package_rate_per_sqft', '1900.00');
    expect(response.body).toHaveProperty('status', 'Draft');
  });
});
