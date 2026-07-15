// tests/lead_requirements_route_FIXED.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Create test database tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      lead_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_requirements (
      lead_requirement_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      requirement_number VARCHAR(50),
      requirement_title VARCHAR(255) NOT NULL,
      requirement_description TEXT,
      project_type VARCHAR(100),
      construction_type VARCHAR(100),
      site_area DECIMAL(10,2),
      site_area_unit VARCHAR(20) DEFAULT 'sqft',
      built_up_area DECIMAL(10,2),
      carpet_area DECIMAL(10,2),
      number_of_floors INT,
      number_of_bedrooms INT,
      number_of_bathrooms INT,
      budget_range_min DECIMAL(15,2),
      budget_range_max DECIMAL(15,2),
      quality_preference VARCHAR(50),
      package_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INT,
      updated_by INT,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS lead_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS leads CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM lead_requirements');
  await pool.query('DELETE FROM leads');
  
  // Insert test data
  await pool.query(`
    INSERT INTO leads (lead_id, lead_name)
    VALUES 
      (1, 'Test Lead 1'),
      (2, 'Test Lead 2'),
      (3, 'Test Lead 3')
  `);
  
  await pool.query(`
    INSERT INTO lead_requirements (
      lead_requirement_id, lead_id, requirement_number, requirement_title,
      requirement_description, project_type, construction_type,
      site_area, built_up_area, number_of_floors, number_of_bedrooms,
      number_of_bathrooms, budget_range_min, budget_range_max,
      quality_preference, package_type, status, created_by
    )
    VALUES 
      (1, 1, 'REQ-LED-24-001-01', 'Luxury Villa Requirements',
       'Requirements for a luxury villa with modern amenities', 'Residential', 'New Construction',
       2400, 2000, 2, 3, 3, 5000000, 7500000,
       'Premium', 'Standard Package', 'Finalized', 1),
      (2, 1, 'REQ-LED-24-001-02', 'Guest House Requirements',
       'Requirements for guest house in the same property', 'Residential', 'New Construction',
       800, 600, 1, 1, 1, 2000000, 3000000,
       'Standard', 'Basic Package', 'Draft', 1),
      (3, 2, 'REQ-LED-24-002-01', 'Office Space Requirements',
       'Requirements for modern office space', 'Commercial', 'New Construction',
       5000, 4500, 3, 0, 4, 20000000, 30000000,
       'Premium', 'Premium Package', 'Finalized', 1),
      (4, 3, 'REQ-LED-24-003-01', 'Apartment Complex',
       'Requirements for apartment complex development', 'Residential', 'New Construction',
       10000, 8000, 5, 20, 20, 50000000, 75000000,
       'Standard', 'Standard Package', 'Draft', 1),
      (5, 1, 'REQ-LED-24-001-03', 'Beach Villa Specifications',
       'Specifications for villa near the beach', 'Residential', 'New Construction',
       3000, 2500, 2, 4, 4, 10000000, 15000000,
       'Luxury', 'Premium Package', 'Finalized', 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('leads_lead_id_seq', 3)");
  await pool.query("SELECT setval('lead_requirements_lead_requirement_id_seq', 5)");
});

describe('Lead Requirements Route Tests', () => {
  describe('GET /lead-requirements', () => {
    test('should return all lead requirements', async () => {
      const response = await request(app).get('/lead-requirements');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(5);
      expect(response.body[0]).toHaveProperty('lead_requirement_id');
      expect(response.body[0]).toHaveProperty('requirement_title');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /lead-requirements/:id', () => {
    test('should return a specific lead requirement', async () => {
      const response = await request(app).get('/lead-requirements/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lead_requirement_id', 1);
      expect(response.body).toHaveProperty('requirement_title', 'Luxury Villa Requirements');
      expect(response.body).toHaveProperty('project_type', 'Residential');
      expect(response.body).toHaveProperty('status', 'Finalized');
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app).get('/lead-requirements/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Lead requirement not found');
    });
  });

  describe('POST /lead-requirements', () => {
    test('should create a new lead requirement', async () => {
      const newRequirement = {
        lead_id: 2,
        requirement_number: 'REQ-LED-24-002-02',
        requirement_title: 'Warehouse Requirements',
        requirement_description: 'Requirements for warehouse facility',
        project_type: 'Commercial',
        construction_type: 'New Construction',
        site_area: 15000,
        built_up_area: 12000,
        number_of_floors: 1,
        budget_range_min: 25000000,
        budget_range_max: 35000000,
        quality_preference: 'Standard',
        package_type: 'Standard Package',
        created_by: 1
      };

      const response = await request(app)
        .post('/lead-requirements')
        .send(newRequirement);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('lead_requirement_id', 6);
      expect(response.body).toHaveProperty('requirement_title', 'Warehouse Requirements');
      expect(response.body).toHaveProperty('status', 'Draft');
      expect(response.body).toHaveProperty('site_area_unit', 'sqft');
    });

    test('should return 400 if required fields are missing', async () => {
      const invalidRequirement = {
        requirement_title: 'Test Requirement'
        // Missing lead_id
      };

      const response = await request(app)
        .post('/lead-requirements')
        .send(invalidRequirement);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Lead ID and Requirement Title are required');
    });
  });

  describe('PUT /lead-requirements/:id', () => {
    test('should update an existing lead requirement', async () => {
      const updateData = {
        lead_id: 1,
        requirement_title: 'Updated Luxury Villa Requirements',
        requirement_description: 'Updated description with more details',
        project_type: 'Residential',
        construction_type: 'New Construction',
        site_area: 2500,
        built_up_area: 2100,
        number_of_floors: 3,
        number_of_bedrooms: 4,
        number_of_bathrooms: 4,
        budget_range_min: 7000000,
        budget_range_max: 9000000,
        quality_preference: 'Premium',
        package_type: 'Premium Package',
        status: 'Finalized',
        updated_by: 2
      };

      const response = await request(app)
        .put('/lead-requirements/1')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lead_requirement_id', 1);
      expect(response.body).toHaveProperty('requirement_title', 'Updated Luxury Villa Requirements');
      expect(response.body).toHaveProperty('site_area', '2500.00');
      expect(response.body).toHaveProperty('updated_by', 2);
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app)
        .put('/lead-requirements/999')
        .send({
          lead_id: 1,
          requirement_title: 'Test Update'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Lead requirement not found');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .put('/lead-requirements/1')
        .send({
          requirement_title: 'Test Update'
          // Missing lead_id
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Lead ID and Requirement Title are required');
    });
  });

  describe('DELETE /lead-requirements/:id', () => {
    test('should delete a lead requirement', async () => {
      const response = await request(app).delete('/lead-requirements/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Lead requirement deleted successfully');
      
      // Verify deletion
      const checkResponse = await request(app).get('/lead-requirements/4');
      expect(checkResponse.status).toBe(404);
    });

    test('should return 404 if requirement not found', async () => {
      const response = await request(app).delete('/lead-requirements/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Lead requirement not found');
    });
  });

  describe('GET /lead-requirements/lead/:leadId', () => {
    test('should return all requirements for a specific lead', async () => {
      const response = await request(app).get('/lead-requirements/lead/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(3);
      response.body.forEach(req => {
        expect(req.lead_id).toBe(1);
      });
    });

    test('should return empty array if no requirements found for lead', async () => {
      // Create a lead with no requirements
      await pool.query("INSERT INTO leads (lead_id, lead_name) VALUES (4, 'Lead with no requirements')");
      
      const response = await request(app).get('/lead-requirements/lead/4');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /lead-requirements/status/:status', () => {
    test('should return requirements with specific status', async () => {
      const response = await request(app).get('/lead-requirements/status/Finalized');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(3);
      response.body.forEach(req => {
        expect(req.status).toBe('Finalized');
      });
    });

    test('should handle different status values', async () => {
      const response = await request(app).get('/lead-requirements/status/Draft');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(req => {
        expect(req.status).toBe('Draft');
      });
    });
  });

  describe('GET /lead-requirements/search', () => {
    test('should search requirements by title and description', async () => {
      const response = await request(app)
        .get('/lead-requirements/search')
        .query({ query: 'villa' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      
      const titles = response.body.map(req => req.requirement_title);
      expect(titles).toContain('Luxury Villa Requirements');
      expect(titles).toContain('Beach Villa Specifications');
    });

    test('should return 400 if search query is missing', async () => {
      const response = await request(app).get('/lead-requirements/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });

    test('should handle special characters in search query', async () => {
      const response = await request(app)
        .get('/lead-requirements/search')
        .query({ query: "Villa's & Co." });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/lead-requirements/search')
        .query({ query: 'nonexistent' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
