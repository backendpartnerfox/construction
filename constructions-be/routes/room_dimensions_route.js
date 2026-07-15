const express = require('express');
const router = express.Router();

// Middleware to check if table exists
async function checkTableExists(db) {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'room_dimensions'
      );
    `);
    return result.rows[0].exists;
  } catch (err) {
    console.error('Error checking table existence:', err);
    return false;
  }
}

// Middleware to create table if it doesn't exist
async function ensureTableExists(req, res, next) {
  const db = req.db;
  
  try {
    const tableExists = await checkTableExists(db);
    
    if (!tableExists) {
      // First check if the room_type enum exists
      await db.query(`
        DO $$ BEGIN
          CREATE TYPE room_type AS ENUM (
            'Room', 'Kitchen', 'Bathroom', 'Bedroom', 'Living Room',
            'Dining Room', 'Balcony', 'Terrace', 'Lobby', 'Corridor',
            'Staircase', 'Utility Room', 'Store Room', 'Garage', 'Other'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create the room_dimensions table
      await db.query(`
        CREATE TABLE room_dimensions (
          room_dimension_id SERIAL PRIMARY KEY,
          project_id INT NOT NULL,
          floor VARCHAR(50) NOT NULL,
          room VARCHAR(100) NOT NULL,
          room_type room_type NOT NULL,
          
          -- Room dimensions
          room_width DECIMAL(10,2) NOT NULL,
          room_length DECIMAL(10,2) NOT NULL,
          room_height DECIMAL(10,2) NOT NULL,
          room_area DECIMAL(12,2) GENERATED ALWAYS AS (room_width * room_length) STORED,
          room_volume DECIMAL(14,3) GENERATED ALWAYS AS (room_width * room_length * room_height) STORED,
          
          -- Special area specifications
          is_covered BOOLEAN DEFAULT TRUE,
          is_enclosed BOOLEAN DEFAULT TRUE,
          railing_type VARCHAR(100),
          railing_height DECIMAL(5,2),
          floor_elevation DECIMAL(5,2) DEFAULT 0.00,
          
          -- Wall counts and dimensions by direction
          north_wall_type VARCHAR(50),
          north_wall_length DECIMAL(10,2),
          north_wall_height DECIMAL(10,2),
          north_wall_thickness DECIMAL(5,2),
          north_wall_doors INT DEFAULT 0,
          north_wall_windows INT DEFAULT 0,
          
          east_wall_type VARCHAR(50),
          east_wall_length DECIMAL(10,2),
          east_wall_height DECIMAL(10,2),
          east_wall_thickness DECIMAL(5,2),
          east_wall_doors INT DEFAULT 0,
          east_wall_windows INT DEFAULT 0,
          
          south_wall_type VARCHAR(50),
          south_wall_length DECIMAL(10,2),
          south_wall_height DECIMAL(10,2),
          south_wall_thickness DECIMAL(5,2),
          south_wall_doors INT DEFAULT 0,
          south_wall_windows INT DEFAULT 0,
          
          west_wall_type VARCHAR(50),
          west_wall_length DECIMAL(10,2),
          west_wall_height DECIMAL(10,2),
          west_wall_thickness DECIMAL(5,2),
          west_wall_doors INT DEFAULT 0,
          west_wall_windows INT DEFAULT 0,
          
          -- Room specifications
          floor_type_id INT,
          ceiling_type_id INT,
          wall_finish_id INT,
          waterproofing_required BOOLEAN DEFAULT FALSE,
          
          -- Connections to other rooms
          connected_rooms TEXT[],
          
          -- Metadata
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by INT,
          updated_at TIMESTAMP WITH TIME ZONE,
          updated_by INT,
          
          -- Foreign keys
          FOREIGN KEY (project_id) REFERENCES projects(project_id),
          FOREIGN KEY (created_by) REFERENCES employees(employee_id),
          FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
        );
      `);

      // Create indexes
      await db.query(`
        CREATE INDEX idx_room_dimensions_project ON room_dimensions(project_id);
        CREATE INDEX idx_room_dimensions_location ON room_dimensions(floor, room);
        CREATE INDEX idx_room_dimensions_type ON room_dimensions(room_type);
      `);

      console.log('Room dimensions table created successfully');
    }
    
    next();
  } catch (err) {
    console.error('Error ensuring table exists:', err);
    return res.status(500).json({ 
      error: 'Database initialization error', 
      details: err.message 
    });
  }
}

// Apply middleware to all routes
router.use(ensureTableExists);

/**
 * @swagger
 * tags:
 *   name: Room Dimensions
 *   description: API for managing construction Room Dimensions
 */

/**
 * @swagger
 * /room_dimensions:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Retrieve all room dimensions
 *     responses:
 *       200:
 *         description: List of room dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomDimension'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM room_dimensions');
    
    // Process the results to ensure connected_rooms is properly handled
    const processedRows = result.rows.map(row => {
      // Ensure connected_rooms is an array
      if (row.connected_rooms && typeof row.connected_rooms === 'string') {
        try {
          // If it's a string, try to parse it as JSON
          row.connected_rooms = JSON.parse(row.connected_rooms);
        } catch (e) {
          // If parsing fails, convert to empty array
          row.connected_rooms = [];
        }
      } else if (!row.connected_rooms) {
        row.connected_rooms = [];
      }
      return row;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching room dimensions:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/{id}:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Retrieve a single room dimension by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the room dimension
 *     responses:
 *       200:
 *         description: A single room dimension
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomDimension'
 *       404:
 *         description: Room dimension not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM room_dimensions WHERE room_dimension_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room dimension not found' });
    }
    
    // Process the result to ensure connected_rooms is properly handled
    const row = result.rows[0];
    if (row.connected_rooms && typeof row.connected_rooms === 'string') {
      try {
        row.connected_rooms = JSON.parse(row.connected_rooms);
      } catch (e) {
        row.connected_rooms = [];
      }
    } else if (!row.connected_rooms) {
      row.connected_rooms = [];
    }
    
    res.json(row);
  } catch (err) {
    console.error('Error fetching room dimension:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions:
 *   post:
 *     tags: [Room Dimensions]
 *     description: Create a new room dimension
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomDimensionInput'
 *     responses:
 *       201:
 *         description: Room dimension created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomDimension'
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, floor, room, room_type,
    room_width, room_length, room_height,
    is_covered, is_enclosed, railing_type, railing_height, floor_elevation,
    north_wall_type, north_wall_length, north_wall_height, north_wall_thickness, north_wall_doors, north_wall_windows,
    east_wall_type, east_wall_length, east_wall_height, east_wall_thickness, east_wall_doors, east_wall_windows,
    south_wall_type, south_wall_length, south_wall_height, south_wall_thickness, south_wall_doors, south_wall_windows,
    west_wall_type, west_wall_length, west_wall_height, west_wall_thickness, west_wall_doors, west_wall_windows,
    floor_type_id, ceiling_type_id, wall_finish_id, waterproofing_required,
    connected_rooms, notes, created_by
  } = req.body;

  try {
    // Ensure connected_rooms is properly formatted as a PostgreSQL array
    let connectedRoomsArray = connected_rooms;
    if (connected_rooms && !Array.isArray(connected_rooms)) {
      connectedRoomsArray = [connected_rooms];
    }
    
    const result = await db.query(
      `INSERT INTO room_dimensions 
       (project_id, floor, room, room_type,
        room_width, room_length, room_height,
        is_covered, is_enclosed, railing_type, railing_height, floor_elevation,
        north_wall_type, north_wall_length, north_wall_height, north_wall_thickness, north_wall_doors, north_wall_windows,
        east_wall_type, east_wall_length, east_wall_height, east_wall_thickness, east_wall_doors, east_wall_windows,
        south_wall_type, south_wall_length, south_wall_height, south_wall_thickness, south_wall_doors, south_wall_windows,
        west_wall_type, west_wall_length, west_wall_height, west_wall_thickness, west_wall_doors, west_wall_windows,
        floor_type_id, ceiling_type_id, wall_finish_id, waterproofing_required,
        connected_rooms, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
               $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43)
       RETURNING *`,
      [project_id, floor, room, room_type,
        room_width, room_length, room_height,
        is_covered, is_enclosed, railing_type, railing_height, floor_elevation,
        north_wall_type, north_wall_length, north_wall_height, north_wall_thickness, north_wall_doors, north_wall_windows,
        east_wall_type, east_wall_length, east_wall_height, east_wall_thickness, east_wall_doors, east_wall_windows,
        south_wall_type, south_wall_length, south_wall_height, south_wall_thickness, south_wall_doors, south_wall_windows,
        west_wall_type, west_wall_length, west_wall_height, west_wall_thickness, west_wall_doors, west_wall_windows,
        floor_type_id, ceiling_type_id, wall_finish_id, waterproofing_required,
        connectedRoomsArray, notes, created_by]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating room dimension:', err);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced entity does not exist' });
    }
    if (err.code === '22P02') { // invalid_text_representation, could happen with enum type
      return res.status(400).json({ error: 'Invalid room type' });
    }
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/{id}:
 *   put:
 *     tags: [Room Dimensions]
 *     description: Update an existing room dimension
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the room dimension
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomDimensionInput'
 *     responses:
 *       200:
 *         description: Room dimension updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomDimension'
 *       404:
 *         description: Room dimension not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, floor, room, room_type,
    room_width, room_length, room_height,
    is_covered, is_enclosed, railing_type, railing_height, floor_elevation,
    north_wall_type, north_wall_length, north_wall_height, north_wall_thickness, north_wall_doors, north_wall_windows,
    east_wall_type, east_wall_length, east_wall_height, east_wall_thickness, east_wall_doors, east_wall_windows,
    south_wall_type, south_wall_length, south_wall_height, south_wall_thickness, south_wall_doors, south_wall_windows,
    west_wall_type, west_wall_length, west_wall_height, west_wall_thickness, west_wall_doors, west_wall_windows,
    floor_type_id, ceiling_type_id, wall_finish_id, waterproofing_required,
    connected_rooms, notes, updated_by
  } = req.body;

  try {
    // Ensure connected_rooms is properly formatted as a PostgreSQL array
    let connectedRoomsArray = connected_rooms;
    if (connected_rooms && !Array.isArray(connected_rooms)) {
      connectedRoomsArray = [connected_rooms];
    }
    
    const result = await db.query(
      `UPDATE room_dimensions 
       SET project_id = $1, floor = $2, room = $3, room_type = $4,
           room_width = $5, room_length = $6, room_height = $7,
           is_covered = $8, is_enclosed = $9, railing_type = $10, railing_height = $11, floor_elevation = $12,
           north_wall_type = $13, north_wall_length = $14, north_wall_height = $15, north_wall_thickness = $16, 
           north_wall_doors = $17, north_wall_windows = $18,
           east_wall_type = $19, east_wall_length = $20, east_wall_height = $21, east_wall_thickness = $22, 
           east_wall_doors = $23, east_wall_windows = $24,
           south_wall_type = $25, south_wall_length = $26, south_wall_height = $27, south_wall_thickness = $28, 
           south_wall_doors = $29, south_wall_windows = $30,
           west_wall_type = $31, west_wall_length = $32, west_wall_height = $33, west_wall_thickness = $34, 
           west_wall_doors = $35, west_wall_windows = $36,
           floor_type_id = $37, ceiling_type_id = $38, wall_finish_id = $39, waterproofing_required = $40,
           connected_rooms = $41, notes = $42, updated_by = $43, updated_at = CURRENT_TIMESTAMP
       WHERE room_dimension_id = $44
       RETURNING *`,
      [project_id, floor, room, room_type,
        room_width, room_length, room_height,
        is_covered, is_enclosed, railing_type, railing_height, floor_elevation,
        north_wall_type, north_wall_length, north_wall_height, north_wall_thickness, north_wall_doors, north_wall_windows,
        east_wall_type, east_wall_length, east_wall_height, east_wall_thickness, east_wall_doors, east_wall_windows,
        south_wall_type, south_wall_length, south_wall_height, south_wall_thickness, south_wall_doors, south_wall_windows,
        west_wall_type, west_wall_length, west_wall_height, west_wall_thickness, west_wall_doors, west_wall_windows,
        floor_type_id, ceiling_type_id, wall_finish_id, waterproofing_required,
        connectedRoomsArray, notes, updated_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room dimension not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating room dimension:', err);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced entity does not exist' });
    }
    if (err.code === '22P02') { // invalid_text_representation, could happen with enum type
      return res.status(400).json({ error: 'Invalid room type' });
    }
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/{id}:
 *   delete:
 *     tags: [Room Dimensions]
 *     description: Delete a room dimension
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the room dimension
 *     responses:
 *       204:
 *         description: Room dimension deleted successfully
 *       404:
 *         description: Room dimension not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM room_dimensions WHERE room_dimension_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room dimension not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting room dimension:', err);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete due to references from other tables' });
    }
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/project/{projectId}:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Retrieve all room dimensions for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of room dimensions for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomDimension'
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM room_dimensions WHERE project_id = $1',
      [projectId]
    );
    
    // Process the results to ensure connected_rooms is properly handled
    const processedRows = result.rows.map(row => {
      if (row.connected_rooms && typeof row.connected_rooms === 'string') {
        try {
          row.connected_rooms = JSON.parse(row.connected_rooms);
        } catch (e) {
          row.connected_rooms = [];
        }
      } else if (!row.connected_rooms) {
        row.connected_rooms = [];
      }
      return row;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching room dimensions for project:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/floor:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Retrieve all room dimensions for a specific floor in a project
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *       - in: query
 *         name: floor
 *         required: true
 *         schema:
 *           type: string
 *         description: The floor
 *     responses:
 *       200:
 *         description: List of room dimensions for the floor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomDimension'
 */
router.get('/floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.query;
  
  if (!projectId || !floor) {
    return res.status(400).json({ error: 'Project ID and floor are required' });
  }
  
  try {
    const result = await db.query(
      'SELECT * FROM room_dimensions WHERE project_id = $1 AND floor = $2',
      [projectId, floor]
    );
    
    // Process the results to ensure connected_rooms is properly handled
    const processedRows = result.rows.map(row => {
      if (row.connected_rooms && typeof row.connected_rooms === 'string') {
        try {
          row.connected_rooms = JSON.parse(row.connected_rooms);
        } catch (e) {
          row.connected_rooms = [];
        }
      } else if (!row.connected_rooms) {
        row.connected_rooms = [];
      }
      return row;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching room dimensions for floor:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/type/{roomType}:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Retrieve all rooms of a specific type
 *     parameters:
 *       - in: path
 *         name: roomType
 *         required: true
 *         schema:
 *           type: string
 *         description: The room type (Room, Kitchen, Bathroom, Bedroom, Living Room, etc.)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Optional project ID to filter results
 *     responses:
 *       200:
 *         description: List of rooms of the specified type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomDimension'
 */
router.get('/type/:roomType', async (req, res) => {
  const db = req.db;
  const { roomType } = req.params;
  const { projectId } = req.query;
  
  try {
    let query = 'SELECT * FROM room_dimensions WHERE room_type = $1';
    let params = [roomType];
    
    if (projectId) {
      query += ' AND project_id = $2';
      params.push(projectId);
    }
    
    const result = await db.query(query, params);
    
    // Process the results to ensure connected_rooms is properly handled
    const processedRows = result.rows.map(row => {
      if (row.connected_rooms && typeof row.connected_rooms === 'string') {
        try {
          row.connected_rooms = JSON.parse(row.connected_rooms);
        } catch (e) {
          row.connected_rooms = [];
        }
      } else if (!row.connected_rooms) {
        row.connected_rooms = [];
      }
      return row;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching rooms by type:', err);
    if (err.code === '22P02') { // invalid_text_representation, could happen with enum type
      return res.status(400).json({ error: 'Invalid room type' });
    }
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/special:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Retrieve special areas like balconies, terraces, and lobbies
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Optional project ID to filter results
 *     responses:
 *       200:
 *         description: List of special areas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomDimension'
 */
router.get('/special', async (req, res) => {
  const db = req.db;
  const { projectId } = req.query;
  
  try {
    let query = "SELECT * FROM room_dimensions WHERE room_type IN ('Balcony', 'Terrace', 'Lobby')";
    let params = [];
    
    if (projectId) {
      query += ' AND project_id = $1';
      params.push(projectId);
    }
    
    const result = await db.query(query, params);
    
    // Process the results to ensure connected_rooms is properly handled
    const processedRows = result.rows.map(row => {
      if (row.connected_rooms && typeof row.connected_rooms === 'string') {
        try {
          row.connected_rooms = JSON.parse(row.connected_rooms);
        } catch (e) {
          row.connected_rooms = [];
        }
      } else if (!row.connected_rooms) {
        row.connected_rooms = [];
      }
      return row;
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching special areas:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

/**
 * @swagger
 * /room_dimensions/statistics/{projectId}:
 *   get:
 *     tags: [Room Dimensions]
 *     description: Get room statistics for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Room statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRooms:
 *                   type: integer
 *                 totalArea:
 *                   type: number
 *                 totalVolume:
 *                   type: number
 *                 roomsByType:
 *                   type: object
 *                 roomsByFloor:
 *                   type: object
 */
router.get('/statistics/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // Get total counts and measurements
    const totalQuery = await db.query(
      `SELECT 
         COUNT(*) as total_rooms,
         SUM(room_area) as total_area,
         SUM(room_volume) as total_volume
       FROM room_dimensions 
       WHERE project_id = $1`,
      [projectId]
    );
    
    // Get counts by room type
    const typeQuery = await db.query(
      `SELECT 
         room_type, 
         COUNT(*) as count,
         SUM(room_area) as area
       FROM room_dimensions 
       WHERE project_id = $1
       GROUP BY room_type`,
      [projectId]
    );
    
    // Get counts by floor
    const floorQuery = await db.query(
      `SELECT 
         floor, 
         COUNT(*) as count,
         SUM(room_area) as area
       FROM room_dimensions 
       WHERE project_id = $1
       GROUP BY floor`,
      [projectId]
    );
    
    // Format the response
    const roomsByType = {};
    typeQuery.rows.forEach(row => {
      roomsByType[row.room_type] = {
        count: parseInt(row.count),
        area: parseFloat(row.area || 0)
      };
    });
    
    const roomsByFloor = {};
    floorQuery.rows.forEach(row => {
      roomsByFloor[row.floor] = {
        count: parseInt(row.count),
        area: parseFloat(row.area || 0)
      };
    });
    
    res.json({
      totalRooms: parseInt(totalQuery.rows[0].total_rooms || 0),
      totalArea: parseFloat(totalQuery.rows[0].total_area || 0),
      totalVolume: parseFloat(totalQuery.rows[0].total_volume || 0),
      roomsByType,
      roomsByFloor
    });
  } catch (err) {
    console.error('Error calculating room statistics:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: err.message 
    });
  }
});

module.exports = router;
