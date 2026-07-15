const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBOQ
 *   description: API for managing project Bill of Quantities (BOQ)
 */

/**
 * @swagger
 * /boq:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve all BOQ entries
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of entries to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of entries to skip
 *     responses:
 *       200:
 *         description: List of BOQ entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       boq_id:
 *                         type: integer
 *                       project_id:
 *                         type: integer
 *                       element_id:
 *                         type: integer
 *                       item_id:
 *                         type: integer
 *                       quantity:
 *                         type: number
 *                       unit:
 *                         type: string
 *                       unit_rate:
 *                         type: number
 *                       total_amount:
 *                         type: number
 *                       status:
 *                         type: string
 *       500:
 *         description: Internal server error
 */

// Get all BOQ entries with pagination
router.get('/', async (req, res) => {
  const db = req.db;
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  
  try {
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM project_boq');
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated data
    const result = await db.query(
      'SELECT * FROM project_boq ORDER BY boq_id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    res.json({
      total,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/{id}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve a specific BOQ entry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ entry to retrieve
 *     responses:
 *       200:
 *         description: BOQ entry details
 *       404:
 *         description: BOQ entry not found
 *       500:
 *         description: Internal server error
 */

// Get BOQ entry by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM project_boq WHERE boq_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'BOQ entry not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq:
 *   post:
 *     summary: Create a new BOQ entry
 *     tags: [ProjectBOQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - element_id
 *               - item_id
 *               - quantity
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               main_bar_dia:
 *                 type: number
 *               distribution_bar_dia:
 *                 type: number
 *               qty_main_bars:
 *                 type: integer
 *               qty_distribution_bards:
 *                 type: integer
 *               rmc_grade:
 *                 type: string
 *               element_length:
 *                 type: number
 *               element_width:
 *                 type: number
 *               element_height:
 *                 type: number
 *               element_thickness:
 *                 type: number
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               calculation_id:
 *                 type: integer
 *               unit_rate:
 *                 type: number
 *               remarks:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ entry created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    element_id,
    item_id,
    main_bar_dia,
    distribution_bar_dia,
    qty_main_bars,
    qty_distribution_bards,
    rmc_grade,
    element_length,
    element_width,
    element_height,
    element_thickness,
    quantity,
    unit,
    calculation_id,
    unit_rate,
    remarks,
    created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !element_id || !item_id || quantity === undefined) {
    return res.status(400).json({ error: "Project ID, element ID, item ID, and quantity are required" });
  }

  try {
    // Check if the referenced IDs exist
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(400).json({ error: "Project ID does not exist" });
    }
    
    const elementCheck = await db.query('SELECT element_id FROM elements WHERE element_id = $1', [element_id]);
    if (elementCheck.rows.length === 0) {
      return res.status(400).json({ error: "Element ID does not exist" });
    }
    
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(400).json({ error: "Item ID does not exist" });
    }

    const result = await db.query(
      `INSERT INTO project_boq (
        project_id,
        element_id,
        item_id,
        main_bar_dia,
        distribution_bar_dia,
        qty_main_bars,
        qty_distribution_bards,
        rmc_grade,
        element_length,
        element_width,
        element_height,
        element_thickness,
        quantity,
        unit,
        calculation_id,
        unit_rate,
        status,
        revision_number,
        remarks,
        created_by,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [
        project_id,
        element_id,
        item_id,
        main_bar_dia || null,
        distribution_bar_dia || null,
        qty_main_bars || null,
        qty_distribution_bards || null,
        rmc_grade || null,
        element_length || null,
        element_width || null,
        element_height || null,
        element_thickness || null,
        quantity,
        unit || null,
        calculation_id || null,
        unit_rate || null,
        'Draft',
        0,
        remarks || null,
        created_by || null
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    // Check if the error is due to foreign key constraint
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid reference ID. Make sure all referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/{id}:
 *   put:
 *     summary: Update an existing BOQ entry by ID
 *     tags: [ProjectBOQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_rate:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: BOQ entry updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: BOQ entry not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    element_id,
    item_id,
    main_bar_dia,
    distribution_bar_dia,
    qty_main_bars,
    qty_distribution_bards,
    rmc_grade,
    element_length,
    element_width,
    element_height,
    element_thickness,
    quantity,
    unit,
    calculation_id,
    unit_rate,
    remarks
  } = req.body;

  // Validate required fields
  if (!project_id || !element_id || !item_id || quantity === undefined) {
    return res.status(400).json({ error: "Project ID, element ID, item ID, and quantity are required" });
  }

  try {
    // Check if the BOQ entry exists
    const checkResult = await db.query('SELECT status FROM project_boq WHERE boq_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "BOQ entry not found" });
    }
    
    // Check if the BOQ entry is in an approved state
    if (checkResult.rows[0].status === 'Approved') {
      return res.status(400).json({ 
        error: "Cannot update an approved BOQ entry. Create a revision instead." 
      });
    }

    const result = await db.query(
      `UPDATE project_boq 
       SET project_id = $1,
           element_id = $2,
           item_id = $3,
           main_bar_dia = $4,
           distribution_bar_dia = $5,
           qty_main_bars = $6,
           qty_distribution_bards = $7,
           rmc_grade = $8,
           element_length = $9,
           element_width = $10,
           element_height = $11,
           element_thickness = $12,
           quantity = $13,
           unit = $14,
           calculation_id = $15,
           unit_rate = $16,
           remarks = $17
       WHERE boq_id = $18
       RETURNING *`,
      [
        project_id,
        element_id,
        item_id,
        main_bar_dia || null,
        distribution_bar_dia || null,
        qty_main_bars || null,
        qty_distribution_bards || null,
        rmc_grade || null,
        element_length || null,
        element_width || null,
        element_height || null,
        element_thickness || null,
        quantity,
        unit || null,
        calculation_id || null,
        unit_rate || null,
        remarks || null,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    // Check if the error is due to foreign key constraint
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid reference ID. Make sure all referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/{id}:
 *   delete:
 *     summary: Delete a BOQ entry by ID
 *     tags: [ProjectBOQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ entry to delete
 *     responses:
 *       200:
 *         description: BOQ entry deleted successfully
 *       400:
 *         description: Cannot delete an approved BOQ entry
 *       404:
 *         description: BOQ entry not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if the BOQ entry exists and its status
    const checkResult = await db.query('SELECT status FROM project_boq WHERE boq_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "BOQ entry not found" });
    }
    
    // Check if the BOQ entry is in an approved state
    if (checkResult.rows[0].status === 'Approved') {
      return res.status(400).json({ 
        error: "Cannot delete an approved BOQ entry. Create a revision instead." 
      });
    }
    
    const result = await db.query("DELETE FROM project_boq WHERE boq_id = $1", [id]);
    
    res.json({ message: "BOQ entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/project/{projectId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve all BOQ entries for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to retrieve BOQ entries for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (optional)
 *     responses:
 *       200:
 *         description: List of BOQ entries for the specified project
 *       500:
 *         description: Internal server error
 */

// Get BOQ entries by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { status } = req.query;
  
  try {
    let query = "SELECT * FROM project_boq WHERE project_id = $1";
    const queryParams = [projectId];
    
    if (status) {
      query += " AND status = $2";
      queryParams.push(status);
    }
    
    query += " ORDER BY boq_id DESC";
    
    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/element/{elementId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve all BOQ entries for a specific element
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the element to retrieve BOQ entries for
 *     responses:
 *       200:
 *         description: List of BOQ entries for the specified element
 *       500:
 *         description: Internal server error
 */

// Get BOQ entries by element ID
router.get('/element/:elementId', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM project_boq WHERE element_id = $1 ORDER BY boq_id DESC",
      [elementId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/item/{itemId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve all BOQ entries for a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to retrieve BOQ entries for
 *     responses:
 *       200:
 *         description: List of BOQ entries for the specified item
 *       500:
 *         description: Internal server error
 */

// Get BOQ entries by item ID
router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM project_boq WHERE item_id = $1 ORDER BY boq_id DESC",
      [itemId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/status/{status}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve all BOQ entries with a specific status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter BOQ entries by (Draft, Approved, Revised)
 *     responses:
 *       200:
 *         description: List of BOQ entries with the specified status
 *       500:
 *         description: Internal server error
 */

// Get BOQ entries by status
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM project_boq WHERE status = $1 ORDER BY boq_id DESC",
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/approve/{id}:
 *   put:
 *     summary: Approve a BOQ entry
 *     tags: [ProjectBOQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ entry to approve
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
 *         description: BOQ entry approved successfully
 *       404:
 *         description: BOQ entry not found
 *       500:
 *         description: Internal server error
 */

// Approve a BOQ entry
router.put('/approve/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "Approved by ID is required" });
  }

  try {
    // First check if the BOQ entry exists
    const checkResult = await db.query('SELECT status FROM project_boq WHERE boq_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "BOQ entry not found" });
    }
    
    // Then check if the employee exists
    const employeeCheck = await db.query('SELECT employee_id FROM employees WHERE employee_id = $1', [approved_by]);
    if (employeeCheck.rows.length === 0) {
      return res.status(400).json({ error: "Employee ID does not exist" });
    }

    const result = await db.query(
      `UPDATE project_boq 
       SET status = 'Approved', 
           approved_by = $1, 
           approved_at = CURRENT_TIMESTAMP
       WHERE boq_id = $2
       RETURNING *`,
      [approved_by, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid employee ID for approval" 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/revise/{id}:
 *   post:
 *     summary: Create a revised version of a BOQ entry
 *     tags: [ProjectBOQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ entry to revise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - created_by
 *             properties:
 *               created_by:
 *                 type: integer
 *               remarks:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit_rate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Revised BOQ entry created successfully
 *       404:
 *         description: BOQ entry not found
 *       500:
 *         description: Internal server error
 */

// Create a revised version of a BOQ entry
router.post('/revise/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { created_by, remarks, quantity, unit_rate } = req.body;

  if (!created_by) {
    return res.status(400).json({ error: "Created by ID is required" });
  }

  try {
    // Begin transaction
    await db.query('BEGIN');
    
    // First, get the original BOQ entry
    const originalBOQ = await db.query(
      "SELECT * FROM project_boq WHERE boq_id = $1",
      [id]
    );

    if (originalBOQ.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: "BOQ entry not found" });
    }
    
    const original = originalBOQ.rows[0];
    const currentRevision = original.revision_number || 0;
    const newRevision = currentRevision + 1;
    
    // Create a new BOQ entry as a revision
    const result = await db.query(
      `INSERT INTO project_boq (
        project_id,
        element_id,
        item_id,
        main_bar_dia,
        distribution_bar_dia,
        qty_main_bars,
        qty_distribution_bards,
        rmc_grade,
        element_length,
        element_width,
        element_height,
        element_thickness,
        quantity,
        unit,
        calculation_id,
        unit_rate,
        status,
        revision_number,
        remarks,
        created_by,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [
        original.project_id,
        original.element_id,
        original.item_id,
        original.main_bar_dia,
        original.distribution_bar_dia,
        original.qty_main_bars,
        original.qty_distribution_bards,
        original.rmc_grade,
        original.element_length,
        original.element_width,
        original.element_height,
        original.element_thickness,
        quantity || original.quantity,
        original.unit,
        original.calculation_id,
        unit_rate || original.unit_rate,
        'Revised',
        newRevision,
        remarks || `Revision ${newRevision} of BOQ entry ${id}`,
        created_by,
      ]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Rollback transaction in case of error
    await db.query('ROLLBACK');
    
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid reference ID" 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/detailed/{id}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Retrieve detailed information for a BOQ entry including related data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the BOQ entry to retrieve details for
 *     responses:
 *       200:
 *         description: Detailed BOQ entry information
 *       404:
 *         description: BOQ entry not found
 *       500:
 *         description: Internal server error
 */

// Get detailed BOQ entry information
router.get('/detailed/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT b.*, 
              p.project_name, p.project_code,
              e.element_name, e.element_category,
              i.item_name, i.item_description, i.item_unit, i.item_category,
              c.employee_name as creator_name,
              a.employee_name as approver_name
       FROM project_boq b
       LEFT JOIN projects p ON b.project_id = p.project_id
       LEFT JOIN elements e ON b.element_id = e.element_id
       LEFT JOIN items i ON b.item_id = i.item_id
       LEFT JOIN employees c ON b.created_by = c.employee_id
       LEFT JOIN employees a ON b.approved_by = a.employee_id
       WHERE b.boq_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "BOQ entry not found" });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/summary/project/{projectId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Get summary of BOQ entries for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get summary for
 *     responses:
 *       200:
 *         description: Summary of BOQ entries for the project
 *       500:
 *         description: Internal server error
 */

// Get BOQ summary by project
router.get('/summary/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if the project exists
    const projectCheck = await db.query('SELECT project_id, project_name FROM projects WHERE project_id = $1', [projectId]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const projectName = projectCheck.rows[0].project_name;
    
    const result = await db.query(
      `SELECT 
          COUNT(*) as total_entries,
          SUM(b.total_amount) as total_amount,
          COUNT(CASE WHEN b.status = 'Draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN b.status = 'Approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN b.status = 'Revised' THEN 1 END) as revised_count,
          MAX(b.created_at) as last_updated,
          MAX(b.approved_at) as last_approved
       FROM project_boq b
       WHERE b.project_id = $1
       GROUP BY b.project_id`,
      [projectId]
    );
    
    // If no entries found, return empty summary with project name
    if (result.rows.length === 0) {
      return res.json({
        project_name: projectName,
        total_entries: 0,
        total_amount: 0,
        draft_count: 0,
        approved_count: 0,
        revised_count: 0,
        last_updated: null,
        last_approved: null
      });
    }
    
    // Add project name to the result
    const summary = {
      project_name: projectName,
      ...result.rows[0]
    };
    
    res.json(summary);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/summary/items/{projectId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Get summary of BOQ entries by item category for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get item summary for
 *     responses:
 *       200:
 *         description: Summary of BOQ entries by item category
 *       500:
 *         description: Internal server error
 */

// Get summary of BOQ entries by item category for a project
router.get('/summary/items/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
          i.item_category,
          COUNT(*) as item_count,
          SUM(b.quantity) as total_quantity,
          SUM(b.total_amount) as total_amount
       FROM project_boq b
       JOIN items i ON b.item_id = i.item_id
       WHERE b.project_id = $1
       GROUP BY i.item_category
       ORDER BY i.item_category`,
      [projectId]
    );
    
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/element-summary/{projectId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Get summary of BOQ entries by element for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get element summary for
 *     responses:
 *       200:
 *         description: Summary of BOQ entries by element
 *       500:
 *         description: Internal server error
 */

// Get summary of BOQ entries by element for a project
router.get('/element-summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
          e.element_id,
          e.element_name,
          e.element_category,
          COUNT(*) as item_count,
          SUM(b.total_amount) as total_amount
       FROM project_boq b
       JOIN elements e ON b.element_id = e.element_id
       WHERE b.project_id = $1
       GROUP BY e.element_id, e.element_name, e.element_category
       ORDER BY e.element_category, e.element_name`,
      [projectId]
    );
    
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /boq/bulk:
 *   post:
 *     summary: Create multiple BOQ entries at once
 *     tags: [ProjectBOQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - project_id
 *                     - element_id
 *                     - item_id
 *                     - quantity
 *                   properties:
 *                     project_id:
 *                       type: integer
 *                     element_id:
 *                       type: integer
 *                     item_id:
 *                       type: integer
 *                     quantity:
 *                       type: number
 *                     unit_rate:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     created_by:
 *                       type: integer
 *     responses:
 *       201:
 *         description: BOQ entries created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/bulk', async (req, res) => {
  const db = req.db;
  const { entries } = req.body;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "Valid entries array is required" });
  }

  // Validate each entry has required fields
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.project_id || !entry.element_id || !entry.item_id || entry.quantity === undefined) {
      return res.status(400).json({ 
        error: `Entry at index ${i} missing required fields (project_id, element_id, item_id, quantity)` 
      });
    }
  }

  try {
    // Begin a transaction
    await db.query('BEGIN');
    
    const createdEntries = [];
    
    // Insert each entry
    for (const entry of entries) {
      const result = await db.query(
        `INSERT INTO project_boq (
          project_id,
          element_id,
          item_id,
          quantity,
          unit,
          unit_rate,
          created_by,
          status,
          revision_number,
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          entry.project_id,
          entry.element_id,
          entry.item_id,
          entry.quantity,
          entry.unit || null,
          entry.unit_rate || null,
          entry.created_by || null,
          'Draft',
          0
        ]
      );
      
      createdEntries.push(result.rows[0]);
    }
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.status(201).json(createdEntries);
  } catch (err) {
    // Rollback the transaction if any error occurs
    await db.query('ROLLBACK');
    
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid reference ID. Make sure all referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/import/tmt:
 *   post:
 *     summary: Import BOQ entries from TMT calculations
 *     tags: [ProjectBOQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - calculation_ids
 *               - item_id
 *               - created_by
 *             properties:
 *               project_id:
 *                 type: integer
 *               calculation_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               item_id:
 *                 type: integer
 *               unit_rate:
 *                 type: number
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ entries imported successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/import/tmt', async (req, res) => {
  const db = req.db;
  const { project_id, calculation_ids, item_id, unit_rate, created_by } = req.body;

  if (!project_id || !calculation_ids || !Array.isArray(calculation_ids) || calculation_ids.length === 0 || !item_id) {
    return res.status(400).json({ 
      error: "Project ID, item ID, and calculation IDs array are required" 
    });
  }

  try {
    // Begin a transaction
    await db.query('BEGIN');
    
    const createdEntries = [];
    
    // Check if the project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: "Project ID does not exist" });
    }
    
    // Check if the item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: "Item ID does not exist" });
    }
    
    // Process each calculation
    for (const calc_id of calculation_ids) {
      // Get the TMT calculation
      const calcResult = await db.query(
        `SELECT * FROM items_TMT_calculations WHERE calculation_id = $1`,
        [calc_id]
      );
      
      if (calcResult.rows.length === 0) {
        continue; // Skip if calculation not found
      }
      
      const calc = calcResult.rows[0];
      
      // Calculate total weight (sum of main bar and distribution bar weights)
      const totalWeight = 
        (parseFloat(calc.main_bar_total_weight) || 0) + 
        (parseFloat(calc.distribution_bar_total_weight) || 0);
      
      if (totalWeight <= 0) {
        continue; // Skip if no weight
      }
      
      // Insert the BOQ entry
      const result = await db.query(
        `INSERT INTO project_boq (
          project_id,
          element_id,
          item_id,
          main_bar_dia,
          distribution_bar_dia,
          qty_main_bars,
          qty_distribution_bards,
          quantity,
          unit,
          calculation_id,
          unit_rate,
          created_by,
          status,
          revision_number,
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          project_id,
          calc.element_id,
          item_id,
          calc.main_bar_dia,
          calc.distribution_bar_dia,
          calc.qty_main_bars,
          calc.qty_distribution_bars,
          totalWeight,
          'kg',
          calc_id,
          unit_rate || null,
          created_by || null,
          'Draft',
          0
        ]
      );
      
      createdEntries.push(result.rows[0]);
    }
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.status(201).json(createdEntries);
  } catch (err) {
    // Rollback the transaction if any error occurs
    await db.query('ROLLBACK');
    
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid reference ID. Make sure all referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/import/rmc:
 *   post:
 *     summary: Import BOQ entries from RMC calculations
 *     tags: [ProjectBOQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - calculation_ids
 *               - item_id
 *               - created_by
 *             properties:
 *               project_id:
 *                 type: integer
 *               calculation_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               item_id:
 *                 type: integer
 *               unit_rate:
 *                 type: number
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: BOQ entries imported successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/import/rmc', async (req, res) => {
  const db = req.db;
  const { project_id, calculation_ids, item_id, unit_rate, created_by } = req.body;

  if (!project_id || !calculation_ids || !Array.isArray(calculation_ids) || calculation_ids.length === 0 || !item_id) {
    return res.status(400).json({ 
      error: "Project ID, item ID, and calculation IDs array are required" 
    });
  }

  try {
    // Begin a transaction
    await db.query('BEGIN');
    
    const createdEntries = [];
    
    // Check if the project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: "Project ID does not exist" });
    }
    
    // Check if the item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: "Item ID does not exist" });
    }
    
    // Process each calculation
    for (const calc_id of calculation_ids) {
      // Get the RMC calculation
      const calcResult = await db.query(
        `SELECT * FROM items_rmc_calculations WHERE calculation_id = $1`,
        [calc_id]
      );
      
      if (calcResult.rows.length === 0) {
        continue; // Skip if calculation not found
      }
      
      const calc = calcResult.rows[0];
      
      // Use net_volume as the quantity
      if (!calc.net_volume || parseFloat(calc.net_volume) <= 0) {
        continue; // Skip if no volume
      }
      
      // Insert the BOQ entry
      const result = await db.query(
        `INSERT INTO project_boq (
          project_id,
          element_id,
          item_id,
          rmc_grade,
          element_length,
          element_width,
          element_height,
          element_thickness,
          quantity,
          unit,
          calculation_id,
          unit_rate,
          created_by,
          status,
          revision_number,
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          project_id,
          calc.element_id,
          item_id,
          calc.concrete_grade,
          calc.length,
          calc.width,
          calc.height,
          calc.thickness,
          calc.net_volume,
          'm³',
          calc_id,
          unit_rate || null,
          created_by || null,
          'Draft',
          0
        ]
      );
      
      createdEntries.push(result.rows[0]);
    }
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.status(201).json(createdEntries);
  } catch (err) {
    // Rollback the transaction if any error occurs
    await db.query('ROLLBACK');
    
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid reference ID. Make sure all referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /boq/report/{projectId}:
 *   get:
 *     tags: [ProjectBOQ]
 *     description: Generate a comprehensive BOQ report for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to generate the report for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (optional)
 *     responses:
 *       200:
 *         description: BOQ report
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Generate a comprehensive BOQ report for a project
router.get('/report/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { status } = req.query;
  
  try {
    // First check if the project exists
    const projectCheck = await db.query(
      'SELECT project_id, project_name, project_code FROM projects WHERE project_id = $1', 
      [projectId]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = projectCheck.rows[0];
    
    // Build the query
    let query = `
      SELECT 
          b.boq_id,
          e.element_name,
          e.element_category,
          i.item_name,
          i.item_unit,
          i.item_category,
          b.quantity,
          b.unit,
          b.unit_rate,
          b.total_amount,
          b.status,
          b.revision_number,
          b.remarks,
          TO_CHAR(b.created_at, 'YYYY-MM-DD') as created_date,
          TO_CHAR(b.approved_at, 'YYYY-MM-DD') as approved_date,
          c.employee_name as created_by_name,
          a.employee_name as approved_by_name
      FROM project_boq b
      JOIN elements e ON b.element_id = e.element_id
      JOIN items i ON b.item_id = i.item_id
      LEFT JOIN employees c ON b.created_by = c.employee_id
      LEFT JOIN employees a ON b.approved_by = a.employee_id
      WHERE b.project_id = $1
    `;
    
    const queryParams = [projectId];
    
    if (status) {
      query += " AND b.status = $2";
      queryParams.push(status);
    }
    
    query += " ORDER BY e.element_category, e.element_name, i.item_category, i.item_name";
    
    const result = await db.query(query, queryParams);
    
    // Group items by element
    const elementGroups = {};
    let totalAmount = 0;
    
    result.rows.forEach(row => {
      const elementKey = `${row.element_category} - ${row.element_name}`;
      
      if (!elementGroups[elementKey]) {
        elementGroups[elementKey] = {
          element_name: row.element_name,
          element_category: row.element_category,
          items: [],
          element_total: 0
        };
      }
      
      elementGroups[elementKey].items.push({
        boq_id: row.boq_id,
        item_name: row.item_name,
        item_category: row.item_category,
        quantity: row.quantity,
        unit: row.unit,
        unit_rate: row.unit_rate,
        total_amount: row.total_amount,
        status: row.status,
        revision_number: row.revision_number,
        remarks: row.remarks,
        created_date: row.created_date,
        approved_date: row.approved_date,
        created_by: row.created_by_name,
        approved_by: row.approved_by_name
      });
      
      // Add to element total
      if (row.total_amount) {
        elementGroups[elementKey].element_total += parseFloat(row.total_amount);
        totalAmount += parseFloat(row.total_amount);
      }
    });
    
    // Convert to array
    const elements = Object.values(elementGroups);
    
    // Prepare the final report
    const report = {
      project: {
        project_id: project.project_id,
        project_name: project.project_name,
        project_code: project.project_code
      },
      report_date: new Date().toISOString().split('T')[0],
      total_amount: totalAmount,
      item_count: result.rows.length,
      element_count: elements.length,
      status_filter: status || 'All',
      status_counts: {
        draft: result.rows.filter(row => row.status === 'Draft').length,
        approved: result.rows.filter(row => row.status === 'Approved').length,
        revised: result.rows.filter(row => row.status === 'Revised').length
      },
      elements: elements
    };
    
    res.json(report);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;