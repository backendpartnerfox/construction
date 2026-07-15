const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TMTCalculations
 *   description: API for managing TMT steel bar calculations
 */

/**
 * @swagger
 * /tmt_calculations:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Retrieve all TMT calculations
 *     responses:
 *       200:
 *         description: List of TMT calculations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   calculation_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   element_id:
 *                     type: integer
 *                   measurement_id:
 *                     type: integer
 *                   main_bar_dia:
 *                     type: number
 *                   distribution_bar_dia:
 *                     type: number
 *                   qty_main_bars:
 *                     type: integer
 *                   qty_distribution_bars:
 *                     type: integer
 *                   main_bar_length:
 *                     type: number
 *                   distribution_bar_length:
 *                     type: number
 *                   main_bar_weight_per_meter:
 *                     type: number
 *                   distribution_bar_weight_per_meter:
 *                     type: number
 *                   main_bar_total_weight:
 *                     type: number
 *                   distribution_bar_total_weight:
 *                     type: number
 *                   bending_factor:
 *                     type: number
 *                   cutting_factor:
 *                     type: number
 *                   calculated_by:
 *                     type: integer
 *                   calculation_date:
 *                     type: string
 *                     format: date-time
 *                   verified_by:
 *                     type: integer
 *                   verification_date:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *       500:
 *         description: Internal server error
 */

// Get all TMT calculations
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    const result = await db.query('SELECT * FROM items_TMT_calculations');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /tmt_calculations/{id}:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Retrieve a specific TMT calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT calculation to retrieve
 *     responses:
 *       200:
 *         description: TMT calculation details
 *       404:
 *         description: TMT calculation not found
 *       500:
 *         description: Internal server error
 */

// Get TMT calculation by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM items_TMT_calculations WHERE calculation_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'TMT calculation not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tmt_calculations:
 *   post:
 *     summary: Create a new TMT calculation
 *     tags: [TMTCalculations]
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
 *             properties:
 *               project_id:
 *                 type: integer
 *               element_id:
 *                 type: integer
 *               measurement_id:
 *                 type: integer
 *               main_bar_dia:
 *                 type: number
 *               distribution_bar_dia:
 *                 type: number
 *               qty_main_bars:
 *                 type: integer
 *               qty_distribution_bars:
 *                 type: integer
 *               main_bar_length:
 *                 type: number
 *               distribution_bar_length:
 *                 type: number
 *               main_bar_weight_per_meter:
 *                 type: number
 *               distribution_bar_weight_per_meter:
 *                 type: number
 *               bending_factor:
 *                 type: number
 *               cutting_factor:
 *                 type: number
 *               calculated_by:
 *                 type: integer
 *               verified_by:
 *                 type: integer
 *               verification_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: TMT calculation created successfully
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
    measurement_id,
    main_bar_dia,
    distribution_bar_dia,
    qty_main_bars,
    qty_distribution_bars,
    main_bar_length,
    distribution_bar_length,
    main_bar_weight_per_meter,
    distribution_bar_weight_per_meter,
    bending_factor,
    cutting_factor,
    calculated_by,
    verification_date,
    verified_by,
    status
  } = req.body;

  // Validate required fields
  if (!project_id || !element_id || !measurement_id) {
    return res.status(400).json({ error: "Project ID, element ID and measurement ID are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO items_TMT_calculations (
        project_id, 
        element_id, 
        measurement_id, 
        main_bar_dia, 
        distribution_bar_dia, 
        qty_main_bars, 
        qty_distribution_bars, 
        main_bar_length, 
        distribution_bar_length, 
        main_bar_weight_per_meter, 
        distribution_bar_weight_per_meter, 
        bending_factor, 
        cutting_factor, 
        calculated_by, 
        verification_date, 
        verified_by, 
        status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *`,
      [
        project_id,
        element_id,
        measurement_id,
        main_bar_dia || null,
        distribution_bar_dia || null,
        qty_main_bars || null,
        qty_distribution_bars || null,
        main_bar_length || null,
        distribution_bar_length || null,
        main_bar_weight_per_meter || null,
        distribution_bar_weight_per_meter || null,
        bending_factor || 1.10,
        cutting_factor || 1.05,
        calculated_by || null,
        verification_date || null,
        verified_by || null,
        status || 'Draft'
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
 * /tmt_calculations/{id}:
 *   put:
 *     summary: Update an existing TMT calculation by ID
 *     tags: [TMTCalculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT calculation to update
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
 *               measurement_id:
 *                 type: integer
 *               main_bar_dia:
 *                 type: number
 *               distribution_bar_dia:
 *                 type: number
 *               qty_main_bars:
 *                 type: integer
 *               qty_distribution_bars:
 *                 type: integer
 *               main_bar_length:
 *                 type: number
 *               distribution_bar_length:
 *                 type: number
 *               main_bar_weight_per_meter:
 *                 type: number
 *               distribution_bar_weight_per_meter:
 *                 type: number
 *               bending_factor:
 *                 type: number
 *               cutting_factor:
 *                 type: number
 *               calculated_by:
 *                 type: integer
 *               verified_by:
 *                 type: integer
 *               verification_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: TMT calculation updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: TMT calculation not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    element_id,
    measurement_id,
    main_bar_dia,
    distribution_bar_dia,
    qty_main_bars,
    qty_distribution_bars,
    main_bar_length,
    distribution_bar_length,
    main_bar_weight_per_meter,
    distribution_bar_weight_per_meter,
    bending_factor,
    cutting_factor,
    calculated_by,
    verification_date,
    verified_by,
    status
  } = req.body;

  // Validate required fields
  if (!project_id || !element_id || !measurement_id) {
    return res.status(400).json({ error: "Project ID, element ID and measurement ID are required" });
  }

  try {
    const result = await db.query(
      `UPDATE items_TMT_calculations 
       SET project_id = $1,
           element_id = $2,
           measurement_id = $3,
           main_bar_dia = $4,
           distribution_bar_dia = $5,
           qty_main_bars = $6,
           qty_distribution_bars = $7,
           main_bar_length = $8,
           distribution_bar_length = $9,
           main_bar_weight_per_meter = $10,
           distribution_bar_weight_per_meter = $11,
           bending_factor = $12,
           cutting_factor = $13,
           calculated_by = $14,
           verification_date = $15,
           verified_by = $16,
           status = $17
       WHERE calculation_id = $18
       RETURNING *`,
      [
        project_id,
        element_id,
        measurement_id,
        main_bar_dia || null,
        distribution_bar_dia || null,
        qty_main_bars || null,
        qty_distribution_bars || null,
        main_bar_length || null,
        distribution_bar_length || null,
        main_bar_weight_per_meter || null,
        distribution_bar_weight_per_meter || null,
        bending_factor || 1.10,
        cutting_factor || 1.05,
        calculated_by || null,
        verification_date || null,
        verified_by || null,
        status || 'Draft',
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "TMT calculation not found" });
    }

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
 * /tmt_calculations/{id}:
 *   delete:
 *     summary: Delete a TMT calculation by ID
 *     tags: [TMTCalculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT calculation to delete
 *     responses:
 *       200:
 *         description: TMT calculation deleted successfully
 *       404:
 *         description: TMT calculation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM items_TMT_calculations WHERE calculation_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "TMT calculation not found" });
    }
    
    res.json({ message: "TMT calculation deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tmt_calculations/project/{projectId}:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Retrieve all TMT calculations for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to retrieve calculations for
 *     responses:
 *       200:
 *         description: List of TMT calculations for the specified project
 *       500:
 *         description: Internal server error
 */

// Get TMT calculations by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_TMT_calculations WHERE project_id = $1",
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /tmt_calculations/element/{elementId}:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Retrieve all TMT calculations for a specific element
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the element to retrieve calculations for
 *     responses:
 *       200:
 *         description: List of TMT calculations for the specified element
 *       500:
 *         description: Internal server error
 */

// Get TMT calculations by element ID
router.get('/element/:elementId', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_TMT_calculations WHERE element_id = $1",
      [elementId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /tmt_calculations/status/{status}:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Retrieve all TMT calculations with a specific status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter calculations by (Draft, Verified, Pending)
 *     responses:
 *       200:
 *         description: List of TMT calculations with the specified status
 *       500:
 *         description: Internal server error
 */

// Get TMT calculations by status
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_TMT_calculations WHERE status = $1",
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /tmt_calculations/verify/{id}:
 *   put:
 *     summary: Verify a TMT calculation
 *     tags: [TMTCalculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT calculation to verify
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
 *         description: TMT calculation verified successfully
 *       404:
 *         description: TMT calculation not found
 *       500:
 *         description: Internal server error
 */

// Verify a TMT calculation
router.put('/verify/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;

  if (!verified_by) {
    return res.status(400).json({ error: "Verified by ID is required" });
  }

  try {
    const result = await db.query(
      `UPDATE items_TMT_calculations 
       SET status = 'Verified', 
           verified_by = $1, 
           verification_date = CURRENT_TIMESTAMP
       WHERE calculation_id = $2
       RETURNING *`,
      [verified_by, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "TMT calculation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid employee ID for verification" 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tmt_calculations/detailed/{id}:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Retrieve detailed information for a TMT calculation including related data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT calculation to retrieve details for
 *     responses:
 *       200:
 *         description: Detailed TMT calculation information
 *       404:
 *         description: TMT calculation not found
 *       500:
 *         description: Internal server error
 */

// Get detailed TMT calculation information
router.get('/detailed/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT t.*, 
              p.project_name, p.project_code,
              e.element_name, e.element_category,
              c.employee_name as calculator_name,
              v.employee_name as verifier_name
       FROM items_TMT_calculations t
       LEFT JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN elements e ON t.element_id = e.element_id
       LEFT JOIN employees c ON t.calculated_by = c.employee_id
       LEFT JOIN employees v ON t.verified_by = v.employee_id
       WHERE t.calculation_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "TMT calculation not found" });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});


/**
 * @swagger
 * /tmt_calculations/summary/project/{projectId}:
 *   get:
 *     tags: [TMTCalculations]
 *     description: Get summary of TMT calculations by project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get summary for
 *     responses:
 *       200:
 *         description: Summary of TMT calculations for the project
 *       500:
 *         description: Internal server error
 */

// Get TMT calculations summary by project
router.get('/summary/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
          p.project_name,
          COUNT(*) as total_calculations,
          SUM(t.main_bar_total_weight) as total_main_bar_weight,
          SUM(t.distribution_bar_total_weight) as total_distribution_bar_weight,
          SUM(t.main_bar_total_weight + t.distribution_bar_total_weight) as total_steel_weight,
          COUNT(CASE WHEN t.status = 'Draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN t.status = 'Verified' THEN 1 END) as verified_count,
          COUNT(CASE WHEN t.status = 'Pending' THEN 1 END) as pending_count
       FROM items_TMT_calculations t
       JOIN projects p ON t.project_id = p.project_id
       WHERE t.project_id = $1
       GROUP BY p.project_name`,
      [projectId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        project_name: null,
        total_calculations: 0,
        total_main_bar_weight: 0,
        total_distribution_bar_weight: 0,
        total_steel_weight: 0,
        draft_count: 0,
        verified_count: 0,
        pending_count: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;