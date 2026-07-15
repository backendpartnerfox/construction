const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Work Sequencing
 *   description: API for managing work sequencing and project scheduling
 */

/**
 * @swagger
 * /work_sequencing:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve all work sequences
 *     responses:
 *       200:
 *         description: List of work sequences
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sequence_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   sequence_number:
 *                     type: integer
 *                   sequence_name:
 *                     type: string
 *                   block_id:
 *                     type: integer
 *                   planned_start_date:
 *                     type: string
 *                     format: date
 *                   planned_end_date:
 *                     type: string
 *                     format: date
 *                   duration_days:
 *                     type: integer
 *                   predecessor_sequences:
 *                     type: array
 *                   successor_sequences:
 *                     type: array
 *                   lag_days:
 *                     type: integer
 *                   work_methodology:
 *                     type: string
 *                   key_activities:
 *                     type: array
 *                   quality_checkpoints:
 *                     type: array
 *                   safety_requirements:
 *                     type: array
 *                   manpower_required:
 *                     type: string
 *                   equipment_required:
 *                     type: array
 *                   materials_required:
 *                     type: array
 *                   is_critical_path:
 *                     type: boolean
 *                   float_days:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 *                   approved_by:
 *                     type: integer
 *                   approval_date:
 *                     type: string
 *                     format: date
 */

// Get all work sequences
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM work_sequencing ORDER BY sequence_id');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_sequencing/{id}:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve a specific work sequence by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work sequence to retrieve
 *     responses:
 *       200:
 *         description: Work sequence details
 *       404:
 *         description: Work sequence not found
 *       500:
 *         description: Internal server error
 */

// Get work sequence by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM work_sequencing WHERE sequence_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work sequence not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_sequencing:
 *   post:
 *     summary: Create a new work sequence
 *     tags: [Work Sequencing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - sequence_number
 *               - sequence_name
 *               - block_id
 *             properties:
 *               project_id:
 *                 type: integer
 *               sequence_number:
 *                 type: integer
 *               sequence_name:
 *                 type: string
 *               block_id:
 *                 type: integer
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               duration_days:
 *                 type: integer
 *               predecessor_sequences:
 *                 type: array
 *               successor_sequences:
 *                 type: array
 *               lag_days:
 *                 type: integer
 *               work_methodology:
 *                 type: string
 *               key_activities:
 *                 type: array
 *               quality_checkpoints:
 *                 type: array
 *               safety_requirements:
 *                 type: array
 *               manpower_required:
 *                 type: string
 *               equipment_required:
 *                 type: array
 *               materials_required:
 *                 type: array
 *               is_critical_path:
 *                 type: boolean
 *               float_days:
 *                 type: integer
 *               status:
 *                 type: string
 *               created_by:
 *                 type: integer
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Work sequence created successfully
 *       400:
 *         description: Required fields are missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    sequence_number,
    sequence_name,
    block_id,
    planned_start_date,
    planned_end_date,
    duration_days,
    predecessor_sequences,
    successor_sequences,
    lag_days,
    work_methodology,
    key_activities,
    quality_checkpoints,
    safety_requirements,
    manpower_required,
    equipment_required,
    materials_required,
    is_critical_path,
    float_days,
    status,
    created_by,
    approved_by,
    approval_date
  } = req.body;

  if (!project_id || !sequence_number || !sequence_name || !block_id) {
    return res.status(400).json({ error: "Project ID, sequence number, sequence name, and block ID are required" });
  }

  try {
    const query = `
      INSERT INTO work_sequencing (
        project_id, sequence_number, sequence_name, block_id, planned_start_date,
        planned_end_date, duration_days, predecessor_sequences, successor_sequences,
        lag_days, work_methodology, key_activities, quality_checkpoints,
        safety_requirements, manpower_required, equipment_required, materials_required,
        is_critical_path, float_days, status, created_by, approved_by, approval_date
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *
    `;
    
    const values = [
      project_id,
      sequence_number,
      sequence_name,
      block_id,
      planned_start_date,
      planned_end_date,
      duration_days,
      predecessor_sequences,
      successor_sequences,
      lag_days || 0,
      work_methodology,
      key_activities,
      quality_checkpoints,
      safety_requirements,
      manpower_required,
      equipment_required,
      materials_required,
      is_critical_path || false,
      float_days || 0,
      status || 'Planned',
      created_by,
      approved_by,
      approval_date
    ];

    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_sequencing/{id}:
 *   put:
 *     summary: Update an existing work sequence by ID
 *     tags: [Work Sequencing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work sequence to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - sequence_number
 *               - sequence_name
 *               - block_id
 *             properties:
 *               project_id:
 *                 type: integer
 *               sequence_number:
 *                 type: integer
 *               sequence_name:
 *                 type: string
 *               block_id:
 *                 type: integer
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               duration_days:
 *                 type: integer
 *               predecessor_sequences:
 *                 type: array
 *               successor_sequences:
 *                 type: array
 *               lag_days:
 *                 type: integer
 *               work_methodology:
 *                 type: string
 *               key_activities:
 *                 type: array
 *               quality_checkpoints:
 *                 type: array
 *               safety_requirements:
 *                 type: array
 *               manpower_required:
 *                 type: string
 *               equipment_required:
 *                 type: array
 *               materials_required:
 *                 type: array
 *               is_critical_path:
 *                 type: boolean
 *               float_days:
 *                 type: integer
 *               status:
 *                 type: string
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Work sequence updated successfully
 *       400:
 *         description: Required fields are missing
 *       404:
 *         description: Work sequence not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    sequence_number,
    sequence_name,
    block_id,
    planned_start_date,
    planned_end_date,
    duration_days,
    predecessor_sequences,
    successor_sequences,
    lag_days,
    work_methodology,
    key_activities,
    quality_checkpoints,
    safety_requirements,
    manpower_required,
    equipment_required,
    materials_required,
    is_critical_path,
    float_days,
    status,
    approved_by,
    approval_date
  } = req.body;

  if (!project_id || !sequence_number || !sequence_name || !block_id) {
    return res.status(400).json({ error: "Project ID, sequence number, sequence name, and block ID are required" });
  }

  try {
    const query = `
      UPDATE work_sequencing 
      SET 
        project_id = $1,
        sequence_number = $2,
        sequence_name = $3,
        block_id = $4,
        planned_start_date = $5,
        planned_end_date = $6,
        duration_days = $7,
        predecessor_sequences = $8,
        successor_sequences = $9,
        lag_days = $10,
        work_methodology = $11,
        key_activities = $12,
        quality_checkpoints = $13,
        safety_requirements = $14,
        manpower_required = $15,
        equipment_required = $16,
        materials_required = $17,
        is_critical_path = $18,
        float_days = $19,
        status = $20,
        approved_by = $21,
        approval_date = $22
      WHERE sequence_id = $23
      RETURNING *
    `;
    
    const values = [
      project_id,
      sequence_number,
      sequence_name,
      block_id,
      planned_start_date,
      planned_end_date,
      duration_days,
      predecessor_sequences,
      successor_sequences,
      lag_days,
      work_methodology,
      key_activities,
      quality_checkpoints,
      safety_requirements,
      manpower_required,
      equipment_required,
      materials_required,
      is_critical_path,
      float_days,
      status,
      approved_by,
      approval_date,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Work sequence not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_sequencing/{id}:
 *   delete:
 *     summary: Delete a work sequence by ID
 *     tags: [Work Sequencing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work sequence to delete
 *     responses:
 *       200:
 *         description: Work sequence deleted successfully
 *       404:
 *         description: Work sequence not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM work_sequencing WHERE sequence_id = $1 RETURNING sequence_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Work sequence not found" });
    }
    
    res.json({ message: "Work sequence deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_sequencing/by-project/{projectId}:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve work sequences by project ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID to retrieve work sequences for
 *     responses:
 *       200:
 *         description: List of work sequences for the specified project
 *       500:
 *         description: Internal server error
 */
router.get('/by-project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_sequencing WHERE project_id = $1 ORDER BY sequence_number", 
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_sequencing/by-block/{blockId}:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve work sequences by block ID
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The block ID to retrieve work sequences for
 *     responses:
 *       200:
 *         description: List of work sequences for the specified block
 *       500:
 *         description: Internal server error
 */
router.get('/by-block/:blockId', async (req, res) => {
  const db = req.db;
  const { blockId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_sequencing WHERE block_id = $1 ORDER BY sequence_number", 
      [blockId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_sequencing/critical-path/{projectId}:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve critical path sequences for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID to retrieve critical path for
 *     responses:
 *       200:
 *         description: List of critical path sequences for the specified project
 *       500:
 *         description: Internal server error
 */
router.get('/critical-path/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_sequencing WHERE project_id = $1 AND is_critical_path = true ORDER BY sequence_number", 
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_sequencing/by-status/{status}:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve work sequences by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter work sequences by
 *     responses:
 *       200:
 *         description: List of work sequences with the specified status
 *       500:
 *         description: Internal server error
 */
router.get('/by-status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_sequencing WHERE status = $1 ORDER BY planned_start_date", 
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_sequencing/upcoming/{projectId}:
 *   get:
 *     tags: [Work Sequencing]
 *     description: Retrieve upcoming work sequences for a project (planned start date within next 30 days)
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID to retrieve upcoming sequences for
 *     responses:
 *       200:
 *         description: List of upcoming work sequences
 *       500:
 *         description: Internal server error
 */
router.get('/upcoming/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT * FROM work_sequencing 
       WHERE project_id = $1 
       AND planned_start_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
       ORDER BY planned_start_date`, 
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;