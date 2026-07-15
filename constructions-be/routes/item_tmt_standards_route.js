const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Item TMT Standards
 *   description: API for managing TMT (Thermo-Mechanically Treated) steel standards
 */

/**
 * @swagger
 * /item_tmt_standards:
 *   get:
 *     tags: [Item TMT Standards]
 *     description: Retrieve all TMT standards with item information
 *     parameters:
 *       - in: query
 *         name: tmt_item_id
 *         schema:
 *           type: integer
 *         description: Filter by TMT item ID
 *       - in: query
 *         name: dia
 *         schema:
 *           type: number
 *         description: Filter by diameter
 *     responses:
 *       200:
 *         description: List of TMT standards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tmt_standard_id:
 *                     type: integer
 *                   tmt_item_id:
 *                     type: integer
 *                   dia:
 *                     type: number
 *                   length:
 *                     type: number
 *                   weight_per_meter:
 *                     type: number
 *                   weight_of_full_bar:
 *                     type: number
 */

// Get all TMT standards
router.get('/', async (req, res) => {
  const db = req.db;
  const { tmt_item_id, dia } = req.query;
  
  try {
    let query = `
      SELECT its.*, i.item_name
      FROM item_tmt_standards its
      LEFT JOIN items i ON its.tmt_item_id = i.item_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (tmt_item_id) {
      conditions.push(`its.tmt_item_id = $${params.length + 1}`);
      params.push(tmt_item_id);
    }
    
    if (dia) {
      conditions.push(`its.dia = $${params.length + 1}`);
      params.push(dia);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY its.dia, its.length`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/{id}:
 *   get:
 *     tags: [Item TMT Standards]
 *     description: Retrieve a specific TMT standard by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT standard to retrieve
 *     responses:
 *       200:
 *         description: TMT standard details
 *       404:
 *         description: TMT standard not found
 *       500:
 *         description: Internal server error
 */

// Get TMT standard by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT its.*, i.item_name
      FROM item_tmt_standards its
      LEFT JOIN items i ON its.tmt_item_id = i.item_id
      WHERE its.tmt_standard_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'TMT standard not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/item/{itemId}:
 *   get:
 *     tags: [Item TMT Standards]
 *     description: Retrieve all TMT standards for a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item
 *     responses:
 *       200:
 *         description: List of TMT standards for the item
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */

// Get TMT standards by item ID
router.get('/item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    // First check if item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [itemId]);
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const result = await db.query(`
      SELECT *
      FROM item_tmt_standards
      WHERE tmt_item_id = $1
      ORDER BY dia, length
    `, [itemId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/diameter/{dia}:
 *   get:
 *     tags: [Item TMT Standards]
 *     description: Retrieve all TMT standards for a specific diameter
 *     parameters:
 *       - in: path
 *         name: dia
 *         required: true
 *         schema:
 *           type: number
 *         description: The diameter value
 *     responses:
 *       200:
 *         description: List of TMT standards for the diameter
 *       500:
 *         description: Internal server error
 */

// Get TMT standards by diameter
router.get('/diameter/:dia', async (req, res) => {
  const db = req.db;
  const { dia } = req.params;
  
  try {
    const result = await db.query(`
      SELECT its.*, i.item_name
      FROM item_tmt_standards its
      LEFT JOIN items i ON its.tmt_item_id = i.item_id
      WHERE its.dia = $1
      ORDER BY its.length
    `, [dia]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards:
 *   post:
 *     summary: Create a new TMT standard
 *     tags: [Item TMT Standards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tmt_item_id
 *               - dia
 *               - weight_per_meter
 *             properties:
 *               tmt_item_id:
 *                 type: integer
 *               dia:
 *                 type: number
 *               length:
 *                 type: number
 *                 default: 12
 *               weight_per_meter:
 *                 type: number
 *     responses:
 *       201:
 *         description: TMT standard created successfully
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { tmt_item_id, dia, length = 12, weight_per_meter } = req.body;

  // Validate required fields
  if (!tmt_item_id) {
    return res.status(400).json({ error: "TMT item ID is required" });
  }
  if (!dia) {
    return res.status(400).json({ error: "Diameter is required" });
  }
  if (!weight_per_meter) {
    return res.status(400).json({ error: "Weight per meter is required" });
  }

  try {
    // Verify item exists
    const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [tmt_item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Calculate weight of full bar
    const weight_of_full_bar = weight_per_meter * length;

    const result = await db.query(
      `INSERT INTO item_tmt_standards (
        tmt_item_id, dia, length, weight_per_meter, weight_of_full_bar
      ) VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [tmt_item_id, dia, length, weight_per_meter, weight_of_full_bar]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/{id}:
 *   put:
 *     summary: Update an existing TMT standard by ID
 *     tags: [Item TMT Standards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT standard to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tmt_item_id:
 *                 type: integer
 *               dia:
 *                 type: number
 *               length:
 *                 type: number
 *               weight_per_meter:
 *                 type: number
 *     responses:
 *       200:
 *         description: TMT standard updated successfully
 *       404:
 *         description: TMT standard not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { tmt_item_id, dia, length, weight_per_meter } = req.body;

  try {
    // Get current record to calculate weight of full bar
    const currentRecord = await db.query('SELECT * FROM item_tmt_standards WHERE tmt_standard_id = $1', [id]);
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: "TMT standard not found" });
    }

    const current = currentRecord.rows[0];
    
    // Use provided values or keep current ones
    const newLength = length !== undefined ? length : current.length;
    const newWeightPerMeter = weight_per_meter !== undefined ? weight_per_meter : current.weight_per_meter;

    // Recalculate weight of full bar
    const weight_of_full_bar = newWeightPerMeter * newLength;

    // If tmt_item_id is being updated, verify it exists
    if (tmt_item_id && tmt_item_id !== current.tmt_item_id) {
      const itemCheck = await db.query('SELECT item_id FROM items WHERE item_id = $1', [tmt_item_id]);
      if (itemCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
    }

    const result = await db.query(
      `UPDATE item_tmt_standards 
       SET tmt_item_id = COALESCE($1, tmt_item_id),
           dia = COALESCE($2, dia),
           length = $3,
           weight_per_meter = $4,
           weight_of_full_bar = $5
       WHERE tmt_standard_id = $6 
       RETURNING *`,
      [tmt_item_id, dia, newLength, newWeightPerMeter, weight_of_full_bar, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/{id}:
 *   delete:
 *     summary: Delete a TMT standard by ID
 *     tags: [Item TMT Standards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the TMT standard to delete
 *     responses:
 *       200:
 *         description: TMT standard deleted successfully
 *       404:
 *         description: TMT standard not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM item_tmt_standards WHERE tmt_standard_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "TMT standard not found" });
    }
    
    res.json({ message: "TMT standard deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/calculate-weight:
 *   post:
 *     summary: Calculate weight for given diameter and length
 *     tags: [Item TMT Standards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dia
 *               - length
 *             properties:
 *               dia:
 *                 type: number
 *               length:
 *                 type: number
 *     responses:
 *       200:
 *         description: Weight calculation result
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No standard found for given diameter
 *       500:
 *         description: Internal server error
 */
router.post('/calculate-weight', async (req, res) => {
  const db = req.db;
  const { dia, length } = req.body;

  if (!dia || !length) {
    return res.status(400).json({ error: "Diameter and length are required" });
  }

  try {
    // Find the standard for the given diameter
    const result = await db.query(`
      SELECT weight_per_meter
      FROM item_tmt_standards
      WHERE dia = $1
      LIMIT 1
    `, [dia]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No TMT standard found for the given diameter' });
    }

    const weight_per_meter = result.rows[0].weight_per_meter;
    const total_weight = weight_per_meter * length;

    res.json({
      diameter: dia,
      length: length,
      weight_per_meter: weight_per_meter,
      total_weight: total_weight
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /item_tmt_standards/diameters:
 *   get:
 *     tags: [Item TMT Standards]
 *     description: Get all available TMT diameters
 *     responses:
 *       200:
 *         description: List of available diameters
 *       500:
 *         description: Internal server error
 */
router.get('/diameters', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT DISTINCT dia
      FROM item_tmt_standards
      ORDER BY dia
    `);
    
    const diameters = result.rows.map(row => row.dia);
    res.json(diameters);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;