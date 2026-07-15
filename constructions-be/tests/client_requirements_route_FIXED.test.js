// tests/client_requirements_route_FIXED.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create test database tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      surname VARCHAR(255),
      email VARCHAR(100),
      phone VARCHAR(20),
      city VARCHAR(100),
      state VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_requirements (
      client_requirement_id SERIAL PRIMARY KEY,
      client_id INT NOT NULL,
      lead_requirement_id INT,
      requirement_number VARCHAR(50),
      requirement_title VARCHAR(255) NOT NULL,
      requirement_description TEXT,
      project_title VARCHAR(255),
      project_type VARCHAR(100),
      construction_type VARCHAR(100),
      site_area DECIMAL(10,2),
      built_up_area DECIMAL(10,2),
      carpet_area DECIMAL(10,2),
      number_of_floors INT,
      number_of_bedrooms INT,
      number_of_bathrooms INT,
      number_of_kitchens INT,
      stilt_required BOOLEAN DEFAULT false,
      stilt_area DECIMAL(10,2),
      balcony_area DECIMAL(10,2),
      terrace_area DECIMAL(10,2),
      site_level DECIMAL(10,2),
      ground_floor_ffl DECIMAL(10,2),
      typical_floor_height DECIMAL(10,2),
      sump_capacity_liters INT,
      overhead_tank_capacity_liters INT,
      foundation_type VARCHAR(100),
      wall_type VARCHAR(100),
      roofing_type VARCHAR(100),
      flooring_type VARCHAR(100),
      paint_type VARCHAR(100),
      kitchen_type VARCHAR(100),
      bathroom_fittings VARCHAR(100),
      has_swimming_pool BOOLEAN DEFAULT false,
      has_garden_landscaping BOOLEAN DEFAULT false,
      has_solar_panels BOOLEAN DEFAULT false,
      has_elevator BOOLEAN DEFAULT false,
      quality_level VARCHAR(50),
      package_type VARCHAR(100),
      package_inclusions TEXT[],
      package_exclusions TEXT[],
      approved_budget DECIMAL(15,2),
      project_start_date DATE,
      expected_completion_date DATE,
      preferred_brands TEXT,
      specific_brand_requirements TEXT,
      status VARCHAR(50) DEFAULT 'Draft',
      approved_date DATE,
      approved_at TIMESTAMP,
      locked_date DATE,
      locked_at TIMESTAMP,
      change_requests_allowed BOOLEAN DEFAULT true,
      major_changes_count INT DEFAULT 0,
      minor_changes_count INT DEFAULT 0,
      approved_drawings_path VARCHAR(255),
      specifications_document_path VARCHAR(255),
      material_list_path VARCHAR(255),
      final_requirements_notes TEXT,
      client_specific_requests TEXT,
      technical_specifications_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INT,
      reviewed_by INT,
      approved_by INT,
      locked_by INT,
      updated_by INT,
      FOREIGN KEY (client_id) REFERENCES clients(client_id),
      FOREIGN KEY (created_by) REFERENCES employees(employee_id),
      FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
      FOREIGN KEY (locked_by) REFERENCES employees(employee_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS client_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS clients CASCADE');
  await pool.query('DROP TABLE IF EXISTS employees CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM client_requirements');
  await pool.query('DELETE FROM clients');
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
    INSERT INTO clients (client_id, client_name, surname, email, phone, city, state)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@example.com', '9876543210', 'Mumbai', 'Maharashtra'),
      (2, 'Jane', 'Smith', 'jane.smith@example.com', '9876543211', 'Delhi', 'Delhi'),
      (3, 'Robert', 'Johnson', 'robert.johnson@example.com', '9876543212', 'Bangalore', 'Karnataka')
  `);
  
  await pool.query(`
    INSERT INTO client_requirements (
      client_requirement_id, client_id, requirement_number, requirement_title,
      requirement_description, project_title, project_type, construction_type,
      site_area, built_up_area, number_of_floors, number_of_bedrooms,
      number_of_bathrooms, approved_budget, status, change_requests_allowed,
      major_changes_count, minor_changes_count, created_by
    )
    VALUES 
      (1, 1, 'REQ-CL-24-001-01', 'Luxury Villa Requirements',
       'Detailed requirements for luxury villa', 'Green Valley Villa', 'Residential', 'New Construction',
       3000, 2500, 2, 4, 4, 7500000, 'Approved', true, 0, 0, 1),
      (2, 1, 'REQ-CL-24-001-02', 'Guest House Requirements',
       'Requirements for guest house', 'Green Valley Guest House', 'Residential', 'New Construction',
       800, 600, 1, 1, 1, 2000000, 'Under_Review', true, 0, 0, 1),
      (3, 2, 'REQ-CL-24-002-01', 'Office Complex Requirements',
       'Modern office complex specifications', 'Tech Hub Plaza', 'Commercial', 'New Construction',
       5000, 4500, 5, 0, 10, 25000000, 'Approved', false, 1, 2, 1),
      (4, 3, 'REQ-CL-24-003-01', 'Apartment Requirements',
       'Budget apartment requirements', 'Sunrise Apartments', 'Residential', 'New Construction',
       1200, 1000, 1, 2, 2, 3500000, 'Under_Review', true, 0, 0, 1),
      (5, 2, 'REQ-CL-24-002-02', 'Warehouse Requirements',
       'Storage warehouse specifications', 'Logistics Hub', 'Commercial', 'New Construction',
       10000, 8000, 1, 0, 2, 9000000, 'Draft', true, 0, 0, 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('clients_client_id_seq', 3)");
  await pool.query("SELECT setval('client_requirements_client_requirement_id_seq', 5)");
});

describe('Client Requirements Route Tests', () => {
  describe('GET /client-requirements', () => {
    test('should return all client requirements', async () => {
      const response = await request(app).get('/client-requirements');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(5);
      expect(response.body[0]).toHaveProperty('client_requirement_id');
      expect(response.body[0]).toHaveProperty('requirement_title');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /client-requirements/:id', () => {
    test('should return a specific client requirement', async () => {
      const response = await request(app).get('/client-requirements/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client_requirement_id', 1);
      expect(response.body).toHaveProperty('requirement_title', 'Luxury Villa Requirements');
      expect(response.body).toHaveProperty('project_title', 'Green Valley Villa');
      expect(response.body).toHaveProperty('status', 'Approved');
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app).get('/client-requirements/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client requirement not found');
    });
  });

  describe('POST /client-requirements', () => {
    test('should create a new client requirement', async () => {
      const newRequirement = {
        client_id: 3,
        requirement_number: 'REQ-CL-24-003-02',
        requirement_title: 'Villa Requirements',
        requirement_description: 'New villa project requirements',
        project_title: 'Sunset Villa',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 2000,
        built_up_area: 1600,
        number_of_floors: 2,
        number_of_bedrooms: 3,
        number_of_bathrooms: 3,
        number_of_kitchens: 1,
        approved_budget: 5000000,
        quality_level: 'Premium',
        package_type: 'Standard Package',
        created_by: 1
      };

      const response = await request(app)
        .post('/client-requirements')
        .send(newRequirement);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('client_requirement_id', 6);
      expect(response.body).toHaveProperty('requirement_title', 'Villa Requirements');
      expect(response.body).toHaveProperty('status', 'Draft');
      expect(response.body).toHaveProperty('change_requests_allowed', true);
    });

    test('should return 400 if required fields are missing', async () => {
      const invalidRequirement = {
        requirement_title: 'Test Requirement'
        // Missing client_id
      };

      const response = await request(app)
        .post('/client-requirements')
        .send(invalidRequirement);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Client ID and requirement title are required');
    });
  });

  describe('PUT /client-requirements/:id', () => {
    test('should update an existing client requirement', async () => {
      const updateData = {
        client_id: 1,
        requirement_title: 'Updated Luxury Villa Requirements',
        requirement_description: 'Updated with more specifications',
        project_title: 'Green Valley Villa - Phase 2',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 3200,
        built_up_area: 2700,
        number_of_floors: 3,
        number_of_bedrooms: 5,
        number_of_bathrooms: 5,
        approved_budget: 8500000,
        status: 'Approved',
        updated_by: 2
      };

      const response = await request(app)
        .put('/client-requirements/1')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client_requirement_id', 1);
      expect(response.body).toHaveProperty('requirement_title', 'Updated Luxury Villa Requirements');
      expect(response.body).toHaveProperty('site_area', '3200.00');
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app)
        .put('/client-requirements/999')
        .send({
          client_id: 1,
          requirement_title: 'Test Update'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client requirement not found');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .put('/client-requirements/1')
        .send({
          requirement_title: 'Test Update'
          // Missing client_id
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Client ID and requirement title are required');
    });
  });

  describe('DELETE /client-requirements/:id', () => {
    test('should delete a client requirement', async () => {
      const response = await request(app).delete('/client-requirements/5');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Client requirement deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/client-requirements/5');
      expect(checkResponse.status).toBe(404);
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app).delete('/client-requirements/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client requirement not found');
    });
  });

  describe('GET /client-requirements/client/:clientId', () => {
    test('should return all requirements for a specific client', async () => {
      const response = await request(app).get('/client-requirements/client/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(req => {
        expect(req.client_id).toBe(1);
      });
    });
  });

  describe('GET /client-requirements/status/:status', () => {
    test('should return requirements with specific status', async () => {
      const response = await request(app).get('/client-requirements/status/Approved');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(req => {
        expect(req.status).toBe('Approved');
      });
    });
  });

  describe('GET /client-requirements/search', () => {
    test('should search requirements by query', async () => {
      const response = await request(app)
        .get('/client-requirements/search')
        .query({ query: 'villa' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      
      const titles = response.body.map(req => req.requirement_title);
      expect(titles).toContain('Luxury Villa Requirements');
      expect(titles).toContain('Guest House Requirements');
    });

    test('should return 400 if search query is missing', async () => {
      const response = await request(app).get('/client-requirements/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });

  describe('PATCH /client-requirements/:id/approve', () => {
    test('should approve a client requirement', async () => {
      const response = await request(app)
        .patch('/client-requirements/2/approve')
        .send({ approved_by: 2 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Client requirement approved successfully');
      expect(response.body.requirement).toHaveProperty('status', 'Approved');
      expect(response.body.requirement).toHaveProperty('approved_by', 2);
      expect(response.body.requirement).toHaveProperty('approved_date');
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app)
        .patch('/client-requirements/999/approve')
        .send({ approved_by: 2 });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client requirement not found');
    });
  });

  describe('PATCH /client-requirements/:id/lock', () => {
    test('should lock an approved requirement', async () => {
      const response = await request(app)
        .patch('/client-requirements/1/lock')
        .send({ locked_by: 2 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Client requirement locked successfully');
      expect(response.body.requirement).toHaveProperty('status', 'Locked');
      expect(response.body.requirement).toHaveProperty('locked_by', 2);
      expect(response.body.requirement).toHaveProperty('change_requests_allowed', false);
    });

    test('should return 400 if requirement is not approved', async () => {
      const response = await request(app)
        .patch('/client-requirements/5/lock')
        .send({ locked_by: 2 });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Requirement must be approved before locking');
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app)
        .patch('/client-requirements/999/lock')
        .send({ locked_by: 2 });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client requirement not found');
    });
  });

  describe('PATCH /client-requirements/:id/change-request', () => {
    test('should submit a major change request', async () => {
      const response = await request(app)
        .patch('/client-requirements/1/change-request')
        .send({
          change_type: 'major',
          change_notes: 'Need to add one more bedroom'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Major change request submitted successfully');
      expect(response.body.requirement).toHaveProperty('status', 'Change_Request');
      expect(response.body.requirement).toHaveProperty('major_changes_count', 1);
    });

    test('should submit a minor change request', async () => {
      const response = await request(app)
        .patch('/client-requirements/1/change-request')
        .send({
          change_type: 'minor',
          change_notes: 'Change paint color'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Minor change request submitted successfully');
      expect(response.body.requirement).toHaveProperty('status', 'Change_Request');
      expect(response.body.requirement).toHaveProperty('minor_changes_count', 1);
    });

    test('should return 400 if change requests are not allowed', async () => {
      const response = await request(app)
        .patch('/client-requirements/3/change-request')
        .send({
          change_type: 'major',
          change_notes: 'Need changes'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Change requests are not allowed for this requirement');
    });
  });

  describe('GET /client-requirements/project-type/:projectType', () => {
    test('should return requirements by project type', async () => {
      const response = await request(app).get('/client-requirements/project-type/Residential');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(3);
      response.body.forEach(req => {
        expect(req.project_type).toBe('Residential');
      });
    });
  });

  describe('GET /client-requirements/budget-range', () => {
    test('should return requirements within budget range', async () => {
      const response = await request(app)
        .get('/client-requirements/budget-range')
        .query({ min_budget: 5000000, max_budget: 10000000 });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(req => {
        expect(Number(req.approved_budget)).toBeGreaterThanOrEqual(5000000);
        expect(Number(req.approved_budget)).toBeLessThanOrEqual(10000000);
      });
    });

    test('should return 400 if budget parameters are missing', async () => {
      const response = await request(app)
        .get('/client-requirements/budget-range')
        .query({ min_budget: 5000000 });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Both min_budget and max_budget are required');
    });
  });

  describe('GET /client-requirements/pending-approval', () => {
    test('should return requirements pending approval', async () => {
      const response = await request(app).get('/client-requirements/pending-approval');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(req => {
        expect(req.status).toBe('Under_Review');
      });
    });
  });

  describe('GET /client-requirements/with-client-details', () => {
    test('should return requirements with client details', async () => {
      const response = await request(app).get('/client-requirements/with-client-details');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(5);
      expect(response.body[0]).toHaveProperty('client_name');
      expect(response.body[0]).toHaveProperty('client_email');
      expect(response.body[0]).toHaveProperty('client_phone');
      expect(response.body[0]).toHaveProperty('client_city');
    });
  });

  describe('GET /client-requirements/:id/with-client-details', () => {
    test('should return a specific requirement with client details', async () => {
      const response = await request(app).get('/client-requirements/1/with-client-details');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('client_requirement_id', 1);
      expect(response.body).toHaveProperty('requirement_title', 'Luxury Villa Requirements');
      expect(response.body).toHaveProperty('client_name', 'John');
      expect(response.body).toHaveProperty('surname', 'Doe');
      expect(response.body).toHaveProperty('client_email', 'john.doe@example.com');
      expect(response.body).toHaveProperty('client_phone', '9876543210');
      expect(response.body).toHaveProperty('client_city', 'Mumbai');
      expect(response.body).toHaveProperty('client_state', 'Maharashtra');
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app).get('/client-requirements/999/with-client-details');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Client requirement not found');
    });
  });
});
