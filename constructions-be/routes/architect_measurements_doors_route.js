const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectMeasurementsDoors
 *   description: API for managing architect door measurements
 */

// Get all door measurements with full details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        amd.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_doors amd
      LEFT JOIN projects p ON amd.project_id = p.project_id
      LEFT JOIN users u1 ON amd.recorded_by = u1.id
      LEFT JOIN users u2 ON amd.verified_by = u2.id
      ORDER BY amd.measurement_id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching door measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get door measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        amd.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_doors amd
      LEFT JOIN projects p ON amd.project_id = p.project_id
      LEFT JOIN users u1 ON amd.recorded_by = u1.id
      LEFT JOIN users u2 ON amd.verified_by = u2.id
      WHERE amd.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Door measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching door measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get door measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('🚪 Fetching door measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        amd.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_doors amd
      LEFT JOIN projects p ON amd.project_id = p.project_id
      LEFT JOIN users u1 ON amd.recorded_by = u1.id
      LEFT JOIN users u2 ON amd.verified_by = u2.id
      WHERE amd.project_id = $1 
      ORDER BY amd.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'door measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching door measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new door measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, component_id, component_element_id, floor_id, room, door_location,
    wall_direction, door_width, door_height, door_thickness, frame_width, frame_thickness,
    door_type, door_material, door_style, quantity, door_choice_id,
    requires_client_selection, recorded_by, status, wall_measurement_id, wall_code
  } = req.body;

  console.log('📝 Creating door measurement:', { project_id, room, door_location, component_id, floor_id });

  // Only project_id is required
  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting door measurement (door_area will be auto-calculated)...');
    
    // DO NOT include door_area - it's a generated column
    const result = await db.query(
      `INSERT INTO architect_measurements_doors 
       (project_id, component_id, component_element_id, floor_id, room, door_location,
        wall_direction, door_width, door_height, door_thickness, frame_width, frame_thickness,
        door_type, door_material, door_style, quantity, door_choice_id,
        requires_client_selection, recorded_by, status, wall_measurement_id, wall_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        project_id, 
        component_id || 1, 
        component_element_id, 
        floor_id || 1, 
        room, 
        door_location,
        wall_direction, 
        door_width, 
        door_height, 
        door_thickness, 
        frame_width, 
        frame_thickness,
        door_type, 
        door_material, 
        door_style, 
        quantity || 1, 
        door_choice_id,
        requires_client_selection !== false, 
        recorded_by || 1, 
        status || 'Draft', 
        wall_measurement_id, 
        wall_code
      ]
    );
    
    const doorMeasurement = result.rows[0];
    console.log('✅ Door measurement created:', doorMeasurement.measurement_id);
    console.log('✅ Auto-calculated door_area:', doorMeasurement.door_area);
    
    res.status(201).json({
      success: true,
      data: doorMeasurement,
      message: 'Door measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating door measurement:', err.message);
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
        error: 'Referenced entity does not exist. Please ensure the project, component, and floor exist.',
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

// Update door measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, component_id, component_element_id, floor_id, room, door_location,
    wall_direction, door_width, door_height, door_thickness, frame_width, frame_thickness,
    door_type, door_material, door_style, quantity, door_choice_id,
    requires_client_selection, status, wall_measurement_id, wall_code
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    // DO NOT include door_area in UPDATE - it's a generated column
    const result = await db.query(
      `UPDATE architect_measurements_doors 
       SET project_id = $1, component_id = $2, component_element_id = $3, floor_id = $4, 
           room = $5, door_location = $6, wall_direction = $7, door_width = $8, door_height = $9, 
           door_thickness = $10, frame_width = $11, frame_thickness = $12, door_type = $13,
           door_material = $14, door_style = $15, quantity = $16, door_choice_id = $17,
           requires_client_selection = $18, status = $19, wall_measurement_id = $20, 
           wall_code = $21
       WHERE measurement_id = $22
       RETURNING *`,
      [
        project_id, component_id || 1, component_element_id, floor_id || 1, room, door_location,
        wall_direction, door_width, door_height, door_thickness, frame_width, frame_thickness,
        door_type, door_material, door_style, quantity, door_choice_id,
        requires_client_selection, status, wall_measurement_id, wall_code, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Door measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating door measurement:', err.message);
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

// Delete door measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_doors WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Door measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Door measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting door measurement:', err.message);
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

// Verify door measurement
router.patch('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE architect_measurements_doors 
       SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'Verified'
       WHERE measurement_id = $2
       RETURNING *`,
      [verified_by || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Door measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Door measurement verified successfully'
    });
  } catch (err) {
    console.error('Error verifying door measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
