const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: API for managing construction items 
 */

// IMPORTANT: Define specific routes BEFORE parameterized routes

/**
 * @swagger
 * /items/active:
 *   get:
 *     tags: [Items]
 *     description: Retrieve all active items
 *     responses:
 *       200:
 *         description: List of active items
 *       500:
 *         description: Internal server error
 */
// Get only active items - MUST BE BEFORE /:id
router.get('/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM items WHERE is_active = true");
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /items/category/{category}:
 *   get:
 *     tags: [Items]
 *     description: Retrieve items by category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The category of items to retrieve
 *     responses:
 *       200:
 *         description: List of items in the specified category
 *       500:
 *         description: Internal server error
 */
// Get items by category - MUST BE BEFORE /:id
router.get('/category/:category', async (req, res) => {
  const db = req.db;
  const { category } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM items WHERE item_category = $1",
      [category]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /items/search:
 *   get:
 *     tags: [Items]
 *     description: Search items by name or description
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of matching items
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
// Search items - MUST BE BEFORE /:id
router.get('/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(
      `SELECT * FROM items 
       WHERE item_name ILIKE $1 
       OR item_description ILIKE $1`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /items:
 *   get:
 *     tags: [Items]
 *     description: Retrieve all items from the items table 
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   item_id:
 *                     type: integer
 *                   item_name:
 *                     type: string
 *                   item_description:
 *                     type: string
 *                   item_unit:
 *                     type: string
 *                   item_category:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 */
// Get all items
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM items ORDER BY item_id');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     tags: [Items]
 *     description: Retrieve a specific item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to retrieve
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
// Get item by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM items WHERE item_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_name:
 *                 type: string
 *               item_description:
 *                 type: string
 *               item_unit:
 *                 type: string
 *               item_category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Item name is required
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { item_name, item_description, item_unit, item_category, is_active } = req.body;

  if (!item_name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO items (item_name, item_description, item_unit, item_category, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        item_name,
        item_description || null,
        item_unit || null,
        item_category || null,
        is_active === false ? false : true
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
 * /items/{id}:
 *   put:
 *     summary: Update an existing item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_name:
 *                 type: string
 *               item_description:
 *                 type: string
 *               item_unit:
 *                 type: string
 *               item_category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Item name is required
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { item_name, item_description, item_unit, item_category, is_active } = req.body;

  if (!item_name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE items 
       SET item_name = $1, item_description = $2, item_unit = $3, 
           item_category = $4, is_active = $5 
       WHERE item_id = $6
       RETURNING *`,
      [
        item_name,
        item_description || null,
        item_unit || null,
        item_category || null,
        is_active === false ? false : true,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete an item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to delete
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM items WHERE item_id = $1 RETURNING item_id",
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;