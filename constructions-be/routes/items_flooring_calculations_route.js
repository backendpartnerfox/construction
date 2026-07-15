const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items Flooring Calculations
 *   description: API for managing flooring calculations for projects
 */

/**
 * @swagger
 * /items_flooring_calculations:
 *   get:
 *     tags: [Items Flooring Calculations]
 *     description: Retrieve all flooring calculations with details
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
 *         name: flooring_type
 *         schema:
 *           type: string
 *         description: Filter by flooring type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Verified, Pending]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of flooring calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, floor, room, flooring_type, status } = req.query;
  
  try {
    let query = `
      SELECT 
        ifc.*,
        p.project_name,
        p.project_code,
        afm.floor_id,
        afm.room,
        afm.area_description,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_flooring_calculations ifc
      LEFT JOIN projects p ON ifc.project_id = p.project_id
      LEFT JOIN architect_measurements_flooring afm ON ifc.measurement_id = afm.measurement_id
      LEFT JOIN employees emp ON ifc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON ifc.verified_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND ifc.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (floor) {
      paramCount++;
      query += ` AND afm.floor_id = $${paramCount}`;
      params.push(floor);
    }
    
    if (room) {
      paramCount++;
      query += ` AND afm.room = $${paramCount}`;
      params.push(room);
    }
    
    if (flooring_type) {
      paramCount++;
      query += ` AND ifc.flooring_type = $${paramCount}`;
      params.push(flooring_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND ifc.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY ifc.project_id, afm.floor_id, afm.room';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_flooring_calculations/{id}:
 *   get:
 *     tags: [Items Flooring Calculations]
 *     description: Retrieve a specific flooring calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the calculation to retrieve
 *     responses:
 *       200:
 *         description: Flooring calculation details
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
        ifc.*,
        p.project_name,
        p.project_code,
        afm.floor_id,
        afm.room,
        afm.area_description,
        afm.room_length,
        afm.room_width,
        emp.first_name || ' ' || emp.last_name AS calculated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS verified_by_name
      FROM items_flooring_calculations ifc
      LEFT JOIN projects p ON ifc.project_id = p.project_id
      LEFT JOIN architect_measurements_flooring afm ON ifc.measurement_id = afm.measurement_id
      LEFT JOIN employees emp ON ifc.calculated_by = emp.employee_id
      LEFT JOIN employees emp2 ON ifc.verified_by = emp2.employee_id
      WHERE ifc.calculation_id = $1
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
 * /items_flooring_calculations:
 *   post:
 *     summary: Create a new flooring calculation
 *     tags: [Items Flooring Calculations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - measurement_id
 *               - flooring_type
 *               - flooring_material
 *               - tile_length
 *               - tile_width
 *               - room_length
 *               - room_width
 *               - room_area
 *             properties:
 *               project_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               flooring_type:
 *                 type: string
 *               flooring_material:
 *                 type: string
 *               tile_length:
 *                 type: number
 *               tile_width:
 *                 type: number
 *               room_length:
 *                 type: number
 *               room_width:
 *                 type: number
 *               room_area:
 *                 type: number
 *               joint_width:
 *                 type: number
 *               skirting_height:
 *                 type: number
 *               wastage_percentage:
 *                 type: number
 *               pattern_type:
 *                 type: string
 *               border_required:
 *                 type: boolean
 *               border_width:
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
    flooring_type,
    flooring_material,
    tile_length,
    tile_width,
    room_length,
    room_width,
    room_area,
    joint_width,
    skirting_height,
    wastage_percentage,
    pattern_type,
    border_required,
    border_width,
    calculated_by
  } = req.body;

  // Validate required fields
  const requiredFields = {
    project_id, measurement_id, flooring_type, flooring_material,
    tile_length, tile_width, room_length, room_width, room_area
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
      `INSERT INTO items_flooring_calculations (
        project_id, measurement_id, flooring_type, flooring_material,
        tile_length, tile_width, room_length, room_width, room_area,
        joint_width, skirting_height, wastage_percentage, pattern_type,
        border_required, border_width, calculated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        project_id, measurement_id, flooring_type, flooring_material,
        tile_length, tile_width, room_length, room_width, room_area,
        joint_width || 0, skirting_height || 0, wastage_percentage || 10.00, 
        pattern_type || 'Standard', border_required || false, border_width || 0,
        calculated_by
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
 * /items_flooring_calculations/{id}:
 *   put:
 *     summary: Update a flooring calculation
 *     tags: [Items Flooring Calculations]
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
 *               flooring_type:
 *                 type: string
 *               flooring_material:
 *                 type: string
 *               tile_length:
 *                 type: number
 *               tile_width:
 *                 type: number
 *               joint_width:
 *                 type: number
 *               skirting_height:
 *                 type: number
 *               wastage_percentage:
 *                 type: number
 *               pattern_type:
 *                 type: string
 *               border_required:
 *                 type: boolean
 *               border_width:
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
      UPDATE items_flooring_calculations 
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
 * /items_flooring_calculations/{id}:
 *   delete:
 *     summary: Delete a flooring calculation
 *     tags: [Items Flooring Calculations]
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
      'DELETE FROM items_flooring_calculations WHERE calculation_id = $1 RETURNING calculation_id',
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
 * /items_flooring_calculations/{id}/verify:
 *   post:
 *     summary: Verify a flooring calculation
 *     tags: [Items Flooring Calculations]
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
      `UPDATE items_flooring_calculations 
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
 * /items_flooring_calculations/project/{projectId}/summary:
 *   get:
 *     summary: Get flooring calculation summary for a project
 *     tags: [Items Flooring Calculations]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Flooring calculation summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ifc.flooring_type,
        ifc.flooring_material,
        COUNT(*) as room_count,
        SUM(ifc.room_area) as total_area,
        SUM(ifc.number_of_tiles) as total_tiles,
        SUM(ifc.total_tiles_with_wastage) as total_tiles_with_wastage,
        SUM(ifc.skirting_length) as total_skirting_length,
        SUM(ifc.border_area) as total_border_area,
        AVG(ifc.wastage_percentage) as avg_wastage_percentage,
        COUNT(CASE WHEN ifc.status = 'Verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN ifc.status = 'Draft' THEN 1 END) as draft_count
      FROM items_flooring_calculations ifc
      WHERE ifc.project_id = $1
      GROUP BY ifc.flooring_type, ifc.flooring_material
      ORDER BY ifc.flooring_type, ifc.flooring_material
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items_flooring_calculations/project/{projectId}/floor/{floor}:
 *   get:
 *     summary: Get flooring calculations for a specific floor
 *     tags: [Items Flooring Calculations]
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
 *         description: Flooring calculations for the floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor/:floor', async (req, res) => {
  const db = req.db;
  const { projectId, floor } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        ifc.*,
        afm.room,
        afm.room_area,
        afm.room_length,
        afm.room_width
      FROM items_flooring_calculations ifc
      JOIN architect_measurements_flooring afm ON ifc.measurement_id = afm.flooring_measurement_id
      WHERE ifc.project_id = $1 AND afm.floor = $2
      ORDER BY afm.room
    `, [projectId, floor]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;