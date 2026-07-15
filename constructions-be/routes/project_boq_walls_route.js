const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project BOQ Walls
 *   description: API for managing project BOQ wall items
 */

/**
 * @swagger
 * /project_boq_walls:
 *   get:
 *     tags: [Project BOQ Walls]
 *     description: Retrieve all wall BOQ items with project and wall details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: component_id
 *         schema:
 *           type: integer
 *         description: Filter by component ID
 *       - in: query
 *         name: wall_type
 *         schema:
 *           type: string
 *         description: Filter by wall type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Approved, Revised]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of wall BOQ items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, component_id, wall_type, status } = req.query;
  
  try {
    let query = `
      SELECT 
        pbw.*,
        p.project_name,
        p.project_code,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code,
        awm.floor,
        awm.room,
        awm.wall_direction,
        awm.walltype as measurement_wall_type,
        awm.wall_thickness,
        awm.brick_choice_id,
        awm.width as wall_length,
        awm.height as wall_height,
        awm.actual_wall_width as net_wall_area,
        ic.display_name as brick_type,
        pc.floor_id,
        pf.floor_name,
        pf.floor_number,
        emp.first_name || ' ' || emp.last_name AS created_by_name,
        emp2.first_name || ' ' || emp2.last_name AS approved_by_name
      FROM project_boq_walls pbw
      LEFT JOIN projects p ON pbw.project_id = p.project_id
      LEFT JOIN items i ON pbw.item_id = i.item_id
      LEFT JOIN components c ON pbw.component_id = c.component_id
      LEFT JOIN architect_walls_measurement awm ON pbw.measurement_id = awm.measurement_id
      LEFT JOIN item_choices ic ON awm.brick_choice_id = ic.choice_option_id
      LEFT JOIN project_components pc ON pbw.component_id = pc.component_id AND pbw.project_id = pc.project_id
      LEFT JOIN project_floors pf ON pc.floor_id = pf.floor_id
      LEFT JOIN employees emp ON pbw.created_by = emp.employee_id
      LEFT JOIN employees emp2 ON pbw.approved_by = emp2.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND pbw.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (component_id) {
      paramCount++;
      query += ` AND pbw.component_id = $${paramCount}`;
      params.push(component_id);
    }
    
    if (wall_type) {
      paramCount++;
      query += ` AND pbw.wall_type = $${paramCount}`;
      params.push(wall_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND pbw.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY pbw.project_id, awm.floor, awm.room, awm.wall_direction';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/{id}:
 *   get:
 *     tags: [Project BOQ Walls]
 *     description: Retrieve a specific wall BOQ item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to retrieve
 *     responses:
 *       200:
 *         description: BOQ item details
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbw.*,
        p.project_name,
        p.project_code,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code,
        awm.floor,
        awm.room,
        awm.wall_direction,
        awm.walltype as measurement_wall_type,
        awm.wall_thickness,
        awm.brick_choice_id,
        awm.width as wall_length,
        awm.height as wall_height,
        awm.actual_wall_width as net_wall_area,
        ic.display_name as brick_type,
        emp.first_name || ' ' || emp.last_name AS created_by_name,
        emp2.first_name || ' ' || emp2.last_name AS approved_by_name
      FROM project_boq_walls pbw
      LEFT JOIN projects p ON pbw.project_id = p.project_id
      LEFT JOIN items i ON pbw.item_id = i.item_id
      LEFT JOIN components c ON pbw.component_id = c.component_id
      LEFT JOIN architect_walls_measurement awm ON pbw.measurement_id = awm.measurement_id
      LEFT JOIN item_choices ic ON awm.brick_choice_id = ic.choice_option_id
      LEFT JOIN employees emp ON pbw.created_by = emp.employee_id
      LEFT JOIN employees emp2 ON pbw.approved_by = emp2.employee_id
      WHERE pbw.boq_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BOQ item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls:
 *   post:
 *     summary: Create a new wall BOQ item
 *     tags: [Project BOQ Walls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - item_id
 *               - quantity
 *               - unit
 *             properties:
 *               project_id:
 *                 type: integer
 *               component_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               calculation_id:
 *                 type: integer
 *               wall_type:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ item created successfully
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
    unit_id,
    measurement_id,
    item_id,
    calculation_id,
    wall_type,
    specifications,
    quantity,
    unit,
    unit_rate,
    created_by
  } = req.body;

  if (!project_id || !item_id || !quantity || !unit) {
    return res.status(400).json({ error: "project_id, item_id, quantity, and unit are required" });
  }

  try {
    // Calculate amount
    const amount = quantity * (unit_rate || 0);

    const result = await db.query(
      `INSERT INTO project_boq_walls (
        project_id, component_id, unit_id, measurement_id,
        item_id, calculation_id, wall_type, specifications,
        quantity, unit, unit_rate, amount, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        project_id, component_id, unit_id, measurement_id,
        item_id, calculation_id, wall_type, specifications,
        quantity, unit, unit_rate, amount, 'Draft', created_by
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
 * /project_boq_walls/{id}:
 *   put:
 *     summary: Update a wall BOQ item
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               component_id:
 *                 type: integer
 *               unit_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               calculation_id:
 *                 type: integer
 *               wall_type:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Draft, Approved, Revised]
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: BOQ item updated successfully
 *       404:
 *         description: BOQ item not found
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

    // List of allowed fields to update
    const allowedFields = [
      'component_id', 'unit_id', 'measurement_id', 'item_id',
      'calculation_id', 'wall_type', 'specifications',
      'quantity', 'unit', 'unit_rate', 'status', 'updated_by'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    // Recalculate amount if quantity or unit_rate is updated
    if (updates.quantity !== undefined || updates.unit_rate !== undefined) {
      updateFields.push(`amount = COALESCE($${valueCount}, quantity) * COALESCE($${valueCount + 1}, unit_rate)`);
      values.push(updates.quantity);
      values.push(updates.unit_rate);
      valueCount += 2;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE project_boq_walls 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE boq_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/{id}:
 *   delete:
 *     summary: Delete a wall BOQ item
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to delete
 *     responses:
 *       200:
 *         description: BOQ item deleted successfully
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_boq_walls WHERE boq_id = $1 RETURNING boq_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ item not found" });
    }

    res.json({ message: "BOQ item deleted successfully", deleted_id: result.rows[0].boq_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/{id}/approve:
 *   post:
 *     summary: Approve a wall BOQ item
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ item to approve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved_by
 *             properties:
 *               approved_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: BOQ item approved successfully
 *       404:
 *         description: BOQ item not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "approved_by is required" });
  }

  try {
    const result = await db.query(
      `UPDATE project_boq_walls 
       SET status = 'Approved', 
           approved_by = $1, 
           approved_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP,
           updated_by = $1
       WHERE boq_id = $2
       RETURNING *`,
      [approved_by, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/project/{projectId}/summary:
 *   get:
 *     summary: Get wall BOQ summary for a project
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Wall BOQ summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        awm.floor,
        pbw.wall_type,
        ic.display_name as brick_type,
        i.item_name,
        i.item_unit,
        pbw.unit,
        SUM(awm.width * awm.height) as total_wall_area,
        SUM(COALESCE(awm.window_sqft, 0) + COALESCE(awm.window2_sqft, 0) + 
            COALESCE(awm.door_sqft, 0) + COALESCE(awm.door2_sqft, 0)) as total_deduction_area,
        SUM(awm.actual_wall_width) as total_net_area,
        SUM(pbw.quantity) as total_quantity,
        AVG(pbw.unit_rate) as avg_unit_rate,
        SUM(pbw.amount) as total_cost,
        COUNT(*) as wall_count
      FROM project_boq_walls pbw
      JOIN items i ON pbw.item_id = i.item_id
      LEFT JOIN architect_walls_measurement awm ON pbw.measurement_id = awm.measurement_id
      LEFT JOIN item_choices ic ON awm.brick_choice_id = ic.choice_option_id
      WHERE pbw.project_id = $1
      GROUP BY awm.floor, pbw.wall_type, ic.display_name, i.item_id, i.item_name, i.item_unit, pbw.unit
      ORDER BY awm.floor, pbw.wall_type, i.item_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/project/{projectId}/floor-summary:
 *   get:
 *     summary: Get wall BOQ summary grouped by floor
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Wall BOQ summary by floor
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/floor-summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        awm.floor,
        COUNT(DISTINCT awm.room) as room_count,
        COUNT(DISTINCT pbw.boq_id) as wall_count,
        SUM(awm.width * awm.height) as total_wall_area,
        SUM(awm.actual_wall_width) as total_net_area,
        SUM(pbw.amount) as total_cost
      FROM project_boq_walls pbw
      LEFT JOIN architect_walls_measurement awm ON pbw.measurement_id = awm.measurement_id
      WHERE pbw.project_id = $1
      GROUP BY awm.floor
      ORDER BY awm.floor
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/measurement/{measurementId}:
 *   get:
 *     summary: Get wall BOQ items for a specific measurement
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: measurementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Measurement ID
 *     responses:
 *       200:
 *         description: Wall BOQ items for the measurement
 *       500:
 *         description: Internal server error
 */
router.get('/measurement/:measurementId', async (req, res) => {
  const db = req.db;
  const { measurementId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbw.*,
        i.item_name,
        i.item_unit,
        awm.floor,
        awm.room,
        awm.wall_direction,
        awm.walltype as measurement_wall_type,
        awm.wall_thickness,
        ic.display_name as brick_type
      FROM project_boq_walls pbw
      JOIN items i ON pbw.item_id = i.item_id
      LEFT JOIN architect_walls_measurement awm ON pbw.measurement_id = awm.measurement_id
      LEFT JOIN item_choices ic ON awm.brick_choice_id = ic.choice_option_id
      WHERE pbw.measurement_id = $1
      ORDER BY pbw.item_id
    `, [measurementId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_walls/component/{componentId}:
 *   get:
 *     summary: Get wall BOQ items for a specific component
 *     tags: [Project BOQ Walls]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Wall BOQ items for the component
 *       500:
 *         description: Internal server error
 */
router.get('/component/:componentId', async (req, res) => {
  const db = req.db;
  const { componentId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pbw.*,
        i.item_name,
        i.item_unit,
        c.component_name,
        c.component_code,
        awm.floor,
        awm.room,
        awm.wall_direction
      FROM project_boq_walls pbw
      LEFT JOIN items i ON pbw.item_id = i.item_id
      LEFT JOIN components c ON pbw.component_id = c.component_id
      LEFT JOIN architect_walls_measurement awm ON pbw.measurement_id = awm.measurement_id
      WHERE pbw.component_id = $1
      ORDER BY awm.floor, awm.room
    `, [componentId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;