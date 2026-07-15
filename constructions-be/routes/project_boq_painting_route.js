const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBOQPainting
 *   description: API for managing project BOQ painting
 */

/**
 * @swagger
 * /project_boq_painting:
 *   get:
 *     tags: [ProjectBOQPainting]
 *     description: Retrieve all project BOQ painting records
 *     responses:
 *       200:
 *         description: List of project BOQ painting records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   boq_painting_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   floor:
 *                     type: string
 *                   room:
 *                     type: string
 *                   paint_type:
 *                     type: string
 *                   total_area:
 *                     type: number
 *                   unit_rate:
 *                     type: number
 *                   total_amount:
 *                     type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        pbp.*,
        p.project_name,
        ic.display_name as paint_choice_name,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM project_boq_painting pbp
      LEFT JOIN projects p ON pbp.project_id = p.project_id
      LEFT JOIN item_choices ic ON pbp.paint_choice_id = ic.choice_option_id
      LEFT JOIN employees e ON pbp.created_by = e.employee_id
      ORDER BY pbp.project_id
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_boq_painting/{id}:
 *   get:
 *     tags: [ProjectBOQPainting]
 *     description: Retrieve a specific project BOQ painting record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ painting record
 *     responses:
 *       200:
 *         description: BOQ painting record details
 *       404:
 *         description: BOQ painting record not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        pbp.*,
        p.project_name,
        ic.display_name as paint_choice_name,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM project_boq_painting pbp
      LEFT JOIN projects p ON pbp.project_id = p.project_id
      LEFT JOIN item_choices ic ON pbp.paint_choice_id = ic.choice_option_id
      LEFT JOIN employees e ON pbp.created_by = e.employee_id
      WHERE pbp.boq_painting_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BOQ painting record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_painting/project/{projectId}:
 *   get:
 *     tags: [ProjectBOQPainting]
 *     description: Retrieve all BOQ painting records for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of BOQ painting records for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT * FROM project_boq_painting 
      WHERE project_id = $1 
      ORDER BY boq_id
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_boq_painting:
 *   post:
 *     summary: Create a new project BOQ painting record
 *     tags: [ProjectBOQPainting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - floor
 *               - room
 *             properties:
 *               project_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               paint_type:
 *                 type: string
 *               paint_choice_id:
 *                 type: integer
 *               wall_area:
 *                 type: number
 *               ceiling_area:
 *                 type: number
 *               door_window_area:
 *                 type: number
 *               net_paintable_area:
 *                 type: number
 *               total_area:
 *                 type: number
 *               primer_coats:
 *                 type: integer
 *               paint_coats:
 *                 type: integer
 *               finish_type:
 *                 type: string
 *               texture_type:
 *                 type: string
 *               color_scheme:
 *                 type: string
 *               quantity_per_coat:
 *                 type: number
 *               total_quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               total_amount:
 *                 type: number
 *               labor_cost:
 *                 type: number
 *               material_cost:
 *                 type: number
 *               status:
 *                 type: string
 *               remarks:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ painting record created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, measurement_id, floor, room, paint_type, paint_choice_id,
    wall_area, ceiling_area, door_window_area, net_paintable_area,
    total_area, primer_coats, paint_coats, finish_type, texture_type,
    color_scheme, quantity_per_coat, total_quantity, unit, unit_rate,
    total_amount, labor_cost, material_cost, status, remarks, created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !floor || !room) {
    return res.status(400).json({ 
      error: "Required fields: project_id, floor, room" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate net paintable area if not provided
    const finalNetPaintableArea = net_paintable_area || 
      ((wall_area || 0) + (ceiling_area || 0) - (door_window_area || 0));
    
    // Calculate total area if not provided
    const finalTotalArea = total_area || finalNetPaintableArea;
    
    // Calculate total coats
    const totalCoats = (primer_coats || 1) + (paint_coats || 2);
    
    // Calculate total quantity if not provided
    const finalTotalQuantity = total_quantity || 
      (finalTotalArea * totalCoats * (quantity_per_coat || 0.1));
    
    // Calculate total amount if not provided
    const finalTotalAmount = total_amount || (finalTotalQuantity * (unit_rate || 0));

    const result = await db.query(
      `INSERT INTO project_boq_painting (
        project_id, measurement_id, floor, room, paint_type, paint_choice_id,
        wall_area, ceiling_area, door_window_area, net_paintable_area,
        total_area, primer_coats, paint_coats, finish_type, texture_type,
        color_scheme, quantity_per_coat, total_quantity, unit, unit_rate,
        total_amount, labor_cost, material_cost, status, remarks, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *`,
      [
        project_id, measurement_id, floor, room, paint_type, paint_choice_id,
        wall_area || 0, ceiling_area || 0, door_window_area || 0, finalNetPaintableArea,
        finalTotalArea, primer_coats || 1, paint_coats || 2, finish_type, texture_type,
        color_scheme, quantity_per_coat || 0.1, finalTotalQuantity, unit || 'liters', 
        unit_rate || 0, finalTotalAmount, labor_cost || 0, material_cost || 0, 
        status || 'Draft', remarks, created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_painting/{id}:
 *   put:
 *     summary: Update an existing project BOQ painting record
 *     tags: [ProjectBOQPainting]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ painting record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               paint_type:
 *                 type: string
 *               paint_choice_id:
 *                 type: integer
 *               wall_area:
 *                 type: number
 *               ceiling_area:
 *                 type: number
 *               door_window_area:
 *                 type: number
 *               net_paintable_area:
 *                 type: number
 *               total_area:
 *                 type: number
 *               primer_coats:
 *                 type: integer
 *               paint_coats:
 *                 type: integer
 *               finish_type:
 *                 type: string
 *               texture_type:
 *                 type: string
 *               color_scheme:
 *                 type: string
 *               quantity_per_coat:
 *                 type: number
 *               total_quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               total_amount:
 *                 type: number
 *               labor_cost:
 *                 type: number
 *               material_cost:
 *                 type: number
 *               status:
 *                 type: string
 *               remarks:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: BOQ painting record updated successfully
 *       404:
 *         description: BOQ painting record not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.boq_painting_id;
  delete updates.project_id;
  delete updates.created_at;
  delete updates.created_by;

  // Add updated_at timestamp
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 1) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE project_boq_painting 
       SET ${setClause}
       WHERE boq_painting_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ painting record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_painting/{id}:
 *   delete:
 *     summary: Delete a project BOQ painting record
 *     tags: [ProjectBOQPainting]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ painting record to delete
 *     responses:
 *       200:
 *         description: BOQ painting record deleted successfully
 *       404:
 *         description: BOQ painting record not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_boq_painting WHERE boq_painting_id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ painting record not found" });
    }
    
    res.json({ message: "BOQ painting record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_painting/summary/{projectId}:
 *   get:
 *     tags: [ProjectBOQPainting]
 *     description: Get painting BOQ summary for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Painting BOQ summary for the project
 *       500:
 *         description: Internal server error
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT floor) as total_floors,
        COUNT(DISTINCT room) as total_rooms,
        SUM(wall_area) as total_wall_area,
        SUM(ceiling_area) as total_ceiling_area,
        SUM(net_paintable_area) as total_paintable_area,
        SUM(total_quantity) as total_paint_quantity,
        SUM(total_amount) as total_cost,
        SUM(labor_cost) as total_labor_cost,
        SUM(material_cost) as total_material_cost,
        AVG(unit_rate) as average_unit_rate
      FROM project_boq_painting
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;