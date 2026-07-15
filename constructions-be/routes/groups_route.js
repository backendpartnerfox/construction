const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: API for managing selection groups
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     tags: [Groups]
 *     description: Retrieve all groups
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   group_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   group_code:
 *                     type: string
 *                   group_name:
 *                     type: string
 *                   group_type:
 *                     type: string
 *                   selection_ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   original_cost:
 *                     type: number
 *                   revised_cost:
 *                     type: number
 *                   cost_difference:
 *                     type: number
 *                   requires_additional_payment:
 *                     type: boolean
 *                   payment_received:
 *                     type: boolean
 *                   payment_amount:
 *                     type: number
 *                   payment_date:
 *                     type: string
 *                     format: date
 *                   client_notified:
 *                     type: boolean
 *                   notification_date:
 *                     type: string
 *                     format: date
 *                   client_approved:
 *                     type: boolean
 *                   approval_date:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        g.*,
        p.project_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        CASE 
          WHEN g.selection_ids IS NOT NULL THEN 
            array_length(g.selection_ids, 1)
          ELSE 0 
        END as selection_count
      FROM groups g
      LEFT JOIN projects p ON g.project_id = p.project_id
      LEFT JOIN employees e ON g.created_by = e.employee_id
      ORDER BY g.project_id, g.group_name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     tags: [Groups]
 *     description: Retrieve a specific group by ID with selection details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the group to retrieve
 *     responses:
 *       200:
 *         description: Group details with selections
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        g.*,
        p.project_name,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM groups g
      LEFT JOIN projects p ON g.project_id = p.project_id
      LEFT JOIN employees e ON g.created_by = e.employee_id
      WHERE g.group_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get selection details if there are selection_ids
    if (result.rows[0].selection_ids && result.rows[0].selection_ids.length > 0) {
      const selectionsResult = await db.query(`
        SELECT s.*, i.item_name, ic.choice_name as current_choice_name
        FROM selections s
        LEFT JOIN items i ON s.item_id = i.item_id
        LEFT JOIN item_choices ic ON s.current_choice_id = ic.choice_id
        WHERE s.selection_id = ANY($1)
      `, [result.rows[0].selection_ids]);
      
      result.rows[0].selections_details = selectionsResult.rows;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /groups/project/{projectId}:
 *   get:
 *     tags: [Groups]
 *     description: Retrieve all groups for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of groups for the project
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
      SELECT g.*,
        CASE 
          WHEN g.selection_ids IS NOT NULL THEN 
            array_length(g.selection_ids, 1)
          ELSE 0 
        END as selection_count
      FROM groups g
      WHERE g.project_id = $1 
      ORDER BY g.group_name
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - group_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               group_code:
 *                 type: string
 *               group_name:
 *                 type: string
 *               group_type:
 *                 type: string
 *               selection_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               original_cost:
 *                 type: number
 *               revised_cost:
 *                 type: number
 *               cost_difference:
 *                 type: number
 *               requires_additional_payment:
 *                 type: boolean
 *               payment_received:
 *                 type: boolean
 *               payment_amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               client_notified:
 *                 type: boolean
 *               notification_date:
 *                 type: string
 *                 format: date
 *               client_approved:
 *                 type: boolean
 *               approval_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Group created successfully
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
    project_id, group_code, group_name, group_type, selection_ids,
    original_cost, revised_cost, cost_difference, requires_additional_payment,
    payment_received, payment_amount, payment_date, client_notified,
    notification_date, client_approved, approval_date, status, created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !group_name) {
    return res.status(400).json({ 
      error: "Required fields: project_id, group_name" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify selections exist if provided
    if (selection_ids && selection_ids.length > 0) {
      const selectionsCheck = await db.query(
        'SELECT selection_id FROM selections WHERE selection_id = ANY($1)',
        [selection_ids]
      );
      
      if (selectionsCheck.rows.length !== selection_ids.length) {
        return res.status(404).json({ error: 'One or more selections not found' });
      }
    }

    // Calculate cost_difference if not provided
    let calculatedCostDifference = cost_difference;
    if (original_cost !== undefined && revised_cost !== undefined && cost_difference === undefined) {
      calculatedCostDifference = revised_cost - original_cost;
    }

    const result = await db.query(
      `INSERT INTO groups (
        project_id, group_code, group_name, group_type, selection_ids,
        original_cost, revised_cost, cost_difference, requires_additional_payment,
        payment_received, payment_amount, payment_date, client_notified,
        notification_date, client_approved, approval_date, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        project_id, group_code, group_name, group_type, selection_ids,
        original_cost, revised_cost, calculatedCostDifference, 
        requires_additional_payment || false, payment_received || false, 
        payment_amount, payment_date, client_notified || false,
        notification_date, client_approved || false, approval_date, 
        status || 'Pending', created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update an existing group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_code:
 *                 type: string
 *               group_name:
 *                 type: string
 *               group_type:
 *                 type: string
 *               selection_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               original_cost:
 *                 type: number
 *               revised_cost:
 *                 type: number
 *               cost_difference:
 *                 type: number
 *               requires_additional_payment:
 *                 type: boolean
 *               payment_received:
 *                 type: boolean
 *               payment_amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               client_notified:
 *                 type: boolean
 *               notification_date:
 *                 type: string
 *                 format: date
 *               client_approved:
 *                 type: boolean
 *               approval_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.group_id;
  delete updates.project_id;
  delete updates.created_at;
  delete updates.created_by;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Verify selections exist if provided
    if (updates.selection_ids && updates.selection_ids.length > 0) {
      const selectionsCheck = await db.query(
        'SELECT selection_id FROM selections WHERE selection_id = ANY($1)',
        [updates.selection_ids]
      );
      
      if (selectionsCheck.rows.length !== updates.selection_ids.length) {
        return res.status(404).json({ error: 'One or more selections not found' });
      }
    }

    // Recalculate cost_difference if costs are updated
    if ((updates.original_cost !== undefined || updates.revised_cost !== undefined) && 
        updates.cost_difference === undefined) {
      const currentGroup = await db.query('SELECT original_cost, revised_cost FROM groups WHERE group_id = $1', [id]);
      if (currentGroup.rows.length > 0) {
        const original = updates.original_cost !== undefined ? updates.original_cost : currentGroup.rows[0].original_cost;
        const revised = updates.revised_cost !== undefined ? updates.revised_cost : currentGroup.rows[0].revised_cost;
        if (original !== null && revised !== null) {
          updates.cost_difference = revised - original;
        }
      }
    }

    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE groups 
       SET ${setClause}
       WHERE group_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the group to delete
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM groups WHERE group_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /groups/payment-status/{projectId}:
 *   get:
 *     tags: [Groups]
 *     description: Get groups by payment status
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *       - in: query
 *         name: requires_payment
 *         schema:
 *           type: boolean
 *         description: Filter by requires additional payment
 *       - in: query
 *         name: payment_received
 *         schema:
 *           type: boolean
 *         description: Filter by payment received status
 *     responses:
 *       200:
 *         description: List of groups matching payment criteria
 *       500:
 *         description: Internal server error
 */
router.get('/payment-status/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { requires_payment, payment_received } = req.query;
  
  let conditions = ['project_id = $1'];
  let params = [projectId];
  
  if (requires_payment !== undefined) {
    conditions.push(`requires_additional_payment = $${params.length + 1}`);
    params.push(requires_payment === 'true');
  }
  
  if (payment_received !== undefined) {
    conditions.push(`payment_received = $${params.length + 1}`);
    params.push(payment_received === 'true');
  }
  
  try {
    const result = await db.query(`
      SELECT g.*,
        CASE 
          WHEN g.selection_ids IS NOT NULL THEN 
            array_length(g.selection_ids, 1)
          ELSE 0 
        END as selection_count
      FROM groups g
      WHERE ${conditions.join(' AND ')}
      ORDER BY g.group_name
    `, params);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /groups/approval-status/{projectId}:
 *   get:
 *     tags: [Groups]
 *     description: Get groups by approval status
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *       - in: query
 *         name: client_notified
 *         schema:
 *           type: boolean
 *         description: Filter by client notification status
 *       - in: query
 *         name: client_approved
 *         schema:
 *           type: boolean
 *         description: Filter by client approval status
 *     responses:
 *       200:
 *         description: List of groups matching approval criteria
 *       500:
 *         description: Internal server error
 */
router.get('/approval-status/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { client_notified, client_approved } = req.query;
  
  let conditions = ['project_id = $1'];
  let params = [projectId];
  
  if (client_notified !== undefined) {
    conditions.push(`client_notified = $${params.length + 1}`);
    params.push(client_notified === 'true');
  }
  
  if (client_approved !== undefined) {
    conditions.push(`client_approved = $${params.length + 1}`);
    params.push(client_approved === 'true');
  }
  
  try {
    const result = await db.query(`
      SELECT g.*,
        CASE 
          WHEN g.selection_ids IS NOT NULL THEN 
            array_length(g.selection_ids, 1)
          ELSE 0 
        END as selection_count
      FROM groups g
      WHERE ${conditions.join(' AND ')}
      ORDER BY g.group_name
    `, params);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /groups/{id}/add-selections:
 *   post:
 *     summary: Add selections to a group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selection_ids
 *             properties:
 *               selection_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Selections added successfully
 *       400:
 *         description: Invalid selection IDs
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/add-selections', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { selection_ids } = req.body;

  if (!selection_ids || !Array.isArray(selection_ids) || selection_ids.length === 0) {
    return res.status(400).json({ error: "selection_ids array is required" });
  }

  try {
    // Get current group
    const groupResult = await db.query('SELECT selection_ids FROM groups WHERE group_id = $1', [id]);
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify new selections exist
    const selectionsCheck = await db.query(
      'SELECT selection_id FROM selections WHERE selection_id = ANY($1)',
      [selection_ids]
    );
    
    if (selectionsCheck.rows.length !== selection_ids.length) {
      return res.status(404).json({ error: 'One or more selections not found' });
    }

    // Merge selection IDs
    const currentIds = groupResult.rows[0].selection_ids || [];
    const newIds = [...new Set([...currentIds, ...selection_ids])]; // Remove duplicates

    const result = await db.query(
      `UPDATE groups 
       SET selection_ids = $2
       WHERE group_id = $1
       RETURNING *`,
      [id, newIds]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /groups/{id}/remove-selections:
 *   post:
 *     summary: Remove selections from a group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selection_ids
 *             properties:
 *               selection_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Selections removed successfully
 *       400:
 *         description: Invalid selection IDs
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/remove-selections', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { selection_ids } = req.body;

  if (!selection_ids || !Array.isArray(selection_ids) || selection_ids.length === 0) {
    return res.status(400).json({ error: "selection_ids array is required" });
  }

  try {
    // Get current group
    const groupResult = await db.query('SELECT selection_ids FROM groups WHERE group_id = $1', [id]);
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Remove selection IDs
    const currentIds = groupResult.rows[0].selection_ids || [];
    const newIds = currentIds.filter(sid => !selection_ids.includes(sid));

    const result = await db.query(
      `UPDATE groups 
       SET selection_ids = $2
       WHERE group_id = $1
       RETURNING *`,
      [id, newIds.length > 0 ? newIds : null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;