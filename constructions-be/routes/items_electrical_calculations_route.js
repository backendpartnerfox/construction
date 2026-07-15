const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Electrical Calculations
 *   description: API for managing electrical calculations for projects
 */

/**
 * @swagger
 * /items_electrical_calculations:
 *   get:
 *     tags: [Items Electrical Calculations]
 *     description: Retrieve all electrical calculations with details
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
 *         name: electrical_type
 *         schema:
 *           type: string
 *         description: Filter by electrical type
 *       - in: query
 *         name: sub_type
 *         schema:
 *           type: string
 *         description: Filter by sub type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of electrical calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, electrical_type, sub_type, status } = req.query;
  
  try {
    let query = `
      SELECT 
        iec.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_electrical_calculations iec
      LEFT JOIN projects p ON iec.project_id = p.project_id
      LEFT JOIN elements e ON iec.element_id = e.element_id
      LEFT JOIN employees emp ON iec.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON iec.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND iec.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND iec.floor = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND iec.room = $${paramCount}`;
      params.push(room);
    }
    
    if (electrical_type) {
      paramCount++;
      query += ` AND iec.electrical_type = $${paramCount}`;
      params.push(electrical_type);
    }
    
    if (sub_type) {
      paramCount++;
      query += ` AND iec.sub_type = $${paramCount}`;
      params.push(sub_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND iec.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY iec.project_id, iec.floor, iec.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_electrical_calculations/{id}:
 *   get:
 *     tags: [Items Electrical Calculations]
 *     description: Retrieve a specific electrical calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Electrical calculation details
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
        iec.*,
        p.project_name,
        p.project_code,
        e.element_name,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_electrical_calculations iec
      LEFT JOIN projects p ON iec.project_id = p.project_id
      LEFT JOIN elements e ON iec.element_id = e.element_id
      LEFT JOIN employees emp ON iec.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON iec.verified_by = emp2.employee_id
      WHERE iec.calculation_id = $1
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
 * /items_electrical_calculations:
 *   post:
 *     summary: Create a new electrical calculation
 *     tags: [Items Electrical Calculations]
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
 *               - electrical_type
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
 *               electrical_type:
 *                 type: string
 *               sub_type:
 *                 type: string
 *               specification:
 *                 type: string
 *               material_type:
 *                 type: string
 *               wire_gauge:
 *                 type: string
 *               conduit_size:
 *                 type: string
 *               circuit_type:
 *                 type: string
 *               voltage:
 *                 type: string
 *               amperage:
 *                 type: number
 *               phase:
 *                 type: string
 *               power_rating:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               length_m:
 *                 type: number
 *               unit_of_measure:
 *                 type: string
 *               points_count:
 *                 type: integer
 *               switch_type:
 *                 type: string
 *               socket_type:
 *                 type: string
 *               mcb_rating:
 *                 type: string
 *               db_type:
 *                 type: string
 *               earthing_type:
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
    floor,
    room,
    electrical_type,
    sub_type,
    specification,
    material_type,
    wire_gauge,
    conduit_size,
    circuit_type,
    voltage,
    amperage,
    phase,
    power_rating,
    quantity,
    length_m,
    unit_of_measure,
    points_count,
    switch_type,
    socket_type,
    mcb_rating,
    db_type,
    earthing_type,
    unit_price,
    labor_cost,
    material_cost,
    wastage_percentage,
    safety_factor,
    calculated_by,
    notes
  } = req.body;

  // Validate required fields
  const requiredFields = {
    project_id, element_id, measurement_id, floor, room, electrical_type
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
      `INSERT INTO items_electrical_calculations (
        project_id, element_id, measurement_id, floor, room,
        electrical_type, sub_type, specification, material_type,
        wire_gauge, conduit_size, circuit_type, voltage, amperage,
        phase, power_rating, quantity, length_m, unit_of_measure,
        points_count, switch_type, socket_type, mcb_rating,
        db_type, earthing_type, unit_price, labor_cost,
        material_cost, wastage_percentage, safety_factor,
        calculated_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                $27, $28, $29, $30, $31, $32)
      RETURNING *`,
      [
        project_id, element_id, measurement_id, floor, room,
        electrical_type, sub_type, specification, material_type,
        wire_gauge, conduit_size, circuit_type, voltage, amperage,
        phase, power_rating, quantity || 1, length_m, unit_of_measure || 'pcs',
        points_count || 1, switch_type, socket_type, mcb_rating,
        db_type, earthing_type, unit_price || 0, labor_cost || 0,
        material_cost || 0, wastage_percentage || 5.00, safety_factor || 1.10,
        calculated_by, notes
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
 * /items_electrical_calculations/{id}:
 *   put:
 *     summary: Update an electrical calculation
 *     tags: [Items Electrical Calculations]
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
 *               electrical_type:
 *                 type: string
 *               sub_type:
 *                 type: string
 *               specification:
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
          key !== 'calculation_id') {
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
      UPDATE items_electrical_calculations 
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
 * /items_electrical_calculations/{id}:
 *   delete:
 *     summary: Delete an electrical calculation
 *     tags: [Items Electrical Calculations]
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
      'DELETE FROM items_electrical_calculations WHERE calculation_id = $1 RETURNING calculation_id',
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
 * /items_electrical_calculations/{id}/verify:
 *   post:
 *     summary: Verify an electrical calculation
 *     tags: [Items Electrical Calculations]
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
      `UPDATE items_electrical_calculations 
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
 * /items_electrical_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get electrical calculation summary for a project
 *     tags: [Items Electrical Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Electrical calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iec.electrical_type,
        iec.sub_type,
        COUNT(*) as item_count,
        SUM(iec.quantity) as total_quantity,
        AVG(iec.unit_price) as avg_unit_price,
        SUM(iec.total_material_cost) as total_material_cost,
        SUM(iec.total_labor_cost) as total_labor_cost,
        SUM(iec.total_cost) as total_project_cost,
        COUNT(CASE WHEN iec.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN iec.status = 'Draft' THEN 1 END) as draft_count,
        SUM(iec.length_m) as total_wire_length,
        SUM(iec.points_count) as total_points
      FROM items_electrical_calculations iec
      WHERE iec.project_id = $1
      GROUP BY iec.electrical_type, iec.sub_type
      ORDER BY iec.electrical_type, iec.sub_type
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_electrical_calculations/project/{projectId}/floor/{floor}:
 *   get:
 *     summary: Get electrical calculations for a specific floor
 *     tags: [Items Electrical Calculations]
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
 *         description: Electrical calculations for the floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iec.*,
        e.element_name
      FROM items_electrical_calculations iec
      LEFT JOIN elements e ON iec.element_id = e.element_id
      WHERE iec.project_id = $1 AND iec.floor = $2
      ORDER BY iec.room, iec.electrical_type
    `, [projectId, floor]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_electrical_calculations/project/{projectId}/circuit-summary:
 *   get:
 *     summary: Get circuit summary for all electrical calculations in a project
 *     tags: [Items Electrical Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Electrical circuit summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/circuit-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iec.circuit_type,
        iec.voltage,
        iec.phase,
        COUNT(*) as circuit_count,
        SUM(iec.amperage) as total_amperage,
        SUM(iec.power_rating) as total_power_rating,
        AVG(iec.amperage) as avg_amperage,
        COUNT(DISTINCT iec.mcb_rating) as mcb_variations,
        SUM(iec.total_cost) as total_circuit_cost
      FROM items_electrical_calculations iec
      WHERE iec.project_id = $1 AND iec.circuit_type IS NOT NULL
      GROUP BY iec.circuit_type, iec.voltage, iec.phase
      ORDER BY iec.circuit_type, iec.voltage
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_electrical_calculations/project/{projectId}/wire-summary:
 *   get:
 *     summary: Get wire usage summary for a project
 *     tags: [Items Electrical Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Wire usage summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/wire-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iec.wire_gauge,
        iec.material_type,
        COUNT(*) as usage_count,
        SUM(iec.length_m) as total_length_m,
        SUM(iec.length_m * 3.28084) as total_length_ft,
        AVG(iec.unit_price) as avg_price_per_unit,
        SUM(iec.total_material_cost) as total_wire_cost
      FROM items_electrical_calculations iec
      WHERE iec.project_id = $1 AND iec.wire_gauge IS NOT NULL
      GROUP BY iec.wire_gauge, iec.material_type
      ORDER BY iec.wire_gauge
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_electrical_calculations/project/{projectId}/db-summary:
 *   get:
 *     summary: Get distribution board summary for a project
 *     tags: [Items Electrical Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Distribution board summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/db-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        iec.db_type,
        iec.floor,
        COUNT(*) as db_count,
        COUNT(DISTINCT iec.mcb_rating) as mcb_types,
        SUM(iec.quantity) as total_quantity,
        SUM(iec.total_cost) as total_db_cost
      FROM items_electrical_calculations iec
      WHERE iec.project_id = $1 AND iec.db_type IS NOT NULL
      GROUP BY iec.db_type, iec.floor
      ORDER BY iec.floor, iec.db_type
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_electrical_calculations/electrical-types:
 *   get:
 *     summary: Get all electrical types used in the system
 *     tags: [Items Electrical Calculations]
 *     responses:
 *       200:
 *         description: List of electrical types
 *       500:
 *         description: Internal server error
 */
router.get('/electrical-types', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT DISTINCT 
        electrical_type,
        COUNT(*) as usage_count
      FROM items_electrical_calculations
      WHERE electrical_type IS NOT NULL
      GROUP BY electrical_type
      ORDER BY electrical_type
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;