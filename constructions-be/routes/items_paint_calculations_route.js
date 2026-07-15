const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Paint Calculations
 *   description: API for managing paint calculations for projects
 */

/**
 * @swagger
 * /items_paint_calculations:
 *   get:
 *     tags: [Items Paint Calculations]
 *     description: Retrieve all paint calculations with details
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
 *         name: paint_type
 *         schema:
 *           type: string
 *         description: Filter by paint type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of paint calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, paint_type, status } = req.query;
  
  try {
    let query = `
      SELECT 
        ipc.*,
        p.project_name,
        p.project_code,
        apm.floor_id,
        apm.room,
        apm.surface_type,
        apm.surface_description,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_paint_calculations ipc
      LEFT JOIN projects p ON ipc.project_id = p.project_id
      LEFT JOIN architect_measurements_painting apm ON ipc.measurement_id = apm.measurement_id
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
      query += ` AND apm.floor_id = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND apm.room = $${paramCount}`;
      params.push(room);
    }
    
    if (paint_type) {
      paramCount++;
      query += ` AND ipc.paint_type = $${paramCount}`;
      params.push(paint_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND ipc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY ipc.project_id, apm.floor_id, apm.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_paint_calculations/{id}:
 *   get:
 *     tags: [Items Paint Calculations]
 *     description: Retrieve a specific paint calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Paint calculation details
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
        apm.floor_id,
        apm.room,
        apm.surface_type,
        apm.surface_description,
        apm.wall_height,
        apm.wall_length,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_paint_calculations ipc
      LEFT JOIN projects p ON ipc.project_id = p.project_id
      LEFT JOIN architect_measurements_painting apm ON ipc.measurement_id = apm.measurement_id
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
 * /items_paint_calculations:
 *   post:
 *     summary: Create a new paint calculation
 *     tags: [Items Paint Calculations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - measurement_id
 *               - paint_type
 *               - paint_brand
 *               - paint_finish
 *               - surface_area
 *               - coverage_per_liter
 *               - number_of_coats
 *             properties:
 *               project_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               paint_type:
 *                 type: string
 *               paint_brand:
 *                 type: string
 *               paint_finish:
 *                 type: string
 *               surface_area:
 *                 type: number
 *               coverage_per_liter:
 *                 type: number
 *               number_of_coats:
 *                 type: integer
 *               primer_required:
 *                 type: boolean
 *               primer_coverage_per_liter:
 *                 type: number
 *               putty_required:
 *                 type: boolean
 *               putty_coverage_per_kg:
 *                 type: number
 *               wastage_percentage:
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
    measurement_id,
    paint_type,
    paint_brand,
    paint_finish,
    surface_area,
    coverage_per_liter,
    number_of_coats,
    primer_required,
    primer_coverage_per_liter,
    putty_required,
    putty_coverage_per_kg,
    wastage_percentage,
    calculated_by
  } = req.body;

  // Validate required fields
  const requiredFields = {
    project_id, measurement_id, paint_type, paint_brand,
    paint_finish, surface_area, coverage_per_liter, number_of_coats
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
      `INSERT INTO items_paint_calculations (
        project_id, measurement_id, paint_type, paint_brand,
        paint_finish, surface_area, coverage_per_liter, number_of_coats,
        primer_required, primer_coverage_per_liter, putty_required,
        putty_coverage_per_kg, wastage_percentage, calculated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        project_id, measurement_id, paint_type, paint_brand,
        paint_finish, surface_area, coverage_per_liter, number_of_coats,
        primer_required || false, primer_coverage_per_liter || 0,
        putty_required || false, putty_coverage_per_kg || 0,
        wastage_percentage || 10.00, calculated_by
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
 * /items_paint_calculations/{id}:
 *   put:
 *     summary: Update a paint calculation
 *     tags: [Items Paint Calculations]
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
 *               paint_type:
 *                 type: string
 *               paint_brand:
 *                 type: string
 *               paint_finish:
 *                 type: string
 *               coverage_per_liter:
 *                 type: number
 *               number_of_coats:
 *                 type: integer
 *               primer_required:
 *                 type: boolean
 *               primer_coverage_per_liter:
 *                 type: number
 *               putty_required:
 *                 type: boolean
 *               putty_coverage_per_kg:
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
      UPDATE items_paint_calculations 
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
 * /items_paint_calculations/{id}:
 *   delete:
 *     summary: Delete a paint calculation
 *     tags: [Items Paint Calculations]
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
      'DELETE FROM items_paint_calculations WHERE calculation_id = $1 RETURNING calculation_id',
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
 * /items_paint_calculations/{id}/verify:
 *   post:
 *     summary: Verify a paint calculation
 *     tags: [Items Paint Calculations]
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
      `UPDATE items_paint_calculations 
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
 * /items_paint_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get paint calculation summary for a project
 *     tags: [Items Paint Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Paint calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ipc.paint_type,
        ipc.paint_brand,
        ipc.paint_finish,
        COUNT(*) as surface_count,
        SUM(ipc.surface_area) as total_surface_area,
        SUM(ipc.paint_liters_required) as total_paint_liters,
        SUM(ipc.total_paint_with_wastage) as total_paint_with_wastage,
        SUM(ipc.primer_liters_required) as total_primer_liters,
        SUM(ipc.putty_kg_required) as total_putty_kg,
        AVG(ipc.wastage_percentage) as avg_wastage_percentage,
        COUNT(CASE WHEN ipc.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN ipc.status = 'Draft' THEN 1 END) as draft_count
      FROM items_paint_calculations ipc
      WHERE ipc.project_id = $1
      GROUP BY ipc.paint_type, ipc.paint_brand, ipc.paint_finish
      ORDER BY ipc.paint_type, ipc.paint_brand, ipc.paint_finish
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_paint_calculations/project/{projectId}/cost-estimate:
 *   get:
 *     summary: Get paint cost estimate for a project
 *     tags: [Items Paint Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Paint cost estimate breakdown
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/cost-estimate', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ipc.paint_type,
        ipc.paint_brand,
        SUM(ipc.total_paint_with_wastage) as total_liters,
        SUM(ipc.primer_liters_required) as primer_liters,
        SUM(ipc.putty_kg_required) as putty_kg,
        COUNT(DISTINCT apm.floor) as floors_count,
        COUNT(DISTINCT apm.room) as rooms_count,
        ROUND(SUM(ipc.surface_area)::numeric, 2) as total_area_sqm
      FROM items_paint_calculations ipc
      JOIN architect_measurements_painting apm ON ipc.measurement_id = apm.painting_measurement_id
      WHERE ipc.project_id = $1
      GROUP BY ipc.paint_type, ipc.paint_brand
      ORDER BY total_area_sqm DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;