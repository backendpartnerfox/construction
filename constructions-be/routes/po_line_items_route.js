const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PO Line Items
 *   description: API for managing purchase order line items
 */

/**
 * @swagger
 * /po-line-items:
 *   get:
 *     tags: [PO Line Items]
 *     description: Retrieve all purchase order line items
 *     responses:
 *       200:
 *         description: List of purchase order line items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   po_line_id:
 *                     type: integer
 *                   po_id:
 *                     type: integer
 *                   line_number:
 *                     type: integer
 *                   item_id:
 *                     type: integer
 *                   item_description:
 *                     type: string
 *                   specifications:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   unit_price:
 *                     type: number
 *                   discount_percentage:
 *                     type: number
 *                   tax_percentage:
 *                     type: number
 *                   line_total:
 *                     type: number
 *                   required_by_date:
 *                     type: string
 *                     format: date
 */

// Get all PO line items
router.get('/po-line-items', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM po_line_items ORDER BY po_line_id');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /po-line-items/{id}:
 *   get:
 *     tags: [PO Line Items]
 *     description: Retrieve a specific PO line item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the PO line item to retrieve
 *     responses:
 *       200:
 *         description: PO line item details
 *       404:
 *         description: PO line item not found
 *       500:
 *         description: Internal server error
 */

// Get PO line item by ID
router.get('/po-line-items/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM po_line_items WHERE po_line_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PO line item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /po-line-items:
 *   post:
 *     summary: Create a new PO line item
 *     tags: [PO Line Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - po_id
 *               - line_number
 *               - item_id
 *             properties:
 *               po_id:
 *                 type: integer
 *               line_number:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_description:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               tax_percentage:
 *                 type: number
 *               line_total:
 *                 type: number
 *               required_by_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: PO line item created successfully
 *       400:
 *         description: Required fields are missing
 *       500:
 *         description: Internal server error
 */
router.post('/po-line-items', async (req, res) => {
  const db = req.db;
  const {
    po_id,
    line_number,
    item_id,
    item_description,
    specifications,
    quantity,
    unit,
    unit_price,
    discount_percentage,
    tax_percentage,
    line_total,
    required_by_date
  } = req.body;

  if (!po_id || !line_number || !item_id) {
    return res.status(400).json({ error: "PO ID, line number, and item ID are required" });
  }

  try {
    const query = `
      INSERT INTO po_line_items (
        po_id, line_number, item_id, item_description, specifications,
        quantity, unit, unit_price, discount_percentage, tax_percentage,
        line_total, required_by_date
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      po_id,
      line_number,
      item_id,
      item_description,
      specifications,
      quantity,
      unit,
      unit_price,
      discount_percentage || 0,
      tax_percentage,
      line_total,
      required_by_date
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
 * /po-line-items/{id}:
 *   put:
 *     summary: Update an existing PO line item by ID
 *     tags: [PO Line Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the PO line item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - po_id
 *               - line_number
 *               - item_id
 *             properties:
 *               po_id:
 *                 type: integer
 *               line_number:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_description:
 *                 type: string
 *               specifications:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               tax_percentage:
 *                 type: number
 *               line_total:
 *                 type: number
 *               required_by_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: PO line item updated successfully
 *       400:
 *         description: Required fields are missing
 *       404:
 *         description: PO line item not found
 *       500:
 *         description: Internal server error
 */
router.put('/po-line-items/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    po_id,
    line_number,
    item_id,
    item_description,
    specifications,
    quantity,
    unit,
    unit_price,
    discount_percentage,
    tax_percentage,
    line_total,
    required_by_date
  } = req.body;

  if (!po_id || !line_number || !item_id) {
    return res.status(400).json({ error: "PO ID, line number, and item ID are required" });
  }

  try {
    const query = `
      UPDATE po_line_items 
      SET 
        po_id = $1,
        line_number = $2,
        item_id = $3,
        item_description = $4,
        specifications = $5,
        quantity = $6,
        unit = $7,
        unit_price = $8,
        discount_percentage = $9,
        tax_percentage = $10,
        line_total = $11,
        required_by_date = $12
      WHERE po_line_id = $13
      RETURNING *
    `;
    
    const values = [
      po_id,
      line_number,
      item_id,
      item_description,
      specifications,
      quantity,
      unit,
      unit_price,
      discount_percentage,
      tax_percentage,
      line_total,
      required_by_date,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PO line item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /po-line-items/{id}:
 *   delete:
 *     summary: Delete a PO line item by ID
 *     tags: [PO Line Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the PO line item to delete
 *     responses:
 *       200:
 *         description: PO line item deleted successfully
 *       404:
 *         description: PO line item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/po-line-items/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM po_line_items WHERE po_line_id = $1 RETURNING po_line_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PO line item not found" });
    }
    
    res.json({ message: "PO line item deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /po-line-items/by-po/{poId}:
 *   get:
 *     tags: [PO Line Items]
 *     description: Retrieve PO line items by purchase order ID
 *     parameters:
 *       - in: path
 *         name: poId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The purchase order ID to retrieve line items for
 *     responses:
 *       200:
 *         description: List of PO line items for the specified purchase order
 *       500:
 *         description: Internal server error
 */
router.get('/po-line-items/by-po/:poId', async (req, res) => {
  const db = req.db;
  const { poId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM po_line_items WHERE po_id = $1 ORDER BY line_number", 
      [poId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /po-line-items/by-item/{itemId}:
 *   get:
 *     tags: [PO Line Items]
 *     description: Retrieve PO line items by item ID
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID to retrieve line items for
 *     responses:
 *       200:
 *         description: List of PO line items for the specified item
 *       500:
 *         description: Internal server error
 */
router.get('/po-line-items/by-item/:itemId', async (req, res) => {
  const db = req.db;
  const { itemId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM po_line_items WHERE item_id = $1 ORDER BY po_line_id DESC", 
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
 * /po-line-items/calculate-total/{poId}:
 *   get:
 *     tags: [PO Line Items]
 *     description: Calculate total amount for all line items of a purchase order
 *     parameters:
 *       - in: path
 *         name: poId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The purchase order ID to calculate total for
 *     responses:
 *       200:
 *         description: Total amount calculation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 po_id:
 *                   type: integer
 *                 total_amount:
 *                   type: number
 *                 line_items_count:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/po-line-items/calculate-total/:poId', async (req, res) => {
  const db = req.db;
  const { poId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT SUM(line_total) as total_amount, COUNT(*) as line_items_count FROM po_line_items WHERE po_id = $1", 
      [poId]
    );
    
    res.json({
      po_id: parseInt(poId),
      total_amount: result.rows[0].total_amount || 0,
      line_items_count: parseInt(result.rows[0].line_items_count) || 0
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;