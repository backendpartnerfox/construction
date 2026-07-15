// tests/lead_requirement_floors_route.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database with necessary tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id SERIAL PRIMARY KEY,
      lead_number VARCHAR(50) UNIQUE,
      lead_title VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_requirements (
      lead_requirement_id SERIAL PRIMARY KEY,
      lead_id INT NOT NULL,
      requirement_title VARCHAR(255) NOT NULL,
      number_of_floors INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lead_requirement_floors (
      floor_detail_id SERIAL PRIMARY KEY,
      lead_requirement_id INT NOT NULL,
      floor_number INT NOT NULL,
      floor_name VARCHAR(50),
      floor_ffl DECIMAL(8,3),
      floor_height DECIMAL(8,3),
      floor_usage VARCHAR(100),
      floor_area DECIMAL(12,2),
      is_habitable BOOLEAN DEFAULT TRUE,
      bedrooms_count INT DEFAULT 0,
      bathrooms_count INT DEFAULT 0,
      living_areas_count INT DEFAULT 0,
      balcony_area DECIMAL(10,2) DEFAULT 0,
      utility_area DECIMAL(10,2) DEFAULT 0,
      floor_specific_requirements TEXT,
      flooring_type VARCHAR(100),
      ceiling_type VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_requirement_id) REFERENCES lead_requirements(lead_requirement_id),
      UNIQUE(lead_requirement_id, floor_number)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS lead_requirement_floors CASCADE');
  await pool.query('DROP TABLE IF EXISTS lead_requirements CASCADE');
  await pool.query('DROP TABLE IF EXISTS leads CASCADE');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM lead_requirement_floors');
  await pool.query('DELETE FROM lead_requirements');
  await pool.query('DELETE FROM leads');
  
  // Insert test data
  await pool.query(`
    INSERT INTO leads (lead_id, lead_number, lead_title)
    VALUES 
      (1, 'LED-2024-001', 'Villa Construction Project'),
      (2, 'LED-2024-002', 'Office Building Project')
  `);

  await pool.query(`
    INSERT INTO lead_requirements (lead_requirement_id, lead_id, requirement_title, number_of_floors)
    VALUES 
      (1, 1, 'G+2 Villa Construction', 3),
      (2, 2, 'G+4 Office Building', 5)
  `);

  // Reset sequences
  await pool.query("SELECT setval('leads_lead_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirements_lead_requirement_id_seq', 2)");
  await pool.query("SELECT setval('lead_requirement_floors_floor_detail_id_seq', 1, false)");
});

describe('Lead Requirement Floors API', () => {
  // Test GET all floor details
  test('GET /lead-requirement-floors - should return all floor details', async () => {
    // Insert test floor
    await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name, floor_ffl, floor_height, floor_usage, floor_area, bedrooms_count, bathrooms_count)
      VALUES (1, 0, 'Ground Floor', 0.45, 3.0, 'Residential', 150.0, 1, 1)
    `);

    const response = await request(app).get('/lead-requirement-floors');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('floor_detail_id');
    expect(response.body[0]).toHaveProperty('floor_name', 'Ground Floor');
    expect(response.body[0]).toHaveProperty('floor_area', '150.00');
  });

  // Test GET with filters
  test('GET /lead-requirement-floors - should filter by parameters', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name, floor_usage, floor_area, is_habitable)
      VALUES 
        (1, 0, 'Ground Floor', 'Residential', 150.0, true),
        (1, 1, 'First Floor', 'Residential', 140.0, true),
        (1, -1, 'Stilt', 'Parking', 150.0, false)
    `);

    // Filter by lead_requirement_id
    const response1 = await request(app).get('/lead-requirement-floors?lead_requirement_id=1');
    expect(response1.status).toBe(200);
    expect(response1.body.length).toBe(3);

    // Filter by is_habitable
    const response2 = await request(app).get('/lead-requirement-floors?is_habitable=true');
    expect(response2.status).toBe(200);
    expect(response2.body.length).toBe(2);

    // Filter by floor_usage
    const response3 = await request(app).get('/lead-requirement-floors?floor_usage=Parking');
    expect(response3.status).toBe(200);
    expect(response3.body.length).toBe(1);
  });

  // Test GET by ID
  test('GET /lead-requirement-floors/:id - should return specific floor detail', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name, floor_ffl, floor_height, floor_area)
      VALUES (1, 0, 'Ground Floor', 0.45, 3.0, 150.0)
      RETURNING floor_detail_id
    `);
    const id = result.rows[0].floor_detail_id;

    const response = await request(app).get(`/lead-requirement-floors/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('floor_detail_id', id);
    expect(response.body).toHaveProperty('requirement_title', 'G+2 Villa Construction');
    expect(response.body).toHaveProperty('lead_number', 'LED-2024-001');
  });

  // Test GET by ID - not found
  test('GET /lead-requirement-floors/:id - should return 404 for non-existent', async () => {
    const response = await request(app).get('/lead-requirement-floors/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Floor detail not found');
  });

  // Test GET floors by requirement
  test('GET /lead-requirement-floors/requirement/:requirementId - should return all floors for requirement', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name, floor_area)
      VALUES 
        (1, -1, 'Stilt', 150.0),
        (1, 0, 'Ground Floor', 150.0),
        (1, 1, 'First Floor', 140.0),
        (1, 2, 'Second Floor', 130.0)
    `);

    const response = await request(app).get('/lead-requirement-floors/requirement/1');
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('floor_number', -1);
    expect(response.body[3]).toHaveProperty('floor_number', 2);
  });

  // Test POST new floor detail
  test('POST /lead-requirement-floors - should create new floor detail', async () => {
    const newFloor = {
      lead_requirement_id: 1,
      floor_number: 0,
      floor_name: 'Ground Floor',
      floor_ffl: 0.45,
      floor_height: 3.2,
      floor_usage: 'Residential',
      floor_area: 160.0,
      is_habitable: true,
      bedrooms_count: 2,
      bathrooms_count: 2,
      living_areas_count: 1,
      balcony_area: 15.0,
      utility_area: 8.0,
      floor_specific_requirements: 'Open kitchen concept',
      flooring_type: 'Vitrified Tiles',
      ceiling_type: 'POP False Ceiling'
    };

    const response = await request(app)
      .post('/lead-requirement-floors')
      .send(newFloor);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('floor_detail_id');
    expect(response.body).toHaveProperty('floor_name', 'Ground Floor');
    expect(response.body).toHaveProperty('bedrooms_count', 2);
    expect(response.body).toHaveProperty('balcony_area', '15.00');
  });

  // Test POST - missing required fields
  test('POST /lead-requirement-floors - should return 400 for missing fields', async () => {
    const incompleteData = {
      lead_requirement_id: 1,
      // missing floor_number
    };

    const response = await request(app)
      .post('/lead-requirement-floors')
      .send(incompleteData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test POST - duplicate floor number
  test('POST /lead-requirement-floors - should return 409 for duplicate floor number', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name)
      VALUES (1, 0, 'Ground Floor')
    `);

    const duplicateFloor = {
      lead_requirement_id: 1,
      floor_number: 0,
      floor_name: 'Another Ground Floor'
    };

    const response = await request(app)
      .post('/lead-requirement-floors')
      .send(duplicateFloor);
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('already exists');
  });

  // Test PUT update
  test('PUT /lead-requirement-floors/:id - should update floor detail', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name, floor_area, bedrooms_count)
      VALUES (1, 0, 'Ground Floor', 150.0, 1)
      RETURNING floor_detail_id
    `);
    const id = result.rows[0].floor_detail_id;

    const updateData = {
      floor_area: 165.0,
      bedrooms_count: 2,
      bathrooms_count: 2,
      flooring_type: 'Marble',
      floor_specific_requirements: 'Updated requirements'
    };

    const response = await request(app)
      .put(`/lead-requirement-floors/${id}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('floor_area', '165.00');
    expect(response.body).toHaveProperty('bedrooms_count', 2);
    expect(response.body).toHaveProperty('flooring_type', 'Marble');
  });

  // Test DELETE
  test('DELETE /lead-requirement-floors/:id - should delete floor detail', async () => {
    const result = await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name)
      VALUES (1, 0, 'Ground Floor')
      RETURNING floor_detail_id
    `);
    const id = result.rows[0].floor_detail_id;

    const response = await request(app).delete(`/lead-requirement-floors/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Floor detail deleted successfully');
    
    // Verify deletion
    const checkResult = await pool.query(
      'SELECT * FROM lead_requirement_floors WHERE floor_detail_id = $1',
      [id]
    );
    expect(checkResult.rows.length).toBe(0);
  });

  // Test POST bulk create
  test('POST /lead-requirement-floors/bulk - should create multiple floors', async () => {
    const bulkData = {
      lead_requirement_id: 1,
      floors: [
        {
          floor_number: 0,
          floor_name: 'Ground Floor',
          floor_area: 150.0,
          bedrooms_count: 1,
          bathrooms_count: 1
        },
        {
          floor_number: 1,
          floor_name: 'First Floor',
          floor_area: 140.0,
          bedrooms_count: 2,
          bathrooms_count: 2
        },
        {
          floor_number: 2,
          floor_name: 'Second Floor',
          floor_area: 130.0,
          bedrooms_count: 2,
          bathrooms_count: 1
        }
      ]
    };

    const response = await request(app)
      .post('/lead-requirement-floors/bulk')
      .send(bulkData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.created).toBe(3);
  });

  // Test GET summary
  test('GET /lead-requirement-floors/requirement/:requirementId/summary - should return summary', async () => {
    await pool.query(`
      INSERT INTO lead_requirement_floors 
      (lead_requirement_id, floor_number, floor_name, floor_area, bedrooms_count, bathrooms_count, is_habitable)
      VALUES 
        (1, -1, 'Stilt', 150.0, 0, 0, false),
        (1, 0, 'Ground Floor', 150.0, 1, 1, true),
        (1, 1, 'First Floor', 140.0, 2, 2, true),
        (1, 2, 'Second Floor', 130.0, 2, 1, true)
    `);

    const response = await request(app).get('/lead-requirement-floors/requirement/1/summary');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_floors', 4);
    expect(response.body).toHaveProperty('habitable_floors', 3);
    expect(response.body).toHaveProperty('total_area', '570.00');
    expect(response.body).toHaveProperty('total_bedrooms', 5);
    expect(response.body).toHaveProperty('total_bathrooms', 4);
  });
});
