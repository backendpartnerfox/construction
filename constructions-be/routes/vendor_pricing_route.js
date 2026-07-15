const express = require('express');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Vendor Pricing
 *   description: API for managing construction Vendor Pricing
 */
/**
 * @swagger
 * /vendor_pricing:
 *   get:
 *     tags: [Vendor Pricing]
 *     description: Retrieve all vendor pricing records
 *     responses:
 *       200:
 *         description: List of vendor pricing records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VendorPricing'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM vendor_pricing');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vendor pricing records:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_pricing/{id}:
 *   get:
 *     tags: [Vendor Pricing]
 *     description: Retrieve a single vendor pricing record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor pricing record
 *     responses:
 *       200:
 *         description: A single vendor pricing record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorPricing'
 *       404:
 *         description: Vendor pricing record not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM vendor_pricing WHERE pricing_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor pricing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vendor pricing record:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_pricing/vendor/{vendorId}:
 *   get:
 *     tags: [Vendor Pricing]
 *     description: Retrieve all pricing records for a specific vendor
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor
 *     responses:
 *       200:
 *         description: List of pricing records for the vendor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VendorPricing'
 */
router.get('/vendor/:vendorId', async (req, res) => {
  const db = req.db;
  const { vendorId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM vendor_pricing WHERE vendor_id = $1',
      [vendorId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vendor pricing records:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_pricing:
 *   post:
 *     tags: [Vendor Pricing]
 *     description: Create a new vendor pricing record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *               - item_id
 *               - item_choice_id
 *               - unit_price
 *               - price_date
 *             properties:
 *               vendor_id:
 *                 type: integer
 *                 description: ID of the vendor
 *               item_id:
 *                 type: integer
 *                 description: ID of the item
 *               item_choice_id:
 *                 type: integer
 *                 description: ID of the item choice
 *               specification:
 *                 type: string
 *                 description: Specification details
 *               unit_price:
 *                 type: number
 *                 description: Unit price of the item
 *               gst_percentage:
 *                 type: number
 *                 description: GST percentage
 *               price_date:
 *                 type: string
 *                 format: date
 *                 description: Date of pricing
 *               is_current:
 *                 type: boolean
 *                 description: Whether this is the current pricing
 *     responses:
 *       201:
 *         description: Vendor pricing record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorPricing'
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    vendor_id, item_id, item_choice_id, specification,
    unit_price, gst_percentage, price_date, is_current
  } = req.body;

  // Validate required fields
  if (!vendor_id || !item_id || !item_choice_id || !unit_price || !price_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO vendor_pricing 
       (vendor_id, item_id, item_choice_id, specification, 
        unit_price, gst_percentage, price_date, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [vendor_id, item_id, item_choice_id, specification, 
       unit_price, gst_percentage, price_date, 
       is_current === undefined ? true : is_current]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vendor pricing record:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced entity does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_pricing/{id}:
 *   put:
 *     tags: [Vendor Pricing]
 *     description: Update an existing vendor pricing record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor pricing record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *               - item_id
 *               - item_choice_id
 *               - unit_price
 *               - price_date
 *             properties:
 *               vendor_id:
 *                 type: integer
 *                 description: ID of the vendor
 *               item_id:
 *                 type: integer
 *                 description: ID of the item
 *               item_choice_id:
 *                 type: integer
 *                 description: ID of the item choice
 *               specification:
 *                 type: string
 *                 description: Specification details
 *               unit_price:
 *                 type: number
 *                 description: Unit price of the item
 *               gst_percentage:
 *                 type: number
 *                 description: GST percentage
 *               price_date:
 *                 type: string
 *                 format: date
 *                 description: Date of pricing
 *               is_current:
 *                 type: boolean
 *                 description: Whether this is the current pricing
 *     responses:
 *       200:
 *         description: Vendor pricing record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorPricing'
 *       404:
 *         description: Vendor pricing record not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    vendor_id, item_id, item_choice_id, specification,
    unit_price, gst_percentage, price_date, is_current
  } = req.body;

  // Validate required fields
  if (!vendor_id || !item_id || !item_choice_id || !unit_price || !price_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      `UPDATE vendor_pricing 
       SET vendor_id = $1, 
           item_id = $2, 
           item_choice_id = $3, 
           specification = $4, 
           unit_price = $5, 
           gst_percentage = $6, 
           price_date = $7, 
           is_current = $8
       WHERE pricing_id = $9
       RETURNING *`,
      [vendor_id, item_id, item_choice_id, specification, 
       unit_price, gst_percentage, price_date, 
       is_current === undefined ? true : is_current, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor pricing record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vendor pricing record:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Referenced entity does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_pricing/{id}:
 *   delete:
 *     tags: [Vendor Pricing]
 *     description: Delete a vendor pricing record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor pricing record
 *     responses:
 *       204:
 *         description: Vendor pricing record deleted successfully
 *       404:
 *         description: Vendor pricing record not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM vendor_pricing WHERE pricing_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor pricing record not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor pricing record:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete due to references from other tables' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_pricing/current-pricing:
 *   get:
 *     tags: [Vendor Pricing]
 *     description: Retrieve all current pricing records
 *     responses:
 *       200:
 *         description: List of current vendor pricing records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VendorPricing'
 */
router.get('/current-pricing', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT * FROM vendor_pricing WHERE is_current = TRUE'
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching current pricing records:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;