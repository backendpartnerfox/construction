const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Plumbing Calculations
 *   description: API for managing plumbing calculations for projects
 */

/**
 * @swagger
 * /items_plumbing_calculations:
 *   get:
 *     tags: [Items Plumbing Calculations]
 *     description: Retrieve all plumbing calculations with details
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
 *         name: plumbing_type
 *         schema:
 *           type: string
 *         description: Filter by plumbing type
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *         description: Filter by component
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of plumbing calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, plumbing_type, component, status } = req.query;
  
  try {
    let query = `
      SELECT 
        ipc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_plumbing_calculations ipc
      LEFT JOIN projects p ON ipc.project_id = p.project_id
      LEFT JOIN elements e ON ipc.element_id = e.element_id
      LEFT JOIN employees emp ON ipc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON ipc.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND ipc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND ipc.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND ipc.room = $${paramCount}`;
      params.push(room);
    }
    
    if (plumbing_type) {
      paramCount++;
      query += ` AND ipc.plumbing_type = $${paramCount}`;
      params.push(plumbing_type);
    }
    
    if (component) {
      paramCount++;
      query += ` AND ipc.component = $${paramCount}`;
      params.push(component);
    }
    
    if (status) {
      paramCount++;
      query += ` AND ipc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY ipc.project_id, ipc.floor, ipc.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_plumbing_calculations/{id}:
 *   get:
 *     tags: [Items Plumbing Calculations]
 *     description: Retrieve a specific plumbing calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Plumbing calculation details
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
        ipc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_plumbing_calculations ipc
      LEFT JOIN projects p ON ipc.project_id = p.project_id
      LEFT JOIN elements e ON ipc.element_id = e.element_id
      LEFT JOIN employees emp ON ipc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON ipc.verified_by = emp2.employee_id
      WHERE ipc.calculation_id = $1
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
 * /items_plumbing_calculations:
 *   post:
 *     summary: Create a new plumbing calculation
 *     tags: [Items Plumbing Calculations]
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
 *               - plumbing_type
 *               - pipe_material
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               plumbing_type:
 *                 type: string
 *               pipe_material:
 *                 type: string
 *               pipe_diameter:
 *                 type: string
 *               fitting_type:
 *                 type: string
 *               horizontal_length:
 *                 type: number
 *               vertical_length:
 *                 type: number
 *               elbow_count:
 *                 type: integer
 *               tee_count:
 *                 type: integer
 *               reducer_count:
 *                 type: integer
 *               union_count:
 *                 type: integer
 *               valve_count:
 *                 type: integer
 *               other_fittings_count:
 *                 type: integer
 *               water_closet_count:
 *                 type: integer
 *               wash_basin_count:
 *                 type: integer
 *               sink_count:
 *                 type: integer
 *               shower_count:
 *                 type: integer
 *               tap_count:
 *                 type: integer
 *               floor_drain_count:
 *                 type: integer
 *               wastage_percentage:
 *                 type: number
 *               component:
 *                 type: string
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
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
    plumbing_type,
    pipe_material,
    pipe_diameter,
    fitting_type,
    horizontal_length,
    vertical_length,
    elbow_count,
    tee_count,
    reducer_count,
    union_count,
    valve_count,
    other_fittings_count,
    tank_length,
    tank_width,
    tank_height,
    tank_capacity_liters,
    water_closet_count,
    wash_basin_count,
    sink_count,
    shower_count,
    tap_count,
    floor_drain_count,
    wastage_percentage,
    jointing_material,
    insulation_required,
    insulation_type,
    pressure_rating,
    design_pressure,
    flow_rate,
    component,
    floor,
    room,
    unit_rate_per_meter,
    fitting_cost_per_unit,
    installation_cost_per_meter,
    calculated_by,
    notes
  } = req.body;

  // Validate required fields
  const requiredFields = {
    project_id, element_id, measurement_id, plumbing_type, pipe_material
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
      `INSERT INTO items_plumbing_calculations (
        project_id, element_id, measurement_id, plumbing_type, pipe_material,
        pipe_diameter, fitting_type, horizontal_length, vertical_length,
        elbow_count, tee_count, reducer_count, union_count, valve_count,
        other_fittings_count, tank_length, tank_width, tank_height,
        tank_capacity_liters, water_closet_count, wash_basin_count,
        sink_count, shower_count, tap_count, floor_drain_count,
        wastage_percentage, jointing_material, insulation_required,
        insulation_type, pressure_rating, design_pressure, flow_rate,
        component, floor, room, unit_rate_per_meter, fitting_cost_per_unit,
        installation_cost_per_meter, calculated_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40)
      RETURNING *`,
      [
        project_id, element_id, measurement_id, plumbing_type, pipe_material,
        pipe_diameter, fitting_type, horizontal_length || 0, vertical_length || 0,
        elbow_count || 0, tee_count || 0, reducer_count || 0, union_count || 0,
        valve_count || 0, other_fittings_count || 0, tank_length, tank_width,
        tank_height, tank_capacity_liters, water_closet_count || 0,
        wash_basin_count || 0, sink_count || 0, shower_count || 0, tap_count || 0,
        floor_drain_count || 0, wastage_percentage || 10.00, jointing_material,
        insulation_required || false, insulation_type, pressure_rating,
        design_pressure, flow_rate, component, floor, room, unit_rate_per_meter,
        fitting_cost_per_unit, installation_cost_per_meter, calculated_by, notes
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
 * /items_plumbing_calculations/{id}:
 *   put:
 *     summary: Update a plumbing calculation
 *     tags: [Items Plumbing Calculations]
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
 *               plumbing_type:
 *                 type: string
 *               pipe_material:
 *                 type: string
 *               pipe_diameter:
 *                 type: string
 *               horizontal_length:
 *                 type: number
 *               vertical_length:
 *                 type: number
 *               wastage_percentage:
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
          key !== 'measurement_id') {
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
      UPDATE items_plumbing_calculations 
      SET ${updateFields.join(', ')}
      WHERE calculation_id = $${valueCount}
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
 * /items_plumbing_calculations/{id}:
 *   delete:
 *     summary: Delete a plumbing calculation
 *     tags: [Items Plumbing Calculations]
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
      'DELETE FROM items_plumbing_calculations WHERE calculation_id = $1 RETURNING calculation_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Calculation not found" });
    }

    res.json({ message: "Calculation deleted successfully", deleted_id: result.rows[0].calculation_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_plumbing_calculations/{id}/verify:
 *   post:
 *     summary: Verify a plumbing calculation
 *     tags: [Items Plumbing Calculations]
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
      `UPDATE items_plumbing_calculations 
       SET status = 'Verified', 
           verified_by = $1, 
           verification_date = CURRENT_TIMESTAMP
       WHERE calculation_id = $2
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
 * /items_plumbing_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get plumbing calculation summary for a project
 *     tags: [Items Plumbing Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Plumbing calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ipc.plumbing_type,
        ipc.pipe_material,
        ipc.pipe_diameter,
        COUNT(*) as calculation_count,
        SUM(ipc.total_pipe_length) as total_pipe_length,
        SUM(ipc.total_length_with_wastage) as total_length_with_wastage,
        SUM(ipc.elbow_count) as total_elbows,
        SUM(ipc.tee_count) as total_tees,
        SUM(ipc.valve_count) as total_valves,
        SUM(ipc.water_closet_count) as total_water_closets,
        SUM(ipc.wash_basin_count) as total_wash_basins,
        SUM(ipc.sink_count) as total_sinks,
        SUM(ipc.shower_count) as total_showers,
        SUM(ipc.tap_count) as total_taps,
        AVG(ipc.wastage_percentage) as avg_wastage_percentage,
        COUNT(CASE WHEN ipc.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN ipc.status = 'Draft' THEN 1 END) as draft_count
      FROM items_plumbing_calculations ipc
      WHERE ipc.project_id = $1
      GROUP BY ipc.plumbing_type, ipc.pipe_material, ipc.pipe_diameter
      ORDER BY ipc.plumbing_type, ipc.pipe_material, ipc.pipe_diameter
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_plumbing_calculations/project/{projectId}/floor/{floor}:
 *   get:
 *     summary: Get plumbing calculations for a specific floor
 *     tags: [Items Plumbing Calculations]
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
 *         description: Plumbing calculations for the floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ipc.*,
        e.element_name
      FROM items_plumbing_calculations ipc
      LEFT JOIN elements e ON ipc.element_id = e.element_id
      WHERE ipc.project_id = $1 AND ipc.floor = $2
      ORDER BY ipc.room, ipc.plumbing_type
    `, [projectId, floor]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_plumbing_calculations/project/{projectId}/fixtures-summary:
 *   get:
 *     summary: Get fixtures summary for a project
 *     tags: [Items Plumbing Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Plumbing fixtures summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/fixtures-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ipc.floor,
        ipc.room,
        SUM(ipc.water_closet_count) as water_closets,
        SUM(ipc.wash_basin_count) as wash_basins,
        SUM(ipc.sink_count) as sinks,
        SUM(ipc.shower_count) as showers,
        SUM(ipc.tap_count) as taps,
        SUM(ipc.floor_drain_count) as floor_drains
      FROM items_plumbing_calculations ipc
      WHERE ipc.project_id = $1
      GROUP BY ipc.floor, ipc.room
      HAVING (SUM(ipc.water_closet_count) + SUM(ipc.wash_basin_count) + 
              SUM(ipc.sink_count) + SUM(ipc.shower_count) + 
              SUM(ipc.tap_count) + SUM(ipc.floor_drain_count)) > 0
      ORDER BY ipc.floor, ipc.room
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;