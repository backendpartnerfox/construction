const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ClientChoices
 *   description: API for managing client choices for construction projects
 */

/**
 * @swagger
 * /client_choices:
 *   get:
 *     tags: [ClientChoices]
 *     description: Retrieve all client choices
 *     responses:
 *       200:
 *         description: List of client choices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   choice_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   choice_value:
 *                     type: string
 *                   is_default:
 *                     type: boolean
 *                   notes:
 *                     type: string
 *                   created_by:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

// Get all client choices
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    const result = await db.query('SELECT * FROM client_choices');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});



/**
 * @swagger
 * /client_choices:
 *   post:
 *     summary: Create a new client choice
 *     tags: [ClientChoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               choice_value:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Client choice created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { project_id, item_id, choice_value, is_default, notes, created_by } = req.body;

  if (!project_id || !item_id || !choice_value) {
    return res.status(400).json({ error: "Project ID, Item ID, and Choice Value are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO client_choices (project_id, item_id, choice_value, is_default, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id, item_id, choice_value, is_default === false ? false : Boolean(is_default), notes, created_by]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /client_choices/{id}:
 *   put:
 *     summary: Update an existing client choice by ID
 *     tags: [ClientChoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client choice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               choice_value:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Client choice updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Client choice not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { project_id, item_id, choice_value, is_default, notes, created_by } = req.body;

  if (!project_id || !item_id || !choice_value) {
    return res.status(400).json({ error: "Project ID, Item ID, and Choice Value are required" });
  }

  try {
    const result = await db.query(
      `UPDATE client_choices 
       SET project_id = ?, item_id = ?, choice_value = ?, is_default = ?, notes = ?, created_by = ? 
       WHERE choice_id = ?`,
      [project_id, item_id, choice_value, is_default === false ? false : Boolean(is_default), notes, created_by, id]
    );

    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: "Client choice not found" });
    }

    res.json({ 
      choice_id: Number(id), 
      project_id, 
      item_id, 
      choice_value, 
      is_default: is_default === false ? false : Boolean(is_default),
      notes,
      created_by
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/**
 * @swagger
 * /client_choices/project/{projectId}:
 *   get:
 *     tags: [ClientChoices]
 *     description: Retrieve all client choices for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get choices for
 *     responses:
 *       200:
 *         description: List of client choices for the specified project
 *       500:
 *         description: Internal server error
 */

// Get client choices by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query("SELECT * FROM client_choices WHERE project_id = $1", [projectId]);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /client_choices/item/{itemId}:
 *   get:
 *     tags: [ClientChoices]
 *     description: Retrieve all client choices for a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to get choices for
 *     responses:
 *       200:
 *         description: List of client choices for the specified item
 *       500:
 *         description: Internal server error
 */

// Get client choices by item ID
router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query("SELECT * FROM client_choices WHERE item_id = $1", [itemId]);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /client_choices/project/{projectId}/item/{itemId}:
 *   get:
 *     tags: [ClientChoices]
 *     description: Retrieve client choices for a specific project and item
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item
 *     responses:
 *       200:
 *         description: List of client choices for the specified project and item
 *       500:
 *         description: Internal server error
 */

// Get client choices by project ID and item ID
router.get('/project/:projectId/item/:itemId', async (req, res) => {
  const db = req.db;
  const { projectId, itemId } = req.params;
  
  try {
    const result = await db.query(
        "SELECT * FROM client_choices WHERE project_id = $1 AND item_id = $2", 
        [projectId, itemId]
      );
      res.json(result.rows);
    
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /client_choices/default:
 *   get:
 *     tags: [ClientChoices]
 *     description: Retrieve all default client choices
 *     responses:
 *       200:
 *         description: List of default client choices
 *       500:
 *         description: Internal server error
 */

// Get only default client choices
router.get('/default', async (req, res) => {
    const db = req.db;
  
    try {
      const result = await db.query("SELECT * FROM client_choices WHERE is_default = TRUE");
      res.json(result.rows);
    } catch (queryErr) {
      res.status(500).json({ error: queryErr.message });
    }
  });
  
/**
 * @swagger
 * /client_choices/{id}:
 *   get:
 *     tags: [ClientChoices]
 *     description: Retrieve a specific client choice by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client choice to retrieve
 *     responses:
 *       200:
 *         description: Client choice details
 *       404:
 *         description: Client choice not found
 *       500:
 *         description: Internal server error
 */

// Get client choice by ID
router.get('/:id', async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    try {
      const result = await db.query('SELECT * FROM client_choices WHERE choice_id = $1', [id]);
      const rows = result.rows;
  
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Client choice not found' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('Database query error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;