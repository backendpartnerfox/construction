const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Workflow Status
 *   description: API for tracking project workflow status and transitions
 */

/**
 * @swagger
 * /project_workflow_status:
 *   get:
 *     tags: [Project Workflow Status]
 *     description: Retrieve all workflow statuses with details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: workflow_stage
 *         schema:
 *           type: string
 *           enum: [Enquiry, Lead, Client, Requirements, Design, BOQ, Costing, Phases, Execution, Completed]
 *         description: Filter by workflow stage
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Not Started, In Progress, Completed, On Hold, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: is_current
 *         schema:
 *           type: boolean
 *         description: Filter by current status
 *     responses:
 *       200:
 *         description: List of workflow statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// NOTE: `project_workflow_status` is a materialised view that only exposes
// aggregation columns (project_id/name, total_phases, total_blocks,
// total_selections, completed_selections, total_sequences, total_modules,
// total_work_packages). The original CRUD endpoints below assume a full
// table with updated_by/approved_by/is_current/workflow_stage columns —
// those are wrong for the view and return 500. Simplify the GETs to
// project against the actual view schema.
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id } = req.query;
  try {
    const params = [];
    let where = '';
    if (project_id) { params.push(project_id); where = 'WHERE project_id = $1'; }
    const r = await db.query(`SELECT * FROM project_workflow_status ${where} ORDER BY project_id`, params);
    res.json(r.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status/{id}:
 *   get:
 *     tags: [Project Workflow Status]
 *     description: Retrieve a specific workflow status by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the workflow status to retrieve
 *     responses:
 *       200:
 *         description: Workflow status details
 *       404:
 *         description: Workflow status not found
 *       500:
 *         description: Internal server error
 */
// Fetch aggregation stats for one project. `id` is the project_id (the view
// has no separate workflow_id column).
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM project_workflow_status WHERE project_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      // Not an error — return zeroed aggregation so the UI can render.
      return res.json({
        project_id: Number(id), project_name: null, total_phases: 0,
        total_blocks: 0, total_selections: 0, completed_selections: 0,
        total_sequences: 0, total_modules: 0, total_work_packages: 0,
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status:
 *   post:
 *     summary: Create a new workflow status entry
 *     tags: [Project Workflow Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - workflow_stage
 *               - stage_order
 *               - status
 *             properties:
 *               project_id:
 *                 type: integer
 *               workflow_stage:
 *                 type: string
 *                 enum: [Enquiry, Lead, Client, Requirements, Design, BOQ, Costing, Phases, Execution, Completed]
 *               stage_order:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Not Started, In Progress, Completed, On Hold, Cancelled]
 *               stage_data:
 *                 type: object
 *               completion_percentage:
 *                 type: number
 *               estimated_completion_date:
 *                 type: string
 *                 format: date
 *               actual_completion_date:
 *                 type: string
 *                 format: date
 *               is_current:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Workflow status created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    workflow_stage,
    stage_order,
    status,
    stage_data,
    completion_percentage,
    estimated_completion_date,
    actual_completion_date,
    is_current,
    notes,
    updated_by
  } = req.body;

  if (!project_id || !workflow_stage || stage_order === undefined || !status) {
    return res.status(400).json({ 
      error: "project_id, workflow_stage, stage_order, and status are required" 
    });
  }

  try {
    // If setting as current, update other stages to not current
    if (is_current) {
      await db.query(
        'UPDATE project_workflow_status SET is_current = false WHERE project_id = $1',
        [project_id]
      );
    }

    const result = await db.query(
      `INSERT INTO project_workflow_status (
        project_id, workflow_stage, stage_order, status,
        stage_data, completion_percentage, estimated_completion_date,
        actual_completion_date, is_current, notes, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        project_id, workflow_stage, stage_order, status,
        stage_data, completion_percentage || 0, estimated_completion_date,
        actual_completion_date, is_current || false, notes, updated_by
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
 * /project_workflow_status/{id}:
 *   put:
 *     summary: Update a workflow status
 *     tags: [Project Workflow Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the workflow status to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Not Started, In Progress, Completed, On Hold, Cancelled]
 *               stage_data:
 *                 type: object
 *               completion_percentage:
 *                 type: number
 *               estimated_completion_date:
 *                 type: string
 *                 format: date
 *               actual_completion_date:
 *                 type: string
 *                 format: date
 *               is_current:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               updated_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Workflow status updated successfully
 *       404:
 *         description: Workflow status not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    // If setting as current, get project_id first
    if (updates.is_current) {
      const projectResult = await db.query(
        'SELECT project_id FROM project_workflow_status WHERE workflow_id = $1',
        [id]
      );
      
      if (projectResult.rows.length > 0) {
        await db.query(
          'UPDATE project_workflow_status SET is_current = false WHERE project_id = $1 AND workflow_id != $2',
          [projectResult.rows[0].project_id, id]
        );
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && 
          key !== 'project_id' && 
          key !== 'workflow_stage' && 
          key !== 'stage_order') {
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
      UPDATE project_workflow_status 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Workflow status not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status/{id}:
 *   delete:
 *     summary: Delete a workflow status
 *     tags: [Project Workflow Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the workflow status to delete
 *     responses:
 *       200:
 *         description: Workflow status deleted successfully
 *       404:
 *         description: Workflow status not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_workflow_status WHERE workflow_id = $1 RETURNING workflow_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Workflow status not found" });
    }

    res.json({ message: "Workflow status deleted successfully", deleted_id: result.rows[0].workflow_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status/project/{projectId}:
 *   get:
 *     summary: Get complete workflow status for a project
 *     tags: [Project Workflow Status]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Complete workflow status timeline
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pws.*,
        emp.first_name || ' ' || emp.last_name AS updated_by_name
      FROM project_workflow_status pws
      LEFT JOIN employees emp ON pws.updated_by = emp.employee_id
      WHERE pws.project_id = $1
      ORDER BY pws.stage_order, pws.created_at DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status/{id}/approve:
 *   post:
 *     summary: Approve a workflow stage
 *     tags: [Project Workflow Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the workflow status to approve
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
 *               approval_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workflow stage approved successfully
 *       404:
 *         description: Workflow status not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by, approval_notes } = req.body;

  if (!approved_by) {
    return res.status(400).json({ error: "approved_by is required" });
  }

  try {
    const result = await db.query(
      `UPDATE project_workflow_status 
       SET is_approved = true, 
           approved_by = $1, 
           approved_at = CURRENT_TIMESTAMP,
           approval_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE workflow_id = $3
       RETURNING *`,
      [approved_by, approval_notes, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Workflow status not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status/project/{projectId}/current:
 *   get:
 *     summary: Get current workflow stage for a project
 *     tags: [Project Workflow Status]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Current workflow stage
 *       404:
 *         description: No current workflow stage found
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/current', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pws.*,
        emp.first_name || ' ' || emp.last_name AS updated_by_name,
        emp2.first_name || ' ' || emp2.last_name AS approved_by_name
      FROM project_workflow_status pws
      LEFT JOIN employees emp ON pws.updated_by = emp.employee_id
      LEFT JOIN employees emp2 ON pws.approved_by = emp2.employee_id
      WHERE pws.project_id = $1 AND pws.is_current = true
      LIMIT 1
    `, [projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No current workflow stage found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_workflow_status/project/{projectId}/summary:
 *   get:
 *     summary: Get workflow summary for a project
 *     tags: [Project Workflow Status]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Workflow summary with stage counts and progress
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_stages,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_stages,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_stages,
        COUNT(CASE WHEN status = 'On Hold' THEN 1 END) as on_hold_stages,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_stages,
        AVG(completion_percentage) as average_completion,
        MAX(CASE WHEN is_current = true THEN workflow_stage END) as current_stage,
        MAX(CASE WHEN is_current = true THEN completion_percentage END) as current_completion
      FROM project_workflow_status
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;