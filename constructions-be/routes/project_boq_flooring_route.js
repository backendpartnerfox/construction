const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBOQFlooring
 *   description: API for managing project BOQ flooring
 */

/**
 * @swagger
 * /project_boq_flooring:
 *   get:
 *     tags: [ProjectBOQFlooring]
 *     description: Retrieve all project BOQ flooring records
 *     responses:
 *       200:
 *         description: List of project BOQ flooring records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   boq_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   component_id:
 *                     type: integer
 *                   unit_id:
 *                     type: integer
 *                   measurement_id:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   calculation_id:
 *                     type: integer
 *                   flooring_type:
 *                     type: string
 *                   tile_size:
 *                     type: string
 *                   specifications:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   requires_selection:
 *                     type: boolean
 *                   selected_choice_id:
 *                     type: integer
 *                   unit_rate:
 *                     type: number
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        pbf.*,
        p.project_name,
        c.component_name as component_name,
        i.item_name as item_name,
        ic.display_name as display_name,
        u.unit_name as unit_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        a.first_name || ' ' || a.last_name as approved_by_name
      FROM project_boq_flooring pbf
      LEFT JOIN projects p ON pbf.project_id = p.project_id
      LEFT JOIN components c ON pbf.component_id = c.component_id
      LEFT JOIN items i ON pbf.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbf.selected_choice_id = ic.choice_option_id
      LEFT JOIN units u ON pbf.unit_id = u.unit_id
      LEFT JOIN architect_measurements_flooring m ON pbf.measurement_id = m.measurement_id
      LEFT JOIN items_flooring_calculations calc ON pbf.calculation_id = calc.calculation_id
      LEFT JOIN employees e ON pbf.created_by = e.employee_id
      LEFT JOIN employees a ON pbf.approved_by = a.employee_id
      ORDER BY pbf.project_id, pbf.boq_id
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring/{id}:
 *   get:
 *     tags: [ProjectBOQFlooring]
 *     description: Retrieve a specific project BOQ flooring record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ flooring record
 *     responses:
 *       200:
 *         description: BOQ flooring record details
 *       404:
 *         description: BOQ flooring record not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        pbf.*,
        p.project_name,
        c.component_name as component_name,
        i.item_name as item_name,
        ic.display_name as display_name,
        u.unit_name as unit_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        a.first_name || ' ' || a.last_name as approved_by_name
      FROM project_boq_flooring pbf
      LEFT JOIN projects p ON pbf.project_id = p.project_id
      LEFT JOIN components c ON pbf.component_id = c.component_id
      LEFT JOIN items i ON pbf.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbf.selected_choice_id = ic.choice_option_id
      LEFT JOIN units u ON pbf.unit_id = u.unit_id
      LEFT JOIN architect_measurements_flooring m ON pbf.measurement_id = m.measurement_id
      LEFT JOIN items_flooring_calculations calc ON pbf.calculation_id = calc.calculation_id
      LEFT JOIN employees e ON pbf.created_by = e.employee_id
      LEFT JOIN employees a ON pbf.approved_by = a.employee_id
      WHERE pbf.boq_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BOQ flooring record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring/project/{projectId}:
 *   get:
 *     tags: [ProjectBOQFlooring]
 *     description: Retrieve all BOQ flooring records for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of BOQ flooring records for the project
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
      SELECT 
        pbf.*,
        c.component_name as component_name,
        i.item_name as item_name,
        ic.display_name as display_name,
        u.unit_name as unit_name
      FROM project_boq_flooring pbf
      LEFT JOIN components c ON pbf.component_id = c.component_id
      LEFT JOIN items i ON pbf.item_id = i.item_id
      LEFT JOIN item_choices ic ON pbf.selected_choice_id = ic.choice_option_id
      LEFT JOIN units u ON pbf.unit_id = u.unit_id
      LEFT JOIN architect_measurements_flooring m ON pbf.measurement_id = m.measurement_id
      LEFT JOIN items_flooring_calculations calc ON pbf.calculation_id = calc.calculation_id
      WHERE pbf.project_id = $1 
      ORDER BY pbf.boq_id
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring:
 *   post:
 *     summary: Create a new project BOQ flooring record
 *     tags: [ProjectBOQFlooring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - component_id
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
 *               flooring_type:
 *                 type: string
 *               tile_size:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               requires_selection:
 *                 type: boolean
 *               selected_choice_id:
 *                 type: integer
 *               unit_rate:
 *                 type: number
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ flooring record created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Referenced entity not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, component_id, unit_id, measurement_id, item_id,
    calculation_id, flooring_type, tile_size, specifications,
    quantity, unit, requires_selection, selected_choice_id,
    unit_rate, amount, status, created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !component_id || !item_id || !quantity || !unit) {
    return res.status(400).json({ 
      error: "Required fields: project_id, component_id, item_id, quantity, unit" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify component exists
    const componentCheck = await db.query('SELECT component_id FROM components WHERE component_id = $1', [component_id]);
    
    if (componentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Calculate amount if not provided
    const finalAmount = amount || (quantity * (unit_rate || 0));

    const result = await db.query(
      `INSERT INTO project_boq_flooring (
        project_id, component_id, unit_id, measurement_id, item_id,
        calculation_id, flooring_type, tile_size, specifications,
        quantity, unit, requires_selection, selected_choice_id,
        unit_rate, amount, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        project_id, component_id, unit_id, measurement_id, item_id,
        calculation_id, flooring_type, tile_size, specifications,
        quantity, unit, requires_selection !== undefined ? requires_selection : true, 
        selected_choice_id, unit_rate || 0, finalAmount, 
        status || 'Draft', created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring/{id}:
 *   put:
 *     summary: Update an existing project BOQ flooring record
 *     tags: [ProjectBOQFlooring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ flooring record to update
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
 *               flooring_type:
 *                 type: string
 *               tile_size:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               requires_selection:
 *                 type: boolean
 *               selected_choice_id:
 *                 type: integer
 *               unit_rate:
 *                 type: number
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *               approved_by:
 *                 type: integer
 *               approved_date:
 *                 type: string
 *                 format: date
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: BOQ flooring record updated successfully
 *       404:
 *         description: BOQ flooring record not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.boq_id;
  delete updates.project_id;
  delete updates.created_at;
  delete updates.created_by;

  // Add updated_at timestamp
  updates.updated_at = new Date();

  // If updating amount, ensure it's recalculated if quantity or unit_rate changed
  if (updates.quantity || updates.unit_rate) {
    const currentRecord = await db.query(
      'SELECT quantity, unit_rate FROM project_boq_flooring WHERE boq_id = $1',
      [id]
    );
    
    if (currentRecord.rows.length > 0) {
      const newQuantity = updates.quantity || currentRecord.rows[0].quantity;
      const newUnitRate = updates.unit_rate || currentRecord.rows[0].unit_rate;
      updates.amount = newQuantity * newUnitRate;
    }
  }

  if (Object.keys(updates).length === 1) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE project_boq_flooring 
       SET ${setClause}
       WHERE boq_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ flooring record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring/{id}:
 *   delete:
 *     summary: Delete a project BOQ flooring record
 *     tags: [ProjectBOQFlooring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ flooring record to delete
 *     responses:
 *       200:
 *         description: BOQ flooring record deleted successfully
 *       404:
 *         description: BOQ flooring record not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_boq_flooring WHERE boq_id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ flooring record not found" });
    }
    
    res.json({ message: "BOQ flooring record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring/summary/{projectId}:
 *   get:
 *     tags: [ProjectBOQFlooring]
 *     description: Get flooring BOQ summary for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Flooring BOQ summary for the project
 *       500:
 *         description: Internal server error
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT component_id) as total_components,
        COUNT(DISTINCT flooring_type) as flooring_types,
        SUM(quantity) as total_quantity,
        SUM(amount) as total_amount,
        AVG(unit_rate) as average_unit_rate,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_items,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_items,
        COUNT(CASE WHEN requires_selection = true AND selected_choice_id IS NULL THEN 1 END) as pending_selections
      FROM project_boq_flooring
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /project_boq_flooring/approve/{id}:
 *   put:
 *     summary: Approve a BOQ flooring record
 *     tags: [ProjectBOQFlooring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ flooring record to approve
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
 *         description: BOQ flooring record approved successfully
 *       404:
 *         description: BOQ flooring record not found
 *       500:
 *         description: Internal server error
 */
router.put('/approve/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "approved_by is required" });
  }

  try {
    const result = await db.query(
      `UPDATE project_boq_flooring 
       SET status = 'Approved', 
           approved_by = $2, 
           approved_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE boq_id = $1
       RETURNING *`,
      [id, approved_by]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "BOQ flooring record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;