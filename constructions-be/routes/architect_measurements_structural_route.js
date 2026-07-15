const express = require('express');
const router = express.Router();

// Get all structural measurements
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT m.*, 
             p.project_name, 
             e.element_name, 
             CONCAT(r.first_name, ' ', r.last_name) as recorded_by_name,
             CONCAT(v.first_name, ' ', v.last_name) as verified_by_name
      FROM architect_measurements_structural m
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN elements e ON m.element_id = e.element_id
      LEFT JOIN employees r ON m.recorded_by = r.employee_id
      LEFT JOIN employees v ON m.verified_by = v.employee_id
      ORDER BY m.recorded_at DESC
    `);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get all structural measurements for a project
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  try {
    const result = await db.query(`
      SELECT m.*, 
             p.project_name, 
             e.element_name,
             e.element_category,
             CONCAT(r.first_name, ' ', r.last_name) as recorded_by_name,
             CONCAT(v.first_name, ' ', v.last_name) as verified_by_name
      FROM architect_measurements_structural m
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN elements e ON m.element_id = e.element_id
      LEFT JOIN employees r ON m.recorded_by = r.employee_id
      LEFT JOIN employees v ON m.verified_by = v.employee_id
      WHERE m.project_id = $1
      ORDER BY m.recorded_at DESC
    `, [projectId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get structural measurement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  // Check if id is numeric, otherwise it might be a route like /project/:projectId
  if (isNaN(id)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid measurement ID' 
    });
  }
  
  try {
    const result = await db.query(`
      SELECT m.*, 
             p.project_name, 
             e.element_name, 
             CONCAT(r.first_name, ' ', r.last_name) as recorded_by_name,
             CONCAT(v.first_name, ' ', v.last_name) as verified_by_name
      FROM architect_measurements_structural m
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN elements e ON m.element_id = e.element_id
      LEFT JOIN employees r ON m.recorded_by = r.employee_id
      LEFT JOIN employees v ON m.verified_by = v.employee_id
      WHERE m.structural_measurement_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Structural measurement not found' 
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// SIMPLIFIED POST ROUTE - Just insert data
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id, element_id, floor, component,
    length, width, height, depth, diameter, radius,
    slab_thickness, slab_type, area, volume, perimeter, thickness,
    cross_sectional_area, horizontal_projection, vertical_projection,
    rise, run, stair_width, number_of_steps, angle, slope_percentage,
    curvature_radius, tmt_main_bar_dia, tmt_distribution_bar_dia,
    qty_main_bars, qty_distribution_bars, rmc_grade, stirrup_dia,
    stirrup_spacing, concrete_cover, design_load, live_load, dead_load,
    reinforcement_type, concrete_mix_ratio, expansion_joint_width,
    thermal_conductivity, fire_rating, sound_insulation_rating,
    recorded_by, status
  } = req.body;

  console.log('📥 Received POST request for structural measurement');
  console.log('Project ID:', project_id, 'Element ID:', element_id, 'Recorded By:', recorded_by);

  if (!project_id || !element_id || !recorded_by) {
    console.error('❌ Missing required fields');
    return res.status(400).json({ 
      success: false,
      error: "Project ID, Element ID, and Recorded By are required" 
    });
  }

  try {
    console.log('📝 Inserting structural measurement...');
    
    const structuralQuery = `
      INSERT INTO architect_measurements_structural (
        project_id, element_id, floor, component,
        length, width, height, depth, diameter, radius,
        slab_thickness, slab_type, area, volume, perimeter, thickness,
        cross_sectional_area, horizontal_projection, vertical_projection,
        rise, run, stair_width, number_of_steps, angle, slope_percentage,
        curvature_radius, tmt_main_bar_dia, tmt_distribution_bar_dia,
        qty_main_bars, qty_distribution_bars, rmc_grade, stirrup_dia,
        stirrup_spacing, concrete_cover, design_load, live_load, dead_load,
        reinforcement_type, concrete_mix_ratio, expansion_joint_width,
        thermal_conductivity, fire_rating, sound_insulation_rating,
        recorded_by, recorded_at, status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
             $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 
             $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
             $42, $43, $44, $45, $46)
      RETURNING *
    `;
    
    const structuralValues = [
      project_id, element_id, floor || null, component || null,
      length || null, width || null, height || null,
      depth || null, diameter || null, radius || null, 
      slab_thickness || null, slab_type || null,
      area || null, volume || null, perimeter || null, thickness || null,
      cross_sectional_area || null, horizontal_projection || null, vertical_projection || null,
      rise || null, run || null, stair_width || null, number_of_steps || null, 
      angle || null, slope_percentage || null, curvature_radius || null, 
      tmt_main_bar_dia || null, tmt_distribution_bar_dia || null, 
      qty_main_bars || null, qty_distribution_bars || null,
      rmc_grade || null, stirrup_dia || null, stirrup_spacing || null, concrete_cover || null,
      design_load || null, live_load || null, dead_load || null, 
      reinforcement_type || null, concrete_mix_ratio || null, 
      expansion_joint_width || null, thermal_conductivity || null, 
      fire_rating || null, sound_insulation_rating || null, 
      recorded_by, new Date(), status || 'Draft'
    ];

    console.log('💾 Executing INSERT query...');
    const result = await db.query(structuralQuery, structuralValues);
    const measurement = result.rows[0];
    
    console.log('✅ Structural measurement created successfully with ID:', measurement.structural_measurement_id);
    
    res.status(201).json({
      success: true,
      data: measurement,
      message: 'Structural measurement created successfully'
    });
    
  } catch (err) {
    console.error('❌ Error creating structural measurement:', err.message);
    console.error('❌ Error details:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// VERIFY single measurement route (MUST come before /:id route)
router.put('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;

  console.log('✅ Verifying structural measurement ID:', id);

  if (!verified_by) {
    return res.status(400).json({ 
      success: false,
      error: "Verified By is required" 
    });
  }

  try {
    const result = await db.query(`
      UPDATE architect_measurements_structural 
      SET status = 'Verified', 
          verified_by = $1, 
          verified_at = CURRENT_TIMESTAMP
      WHERE structural_measurement_id = $2 AND status = 'Draft'
      RETURNING *
    `, [verified_by, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Draft measurement not found or already verified' 
      });
    }
    
    console.log('✅ Structural measurement verified successfully');
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Structural measurement verified successfully'
    });
    
  } catch (err) {
    console.error('❌ Error verifying structural measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// VERIFY ALL measurements for a project route
router.put('/project/:projectId/verify-all', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { verified_by } = req.body;

  console.log('✅ Verifying all draft structural measurements for project:', projectId);

  if (!verified_by) {
    return res.status(400).json({ 
      success: false,
      error: "Verified By is required" 
    });
  }

  try {
    const result = await db.query(`
      UPDATE architect_measurements_structural 
      SET status = 'Verified', 
          verified_by = $1, 
          verified_at = CURRENT_TIMESTAMP
      WHERE project_id = $2 AND status = 'Draft'
      RETURNING structural_measurement_id
    `, [verified_by, projectId]);
    
    console.log(`✅ Verified ${result.rowCount} structural measurements`);
    
    res.json({
      success: true,
      data: {
        verified_count: result.rowCount,
        verified_ids: result.rows.map(row => row.structural_measurement_id)
      },
      message: `${result.rowCount} structural measurements verified successfully`
    });
    
  } catch (err) {
    console.error('❌ Error verifying structural measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// UPDATE route (MUST come after specific routes like /:id/verify)
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id, element_id, floor, component,
    length, width, height, depth, diameter, radius,
    slab_thickness, slab_type, area, volume, perimeter, thickness,
    cross_sectional_area, horizontal_projection, vertical_projection,
    rise, run, stair_width, number_of_steps, angle, slope_percentage,
    curvature_radius, tmt_main_bar_dia, tmt_distribution_bar_dia,
    qty_main_bars, qty_distribution_bars, rmc_grade, stirrup_dia,
    stirrup_spacing, concrete_cover, design_load, live_load, dead_load,
    reinforcement_type, concrete_mix_ratio, expansion_joint_width,
    thermal_conductivity, fire_rating, sound_insulation_rating,
    recorded_by, status
  } = req.body;

  console.log('📝 Updating structural measurement ID:', id);

  if (!project_id || !element_id || !recorded_by) {
    return res.status(400).json({ 
      success: false,
      error: "Project ID, Element ID, and Recorded By are required" 
    });
  }

  try {
    const updateQuery = `
      UPDATE architect_measurements_structural SET
        project_id = $1, element_id = $2, floor = $3, component = $4,
        length = $5, width = $6, height = $7, depth = $8, diameter = $9, radius = $10,
        slab_thickness = $11, slab_type = $12, area = $13, volume = $14, perimeter = $15, 
        thickness = $16, cross_sectional_area = $17, horizontal_projection = $18, 
        vertical_projection = $19, rise = $20, run = $21, stair_width = $22, 
        number_of_steps = $23, angle = $24, slope_percentage = $25, curvature_radius = $26,
        tmt_main_bar_dia = $27, tmt_distribution_bar_dia = $28, qty_main_bars = $29, 
        qty_distribution_bars = $30, rmc_grade = $31, stirrup_dia = $32, stirrup_spacing = $33, 
        concrete_cover = $34, design_load = $35, live_load = $36, dead_load = $37,
        reinforcement_type = $38, concrete_mix_ratio = $39, expansion_joint_width = $40,
        thermal_conductivity = $41, fire_rating = $42, sound_insulation_rating = $43,
        recorded_by = $44, status = $45
      WHERE structural_measurement_id = $46
      RETURNING *
    `;
    
    const updateValues = [
      project_id, element_id, floor || null, component || null,
      length || null, width || null, height || null, depth || null, diameter || null, radius || null,
      slab_thickness || null, slab_type || null, area || null, volume || null, perimeter || null, 
      thickness || null, cross_sectional_area || null, horizontal_projection || null, 
      vertical_projection || null, rise || null, run || null, stair_width || null, 
      number_of_steps || null, angle || null, slope_percentage || null, curvature_radius || null,
      tmt_main_bar_dia || null, tmt_distribution_bar_dia || null, qty_main_bars || null, 
      qty_distribution_bars || null, rmc_grade || null, stirrup_dia || null, stirrup_spacing || null,
      concrete_cover || null, design_load || null, live_load || null, dead_load || null,
      reinforcement_type || null, concrete_mix_ratio || null, expansion_joint_width || null,
      thermal_conductivity || null, fire_rating || null, sound_insulation_rating || null,
      recorded_by, status || 'Draft', id
    ];

    const result = await db.query(updateQuery, updateValues);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Structural measurement not found' 
      });
    }
    
    console.log('✅ Structural measurement updated successfully');
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Structural measurement updated successfully'
    });
    
  } catch (err) {
    console.error('❌ Error updating structural measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// VERIFY single measurement route
router.put('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;

  console.log('✅ Verifying structural measurement ID:', id);

  if (!verified_by) {
    return res.status(400).json({ 
      success: false,
      error: "Verified By is required" 
    });
  }

  try {
    const result = await db.query(`
      UPDATE architect_measurements_structural 
      SET status = 'Verified', 
          verified_by = $1, 
          verified_at = CURRENT_TIMESTAMP
      WHERE structural_measurement_id = $2 AND status = 'Draft'
      RETURNING *
    `, [verified_by, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Draft measurement not found or already verified' 
      });
    }
    
    console.log('✅ Structural measurement verified successfully');
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Structural measurement verified successfully'
    });
    
  } catch (err) {
    console.error('❌ Error verifying structural measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// VERIFY ALL measurements for a project route
router.put('/project/:projectId/verify-all', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { verified_by } = req.body;

  console.log('✅ Verifying all draft structural measurements for project:', projectId);

  if (!verified_by) {
    return res.status(400).json({ 
      success: false,
      error: "Verified By is required" 
    });
  }

  try {
    const result = await db.query(`
      UPDATE architect_measurements_structural 
      SET status = 'Verified', 
          verified_by = $1, 
          verified_at = CURRENT_TIMESTAMP
      WHERE project_id = $2 AND status = 'Draft'
      RETURNING structural_measurement_id
    `, [verified_by, projectId]);
    
    console.log(`✅ Verified ${result.rowCount} structural measurements`);
    
    res.json({
      success: true,
      data: {
        verified_count: result.rowCount,
        verified_ids: result.rows.map(row => row.structural_measurement_id)
      },
      message: `${result.rowCount} structural measurements verified successfully`
    });
    
  } catch (err) {
    console.error('❌ Error verifying structural measurements:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// DELETE route
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  console.log('🗑️ Deleting structural measurement ID:', id);

  try {
    const result = await db.query(
      'DELETE FROM architect_measurements_structural WHERE structural_measurement_id = $1 RETURNING structural_measurement_id',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Structural measurement not found' 
      });
    }
    
    console.log('✅ Structural measurement deleted successfully');
    
    res.json({ 
      success: true,
      message: 'Structural measurement deleted successfully' 
    });
    
  } catch (err) {
    console.error('❌ Error deleting structural measurement:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
