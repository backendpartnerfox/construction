const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectGroups
 *   description: API for managing project groups (budget variations and client selections)
 */

/**
 * @swagger
 * /project_groups:
 *   get:
 *     tags: [ProjectGroups]
 *     description: Retrieve all project groups with details
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: group_type
 *         schema:
 *           type: string
 *         description: Filter by group type
 *       - in: query
 *         name: source_type
 *         schema:
 *           type: string
 *         description: Filter by source type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: payment_received
 *         schema:
 *           type: boolean
 *         description: Filter by payment received status
 *     responses:
 *       200:
 *         description: List of project groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, group_type, source_type, status, payment_received } = req.query;
  
  try {
    let query = `
      SELECT 
        pg.*,
        p.project_name,
        p.project_code,
        emp.first_name || ' ' || emp.last_name AS created_by_name
      FROM project_groups pg
      LEFT JOIN projects p ON pg.project_id = p.project_id
      LEFT JOIN employees emp ON pg.created_by = emp.employee_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (project_id) {
      paramCount++;
      query += ` AND pg.project_id = $${paramCount}`;
      params.push(project_id);
    }
    
    if (group_type) {
      paramCount++;
      query += ` AND pg.group_type = $${paramCount}`;
      params.push(group_type);
    }
    
    if (source_type) {
      paramCount++;
      query += ` AND pg.source_type = $${paramCount}`;
      params.push(source_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND pg.status = $${paramCount}`;
      params.push(status);
    }
    
    if (payment_received !== undefined) {
      paramCount++;
      query += ` AND pg.payment_received = $${paramCount}`;
      params.push(payment_received);
    }
    
    query += ' ORDER BY pg.project_id, pg.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/{id}:
 *   get:
 *     tags: [ProjectGroups]
 *     description: Retrieve a specific project group by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group to retrieve
 *     responses:
 *       200:
 *         description: Project group details
 *       404:
 *         description: Project group not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pg.*,
        p.project_name,
        p.project_code,
        emp.first_name || ' ' || emp.last_name AS created_by_name
      FROM project_groups pg
      LEFT JOIN projects p ON pg.project_id = p.project_id
      LEFT JOIN employees emp ON pg.created_by = emp.employee_id
      WHERE pg.group_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project group not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups:
 *   post:
 *     summary: Create a new project group
 *     tags: [ProjectGroups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - group_name
 *               - group_type
 *             properties:
 *               project_id:
 *                 type: integer
 *               group_name:
 *                 type: string
 *               group_type:
 *                 type: string
 *               source_type:
 *                 type: string
 *               client_selection_id:
 *                 type: integer
 *               original_budget:
 *                 type: number
 *               revised_amount:
 *                 type: number
 *               variation_reason:
 *                 type: string
 *               included_items:
 *                 type: array
 *                 items:
 *                   type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Project group created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    group_name,
    group_type,
    source_type,
    client_selection_id,
    original_budget,
    revised_amount,
    variation_reason,
    included_items,
    created_by
  } = req.body;

  if (!project_id || !group_name || !group_type) {
    return res.status(400).json({ error: "project_id, group_name, and group_type are required" });
  }

  try {
    // Calculate variation amount and percentage if both budgets provided
    let variation_amount = null;
    let variation_percentage = null;
    
    if (original_budget && revised_amount) {
      variation_amount = revised_amount - original_budget;
      variation_percentage = (variation_amount / original_budget) * 100;
    }

    const result = await db.query(
      `INSERT INTO project_groups (
        project_id, group_name, group_type, source_type,
        client_selection_id, original_budget, revised_amount,
        variation_amount, variation_percentage, included_items,
        variation_reason, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        project_id, group_name, group_type, source_type,
        client_selection_id, original_budget, revised_amount,
        variation_amount, variation_percentage, included_items,
        variation_reason, 'Pending', created_by
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
 * /project_groups/{id}:
 *   put:
 *     summary: Update a project group
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *               group_type:
 *                 type: string
 *               source_type:
 *                 type: string
 *               client_selection_id:
 *                 type: integer
 *               original_budget:
 *                 type: number
 *               revised_amount:
 *                 type: number
 *               variation_reason:
 *                 type: string
 *               included_items:
 *                 type: array
 *                 items:
 *                   type: string
 *               client_informed_date:
 *                 type: string
 *                 format: date-time
 *               client_response:
 *                 type: string
 *               client_response_date:
 *                 type: string
 *                 format: date-time
 *               additional_payment_required:
 *                 type: number
 *               payment_received:
 *                 type: boolean
 *               payment_date:
 *                 type: string
 *                 format: date
 *               payment_reference:
 *                 type: string
 *               approved_by_client:
 *                 type: boolean
 *               client_approval_date:
 *                 type: string
 *                 format: date
 *               approved_by_pm:
 *                 type: boolean
 *               pm_approval_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project group updated successfully
 *       404:
 *         description: Project group not found
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
      'group_name', 'group_type', 'source_type', 'client_selection_id',
      'original_budget', 'revised_amount', 'variation_reason', 'included_items',
      'client_informed_date', 'client_response', 'client_response_date',
      'additional_payment_required', 'payment_received', 'payment_date',
      'payment_reference', 'approved_by_client', 'client_approval_date',
      'approved_by_pm', 'pm_approval_date', 'status'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    // Recalculate variation if budget values are updated
    if (updates.original_budget !== undefined || updates.revised_amount !== undefined) {
      // Get current values if not provided
      const currentResult = await db.query(
        'SELECT original_budget, revised_amount FROM project_groups WHERE group_id = $1',
        [id]
      );
      
      if (currentResult.rows.length > 0) {
        const original = updates.original_budget || currentResult.rows[0].original_budget;
        const revised = updates.revised_amount || currentResult.rows[0].revised_amount;
        
        if (original && revised) {
          const variation_amount = revised - original;
          const variation_percentage = (variation_amount / original) * 100;
          
          updateFields.push(`variation_amount = $${valueCount}`);
          values.push(variation_amount);
          valueCount++;
          
          updateFields.push(`variation_percentage = $${valueCount}`);
          values.push(variation_percentage);
          valueCount++;
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE project_groups 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE group_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/{id}:
 *   delete:
 *     summary: Delete a project group
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group to delete
 *     responses:
 *       200:
 *         description: Project group deleted successfully
 *       404:
 *         description: Project group not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM project_groups WHERE group_id = $1 RETURNING group_id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project group not found" });
    }

    res.json({ message: "Project group deleted successfully", deleted_id: result.rows[0].group_id });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/project/{projectId}/summary:
 *   get:
 *     summary: Get project groups summary for a project
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project groups summary
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId/summary', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_groups,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_groups,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_groups,
        COUNT(CASE WHEN approved_by_client = true THEN 1 END) as client_approved,
        COUNT(CASE WHEN approved_by_pm = true THEN 1 END) as pm_approved,
        COUNT(CASE WHEN payment_received = true THEN 1 END) as payment_received_count,
        SUM(original_budget) as total_original_budget,
        SUM(revised_amount) as total_revised_amount,
        SUM(variation_amount) as total_variation_amount,
        SUM(additional_payment_required) as total_additional_payment,
        AVG(variation_percentage) as average_variation_percentage
      FROM project_groups
      WHERE project_id = $1
    `, [projectId]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/project/{projectId}:
 *   get:
 *     summary: Get all groups for a specific project
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of project groups
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT pg.*
      FROM project_groups pg
      WHERE pg.project_id = $1
      ORDER BY pg.created_at DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/{id}/approve-client:
 *   post:
 *     summary: Approve a project group by client
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group to approve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project group approved by client successfully
 *       404:
 *         description: Project group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve-client', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { client_response } = req.body;

  try {
    const result = await db.query(
      `UPDATE project_groups 
       SET approved_by_client = true, 
           client_approval_date = CURRENT_DATE,
           client_response = $1,
           client_response_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $2
       RETURNING *`,
      [client_response || 'Approved', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/{id}/approve-pm:
 *   post:
 *     summary: Approve a project group by project manager
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group to approve
 *     responses:
 *       200:
 *         description: Project group approved by PM successfully
 *       404:
 *         description: Project group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve-pm', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE project_groups 
       SET approved_by_pm = true, 
           pm_approval_date = CURRENT_DATE,
           status = 'Approved',
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/{id}/record-payment:
 *   post:
 *     summary: Record payment for a project group
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_reference
 *             properties:
 *               payment_reference:
 *                 type: string
 *               payment_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 *       404:
 *         description: Project group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/record-payment', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { payment_reference, payment_date } = req.body;

  if (!payment_reference) {
    return res.status(400).json({ error: "payment_reference is required" });
  }

  try {
    const result = await db.query(
      `UPDATE project_groups 
       SET payment_received = true, 
           payment_date = $1,
           payment_reference = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $3
       RETURNING *`,
      [payment_date || new Date(), payment_reference, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/pending-approvals:
 *   get:
 *     summary: Get all project groups pending approvals
 *     tags: [ProjectGroups]
 *     responses:
 *       200:
 *         description: List of project groups pending approvals
 *       500:
 *         description: Internal server error
 */
router.get('/pending-approvals', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        pg.*,
        p.project_name,
        p.project_code
      FROM project_groups pg
      LEFT JOIN projects p ON pg.project_id = p.project_id
      WHERE (pg.approved_by_client = false OR pg.approved_by_client IS NULL)
         OR (pg.approved_by_pm = false OR pg.approved_by_pm IS NULL)
      ORDER BY pg.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/with-variations:
 *   get:
 *     summary: Get project groups with budget variations
 *     tags: [ProjectGroups]
 *     responses:
 *       200:
 *         description: List of project groups with variations
 *       500:
 *         description: Internal server error
 */
router.get('/with-variations', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        pg.*,
        p.project_name,
        p.project_code
      FROM project_groups pg
      LEFT JOIN projects p ON pg.project_id = p.project_id
      WHERE pg.variation_amount IS NOT NULL 
        AND pg.variation_amount != 0
      ORDER BY ABS(pg.variation_percentage) DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_groups/{id}/inform-client:
 *   post:
 *     summary: Mark that client has been informed about the variation
 *     tags: [ProjectGroups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project group
 *     responses:
 *       200:
 *         description: Client informed date recorded successfully
 *       404:
 *         description: Project group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/inform-client', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE project_groups 
       SET client_informed_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE group_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Project group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;