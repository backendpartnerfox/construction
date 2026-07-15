const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBlocks
 *   description: API for managing project blocks (work packages with specifications)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectBlock:
 *       type: object
 *       required:
 *         - project_id
 *         - block_code
 *         - block_name
 *       properties:
 *         block_id:
 *           type: integer
 *           description: Unique identifier for the project block
 *         project_id:
 *           type: integer
 *           description: Reference to the project
 *         block_code:
 *           type: string
 *           description: Unique code for the block
 *         block_name:
 *           type: string
 *           description: Name of the block
 *         block_category:
 *           type: string
 *           description: Category of the block
 *         source_type:
 *           type: string
 *           description: Source type of the block
 *         group_id:
 *           type: integer
 *           description: Group ID reference
 *         selection_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of selection IDs
 *         included_elements:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of included elements
 *         included_items:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of included items
 *         scope_description:
 *           type: string
 *           description: Detailed scope description
 *         total_quantity:
 *           type: number
 *           description: Total quantity
 *         total_cost:
 *           type: number
 *           description: Total cost
 *         specifications_finalized:
 *           type: boolean
 *           description: Whether specifications are finalized
 *         client_approvals_complete:
 *           type: boolean
 *           description: Whether client approvals are complete
 *         ready_for_sequencing:
 *           type: boolean
 *           description: Whether ready for sequencing
 *         depends_on_blocks:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of block IDs this block depends on
 *         status:
 *           type: string
 *           description: Current status of the block
 *         created_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: integer
 *         finalized_date:
 *           type: string
 *           format: date-time
 *         finalized_by:
 *           type: integer
 */

/**
 * @swagger
 * /project_blocks:
 *   get:
 *     tags: [ProjectBlocks]
 *     summary: Retrieve all project blocks
 *     description: Get a list of all project blocks with optional filtering
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: block_category
 *         schema:
 *           type: string
 *         description: Filter by block category
 *       - in: query
 *         name: specifications_finalized
 *         schema:
 *           type: boolean
 *         description: Filter by specifications finalized
 *       - in: query
 *         name: client_approvals_complete
 *         schema:
 *           type: boolean
 *         description: Filter by client approvals complete
 *       - in: query
 *         name: ready_for_sequencing
 *         schema:
 *           type: boolean
 *         description: Filter by ready for sequencing
 *     responses:
 *       200:
 *         description: Successfully retrieved project blocks
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, 
    status, 
    block_category, 
    specifications_finalized,
    client_approvals_complete,
    ready_for_sequencing 
  } = req.query;
  
  try {
    let query = 'SELECT * FROM project_blocks WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (block_category) {
      paramCount++;
      query += ` AND block_category = $${paramCount}`;
      params.push(block_category);
    }

    if (specifications_finalized !== undefined) {
      paramCount++;
      query += ` AND specifications_finalized = $${paramCount}`;
      params.push(specifications_finalized === 'true');
    }

    if (client_approvals_complete !== undefined) {
      paramCount++;
      query += ` AND client_approvals_complete = $${paramCount}`;
      params.push(client_approvals_complete === 'true');
    }

    if (ready_for_sequencing !== undefined) {
      paramCount++;
      query += ` AND ready_for_sequencing = $${paramCount}`;
      params.push(ready_for_sequencing === 'true');
    }

    query += ' ORDER BY project_id, block_code';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}:
 *   get:
 *     tags: [ProjectBlocks]
 *     summary: Retrieve a specific project block
 *     description: Get detailed information about a specific project block
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block
 *     responses:
 *       200:
 *         description: Project block found
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_blocks WHERE block_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks:
 *   post:
 *     tags: [ProjectBlocks]
 *     summary: Create a new project block
 *     description: Create a new project block
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - block_code
 *               - block_name
 *             properties:
 *               project_id:
 *                 type: integer
 *               block_code:
 *                 type: string
 *               block_name:
 *                 type: string
 *               block_category:
 *                 type: string
 *               source_type:
 *                 type: string
 *               group_id:
 *                 type: integer
 *               selection_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               included_elements:
 *                 type: array
 *                 items:
 *                   type: string
 *               included_items:
 *                 type: array
 *                 items:
 *                   type: string
 *               scope_description:
 *                 type: string
 *               total_quantity:
 *                 type: number
 *               total_cost:
 *                 type: number
 *               specifications_finalized:
 *                 type: boolean
 *               client_approvals_complete:
 *                 type: boolean
 *               ready_for_sequencing:
 *                 type: boolean
 *               depends_on_blocks:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Project block created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    block_code,
    block_name,
    block_category,
    source_type,
    group_id,
    selection_ids,
    included_elements,
    included_items,
    scope_description,
    total_quantity,
    total_cost,
    specifications_finalized,
    client_approvals_complete,
    ready_for_sequencing,
    depends_on_blocks,
    status,
    created_by
  } = req.body;

  // Validation
  if (!project_id || !block_code || !block_name) {
    return res.status(400).json({ 
      error: 'project_id, block_code, and block_name are required' 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO project_blocks (
        project_id, block_code, block_name, block_category,
        source_type, group_id, selection_ids, included_elements,
        included_items, scope_description, total_quantity, total_cost,
        specifications_finalized, client_approvals_complete, ready_for_sequencing,
        depends_on_blocks, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        project_id, block_code, block_name, block_category,
        source_type, group_id, selection_ids, included_elements,
        included_items, scope_description, total_quantity, total_cost,
        specifications_finalized || false, client_approvals_complete || false, 
        ready_for_sequencing || false, depends_on_blocks, 
        status || 'Created', created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}:
 *   put:
 *     tags: [ProjectBlocks]
 *     summary: Update a project block
 *     description: Update an existing project block
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               block_name:
 *                 type: string
 *               block_category:
 *                 type: string
 *               source_type:
 *                 type: string
 *               group_id:
 *                 type: integer
 *               selection_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               included_elements:
 *                 type: array
 *                 items:
 *                   type: string
 *               included_items:
 *                 type: array
 *                 items:
 *                   type: string
 *               scope_description:
 *                 type: string
 *               total_quantity:
 *                 type: number
 *               total_cost:
 *                 type: number
 *               specifications_finalized:
 *                 type: boolean
 *               client_approvals_complete:
 *                 type: boolean
 *               ready_for_sequencing:
 *                 type: boolean
 *               depends_on_blocks:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project block updated successfully
 *       404:
 *         description: Project block not found
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

    // List of allowed update fields (excluding project_id and block_code which shouldn't change)
    const allowedFields = [
      'block_name', 'block_category', 'source_type', 'group_id',
      'selection_ids', 'included_elements', 'included_items', 'scope_description',
      'total_quantity', 'total_cost', 'specifications_finalized',
      'client_approvals_complete', 'ready_for_sequencing', 'depends_on_blocks', 'status'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${valueCount}`);
        values.push(updates[key]);
        valueCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE project_blocks 
      SET ${updateFields.join(', ')}
      WHERE block_id = $${valueCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}:
 *   delete:
 *     tags: [ProjectBlocks]
 *     summary: Delete a project block
 *     description: Delete a project block by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block to delete
 *     responses:
 *       200:
 *         description: Project block deleted successfully
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM project_blocks WHERE block_id = $1 RETURNING block_id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }
    
    res.json({ 
      message: 'Project block deleted successfully',
      deleted_id: result.rows[0].block_id 
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/project/{project_id}:
 *   get:
 *     tags: [ProjectBlocks]
 *     summary: Get all blocks for a project
 *     description: Retrieve all blocks for a specific project
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Successfully retrieved project blocks
 *       500:
 *         description: Internal server error
 */
router.get('/project/:project_id', async (req, res) => {
  const db = req.db;
  const { project_id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT pb.*, p.project_name, p.project_code
       FROM project_blocks pb
       LEFT JOIN projects p ON pb.project_id = p.project_id
       WHERE pb.project_id = $1 
       ORDER BY pb.block_code`,
      [project_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}/finalize:
 *   post:
 *     tags: [ProjectBlocks]
 *     summary: Finalize project block specifications
 *     description: Mark specifications as finalized for a project block
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - finalized_by
 *             properties:
 *               finalized_by:
 *                 type: integer
 *                 description: ID of the person finalizing
 *     responses:
 *       200:
 *         description: Project block finalized successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/finalize', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { finalized_by } = req.body;

  if (!finalized_by) {
    return res.status(400).json({ error: 'finalized_by is required' });
  }

  try {
    const result = await db.query(
      `UPDATE project_blocks SET
        specifications_finalized = true,
        finalized_date = CURRENT_TIMESTAMP,
        finalized_by = $1,
        status = 'Finalized'
      WHERE block_id = $2
      RETURNING *`,
      [finalized_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}/approve:
 *   post:
 *     tags: [ProjectBlocks]
 *     summary: Mark client approvals as complete
 *     description: Mark client approvals as complete for a project block
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block
 *     responses:
 *       200:
 *         description: Client approvals marked as complete
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE project_blocks SET
        client_approvals_complete = true,
        status = 'Approved'
      WHERE block_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}/ready-for-sequencing:
 *   post:
 *     tags: [ProjectBlocks]
 *     summary: Mark block as ready for sequencing
 *     description: Mark a project block as ready for sequencing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block
 *     responses:
 *       200:
 *         description: Block marked as ready for sequencing
 *       400:
 *         description: Block not ready - specifications not finalized or approvals incomplete
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/ready-for-sequencing', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // First check if block exists and is ready
    const checkResult = await db.query(
      'SELECT specifications_finalized, client_approvals_complete FROM project_blocks WHERE block_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }

    const block = checkResult.rows[0];
    if (!block.specifications_finalized || !block.client_approvals_complete) {
      return res.status(400).json({ 
        error: 'Block cannot be marked ready for sequencing. Specifications must be finalized and client approvals must be complete.' 
      });
    }

    const result = await db.query(
      `UPDATE project_blocks SET
        ready_for_sequencing = true,
        status = 'Ready for Sequencing'
      WHERE block_id = $1
      RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/by-code/{block_code}:
 *   get:
 *     tags: [ProjectBlocks]
 *     summary: Get project block by code
 *     description: Retrieve a project block by its code
 *     parameters:
 *       - in: path
 *         name: block_code
 *         required: true
 *         schema:
 *           type: string
 *         description: The code of the project block
 *     responses:
 *       200:
 *         description: Project block found
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.get('/by-code/:block_code', async (req, res) => {
  const db = req.db;
  const { block_code } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM project_blocks WHERE block_code = $1',
      [block_code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /project_blocks/{id}/dependencies:
 *   get:
 *     tags: [ProjectBlocks]
 *     summary: Get block dependencies
 *     description: Get all blocks that this block depends on
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project block
 *     responses:
 *       200:
 *         description: List of dependency blocks
 *       404:
 *         description: Project block not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/dependencies', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // First get the block and its dependencies
    const blockResult = await db.query(
      'SELECT depends_on_blocks FROM project_blocks WHERE block_id = $1',
      [id]
    );
    
    if (blockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project block not found' });
    }
    
    const dependencyIds = blockResult.rows[0].depends_on_blocks;
    
    if (!dependencyIds || dependencyIds.length === 0) {
      return res.json([]);
    }
    
    // Get details of dependency blocks
    const result = await db.query(
      'SELECT * FROM project_blocks WHERE block_id = ANY($1::int[]) ORDER BY block_code',
      [dependencyIds]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;