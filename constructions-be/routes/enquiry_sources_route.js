const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiry Sources
 *   description: API for managing enquiry sources
 */

/**
 * @swagger
 * /enquiry_sources:
 *   get:
 *     tags: [Enquiry Sources]
 *     description: Retrieve all enquiry sources from the enquiry_sources table
 *     responses:
 *       200:
 *         description: List of enquiry sources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   source_id:
 *                     type: integer
 *                   source_name:
 *                     type: string
 *                   source_type:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 */

// Get all enquiry sources
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM enquiry_sources');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_sources/{id}:
 *   get:
 *     tags: [Enquiry Sources]
 *     description: Retrieve a specific enquiry source by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry source to retrieve
 *     responses:
 *       200:
 *         description: Enquiry source details
 *       404:
 *         description: Enquiry source not found
 *       500:
 *         description: Internal server error
 */

// Get enquiry source by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM enquiry_sources WHERE source_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry source not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_sources:
 *   post:
 *     summary: Create a new enquiry source
 *     tags: [Enquiry Sources]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - source_name
 *             properties:
 *               source_name:
 *                 type: string
 *               source_type:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Enquiry source created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { source_name, source_type, is_active } = req.body;

  if (!source_name) {
    return res.status(400).json({ error: "Source name is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO enquiry_sources (source_name, source_type, is_active) 
       VALUES ($1, $2, $3) 
       RETURNING source_id`,
      [
        source_name,
        source_type || null,
        is_active === false ? false : true
      ]
    );

    res.status(201).json({ 
      source_id: result.rows[0].source_id,
      source_name,
      source_type,
      is_active: is_active === false ? false : true
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_sources/{id}:
 *   put:
 *     summary: Update an existing enquiry source by ID
 *     tags: [Enquiry Sources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry source to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source_name:
 *                 type: string
 *               source_type:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Enquiry source updated successfully
 *       404:
 *         description: Enquiry source not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { source_name, source_type, is_active } = req.body;

  if (!source_name) {
    return res.status(400).json({ error: "Source name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE enquiry_sources 
       SET source_name = $1, source_type = $2, is_active = $3 
       WHERE source_id = $4`,
      [
        source_name,
        source_type || null,
        is_active === false ? false : true,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enquiry source not found" });
    }

    res.json({ 
      source_id: Number(id),
      source_name,
      source_type,
      is_active: is_active === false ? false : true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_sources/{id}:
 *   delete:
 *     summary: Delete an enquiry source by ID
 *     tags: [Enquiry Sources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry source to delete
 *     responses:
 *       200:
 *         description: Enquiry source deleted successfully
 *       404:
 *         description: Enquiry source not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM enquiry_sources WHERE source_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enquiry source not found" });
    }
    
    res.json({ message: "Enquiry source deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_sources/type/{type}:
 *   get:
 *     tags: [Enquiry Sources]
 *     description: Retrieve enquiry sources by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of enquiry sources to retrieve
 *     responses:
 *       200:
 *         description: List of enquiry sources of the specified type
 *       500:
 *         description: Internal server error
 */

// Get enquiry sources by type
router.get('/type/:type', async (req, res) => {
  const db = req.db;
  const { type } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_sources WHERE source_type = $1",
      [type]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_sources/active:
 *   get:
 *     tags: [Enquiry Sources]
 *     description: Retrieve all active enquiry sources
 *     responses:
 *       200:
 *         description: List of active enquiry sources
 *       500:
 *         description: Internal server error
 */

// Get only active enquiry sources
router.get('/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM enquiry_sources WHERE is_active = true");
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;