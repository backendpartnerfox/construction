const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectWallMeasurements
 *   description: API for managing architect wall measurements
 */

// Get all wall measurements with project details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        awm.*,
        p.project_name,
        p.project_code,
        u.username as created_by_name
      FROM architect_walls_measurement awm
      LEFT JOIN projects p ON awm.project_id = p.project_id
      LEFT JOIN users u ON awm.created_by = u.id
      ORDER BY awm.measurement_id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching architect wall measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get wall measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        awm.*,
        p.project_name,
        p.project_code,
        u.username as created_by_name
      FROM architect_walls_measurement awm
      LEFT JOIN projects p ON awm.project_id = p.project_id
      LEFT JOIN users u ON awm.created_by = u.id
      WHERE awm.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Architect wall measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching architect wall measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get wall measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('🧱 Fetching wall measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        awm.*,
        p.project_name,
        p.project_code,
        u.username as created_by_name
      FROM architect_walls_measurement awm
      LEFT JOIN projects p ON awm.project_id = p.project_id
      LEFT JOIN users u ON awm.created_by = u.id
      WHERE awm.project_id = $1 
      ORDER BY awm.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'wall measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching architect wall measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new wall measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, floor, room, walltype, wall_direction, wall_thickness, brick_choice_id,
    width, height, total_wall_width, window_width, window_height, window2_width, window2_height,
    door_width, door_height, door2_width, door2_height, lintel_width, lintel_height, created_by
  } = req.body;

  console.log('📝 Creating wall measurement:', { project_id, floor, room, walltype, wall_direction });

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting wall measurement (generated columns will be auto-calculated)...');
    
    // Insert the wall measurement - DO NOT include generated columns (sqft fields and actual_wall_width)
    const result = await db.query(
      `INSERT INTO architect_walls_measurement 
       (project_id, floor, room, walltype, wall_direction, wall_thickness, brick_choice_id,
        width, height, total_wall_width, 
        window_width, window_height,
        window2_width, window2_height,
        door_width, door_height,
        door2_width, door2_height,
        lintel_width, lintel_height,
        created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        project_id, 
        floor, 
        room, 
        walltype, 
        wall_direction, 
        wall_thickness, 
        brick_choice_id,
        width, 
        height, 
        total_wall_width || width, // Use width if total_wall_width not provided
        window_width, 
        window_height,
        window2_width, 
        window2_height,
        door_width, 
        door_height,
        door2_width, 
        door2_height,
        lintel_width, 
        lintel_height,
        created_by || 1
      ]
    );
    
    const wallMeasurement = result.rows[0];
    console.log('✅ Wall measurement created:', wallMeasurement.measurement_id);
    console.log('✅ Auto-calculated values:', {
      window_sqft: wallMeasurement.window_sqft,
      window2_sqft: wallMeasurement.window2_sqft,
      door_sqft: wallMeasurement.door_sqft,
      door2_sqft: wallMeasurement.door2_sqft,
      lintel_sqft: wallMeasurement.lintel_sqft,
      actual_wall_width: wallMeasurement.actual_wall_width
    });
    
    res.status(201).json({
      success: true,
      data: wallMeasurement,
      message: 'Wall measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating architect wall measurement:', err.message);
    console.error('Error details:', err);
    
    if (err.code === '23502') {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        details: err.message
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false,
        error: 'Referenced entity does not exist',
        details: err.message
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
});

// Update wall measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, floor, room, walltype, wall_direction, wall_thickness, brick_choice_id,
    width, height, total_wall_width, window_width, window_height, window2_width, window2_height,
    door_width, door_height, door2_width, door2_height, lintel_width, lintel_height
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    // Update - DO NOT include generated columns
    const result = await db.query(
      `UPDATE architect_walls_measurement 
       SET project_id = $1, floor = $2, room = $3, walltype = $4, wall_direction = $5, 
           wall_thickness = $6, brick_choice_id = $7, width = $8, height = $9, total_wall_width = $10,
           window_width = $11, window_height = $12,
           window2_width = $13, window2_height = $14,
           door_width = $15, door_height = $16,
           door2_width = $17, door2_height = $18,
           lintel_width = $19, lintel_height = $20
       WHERE measurement_id = $21
       RETURNING *`,
      [
        project_id, floor, room, walltype, wall_direction, wall_thickness, brick_choice_id,
        width, height, total_wall_width || width,
        window_width, window_height,
        window2_width, window2_height,
        door_width, door_height,
        door2_width, door2_height,
        lintel_width, lintel_height,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Architect wall measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating architect wall measurement:', err.message);
    if (err.code === '23502') {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false,
        error: 'Referenced entity does not exist' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete wall measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_walls_measurement WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Architect wall measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Architect wall measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting architect wall measurement:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete due to references from other tables' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get summary for project
router.get('/summary/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_measurements,
        SUM(width * height) as total_wall_area,
        SUM(COALESCE(window_sqft, 0) + COALESCE(window2_sqft, 0)) as total_window_area,
        SUM(COALESCE(door_sqft, 0) + COALESCE(door2_sqft, 0)) as total_door_area,
        SUM(COALESCE(actual_wall_width, 0) * COALESCE(height, 0)) as total_actual_wall_area
       FROM architect_walls_measurement 
       WHERE project_id = $1`,
      [projectId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching wall measurements summary:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
