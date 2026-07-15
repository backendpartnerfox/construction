// tests/leads_route.test.js
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
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      campaign_id SERIAL PRIMARY KEY,
      campaign_name VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(50) UNIQUE,
      campaign_id INT,
      contact_person_name VARCHAR(100) NOT NULL,
      primary_phone VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      city VARCHAR(100),
      state VARCHAR(100),
      status VARCHAR(50) DEFAULT 'New',
      FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(campaign_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      enquiry_id INT NOT NULL,
      lead_number VARCHAR(50) UNIQUE,
      lead_title VARCHAR(255),
      project_description TEXT,
      primary_contact_name VARCHAR(100),
      company_name VARCHAR(255),
      designation VARCHAR(100),
      primary_phone VARCHAR(20),
      email VARCHAR(100),
      whatsapp_number VARCHAR(20),
      site_address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      project_type VARCHAR(100),
      construction_type VARCHAR(100),
      site_area DECIMAL(12,2),
      estimated_built_up_area DECIMAL(12,2),
      number_of_floors INT,
      budget_min DECIMAL(15,2),
      budget_max DECIMAL(15,2),
      timeline_months INT,
      preferred_start_date DATE,
      is_decision_maker BOOLEAN DEFAULT FALSE,
      budget_confirmed BOOLEAN DEFAULT FALSE,
      timeline_confirmed BOOLEAN DEFAULT FALSE,
      site_ownership_confirmed BOOLEAN DEFAULT FALSE,
      approvals_status VARCHAR(100),
      stage VARCHAR(50) CHECK (stage IN ('Qualified', 'Requirement_Gathering', 'Site_Visit_Planned', 'Site_Visited', 'Quotation_Requested', 'Quotation_Sent', 'Negotiation', 'Won', 'Lost')) DEFAULT 'Qualified',
      probability_percentage INT DEFAULT 25,
      expected_closure_date DATE,
      assigned_sales_person INT NOT NULL,
      assigned_architect INT,
      assigned_engineer INT,
      total_calls_made INT DEFAULT 0,
      total_meetings_held INT DEFAULT 0,
      total_site_visits INT DEFAULT 0,
      last_interaction_date TIMESTAMP WITH TIME ZONE,
      next_action_date TIMESTAMP WITH TIME ZONE,
      next_action_description TEXT,
      requirements_finalized BOOLEAN DEFAULT FALSE,
      requirements_document_path VARCHAR(255),
      site_survey_completed BOOLEAN DEFAULT FALSE,
      site_survey_report_path VARCHAR(255),
      quotations_generated INT DEFAULT 0,
      latest_quotation_id INT,
      quotation_sent BOOLEAN DEFAULT FALSE,
      quotation_sent_date DATE,
      competitors_involved TEXT,
      competitive_advantage TEXT,
      win_loss_reason TEXT,
      closure_date DATE,
      closure_amount DECIMAL(15,2),
      converted_to_client BOOLEAN DEFAULT FALSE,
      client_conversion_date DATE,
      conversion_payment_amount DECIMAL(15,2),
      lead_notes TEXT,
      meeting_notes TEXT,
      technical_notes TEXT,
      documents_path VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id),
      FOREIGN KEY (assigned_sales_person) REFERENCES employees(employee_id),
      FOREIGN KEY (assigned_architect) REFERENCES employees(employee_id),
      FOREIGN KEY (assigned_engineer) REFERENCES employees(employee_id)
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      client_number VARCHAR(50) UNIQUE,
      client_name VARCHAR(255) NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS clients');
  await pool.query('DROP TABLE IF EXISTS leads');
  await pool.query('DROP TABLE IF EXISTS enquiries');
  await pool.query('DROP TABLE IF EXISTS marketing_campaigns');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM clients');
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM enquiries');
  await pool.query('DELETE FROM marketing_campaigns');
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
    INSERT INTO marketing_campaigns (campaign_id, campaign_name)
    VALUES (1, 'Google Ads - Residential')
  `);
  
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, campaign_id, contact_person_name, primary_phone, email, city, state)
    VALUES 
      (1, 'ENQ-24-001', 1, 'Rahul Sharma', '9876543210', 'rahul@example.com', 'Mumbai', 'Maharashtra'),
      (2, 'ENQ-24-002', 1, 'Priya Patel', '9876543211', 'priya@example.com', 'Delhi', 'Delhi'),
      (3, 'ENQ-24-003', 1, 'Amit Kumar', '9876543212', 'amit@example.com', 'Bangalore', 'Karnataka'),
      (4, 'ENQ-24-004', 1, 'Neha Singh', '9876543213', 'neha@example.com', 'Chennai', 'Tamil Nadu')
  `);
  
  await pool.query(`
    INSERT INTO leads (lead_id, enquiry_id, lead_number, lead_title, project_description,
                      primary_contact_name, primary_phone, email, city, state,
                      project_type, construction_type, site_area, estimated_built_up_area,
                      budget_min, budget_max, timeline_months, stage, probability_percentage,
                      assigned_sales_person, assigned_architect, assigned_engineer,
                      total_calls_made, total_meetings_held, created_at)
    VALUES 
      (1, 1, 'LED-24-001', 'Residential Villa - Rahul Sharma', 'Luxury villa construction project',
       'Rahul Sharma', '9876543210', 'rahul@example.com', 'Mumbai', 'Maharashtra',
       'Residential', 'New Construction', 5000, 3500, 15000000, 20000000, 18, 'Requirement_Gathering', 40,
       1, 2, 3, 5, 2, CURRENT_TIMESTAMP),
      (2, 2, 'LED-24-002', 'Commercial Complex - Priya Patel', 'Modern commercial building',
       'Priya Patel', '9876543211', 'priya@example.com', 'Delhi', 'Delhi',
       'Commercial', 'New Construction', 10000, 8000, 50000000, 75000000, 24, 'Site_Visit_Planned', 50,
       1, 2, 3, 3, 1, CURRENT_TIMESTAMP),
      (3, 3, 'LED-24-003', 'Apartment Renovation - Amit Kumar', 'Complete apartment renovation',
       'Amit Kumar', '9876543212', 'amit@example.com', 'Bangalore', 'Karnataka',
       'Residential', 'Renovation', 1500, 1500, 2500000, 3500000, 6, 'Quotation_Sent', 70,
       2, NULL, 3, 8, 3, CURRENT_TIMESTAMP),
      (4, 4, 'LED-24-004', 'Industrial Warehouse - Neha Singh', 'Large warehouse construction',
       'Neha Singh', '9876543213', 'neha@example.com', 'Chennai', 'Tamil Nadu',
       'Industrial', 'New Construction', 20000, 15000, 80000000, 100000000, 30, 'Won', 100,
       2, NULL, NULL, 10, 5, CURRENT_TIMESTAMP)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 3)");
  await pool.query("SELECT setval('marketing_campaigns_campaign_id_seq', 1)");
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 4)");
  await pool.query("SELECT setval('leads_lead_id_seq', 4)");
});

describe('Leads API', () => {
  // Test GET all leads
  test('GET /leads - should return all leads', async () => {
    const response = await request(app).get('/leads');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('lead_id');
    expect(response.body[0]).toHaveProperty('lead_number');
    expect(response.body[0]).toHaveProperty('lead_title');
    expect(response.body[0]).toHaveProperty('project_type');
    expect(response.body[0]).toHaveProperty('stage');
    expect(response.body[0]).toHaveProperty('probability_percentage');
  });
  
  // Test GET lead by ID
  test('GET /leads/:id - should return a specific lead', async () => {
    const response = await request(app).get('/leads/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('lead_number', 'LED-24-001');
    expect(response.body).toHaveProperty('lead_title', 'Residential Villa - Rahul Sharma');
    expect(response.body).toHaveProperty('primary_contact_name', 'Rahul Sharma');
    expect(response.body).toHaveProperty('project_type', 'Residential');
    expect(response.body).toHaveProperty('stage', 'Requirement_Gathering');
    expect(response.body).toHaveProperty('budget_min', '15000000');
    expect(response.body).toHaveProperty('budget_max', '20000000');
    expect(response.body).toHaveProperty('assigned_sales_person', 1);
  });
  
  // Test GET lead by ID - not found
  test('GET /leads/:id - should return 404 for non-existent lead', async () => {
    const response = await request(app).get('/leads/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Lead not found');
  });
  
  // Test POST new lead
  test('POST /leads - should create a new lead', async () => {
    // First create a new enquiry
    await pool.query(`
      INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name, primary_phone)
      VALUES (5, 'ENQ-24-005', 'Test User', '9999999999')
    `);
    
    const newLead = {
      enquiry_id: 5,
      lead_title: 'Test Project - Test User',
      project_description: 'Test project description',
      primary_contact_name: 'Test User',
      company_name: 'Test Company',
      designation: 'CEO',
      primary_phone: '9999999999',
      email: 'test@example.com',
      whatsapp_number: '9999999999',
      site_address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postal_code: '123456',
      project_type: 'Residential',
      construction_type: 'New Construction',
      site_area: 3000,
      estimated_built_up_area: 2500,
      number_of_floors: 2,
      budget_min: 5000000,
      budget_max: 7500000,
      timeline_months: 12,
      preferred_start_date: '2024-06-01',
      is_decision_maker: true,
      budget_confirmed: true,
      timeline_confirmed: true,
      site_ownership_confirmed: true,
      approvals_status: 'In_Progress',
      assigned_sales_person: 1,
      assigned_architect: 2,
      assigned_engineer: 3,
      lead_notes: 'High priority lead'
    };
    
    const response = await request(app)
      .post('/leads')
      .send(newLead);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('lead_id', 5);
    expect(response.body).toHaveProperty('lead_number');
    expect(response.body.lead_number).toMatch(/^LED-\d{2}-\d{3}$/);
    expect(response.body).toHaveProperty('lead_title', 'Test Project - Test User');
    expect(response.body).toHaveProperty('stage', 'Qualified'); // Default
    expect(response.body).toHaveProperty('probability_percentage', 25); // Default
    expect(response.body).toHaveProperty('budget_min', '5000000');
    expect(response.body).toHaveProperty('budget_max', '7500000');
  });
  
  // Test POST lead - missing required fields
  test('POST /leads - should return 400 for missing required fields', async () => {
    const incompleteLead = {
      lead_title: 'Test Project'
      // Missing enquiry_id and assigned_sales_person
    };
    
    const response = await request(app)
      .post('/leads')
      .send(incompleteLead);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update lead
  test('PUT /leads/:id - should update a lead', async () => {
    const updatedData = {
      lead_title: 'Updated Villa Project - Rahul Sharma',
      project_description: 'Updated luxury villa construction project',
      site_area: 5500,
      estimated_built_up_area: 4000,
      budget_min: 18000000,
      budget_max: 25000000,
      timeline_months: 20,
      stage: 'Site_Visited',
      probability_percentage: 60,
      site_survey_completed: true,
      requirements_finalized: true,
      next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      next_action_description: 'Send detailed quotation',
      meeting_notes: 'Client approved the design concepts'
    };
    
    const response = await request(app)
      .put('/leads/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('lead_title', 'Updated Villa Project - Rahul Sharma');
    expect(response.body).toHaveProperty('site_area', '5500');
    expect(response.body).toHaveProperty('budget_max', '25000000');
    expect(response.body).toHaveProperty('stage', 'Site_Visited');
    expect(response.body).toHaveProperty('probability_percentage', 60);
    expect(response.body).toHaveProperty('site_survey_completed', true);
  });
  
  // Test PUT lead - not found
  test('PUT /leads/:id - should return 404 for non-existent lead', async () => {
    const updatedData = {
      lead_title: 'Non-existent Lead',
      stage: 'Qualified'
    };
    
    const response = await request(app)
      .put('/leads/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Lead not found');
  });
  
  // Test DELETE lead
  test('DELETE /leads/:id - should delete a lead without clients', async () => {
    const response = await request(app).delete('/leads/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Lead deleted successfully');
    
    // Verify lead was actually deleted
    const deletedLead = await request(app).get('/leads/3');
    expect(deletedLead.status).toBe(404);
  });
  
  // Test DELETE lead - not found
  test('DELETE /leads/:id - should return 404 for non-existent lead', async () => {
    const response = await request(app).delete('/leads/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Lead not found');
  });
  
  // Test GET leads by stage
  test('GET /leads/stage/:stage - should return leads in specific stage', async () => {
    const response = await request(app).get('/leads/stage/Requirement_Gathering');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('stage', 'Requirement_Gathering');
    expect(response.body[0]).toHaveProperty('lead_number', 'LED-24-001');
  });
  
  // Test GET leads by sales person
  test('GET /leads/sales-person/:salesPersonId - should return leads assigned to specific sales person', async () => {
    const response = await request(app).get('/leads/sales-person/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(lead => {
      expect(lead.assigned_sales_person).toBe(1);
    });
  });
  
  // Test GET active leads
  test('GET /leads/active - should return active leads (not Won or Lost)', async () => {
    const response = await request(app).get('/leads/active');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3); // All except the Won lead
    response.body.forEach(lead => {
      expect(['Won', 'Lost']).not.toContain(lead.stage);
    });
  });
  
  // Test search leads
  test('GET /leads/search - should search leads by various fields', async () => {
    const response = await request(app).get('/leads/search?query=villa');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('lead_title');
    expect(response.body[0].lead_title).toContain('Villa');
    
    // Search by contact name
    const nameResponse = await request(app).get('/leads/search?query=priya');
    expect(nameResponse.status).toBe(200);
    expect(nameResponse.body.length).toBe(1);
    expect(nameResponse.body[0]).toHaveProperty('primary_contact_name', 'Priya Patel');
    
    // Search by city
    const cityResponse = await request(app).get('/leads/search?query=bangalore');
    expect(cityResponse.status).toBe(200);
    expect(cityResponse.body.length).toBe(1);
    expect(cityResponse.body[0]).toHaveProperty('city', 'Bangalore');
  });
  
  // Test update lead stage
  test('PUT /leads/:id/stage - should update lead stage and probability', async () => {
    const stageData = {
      stage: 'Quotation_Sent',
      probability_percentage: 75,
      stage_notes: 'Quotation sent to client via email'
    };
    
    const response = await request(app)
      .put('/leads/1/stage')
      .send(stageData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('stage', 'Quotation_Sent');
    expect(response.body).toHaveProperty('probability_percentage', 75);
  });
  
  // Test convert lead to client
  test('PUT /leads/:id/convert-to-client - should convert lead to client', async () => {
    const conversionData = {
      client_name: 'Amit Kumar',
      advance_received: 500000,
      advance_payment_date: '2024-03-15',
      payment_method: 'Bank_Transfer',
      payment_reference: 'TXN123456789',
      contract_signed: true,
      contract_date: '2024-03-15',
      project_start_date: '2024-04-01'
    };
    
    const response = await request(app)
      .put('/leads/3/convert-to-client')
      .send(conversionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_id', 3);
    expect(response.body).toHaveProperty('converted_to_client', true);
    expect(response.body).toHaveProperty('client_conversion_date');
    expect(response.body).toHaveProperty('stage', 'Won');
    expect(response.body).toHaveProperty('probability_percentage', 100);
  });
  
  // Test close lead as lost
  test('PUT /leads/:id/close-lost - should close lead as lost', async () => {
    const lostData = {
      win_loss_reason: 'Budget constraints - client opted for a cheaper competitor',
      competitors_involved: 'XYZ Builders, ABC Construction',
      closure_notes: 'Client found our pricing too high'
    };
    
    const response = await request(app)
      .put('/leads/2/close-lost')
      .send(lostData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_id', 2);
    expect(response.body).toHaveProperty('stage', 'Lost');
    expect(response.body).toHaveProperty('probability_percentage', 0);
    expect(response.body).toHaveProperty('win_loss_reason');
    expect(response.body).toHaveProperty('closure_date');
  });
  
  // Test GET lead statistics
  test('GET /leads/statistics - should return lead statistics', async () => {
    const response = await request(app).get('/leads/statistics');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_leads', 4);
    expect(response.body).toHaveProperty('by_stage');
    expect(response.body).toHaveProperty('by_project_type');
    expect(response.body).toHaveProperty('total_pipeline_value');
    expect(response.body).toHaveProperty('average_probability');
    expect(response.body).toHaveProperty('conversion_rate');
    expect(response.body.by_stage).toHaveProperty('Requirement_Gathering', 1);
    expect(response.body.by_stage).toHaveProperty('Won', 1);
  });
  
  // Test record interaction
  test('PUT /leads/:id/record-interaction - should record an interaction', async () => {
    const interactionData = {
      interaction_type: 'call',
      interaction_notes: 'Discussed project requirements in detail',
      next_action_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      next_action_description: 'Schedule site visit'
    };
    
    const response = await request(app)
      .put('/leads/1/record-interaction')
      .send(interactionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('lead_id', 1);
    expect(response.body).toHaveProperty('total_calls_made', 6); // Was 5, now 6
    expect(response.body).toHaveProperty('last_interaction_date');
    expect(response.body).toHaveProperty('next_action_date');
    expect(response.body).toHaveProperty('next_action_description');
  });
});
