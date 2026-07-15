const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectMeasurementsFlooring
 *   description: API for managing architect flooring measurements
 */

// Get all flooring measurements with full details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        amf.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_flooring amf
      LEFT JOIN projects p ON amf.project_id = p.project_id
      LEFT JOIN users u1 ON amf.recorded_by = u1.id
      LEFT JOIN users u2 ON amf.verified_by = u2.id
      ORDER BY amf.measurement_id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching flooring measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get flooring measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        amf.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_flooring amf
      LEFT JOIN projects p ON amf.project_id = p.project_id
      LEFT JOIN users u1 ON amf.recorded_by = u1.id
      LEFT JOIN users u2 ON amf.verified_by = u2.id
      WHERE amf.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Flooring measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching flooring measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get flooring measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('🎨 Fetching flooring measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        amf.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_flooring amf
      LEFT JOIN projects p ON amf.project_id = p.project_id
      LEFT JOIN users u1 ON amf.recorded_by = u1.id
      LEFT JOIN users u2 ON amf.verified_by = u2.id
      WHERE amf.project_id = $1 
      ORDER BY amf.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'flooring measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching flooring measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new flooring measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, component_id, component_element_id, floor_id, room, area_description,
    length, width, flooring_type, base_preparation_required, base_thickness,
    skirting_required, skirting_height, skirting_length,
    tile_size, pattern_type, flooring_choice_id, skirting_choice_id,
    requires_client_selection, recorded_by, status
  } = req.body;

  console.log('📝 Creating flooring measurement:', { project_id, room, flooring_type });

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting flooring measurement (area will be auto-calculated)...');
    
    // DO NOT include area - it's a generated column
    const result = await db.query(
      `INSERT INTO architect_measurements_flooring 
       (project_id, component_id, component_element_id, floor_id, room, area_description,
        length, width, flooring_type, base_preparation_required, base_thickness,
        skirting_required, skirting_height, skirting_length,
        tile_size, pattern_type, flooring_choice_id, skirting_choice_id,
        requires_client_selection, recorded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        project_id, 
        component_id || 1, 
        component_element_id, 
        floor_id || 1, 
        room, 
        area_description,
        length,
        width,
        flooring_type,
        base_preparation_required !== false,
        base_thickness,
        skirting_required !== false,
        skirting_height,
        skirting_length,
        tile_size,
        pattern_type,
        flooring_choice_id,
        skirting_choice_id,
        requires_client_selection !== false, 
        recorded_by || 1, 
        status || 'Draft'
      ]
    );
    
    const flooringMeasurement = result.rows[0];
    console.log('✅ Flooring measurement created:', flooringMeasurement.measurement_id);
    console.log('✅ Auto-calculated area:', flooringMeasurement.area);
    
    res.status(201).json({
      success: true,
      data: flooringMeasurement,
      message: 'Flooring measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating flooring measurement:', err.message);
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

// Update flooring measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, component_id, component_element_id, floor_id, room, area_description,
    length, width, flooring_type, base_preparation_required, base_thickness,
    skirting_required, skirting_height, skirting_length,
    tile_size, pattern_type, flooring_choice_id, skirting_choice_id,
    requires_client_selection, status
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    // DO NOT include area in UPDATE - it's a generated column
    const result = await db.query(
      `UPDATE architect_measurements_flooring 
       SET project_id = $1, component_id = $2, component_element_id = $3, floor_id = $4, 
           room = $5, area_description = $6, length = $7, width = $8,
           flooring_type = $9, base_preparation_required = $10, base_thickness = $11,
           skirting_required = $12, skirting_height = $13, skirting_length = $14,
           tile_size = $15, pattern_type = $16, flooring_choice_id = $17, skirting_choice_id = $18,
           requires_client_selection = $19, status = $20
       WHERE measurement_id = $21
       RETURNING *`,
      [
        project_id, component_id || 1, component_element_id, floor_id || 1, 
        room, area_description, length, width,
        flooring_type, base_preparation_required, base_thickness,
        skirting_required, skirting_height, skirting_length,
        tile_size, pattern_type, flooring_choice_id, skirting_choice_id,
        requires_client_selection, status, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Flooring measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating flooring measurement:', err.message);
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

// Delete flooring measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_flooring WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Flooring measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Flooring measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting flooring measurement:', err.message);
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

// Verify flooring measurement
router.patch('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE architect_measurements_flooring 
       SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'Verified'
       WHERE measurement_id = $2
       RETURNING *`,
      [verified_by || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Flooring measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Flooring measurement verified successfully'
    });
  } catch (err) {
    console.error('Error verifying flooring measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
