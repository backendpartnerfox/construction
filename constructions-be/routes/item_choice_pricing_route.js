const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Item Choice Pricing
 *   description: API for managing item choice pricing
 */

/**
 * @swagger
 * /item_choice_pricing:
 *   get:
 *     tags: [Item Choice Pricing]
 *     description: Retrieve all item choice pricing with choice details
 *     parameters:
 *       - in: query
 *         name: choice_option_id
 *         schema:
 *           type: integer
 *         description: Filter by choice option ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of item choice pricing
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   choice_option_id:
 *                     type: integer
 *                   base_price:
 *                     type: number
 *                   unit_of_measurement:
 *                     type: string
 *                   gst_percentage:
 *                     type: number
 *                   gst_amount:
 *                     type: number
 *                   total_price:
 *                     type: number
 *                   effective_from:
 *                     type: string
 *                     format: date
 *                   effective_to:
 *                     type: string
 *                     format: date
 *                   is_active:
 *                     type: boolean
 *                   choice_name:
 *                     type: string
 *                   item_name:
 *                     type: string
 */

// Get all item choice pricing
router.get('/', async (req, res) => {
  const db = req.db;
  const { choice_option_id, is_active } = req.query;
  
  try {
    let query = `
      SELECT icp.*, ic.display_name as choice_name, i.item_name
      FROM item_choice_pricing icp
      LEFT JOIN item_choices ic ON ic.choice_option_id = icp.choice_option_id
      LEFT JOIN items i ON ic.item_id = i.item_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (choice_option_id) {
      conditions.push(`icp.choice_option_id = $${params.length + 1}`);
      params.push(choice_option_id);
    }
    
    if (is_active !== undefined) {
      conditions.push(`icp.is_active = $${params.length + 1}`);
      params.push(is_active === 'true');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY icp.effective_from DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing/{id}:
 *   get:
 *     tags: [Item Choice Pricing]
 *     description: Retrieve a specific item choice pricing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the pricing to retrieve
 *     responses:
 *       200:
 *         description: Item choice pricing details
 *       404:
 *         description: Pricing not found
 *       500:
 *         description: Internal server error
 */

// Get item choice pricing by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT icp.*, ic.display_name as choice_name, i.item_name
      FROM item_choice_pricing icp
      LEFT JOIN item_choices ic ON ic.choice_option_id = icp.choice_option_id
      LEFT JOIN items i ON ic.item_id = i.item_id
      WHERE icp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item choice pricing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing/choice/{choiceId}:
 *   get:
 *     tags: [Item Choice Pricing]
 *     description: Retrieve all pricing for a specific choice option
 *     parameters:
 *       - in: path
 *         name: choiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the choice option
 *     responses:
 *       200:
 *         description: List of pricing for the choice option
 *       404:
 *         description: Choice option not found
 *       500:
 *         description: Internal server error
 */

// Get pricing by choice option ID
router.get('/choice/:choiceId', async (req, res) => {
  const db = req.db;
  const { choiceId } = req.params;
  
  try {
    // First check if choice option exists
    const choiceCheck = await db.query('SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', [choiceId]);
    
    if (choiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Choice option not found' });
    }
    
    const result = await db.query(`
      SELECT *
      FROM item_choice_pricing
      WHERE choice_option_id = $1
      ORDER BY effective_from DESC
    `, [choiceId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing/choice/{choiceId}/current:
 *   get:
 *     tags: [Item Choice Pricing]
 *     description: Get current active pricing for a choice option
 *     parameters:
 *       - in: path
 *         name: choiceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the choice option
 *     responses:
 *       200:
 *         description: Current pricing for the choice option
 *       404:
 *         description: No current pricing found
 *       500:
 *         description: Internal server error
 */

// Get current pricing by choice option ID
router.get('/choice/:choiceId/current', async (req, res) => {
  const db = req.db;
  const { choiceId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT icp.*, ic.display_name as choice_name, i.item_name
      FROM item_choice_pricing icp
      LEFT JOIN item_choices ic ON ic.choice_option_id = icp.choice_option_id
      LEFT JOIN items i ON ic.item_id = i.item_id
      WHERE icp.choice_option_id = $1 
        AND icp.is_active = true
        AND icp.effective_from <= CURRENT_DATE
        AND (icp.effective_to IS NULL OR icp.effective_to >= CURRENT_DATE)
      ORDER BY icp.effective_from DESC
      LIMIT 1
    `, [choiceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No current pricing found for this choice option' });
    }
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing:
 *   post:
 *     summary: Create a new item choice pricing
 *     tags: [Item Choice Pricing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choice_option_id
 *               - base_price
 *               - unit_of_measurement
 *               - effective_from
 *             properties:
 *               choice_option_id:
 *                 type: integer
 *               base_price:
 *                 type: number
 *               unit_of_measurement:
 *                 type: string
 *               gst_percentage:
 *                 type: number
 *                 default: 18.00
 *               effective_from:
 *                 type: string
 *                 format: date
 *               effective_to:
 *                 type: string
 *                 format: date
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Pricing created successfully
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Choice option not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    choice_option_id, base_price, unit_of_measurement, gst_percentage = 18.00,
    effective_from, effective_to, is_active = true
  } = req.body;

  if (!choice_option_id) return res.status(400).json({ error: "Choice option ID is required" });
  if (base_price == null || base_price === '') return res.status(400).json({ error: "Base price is required" });
  if (!unit_of_measurement) return res.status(400).json({ error: "Unit of measurement is required" });

  try {
    const choiceCheck = await db.query('SELECT choice_option_id FROM item_choices WHERE choice_option_id = $1', [choice_option_id]);
    if (choiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Choice option not found' });
    }

    // gst_amount and total_price are GENERATED columns — do not insert them.
    // effective_from defaults to today when not provided.
    const result = await db.query(
      `INSERT INTO item_choice_pricing (
        choice_option_id, base_price, unit_of_measurement, gst_percentage,
        effective_from, effective_to, is_active
      ) VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6, $7)
       RETURNING *`,
      [choice_option_id, base_price, unit_of_measurement, gst_percentage, effective_from || null, effective_to || null, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing/{id}:
 *   put:
 *     summary: Update an existing item choice pricing by ID
 *     tags: [Item Choice Pricing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the pricing to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base_price:
 *                 type: number
 *               unit_of_measurement:
 *                 type: string
 *               gst_percentage:
 *                 type: number
 *               effective_from:
 *                 type: string
 *                 format: date
 *               effective_to:
 *                 type: string
 *                 format: date
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing updated successfully
 *       404:
 *         description: Pricing not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    base_price, unit_of_measurement, gst_percentage, effective_from, effective_to, is_active
  } = req.body;

  try {
    const currentRecord = await db.query('SELECT id FROM item_choice_pricing WHERE id = $1', [id]);
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: "Item choice pricing not found" });
    }

    // gst_amount and total_price are GENERATED columns — do not update them.
    const result = await db.query(
      `UPDATE item_choice_pricing
       SET base_price          = COALESCE($1, base_price),
           unit_of_measurement = COALESCE($2, unit_of_measurement),
           gst_percentage      = COALESCE($3, gst_percentage),
           effective_from      = COALESCE($4, effective_from),
           effective_to        = $5,
           is_active           = COALESCE($6, is_active),
           updated_at          = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [base_price, unit_of_measurement, gst_percentage, effective_from, effective_to, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing/{id}/deactivate:
 *   patch:
 *     summary: Deactivate an item choice pricing
 *     tags: [Item Choice Pricing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the pricing to deactivate
 *     responses:
 *       200:
 *         description: Pricing deactivated successfully
 *       404:
 *         description: Pricing not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/deactivate', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE item_choice_pricing 
       SET is_active = false, effective_to = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item choice pricing not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_choice_pricing/{id}:
 *   delete:
 *     summary: Delete an item choice pricing by ID
 *     tags: [Item Choice Pricing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the pricing to delete
 *     responses:
 *       200:
 *         description: Pricing deleted successfully
 *       400:
 *         description: Cannot delete active pricing
 *       404:
 *         description: Pricing not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if pricing is currently active
    const statusCheck = await db.query(
      `SELECT is_active, effective_from, effective_to FROM item_choice_pricing WHERE id = $1`, 
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "Item choice pricing not found" });
    }
    
    const pricing = statusCheck.rows[0];
    const currentDate = new Date();
    const effectiveFrom = new Date(pricing.effective_from);
    const effectiveTo = pricing.effective_to ? new Date(pricing.effective_to) : null;
    
    // Check if pricing is currently active
    if (pricing.is_active && effectiveFrom <= currentDate && (!effectiveTo || effectiveTo >= currentDate)) {
      return res.status(400).json({ 
        error: "Cannot delete currently active pricing. Deactivate it first." 
      });
    }
    
    const result = await db.query('DELETE FROM item_choice_pricing WHERE id = $1', [id]);
    
    res.json({ message: "Item choice pricing deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;