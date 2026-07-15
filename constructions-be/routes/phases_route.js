const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Phases
 *   description: API for managing project phases
 */

/**
 * @swagger
 * /phases:
 *   get:
 *     tags: [Phases]
 *     description: Retrieve all phases from the phases table
 *     responses:
 *       200:
 *         description: List of phases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   phase_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   phase_code:
 *                     type: string
 *                   phase_name:
 *                     type: string
 *                   phase_description:
 *                     type: string
 *                   phase_type:
 *                     type: string
 *                   phase_sequence:
 *                     type: integer
 *                   is_critical_path:
 *                     type: boolean
 *                   total_units_count:
 *                     type: integer
 *                   completed_units_count:
 *                     type: integer
 *                   completion_percentage:
 *                     type: number
 *                   planned_start_date:
 *                     type: string
 *                     format: date
 *                   planned_end_date:
 *                     type: string
 *                     format: date
 *                   planned_duration_days:
 *                     type: integer
 *                   actual_start_date:
 *                     type: string
 *                     format: date
 *                   actual_end_date:
 *                     type: string
 *                     format: date
 *                   actual_duration_days:
 *                     type: integer
 *                   total_budgeted_cost:
 *                     type: number
 *                   total_actual_cost:
 *                     type: number
 *                   cost_variance:
 *                     type: number
 *                   required_labor_hours:
 *                     type: number
 *                   required_equipment_days:
 *                     type: number
 *                   required_materials_cost:
 *                     type: number
 *                   status:
 *                     type: string
 *                   phase_milestone:
 *                     type: string
 *                   environmental_considerations:
 *                     type: string
 *                   approved_by:
 *                     type: integer
 *                   approval_date:
 *                     type: string
 *                     format: date
 *                   approval_status:
 *                     type: string
 *                   notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                   updated_by:
 *                     type: integer
 */

// Get all phases
router.get('/phases', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM phases');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phases/{id}:
 *   get:
 *     tags: [Phases]
 *     description: Retrieve a specific phase by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase to retrieve
 *     responses:
 *       200:
 *         description: Phase details
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Internal server error
 */

// Get phase by ID
router.get('/phases/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM phases WHERE phase_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phases:
 *   post:
 *     summary: Create a new phase
 *     tags: [Phases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - phase_code
 *               - phase_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               phase_code:
 *                 type: string
 *               phase_name:
 *                 type: string
 *               phase_description:
 *                 type: string
 *               phase_type:
 *                 type: string
 *               phase_sequence:
 *                 type: integer
 *               is_critical_path:
 *                 type: boolean
 *               total_units_count:
 *                 type: integer
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               planned_duration_days:
 *                 type: integer
 *               total_budgeted_cost:
 *                 type: number
 *               required_labor_hours:
 *                 type: number
 *               required_equipment_days:
 *                 type: number
 *               required_materials_cost:
 *                 type: number
 *               status:
 *                 type: string
 *               phase_milestone:
 *                 type: string
 *               environmental_considerations:
 *                 type: string
 *               approval_status:
 *                 type: string
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Phase created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/phases', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    phase_code,
    phase_name,
    phase_description,
    phase_type,
    phase_sequence,
    is_critical_path,
    total_units_count,
    planned_start_date,
    planned_end_date,
    planned_duration_days,
    total_budgeted_cost,
    required_labor_hours,
    required_equipment_days,
    required_materials_cost,
    status,
    phase_milestone,
    environmental_considerations,
    approval_status,
    notes,
    created_by
  } = req.body;

  if (!project_id || !phase_code || !phase_name) {
    return res.status(400).json({ error: "Project ID, phase code, and phase name are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO phases (
        project_id, phase_code, phase_name, phase_description, phase_type, phase_sequence,
        is_critical_path, total_units_count, planned_start_date, planned_end_date,
        planned_duration_days, total_budgeted_cost, required_labor_hours, required_equipment_days,
        required_materials_cost, status, phase_milestone, environmental_considerations,
        approval_status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) 
       RETURNING phase_id`,
      [
        project_id,
        phase_code,
        phase_name,
        phase_description || null,
        phase_type || null,
        phase_sequence || null,
        is_critical_path || false,
        total_units_count || null,
        planned_start_date || null,
        planned_end_date || null,
        planned_duration_days || null,
        total_budgeted_cost || null,
        required_labor_hours || null,
        required_equipment_days || null,
        required_materials_cost || null,
        status || 'Planned',
        phase_milestone || null,
        environmental_considerations || null,
        approval_status || 'Pending',
        notes || null,
        created_by || null
      ]
    );

    res.status(201).json({ 
      phase_id: result.rows[0].phase_id,
      project_id,
      phase_code,
      phase_name,
      phase_description,
      phase_type,
      phase_sequence,
      is_critical_path: is_critical_path || false,
      total_units_count,
      planned_start_date,
      planned_end_date,
      planned_duration_days,
      total_budgeted_cost,
      required_labor_hours,
      required_equipment_days,
      required_materials_cost,
      status: status || 'Planned',
      phase_milestone,
      environmental_considerations,
      approval_status: approval_status || 'Pending',
      notes,
      created_by
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phases/{id}:
 *   put:
 *     summary: Update an existing phase by ID
 *     tags: [Phases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               phase_code:
 *                 type: string
 *               phase_name:
 *                 type: string
 *               phase_description:
 *                 type: string
 *               phase_type:
 *                 type: string
 *               phase_sequence:
 *                 type: integer
 *               is_critical_path:
 *                 type: boolean
 *               total_units_count:
 *                 type: integer
 *               completed_units_count:
 *                 type: integer
 *               completion_percentage:
 *                 type: number
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *               planned_duration_days:
 *                 type: integer
 *               actual_start_date:
 *                 type: string
 *                 format: date
 *               actual_end_date:
 *                 type: string
 *                 format: date
 *               actual_duration_days:
 *                 type: integer
 *               total_budgeted_cost:
 *                 type: number
 *               total_actual_cost:
 *                 type: number
 *               cost_variance:
 *                 type: number
 *               required_labor_hours:
 *                 type: number
 *               required_equipment_days:
 *                 type: number
 *               required_materials_cost:
 *                 type: number
 *               status:
 *                 type: string
 *               phase_milestone:
 *                 type: string
 *               environmental_considerations:
 *                 type: string
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *               approval_status:
 *                 type: string
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Phase updated successfully
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Internal server error
 */
router.put('/phases/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    phase_code,
    phase_name,
    phase_description,
    phase_type,
    phase_sequence,
    is_critical_path,
    total_units_count,
    completed_units_count,
    completion_percentage,
    planned_start_date,
    planned_end_date,
    planned_duration_days,
    actual_start_date,
    actual_end_date,
    actual_duration_days,
    total_budgeted_cost,
    total_actual_cost,
    cost_variance,
    required_labor_hours,
    required_equipment_days,
    required_materials_cost,
    status,
    phase_milestone,
    environmental_considerations,
    approved_by,
    approval_date,
    approval_status,
    notes,
    updated_by
  } = req.body;

  if (!phase_name) {
    return res.status(400).json({ error: "Phase name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE phases 
       SET project_id = $1, phase_code = $2, phase_name = $3, phase_description = $4,
           phase_type = $5, phase_sequence = $6, is_critical_path = $7, total_units_count = $8,
           completed_units_count = $9, completion_percentage = $10, planned_start_date = $11,
           planned_end_date = $12, planned_duration_days = $13, actual_start_date = $14,
           actual_end_date = $15, actual_duration_days = $16, total_budgeted_cost = $17,
           total_actual_cost = $18, cost_variance = $19, required_labor_hours = $20,
           required_equipment_days = $21, required_materials_cost = $22, status = $23,
           phase_milestone = $24, environmental_considerations = $25, approved_by = $26,
           approval_date = $27, approval_status = $28, notes = $29, updated_by = $30,
           updated_at = CURRENT_TIMESTAMP
       WHERE phase_id = $31`,
      [
        project_id,
        phase_code,
        phase_name,
        phase_description || null,
        phase_type || null,
        phase_sequence || null,
        is_critical_path || null,
        total_units_count || null,
        completed_units_count || null,
        completion_percentage || null,
        planned_start_date || null,
        planned_end_date || null,
        planned_duration_days || null,
        actual_start_date || null,
        actual_end_date || null,
        actual_duration_days || null,
        total_budgeted_cost || null,
        total_actual_cost || null,
        cost_variance || null,
        required_labor_hours || null,
        required_equipment_days || null,
        required_materials_cost || null,
        status || null,
        phase_milestone || null,
        environmental_considerations || null,
        approved_by || null,
        approval_date || null,
        approval_status || null,
        notes || null,
        updated_by || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Phase not found" });
    }

    res.json({ 
      phase_id: Number(id),
      project_id,
      phase_code,
      phase_name,
      phase_description,
      phase_type,
      phase_sequence,
      is_critical_path,
      total_units_count,
      completed_units_count,
      completion_percentage,
      planned_start_date,
      planned_end_date,
      planned_duration_days,
      actual_start_date,
      actual_end_date,
      actual_duration_days,
      total_budgeted_cost,
      total_actual_cost,
      cost_variance,
      required_labor_hours,
      required_equipment_days,
      required_materials_cost,
      status,
      phase_milestone,
      environmental_considerations,
      approved_by,
      approval_date,
      approval_status,
      notes,
      updated_by
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phases/{id}:
 *   delete:
 *     summary: Delete a phase by ID
 *     tags: [Phases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the phase to delete
 *     responses:
 *       200:
 *         description: Phase deleted successfully
 *       404:
 *         description: Phase not found
 *       500:
 *         description: Internal server error
 */
router.delete('/phases/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM phases WHERE phase_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Phase not found" });
    }
    
    res.json({ message: "Phase deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /phases/project/{projectId}:
 *   get:
 *     tags: [Phases]
 *     description: Retrieve phases by project ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID to filter phases
 *     responses:
 *       200:
 *         description: List of phases for the specified project
 *       500:
 *         description: Internal server error
 */

// Get phases by project ID
router.get('/phases/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM phases WHERE project_id = $1 ORDER BY phase_sequence",
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phases/status/{status}:
 *   get:
 *     tags: [Phases]
 *     description: Retrieve phases by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter phases
 *     responses:
 *       200:
 *         description: List of phases with the specified status
 *       500:
 *         description: Internal server error
 */

// Get phases by status
router.get('/phases/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM phases WHERE status = $1",
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /phases/critical:
 *   get:
 *     tags: [Phases]
 *     description: Retrieve all critical path phases
 *     responses:
 *       200:
 *         description: List of critical path phases
 *       500:
 *         description: Internal server error
 */

// Get critical path phases
router.get('/phases/critical', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM phases WHERE is_critical_path = true"
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;