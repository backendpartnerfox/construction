const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectMeasurementsWindows
 *   description: API for managing architect window measurements
 */

// Get all window measurements with full details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        amw.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_windows amw
      LEFT JOIN projects p ON amw.project_id = p.project_id
      LEFT JOIN users u1 ON amw.recorded_by = u1.id
      LEFT JOIN users u2 ON amw.verified_by = u2.id
      ORDER BY amw.measurement_id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching window measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get window measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        amw.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_windows amw
      LEFT JOIN projects p ON amw.project_id = p.project_id
      LEFT JOIN users u1 ON amw.recorded_by = u1.id
      LEFT JOIN users u2 ON amw.verified_by = u2.id
      WHERE amw.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Window measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching window measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get window measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('🪟 Fetching window measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        amw.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_windows amw
      LEFT JOIN projects p ON amw.project_id = p.project_id
      LEFT JOIN users u1 ON amw.recorded_by = u1.id
      LEFT JOIN users u2 ON amw.verified_by = u2.id
      WHERE amw.project_id = $1 
      ORDER BY amw.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'window measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching window measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new window measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, component_id, component_element_id, floor_id, room, window_location,
    wall_direction, sill_level, window_width, window_height, window_thickness,
    window_type, frame_material, glass_type, opening_style, has_grills,
    grill_material, grill_design, quantity, window_choice_id,
    requires_client_selection, recorded_by, status, wall_measurement_id, wall_code
  } = req.body;

  console.log('📝 Creating window measurement:', { project_id, room, window_location });

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting window measurement (window_area will be auto-calculated)...');
    
    // DO NOT include window_area - it's a generated column
    const result = await db.query(
      `INSERT INTO architect_measurements_windows 
       (project_id, component_id, component_element_id, floor_id, room, window_location,
        wall_direction, sill_level, window_width, window_height, window_thickness,
        window_type, frame_material, glass_type, opening_style, has_grills,
        grill_material, grill_design, quantity, window_choice_id,
        requires_client_selection, recorded_by, status, wall_measurement_id, wall_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [
        project_id, 
        component_id || 1, 
        component_element_id, 
        floor_id || 1, 
        room, 
        window_location,
        wall_direction, 
        sill_level,
        window_width, 
        window_height, 
        window_thickness,
        window_type, 
        frame_material, 
        glass_type, 
        opening_style, 
        has_grills || false,
        grill_material, 
        grill_design, 
        quantity || 1, 
        window_choice_id,
        requires_client_selection !== false, 
        recorded_by || 1, 
        status || 'Draft', 
        wall_measurement_id, 
        wall_code
      ]
    );
    
    const windowMeasurement = result.rows[0];
    console.log('✅ Window measurement created:', windowMeasurement.measurement_id);
    console.log('✅ Auto-calculated window_area:', windowMeasurement.window_area);
    
    res.status(201).json({
      success: true,
      data: windowMeasurement,
      message: 'Window measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating window measurement:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    
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
        details: err.detail || err.message
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
});

// Update window measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, component_id, component_element_id, floor_id, room, window_location,
    wall_direction, sill_level, window_width, window_height, window_thickness,
    window_type, frame_material, glass_type, opening_style, has_grills,
    grill_material, grill_design, quantity, window_choice_id,
    requires_client_selection, status, wall_measurement_id, wall_code
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    // DO NOT include window_area in UPDATE - it's a generated column
    const result = await db.query(
      `UPDATE architect_measurements_windows 
       SET project_id = $1, component_id = $2, component_element_id = $3, floor_id = $4, 
           room = $5, window_location = $6, wall_direction = $7, sill_level = $8,
           window_width = $9, window_height = $10, window_thickness = $11,
           window_type = $12, frame_material = $13, glass_type = $14, opening_style = $15,
           has_grills = $16, grill_material = $17, grill_design = $18, quantity = $19,
           window_choice_id = $20, requires_client_selection = $21, status = $22,
           wall_measurement_id = $23, wall_code = $24
       WHERE measurement_id = $25
       RETURNING *`,
      [
        project_id, component_id || 1, component_element_id, floor_id || 1, room, window_location,
        wall_direction, sill_level, window_width, window_height, window_thickness,
        window_type, frame_material, glass_type, opening_style, has_grills,
        grill_material, grill_design, quantity, window_choice_id,
        requires_client_selection, status, wall_measurement_id, wall_code, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Window measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating window measurement:', err.message);
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

// Delete window measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_windows WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Window measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Window measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting window measurement:', err.message);
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

// Verify window measurement
router.patch('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE architect_measurements_windows 
       SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'Verified'
       WHERE measurement_id = $2
       RETURNING *`,
      [verified_by || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Window measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Window measurement verified successfully'
    });
  } catch (err) {
    console.error('Error verifying window measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
