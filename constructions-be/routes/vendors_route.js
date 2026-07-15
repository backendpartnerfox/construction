const express = require('express');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: API for managing Vendors
 */
/**
 * @swagger
 * /vendors:
 *   get:
 *     tags: [Vendors]
 *     description: Retrieve all vendors
 *     responses:
 *       200:
 *         description: List of vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM vendors');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vendors:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors/{id}:
 *   get:
 *     tags: [Vendors]
 *     description: Retrieve a single vendor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor
 *     responses:
 *       200:
 *         description: A single vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM vendors WHERE vendor_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vendor:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors/type/{vendorTypeId}:
 *   get:
 *     tags: [Vendors]
 *     description: Retrieve all vendors of a specific vendor type
 *     parameters:
 *       - in: path
 *         name: vendorTypeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor type
 *     responses:
 *       200:
 *         description: List of vendors for the specified vendor type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 */
router.get('/type/:vendorTypeId', async (req, res) => {
  const db = req.db;
  const { vendorTypeId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM vendors WHERE vendor_type_id = $1',
      [vendorTypeId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vendors by type:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors:
 *   post:
 *     tags: [Vendors]
 *     description: Create a new vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_name
 *             properties:
 *               vendor_name:
 *                 type: string
 *                 description: Name of the vendor
 *               vendor_type_id:
 *                 type: integer
 *                 description: ID of the vendor type
 *               contact_person:
 *                 type: string
 *                 description: Contact person's name
 *               contact_number:
 *                 type: string
 *                 description: Contact phone number
 *               email:
 *                 type: string
 *                 description: Vendor's email address
 *               address:
 *                 type: string
 *                 description: Vendor's address
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    vendor_name, vendor_type_id, contact_person, 
    contact_number, email, address
  } = req.body;

  if (!vendor_name) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO vendors 
       (vendor_name, vendor_type_id, contact_person, 
        contact_number, email, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vendor_name, vendor_type_id, contact_person, 
       contact_number, email, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vendor:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Invalid vendor type' });
    }
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Vendor already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors/{id}:
 *   put:
 *     tags: [Vendors]
 *     description: Update an existing vendor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_name:
 *                 type: string
 *                 description: Name of the vendor
 *               vendor_type_id:
 *                 type: integer
 *                 description: ID of the vendor type
 *               contact_person:
 *                 type: string
 *                 description: Contact person's name
 *               contact_number:
 *                 type: string
 *                 description: Contact phone number
 *               email:
 *                 type: string
 *                 description: Vendor's email address
 *               address:
 *                 type: string
 *                 description: Vendor's address
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    vendor_name, vendor_type_id, contact_person, 
    contact_number, email, address
  } = req.body;

  if (!vendor_name) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }

  try {
    const result = await db.query(
      `UPDATE vendors 
       SET vendor_name = $1, 
           vendor_type_id = $2, 
           contact_person = $3, 
           contact_number = $4, 
           email = $5, 
           address = $6
       WHERE vendor_id = $7
       RETURNING *`,
      [vendor_name, vendor_type_id, contact_person, 
       contact_number, email, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vendor:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Invalid vendor type' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors/{id}:
 *   delete:
 *     tags: [Vendors]
 *     description: Delete a vendor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor
 *     responses:
 *       204:
 *         description: Vendor deleted successfully
 *       404:
 *         description: Vendor not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM vendors WHERE vendor_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting vendor:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete. Vendor is referenced by other records.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;