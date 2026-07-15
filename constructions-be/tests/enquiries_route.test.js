// tests/enquiries_route.test.js
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
      campaign_type VARCHAR(100),
      platform VARCHAR(100),
      campaign_start_date DATE,
      campaign_end_date DATE,
      budget_allocated DECIMAL(12,2),
      n8n_webhook_url VARCHAR(500),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(50) UNIQUE,
      campaign_id INT,
      n8n_webhook_data JSONB,
      contact_person_name VARCHAR(100) NOT NULL,
      contact_surname VARCHAR(100),
      company_name VARCHAR(255),
      primary_phone VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      whatsapp_number VARCHAR(20),
      city VARCHAR(100),
      state VARCHAR(100),
      project_type VARCHAR(100),
      construction_type VARCHAR(100),
      approximate_area DECIMAL(12,2),
      area_unit VARCHAR(20) DEFAULT 'sqft',
      budget_range VARCHAR(100),
      expected_timeline VARCHAR(100),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      utm_content VARCHAR(100),
      referrer_url VARCHAR(500),
      landing_page VARCHAR(500),
      device_type VARCHAR(50),
      browser VARCHAR(50),
      ip_address INET,
      crm_classification VARCHAR(20) CHECK (crm_classification IN ('Hot', 'Cold', 'Medium')) DEFAULT 'Cold',
      classification_reason TEXT,
      classification_date TIMESTAMP WITH TIME ZONE,
      classification_by INT,
      has_specific_location BOOLEAN DEFAULT FALSE,
      has_realistic_budget BOOLEAN DEFAULT FALSE,
      has_immediate_timeline BOOLEAN DEFAULT FALSE,
      is_repeat_visitor BOOLEAN DEFAULT FALSE,
      form_completion_quality DECIMAL(3,2),
      assigned_to INT,
      assignment_date TIMESTAMP WITH TIME ZONE,
      call_scheduled BOOLEAN DEFAULT FALSE,
      scheduled_call_date TIMESTAMP WITH TIME ZONE,
      whatsapp_sent BOOLEAN DEFAULT FALSE,
      whatsapp_sent_date TIMESTAMP WITH TIME ZONE,
      whatsapp_template_used VARCHAR(100),
      first_call_attempted BOOLEAN DEFAULT FALSE,
      first_call_date TIMESTAMP WITH TIME ZONE,
      first_call_status VARCHAR(50),
      status VARCHAR(50) CHECK (status IN ('New', 'WhatsApp_Sent', 'Call_Scheduled', 'Called', 'Interested', 'Not_Interested', 'Converted_to_Lead', 'Lost')) DEFAULT 'New',
      converted_to_lead BOOLEAN DEFAULT FALSE,
      lead_conversion_date TIMESTAMP WITH TIME ZONE,
      conversion_reason TEXT,
      enquiry_notes TEXT,
      call_notes TEXT,
      internal_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(campaign_id),
      FOREIGN KEY (assigned_to) REFERENCES employees(employee_id),
      FOREIGN KEY (classification_by) REFERENCES employees(employee_id)
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
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS leads');
  await pool.query('DROP TABLE IF EXISTS enquiries');
  await pool.query('DROP TABLE IF EXISTS marketing_campaigns');
  await pool.query('DROP TABLE IF EXISTS employees');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM leads');
  await pool.query('DELETE FROM enquiries');
  await pool.query('DELETE FROM marketing_campaigns');
  await pool.query('DELETE FROM employees');
  
  // Insert test data
  await pool.query(`
    INSERT INTO employees (employee_id, first_name, last_name, email)
    VALUES 
      (1, 'John', 'Doe', 'john.doe@company.com'),
      (2, 'Jane', 'Smith', 'jane.smith@company.com')
  `);
  
  await pool.query(`
    INSERT INTO marketing_campaigns (campaign_id, campaign_name, campaign_type, platform, utm_source, utm_medium, utm_campaign, is_active)
    VALUES 
      (1, 'Google Ads - Residential', 'Google_Ads', 'Google', 'google', 'cpc', 'residential_2024', true),
      (2, 'Facebook - Commercial', 'Facebook_Ads', 'Facebook', 'facebook', 'social', 'commercial_2024', true),
      (3, 'Instagram - Luxury', 'Instagram', 'Instagram', 'instagram', 'social', 'luxury_2024', false)
  `);
  
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, campaign_id, contact_person_name, contact_surname, 
                          primary_phone, email, city, state, project_type, construction_type, 
                          approximate_area, budget_range, expected_timeline, crm_classification, 
                          status, assigned_to, created_at)
    VALUES 
      (1, 'ENQ-24-001', 1, 'Rahul', 'Sharma', '9876543210', 'rahul@example.com', 'Mumbai', 'Maharashtra',
       'Residential', 'New', 2500, '50-75 Lakhs', '6-12 months', 'Hot', 'New', 1, CURRENT_TIMESTAMP),
      (2, 'ENQ-24-002', 1, 'Priya', 'Patel', '9876543211', 'priya@example.com', 'Delhi', 'Delhi',
       'Commercial', 'New', 5000, '1-2 Crores', '12-18 months', 'Medium', 'WhatsApp_Sent', 1, CURRENT_TIMESTAMP),
      (3, 'ENQ-24-003', 2, 'Amit', 'Kumar', '9876543212', 'amit@example.com', 'Bangalore', 'Karnataka',
       'Residential', 'Renovation', 1500, '25-50 Lakhs', '3-6 months', 'Cold', 'Called', 2, CURRENT_TIMESTAMP),
      (4, 'ENQ-24-004', NULL, 'Neha', 'Singh', '9876543213', 'neha@example.com', 'Chennai', 'Tamil Nadu',
       'Industrial', 'New', 10000, '5+ Crores', '18-24 months', 'Hot', 'Converted_to_Lead', 2, CURRENT_TIMESTAMP)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('employees_employee_id_seq', 2)");
  await pool.query("SELECT setval('marketing_campaigns_campaign_id_seq', 3)");
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 4)");
});

describe('Enquiries API', () => {
  // Test GET all enquiries
  test('GET /enquiries - should return all enquiries', async () => {
    const response = await request(app).get('/enquiries');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('enquiry_id');
    expect(response.body[0]).toHaveProperty('enquiry_number');
    expect(response.body[0]).toHaveProperty('contact_person_name');
    expect(response.body[0]).toHaveProperty('project_type');
    expect(response.body[0]).toHaveProperty('crm_classification');
    expect(response.body[0]).toHaveProperty('status');
  });
  
  // Test GET enquiry by ID
  test('GET /enquiries/:id - should return a specific enquiry', async () => {
    const response = await request(app).get('/enquiries/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('enquiry_number', 'ENQ-24-001');
    expect(response.body).toHaveProperty('contact_person_name', 'Rahul');
    expect(response.body).toHaveProperty('contact_surname', 'Sharma');
    expect(response.body).toHaveProperty('primary_phone', '9876543210');
    expect(response.body).toHaveProperty('project_type', 'Residential');
    expect(response.body).toHaveProperty('crm_classification', 'Hot');
    expect(response.body).toHaveProperty('status', 'New');
  });
  
  // Test GET enquiry by ID - not found
  test('GET /enquiries/:id - should return 404 for non-existent enquiry', async () => {
    const response = await request(app).get('/enquiries/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry not found');
  });
  
  // Test POST new enquiry
  test('POST /enquiries - should create a new enquiry', async () => {
    const newEnquiry = {
      campaign_id: 1,
      contact_person_name: 'Vijay',
      contact_surname: 'Kumar',
      company_name: 'VK Enterprises',
      primary_phone: '9876543214',
      email: 'vijay@vkenterprises.com',
      whatsapp_number: '9876543214',
      city: 'Pune',
      state: 'Maharashtra',
      project_type: 'Commercial',
      construction_type: 'New',
      approximate_area: 3500,
      budget_range: '75 Lakhs - 1 Crore',
      expected_timeline: '12-18 months',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'residential_2024',
      device_type: 'Mobile',
      browser: 'Chrome',
      has_specific_location: true,
      has_realistic_budget: true,
      has_immediate_timeline: false,
      enquiry_notes: 'Looking for modern office space'
    };
    
    const response = await request(app)
      .post('/enquiries')
      .send(newEnquiry);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('enquiry_id', 5);
    expect(response.body).toHaveProperty('enquiry_number');
    expect(response.body.enquiry_number).toMatch(/^ENQ-\d{2}-\d{3}$/);
    expect(response.body).toHaveProperty('contact_person_name', 'Vijay');
    expect(response.body).toHaveProperty('city', 'Pune');
    expect(response.body).toHaveProperty('project_type', 'Commercial');
    expect(response.body).toHaveProperty('crm_classification', 'Cold'); // Default
    expect(response.body).toHaveProperty('status', 'New');
  });
  
  // Test POST enquiry - missing required fields
  test('POST /enquiries - should return 400 for missing required fields', async () => {
    const incompleteEnquiry = {
      campaign_id: 1,
      email: 'test@example.com'
      // Missing contact_person_name and primary_phone
    };
    
    const response = await request(app)
      .post('/enquiries')
      .send(incompleteEnquiry);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update enquiry
  test('PUT /enquiries/:id - should update an enquiry', async () => {
    const updatedData = {
      contact_person_name: 'Rahul Kumar',
      contact_surname: 'Sharma',
      primary_phone: '9876543210',
      email: 'rahul.kumar@example.com',
      city: 'Mumbai',
      state: 'Maharashtra',
      project_type: 'Residential',
      construction_type: 'New',
      approximate_area: 3000,
      budget_range: '75 Lakhs - 1 Crore',
      expected_timeline: '9-12 months',
      crm_classification: 'Hot',
      status: 'Call_Scheduled',
      assigned_to: 2,
      call_scheduled: true,
      scheduled_call_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      internal_notes: 'High priority client'
    };
    
    const response = await request(app)
      .put('/enquiries/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('contact_person_name', 'Rahul Kumar');
    expect(response.body).toHaveProperty('email', 'rahul.kumar@example.com');
    expect(response.body).toHaveProperty('approximate_area', '3000');
    expect(response.body).toHaveProperty('status', 'Call_Scheduled');
    expect(response.body).toHaveProperty('assigned_to', 2);
    expect(response.body).toHaveProperty('call_scheduled', true);
  });
  
  // Test PUT enquiry - not found
  test('PUT /enquiries/:id - should return 404 for non-existent enquiry', async () => {
    const updatedData = {
      contact_person_name: 'Test User',
      primary_phone: '9999999999'
    };
    
    const response = await request(app)
      .put('/enquiries/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry not found');
  });
  
  // Test DELETE enquiry
  test('DELETE /enquiries/:id - should delete an enquiry without leads', async () => {
    const response = await request(app).delete('/enquiries/3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Enquiry deleted successfully');
    
    // Verify enquiry was actually deleted
    const deletedEnquiry = await request(app).get('/enquiries/3');
    expect(deletedEnquiry.status).toBe(404);
  });
  
  // Test DELETE enquiry - not found
  test('DELETE /enquiries/:id - should return 404 for non-existent enquiry', async () => {
    const response = await request(app).delete('/enquiries/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Enquiry not found');
  });
  
  // Test GET enquiries by status
  test('GET /enquiries/status/:status - should return enquiries with specific status', async () => {
    const response = await request(app).get('/enquiries/status/New');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('status', 'New');
    expect(response.body[0]).toHaveProperty('enquiry_number', 'ENQ-24-001');
  });
  
  // Test GET enquiries by classification
  test('GET /enquiries/classification/:classification - should return enquiries with specific classification', async () => {
    const response = await request(app).get('/enquiries/classification/Hot');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(enquiry => {
      expect(enquiry.crm_classification).toBe('Hot');
    });
  });
  
  // Test GET enquiries by campaign
  test('GET /enquiries/campaign/:campaignId - should return enquiries from specific campaign', async () => {
    const response = await request(app).get('/enquiries/campaign/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(enquiry => {
      expect(enquiry.campaign_id).toBe(1);
    });
  });
  
  // Test GET enquiries assigned to employee
  test('GET /enquiries/assigned/:employeeId - should return enquiries assigned to specific employee', async () => {
    const response = await request(app).get('/enquiries/assigned/2');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    response.body.forEach(enquiry => {
      expect(enquiry.assigned_to).toBe(2);
    });
  });
  
  // Test search enquiries
  test('GET /enquiries/search - should search enquiries by various fields', async () => {
    const response = await request(app).get('/enquiries/search?query=rahul');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('contact_person_name', 'Rahul');
    
    // Search by phone
    const phoneResponse = await request(app).get('/enquiries/search?query=9876543211');
    expect(phoneResponse.status).toBe(200);
    expect(phoneResponse.body.length).toBe(1);
    expect(phoneResponse.body[0]).toHaveProperty('contact_person_name', 'Priya');
    
    // Search by city
    const cityResponse = await request(app).get('/enquiries/search?query=bangalore');
    expect(cityResponse.status).toBe(200);
    expect(cityResponse.body.length).toBe(1);
    expect(cityResponse.body[0]).toHaveProperty('city', 'Bangalore');
  });
  
  // Test classify enquiry
  test('PUT /enquiries/:id/classify - should classify an enquiry', async () => {
    const classificationData = {
      crm_classification: 'Hot',
      classification_reason: 'High budget, immediate timeline, specific requirements',
      classification_by: 2,
      has_specific_location: true,
      has_realistic_budget: true,
      has_immediate_timeline: true,
      form_completion_quality: 0.95
    };
    
    const response = await request(app)
      .put('/enquiries/3/classify')
      .send(classificationData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_id', 3);
    expect(response.body).toHaveProperty('crm_classification', 'Hot');
    expect(response.body).toHaveProperty('classification_reason');
    expect(response.body).toHaveProperty('classification_by', 2);
    expect(response.body).toHaveProperty('classification_date');
  });
  
  // Test convert enquiry to lead
  test('PUT /enquiries/:id/convert-to-lead - should convert enquiry to lead', async () => {
    const conversionData = {
      conversion_reason: 'Client ready to proceed with project',
      lead_data: {
        lead_title: 'Residential Villa Project - Amit Kumar',
        project_description: 'Renovation of existing residential property'
      }
    };
    
    const response = await request(app)
      .put('/enquiries/3/convert-to-lead')
      .send(conversionData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_id', 3);
    expect(response.body).toHaveProperty('converted_to_lead', true);
    expect(response.body).toHaveProperty('status', 'Converted_to_Lead');
    expect(response.body).toHaveProperty('lead_conversion_date');
    expect(response.body).toHaveProperty('conversion_reason');
  });
  
  // Test GET enquiry statistics
  test('GET /enquiries/statistics - should return enquiry statistics', async () => {
    const response = await request(app).get('/enquiries/statistics');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_enquiries', 4);
    expect(response.body).toHaveProperty('by_status');
    expect(response.body).toHaveProperty('by_classification');
    expect(response.body).toHaveProperty('by_project_type');
    expect(response.body).toHaveProperty('conversion_rate');
    expect(response.body.by_status).toHaveProperty('New', 1);
    expect(response.body.by_status).toHaveProperty('WhatsApp_Sent', 1);
    expect(response.body.by_classification).toHaveProperty('Hot', 2);
    expect(response.body.by_classification).toHaveProperty('Cold', 1);
  });
  
  // Test update WhatsApp status
  test('PUT /enquiries/:id/whatsapp-status - should update WhatsApp status', async () => {
    const whatsappData = {
      whatsapp_sent: true,
      whatsapp_template_used: 'Welcome_Template_1'
    };
    
    const response = await request(app)
      .put('/enquiries/1/whatsapp-status')
      .send(whatsappData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('whatsapp_sent', true);
    expect(response.body).toHaveProperty('whatsapp_sent_date');
    expect(response.body).toHaveProperty('whatsapp_template_used', 'Welcome_Template_1');
    expect(response.body).toHaveProperty('status', 'WhatsApp_Sent');
  });
  
  // Test update call status
  test('PUT /enquiries/:id/call-status - should update call status', async () => {
    const callData = {
      first_call_attempted: true,
      first_call_status: 'Connected',
      call_notes: 'Spoke with client, interested in proceeding'
    };
    
    const response = await request(app)
      .put('/enquiries/2/call-status')
      .send(callData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enquiry_id', 2);
    expect(response.body).toHaveProperty('first_call_attempted', true);
    expect(response.body).toHaveProperty('first_call_date');
    expect(response.body).toHaveProperty('first_call_status', 'Connected');
    expect(response.body).toHaveProperty('call_notes');
    expect(response.body).toHaveProperty('status', 'Called');
  });
});
