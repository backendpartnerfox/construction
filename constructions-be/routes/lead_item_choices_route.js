const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LeadItemChoices
 *   description: API for managing lead item choices
 */

/**
 * @swagger
 * /lead_item_choices:
 *   get:
 *     tags: [LeadItemChoices]
 *     description: Retrieve all lead item choices
 *     responses:
 *       200:
 *         description: List of lead item choices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   choice_id:
 *                     type: integer
 *                   lead_id:
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

// Get all lead item choices
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      `SELECT 
        lic.*,
        i.item_name,
        ic.display_name as choice_name,
        ic.brand,
        ic.model,
        ic.description,
        ic.package
      FROM lead_item_choices lic
      LEFT JOIN items i ON lic.item_id = i.item_id
      LEFT JOIN item_choices ic ON lic.choice_value = ic.choice_option_id::text
      ORDER BY lic.created_at DESC`
    );
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_item_choices/{id}:
 *   get:
 *     tags: [LeadItemChoices]
 *     description: Retrieve a specific lead item choice by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead item choice to retrieve
 *     responses:
 *       200:
 *         description: Lead item choice details
 *       404:
 *         description: Lead item choice not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /lead_item_choices/default:
 *   get:
 *     tags: [LeadItemChoices]
 *     description: Retrieve all default choices
 *     responses:
 *       200:
 *         description: List of default choices
 *       500:
 *         description: Internal server error
 */
// NOTE: This route MUST be declared BEFORE '/:id' so that the literal path
// 'default' is not captured by the ':id' param.
router.get('/default', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM lead_item_choices WHERE is_default = true ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get lead item choice by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT 
        lic.*,
        i.item_name,
        ic.display_name as choice_name,
        ic.brand,
        ic.model,
        ic.description,
        ic.package
      FROM lead_item_choices lic
      LEFT JOIN items i ON lic.item_id = i.item_id
      LEFT JOIN item_choices ic ON lic.choice_value = ic.choice_option_id::text
      WHERE lic.choice_id = $1`,
      [id]
    );
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lead item choice not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_item_choices:
 *   post:
 *     summary: Create a new lead item choice
 *     tags: [LeadItemChoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lead_id
 *               - item_id
 *               - choice_value
 *             properties:
 *               lead_id:
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
 *         description: Lead item choice created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    lead_id,
    item_id,
    choice_id,
    choice_value,
    is_default,
    notes,
    created_by
  } = req.body;

  console.log('Received data:', req.body);

  // Accept either choice_id or choice_value
  const finalChoiceValue = choice_value || choice_id;

  if (!lead_id || !item_id || !finalChoiceValue) {
    return res.status(400).json({ error: "Lead ID, Item ID, and Choice ID/Value are required" });
  }

  try {
    const query = `
      INSERT INTO lead_item_choices (
        lead_id, item_id, choice_value, is_default, notes, created_by
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      lead_id,
      item_id,
      finalChoiceValue,
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
 * /lead_item_choices/{id}:
 *   put:
 *     summary: Update an existing lead item choice by ID
 *     tags: [LeadItemChoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead item choice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lead_id
 *               - item_id
 *               - choice_value
 *             properties:
 *               lead_id:
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
 *         description: Lead item choice updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Lead item choice not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    lead_id,
    item_id,
    choice_id,
    choice_value,
    is_default,
    notes
  } = req.body;

  console.log('Update data:', req.body);

  // Accept either choice_id or choice_value
  const finalChoiceValue = choice_value || choice_id;

  if (!lead_id || !item_id || !finalChoiceValue) {
    return res.status(400).json({ error: "Lead ID, Item ID, and Choice ID/Value are required" });
  }

  try {
    const query = `
      UPDATE lead_item_choices 
      SET 
        lead_id = $1,
        item_id = $2,
        choice_value = $3,
        is_default = $4,
        notes = $5
      WHERE choice_id = $6
      RETURNING *
    `;
    
    const values = [
      lead_id,
      item_id,
      finalChoiceValue,
      is_default === true ? true : false,
      notes,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead item choice not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_item_choices/{id}:
 *   delete:
 *     summary: Delete a lead item choice by ID
 *     tags: [LeadItemChoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead item choice to delete
 *     responses:
 *       200:
 *         description: Lead item choice deleted successfully
 *       404:
 *         description: Lead item choice not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM lead_item_choices WHERE choice_id = $1 RETURNING choice_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead item choice not found" });
    }
    
    res.json({ message: "Lead item choice deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_item_choices/lead/{leadId}:
 *   get:
 *     tags: [LeadItemChoices]
 *     description: Retrieve all choices for a specific lead
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead
 *     responses:
 *       200:
 *         description: List of choices for the lead
 *       500:
 *         description: Internal server error
 */
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
        lic.*,
        i.item_name,
        ic.display_name as choice_name,
        ic.brand,
        ic.model,
        ic.description,
        ic.package
      FROM lead_item_choices lic
      LEFT JOIN items i ON lic.item_id = i.item_id
      LEFT JOIN item_choices ic ON lic.choice_value = ic.choice_option_id::text
      WHERE lic.lead_id = $1 
      ORDER BY lic.created_at DESC`,
      [leadId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_item_choices/item/{itemId}:
 *   get:
 *     tags: [LeadItemChoices]
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
      "SELECT * FROM lead_item_choices WHERE item_id = $1 ORDER BY created_at DESC", 
      [itemId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;