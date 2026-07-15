// tests/room_dimensions.test.js
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
      project_name VARCHAR(200) NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS room_dimensions (
      room_dimension_id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(project_id),
      floor VARCHAR(50) NOT NULL,
      room VARCHAR(100) NOT NULL,
      room_type VARCHAR(50) NOT NULL,
      room_width NUMERIC,
      room_length NUMERIC,
      room_height NUMERIC,
      room_area NUMERIC GENERATED ALWAYS AS (room_width * room_length) STORED,
      room_volume NUMERIC GENERATED ALWAYS AS (room_width * room_length * room_height) STORED,
      is_covered BOOLEAN DEFAULT true,
      is_enclosed BOOLEAN DEFAULT true,
      railing_type VARCHAR(50),
      railing_height NUMERIC,
      floor_elevation NUMERIC,
      north_wall_type VARCHAR(50),
      north_wall_length NUMERIC,
      north_wall_height NUMERIC,
      north_wall_thickness NUMERIC,
      north_wall_doors JSONB,
      north_wall_windows JSONB,
      east_wall_type VARCHAR(50),
      east_wall_length NUMERIC,
      east_wall_height NUMERIC,
      east_wall_thickness NUMERIC,
      east_wall_doors JSONB,
      east_wall_windows JSONB,
      south_wall_type VARCHAR(50),
      south_wall_length NUMERIC,
      south_wall_height NUMERIC,
      south_wall_thickness NUMERIC,
      south_wall_doors JSONB,
      south_wall_windows JSONB,
      west_wall_type VARCHAR(50),
      west_wall_length NUMERIC,
      west_wall_height NUMERIC,
      west_wall_thickness NUMERIC,
      west_wall_doors JSONB,
      west_wall_windows JSONB,
      floor_type_id INTEGER,
      ceiling_type_id INTEGER,
      wall_finish_id INTEGER,
      waterproofing_required BOOLEAN DEFAULT false,
      connected_rooms TEXT[],
      notes TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS room_dimensions');
  await pool.query('DROP TABLE IF EXISTS projects');
  await pool.end();
});

beforeEach(async () => {
  // Clear tables before each test
  await pool.query('DELETE FROM room_dimensions');
  await pool.query('DELETE FROM projects');
  
  // Insert test data
  await pool.query(`
    INSERT INTO projects (project_id, project_name)
    VALUES 
      (1, 'Residential Tower A'),
      (2, 'Commercial Plaza B')
  `);
  
  await pool.query(`
    INSERT INTO room_dimensions (
      room_dimension_id, project_id, floor, room, room_type,
      room_width, room_length, room_height,
      is_covered, is_enclosed, 
      north_wall_type, north_wall_length, north_wall_height, north_wall_thickness,
      east_wall_type, east_wall_length, east_wall_height, east_wall_thickness,
      south_wall_type, south_wall_length, south_wall_height, south_wall_thickness,
      west_wall_type, west_wall_length, west_wall_height, west_wall_thickness,
      waterproofing_required, connected_rooms,
      created_by, created_at
    )
    VALUES 
      (
        1, 1, 'Ground Floor', 'Living Room', 'Living Room',
        5.5, 7.2, 3.0,
        true, true,
        'Brick', 7.2, 3.0, 0.23,
        'Brick', 5.5, 3.0, 0.23,
        'Brick', 7.2, 3.0, 0.23,
        'Brick', 5.5, 3.0, 0.23,
        false, ARRAY['Dining Room', 'Entrance'],
        101, CURRENT_TIMESTAMP - interval '1 day'
      ),
      (
        2, 1, 'Ground Floor', 'Kitchen', 'Kitchen',
        3.6, 4.0, 3.0,
        true, true,
        'Brick', 4.0, 3.0, 0.23,
        'Brick', 3.6, 3.0, 0.23,
        'Brick', 4.0, 3.0, 0.23,
        'Brick', 3.6, 3.0, 0.23,
        true, ARRAY['Dining Room'],
        101, CURRENT_TIMESTAMP - interval '2 days'
      ),
      (
        3, 1, 'First Floor', 'Master Bedroom', 'Bedroom',
        4.5, 5.0, 3.0,
        true, true,
        'Brick', 5.0, 3.0, 0.23,
        'Brick', 4.5, 3.0, 0.23,
        'Brick', 5.0, 3.0, 0.23,
        'Brick', 4.5, 3.0, 0.23,
        false, ARRAY['Bathroom'],
        101, CURRENT_TIMESTAMP - interval '3 days'
      ),
      (
        4, 2, 'Ground Floor', 'Reception', 'Lobby',
        8.0, 10.0, 4.0,
        true, true,
        'Concrete', 10.0, 4.0, 0.30,
        'Glass', 8.0, 4.0, 0.15,
        'Concrete', 10.0, 4.0, 0.30,
        'Glass', 8.0, 4.0, 0.15,
        false, ARRAY['Office Area', 'Meeting Room'],
        102, CURRENT_TIMESTAMP - interval '1 day'
      )
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('room_dimensions_room_dimension_id_seq', 4)");
});

describe('Room Dimensions API', () => {
  // Test GET all room dimensions
  test('GET /room-dimensions - should return all room dimensions', async () => {
    const response = await request(app).get('/room-dimensions');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toHaveProperty('room_dimension_id', 1);
    expect(response.body[0]).toHaveProperty('room', 'Living Room');
    expect(response.body[1]).toHaveProperty('room', 'Kitchen');
  });
  
  // Test GET room dimension by ID
  test('GET /room-dimensions/:id - should return a specific room dimension', async () => {
    const response = await request(app).get('/room-dimensions/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('room_dimension_id', 1);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('floor', 'Ground Floor');
    expect(response.body).toHaveProperty('room', 'Living Room');
    expect(response.body).toHaveProperty('room_type', 'Living Room');
    expect(response.body).toHaveProperty('room_width', '5.5');
    expect(response.body).toHaveProperty('room_length', '7.2');
    expect(response.body).toHaveProperty('room_height', '3.0');
    expect(response.body).toHaveProperty('room_area', '39.6');
    expect(response.body).toHaveProperty('room_volume', '118.8');
  });
  
  // Test GET room dimension by ID - not found
  test('GET /room-dimensions/:id - should return 404 for non-existent room dimension', async () => {
    const response = await request(app).get('/room-dimensions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Room dimension not found');
  });
  
  // Test POST new room dimension
  test('POST /room-dimensions - should create a new room dimension', async () => {
    const newRoomDimension = {
      project_id: 1,
      floor: 'First Floor',
      room: 'Bathroom',
      room_type: 'Bathroom',
      room_width: 2.4,
      room_length: 3.2,
      room_height: 3.0,
      is_covered: true,
      is_enclosed: true,
      north_wall_type: 'Brick',
      north_wall_length: 3.2,
      north_wall_height: 3.0,
      north_wall_thickness: 0.23,
      east_wall_type: 'Brick',
      east_wall_length: 2.4,
      east_wall_height: 3.0,
      east_wall_thickness: 0.23,
      south_wall_type: 'Brick',
      south_wall_length: 3.2,
      south_wall_height: 3.0,
      south_wall_thickness: 0.23,
      west_wall_type: 'Brick',
      west_wall_length: 2.4,
      west_wall_height: 3.0,
      west_wall_thickness: 0.23,
      waterproofing_required: true,
      connected_rooms: ['Master Bedroom'],
      created_by: 101
    };
    
    const response = await request(app)
      .post('/room-dimensions')
      .send(newRoomDimension);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('room_dimension_id', 5);
    expect(response.body).toHaveProperty('project_id', 1);
    expect(response.body).toHaveProperty('room', 'Bathroom');
    expect(response.body).toHaveProperty('room_type', 'Bathroom');
    expect(response.body).toHaveProperty('room_width', '2.4');
    expect(response.body).toHaveProperty('room_length', '3.2');
    expect(response.body).toHaveProperty('waterproofing_required', true);
    
    // Verify room dimension was actually created
    const allRoomDimensions = await request(app).get('/room-dimensions');
    expect(allRoomDimensions.body.length).toBe(5);
  });
  
  // Test PUT update room dimension
  test('PUT /room-dimensions/:id - should update a room dimension', async () => {
    const updatedData = {
      project_id: 1,
      floor: 'Ground Floor',
      room: 'Living Room Updated',
      room_type: 'Living Room',
      room_width: 6.0,
      room_length: 7.5,
      room_height: 3.0,
      is_covered: true,
      is_enclosed: true,
      north_wall_type: 'Brick',
      north_wall_length: 7.5,
      north_wall_height: 3.0,
      north_wall_thickness: 0.23,
      east_wall_type: 'Brick',
      east_wall_length: 6.0,
      east_wall_height: 3.0,
      east_wall_thickness: 0.23,
      south_wall_type: 'Brick',
      south_wall_length: 7.5,
      south_wall_height: 3.0,
      south_wall_thickness: 0.23,
      west_wall_type: 'Brick',
      west_wall_length: 6.0,
      west_wall_height: 3.0,
      west_wall_thickness: 0.23,
      waterproofing_required: false,
      connected_rooms: ['Dining Room', 'Entrance', 'Kitchen'],
      updated_by: 101
    };
    
    const response = await request(app)
      .put('/room-dimensions/1')
      .send(updatedData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('room_dimension_id', 1);
    expect(response.body).toHaveProperty('room', 'Living Room Updated');
    expect(response.body).toHaveProperty('room_width', '6.0');
    expect(response.body).toHaveProperty('room_length', '7.5');
    expect(response.body).toHaveProperty('room_area', '45');
    expect(response.body).toHaveProperty('connected_rooms').toEqual(['Dining Room', 'Entrance', 'Kitchen']);
    expect(response.body).toHaveProperty('updated_by', 101);
    
    // Verify room dimension was actually updated
    const updatedRoom = await request(app).get('/room-dimensions/1');
    expect(updatedRoom.body.room).toBe('Living Room Updated');
    expect(updatedRoom.body.room_width).toBe('6.0');
  });
  
  // Test PUT update room dimension - not found
  test('PUT /room-dimensions/:id - should return 404 for non-existent room dimension', async () => {
    const updatedData = {
      project_id: 1,
      floor: 'Ground Floor',
      room: 'Non-existent Room',
      room_type: 'Living Room',
      room_width: 5.0,
      room_length: 6.0,
      room_height: 3.0
    };
    
    const response = await request(app)
      .put('/room-dimensions/999')
      .send(updatedData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Room dimension not found');
  });
  
  // Test DELETE room dimension
  test('DELETE /room-dimensions/:id - should delete a room dimension', async () => {
    const response = await request(app).delete('/room-dimensions/1');
    
    expect(response.status).toBe(204);
    
    // Verify room dimension was actually deleted
    const deletedRoom = await request(app).get('/room-dimensions/1');
    expect(deletedRoom.status).toBe(404);
    
    const allRoomDimensions = await request(app).get('/room-dimensions');
    expect(allRoomDimensions.body.length).toBe(3);
  });
  
  // Test DELETE room dimension - not found
  test('DELETE /room-dimensions/:id - should return 404 for non-existent room dimension', async () => {
    const response = await request(app).delete('/room-dimensions/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Room dimension not found');
  });
  
  // Test GET room dimensions by project
  test('GET /room-dimensions/project/:projectId - should return room dimensions for a project', async () => {
    const response = await request(app).get('/room-dimensions/project/1');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty('project_id', 1);
    expect(response.body[1]).toHaveProperty('project_id', 1);
    expect(response.body[2]).toHaveProperty('project_id', 1);
  });
  
  // Test GET room dimensions by floor
  test('GET /room-dimensions/floor - should return room dimensions for a specific floor', async () => {
    const response = await request(app).get('/room-dimensions/floor?projectId=1&floor=Ground Floor');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('floor', 'Ground Floor');
    expect(response.body[1]).toHaveProperty('floor', 'Ground Floor');
  });
  
  // Test GET room dimensions by floor - missing parameters
  test('GET /room-dimensions/floor - should return 400 for missing parameters', async () => {
    const response = await request(app).get('/room-dimensions/floor?projectId=1'); // Missing floor param
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Project ID and floor are required');
  });
  
  // Test GET room dimensions by type
  test('GET /room-dimensions/type/:roomType - should return rooms of a specific type', async () => {
    const response = await request(app).get('/room-dimensions/type/Bedroom');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('room_type', 'Bedroom');
    expect(response.body[0]).toHaveProperty('room', 'Master Bedroom');
  });
  
  // Test GET room dimensions by type with project filter
  test('GET /room-dimensions/type/:roomType - should filter by project ID', async () => {
    const response = await request(app).get('/room-dimensions/type/Lobby?projectId=2');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('room_type', 'Lobby');
    expect(response.body[0]).toHaveProperty('project_id', 2);
  });
  
  // Test GET special areas
  test('GET /room-dimensions/special - should return special areas', async () => {
    const response = await request(app).get('/room-dimensions/special');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('room_type', 'Lobby');
    expect(response.body[0]).toHaveProperty('room', 'Reception');
  });
  
  // Test GET room statistics
  test('GET /room-dimensions/statistics/:projectId - should return room statistics for a project', async () => {
    const response = await request(app).get('/room-dimensions/statistics/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalRooms', 3);
    expect(response.body).toHaveProperty('totalArea');
    expect(response.body).toHaveProperty('totalVolume');
    expect(response.body).toHaveProperty('roomsByType');
    expect(response.body).toHaveProperty('roomsByFloor');
    
    // Verify room counts by type
    expect(response.body.roomsByType).toHaveProperty('Living Room');
    expect(response.body.roomsByType).toHaveProperty('Kitchen');
    expect(response.body.roomsByType).toHaveProperty('Bedroom');
    
    // Verify room counts by floor
    expect(response.body.roomsByFloor).toHaveProperty('Ground Floor');
    expect(response.body.roomsByFloor).toHaveProperty('First Floor');
  });
});
