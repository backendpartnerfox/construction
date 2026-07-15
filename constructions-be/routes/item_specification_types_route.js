const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ItemSpecificationTypes
 *   description: API for managing item specification types
 */

/**
 * @swagger
 * /item_specification_types:
 *   get:
 *     tags: [ItemSpecificationTypes]
 *     description: Retrieve all item specification types
 *     responses:
 *       200:
 *         description: List of item specification types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   item_id:
 *                     type: integer
 *                   has_client_choice:
 *                     type: boolean
 *                   has_client_selection:
 *                     type: boolean
 *                   has_predefined_specs:
 *                     type: boolean
 *                   has_arch_inputs:
 *                     type: boolean
 *                   has_standards:
 *                     type: boolean
 *                   has_vendor_pricing:
 *                     type: boolean
 */

// Get all item specification types
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    const result = await db.query('SELECT * FROM item_specification_types');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_specification_types/{itemId}:
 *   get:
 *     tags: [ItemSpecificationTypes]
 *     description: Retrieve specification type for a specific item by item ID
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item to retrieve specification types for
 *     responses:
 *       200:
 *         description: Item specification type details
 *       404:
 *         description: Item specification type not found
 *       500:
 *         description: Internal server error
 */

// Get item specification type by item ID
router.get('/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  try {
    const result = await db.query('SELECT * FROM item_specification_types WHERE item_id = $1', [itemId]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item specification type not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_specification_types:
 *   post:
 *     summary: Create a new item specification type
 *     tags: [ItemSpecificationTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_id:
 *                 type: integer
 *               has_client_choice:
 *                 type: boolean
 *               has_client_selection:
 *                 type: boolean
 *               has_predefined_specs:
 *                 type: boolean
 *               has_arch_inputs:
 *                 type: boolean
 *               has_standards:
 *                 type: boolean
 *               has_vendor_pricing:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Item specification type created successfully
 *       400:
 *         description: Item ID is required
 *       409:
 *         description: Item specification type already exists for this item ID
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    item_id, 
    has_client_choice, 
    has_client_selection, 
    has_predefined_specs, 
    has_arch_inputs, 
    has_standards, 
    has_vendor_pricing 
  } = req.body;

  if (!item_id) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  try {
    // Check if item specification type already exists for this item
    const checkResult = await db.query('SELECT * FROM item_specification_types WHERE item_id = $1', [item_id]);
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: "Item specification type already exists for this item ID" });
    }
    
    const result = await db.query(
      `INSERT INTO item_specification_types (
        item_id, 
        has_client_choice, 
        has_client_selection, 
        has_predefined_specs, 
        has_arch_inputs, 
        has_standards, 
        has_vendor_pricing
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        item_id, 
        has_client_choice === false ? false : Boolean(has_client_choice), 
        has_client_selection === false ? false : Boolean(has_client_selection), 
        has_predefined_specs === false ? false : Boolean(has_predefined_specs), 
        has_arch_inputs === false ? false : Boolean(has_arch_inputs), 
        has_standards === false ? false : Boolean(has_standards), 
        has_vendor_pricing === false ? false : Boolean(has_vendor_pricing)
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
 * /item_specification_types/{itemId}:
 *   put:
 *     summary: Update an existing item specification type by item ID
 *     tags: [ItemSpecificationTypes]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID of the specification type to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               has_client_choice:
 *                 type: boolean
 *               has_client_selection:
 *                 type: boolean
 *               has_predefined_specs:
 *                 type: boolean
 *               has_arch_inputs:
 *                 type: boolean
 *               has_standards:
 *                 type: boolean
 *               has_vendor_pricing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Item specification type updated successfully
 *       404:
 *         description: Item specification type not found
 *       500:
 *         description: Internal server error
 */
router.put('/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  const { 
    has_client_choice, 
    has_client_selection, 
    has_predefined_specs, 
    has_arch_inputs, 
    has_standards, 
    has_vendor_pricing 
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE item_specification_types 
       SET has_client_choice = $1,
           has_client_selection = $2,
           has_predefined_specs = $3,
           has_arch_inputs = $4,
           has_standards = $5,
           has_vendor_pricing = $6
       WHERE item_id = $7
       RETURNING *`,
      [
        has_client_choice === false ? false : Boolean(has_client_choice), 
        has_client_selection === false ? false : Boolean(has_client_selection), 
        has_predefined_specs === false ? false : Boolean(has_predefined_specs), 
        has_arch_inputs === false ? false : Boolean(has_arch_inputs), 
        has_standards === false ? false : Boolean(has_standards), 
        has_vendor_pricing === false ? false : Boolean(has_vendor_pricing),
        itemId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item specification type not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_specification_types/{itemId}:
 *   delete:
 *     summary: Delete an item specification type by item ID
 *     tags: [ItemSpecificationTypes]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID of the specification type to delete
 *     responses:
 *       200:
 *         description: Item specification type deleted successfully
 *       404:
 *         description: Item specification type not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;

  try {
    const result = await db.query("DELETE FROM item_specification_types WHERE item_id = $1 RETURNING *", [itemId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item specification type not found" });
    }
    
    res.json({ message: "Item specification type deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_specification_types/with-client-choice:
 *   get:
 *     tags: [ItemSpecificationTypes]
 *     description: Retrieve all item specification types that have client choice
 *     responses:
 *       200:
 *         description: List of item specification types with client choice
 *       500:
 *         description: Internal server error
 */

// Get items with client choice
router.get('/with-client-choice', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM item_specification_types WHERE has_client_choice = true");
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_specification_types/with-client-selection:
 *   get:
 *     tags: [ItemSpecificationTypes]
 *     description: Retrieve all item specification types that have client selection
 *     responses:
 *       200:
 *         description: List of item specification types with client selection
 *       500:
 *         description: Internal server error
 */

// Get items with client selection
router.get('/with-client-selection', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM item_specification_types WHERE has_client_selection = true");
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_specification_types/with-predefined-specs:
 *   get:
 *     tags: [ItemSpecificationTypes]
 *     description: Retrieve all item specification types that have predefined specifications
 *     responses:
 *       200:
 *         description: List of item specification types with predefined specifications
 *       500:
 *         description: Internal server error
 */

// Get items with predefined specifications
router.get('/with-predefined-specs', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM item_specification_types WHERE has_predefined_specs = true");
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;