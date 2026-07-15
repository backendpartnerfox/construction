// tests/lead_quotations_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data
const testData = {
  seedData: {
    employees: [
      {
        employee_id: 1,
        first_name: 'Test',
        last_name: 'Employee',
        email: 'employee@test.com'
      }
    ],
    leads: [
      {
        lead_id: 1,
        lead_title: 'Test Lead 1',
        primary_contact_name: 'John Doe',
        assigned_sales_person: 1,
        stage: 'Quotation_Requested'
      },
      {
        lead_id: 2,
        lead_title: 'Test Lead 2',
        primary_contact_name: 'Jane Smith',
        assigned_sales_person: 1,
        stage: 'Quotation_Sent'
      }
    ],
    lead_requirements: [
      {
        lead_requirement_id: 1,
        lead_id: 1,
        requirement_title: 'Villa Construction',
        requirement_number: 'REQ-LED-24-001-01',
        built_up_area: 2500,
        status: 'Finalized'
      },
      {
        lead_requirement_id: 2,
        lead_id: 2,
        requirement_title: 'Commercial Building',
        requirement_number: 'REQ-LED-24-002-01',
        built_up_area: 5000,
        status: 'Finalized'
      }
    ],
    lead_quotations: [
      {
        lead_quotation_id: 1,
        lead_id: 1,
        lead_requirement_id: 1,
        lead_quotation_number: 'LQ-24-001',
        project_title: 'Villa Construction Project',
        site_area: 3000,
        built_up_area: 2500,
        construction_type: 'New Construction',
        package_type: 'Premium',
        package_rate_per_sqft: 2500,
        total_amount: 6250000,
        status: 'Draft',
        prepared_by: 1,
        version_number: 1,
        is_current_version: true,
        converted_to_client: false
      },
      {
        lead_quotation_id: 2,
        lead_id: 2,
        lead_requirement_id: 2,
        lead_quotation_number: 'LQ-24-002',
        project_title: 'Commercial Building Project',
        site_area: 6000,
        built_up_area: 5000,
        construction_type: 'New Construction',
        package_type: 'Standard',
        package_rate_per_sqft: 2000,
        total_amount: 10000000,
        status: 'Sent',
        prepared_by: 1,
        version_number: 1,
        is_current_version: true,
        converted_to_client: false,
        sent_date: '2024-01-10'
      }
    ]
  },
  createData: {
    valid: {
      lead_id: 1,
      lead_requirement_id: 1,
      project_title: 'New Villa Project',
      site_area: 2800,
      built_up_area: 2200,
      construction_type: 'New Construction',
      package_type: 'Basic',
      package_rate_per_sqft: 1800,
      prepared_by: 1
    },
    invalid: {
      missingRequired: {
        project_title: 'Missing Required Fields'
      },
      invalidRate: {
        lead_id: 1,
        lead_requirement_id: 1,
        package_rate_per_sqft: -100,
        prepared_by: 1
      }
    }
  },
  updateData: {
    valid: {
      lead_id: 1,
      lead_requirement_id: 1,
      project_title: 'Updated Villa Project',
      site_area: 3200,
      built_up_area: 2600,
      construction_type: 'New Construction',
      package_type: 'Premium Plus',
      package_rate_per_sqft: 2800,
      status: 'Under_Review',
      reviewed_by: 1
    },
    conversion: {
      lead_id: 2,
      lead_requirement_id: 2,
      project_title: 'Commercial Building Project',
      site_area: 6000,
      built_up_area: 5000,
      construction_type: 'New Construction',
      package_type: 'Standard',
      package_rate_per_sqft: 2000,
      status: 'Accepted',
      converted_to_client: true,
      client_conversion_date: '2024-01-15',
      payment_received_amount: 2000000,
      prepared_by: 1,
      approved_by: 1
    }
  }
};

beforeAll(async () => {
  process.env.TEST_DATABASE = 'testdb2';
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(50) UNIQUE,
      contact_person_name VARCHAR(100) NOT NULL,
      primary_phone VARCHAR(20) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      enquiry_id INT,
      lead_number VARCHAR(50) UNIQUE,
      lead_title VARCHAR(255),
      primary_contact_name VARCHAR(100),
      assigned_sales_person INT NOT NULL,
      stage VARCHAR(50) DEFAULT 'Qualified',
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id),
      FOREIGN KEY (assigned_sales_person) REFERENCES employees(employee_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_requirements (
      lead_requirement_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      requirement_number VARCHAR(50),
      requirement_title VARCHAR(255) NOT NULL,
      built_up_area DECIMAL(12,2),
      status VARCHAR(50) DEFAULT 'Draft',
      created_by INT,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_quotations (
      lead_quotation_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      lead_requirement_id INT NOT NULL,
      enquiry_quotation_id INT,
      lead_quotation_number VARCHAR(50) UNIQUE,
      quotation_date DATE DEFAULT CURRENT_DATE,
      valid_until DATE,
      version_number INT DEFAULT 1,
      project_title VARCHAR(255),
      project_scope TEXT,
      site_area DECIMAL(12,2),
      built_up_area DECIMAL(12,2),
      construction_type VARCHAR(100),
      number_of_floors INT,
      package_type VARCHAR(100),
      package_rate_per_sqft DECIMAL(10,2) NOT NULL,
      habitable_area DECIMAL(12,2) DEFAULT 0,
      balcony_area DECIMAL(12,2) DEFAULT 0,
      stilt_area DECIMAL(12,2) DEFAULT 0,
      terrace_area DECIMAL(12,2) DEFAULT 0,
      package_construction_amount DECIMAL(15,2),
      electrical_additional DECIMAL(15,2) DEFAULT 0,
      plumbing_additional DECIMAL(15,2) DEFAULT 0,
      finishing_additional DECIMAL(15,2) DEFAULT 0,
      special_features_amount DECIMAL(15,2) DEFAULT 0,
      miscellaneous_amount DECIMAL(15,2) DEFAULT 0,
      discount_amount DECIMAL(15,2) DEFAULT 0,
      base_construction_amount DECIMAL(15,2),
      gst_percentage DECIMAL(5,2) DEFAULT 18.00,
      subtotal DECIMAL(15,2),
      gst_amount DECIMAL(15,2),
      total_amount DECIMAL(15,2),
      cost_per_sqft DECIMAL(10,2),
      estimated_duration_months INT,
      tentative_start_date DATE,
      tentative_completion_date DATE,
      advance_percentage DECIMAL(5,2) DEFAULT 20.00,
      payment_terms TEXT,
      terms_conditions TEXT,
      inclusions TEXT,
      exclusions TEXT,
      status VARCHAR(50) CHECK (status IN ('Draft', 'Under_Review', 'Approved', 'Sent', 'Viewed', 'Under_Discussion', 'Accepted', 'Rejected', 'Expired', 'Superseded')) DEFAULT 'Draft',
      sent_date DATE,
      viewed_date DATE,
      client_response_date DATE,
      client_feedback TEXT,
      follow_up_required BOOLEAN DEFAULT TRUE,
      next_follow_up_date DATE,
      follow_up_notes TEXT,
      is_current_version BOOLEAN DEFAULT TRUE,
      previous_version_id INT,
      superseded_by INT,
      converted_to_client BOOLEAN DEFAULT FALSE,
      client_conversion_date DATE,
      payment_received_amount DECIMAL(15,2),
      prepared_by INT NOT NULL,
      reviewed_by INT,
      approved_by INT,
      approval_date DATE,
      quotation_pdf_path VARCHAR(255),
      technical_drawings_path VARCHAR(255),
      supporting_documents_path VARCHAR(255),
      preparation_notes TEXT,
      negotiation_notes TEXT,
      revision_notes TEXT,
      internal_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id),
      FOREIGN KEY (lead_requirement_id) REFERENCES lead_requirements(lead_requirement_id),
      FOREIGN KEY (prepared_by) REFERENCES employees(employee_id),
      FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id),
      FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
      FOREIGN KEY (previous_version_id) REFERENCES lead_quotations(lead_quotation_id),
      FOREIGN KEY (superseded_by) REFERENCES lead_quotations(lead_quotation_id)
    )
  `);
});

afterAll(async () => {
  // Clean up
  await pool.query('DROP TABLE IF EXISTS lead_quotations CASCADE');
  await pool.query('DROP TABLE IF EXISTS lead_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS leads CASCADE');
  await pool.query('DROP TABLE IF EXISTS enquiries CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data
  await pool.query('TRUNCATE TABLE lead_quotations, lead_requirements, leads, enquiries, employees RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const employee of testData.seedData.employees) {
    await pool.query(
      'INSERT INTO employees (employee_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
      [employee.employee_id, employee.first_name, employee.last_name, employee.email]
    );
  }
  
  // Insert dummy enquiry for leads
  await pool.query("INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name, primary_phone) VALUES (1, 'ENQ-24-001', 'Test Contact', '1234567890')");
  
  for (const lead of testData.seedData.leads) {
    await pool.query(
      'INSERT INTO leads (lead_id, enquiry_id, lead_title, primary_contact_name, assigned_sales_person, stage) VALUES ($1, $2, $3, $4, $5, $6)',
      [lead.lead_id, 1, lead.lead_title, lead.primary_contact_name, lead.assigned_sales_person, lead.stage]
    );
  }
  
  for (const req of testData.seedData.lead_requirements) {
    await pool.query(
      'INSERT INTO lead_requirements (lead_requirement_id, lead_id, requirement_title, requirement_number, built_up_area, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.lead_requirement_id, req.lead_id, req.requirement_title, req.requirement_number, req.built_up_area, req.status]
    );
  }
  
  for (const quot of testData.seedData.lead_quotations) {
    await pool.query(
      `INSERT INTO lead_quotations (
        lead_quotation_id, lead_id, lead_requirement_id, lead_quotation_number,
        project_title, site_area, built_up_area, construction_type, package_type,
        package_rate_per_sqft, total_amount, status, prepared_by, version_number,
        is_current_version, converted_to_client, sent_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        quot.lead_quotation_id, quot.lead_id, quot.lead_requirement_id, quot.lead_quotation_number,
        quot.project_title, quot.site_area, quot.built_up_area, quot.construction_type, quot.package_type,
        quot.package_rate_per_sqft, quot.total_amount, quot.status, quot.prepared_by, quot.version_number,
        quot.is_current_version, quot.converted_to_client, quot.sent_date || null
      ]
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 1)");
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 1)");
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirements_lead_requirement_id_seq', 2)");
  await pool.query("SELECT setval('lead_quotations_lead_quotation_id_seq', 2)");
});

describe('Lead Quotations API', () => {
  
  describe('GET /lead_quotations', () => {
    test('should return all lead quotations', async () => {
      const response = await request(app).get('/lead_quotations');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('lead_quotation_id');
      expect(response.body[0]).toHaveProperty('package_rate_per_sqft');
    });
  });
  
  describe('GET /lead_quotations/:id', () => {
    test('should return specific quotation by ID', async () => {
      const response = await request(app).get('/lead_quotations/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lead_quotation_id', 1);
      expect(response.body).toHaveProperty('lead_quotation_number', 'LQ-24-001');
      expect(response.body).toHaveProperty('project_title', 'Villa Construction Project');
    });
    
    test('should return 404 for non-existent quotation', async () => {
      const response = await request(app).get('/lead_quotations/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Lead quotation not found');
    });
  });
  
  describe('POST /lead_quotations', () => {
    test('should create new quotation with valid data', async () => {
      const response = await request(app)
        .post('/lead_quotations')
        .send(testData.createData.valid);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('lead_quotation_id', 3);
      expect(response.body).toHaveProperty('project_title', 'New Villa Project');
      expect(response.body).toHaveProperty('total_amount');
      expect(response.body.total_amount).toBe(3960000); // 2200 * 1800
    });
    
    test('should calculate total amount if not provided', async () => {
      const dataWithoutTotal = { ...testData.createData.valid };
      delete dataWithoutTotal.total_amount;
      
      const response = await request(app)
        .post('/lead_quotations')
        .send(dataWithoutTotal);
      
      expect(response.status).toBe(201);
      expect(response.body.total_amount).toBe(3960000); // 2200 * 1800
    });
    
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/lead_quotations')
        .send(testData.createData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });
  });
  
  describe('PUT /lead_quotations/:id', () => {
    test('should update existing quotation', async () => {
      const response = await request(app)
        .put('/lead_quotations/1')
        .send(testData.updateData.valid);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lead_quotation_id', 1);
      expect(response.body).toHaveProperty('project_title', 'Updated Villa Project');
      expect(response.body).toHaveProperty('package_rate_per_sqft', 2800);
      expect(response.body).toHaveProperty('status', 'Under_Review');
      expect(response.body).toHaveProperty('reviewed_by', 1);
    });
    
    test('should update quotation to converted status', async () => {
      const response = await request(app)
        .put('/lead_quotations/2')
        .send(testData.updateData.conversion);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('converted_to_client', true);
      expect(response.body).toHaveProperty('client_conversion_date', '2024-01-15');
      expect(response.body).toHaveProperty('payment_received_amount', 2000000);
    });
    
    test('should return 404 for non-existent quotation', async () => {
      const response = await request(app)
        .put('/lead_quotations/999')
        .send(testData.updateData.valid);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Lead quotation not found');
    });
  });
  
  describe('DELETE /lead_quotations/:id', () => {
    test('should delete existing quotation', async () => {
      const response = await request(app).delete('/lead_quotations/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Lead quotation deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/lead_quotations/1');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent quotation', async () => {
      const response = await request(app).delete('/lead_quotations/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Lead quotation not found');
    });
  });
  
  describe('GET /lead_quotations/lead/:leadId', () => {
    test('should return all quotations for a lead', async () => {
      const response = await request(app).get('/lead_quotations/lead/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].lead_id).toBe(1);
    });
    
    test('should return empty array for lead with no quotations', async () => {
      const response = await request(app).get('/lead_quotations/lead/999');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /lead_quotations/status/:status', () => {
    test('should return quotations by status', async () => {
      const response = await request(app).get('/lead_quotations/status/Draft');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('Draft');
    });
    
    test('should return sent quotations', async () => {
      const response = await request(app).get('/lead_quotations/status/Sent');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('Sent');
      expect(response.body[0]).toHaveProperty('sent_date');
    });
  });
  
  describe('GET /lead_quotations/converted', () => {
    test('should return only converted quotations', async () => {
      // First convert a quotation
      await request(app)
        .put('/lead_quotations/2')
        .send({
          ...testData.updateData.conversion,
          converted_to_client: true,
          client_conversion_date: '2024-01-15'
        });
      
      const response = await request(app).get('/lead_quotations/converted');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].converted_to_client).toBe(true);
    });
    
    test('should return empty array when no converted quotations', async () => {
      const response = await request(app).get('/lead_quotations/converted');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /lead_quotations/prepared/:preparedBy', () => {
    test('should return quotations prepared by specific person', async () => {
      const response = await request(app).get('/lead_quotations/prepared/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(quot => {
        expect(quot.prepared_by).toBe(1);
      });
    });
    
    test('should return empty array for person with no quotations', async () => {
      const response = await request(app).get('/lead_quotations/prepared/999');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
});
