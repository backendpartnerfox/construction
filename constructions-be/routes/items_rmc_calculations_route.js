const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RMCCalculations
 *   description: API for managing RMC (Ready Mix Concrete) calculations
 */

/**
 * @swagger
 * /rmc_calculations:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve all RMC calculations
 *     responses:
 *       200:
 *         description: List of RMC calculations
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
 *                   concrete_grade:
 *                     type: string
 *                   concrete_mix_ratio:
 *                     type: string
 *                   length:
 *                     type: number
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *                   thickness:
 *                     type: number
 *                   gross_volume:
 *                     type: number
 *                   net_volume:
 *                     type: number
 *                   plasticizer_percentage:
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

// Get all RMC calculations
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    const result = await db.query('SELECT * FROM items_rmc_calculations');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/{id}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve a specific RMC calculation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the RMC calculation to retrieve
 *     responses:
 *       200:
 *         description: RMC calculation details
 *       404:
 *         description: RMC calculation not found
 *       500:
 *         description: Internal server error
 */

// Get RMC calculation by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM items_rmc_calculations WHERE calculation_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'RMC calculation not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rmc_calculations:
 *   post:
 *     summary: Create a new RMC calculation
 *     tags: [RMCCalculations]
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
 *               concrete_grade:
 *                 type: string
 *               concrete_mix_ratio:
 *                 type: string
 *               length:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               thickness:
 *                 type: number
 *               plasticizer_percentage:
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
 *         description: RMC calculation created successfully
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
    concrete_grade,
    concrete_mix_ratio,
    length,
    width,
    height,
    thickness,
    plasticizer_percentage,
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
      `INSERT INTO items_rmc_calculations (
        project_id, 
        element_id, 
        measurement_id, 
        concrete_grade, 
        concrete_mix_ratio, 
        length, 
        width, 
        height, 
        thickness, 
        plasticizer_percentage, 
        calculated_by, 
        verification_date, 
        verified_by, 
        status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        project_id,
        element_id,
        measurement_id,
        concrete_grade || null,
        concrete_mix_ratio || null,
        length || null,
        width || null,
        height || null,
        thickness || null,
        plasticizer_percentage || 0.50,
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
 * /rmc_calculations/{id}:
 *   put:
 *     summary: Update an existing RMC calculation by ID
 *     tags: [RMCCalculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the RMC calculation to update
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
 *               concrete_grade:
 *                 type: string
 *               concrete_mix_ratio:
 *                 type: string
 *               length:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               thickness:
 *                 type: number
 *               plasticizer_percentage:
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
 *         description: RMC calculation updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: RMC calculation not found
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
    concrete_grade,
    concrete_mix_ratio,
    length,
    width,
    height,
    thickness,
    plasticizer_percentage,
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
      `UPDATE items_rmc_calculations 
       SET project_id = $1,
           element_id = $2,
           measurement_id = $3,
           concrete_grade = $4,
           concrete_mix_ratio = $5,
           length = $6,
           width = $7,
           height = $8,
           thickness = $9,
           plasticizer_percentage = $10,
           calculated_by = $11,
           verification_date = $12,
           verified_by = $13,
           status = $14
       WHERE calculation_id = $15
       RETURNING *`,
      [
        project_id,
        element_id,
        measurement_id,
        concrete_grade || null,
        concrete_mix_ratio || null,
        length || null,
        width || null,
        height || null,
        thickness || null,
        plasticizer_percentage || 0.50,
        calculated_by || null,
        verification_date || null,
        verified_by || null,
        status || 'Draft',
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "RMC calculation not found" });
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
 * /rmc_calculations/{id}:
 *   delete:
 *     summary: Delete an RMC calculation by ID
 *     tags: [RMCCalculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the RMC calculation to delete
 *     responses:
 *       200:
 *         description: RMC calculation deleted successfully
 *       404:
 *         description: RMC calculation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM items_rmc_calculations WHERE calculation_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "RMC calculation not found" });
    }
    
    res.json({ message: "RMC calculation deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/project/{projectId}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve all RMC calculations for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to retrieve calculations for
 *     responses:
 *       200:
 *         description: List of RMC calculations for the specified project
 *       500:
 *         description: Internal server error
 */

// Get RMC calculations by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_rmc_calculations WHERE project_id = $1",
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/element/{elementId}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve all RMC calculations for a specific element
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the element to retrieve calculations for
 *     responses:
 *       200:
 *         description: List of RMC calculations for the specified element
 *       500:
 *         description: Internal server error
 */

// Get RMC calculations by element ID
router.get('/element/:elementId', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_rmc_calculations WHERE element_id = $1",
      [elementId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/concrete-grade/{grade}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve all RMC calculations for a specific concrete grade
 *     parameters:
 *       - in: path
 *         name: grade
 *         required: true
 *         schema:
 *           type: string
 *         description: The concrete grade to filter by (e.g. M25, M30)
 *     responses:
 *       200:
 *         description: List of RMC calculations with the specified concrete grade
 *       500:
 *         description: Internal server error
 */

// Get RMC calculations by concrete grade
router.get('/concrete-grade/:grade', async (req, res) => {
  const db = req.db;
  const { grade } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_rmc_calculations WHERE concrete_grade = $1",
      [grade]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/status/{status}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve all RMC calculations with a specific status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter calculations by (Draft, Verified, Pending)
 *     responses:
 *       200:
 *         description: List of RMC calculations with the specified status
 *       500:
 *         description: Internal server error
 */

// Get RMC calculations by status
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items_rmc_calculations WHERE status = $1",
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/verify/{id}:
 *   put:
 *     summary: Verify an RMC calculation
 *     tags: [RMCCalculations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the RMC calculation to verify
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
 *         description: RMC calculation verified successfully
 *       404:
 *         description: RMC calculation not found
 *       500:
 *         description: Internal server error
 */

// Verify an RMC calculation
router.put('/verify/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { verified_by } = req.body;

  if (!verified_by) {
    return res.status(400).json({ error: "Verified by ID is required" });
  }

  try {
    const result = await db.query(
      `UPDATE items_rmc_calculations 
       SET status = 'Verified', 
           verified_by = $1, 
           verification_date = CURRENT_TIMESTAMP
       WHERE calculation_id = $2
       RETURNING *`,
      [verified_by, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "RMC calculation not found" });
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
 * /rmc_calculations/detailed/{id}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Retrieve detailed information for an RMC calculation including related data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the RMC calculation to retrieve details for
 *     responses:
 *       200:
 *         description: Detailed RMC calculation information
 *       404:
 *         description: RMC calculation not found
 *       500:
 *         description: Internal server error
 */

// Get detailed RMC calculation information
router.get('/detailed/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT r.*, 
              p.project_name, p.project_code,
              e.element_name, e.element_category,
              c.employee_name as calculator_name,
              v.employee_name as verifier_name
       FROM items_rmc_calculations r
       LEFT JOIN projects p ON r.project_id = p.project_id
       LEFT JOIN elements e ON r.element_id = e.element_id
       LEFT JOIN employees c ON r.calculated_by = c.employee_id
       LEFT JOIN employees v ON r.verified_by = v.employee_id
       WHERE r.calculation_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "RMC calculation not found" });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/summary/project/{projectId}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Get summary of RMC calculations by project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get summary for
 *     responses:
 *       200:
 *         description: Summary of RMC calculations for the project
 *       500:
 *         description: Internal server error
 */

// Get RMC calculations summary by project
router.get('/summary/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
          p.project_name,
          COUNT(*) as total_calculations,
          SUM(r.gross_volume) as total_gross_volume,
          SUM(r.net_volume) as total_net_volume,
          COUNT(CASE WHEN r.status = 'Draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN r.status = 'Verified' THEN 1 END) as verified_count,
          COUNT(CASE WHEN r.status = 'Pending' THEN 1 END) as pending_count,
          STRING_AGG(DISTINCT r.concrete_grade, ', ') as concrete_grades_used
       FROM items_rmc_calculations r
       JOIN projects p ON r.project_id = p.project_id
       WHERE r.project_id = $1
       GROUP BY p.project_name`,
      [projectId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        project_name: null,
        total_calculations: 0,
        total_gross_volume: 0,
        total_net_volume: 0,
        draft_count: 0,
        verified_count: 0,
        pending_count: 0,
        concrete_grades_used: ""
      });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /rmc_calculations/summary/grades/{projectId}:
 *   get:
 *     tags: [RMCCalculations]
 *     description: Get summary of concrete volumes by grade for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get grades summary for
 *     responses:
 *       200:
 *         description: Summary of concrete volumes by grade
 *       500:
 *         description: Internal server error
 */

// Get summary of concrete volumes by grade for a project
router.get('/summary/grades/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
          concrete_grade,
          COUNT(*) as calculation_count,
          SUM(net_volume) as total_volume
       FROM items_rmc_calculations
       WHERE project_id = $1 AND status = 'Verified'
       GROUP BY concrete_grade
       ORDER BY concrete_grade`,
      [projectId]
    );
    
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;