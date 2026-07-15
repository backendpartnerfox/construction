const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');

// Mock the pg module
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const roomDimensionsRouter = require('../routes/room_dimensions_route');

describe('Room Dimensions API Tests', () => {
  let app;
  let pool;
  let mockDb;

  beforeAll(() => {
    // Set up the Express app
    app = express();
    app.use(express.json());
    
    // Create mock database
    pool = new Pool();
    mockDb = pool;
    
    // Add middleware to inject db into requests
    app.use((req, res, next) => {
      req.db = mockDb;
      next();
    });
    
    // Mount the router
    app.use('/', roomDimensionsRouter);
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the mock implementation to default behavior
    mockDb.query.mockReset();
    
    // Default mock for table existence check
    mockDb.query.mockResolvedValue({ rows: [{ exists: true }] });
  });

  afterAll(async () => {
    // Clean up
    if (pool && pool.end) {
      await pool.end();
    }
  });

  describe('GET /room-dimensions', () => {
    it('should retrieve all room dimensions successfully', async () => {
      // Mock data
      const mockRoomDimensions = [
        {
          room_dimension_id: 1,
          project_id: 1,
          floor: 'Ground Floor',
          room: 'Living Room',
          room_type: 'Living Room',
          room_width: 15.5,
          room_length: 20.0,
          room_height: 10.0,
          room_area: 310.0,
          room_volume: 3100.0,
          connected_rooms: ['Kitchen', 'Hallway'],
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          room_dimension_id: 2,
          project_id: 1,
          floor: 'Ground Floor',
          room: 'Kitchen',
          room_type: 'Kitchen',
          room_width: 12.0,
          room_length: 10.0,
          room_height: 10.0,
          room_area: 120.0,
          room_volume: 1200.0,
          connected_rooms: ['Living Room'],
          created_at: '2024-01-15T10:30:00Z'
        }
      ];

      // Mock the database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: mockRoomDimensions }); // SELECT query

      // Make the request
      const response = await request(app)
        .get('/room-dimensions')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('room_dimension_id', 1);
      expect(response.body[0]).toHaveProperty('room_type', 'Living Room');
      expect(response.body[0].connected_rooms).toBeInstanceOf(Array);
      expect(response.body[0].connected_rooms).toContain('Kitchen');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockRejectedValueOnce(new Error('Database connection failed')); // SELECT query fails

      // Make the request
      const response = await request(app)
        .get('/room-dimensions')
        .expect('Content-Type', /json/)
        .expect(500);

      // Assertions
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle malformed connected_rooms data', async () => {
      // Mock data with malformed connected_rooms
      const mockRoomDimensions = [
        {
          room_dimension_id: 1,
          project_id: 1,
          floor: 'Ground Floor',
          room: 'Living Room',
          room_type: 'Living Room',
          room_width: 15.5,
          room_length: 20.0,
          room_height: 10.0,
          connected_rooms: 'invalid json string'
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: mockRoomDimensions }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions')
        .expect(200);

      // Should handle malformed data gracefully
      expect(response.body[0].connected_rooms).toEqual([]);
    });
  });

  describe('GET /room-dimensions/:id', () => {
    it('should retrieve a specific room dimension by ID', async () => {
      const mockRoomDimension = {
        room_dimension_id: 1,
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Living Room',
        room_type: 'Living Room',
        room_width: 15.5,
        room_length: 20.0,
        room_height: 10.0,
        connected_rooms: ['Kitchen', 'Hallway']
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [mockRoomDimension] }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions/1')
        .expect(200);

      expect(response.body).toHaveProperty('room_dimension_id', 1);
      expect(response.body).toHaveProperty('room_type', 'Living Room');
    });

    it('should return 404 for non-existent room dimension', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [] }); // SELECT query returns empty

      const response = await request(app)
        .get('/room-dimensions/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Room dimension not found');
    });
  });

  describe('POST /room-dimensions', () => {
    it('should create a new room dimension successfully', async () => {
      const newRoomDimension = {
        project_id: 1,
        floor: 'First Floor',
        room: 'Master Bedroom',
        room_type: 'Bedroom',
        room_width: 14.0,
        room_length: 16.0,
        room_height: 10.0,
        is_covered: true,
        is_enclosed: true,
        waterproofing_required: false,
        connected_rooms: ['Master Bathroom', 'Hallway'],
        north_wall_type: 'Brick',
        north_wall_length: 14.0,
        north_wall_height: 10.0,
        north_wall_thickness: 0.5,
        north_wall_doors: 1,
        north_wall_windows: 1,
        created_by: 1
      };

      const mockCreatedRoom = {
        room_dimension_id: 3,
        ...newRoomDimension,
        room_area: 224.0,
        room_volume: 2240.0,
        created_at: '2024-01-15T11:00:00Z'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [mockCreatedRoom] }); // INSERT query

      const response = await request(app)
        .post('/room-dimensions')
        .send(newRoomDimension)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('room_dimension_id');
      expect(response.body).toHaveProperty('room', 'Master Bedroom');
      expect(response.body).toHaveProperty('room_type', 'Bedroom');
      expect(response.body.connected_rooms).toEqual(['Master Bathroom', 'Hallway']);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        project_id: 1,
        floor: 'Ground Floor'
        // Missing required fields: room, room_type, dimensions
      };

      const dbError = new Error('Not null violation');
      dbError.code = '23502';

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockRejectedValueOnce(dbError); // INSERT query fails

      const response = await request(app)
        .post('/room-dimensions')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should handle invalid room type', async () => {
      const invalidData = {
        project_id: 1,
        floor: 'Ground Floor',
        room: 'Test Room',
        room_type: 'InvalidType', // Invalid enum value
        room_width: 10,
        room_length: 10,
        room_height: 10
      };

      const dbError = new Error('Invalid enum value');
      dbError.code = '22P02';

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockRejectedValueOnce(dbError); // INSERT query fails

      const response = await request(app)
        .post('/room-dimensions')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid room type');
    });

    it('should handle foreign key violations', async () => {
      const invalidProjectData = {
        project_id: 9999, // Non-existent project
        floor: 'Ground Floor',
        room: 'Test Room',
        room_type: 'Room',
        room_width: 10,
        room_length: 10,
        room_height: 10
      };

      const dbError = new Error('Foreign key violation');
      dbError.code = '23503';

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockRejectedValueOnce(dbError); // INSERT query fails

      const response = await request(app)
        .post('/room-dimensions')
        .send(invalidProjectData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Referenced entity does not exist');
    });
  });

  describe('PUT /room-dimensions/:id', () => {
    it('should update an existing room dimension', async () => {
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

      const mockUpdatedRoom = {
        room_dimension_id: 1,
        ...updateData,
        room_area: 270.0,
        room_volume: 2700.0,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [mockUpdatedRoom] }); // UPDATE query

      const response = await request(app)
        .put('/room-dimensions/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('room', 'Master Bedroom Updated');
      expect(response.body).toHaveProperty('room_width', 15.0);
      expect(response.body.connected_rooms).toHaveLength(3);
    });

    it('should return 404 when updating non-existent room', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [] }); // UPDATE query returns empty

      const response = await request(app)
        .put('/room-dimensions/999')
        .send({ room: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Room dimension not found');
    });
  });

  describe('DELETE /room-dimensions/:id', () => {
    it('should delete a room dimension successfully', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [{ room_dimension_id: 1 }] }); // DELETE query

      const response = await request(app)
        .delete('/room-dimensions/1')
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should return 404 when deleting non-existent room', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: [] }); // DELETE query returns empty

      const response = await request(app)
        .delete('/room-dimensions/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Room dimension not found');
    });

    it('should handle foreign key constraint errors', async () => {
      const dbError = new Error('Foreign key constraint');
      dbError.code = '23503';

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockRejectedValueOnce(dbError); // DELETE query fails

      const response = await request(app)
        .delete('/room-dimensions/1')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot delete due to references from other tables');
    });
  });

  describe('GET /room-dimensions/project/:projectId', () => {
    it('should retrieve all rooms for a specific project', async () => {
      const mockProjectRooms = [
        {
          room_dimension_id: 1,
          project_id: 1,
          floor: 'Ground Floor',
          room: 'Living Room',
          room_type: 'Living Room',
          connected_rooms: ['Kitchen']
        },
        {
          room_dimension_id: 2,
          project_id: 1,
          floor: 'First Floor',
          room: 'Bedroom',
          room_type: 'Bedroom',
          connected_rooms: []
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: mockProjectRooms }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions/project/1')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('project_id', 1);
      expect(response.body[1]).toHaveProperty('project_id', 1);
    });
  });

  describe('GET /room-dimensions/floor', () => {
    it('should retrieve rooms for a specific floor', async () => {
      const mockFloorRooms = [
        {
          room_dimension_id: 1,
          project_id: 1,
          floor: 'Ground Floor',
          room: 'Living Room',
          room_type: 'Living Room'
        },
        {
          room_dimension_id: 2,
          project_id: 1,
          floor: 'Ground Floor',
          room: 'Kitchen',
          room_type: 'Kitchen'
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: mockFloorRooms }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions/floor')
        .query({ projectId: 1, floor: 'Ground Floor' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('floor', 'Ground Floor');
      expect(response.body[1]).toHaveProperty('floor', 'Ground Floor');
    });

    it('should return 400 if required query params are missing', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }); // Table exists check

      const response = await request(app)
        .get('/room-dimensions/floor')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Project ID and floor are required');
    });
  });

  describe('GET /room-dimensions/type/:roomType', () => {
    it('should retrieve rooms of a specific type', async () => {
      const mockBedroomRooms = [
        {
          room_dimension_id: 1,
          project_id: 1,
          room: 'Master Bedroom',
          room_type: 'Bedroom'
        },
        {
          room_dimension_id: 2,
          project_id: 1,
          room: 'Guest Bedroom',
          room_type: 'Bedroom'
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: mockBedroomRooms }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions/type/Bedroom')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('room_type', 'Bedroom');
      expect(response.body[1]).toHaveProperty('room_type', 'Bedroom');
    });
  });

  describe('GET /room-dimensions/special', () => {
    it('should retrieve special areas (balconies, terraces, lobbies)', async () => {
      const mockSpecialAreas = [
        {
          room_dimension_id: 1,
          project_id: 1,
          room: 'Main Balcony',
          room_type: 'Balcony',
          is_covered: true,
          is_enclosed: false
        },
        {
          room_dimension_id: 2,
          project_id: 1,
          room: 'Roof Terrace',
          room_type: 'Terrace',
          is_covered: false,
          is_enclosed: false
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check
        .mockResolvedValueOnce({ rows: mockSpecialAreas }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions/special')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(['Balcony', 'Terrace', 'Lobby']).toContain(response.body[0].room_type);
    });
  });

  describe('GET /room-dimensions/statistics/:projectId', () => {
    it('should calculate project room statistics', async () => {
      // Mock responses for statistics queries
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table check
        .mockResolvedValueOnce({ 
          rows: [{ 
            total_rooms: '5', 
            total_area: '1250.50', 
            total_volume: '12505.00' 
          }] 
        })
        .mockResolvedValueOnce({ 
          rows: [
            { room_type: 'Bedroom', count: '3', area: '450.00' },
            { room_type: 'Kitchen', count: '1', area: '120.00' },
            { room_type: 'Living Room', count: '1', area: '310.00' }
          ] 
        })
        .mockResolvedValueOnce({ 
          rows: [
            { floor: 'Ground Floor', count: '3', area: '550.00' },
            { floor: 'First Floor', count: '2', area: '700.50' }
          ] 
        });

      const response = await request(app)
        .get('/room-dimensions/statistics/1')
        .expect(200);

      expect(response.body).toHaveProperty('totalRooms', 5);
      expect(response.body).toHaveProperty('totalArea', 1250.50);
      expect(response.body).toHaveProperty('totalVolume', 12505.00);
      expect(response.body.roomsByType).toHaveProperty('Bedroom');
      expect(response.body.roomsByType.Bedroom).toEqual({ count: 3, area: 450.00 });
      expect(response.body.roomsByFloor).toHaveProperty('Ground Floor');
      expect(response.body.roomsByFloor['Ground Floor']).toEqual({ count: 3, area: 550.00 });
    });
  });

  describe('Table Creation Middleware', () => {
    it('should create table if it does not exist', async () => {
      // Mock sequence for table creation
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: false }] }) // Table doesn't exist
        .mockResolvedValueOnce({ rows: [] }) // CREATE TYPE
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
        .mockResolvedValueOnce({ rows: [] }) // CREATE INDEX 1
        .mockResolvedValueOnce({ rows: [] }) // CREATE INDEX 2
        .mockResolvedValueOnce({ rows: [] }) // CREATE INDEX 3
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists check after creation
        .mockResolvedValueOnce({ rows: [] }); // SELECT query

      const response = await request(app)
        .get('/room-dimensions')
        .expect(200);

      expect(response.body).toEqual([]);
      
      // Verify table creation queries were called
      const queries = mockDb.query.mock.calls.map(call => call[0]);
      expect(queries.some(q => q.includes('CREATE TABLE room_dimensions'))).toBe(true);
    });
  });
});
