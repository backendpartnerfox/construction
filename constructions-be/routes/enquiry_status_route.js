const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiry Status
 *   description: API for managing enquiry status
 */

/**
 * @swagger
 * /enquiry_status:
 *   get:
 *     tags: [Enquiry Status]
 *     description: Retrieve all enquiry status from the enquiry_status table
 *     responses:
 *       200:
 *         description: List of enquiry status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status_id:
 *                     type: integer
 *                   status_name:
 *                     type: string
 *                   status_order:
 *                     type: integer
 *                   color_code:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 */

// Get all enquiry status
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM enquiry_status ORDER BY status_order');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_status/{id}:
 *   get:
 *     tags: [Enquiry Status]
 *     description: Retrieve a specific enquiry status by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry status to retrieve
 *     responses:
 *       200:
 *         description: Enquiry status details
 *       404:
 *         description: Enquiry status not found
 *       500:
 *         description: Internal server error
 */

// Get enquiry status by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM enquiry_status WHERE status_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry status not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_status:
 *   post:
 *     summary: Create a new enquiry status
 *     tags: [Enquiry Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status_name
 *             properties:
 *               status_name:
 *                 type: string
 *               status_order:
 *                 type: integer
 *               color_code:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Enquiry status created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { status_name, status_order, color_code, is_active } = req.body;

  if (!status_name) {
    return res.status(400).json({ error: "Status name is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO enquiry_status (status_name, status_order, color_code, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING status_id`,
      [
        status_name,
        status_order || null,
        color_code || null,
        is_active === false ? false : true
      ]
    );

    res.status(201).json({ 
      status_id: result.rows[0].status_id,
      status_name,
      status_order,
      color_code,
      is_active: is_active === false ? false : true
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_status/{id}:
 *   put:
 *     summary: Update an existing enquiry status by ID
 *     tags: [Enquiry Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry status to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_name:
 *                 type: string
 *               status_order:
 *                 type: integer
 *               color_code:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Enquiry status updated successfully
 *       404:
 *         description: Enquiry status not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status_name, status_order, color_code, is_active } = req.body;

  if (!status_name) {
    return res.status(400).json({ error: "Status name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE enquiry_status 
       SET status_name = $1, status_order = $2, color_code = $3, is_active = $4 
       WHERE status_id = $5`,
      [
        status_name,
        status_order || null,
        color_code || null,
        is_active === false ? false : true,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enquiry status not found" });
    }

    res.json({ 
      status_id: Number(id),
      status_name,
      status_order,
      color_code,
      is_active: is_active === false ? false : true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_status/{id}:
 *   delete:
 *     summary: Delete an enquiry status by ID
 *     tags: [Enquiry Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry status to delete
 *     responses:
 *       200:
 *         description: Enquiry status deleted successfully
 *       404:
 *         description: Enquiry status not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM enquiry_status WHERE status_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enquiry status not found" });
    }
    
    res.json({ message: "Enquiry status deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_status/active:
 *   get:
 *     tags: [Enquiry Status]
 *     description: Retrieve all active enquiry status
 *     responses:
 *       200:
 *         description: List of active enquiry status
 *       500:
 *         description: Internal server error
 */

// Get only active enquiry status
router.get('/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM enquiry_status WHERE is_active = true ORDER BY status_order");
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_status/order/{order}:
 *   get:
 *     tags: [Enquiry Status]
 *     description: Retrieve enquiry status by order
 *     parameters:
 *       - in: path
 *         name: order
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order number to filter enquiry status
 *     responses:
 *       200:
 *         description: Enquiry status with the specified order
 *       500:
 *         description: Internal server error
 */

// Get enquiry status by order
router.get('/order/:order', async (req, res) => {
  const db = req.db;
  const { order } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_status WHERE status_order = $1",
      [order]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;