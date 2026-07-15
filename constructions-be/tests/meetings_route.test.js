// tests/meetings_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      enquiry_id SERIAL PRIMARY KEY,
      enquiry_number VARCHAR(100),
      contact_person_name VARCHAR(100) NOT NULL
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      meeting_id SERIAL PRIMARY KEY,
      type_of_meeting VARCHAR(100),
      enquiry_id INTEGER REFERENCES enquiries(enquiry_id),
      project_id INTEGER REFERENCES projects(project_id),
      source VARCHAR(100),
      target VARCHAR(100),
      to_be_included TEXT,
      date TIMESTAMP WITH TIME ZONE,
      location VARCHAR(200),
      agenda TEXT,
      meeting_status VARCHAR(50) DEFAULT 'Scheduled',
      meeting_outcome TEXT,
      action_items TEXT,
      next_meeting_date TIMESTAMP WITH TIME ZONE,
      created_by VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS meetings');
  await pool.query('DROP TABLE IF EXISTS enquiries');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM meetings');
  await pool.query('DELETE FROM enquiries');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Villa Construction Project'),
      (2, 'Office Interior Project')
  `);
  
  await pool.query(`
    INSERT INTO enquiries (enquiry_id, enquiry_number, contact_person_name)
    VALUES 
      (1, 'ENQ-001', 'John Doe'),
      (2, 'ENQ-002', 'Jane Smith')
  `);
  
  await pool.query(`
    INSERT INTO meetings (
      meeting_id, type_of_meeting, enquiry_id, project_id, source, target,
      to_be_included, date, location, agenda, meeting_status, created_by
    )
    VALUES 
      (1, 'Site Visit', 1, NULL, 'Sales Team', 'Client', 
       'Site survey, requirement discussion', '2024-01-20 10:00:00', 
       'Client Site - Hyderabad', 'Initial site assessment', 'Completed', 'Admin'),
      (2, 'Design Review', NULL, 1, 'Design Team', 'Client', 
       'Design presentation, feedback collection', '2024-01-25 14:00:00', 
       'Office Conference Room', 'Present initial designs', 'Scheduled', 'Admin'),
      (3, 'Project Kickoff', NULL, 1, 'Project Manager', 'Client + Team', 
       'Project timeline, milestone planning', '2024-02-01 11:00:00', 
       'Office Conference Room', 'Project initiation', 'Scheduled', 'Admin'),
      (4, 'Progress Review', NULL, 2, 'Project Manager', 'Client', 
       'Work progress discussion', '2024-02-15 15:00:00', 
       'Project Site', 'Monthly progress review', 'Scheduled', 'Admin')
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('enquiries_enquiry_id_seq', 2)");
  await pool.query("SELECT setval('meetings_meeting_id_seq', 4)");
});

describe('Meetings API', () => {
  // Test GET all meetings
  test('GET /meetings - should return all meetings', async () => {
    const response = await request(app).get('/meetings');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('meeting_id');
    expect(response.body[0]).toHaveProperty('type_of_meeting');
    expect(response.body[0]).toHaveProperty('date');
  });
  
  // Test GET meeting by ID
  test('GET /meetings/:id - should return a specific meeting', async () => {
    const response = await request(app).get('/meetings/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('meeting_id', 1);
    expect(response.body).toHaveProperty('type_of_meeting', 'Site Visit');
    expect(response.body).toHaveProperty('enquiry_id', 1);
    expect(response.body).toHaveProperty('source', 'Sales Team');
    expect(response.body).toHaveProperty('target', 'Client');
    expect(response.body).toHaveProperty('location', 'Client Site - Hyderabad');
    expect(response.body).toHaveProperty('meeting_status', 'Completed');
  });
  
  // Test GET meeting by ID - not found
  test('GET /meetings/:id - should return 404 for non-existent meeting', async () => {
    const response = await request(app).get('/meetings/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Meeting not found');
  });
  
  // Test POST new meeting
  test('POST /meetings - should create a new meeting', async () => {
    const newMeeting = {
      type_of_meeting: 'Client Consultation',
      enquiry_id: 2,
      project_id: null,
      source: 'Architect',
      target: 'Client',
      to_be_included: 'Design options discussion, budget planning',
      date: '2024-03-01T10:00:00Z',
      location: 'Client Office',
      agenda: 'Discuss architectural requirements',
      meeting_status: 'Scheduled',
      created_by: 'Project Manager'
    };
    
    const response = await request(app)
      .post('/meetings')
      .send(newMeeting);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('meeting_id', 5);
    expect(response.body).toHaveProperty('type_of_meeting', 'Client Consultation');
    expect(response.body).toHaveProperty('enquiry_id', 2);
    expect(response.body).toHaveProperty('source', 'Architect');
    expect(response.body).toHaveProperty('target', 'Client');
    expect(response.body).toHaveProperty('location', 'Client Office');
  });
  
  // Test POST meeting - missing required fields
  test('POST /meetings - should return 400 for missing required fields', async () => {
    const incompleteMeeting = {
      // Missing type_of_meeting
      source: 'Sales Team',
      target: 'Client'
    };
    
    const response = await request(app)
      .post('/meetings')
      .send(incompleteMeeting);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test PUT update meeting
  test('PUT /meetings/:id - should update a meeting', async () => {
    const updatedMeeting = {
      type_of_meeting: 'Updated Site Visit',
      enquiry_id: 1,
      project_id: null,
      source: 'Updated Sales Team',
      target: 'Client',
      to_be_included: 'Updated site survey, detailed requirement discussion',
      date: '2024-01-22T10:00:00Z',
      location: 'Updated Location - Hyderabad',
      agenda: 'Updated site assessment',
      meeting_status: 'Completed',
      meeting_outcome: 'Site approved for construction',
      action_items: 'Proceed with design phase',
      created_by: 'Admin'
    };
    
    const response = await request(app)
      .put('/meetings/1')
      .send(updatedMeeting);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('meeting_id', 1);
    expect(response.body).toHaveProperty('type_of_meeting', 'Updated Site Visit');
    expect(response.body).toHaveProperty('source', 'Updated Sales Team');
    expect(response.body).toHaveProperty('location', 'Updated Location - Hyderabad');
    expect(response.body).toHaveProperty('meeting_outcome', 'Site approved for construction');
  });
  
  // Test DELETE meeting
  test('DELETE /meetings/:id - should delete a meeting', async () => {
    const response = await request(app).delete('/meetings/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Meeting deleted successfully');
    
    // Verify meeting was deleted
    const getResponse = await request(app).get('/meetings/1');
    expect(getResponse.status).toBe(404);
  });
  
  // Test GET meetings by enquiry
  test('GET /meetings/enquiry/:enquiryId - should return meetings for an enquiry', async () => {
    const response = await request(app).get('/meetings/enquiry/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body.every(meeting => meeting.enquiry_id === 1)).toBeTruthy();
  });
  
  // Test GET meetings by project
  test('GET /meetings/project/:projectId - should return meetings for a project', async () => {
    const response = await request(app).get('/meetings/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body.every(meeting => meeting.project_id === 1)).toBeTruthy();
  });
  
  // Test GET meetings by status
  test('GET /meetings/status/Scheduled - should return scheduled meetings', async () => {
    const response = await request(app).get('/meetings/status/Scheduled');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body.every(meeting => meeting.meeting_status === 'Scheduled')).toBeTruthy();
  });
  
  // Test GET meetings by type
  test('GET /meetings/type/Site Visit - should return site visit meetings', async () => {
    const response = await request(app).get('/meetings/type/Site Visit');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body.every(meeting => meeting.type_of_meeting === 'Site Visit')).toBeTruthy();
  });
  
  // Test search functionality
  test('GET /meetings/search?query=Design - should search meetings', async () => {
    const response = await request(app).get('/meetings/search?query=Design');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });
  
  // Test upcoming meetings
  test('GET /meetings/upcoming - should return upcoming meetings', async () => {
    const response = await request(app).get('/meetings/upcoming');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    // Results depend on current date, so just check it returns an array
  });
});