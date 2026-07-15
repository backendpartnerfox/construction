const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectMeasurementsPlumbing
 *   description: API for managing architect plumbing measurements
 */

// Get all plumbing measurements with full details
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
      FROM architect_measurements_plumbing amp
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
    console.error('Error fetching plumbing measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get plumbing measurement by ID
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
      FROM architect_measurements_plumbing amp
      LEFT JOIN projects p ON amp.project_id = p.project_id
      LEFT JOIN users u1 ON amp.recorded_by = u1.id
      LEFT JOIN users u2 ON amp.verified_by = u2.id
      WHERE amp.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Plumbing measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching plumbing measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get plumbing measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('💧 Fetching plumbing measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        amp.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_plumbing amp
      LEFT JOIN projects p ON amp.project_id = p.project_id
      LEFT JOIN users u1 ON amp.recorded_by = u1.id
      LEFT JOIN users u2 ON amp.verified_by = u2.id
      WHERE amp.project_id = $1 
      ORDER BY amp.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'plumbing measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching plumbing measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new plumbing measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, component_id, component_element_id, floor_id, room, fixture_location,
    wash_basin_points, toilet_points, shower_points, kitchen_sink_points, washing_machine_points,
    cpvc_pipe_1_inch, cpvc_pipe_3_4_inch, cpvc_pipe_1_2_inch,
    pvc_pipe_4_inch, pvc_pipe_3_inch, pvc_pipe_2_inch,
    floor_drains, nahani_traps,
    fixture_brand_choice_id, pipe_brand_choice_id,
    requires_client_selection, recorded_by, status
  } = req.body;

  console.log('📝 Creating plumbing measurement:', { project_id, room, fixture_location });

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting plumbing measurement...');
    
    const result = await db.query(
      `INSERT INTO architect_measurements_plumbing 
       (project_id, component_id, component_element_id, floor_id, room, fixture_location,
        wash_basin_points, toilet_points, shower_points, kitchen_sink_points, washing_machine_points,
        cpvc_pipe_1_inch, cpvc_pipe_3_4_inch, cpvc_pipe_1_2_inch,
        pvc_pipe_4_inch, pvc_pipe_3_inch, pvc_pipe_2_inch,
        floor_drains, nahani_traps,
        fixture_brand_choice_id, pipe_brand_choice_id,
        requires_client_selection, recorded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *`,
      [
        project_id, 
        component_id || 1, 
        component_element_id, 
        floor_id || 1, 
        room, 
        fixture_location,
        wash_basin_points || 0,
        toilet_points || 0,
        shower_points || 0,
        kitchen_sink_points || 0,
        washing_machine_points || 0,
        cpvc_pipe_1_inch || 0,
        cpvc_pipe_3_4_inch || 0,
        cpvc_pipe_1_2_inch || 0,
        pvc_pipe_4_inch || 0,
        pvc_pipe_3_inch || 0,
        pvc_pipe_2_inch || 0,
        floor_drains || 0,
        nahani_traps || 0,
        fixture_brand_choice_id,
        pipe_brand_choice_id,
        requires_client_selection !== false, 
        recorded_by || 1, 
        status || 'Draft'
      ]
    );
    
    const plumbingMeasurement = result.rows[0];
    console.log('✅ Plumbing measurement created:', plumbingMeasurement.measurement_id);
    
    res.status(201).json({
      success: true,
      data: plumbingMeasurement,
      message: 'Plumbing measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating plumbing measurement:', err.message);
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

// Update plumbing measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, component_id, component_element_id, floor_id, room, fixture_location,
    wash_basin_points, toilet_points, shower_points, kitchen_sink_points, washing_machine_points,
    cpvc_pipe_1_inch, cpvc_pipe_3_4_inch, cpvc_pipe_1_2_inch,
    pvc_pipe_4_inch, pvc_pipe_3_inch, pvc_pipe_2_inch,
    floor_drains, nahani_traps,
    fixture_brand_choice_id, pipe_brand_choice_id,
    requires_client_selection, status
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    const result = await db.query(
      `UPDATE architect_measurements_plumbing 
       SET project_id = $1, component_id = $2, component_element_id = $3, floor_id = $4, 
           room = $5, fixture_location = $6,
           wash_basin_points = $7, toilet_points = $8, shower_points = $9, 
           kitchen_sink_points = $10, washing_machine_points = $11,
           cpvc_pipe_1_inch = $12, cpvc_pipe_3_4_inch = $13, cpvc_pipe_1_2_inch = $14,
           pvc_pipe_4_inch = $15, pvc_pipe_3_inch = $16, pvc_pipe_2_inch = $17,
           floor_drains = $18, nahani_traps = $19,
           fixture_brand_choice_id = $20, pipe_brand_choice_id = $21,
           requires_client_selection = $22, status = $23
       WHERE measurement_id = $24
       RETURNING *`,
      [
        project_id, component_id || 1, component_element_id, floor_id || 1, room, fixture_location,
        wash_basin_points, toilet_points, shower_points, kitchen_sink_points, washing_machine_points,
        cpvc_pipe_1_inch, cpvc_pipe_3_4_inch, cpvc_pipe_1_2_inch,
        pvc_pipe_4_inch, pvc_pipe_3_inch, pvc_pipe_2_inch,
        floor_drains, nahani_traps,
        fixture_brand_choice_id, pipe_brand_choice_id,
        requires_client_selection, status, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Plumbing measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating plumbing measurement:', err.message);
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

// Delete plumbing measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_plumbing WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Plumbing measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Plumbing measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting plumbing measurement:', err.message);
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

// Verify plumbing measurement
router.patch('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE architect_measurements_plumbing 
       SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'Verified'
       WHERE measurement_id = $2
       RETURNING *`,
      [verified_by || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Plumbing measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Plumbing measurement verified successfully'
    });
  } catch (err) {
    console.error('Error verifying plumbing measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
