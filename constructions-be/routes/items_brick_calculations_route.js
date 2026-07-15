const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Brick Calculations
 *   description: API for managing brick calculations for projects
 */

/**
 * @swagger
 * /items_brick_calculations:
 *   get:
 *     tags: [Items Brick Calculations]
 *     description: Retrieve all brick calculations with details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: element_id
 *         schema:
 *           type: integer
 *         description: Filter by element ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of brick calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, element_id, status } = req.query;
  
  try {
    let query = `
      SELECT 
        ibc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        e.element_category,
        awm.floor,
        awm.room,
        awm.wall_direction,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_brick_calculations ibc
      LEFT JOIN projects p ON ibc.project_id = p.project_id
      LEFT JOIN elements e ON ibc.element_id = e.element_id
      LEFT JOIN architect_walls_measurement awm ON ibc.measurement_id = awm.measurement_id
      LEFT JOIN employees emp ON ibc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON ibc.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND ibc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (element_id) {
      paramCount++;
      query += ` AND ibc.element_id = $${paramCount}`;
      params.push(element_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND ibc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY ibc.project_id, ibc.calculation_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_brick_calculations/{id}:
 *   get:
 *     tags: [Items Brick Calculations]
 *     description: Retrieve a specific brick calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Brick calculation details
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
        ibc.*,
        p.project_name,
        p.project_code,
        e.element_name,
        e.element_category,
        awm.floor,
        awm.room,
        awm.wall_direction,
        awm.wall_thickness,
        awm.actual_wall_width,
        awm.height as wall_height,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_brick_calculations ibc
      LEFT JOIN projects p ON ibc.project_id = p.project_id
      LEFT JOIN elements e ON ibc.element_id = e.element_id
      LEFT JOIN architect_walls_measurement awm ON ibc.measurement_id = awm.measurement_id
      LEFT JOIN employees emp ON ibc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON ibc.verified_by = emp2.employee_id
      WHERE ibc.calculation_id = $1
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
 * /items_brick_calculations:
 *   post:
 *     summary: Create a new brick calculation
 *     tags: [Items Brick Calculations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - component_id
 *               - measurement_id
 *             properties:
 *               project_id:
 *                 type: integer
 *               component_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               wall_area:
 *                 type: number
 *               wall_thickness:
 *                 type: number
 *               brick_size:
 *                 type: string
 *               bricks_per_sqft:
 *                 type: number
 *                 default: 4.5
 *               mortar_ratio:
 *                 type: string
 *                 default: "1:6"
 *               mortar_thickness:
 *                 type: number
 *                 default: 12
 *               total_bricks:
 *                 type: integer
 *               cement_bags_for_mortar:
 *                 type: number
 *               sand_cum_for_mortar:
 *                 type: number
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
    component_id,
    measurement_id,
    element_id,
    wall_area,
    wall_thickness,
    brick_size,
    bricks_per_sqft,
    mortar_ratio,
    mortar_thickness,
    total_bricks,
    cement_bags_for_mortar,
    sand_cum_for_mortar,
    calculated_by
  } = req.body;

  // Validate required fields
  if (!project_id || !component_id || !measurement_id) {
    return res.status(400).json({ 
      error: `Missing required fields: project_id, component_id, and measurement_id are required` 
    });
  }

  try {
    // Calculate total_bricks if not provided
    let calculatedTotalBricks = total_bricks;
    if (!total_bricks && wall_area && bricks_per_sqft) {
      calculatedTotalBricks = Math.ceil(wall_area * (bricks_per_sqft || 4.5));
    }

    const result = await db.query(
      `INSERT INTO items_brick_calculations (
        project_id, component_id, measurement_id, element_id,
        wall_area, wall_thickness, brick_size, bricks_per_sqft,
        mortar_ratio, mortar_thickness, total_bricks,
        cement_bags_for_mortar, sand_cum_for_mortar, calculated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        project_id, component_id, measurement_id, element_id,
        wall_area, wall_thickness, brick_size, bricks_per_sqft || 4.5,
        mortar_ratio || '1:6', mortar_thickness || 12, calculatedTotalBricks,
        cement_bags_for_mortar, sand_cum_for_mortar, calculated_by
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
 * /items_brick_calculations/{id}:
 *   put:
 *     summary: Update a brick calculation
 *     tags: [Items Brick Calculations]
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
 *               wall_area:
 *                 type: number
 *               wall_thickness:
 *                 type: number
 *               brick_size:
 *                 type: string
 *               bricks_per_sqft:
 *                 type: number
 *               mortar_ratio:
 *                 type: string
 *               mortar_thickness:
 *                 type: number
 *               total_bricks:
 *                 type: integer
 *               cement_bags_for_mortar:
 *                 type: number
 *               sand_cum_for_mortar:
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
    // List of allowed fields to update
    const allowedFields = [
      'wall_area', 'wall_thickness', 'brick_size', 'bricks_per_sqft',
      'mortar_ratio', 'mortar_thickness', 'total_bricks',
      'cement_bags_for_mortar', 'sand_cum_for_mortar', 'status'
    ];

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && allowedFields.includes(key)) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE items_brick_calculations 
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
 * /items_brick_calculations/{id}:
 *   delete:
 *     summary: Delete a brick calculation
 *     tags: [Items Brick Calculations]
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
      'DELETE FROM items_brick_calculations WHERE calculation_id = $1 RETURNING calculation_id',
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
 * /items_brick_calculations/{id}/verify:
 *   post:
 *     summary: Verify a brick calculation
 *     tags: [Items Brick Calculations]
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
      `UPDATE items_brick_calculations 
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
 * /items_brick_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get brick calculation summary for a project
 *     tags: [Items Brick Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Brick calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        brick_size,
        COUNT(*) as calculation_count,
        SUM(wall_area) as total_wall_area,
        SUM(total_bricks) as total_bricks,
        AVG(bricks_per_sqft) as avg_bricks_per_sqft,
        COUNT(CASE WHEN status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_count
      FROM items_brick_calculations
      WHERE project_id = $1
      GROUP BY brick_size
      ORDER BY brick_size
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_brick_calculations/measurement/{measurementId}:
 *   get:
 *     summary: Get brick calculation for a specific measurement
 *     tags: [Items Brick Calculations]
 *     parameters:
 *       - in: path
 *         name: measurementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Measurement ID
 *     responses:
 *       200:
 *         description: Brick calculation for the measurement
 *       404:
 *         description: No calculation found for this measurement
 *       500:
 *         description: Internal server error
 */
router.get('/measurement/:measurementId', async (req, res) => {
  const db = req.db;
  const { measurementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ibc.*,
        e.element_name,
        e.element_category
      FROM items_brick_calculations ibc
      LEFT JOIN elements e ON ibc.element_id = e.element_id
      WHERE ibc.measurement_id = $1
    `, [measurementId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No calculation found for this measurement' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;