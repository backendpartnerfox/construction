const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectMeasurementsPainting
 *   description: API for managing architect painting measurements
 */

// Get all painting measurements with full details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        amp.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_painting amp
      LEFT JOIN projects p ON amp.project_id = p.project_id
      LEFT JOIN users u1 ON amp.recorded_by = u1.id
      LEFT JOIN users u2 ON amp.verified_by = u2.id
      ORDER BY amp.measurement_id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching painting measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get painting measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        amp.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_painting amp
      LEFT JOIN projects p ON amp.project_id = p.project_id
      LEFT JOIN users u1 ON amp.recorded_by = u1.id
      LEFT JOIN users u2 ON amp.verified_by = u2.id
      WHERE amp.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Painting measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching painting measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get painting measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('🖌️ Fetching painting measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        amp.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_painting amp
      LEFT JOIN projects p ON amp.project_id = p.project_id
      LEFT JOIN users u1 ON amp.recorded_by = u1.id
      LEFT JOIN users u2 ON amp.verified_by = u2.id
      WHERE amp.project_id = $1 
      ORDER BY amp.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'painting measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching painting measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new painting measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, component_id, component_element_id, floor_id, room, surface_description,
    surface_type, length, height, door_window_area, surface_preparation,
    primer_coats, putty_coats, paint_coats, paint_finish, paint_brand_choice_id,
    paint_color, requires_client_selection, recorded_by, status
  } = req.body;

  console.log('📝 Creating painting measurement:', { project_id, room, surface_type });

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting painting measurement (area and net_area will be auto-calculated)...');
    
    // DO NOT include area and net_area - they are generated columns
    const result = await db.query(
      `INSERT INTO architect_measurements_painting 
       (project_id, component_id, component_element_id, floor_id, room, surface_description,
        surface_type, length, height, door_window_area, surface_preparation,
        primer_coats, putty_coats, paint_coats, paint_finish, paint_brand_choice_id,
        paint_color, requires_client_selection, recorded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        project_id, 
        component_id || 1, 
        component_element_id, 
        floor_id || 1, 
        room, 
        surface_description,
        surface_type,
        length,
        height,
        door_window_area || 0,
        surface_preparation,
        primer_coats || 1,
        putty_coats || 2,
        paint_coats || 2,
        paint_finish,
        paint_brand_choice_id,
        paint_color,
        requires_client_selection !== false, 
        recorded_by || 1, 
        status || 'Draft'
      ]
    );
    
    const paintingMeasurement = result.rows[0];
    console.log('✅ Painting measurement created:', paintingMeasurement.measurement_id);
    console.log('✅ Auto-calculated area:', paintingMeasurement.area);
    console.log('✅ Auto-calculated net_area:', paintingMeasurement.net_area);
    
    res.status(201).json({
      success: true,
      data: paintingMeasurement,
      message: 'Painting measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating painting measurement:', err.message);
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

// Update painting measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, component_id, component_element_id, floor_id, room, surface_description,
    surface_type, length, height, door_window_area, surface_preparation,
    primer_coats, putty_coats, paint_coats, paint_finish, paint_brand_choice_id,
    paint_color, requires_client_selection, status
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    // DO NOT include area and net_area in UPDATE - they are generated columns
    const result = await db.query(
      `UPDATE architect_measurements_painting 
       SET project_id = $1, component_id = $2, component_element_id = $3, floor_id = $4, 
           room = $5, surface_description = $6, surface_type = $7, length = $8, height = $9,
           door_window_area = $10, surface_preparation = $11, primer_coats = $12, putty_coats = $13,
           paint_coats = $14, paint_finish = $15, paint_brand_choice_id = $16, paint_color = $17,
           requires_client_selection = $18, status = $19
       WHERE measurement_id = $20
       RETURNING *`,
      [
        project_id, component_id || 1, component_element_id, floor_id || 1, 
        room, surface_description, surface_type, length, height,
        door_window_area, surface_preparation, primer_coats, putty_coats,
        paint_coats, paint_finish, paint_brand_choice_id, paint_color,
        requires_client_selection, status, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Painting measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating painting measurement:', err.message);
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

// Delete painting measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_painting WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Painting measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Painting measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting painting measurement:', err.message);
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

// Verify painting measurement
router.patch('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE architect_measurements_painting 
       SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'Verified'
       WHERE measurement_id = $2
       RETURNING *`,
      [verified_by || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Painting measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Painting measurement verified successfully'
    });
  } catch (err) {
    console.error('Error verifying painting measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
