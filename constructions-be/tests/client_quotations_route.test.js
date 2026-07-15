// tests/client_quotations_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

// Test data
const testData = {
  seedData: {
    clients: [
      {
        client_id: 1,
        client_name: 'Test Client 1',
        email: 'client1@test.com',
        phone: '1234567890',
        city: 'Test City',
        state: 'Test State'
      }
    ],
    client_requirements: [
      {
        client_requirement_id: 1,
        client_id: 1,
        requirement_title: 'Test Requirement',
        requirement_number: 'REQ-CLI-24-001-01',
        status: 'Approved'
      }
    ],
    employees: [
      {
        employee_id: 1,
        first_name: 'Test',
        last_name: 'Employee',
        email: 'employee@test.com'
      }
    ],
    client_quotations: [
      {
        client_quotation_id: 1,
        client_id: 1,
        client_requirement_id: 1,
        client_quotation_number: 'CQ-24-001',
        quotation_date: '2024-01-01',
        valid_until: '2024-02-01',
        project_title: 'Test Villa Project',
        package_type: 'Premium',
        package_rate_per_sqft: 2500.00,
        habitable_area: 2000,
        balcony_area: 200,
        stilt_area: 500,
        terrace_area: 300,
        gst_percentage: 18.00,
        status: 'Draft',
        prepared_by: 1,
        is_current_version: true,
        version_number: 1,
        quotation_type: 'Contract'
      },
      {
        client_quotation_id: 2,
        client_id: 1,
        client_requirement_id: 1,
        client_quotation_number: 'CQ-24-002',
        quotation_date: '2024-01-02',
        valid_until: '2024-02-02',
        project_title: 'Test Commercial Project',
        package_type: 'Standard',
        package_rate_per_sqft: 2000.00,
        habitable_area: 5000,
        status: 'Approved',
        prepared_by: 1,
        is_current_version: true,
        version_number: 1,
        quotation_type: 'Contract'
      }
    ]
  },
  createData: {
    valid: {
      client_id: 1,
      client_requirement_id: 1,
      client_quotation_number: 'CQ-24-003',
      project_title: 'New Test Project',
      package_type: 'Basic',
      package_rate_per_sqft: 1800.00,
      habitable_area: 1500,
      balcony_area: 150,
      prepared_by: 1
    },
    invalid: {
      missingRequired: {
        project_title: 'Invalid Project'
      },
      invalidPackageRate: {
        client_id: 1,
        client_requirement_id: 1,
        package_rate_per_sqft: -100,
        prepared_by: 1
      }
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
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      city VARCHAR(100),
      state VARCHAR(100)
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
    CREATE TABLE IF NOT EXISTS client_requirements (
      client_requirement_id SERIAL PRIMARY KEY,
      client_id INT NOT NULL,
      requirement_title VARCHAR(255) NOT NULL,
      requirement_number VARCHAR(50),
      status VARCHAR(50),
      FOREIGN KEY (client_id) REFERENCES clients(client_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_quotations (
      client_quotation_id SERIAL PRIMARY KEY,
      client_id INT NOT NULL,
      client_requirement_id INT NOT NULL,
      lead_quotation_id INT,
      client_quotation_number VARCHAR(50) UNIQUE,
      quotation_date DATE DEFAULT CURRENT_DATE,
      valid_until DATE,
      version_number INT DEFAULT 1,
      quotation_type VARCHAR(50) DEFAULT 'Contract',
      project_title VARCHAR(255),
      project_scope TEXT,
      site_area DECIMAL(12,2),
      built_up_area DECIMAL(12,2),
      construction_type VARCHAR(100),
      package_type VARCHAR(100),
      package_rate_per_sqft DECIMAL(10,2) NOT NULL,
      habitable_area DECIMAL(12,2) DEFAULT 0,
      balcony_area DECIMAL(12,2) DEFAULT 0,
      stilt_area DECIMAL(12,2) DEFAULT 0,
      terrace_area DECIMAL(12,2) DEFAULT 0,
      base_package_amount DECIMAL(15,2) GENERATED ALWAYS AS (
        (habitable_area * package_rate_per_sqft) + 
        (balcony_area * package_rate_per_sqft * 0.65) + 
        (stilt_area * package_rate_per_sqft * 0.65) + 
        (terrace_area * package_rate_per_sqft * 0.65)
      ) STORED,
      electrical_work_amount DECIMAL(15,2) DEFAULT 0,
      plumbing_work_amount DECIMAL(15,2) DEFAULT 0,
      finishing_work_amount DECIMAL(15,2) DEFAULT 0,
      special_features_amount DECIMAL(15,2) DEFAULT 0,
      miscellaneous_amount DECIMAL(15,2) DEFAULT 0,
      variation_amount DECIMAL(15,2) DEFAULT 0,
      additional_work_amount DECIMAL(15,2) DEFAULT 0,
      discount_amount DECIMAL(15,2) DEFAULT 0,
      subtotal DECIMAL(15,2) GENERATED ALWAYS AS (
        ((habitable_area * package_rate_per_sqft) + 
         (balcony_area * package_rate_per_sqft * 0.65) + 
         (stilt_area * package_rate_per_sqft * 0.65) + 
         (terrace_area * package_rate_per_sqft * 0.65)) +
        electrical_work_amount + plumbing_work_amount + finishing_work_amount + 
        special_features_amount + miscellaneous_amount + 
        variation_amount + additional_work_amount - discount_amount
      ) STORED,
      gst_percentage DECIMAL(5,2) DEFAULT 18.00,
      gst_amount DECIMAL(15,2) GENERATED ALWAYS AS (
        ROUND((((habitable_area * package_rate_per_sqft) + 
                (balcony_area * package_rate_per_sqft * 0.65) + 
                (stilt_area * package_rate_per_sqft * 0.65) + 
                (terrace_area * package_rate_per_sqft * 0.65)) +
               electrical_work_amount + plumbing_work_amount + finishing_work_amount + 
               special_features_amount + miscellaneous_amount + 
               variation_amount + additional_work_amount - discount_amount) * gst_percentage / 100, 2)
      ) STORED,
      contract_value DECIMAL(15,2) GENERATED ALWAYS AS (
        ((habitable_area * package_rate_per_sqft) + 
         (balcony_area * package_rate_per_sqft * 0.65) + 
         (stilt_area * package_rate_per_sqft * 0.65) + 
         (terrace_area * package_rate_per_sqft * 0.65)) +
        electrical_work_amount + plumbing_work_amount + finishing_work_amount + 
        special_features_amount + miscellaneous_amount + 
        variation_amount + additional_work_amount - discount_amount +
        ROUND((((habitable_area * package_rate_per_sqft) + 
                (balcony_area * package_rate_per_sqft * 0.65) + 
                (stilt_area * package_rate_per_sqft * 0.65) + 
                (terrace_area * package_rate_per_sqft * 0.65)) +
               electrical_work_amount + plumbing_work_amount + finishing_work_amount + 
               special_features_amount + miscellaneous_amount + 
               variation_amount + additional_work_amount - discount_amount) * gst_percentage / 100, 2)
      ) STORED,
      advance_percentage DECIMAL(5,2) DEFAULT 20.00,
      payment_schedule TEXT,
      milestone_payments JSONB,
      project_start_date DATE,
      estimated_completion_date DATE,
      contract_duration_months INT,
      terms_conditions TEXT,
      scope_of_work TEXT,
      inclusions TEXT,
      exclusions TEXT,
      assumptions TEXT,
      delay_penalty_percentage DECIMAL(5,2) DEFAULT 0,
      early_completion_bonus_percentage DECIMAL(5,2) DEFAULT 0,
      quality_standards TEXT,
      status VARCHAR(50) CHECK (status IN ('Draft', 'Under_Review', 'Client_Review', 'Approved', 'Contract_Signed', 'Active', 'Completed', 'Cancelled')) DEFAULT 'Draft',
      sent_to_client_date DATE,
      client_review_date DATE,
      client_approval_date DATE,
      client_feedback TEXT,
      contract_signed BOOLEAN DEFAULT FALSE,
      contract_signed_date DATE,
      contract_file_path VARCHAR(255),
      is_current_version BOOLEAN DEFAULT TRUE,
      previous_version_id INT,
      superseded_by INT,
      change_order_number INT DEFAULT 0,
      original_contract_value DECIMAL(15,2),
      total_variations DECIMAL(15,2) DEFAULT 0,
      prepared_by INT NOT NULL,
      reviewed_by INT,
      approved_by INT,
      contract_manager_approved_by INT,
      quotation_pdf_path VARCHAR(255),
      detailed_specifications_path VARCHAR(255),
      drawings_path VARCHAR(255),
      material_specifications_path VARCHAR(255),
      preparation_notes TEXT,
      review_notes TEXT,
      contract_notes TEXT,
      variation_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(client_id),
      FOREIGN KEY (client_requirement_id) REFERENCES client_requirements(client_requirement_id),
      FOREIGN KEY (prepared_by) REFERENCES employees(employee_id),
      FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id),
      FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
      FOREIGN KEY (contract_manager_approved_by) REFERENCES employees(employee_id),
      FOREIGN KEY (previous_version_id) REFERENCES client_quotations(client_quotation_id),
      FOREIGN KEY (superseded_by) REFERENCES client_quotations(client_quotation_id)
    )
  `);
});

afterAll(async () => {
  // Clean up
  await pool.query('DROP TABLE IF EXISTS client_quotations CASCADE');
  await pool.query('DROP TABLE IF EXISTS client_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear and reseed data
  await pool.query('TRUNCATE TABLE client_quotations, client_requirements, employees, clients RESTART IDENTITY CASCADE');
  
  // Insert seed data
  for (const client of testData.seedData.clients) {
    await pool.query(
      'INSERT INTO clients (client_id, client_name, email, phone, city, state) VALUES ($1, $2, $3, $4, $5, $6)',
      [client.client_id, client.client_name, client.email, client.phone, client.city, client.state]
    );
  }
  
  for (const employee of testData.seedData.employees) {
    await pool.query(
      'INSERT INTO employees (employee_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
      [employee.employee_id, employee.first_name, employee.last_name, employee.email]
    );
  }
  
  for (const req of testData.seedData.client_requirements) {
    await pool.query(
      'INSERT INTO client_requirements (client_requirement_id, client_id, requirement_title, requirement_number, status) VALUES ($1, $2, $3, $4, $5)',
      [req.client_requirement_id, req.client_id, req.requirement_title, req.requirement_number, req.status]
    );
  }
  
  for (const quot of testData.seedData.client_quotations) {
    await pool.query(
      `INSERT INTO client_quotations (
        client_quotation_id, client_id, client_requirement_id, client_quotation_number,
        quotation_date, valid_until, project_title, package_type, package_rate_per_sqft,
        habitable_area, balcony_area, stilt_area, terrace_area, gst_percentage,
        status, prepared_by, is_current_version, version_number, quotation_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        quot.client_quotation_id, quot.client_id, quot.client_requirement_id, quot.client_quotation_number,
        quot.quotation_date, quot.valid_until, quot.project_title, quot.package_type, quot.package_rate_per_sqft,
        quot.habitable_area, quot.balcony_area || 0, quot.stilt_area || 0, quot.terrace_area || 0, quot.gst_percentage,
        quot.status, quot.prepared_by, quot.is_current_version, quot.version_number, quot.quotation_type
      ]
    );
  }
  
  // Reset sequences
  await pool.query("SELECT setval('clients_client_id_seq', 1)");
  await pool.query("SELECT setval('employees_employee_id_seq', 1)");
  await pool.query("SELECT setval('client_requirements_client_requirement_id_seq', 1)");
  await pool.query("SELECT setval('client_quotations_client_quotation_id_seq', 2)");
});

describe('Client Quotations API', () => {
  
  describe('GET /client-quotations', () => {
    test('should return all client quotations', async () => {
      const response = await request(app).get('/client-quotations');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('client_quotation_id');
      expect(response.body[0]).toHaveProperty('contract_value');
    });
  });
  
  describe('GET /client-quotations/:id', () => {
    test('should return specific quotation by ID', async () => {
      const response = await request(app).get('/client-quotations/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client_quotation_id', 1);
      expect(response.body).toHaveProperty('client_quotation_number', 'CQ-24-001');
      expect(response.body).toHaveProperty('project_title', 'Test Villa Project');
    });
    
    test('should return 404 for non-existent quotation', async () => {
      const response = await request(app).get('/client-quotations/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client quotation not found');
    });
  });
  
  describe('POST /client-quotations', () => {
    test('should create new quotation with valid data', async () => {
      const response = await request(app)
        .post('/client-quotations')
        .send(testData.createData.valid);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('client_quotation_id', 3);
      expect(response.body).toHaveProperty('client_quotation_number', 'CQ-24-003');
      expect(response.body).toHaveProperty('contract_value');
      expect(response.body.contract_value).toBeGreaterThan(0);
    });
    
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/client-quotations')
        .send(testData.createData.invalid.missingRequired);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /client-quotations/:id', () => {
    test('should update existing quotation', async () => {
      const updateData = {
        ...testData.createData.valid,
        project_title: 'Updated Project Title',
        habitable_area: 2500
      };
      
      const response = await request(app)
        .put('/client-quotations/1')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('project_title', 'Updated Project Title');
      expect(response.body).toHaveProperty('habitable_area', '2500');
    });
    
    test('should return 404 for non-existent quotation', async () => {
      const response = await request(app)
        .put('/client-quotations/999')
        .send(testData.createData.valid);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client quotation not found');
    });
  });
  
  describe('DELETE /client-quotations/:id', () => {
    test('should delete existing quotation', async () => {
      const response = await request(app).delete('/client-quotations/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Client quotation deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/client-quotations/1');
      expect(checkResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent quotation', async () => {
      const response = await request(app).delete('/client-quotations/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client quotation not found');
    });
  });
  
  describe('GET /client-quotations/client/:clientId', () => {
    test('should return all quotations for a client', async () => {
      const response = await request(app).get('/client-quotations/client/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(quot => {
        expect(quot.client_id).toBe(1);
      });
    });
  });
  
  describe('GET /client-quotations/status/:status', () => {
    test('should return quotations by status', async () => {
      const response = await request(app).get('/client-quotations/status/Draft');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('Draft');
    });
  });
  
  describe('GET /client-quotations/search', () => {
    test('should search quotations by query', async () => {
      const response = await request(app).get('/client-quotations/search?query=Villa');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].project_title).toContain('Villa');
    });
    
    test('should return 400 for missing query', async () => {
      const response = await request(app).get('/client-quotations/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
  
  describe('PATCH /client-quotations/:id/send-to-client', () => {
    test('should send quotation to client', async () => {
      const response = await request(app).patch('/client-quotations/1/send-to-client');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Quotation sent to client successfully');
      expect(response.body.quotation).toHaveProperty('status', 'Client_Review');
      expect(response.body.quotation).toHaveProperty('sent_to_client_date');
    });
  });
  
  describe('PATCH /client-quotations/:id/approve', () => {
    test('should approve quotation', async () => {
      const response = await request(app)
        .patch('/client-quotations/1/approve')
        .send({ approved_by: 1 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Client quotation approved successfully');
      expect(response.body.quotation).toHaveProperty('status', 'Approved');
    });
  });
  
  describe('PATCH /client-quotations/:id/sign-contract', () => {
    test('should sign contract for approved quotation', async () => {
      // First approve the quotation
      await request(app)
        .patch('/client-quotations/2/approve')
        .send({ approved_by: 1 });
      
      const response = await request(app)
        .patch('/client-quotations/2/sign-contract')
        .send({
          contract_file_path: '/contracts/CQ-24-002.pdf',
          contract_manager_approved_by: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Contract signed successfully');
      expect(response.body.quotation).toHaveProperty('status', 'Contract_Signed');
      expect(response.body.quotation).toHaveProperty('contract_signed', true);
    });
    
    test('should fail to sign contract for non-approved quotation', async () => {
      const response = await request(app)
        .patch('/client-quotations/1/sign-contract')
        .send({
          contract_file_path: '/contracts/CQ-24-001.pdf',
          contract_manager_approved_by: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Quotation must be approved before signing contract');
    });
  });
  
  describe('POST /client-quotations/:id/create-variation', () => {
    test('should create variation quotation', async () => {
      const response = await request(app)
        .post('/client-quotations/1/create-variation')
        .send({
          variation_amount: 50000,
          variation_notes: 'Additional work requested',
          prepared_by: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('quotation_type', 'Variation');
      expect(response.body).toHaveProperty('variation_amount', '50000');
      expect(response.body).toHaveProperty('client_quotation_number');
      expect(response.body.client_quotation_number).toContain('-VAR-');
    });
    
    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/client-quotations/1/create-variation')
        .send({
          variation_amount: 50000
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /client-quotations/contract-value-range', () => {
    test('should return quotations within value range', async () => {
      const response = await request(app)
        .get('/client-quotations/contract-value-range?min_value=1000000&max_value=10000000');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // All returned quotations should have contract value within range
      response.body.forEach(quot => {
        expect(parseFloat(quot.contract_value)).toBeGreaterThanOrEqual(1000000);
        expect(parseFloat(quot.contract_value)).toBeLessThanOrEqual(10000000);
      });
    });
    
    test('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/client-quotations/contract-value-range?min_value=1000000');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Both min_value and max_value are required');
    });
  });
  
  describe('GET /client-quotations/current-versions', () => {
    test('should return only current version quotations', async () => {
      const response = await request(app).get('/client-quotations/current-versions');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      response.body.forEach(quot => {
        expect(quot.is_current_version).toBe(true);
      });
    });
  });
});
