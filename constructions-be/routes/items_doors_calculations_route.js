const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Doors Calculations
 *   description: API for managing door calculations for projects
 */

/**
 * @swagger
 * /items_doors_calculations:
 *   get:
 *     tags: [Items Doors Calculations]
 *     description: Retrieve all door calculations with details
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
 *         name: door_material
 *         schema:
 *           type: string
 *         description: Filter by door material
 *       - in: query
 *         name: door_style
 *         schema:
 *           type: string
 *         description: Filter by door style
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of door calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, door_material, door_style, status } = req.query;
  
  try {
    let query = `
      SELECT 
        idc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_doors_calculations idc
      LEFT JOIN projects p ON idc.project_id = p.project_id
      LEFT JOIN elements e ON idc.element_id = e.element_id
      LEFT JOIN employees emp ON idc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON idc.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND idc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND idc.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND idc.room = $${paramCount}`;
      params.push(room);
    }
    
    if (door_material) {
      paramCount++;
      query += ` AND idc.door_material = $${paramCount}`;
      params.push(door_material);
    }
    
    if (door_style) {
      paramCount++;
      query += ` AND idc.door_style = $${paramCount}`;
      params.push(door_style);
    }
    
    if (status) {
      paramCount++;
      query += ` AND idc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY idc.project_id, idc.floor, idc.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_doors_calculations/{id}:
 *   get:
 *     tags: [Items Doors Calculations]
 *     description: Retrieve a specific door calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Door calculation details
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
        idc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_doors_calculations idc
      LEFT JOIN projects p ON idc.project_id = p.project_id
      LEFT JOIN elements e ON idc.element_id = e.element_id
      LEFT JOIN employees emp ON idc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON idc.verified_by = emp2.employee_id
      WHERE idc.door_calculation_id = $1
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
 * /items_doors_calculations:
 *   post:
 *     summary: Create a new door calculation
 *     tags: [Items Doors Calculations]
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
 *               - door_material
 *               - door_style
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
 *               door_material:
 *                 type: string
 *               door_style:
 *                 type: string
 *               door_finish:
 *                 type: string
 *               door_width:
 *                 type: number
 *               door_height:
 *                 type: number
 *               door_thickness:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               custom_design:
 *                 type: boolean
 *               custom_design_description:
 *                 type: string
 *               polish_type:
 *                 type: string
 *               polish_color:
 *                 type: string
 *               polish_coats:
 *                 type: integer
 *               has_frame:
 *                 type: boolean
 *               frame_material:
 *                 type: string
 *               frame_finish:
 *                 type: string
 *               lock_type:
 *                 type: string
 *               handle_type:
 *                 type: string
 *               hinge_type:
 *                 type: string
 *               hinge_quantity:
 *                 type: integer
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
    door_material,
    door_style,
    door_finish,
    door_width,
    door_height,
    door_thickness,
    quantity,
    custom_design,
    custom_design_description,
    custom_image_path,
    polish_type,
    polish_color,
    polish_coats,
    special_treatment,
    has_frame,
    frame_material,
    frame_finish,
    frame_width,
    frame_height,
    frame_thickness,
    frame_depth,
    frame_profile,
    lock_type,
    handle_type,
    hinge_type,
    hinge_quantity,
    hardware_finish,
    has_peephole,
    has_door_closer,
    has_weather_strip,
    has_threshold,
    additional_features,
    fire_rating,
    sound_insulation_rating,
    thermal_insulation,
    unit_price,
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
    door_material, door_style
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
      `INSERT INTO items_doors_calculations (
        project_id, element_id, measurement_id, floor, room,
        location_description, wall_direction, door_material, door_style,
        door_finish, door_width, door_height, door_thickness, quantity, custom_design,
        custom_design_description, custom_image_path, polish_type,
        polish_color, polish_coats, special_treatment, has_frame,
        frame_material, frame_finish, frame_width, frame_height,
        frame_thickness, frame_depth, frame_profile, lock_type,
        handle_type, hinge_type, hinge_quantity, hardware_finish,
        has_peephole, has_door_closer, has_weather_strip, has_threshold,
        additional_features, fire_rating, sound_insulation_rating,
        thermal_insulation, unit_price, frame_price, hardware_price,
        installation_price, wastage_percentage, calculated_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
                $42, $43, $44, $45, $46, $47, $48, $49)
      RETURNING *`,
      [
        project_id, element_id, measurement_id, floor, room,
        location_description, wall_direction, door_material, door_style,
        door_finish, door_width, door_height, door_thickness, quantity || 1, custom_design || false,
        custom_design_description, custom_image_path, polish_type,
        polish_color, polish_coats, special_treatment, has_frame !== false,
        frame_material, frame_finish, frame_width, frame_height,
        frame_thickness, frame_depth, frame_profile, lock_type,
        handle_type, hinge_type, hinge_quantity || 3, hardware_finish,
        has_peephole || false, has_door_closer || false, 
        has_weather_strip || false, has_threshold || false,
        additional_features, fire_rating, sound_insulation_rating,
        thermal_insulation || false, unit_price || 0, frame_price || 0,
        hardware_price || 0, installation_price || 0, 
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
 * /items_doors_calculations/{id}:
 *   put:
 *     summary: Update a door calculation
 *     tags: [Items Doors Calculations]
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
 *               door_material:
 *                 type: string
 *               door_style:
 *                 type: string
 *               door_finish:
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
          key !== 'door_calculation_id') {
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
      UPDATE items_doors_calculations 
      SET ${updateFields.join(', ')}
      WHERE door_calculation_id = $${valueCount}
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
 * /items_doors_calculations/{id}:
 *   delete:
 *     summary: Delete a door calculation
 *     tags: [Items Doors Calculations]
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
      'DELETE FROM items_doors_calculations WHERE door_calculation_id = $1 RETURNING door_calculation_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json({ message: "Calculation deleted successfully", deleted_id: result.rows[0].door_calculation_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_doors_calculations/{id}/verify:
 *   post:
 *     summary: Verify a door calculation
 *     tags: [Items Doors Calculations]
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
      `UPDATE items_doors_calculations 
       SET status = 'Verified', 
           verified_by = $1, 
           verification_date = CURRENT_TIMESTAMP
       WHERE door_calculation_id = $2
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
 * /items_doors_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get door calculation summary for a project
 *     tags: [Items Doors Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Door calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        idc.door_material,
        idc.door_style,
        idc.door_finish,
        COUNT(*) as door_count,
        SUM(idc.quantity) as total_quantity,
        AVG(idc.unit_price) as avg_unit_price,
        SUM(idc.total_base_cost) as total_base_cost,
        SUM(idc.total_cost_with_wastage) as total_cost_with_wastage,
        SUM(idc.total_cost) as total_project_cost,
        COUNT(CASE WHEN idc.custom_design = true THEN 1 END) as custom_design_count,
        COUNT(CASE WHEN idc.has_frame = true THEN 1 END) as doors_with_frames,
        COUNT(CASE WHEN idc.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN idc.status = 'Draft' THEN 1 END) as draft_count
      FROM items_doors_calculations idc
      WHERE idc.project_id = $1
      GROUP BY idc.door_material, idc.door_style, idc.door_finish
      ORDER BY idc.door_material, idc.door_style
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_doors_calculations/project/{projectId}/floor/{floor}:
 *   get:
 *     summary: Get door calculations for a specific floor
 *     tags: [Items Doors Calculations]
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
 *         description: Door calculations for the floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        idc.*,
        e.element_name
      FROM items_doors_calculations idc
      LEFT JOIN elements e ON idc.element_id = e.element_id
      WHERE idc.project_id = $1 AND idc.floor = $2
      ORDER BY idc.room, idc.location_description
    `, [projectId, floor]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_doors_calculations/project/{projectId}/hardware-summary:
 *   get:
 *     summary: Get hardware summary for all doors in a project
 *     tags: [Items Doors Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Door hardware summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/hardware-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        idc.lock_type,
        idc.handle_type,
        idc.hinge_type,
        idc.hardware_finish,
        COUNT(*) as door_count,
        SUM(idc.quantity) as total_quantity,
        SUM(idc.hinge_quantity * idc.quantity) as total_hinges,
        COUNT(CASE WHEN idc.has_peephole = true THEN 1 END) as peephole_count,
        COUNT(CASE WHEN idc.has_door_closer = true THEN 1 END) as door_closer_count,
        COUNT(CASE WHEN idc.has_weather_strip = true THEN 1 END) as weather_strip_count,
        COUNT(CASE WHEN idc.has_threshold = true THEN 1 END) as threshold_count,
        SUM(idc.hardware_price * idc.quantity) as total_hardware_cost
      FROM items_doors_calculations idc
      WHERE idc.project_id = $1
      GROUP BY idc.lock_type, idc.handle_type, idc.hinge_type, idc.hardware_finish
      HAVING idc.lock_type IS NOT NULL OR idc.handle_type IS NOT NULL
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
 * /items_doors_calculations/project/{projectId}/special-features:
 *   get:
 *     summary: Get doors with special features
 *     tags: [Items Doors Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Doors with special features
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/special-features', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        idc.door_calculation_id,
        idc.floor,
        idc.room,
        idc.location_description,
        idc.door_material,
        idc.door_style,
        idc.custom_design,
        idc.custom_design_description,
        idc.polish_type,
        idc.polish_color,
        idc.polish_coats,
        idc.special_treatment,
        idc.fire_rating,
        idc.sound_insulation_rating,
        idc.thermal_insulation,
        idc.additional_features
      FROM items_doors_calculations idc
      WHERE idc.project_id = $1 
        AND (idc.custom_design = true 
          OR idc.special_treatment IS NOT NULL 
          OR idc.fire_rating IS NOT NULL 
          OR idc.sound_insulation_rating IS NOT NULL 
          OR idc.thermal_insulation = true)
      ORDER BY idc.floor, idc.room
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_doors_calculations/door-dimensions:
 *   get:
 *     summary: Get all available door dimensions
 *     tags: [Items Doors Calculations]
 *     responses:
 *       200:
 *         description: List of door dimensions
 *       500:
 *         description: Internal server error
 */
router.get('/door-dimensions', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT * FROM door_dimensions 
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