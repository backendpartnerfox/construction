const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkModules
 *   description: API for managing work modules
 */

/**
 * @swagger
 * /work_modules:
 *   get:
 *     tags: [WorkModules]
 *     description: Retrieve all work modules
 *     responses:
 *       200:
 *         description: List of work modules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   module_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   module_code:
 *                     type: string
 *                   module_name:
 *                     type: string
 *                   sequence_ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   payment_milestone:
 *                     type: string
 *                   required_payment_percentage:
 *                     type: number
 *                   payment_received:
 *                     type: boolean
 *                   payment_amount:
 *                     type: number
 *                   payment_date:
 *                     type: string
 *                     format: date
 *                   payment_reference:
 *                     type: string
 *                   module_value:
 *                     type: number
 *                   procurement_initiated:
 *                     type: boolean
 *                   procurement_complete:
 *                     type: boolean
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 *                   released_date:
 *                     type: string
 *                     format: date-time
 *                   released_by:
 *                     type: integer
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        wm.*,
        p.project_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        re.first_name || ' ' || re.last_name as released_by_name,
        CASE 
          WHEN wm.sequence_ids IS NOT NULL THEN 
            array_length(wm.sequence_ids, 1)
          ELSE 0 
        END as sequence_count
      FROM work_modules wm
      LEFT JOIN projects p ON wm.project_id = p.project_id
      LEFT JOIN employees e ON wm.created_by = e.employee_id
      LEFT JOIN employees re ON wm.released_by = re.employee_id
      ORDER BY wm.project_id, wm.module_code
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_modules/{id}:
 *   get:
 *     tags: [WorkModules]
 *     description: Retrieve a specific work module by ID with sequence details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module to retrieve
 *     responses:
 *       200:
 *         description: Work module details with sequences
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        wm.*,
        p.project_name,
        e.first_name || ' ' || e.last_name as created_by_name,
        re.first_name || ' ' || re.last_name as released_by_name
      FROM work_modules wm
      LEFT JOIN projects p ON wm.project_id = p.project_id
      LEFT JOIN employees e ON wm.created_by = e.employee_id
      LEFT JOIN employees re ON wm.released_by = re.employee_id
      WHERE wm.module_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work module not found' });
    }

    // Get sequence details if there are sequence_ids
    if (result.rows[0].sequence_ids && result.rows[0].sequence_ids.length > 0) {
      const sequencesResult = await db.query(`
        SELECT s.*, b.block_name
        FROM sequencing s
        LEFT JOIN blocks b ON s.block_id = b.block_id
        WHERE s.sequence_id = ANY($1)
        ORDER BY s.sequence_order
      `, [result.rows[0].sequence_ids]);
      
      result.rows[0].sequences_details = sequencesResult.rows;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_modules/project/{projectId}:
 *   get:
 *     tags: [WorkModules]
 *     description: Retrieve all work modules for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of work modules for the project
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
      SELECT wm.*,
        CASE 
          WHEN wm.sequence_ids IS NOT NULL THEN 
            array_length(wm.sequence_ids, 1)
          ELSE 0 
        END as sequence_count
      FROM work_modules wm
      WHERE wm.project_id = $1 
      ORDER BY wm.module_code
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_modules:
 *   post:
 *     summary: Create a new work module
 *     tags: [WorkModules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - module_code
 *               - module_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               module_code:
 *                 type: string
 *               module_name:
 *                 type: string
 *               sequence_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               payment_milestone:
 *                 type: string
 *               required_payment_percentage:
 *                 type: number
 *               payment_received:
 *                 type: boolean
 *               payment_amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               payment_reference:
 *                 type: string
 *               module_value:
 *                 type: number
 *               procurement_initiated:
 *                 type: boolean
 *               procurement_complete:
 *                 type: boolean
 *               status:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Work module created successfully
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
    project_id, module_code, module_name, sequence_ids,
    payment_milestone, required_payment_percentage, payment_received,
    payment_amount, payment_date, payment_reference, module_value,
    procurement_initiated, procurement_complete, status, created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !module_code || !module_name) {
    return res.status(400).json({ 
      error: "Required fields: project_id, module_code, module_name" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify sequences exist if provided
    if (sequence_ids && sequence_ids.length > 0) {
      const sequencesCheck = await db.query(
        'SELECT sequence_id FROM sequencing WHERE sequence_id = ANY($1)',
        [sequence_ids]
      );
      
      if (sequencesCheck.rows.length !== sequence_ids.length) {
        return res.status(404).json({ error: 'One or more sequences not found' });
      }
    }

    const result = await db.query(
      `INSERT INTO work_modules (
        project_id, module_code, module_name, sequence_ids,
        payment_milestone, required_payment_percentage, payment_received,
        payment_amount, payment_date, payment_reference, module_value,
        procurement_initiated, procurement_complete, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        project_id, module_code, module_name, sequence_ids,
        payment_milestone, required_payment_percentage, payment_received || false,
        payment_amount, payment_date, payment_reference, module_value,
        procurement_initiated || false, procurement_complete || false, 
        status || 'Pending_Payment', created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_modules/{id}:
 *   put:
 *     summary: Update an existing work module
 *     tags: [WorkModules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module_code:
 *                 type: string
 *               module_name:
 *                 type: string
 *               sequence_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               payment_milestone:
 *                 type: string
 *               required_payment_percentage:
 *                 type: number
 *               payment_received:
 *                 type: boolean
 *               payment_amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               payment_reference:
 *                 type: string
 *               module_value:
 *                 type: number
 *               procurement_initiated:
 *                 type: boolean
 *               procurement_complete:
 *                 type: boolean
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work module updated successfully
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.module_id;
  delete updates.project_id;
  delete updates.created_at;
  delete updates.created_by;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    // Verify sequences exist if provided
    if (updates.sequence_ids && updates.sequence_ids.length > 0) {
      const sequencesCheck = await db.query(
        'SELECT sequence_id FROM sequencing WHERE sequence_id = ANY($1)',
        [updates.sequence_ids]
      );
      
      if (sequencesCheck.rows.length !== updates.sequence_ids.length) {
        return res.status(404).json({ error: 'One or more sequences not found' });
      }
    }

    // Build dynamic UPDATE query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const result = await db.query(
      `UPDATE work_modules 
       SET ${setClause}
       WHERE module_id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Work module not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_modules/{id}:
 *   delete:
 *     summary: Delete a work module
 *     tags: [WorkModules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module to delete
 *     responses:
 *       200:
 *         description: Work module deleted successfully
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM work_modules WHERE module_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Work module not found" });
    }
    
    res.json({ message: "Work module deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_modules/payment-status/{projectId}:
 *   get:
 *     tags: [WorkModules]
 *     description: Get work modules by payment status
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *       - in: query
 *         name: payment_received
 *         schema:
 *           type: boolean
 *         description: Filter by payment received status
 *     responses:
 *       200:
 *         description: List of work modules matching payment criteria
 *       500:
 *         description: Internal server error
 */
router.get('/payment-status/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { payment_received } = req.query;
  
  let conditions = ['project_id = $1'];
  let params = [projectId];
  
  if (payment_received !== undefined) {
    conditions.push(`payment_received = $${params.length + 1}`);
    params.push(payment_received === 'true');
  }
  
  try {
    const result = await db.query(`
      SELECT wm.*,
        CASE 
          WHEN wm.sequence_ids IS NOT NULL THEN 
            array_length(wm.sequence_ids, 1)
          ELSE 0 
        END as sequence_count
      FROM work_modules wm
      WHERE ${conditions.join(' AND ')}
      ORDER BY wm.module_code
    `, params);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_modules/procurement-status/{projectId}:
 *   get:
 *     tags: [WorkModules]
 *     description: Get work modules by procurement status
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project ID
 *       - in: query
 *         name: procurement_initiated
 *         schema:
 *           type: boolean
 *         description: Filter by procurement initiated
 *       - in: query
 *         name: procurement_complete
 *         schema:
 *           type: boolean
 *         description: Filter by procurement complete
 *     responses:
 *       200:
 *         description: List of work modules matching procurement criteria
 *       500:
 *         description: Internal server error
 */
router.get('/procurement-status/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  const { procurement_initiated, procurement_complete } = req.query;
  
  let conditions = ['project_id = $1'];
  let params = [projectId];
  
  if (procurement_initiated !== undefined) {
    conditions.push(`procurement_initiated = $${params.length + 1}`);
    params.push(procurement_initiated === 'true');
  }
  
  if (procurement_complete !== undefined) {
    conditions.push(`procurement_complete = $${params.length + 1}`);
    params.push(procurement_complete === 'true');
  }
  
  try {
    const result = await db.query(`
      SELECT wm.*,
        CASE 
          WHEN wm.sequence_ids IS NOT NULL THEN 
            array_length(wm.sequence_ids, 1)
          ELSE 0 
        END as sequence_count
      FROM work_modules wm
      WHERE ${conditions.join(' AND ')}
      ORDER BY wm.module_code
    `, params);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_modules/{id}/add-sequences:
 *   post:
 *     summary: Add sequences to a work module
 *     tags: [WorkModules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sequence_ids
 *             properties:
 *               sequence_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Sequences added successfully
 *       400:
 *         description: Invalid sequence IDs
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/add-sequences', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { sequence_ids } = req.body;

  if (!sequence_ids || !Array.isArray(sequence_ids) || sequence_ids.length === 0) {
    return res.status(400).json({ error: "sequence_ids array is required" });
  }

  try {
    // Get current work module
    const moduleResult = await db.query('SELECT sequence_ids FROM work_modules WHERE module_id = $1', [id]);
    
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work module not found' });
    }

    // Verify new sequences exist
    const sequencesCheck = await db.query(
      'SELECT sequence_id FROM sequencing WHERE sequence_id = ANY($1)',
      [sequence_ids]
    );
    
    if (sequencesCheck.rows.length !== sequence_ids.length) {
      return res.status(404).json({ error: 'One or more sequences not found' });
    }

    // Merge sequence IDs
    const currentIds = moduleResult.rows[0].sequence_ids || [];
    const newIds = [...new Set([...currentIds, ...sequence_ids])]; // Remove duplicates

    const result = await db.query(
      `UPDATE work_modules 
       SET sequence_ids = $2
       WHERE module_id = $1
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
 * /work_modules/{id}/remove-sequences:
 *   post:
 *     summary: Remove sequences from a work module
 *     tags: [WorkModules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sequence_ids
 *             properties:
 *               sequence_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Sequences removed successfully
 *       400:
 *         description: Invalid sequence IDs
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/remove-sequences', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { sequence_ids } = req.body;

  if (!sequence_ids || !Array.isArray(sequence_ids) || sequence_ids.length === 0) {
    return res.status(400).json({ error: "sequence_ids array is required" });
  }

  try {
    // Get current work module
    const moduleResult = await db.query('SELECT sequence_ids FROM work_modules WHERE module_id = $1', [id]);
    
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work module not found' });
    }

    // Remove sequence IDs
    const currentIds = moduleResult.rows[0].sequence_ids || [];
    const newIds = currentIds.filter(sid => !sequence_ids.includes(sid));

    const result = await db.query(
      `UPDATE work_modules 
       SET sequence_ids = $2
       WHERE module_id = $1
       RETURNING *`,
      [id, newIds.length > 0 ? newIds : null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_modules/{id}/release:
 *   post:
 *     summary: Release a work module for execution
 *     tags: [WorkModules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - released_by
 *             properties:
 *               released_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Work module released successfully
 *       400:
 *         description: Module cannot be released
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/release', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { released_by } = req.body;

  if (!released_by) {
    return res.status(400).json({ error: "released_by is required" });
  }

  try {
    // Check if module can be released
    const moduleCheck = await db.query(
      'SELECT status, payment_received FROM work_modules WHERE module_id = $1',
      [id]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Work module not found' });
    }

    if (moduleCheck.rows[0].status !== 'Pending_Payment' || !moduleCheck.rows[0].payment_received) {
      return res.status(400).json({ error: 'Module must have payment received before release' });
    }

    const result = await db.query(
      `UPDATE work_modules 
       SET status = 'Released', 
           released_date = CURRENT_TIMESTAMP, 
           released_by = $2
       WHERE module_id = $1
       RETURNING *`,
      [id, released_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_modules/{id}/update-payment:
 *   patch:
 *     summary: Update payment information for a work module
 *     tags: [WorkModules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work module
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_received:
 *                 type: boolean
 *               payment_amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               payment_reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment information updated successfully
 *       404:
 *         description: Work module not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/update-payment', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { payment_received, payment_amount, payment_date, payment_reference } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (payment_received !== undefined) {
      paramCount++;
      updates.push(`payment_received = $${paramCount}`);
      values.push(payment_received);
    }

    if (payment_amount !== undefined) {
      paramCount++;
      updates.push(`payment_amount = $${paramCount}`);
      values.push(payment_amount);
    }

    if (payment_date !== undefined) {
      paramCount++;
      updates.push(`payment_date = $${paramCount}`);
      values.push(payment_date);
    }

    if (payment_reference !== undefined) {
      paramCount++;
      updates.push(`payment_reference = $${paramCount}`);
      values.push(payment_reference);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No payment fields to update" });
    }

    paramCount++;
    values.push(id);

    const result = await db.query(
      `UPDATE work_modules 
       SET ${updates.join(', ')}
       WHERE module_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Work module not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;