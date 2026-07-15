const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ElementItemMapping
 *   description: API for managing element-item relationships
 */

/**
 * @swagger
 * /element_item_mapping:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve all element-item mappings
 *     responses:
 *       200:
 *         description: List of all mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   mapping_id:
 *                     type: integer
 *                   element_id:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   is_required:
 *                     type: boolean
 */

// Get all mappings
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    const result = await db.query('SELECT * FROM element_item_mapping');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/{id}:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve a specific mapping by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the mapping to retrieve
 *     responses:
 *       200:
 *         description: Mapping details
 *       404:
 *         description: Mapping not found
 *       500:
 *         description: Internal server error
 */

// Get mapping by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM element_item_mapping WHERE mapping_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /element_item_mapping:
 *   post:
 *     summary: Create a new element-item mapping
 *     tags: [ElementItemMapping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               is_required:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Mapping created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { element_id, item_id, is_required } = req.body;

  if (!element_id || !item_id) {
    return res.status(400).json({ error: "Element ID and Item ID are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO element_item_mapping (element_id, item_id, is_required) 
       VALUES ($1, $2, $3) 
       RETURNING mapping_id`,
      [
        element_id,
        item_id,
        is_required === false ? false : true
      ]
    );

    res.status(201).json({ 
      mapping_id: result.rows[0].mapping_id,
      element_id,
      item_id,
      is_required: is_required === false ? false : true
    });

  } catch (err) {
    // Check if the error is due to foreign key constraint
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid element_id or item_id. Make sure both referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/{id}:
 *   put:
 *     summary: Update an existing mapping by ID
 *     tags: [ElementItemMapping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the mapping to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               element_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               is_required:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Mapping updated successfully
 *       404:
 *         description: Mapping not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { element_id, item_id, is_required } = req.body;

  if (!element_id || !item_id) {
    return res.status(400).json({ error: "Element ID and Item ID are required" });
  }

  try {
    const result = await db.query(
      `UPDATE element_item_mapping 
       SET element_id = $1, item_id = $2, is_required = $3 
       WHERE mapping_id = $4`,
      [
        element_id,
        item_id,
        is_required === false ? false : true,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Mapping not found" });
    }

    res.json({ 
      mapping_id: Number(id), 
      element_id, 
      item_id,
      is_required: is_required === false ? false : true
    });
  } catch (err) {
    // Check if the error is due to foreign key constraint
    if (err.code === '23503') { // foreign key violation
      return res.status(400).json({ 
        error: "Invalid element_id or item_id. Make sure both referenced IDs exist." 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/{id}:
 *   delete:
 *     summary: Delete a mapping by ID
 *     tags: [ElementItemMapping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the mapping to delete
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 *       404:
 *         description: Mapping not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM element_item_mapping WHERE mapping_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    
    res.json({ message: "Mapping deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/element/{elementId}:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve all mappings for a specific element
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the element to retrieve mappings for
 *     responses:
 *       200:
 *         description: List of mappings for the specified element
 *       500:
 *         description: Internal server error
 */

// Get mappings by element ID
router.get('/element/:elementId', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM element_item_mapping WHERE element_id = $1",
      [elementId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/item/{itemId}:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve all mappings for a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to retrieve mappings for
 *     responses:
 *       200:
 *         description: List of mappings for the specified item
 *       500:
 *         description: Internal server error
 */

// Get mappings by item ID
router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM element_item_mapping WHERE item_id = $1",
      [itemId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/element/{elementId}/details:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve all items with mapping details for a specific element
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the element to retrieve item details for
 *     responses:
 *       200:
 *         description: List of items with mapping details for the specified element
 *       500:
 *         description: Internal server error
 */

// Get detailed item information for a specific element
router.get('/element/:elementId/details', async (req, res) => {
  const db = req.db;
  const { elementId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT m.mapping_id, m.element_id, m.item_id, m.is_required, 
              i.item_name, i.item_description, i.item_category, i.item_unit
       FROM element_item_mapping m
       JOIN items i ON m.item_id = i.item_id
       WHERE m.element_id = $1`,
      [elementId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/item/{itemId}/details:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve all elements with mapping details for a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to retrieve element details for
 *     responses:
 *       200:
 *         description: List of elements with mapping details for the specified item
 *       500:
 *         description: Internal server error
 */

// Get detailed element information for a specific item
router.get('/item/:itemId/details', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT m.mapping_id, m.element_id, m.item_id, m.is_required, 
              e.element_name, e.element_category, e.element_description
       FROM element_item_mapping m
       JOIN elements e ON m.element_id = e.element_id
       WHERE m.item_id = $1`,
      [itemId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /element_item_mapping/required:
 *   get:
 *     tags: [ElementItemMapping]
 *     description: Retrieve all required element-item mappings
 *     responses:
 *       200:
 *         description: List of required mappings
 *       500:
 *         description: Internal server error
 */

// Get only required mappings
router.get('/required', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM element_item_mapping WHERE is_required = true"
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;