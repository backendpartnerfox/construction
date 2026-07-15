const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EnquiryItemChoices
 *   description: API for managing enquiry item choices
 */

/**
 * @swagger
 * /enquiry_item_choices:
 *   get:
 *     tags: [EnquiryItemChoices]
 *     description: Retrieve all enquiry item choices
 *     responses:
 *       200:
 *         description: List of enquiry item choices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   choice_id:
 *                     type: integer
 *                   enquiry_id:
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

// Get all enquiry item choices
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM enquiry_item_choices ORDER BY created_at DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices/{id}:
 *   get:
 *     tags: [EnquiryItemChoices]
 *     description: Retrieve a specific enquiry item choice by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry item choice to retrieve
 *     responses:
 *       200:
 *         description: Enquiry item choice details
 *       404:
 *         description: Enquiry item choice not found
 *       500:
 *         description: Internal server error
 */

// Get enquiry item choice by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM enquiry_item_choices WHERE choice_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry item choice not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices:
 *   post:
 *     summary: Create a new enquiry item choice
 *     tags: [EnquiryItemChoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - item_id
 *               - choice_value
 *             properties:
 *               enquiry_id:
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
 *         description: Enquiry item choice created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    enquiry_id,
    item_id,
    choice_value,
    is_default,
    notes,
    created_by
  } = req.body;

  if (!enquiry_id || !item_id || !choice_value) {
    return res.status(400).json({ error: "Enquiry ID, Item ID, and Choice Value are required" });
  }

  try {
    const query = `
      INSERT INTO enquiry_item_choices (
        enquiry_id, item_id, choice_value, is_default, notes, created_by
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      enquiry_id,
      item_id,
      choice_value,
      is_default === true ? true : false,
      notes,
      created_by
    ];

    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices/{id}:
 *   put:
 *     summary: Update an existing enquiry item choice by ID
 *     tags: [EnquiryItemChoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry item choice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - item_id
 *               - choice_value
 *             properties:
 *               enquiry_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               choice_value:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enquiry item choice updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Enquiry item choice not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    enquiry_id,
    item_id,
    choice_value,
    is_default,
    notes
  } = req.body;

  if (!enquiry_id || !item_id || !choice_value) {
    return res.status(400).json({ error: "Enquiry ID, Item ID, and Choice Value are required" });
  }

  try {
    const query = `
      UPDATE enquiry_item_choices 
      SET 
        enquiry_id = $1,
        item_id = $2,
        choice_value = $3,
        is_default = $4,
        notes = $5
      WHERE choice_id = $6
      RETURNING *
    `;
    
    const values = [
      enquiry_id,
      item_id,
      choice_value,
      is_default === true ? true : false,
      notes,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry item choice not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices/{id}:
 *   delete:
 *     summary: Delete an enquiry item choice by ID
 *     tags: [EnquiryItemChoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry item choice to delete
 *     responses:
 *       200:
 *         description: Enquiry item choice deleted successfully
 *       404:
 *         description: Enquiry item choice not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM enquiry_item_choices WHERE choice_id = $1 RETURNING choice_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry item choice not found" });
    }
    
    res.json({ message: "Enquiry item choice deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices/enquiry/{enquiryId}:
 *   get:
 *     tags: [EnquiryItemChoices]
 *     description: Retrieve all choices for a specific enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry
 *     responses:
 *       200:
 *         description: List of choices for the enquiry
 *       500:
 *         description: Internal server error
 */
router.get('/enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_item_choices WHERE enquiry_id = $1 ORDER BY created_at DESC", 
      [enquiryId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices/item/{itemId}:
 *   get:
 *     tags: [EnquiryItemChoices]
 *     description: Retrieve all choices for a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item
 *     responses:
 *       200:
 *         description: List of choices for the item
 *       500:
 *         description: Internal server error
 */
router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_item_choices WHERE item_id = $1 ORDER BY created_at DESC", 
      [itemId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_item_choices/default:
 *   get:
 *     tags: [EnquiryItemChoices]
 *     description: Retrieve all default choices
 *     responses:
 *       200:
 *         description: List of default choices
 *       500:
 *         description: Internal server error
 */
router.get('/default', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_item_choices WHERE is_default = true ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;