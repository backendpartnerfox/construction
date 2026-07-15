const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Windows Calculations
 *   description: API for managing window calculations for projects
 */

/**
 * @swagger
 * /items_windows_calculations:
 *   get:
 *     tags: [Items Windows Calculations]
 *     description: Retrieve all window calculations with details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter by floor
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *         description: Filter by room
 *       - in: query
 *         name: window_material
 *         schema:
 *           type: string
 *         description: Filter by window material
 *       - in: query
 *         name: window_type
 *         schema:
 *           type: string
 *         description: Filter by window type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of window calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, window_material, window_type, status } = req.query;
  
  try {
    let query = `
      SELECT 
        iwc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_windows_calculations iwc
      LEFT JOIN projects p ON iwc.project_id = p.project_id
      LEFT JOIN elements e ON iwc.element_id = e.element_id
      LEFT JOIN employees emp ON iwc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON iwc.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND iwc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND iwc.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND iwc.room = $${paramCount}`;
      params.push(room);
    }
    
    if (window_material) {
      paramCount++;
      query += ` AND iwc.window_material = $${paramCount}`;
      params.push(window_material);
    }
    
    if (window_type) {
      paramCount++;
      query += ` AND iwc.window_type = $${paramCount}`;
      params.push(window_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND iwc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY iwc.project_id, iwc.floor, iwc.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/{id}:
 *   get:
 *     tags: [Items Windows Calculations]
 *     description: Retrieve a specific window calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Window calculation details
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iwc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_windows_calculations iwc
      LEFT JOIN projects p ON iwc.project_id = p.project_id
      LEFT JOIN elements e ON iwc.element_id = e.element_id
      LEFT JOIN employees emp ON iwc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON iwc.verified_by = emp2.employee_id
      WHERE iwc.window_calculation_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations:
 *   post:
 *     summary: Create a new window calculation
 *     tags: [Items Windows Calculations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - element_id
 *               - measurement_id
 *               - floor
 *               - room
 *               - window_material
 *               - window_type
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               location_description:
 *                 type: string
 *               wall_direction:
 *                 type: string
 *               window_material:
 *                 type: string
 *               window_type:
 *                 type: string
 *               opening_style:
 *                 type: string
 *               window_width:
 *                 type: number
 *               window_height:
 *                 type: number
 *               sill_height:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               glass_type:
 *                 type: string
 *               glass_thickness:
 *                 type: number
 *               glazing_type:
 *                 type: string
 *               frame_material:
 *                 type: string
 *               frame_color:
 *                 type: string
 *               hardware_type:
 *                 type: string
 *               mesh_required:
 *                 type: boolean
 *               grill_required:
 *                 type: boolean
 *               calculated_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Calculation created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    element_id,
    measurement_id,
    floor,
    room,
    location_description,
    wall_direction,
    window_material,
    window_type,
    opening_style,
    window_width,
    window_height,
    window_thickness,
    sill_height,
    quantity,
    glass_type,
    glass_thickness,
    glass_layers,
    glazing_type,
    tint_type,
    tint_percentage,
    frame_material,
    frame_profile,
    frame_color,
    frame_finish,
    hardware_type,
    hardware_finish,
    handle_type,
    lock_type,
    hinge_type,
    mesh_required,
    mesh_type,
    mesh_material,
    grill_required,
    grill_type,
    grill_material,
    grill_design,
    weather_stripping,
    acoustic_rating,
    thermal_insulation,
    energy_rating,
    security_features,
    unit_price,
    glass_price,
    frame_price,
    hardware_price,
    installation_price,
    wastage_percentage,
    calculated_by,
    notes
  } = req.body;

  // Validate required fields
  const requiredFields = {
    project_id, element_id, measurement_id, floor, room, 
    window_material, window_type
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO items_windows_calculations (
        project_id, element_id, measurement_id, floor, room,
        location_description, wall_direction, window_material, window_type,
        opening_style, window_width, window_height, window_thickness,
        sill_height, quantity, glass_type, glass_thickness, glass_layers,
        glazing_type, tint_type, tint_percentage, frame_material,
        frame_profile, frame_color, frame_finish, hardware_type,
        hardware_finish, handle_type, lock_type, hinge_type,
        mesh_required, mesh_type, mesh_material, grill_required,
        grill_type, grill_material, grill_design, weather_stripping,
        acoustic_rating, thermal_insulation, energy_rating,
        security_features, unit_price, glass_price, frame_price,
        hardware_price, installation_price, wastage_percentage,
        calculated_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
                $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50)
      RETURNING *`,
      [
        project_id, element_id, measurement_id, floor, room,
        location_description, wall_direction, window_material, window_type,
        opening_style, window_width, window_height, window_thickness,
        sill_height || 0.9, quantity || 1, glass_type, glass_thickness || 5,
        glass_layers || 1, glazing_type, tint_type, tint_percentage,
        frame_material, frame_profile, frame_color, frame_finish,
        hardware_type, hardware_finish, handle_type, lock_type,
        hinge_type, mesh_required || false, mesh_type, mesh_material,
        grill_required || false, grill_type, grill_material, grill_design,
        weather_stripping || false, acoustic_rating, thermal_insulation || false,
        energy_rating, security_features, unit_price || 0, glass_price || 0,
        frame_price || 0, hardware_price || 0, installation_price || 0,
        wastage_percentage || 5.00, calculated_by, notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/{id}:
 *   put:
 *     summary: Update a window calculation
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               window_material:
 *                 type: string
 *               window_type:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unit_price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Draft, Verified, Pending]
 *     responses:
 *       200:
 *         description: Calculation updated successfully
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && 
          key !== 'project_id' && 
          key !== 'element_id' &&
          key !== 'measurement_id' &&
          key !== 'window_calculation_id') {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE items_windows_calculations 
      SET ${updateFields.join(', ')}
      WHERE window_calculation_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/{id}:
 *   delete:
 *     summary: Delete a window calculation
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to delete
 *     responses:
 *       200:
 *         description: Calculation deleted successfully
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM items_windows_calculations WHERE window_calculation_id = $1 RETURNING window_calculation_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json({ message: "Calculation deleted successfully", deleted_id: result.rows[0].window_calculation_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/{id}/verify:
 *   post:
 *     summary: Verify a window calculation
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to verify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verified_by
 *             properties:
 *               verified_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Calculation verified successfully
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/verify', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;

  if (!verified_by) {
    return res.status(400).json({ error: "verified_by is required" });
  }

  try {
    const result = await db.query(
      `UPDATE items_windows_calculations 
       SET status = 'Verified', 
           verified_by = $1, 
           verification_date = CURRENT_TIMESTAMP
       WHERE window_calculation_id = $2
       RETURNING *`,
      [verified_by, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get window calculation summary for a project
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Window calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iwc.window_material,
        iwc.window_type,
        iwc.opening_style,
        COUNT(*) as window_count,
        SUM(iwc.quantity) as total_quantity,
        AVG(iwc.unit_price) as avg_unit_price,
        SUM(iwc.total_base_cost) as total_base_cost,
        SUM(iwc.total_cost_with_wastage) as total_cost_with_wastage,
        SUM(iwc.total_cost) as total_project_cost,
        COUNT(CASE WHEN iwc.mesh_required = true THEN 1 END) as windows_with_mesh,
        COUNT(CASE WHEN iwc.grill_required = true THEN 1 END) as windows_with_grill,
        COUNT(CASE WHEN iwc.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN iwc.status = 'Draft' THEN 1 END) as draft_count
      FROM items_windows_calculations iwc
      WHERE iwc.project_id = $1
      GROUP BY iwc.window_material, iwc.window_type, iwc.opening_style
      ORDER BY iwc.window_material, iwc.window_type
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/project/{projectId}/floor/{floor}:
 *   get:
 *     summary: Get window calculations for a specific floor
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: floor
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor name
 *     responses:
 *       200:
 *         description: Window calculations for the floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iwc.*,
        e.element_name
      FROM items_windows_calculations iwc
      LEFT JOIN elements e ON iwc.element_id = e.element_id
      WHERE iwc.project_id = $1 AND iwc.floor = $2
      ORDER BY iwc.room, iwc.location_description
    `, [projectId, floor]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/project/{projectId}/glass-summary:
 *   get:
 *     summary: Get glass specifications summary for all windows in a project
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Window glass specifications summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/glass-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iwc.glass_type,
        iwc.glass_thickness,
        iwc.glazing_type,
        iwc.tint_type,
        COUNT(*) as window_count,
        SUM(iwc.quantity) as total_quantity,
        SUM(iwc.window_width * iwc.window_height * iwc.quantity) as total_glass_area,
        AVG(iwc.glass_price) as avg_glass_price,
        SUM(iwc.glass_price * iwc.quantity) as total_glass_cost
      FROM items_windows_calculations iwc
      WHERE iwc.project_id = $1
      GROUP BY iwc.glass_type, iwc.glass_thickness, iwc.glazing_type, iwc.tint_type
      ORDER BY COUNT(*) DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/project/{projectId}/hardware-summary:
 *   get:
 *     summary: Get hardware summary for all windows in a project
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Window hardware summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/hardware-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iwc.hardware_type,
        iwc.handle_type,
        iwc.lock_type,
        iwc.hinge_type,
        iwc.hardware_finish,
        COUNT(*) as window_count,
        SUM(iwc.quantity) as total_quantity,
        AVG(iwc.hardware_price) as avg_hardware_price,
        SUM(iwc.hardware_price * iwc.quantity) as total_hardware_cost
      FROM items_windows_calculations iwc
      WHERE iwc.project_id = $1
      GROUP BY iwc.hardware_type, iwc.handle_type, iwc.lock_type, iwc.hinge_type, iwc.hardware_finish
      HAVING iwc.hardware_type IS NOT NULL
      ORDER BY COUNT(*) DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/project/{projectId}/energy-features:
 *   get:
 *     summary: Get windows with energy-efficient features
 *     tags: [Items Windows Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Windows with energy-efficient features
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/energy-features', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iwc.window_calculation_id,
        iwc.floor,
        iwc.room,
        iwc.location_description,
        iwc.window_material,
        iwc.window_type,
        iwc.glazing_type,
        iwc.tint_type,
        iwc.tint_percentage,
        iwc.thermal_insulation,
        iwc.acoustic_rating,
        iwc.energy_rating,
        iwc.weather_stripping
      FROM items_windows_calculations iwc
      WHERE iwc.project_id = $1 
        AND (iwc.thermal_insulation = true 
          OR iwc.energy_rating IS NOT NULL 
          OR iwc.acoustic_rating IS NOT NULL 
          OR iwc.weather_stripping = true
          OR iwc.glazing_type IN ('Double', 'Triple')
          OR iwc.tint_percentage > 0)
      ORDER BY iwc.floor, iwc.room
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_windows_calculations/window-dimensions:
 *   get:
 *     summary: Get all available window dimensions
 *     tags: [Items Windows Calculations]
 *     responses:
 *       200:
 *         description: List of window dimensions
 *       500:
 *         description: Internal server error
 */
router.get('/window-dimensions', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT * FROM window_dimensions 
      WHERE is_active = true 
      ORDER BY width, height
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;