// tests/enquiry_requirements_route.test.js
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
      enquiry_number VARCHAR(100),
      contact_person_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiry_requirements (
      enquiry_requirement_id SERIAL PRIMARY KEY,
      enquiry_id INTEGER REFERENCES enquiries(enquiry_id),
      requirement_number VARCHAR(100),
      requirement_title VARCHAR(200) NOT NULL,
      requirement_description TEXT,
      project_type VARCHAR(100),
      construction_type VARCHAR(100),
      site_area NUMERIC,
      site_area_unit VARCHAR(20) DEFAULT 'sqft',
      built_up_area NUMERIC,
      number_of_floors INTEGER,
      number_of_bedrooms INTEGER,
      number_of_bathrooms INTEGER,
      budget_range_min NUMERIC,
      budget_range_max NUMERIC,
      expected_start_date DATE,
      expected_completion_months INTEGER,
      priority_level VARCHAR(20) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'Draft',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS enquiry_requirements');
  await pool.query('DROP TABLE IF EXISTS enquiries');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM enquiry_requirements');
  await pool.query('DELETE FROM enquiries');
  
  // Insert test data
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name)
    VALUES 
      (1, 'ENQ-001', 'John Doe'),
      (2, 'ENQ-002', 'Jane Smith')
  `);
  
  await pool.query(`
    INSERT INTO enquiry_requirements (
      enquiry_requirement_id, enquiry_id, requirement_number, requirement_title,
      requirement_description, project_type, construction_type, site_area,
      built_up_area, number_of_floors, number_of_bedrooms, number_of_bathrooms,
      budget_range_min, budget_range_max, priority_level, status, created_by
    )
    VALUES 
      (1, 1, 'REQ-001', '3 BHK Villa Construction', 
       'Modern villa with contemporary design', 'Residential', 'New Construction', 
       3000.00, 2400.00, 2, 3, 3, 4000000.00, 5000000.00, 'High', 'Active', 1),
      (2, 1, 'REQ-002', 'Landscaping and Garden', 
       'Garden design with water features', 'Landscaping', 'New Installation', 
       1000.00, NULL, NULL, NULL, NULL, 300000.00, 500000.00, 'Medium', 'Active', 1),
      (3, 2, 'REQ-003', 'Office Interior Design', 
       'Complete office interior renovation', 'Commercial', 'Interior Design', 
       2000.00, 2000.00, 1, NULL, 4, 800000.00, 1200000.00, 'High', 'Draft', 2)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 2)");
  await pool.query("SELECT setval('enquiry_requirements_enquiry_requirement_id_seq', 3)");
});

describe('Enquiry Requirements API', () => {
  // Test GET all requirements
  test('GET /enquiry-requirements - should return all enquiry requirements', async () => {
    const response = await request(app).get('/enquiry-requirements');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('enquiry_requirement_id');
    expect(response.body[0]).toHaveProperty('enquiry_id');
    expect(response.body[0]).toHaveProperty('requirement_title');
  });
  
  // Test GET requirement by ID
  test('GET /enquiry-requirements/:id - should return a specific requirement', async () => {
    const response = await request(app).get('/enquiry-requirements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_requirement_id', 1);
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('requirement_number', 'REQ-001');
    expect(response.body).toHaveProperty('requirement_title', '3 BHK Villa Construction');
    expect(response.body).toHaveProperty('project_type', 'Residential');
    expect(response.body).toHaveProperty('construction_type', 'New Construction');
  });
  
  // Test GET requirement by ID - not found
  test('GET /enquiry-requirements/:id - should return 404 for non-existent requirement', async () => {
    const response = await request(app).get('/enquiry-requirements/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry requirement not found');
  });
  
  // Test POST new requirement
  test('POST /enquiry-requirements - should create a new enquiry requirement', async () => {
    const newRequirement = {
      enquiry_id: 2,
      requirement_number: 'REQ-004',
      requirement_title: 'Swimming Pool Construction',
      requirement_description: 'Outdoor swimming pool with deck',
      project_type: 'Recreation',
      construction_type: 'New Construction',
      site_area: 800.00,
      budget_range_min: 1500000.00,
      budget_range_max: 2000000.00,
      priority_level: 'Medium',
      status: 'Active',
      created_by: 2
    };
    
    const response = await request(app)
      .post('/enquiry-requirements')
      .send(newRequirement);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_requirement_id', 4);
    expect(response.body).toHaveProperty('enquiry_id', 2);
    expect(response.body).toHaveProperty('requirement_title', 'Swimming Pool Construction');
    expect(response.body).toHaveProperty('project_type', 'Recreation');
  });
  
  // Test POST requirement - missing required fields
  test('POST /enquiry-requirements - should return 400 for missing required fields', async () => {
    const incompleteRequirement = {
      enquiry_id: 1,
      // Missing requirement_title
      requirement_description: 'Some description'
    };
    
    const response = await request(app)
      .post('/enquiry-requirements')
      .send(incompleteRequirement);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update requirement
  test('PUT /enquiry-requirements/:id - should update an enquiry requirement', async () => {
    const updatedRequirement = {
      enquiry_id: 1,
      requirement_number: 'REQ-001-UPDATED',
      requirement_title: 'Updated 3 BHK Villa Construction',
      requirement_description: 'Updated modern villa with smart home features',
      project_type: 'Residential',
      construction_type: 'New Construction',
      site_area: 3500.00,
      built_up_area: 2800.00,
      number_of_floors: 2,
      number_of_bedrooms: 4,
      number_of_bathrooms: 4,
      budget_range_min: 4500000.00,
      budget_range_max: 5500000.00,
      priority_level: 'High',
      status: 'Active',
      created_by: 1
    };
    
    const response = await request(app)
      .put('/enquiry-requirements/1')
      .send(updatedRequirement);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_requirement_id', 1);
    expect(response.body).toHaveProperty('requirement_title', 'Updated 3 BHK Villa Construction');
    expect(response.body).toHaveProperty('site_area', '3500');
    expect(response.body).toHaveProperty('number_of_bedrooms', 4);
  });
  
  // Test DELETE requirement
  test('DELETE /enquiry-requirements/:id - should delete an enquiry requirement', async () => {
    const response = await request(app).delete('/enquiry-requirements/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Enquiry requirement deleted successfully');
    
    // Verify requirement was deleted
    const getResponse = await request(app).get('/enquiry-requirements/1');
    expect(getResponse.status).toBe(404);
  });
  
  // Test GET requirements by enquiry
  test('GET /enquiry-requirements/enquiry/:enquiryId - should return requirements for an enquiry', async () => {
    const response = await request(app).get('/enquiry-requirements/enquiry/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(req => req.enquiry_id === 1)).toBeTruthy();
  });
  
  // Test GET requirements by status
  test('GET /enquiry-requirements/status/Active - should return active requirements', async () => {
    const response = await request(app).get('/enquiry-requirements/status/Active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(req => req.status === 'Active')).toBeTruthy();
  });
  
  // Test GET requirements by priority
  test('GET /enquiry-requirements/priority/High - should return high priority requirements', async () => {
    const response = await request(app).get('/enquiry-requirements/priority/High');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(req => req.priority_level === 'High')).toBeTruthy();
  });
  
  // Test search functionality
  test('GET /enquiry-requirements/search?query=Villa - should search requirements', async () => {
    const response = await request(app).get('/enquiry-requirements/search?query=Villa');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });
  
  // Test search without query
  test('GET /enquiry-requirements/search - should return 400 for missing query', async () => {
    const response = await request(app).get('/enquiry-requirements/search');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Search query is required');
  });
});