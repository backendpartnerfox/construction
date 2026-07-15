// tests/room_dimensions_route_FIXED.test.js
const request = require('supertest');
const createTestApp = require('./testApp');

let app, pool;

beforeAll(async () => {
  const testApp = createTestApp();
  app = testApp.app;
  pool = testApp.pool;
  
  // Set up test database tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE room_type_enum AS ENUM (
        'Room', 'Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 
        'Balcony', 'Terrace', 'Lobby', 'Storage', 'Other'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_dimensions (
      room_dimension_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL,
      floor VARCHAR(50),
      room VARCHAR(100) NOT NULL,
      room_type room_type_enum NOT NULL,
      room_width DECIMAL(10,2),
      room_length DECIMAL(10,2),
      room_height DECIMAL(10,2),
      room_area DECIMAL(10,2),
      room_volume DECIMAL(10,2),
      is_covered BOOLEAN DEFAULT false,
      is_enclosed BOOLEAN DEFAULT false,
      waterproofing_required BOOLEAN DEFAULT false,
      connected_rooms JSONB DEFAULT '[]',
      north_wall_type VARCHAR(50),
      north_wall_length DECIMAL(10,2),
      north_wall_height DECIMAL(10,2),
      north_wall_thickness DECIMAL(10,2),
      north_wall_doors INT DEFAULT 0,
      north_wall_windows INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by INT,
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
    )
  `);
});

afterAll(async () => {
  // Clean up test database
  await pool.query('DROP TABLE IF EXISTS room_dimensions CASCADE');
  await pool.query('DROP TABLE IF EXISTS projects CASCADE');
  await pool.query('DROP TYPE IF EXISTS room_type_enum CASCADE');
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
      (1, 'Test Project 1'),
      (2, 'Test Project 2')
  `);
  
  await pool.query(`
    INSERT INTO room_dimensions (
      room_dimension_id, project_id, floor, room, room_type,
      room_width, room_length, room_height, room_area, room_volume,
      is_covered, is_enclosed, connected_rooms, created_by
    )
    VALUES 
      (1, 1, 'Ground Floor', 'Living Room', 'Living Room', 
       15.5, 20.0, 10.0, 310.0, 3100.0,
       true, true, '["Kitchen", "Hallway"]', 1),
      (2, 1, 'Ground Floor', 'Kitchen', 'Kitchen',
       12.0, 10.0, 10.0, 120.0, 1200.0,
       true, true, '["Living Room"]', 1),
      (3, 1, 'First Floor', 'Master Bedroom', 'Bedroom',
       14.0, 16.0, 10.0, 224.0, 2240.0,
       true, true, '["Master Bathroom", "Hallway"]', 1),
      (4, 2, 'Ground Floor', 'Lobby', 'Lobby',
       8.0, 6.0, 12.0, 48.0, 576.0,
       true, false, '[]', 1)
  `);
  
  // Reset sequences
  await pool.query("SELECT setval('projects_project_id_seq', 2)");
  await pool.query("SELECT setval('room_dimensions_room_dimension_id_seq', 4)");
});

describe('Room Dimensions API Tests', () => {
  describe('GET /room-dimensions', () => {
    test('should retrieve all room dimensions successfully', async () => {
      const response = await request(app).get('/room-dimensions');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(4);
      expect(response.body[0]).toHaveProperty('room_dimension_id');
      expect(response.body[0]).toHaveProperty('room_type');
      expect(response.body[0]).toHaveProperty('connected_rooms');
      expect(Array.isArray(response.body[0].connected_rooms)).toBeTruthy();
    });
  });

  describe('GET /room-dimensions/:id', () => {
    test('should retrieve a specific room dimension by ID', async () => {
      const response = await request(app).get('/room-dimensions/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('room_dimension_id', 1);
      expect(response.body).toHaveProperty('room', 'Living Room');
      expect(response.body).toHaveProperty('room_type', 'Living Room');
      expect(response.body.connected_rooms).toEqual(['Kitchen', 'Hallway']);
    });

    test('should return 404 for non-existent room dimension', async () => {
      const response = await request(app).get('/room-dimensions/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Room dimension not found');
    });
  });

  describe('POST /room-dimensions', () => {
    test('should create a new room dimension successfully', async () => {
      const newRoomDimension = {
        project_id: 1,
        floor: 'Second Floor',
        room: 'Guest Bedroom',
        room_type: 'Bedroom',
        room_width: 12.0,
        room_length: 14.0,
        room_height: 10.0,
        is_covered: true,
        is_enclosed: true,
        waterproofing_required: false,
        connected_rooms: ['Hallway'],
        created_by: 1
      };

      const response = await request(app)
        .post('/room-dimensions')
        .send(newRoomDimension);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('room_dimension_id', 5);
      expect(response.body).toHaveProperty('room', 'Guest Bedroom');
      expect(response.body).toHaveProperty('room_area');
      expect(response.body).toHaveProperty('room_volume');
    });

    test('should handle missing required fields', async () => {
      const incompleteData = {
        project_id: 1,
        floor: 'Ground Floor'
        // Missing required fields
      };

      const response = await request(app)
        .post('/room-dimensions')
        .send(incompleteData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid room type', async () => {
      const invalidData = {
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Test Room',
        room_type: 'InvalidType',
        room_width: 10,
        room_length: 10,
        room_height: 10
      };

      const response = await request(app)
        .post('/room-dimensions')
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle foreign key violations', async () => {
      const invalidProjectData = {
        project_id: 9999,
        floor: 'Ground Floor',
        room: 'Test Room',
        room_type: 'Room',
        room_width: 10,
        room_length: 10,
        room_height: 10
      };

      const response = await request(app)
        .post('/room-dimensions')
        .send(invalidProjectData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /room-dimensions/:id', () => {
    test('should update an existing room dimension', async () => {
      const updateData = {
        project_id: 1,
        floor: 'First Floor',
        room: 'Master Bedroom Updated',
        room_type: 'Bedroom',
        room_width: 15.0,
        room_length: 18.0,
        room_height: 10.0,
        connected_rooms: ['Master Bathroom', 'Hallway', 'Balcony'],
        updated_by: 2
      };

      const response = await request(app)
        .put('/room-dimensions/3')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('room', 'Master Bedroom Updated');
      expect(response.body).toHaveProperty('room_width', 15.0);
      expect(response.body.connected_rooms).toHaveLength(3);
    });

    test('should return 404 when updating non-existent room', async () => {
      const response = await request(app)
        .put('/room-dimensions/999')
        .send({ room: 'Test' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Room dimension not found');
    });
  });

  describe('DELETE /room-dimensions/:id', () => {
    test('should delete a room dimension successfully', async () => {
      const response = await request(app).delete('/room-dimensions/4');
      
      expect(response.status).toBe(204);
      
      // Verify deletion
      const checkResponse = await request(app).get('/room-dimensions/4');
      expect(checkResponse.status).toBe(404);
    });

    test('should return 404 when deleting non-existent room', async () => {
      const response = await request(app).delete('/room-dimensions/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Room dimension not found');
    });
  });

  describe('GET /room-dimensions/project/:projectId', () => {
    test('should retrieve all rooms for a specific project', async () => {
      const response = await request(app).get('/room-dimensions/project/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(3);
      response.body.forEach(room => {
        expect(room.project_id).toBe(1);
      });
    });
  });

  describe('GET /room-dimensions/floor', () => {
    test('should retrieve rooms for a specific floor', async () => {
      const response = await request(app)
        .get('/room-dimensions/floor')
        .query({ projectId: 1, floor: 'Ground Floor' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(room => {
        expect(room.floor).toBe('Ground Floor');
      });
    });

    test('should return 400 if required query params are missing', async () => {
      const response = await request(app).get('/room-dimensions/floor');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /room-dimensions/type/:roomType', () => {
    test('should retrieve rooms of a specific type', async () => {
      const response = await request(app).get('/room-dimensions/type/Bedroom');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('room_type', 'Bedroom');
    });
  });

  describe('GET /room-dimensions/special', () => {
    test('should retrieve special areas (balconies, terraces, lobbies)', async () => {
      const response = await request(app).get('/room-dimensions/special');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('room_type', 'Lobby');
    });
  });

  describe('GET /room-dimensions/statistics/:projectId', () => {
    test('should calculate project room statistics', async () => {
      const response = await request(app).get('/room-dimensions/statistics/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRooms');
      expect(response.body).toHaveProperty('totalArea');
      expect(response.body).toHaveProperty('totalVolume');
      expect(response.body).toHaveProperty('roomsByType');
      expect(response.body).toHaveProperty('roomsByFloor');
    });
  });
});
