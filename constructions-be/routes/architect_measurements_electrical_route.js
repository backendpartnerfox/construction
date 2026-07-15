const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectMeasurementsElectrical
 *   description: API for managing architect electrical measurements
 */

// Get all electrical measurements with full details
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        ame.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_electrical ame
      LEFT JOIN projects p ON ame.project_id = p.project_id
      LEFT JOIN users u1 ON ame.recorded_by = u1.id
      LEFT JOIN users u2 ON ame.verified_by = u2.id
      ORDER BY ame.measurement_id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching electrical measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get electrical measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ame.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_electrical ame
      LEFT JOIN projects p ON ame.project_id = p.project_id
      LEFT JOIN users u1 ON ame.recorded_by = u1.id
      LEFT JOIN users u2 ON ame.verified_by = u2.id
      WHERE ame.measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Electrical measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching electrical measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get electrical measurements by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('⚡ Fetching electrical measurements for project:', projectId);
    const result = await db.query(`
      SELECT 
        ame.*,
        p.project_name,
        p.project_code,
        u1.username as recorded_by_name,
        u2.username as verified_by_name
      FROM architect_measurements_electrical ame
      LEFT JOIN projects p ON ame.project_id = p.project_id
      LEFT JOIN users u1 ON ame.recorded_by = u1.id
      LEFT JOIN users u2 ON ame.verified_by = u2.id
      WHERE ame.project_id = $1 
      ORDER BY ame.measurement_id DESC
    `, [projectId]);
    
    console.log('✅ Found', result.rows.length, 'electrical measurements');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching electrical measurements for project:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new electrical measurement
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, component_id, component_element_id, floor_id, room, circuit_description,
    light_points, fan_points, power_outlets_5a, power_outlets_15a, ac_points,
    ups_points, data_points, tv_points, telephone_points,
    conduit_length_1_inch, conduit_length_3_4_inch,
    wire_length_1_5_sqmm, wire_length_2_5_sqmm, wire_length_4_sqmm,
    mcb_required, db_required, switch_brand_choice_id, wire_brand_choice_id,
    requires_client_selection, recorded_by, status
  } = req.body;

  console.log('📝 Creating electrical measurement:', { project_id, room, circuit_description });

  if (!project_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Project ID is required' 
    });
  }

  try {
    console.log('💾 Inserting electrical measurement...');
    
    const result = await db.query(
      `INSERT INTO architect_measurements_electrical 
       (project_id, component_id, component_element_id, floor_id, room, circuit_description,
        light_points, fan_points, power_outlets_5a, power_outlets_15a, ac_points,
        ups_points, data_points, tv_points, telephone_points,
        conduit_length_1_inch, conduit_length_3_4_inch,
        wire_length_1_5_sqmm, wire_length_2_5_sqmm, wire_length_4_sqmm,
        mcb_required, db_required, switch_brand_choice_id, wire_brand_choice_id,
        requires_client_selection, recorded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
       RETURNING *`,
      [
        project_id, 
        component_id || 1, 
        component_element_id, 
        floor_id || 1, 
        room, 
        circuit_description,
        light_points || 0,
        fan_points || 0,
        power_outlets_5a || 0,
        power_outlets_15a || 0,
        ac_points || 0,
        ups_points || 0,
        data_points || 0,
        tv_points || 0,
        telephone_points || 0,
        conduit_length_1_inch || 0,
        conduit_length_3_4_inch || 0,
        wire_length_1_5_sqmm || 0,
        wire_length_2_5_sqmm || 0,
        wire_length_4_sqmm || 0,
        mcb_required || 0,
        db_required || false,
        switch_brand_choice_id,
        wire_brand_choice_id,
        requires_client_selection !== false, 
        recorded_by || 1, 
        status || 'Draft'
      ]
    );
    
    const electricalMeasurement = result.rows[0];
    console.log('✅ Electrical measurement created:', electricalMeasurement.measurement_id);
    
    res.status(201).json({
      success: true,
      data: electricalMeasurement,
      message: 'Electrical measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating electrical measurement:', err.message);
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

// Update electrical measurement
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, component_id, component_element_id, floor_id, room, circuit_description,
    light_points, fan_points, power_outlets_5a, power_outlets_15a, ac_points,
    ups_points, data_points, tv_points, telephone_points,
    conduit_length_1_inch, conduit_length_3_4_inch,
    wire_length_1_5_sqmm, wire_length_2_5_sqmm, wire_length_4_sqmm,
    mcb_required, db_required, switch_brand_choice_id, wire_brand_choice_id,
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
      `UPDATE architect_measurements_electrical 
       SET project_id = $1, component_id = $2, component_element_id = $3, floor_id = $4, 
           room = $5, circuit_description = $6,
           light_points = $7, fan_points = $8, power_outlets_5a = $9, power_outlets_15a = $10,
           ac_points = $11, ups_points = $12, data_points = $13, tv_points = $14,
           telephone_points = $15, conduit_length_1_inch = $16, conduit_length_3_4_inch = $17,
           wire_length_1_5_sqmm = $18, wire_length_2_5_sqmm = $19, wire_length_4_sqmm = $20,
           mcb_required = $21, db_required = $22, switch_brand_choice_id = $23,
           wire_brand_choice_id = $24, requires_client_selection = $25, status = $26
       WHERE measurement_id = $27
       RETURNING *`,
      [
        project_id, component_id || 1, component_element_id, floor_id || 1, room, circuit_description,
        light_points, fan_points, power_outlets_5a, power_outlets_15a, ac_points,
        ups_points, data_points, tv_points, telephone_points,
        conduit_length_1_inch, conduit_length_3_4_inch,
        wire_length_1_5_sqmm, wire_length_2_5_sqmm, wire_length_4_sqmm,
        mcb_required, db_required, switch_brand_choice_id, wire_brand_choice_id,
        requires_client_selection, status, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Electrical measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating electrical measurement:', err.message);
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

// Delete electrical measurement
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_electrical WHERE measurement_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Electrical measurement not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Electrical measurement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting electrical measurement:', err.message);
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

// Verify electrical measurement
router.patch('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE architect_measurements_electrical 
       SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, status = 'Verified'
       WHERE measurement_id = $2
       RETURNING *`,
      [verified_by || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Electrical measurement not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Electrical measurement verified successfully'
    });
  } catch (err) {
    console.error('Error verifying electrical measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
