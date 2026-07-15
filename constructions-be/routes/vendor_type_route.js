const express = require('express');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Vendor Types
 *   description: API for managing construction Vendor Types
 */
/**
 * @swagger
 * /vendor_type:
 *   get:
 *     tags: [Vendor Types]
 *     description: Retrieve all vendor types
 *     responses:
 *       200:
 *         description: List of vendor types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VendorType'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM vendor_type');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vendor types:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_type/{id}:
 *   get:
 *     tags: [Vendor Types]
 *     description: Retrieve a single vendor type by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor type
 *     responses:
 *       200:
 *         description: A single vendor type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorType'
 *       404:
 *         description: Vendor type not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM vendor_type WHERE vendor_type_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vendor type:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_type:
 *   post:
 *     tags: [Vendor Types]
 *     description: Create a new vendor type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_type
 *             properties:
 *               vendor_type:
 *                 type: string
 *                 description: Name of the vendor type
 *     responses:
 *       201:
 *         description: Vendor type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorType'
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { vendor_type } = req.body;

  if (!vendor_type) {
    return res.status(400).json({ error: 'Vendor type is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO vendor_type (vendor_type) VALUES ($1) RETURNING *',
      [vendor_type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vendor type:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Vendor type already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_type/{id}:
 *   put:
 *     tags: [Vendor Types]
 *     description: Update an existing vendor type
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_type
 *             properties:
 *               vendor_type:
 *                 type: string
 *                 description: Updated name of the vendor type
 *     responses:
 *       200:
 *         description: Vendor type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorType'
 *       404:
 *         description: Vendor type not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { vendor_type } = req.body;

  if (!vendor_type) {
    return res.status(400).json({ error: 'Vendor type is required' });
  }

  try {
    const result = await db.query(
      'UPDATE vendor_type SET vendor_type = $1 WHERE vendor_type_id = $2 RETURNING *',
      [vendor_type, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor type not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vendor type:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Vendor type already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendor_type/{id}:
 *   delete:
 *     tags: [Vendor Types]
 *     description: Delete a vendor type
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor type
 *     responses:
 *       204:
 *         description: Vendor type deleted successfully
 *       404:
 *         description: Vendor type not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM vendor_type WHERE vendor_type_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor type not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor type:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete. Vendor type is referenced by existing vendors.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;