const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Item Choices
 *   description: Auto-generated API docs for Item Choices
 */


// Get all item choices (with latest active pricing joined via LEFT JOIN LATERAL)
/**

 * @swagger

 * /item_choices/:

 *   get:

 *     tags: [Item Choices]

 *     summary: GET /item_choices/

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT ic.*,
             icp.id                  AS price_pricing_id,
             icp.base_price,
             icp.gst_percentage      AS price_gst_percentage,
             icp.gst_amount          AS price_gst_amount,
             icp.total_price,
             icp.unit_of_measurement AS price_unit
      FROM item_choices ic
      LEFT JOIN LATERAL (
        SELECT id, base_price, gst_percentage, gst_amount, total_price, unit_of_measurement
        FROM item_choice_pricing p
        WHERE p.choice_option_id = ic.choice_option_id AND p.is_active = TRUE
        ORDER BY p.effective_from DESC NULLS LAST, p.updated_at DESC
        LIMIT 1
      ) icp ON TRUE
      ORDER BY ic.display_name
    `);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({
      success: false,
      error: queryErr.message
    });
  }
});

// Get item choices by item ID - CRITICAL FOR DROPDOWNS
/**

 * @swagger

 * /item_choices/item/{itemId}:

 *   get:

 *     tags: [Item Choices]

 *     summary: GET /item_choices/item/{itemId}

 *     parameters:

 *       - in: path

 *         name: itemId

 *         required: true

 *         schema:

 *           type: string

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    console.log('Fetching item choices for item:', itemId);
    
    const result = await db.query(`
      SELECT 
        choice_option_id,
        item_id,
        item_material_type,
        brand,
        series,
        sub_series,
        model,
        code,
        parent_choice_id,
        display_name,
        description,
        image_url,
        is_premium,
        package,
        is_default,
        is_active,
        created_at,
        updated_at
      FROM item_choices 
      WHERE item_id = $1 AND is_active = TRUE
      ORDER BY is_default DESC, display_name ASC
    `, [itemId]);
    
    console.log(`Found ${result.rows.length} item choices for item ${itemId}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get item choice by ID
/**

 * @swagger

 * /item_choices/{id}:

 *   get:

 *     tags: [Item Choices]

 *     summary: GET /item_choices/{id}

 *     parameters:

 *       - in: path

 *         name: id

 *         required: true

 *         schema:

 *           type: string

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM item_choices WHERE choice_option_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Item choice not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Create new item choice
/**

 * @swagger

 * /item_choices/:

 *   post:

 *     tags: [Item Choices]

 *     summary: POST /item_choices/

 *     requestBody:

 *       required: false

 *       content:

 *         application/json:

 *           schema:

 *             type: object

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.post('/', async (req, res) => {
  const db = req.db;
  const {
    item_id,
    item_material_type,
    brand,
    series,
    sub_series,
    model,
    code,
    parent_choice_id,
    display_name,
    description,
    image_url,
    is_premium,
    package: packageValue,
    is_default,
    is_active
  } = req.body;

  if (!item_id || !display_name) {
    return res.status(400).json({ 
      success: false,
      error: "Item ID and display name are required" 
    });
  }

  try {
    const query = `
      INSERT INTO item_choices (
        item_id, item_material_type, brand, series, sub_series, model, code,
        parent_choice_id, display_name, description, image_url,
        is_premium, package, is_default, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      item_id, item_material_type, brand, series, sub_series, model, code,
      parent_choice_id, display_name, description, image_url,
      is_premium || false, packageValue || 0, is_default || false, is_active !== false
    ];

    const result = await db.query(query, values);
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Update item choice
/**

 * @swagger

 * /item_choices/{id}:

 *   put:

 *     tags: [Item Choices]

 *     summary: PUT /item_choices/{id}

 *     parameters:

 *       - in: path

 *         name: id

 *         required: true

 *         schema:

 *           type: string

 *     requestBody:

 *       required: false

 *       content:

 *         application/json:

 *           schema:

 *             type: object

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'choice_option_id' && key !== 'created_at') {
        // Handle 'package' keyword by using quotes
        const fieldName = key === 'package' ? '"package"' : key;
        fields.push(`${fieldName} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE item_choices 
      SET ${fields.join(', ')}
      WHERE choice_option_id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Item choice not found" 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Delete item choice
/**

 * @swagger

 * /item_choices/{id}:

 *   delete:

 *     tags: [Item Choices]

 *     summary: DELETE /item_choices/{id}

 *     parameters:

 *       - in: path

 *         name: id

 *         required: true

 *         schema:

 *           type: string

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM item_choices WHERE choice_option_id = $1 RETURNING choice_option_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Item choice not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Item choice deleted successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get item choices by brand
/**

 * @swagger

 * /item_choices/brand/{brand}:

 *   get:

 *     tags: [Item Choices]

 *     summary: GET /item_choices/brand/{brand}

 *     parameters:

 *       - in: path

 *         name: brand

 *         required: true

 *         schema:

 *           type: string

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.get('/brand/:brand', async (req, res) => {
  const db = req.db;
  const { brand } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM item_choices WHERE brand = $1 AND is_active = TRUE ORDER BY display_name", 
      [brand]
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get active item choices
/**

 * @swagger

 * /item_choices/status/active:

 *   get:

 *     tags: [Item Choices]

 *     summary: GET /item_choices/status/active

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.get('/status/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM item_choices WHERE is_active = TRUE ORDER BY display_name");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get default item choices
/**

 * @swagger

 * /item_choices/status/default:

 *   get:

 *     tags: [Item Choices]

 *     summary: GET /item_choices/status/default

 *     responses:

 *       200:

 *         description: OK

 *       400:

 *         description: Bad request

 *       404:

 *         description: Not found

 *       500:

 *         description: Server error

 */

router.get('/status/default', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM item_choices WHERE is_default = TRUE ORDER BY display_name");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

module.exports = router;
