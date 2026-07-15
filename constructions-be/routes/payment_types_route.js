const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PaymentTypes
 *   description: API for managing payment types
 */

/**
 * @swagger
 * /payment-types:
 *   get:
 *     tags: [PaymentTypes]
 *     description: Retrieve all payment types from the payment_types table
 *     responses:
 *       200:
 *         description: List of payment types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   payment_type_id:
 *                     type: integer
 *                   payment_type_name:
 *                     type: string
 *                   payment_category:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 */

// Get all payment types
router.get('/payment-types', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM payment_types ORDER BY payment_type_name');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-types/{id}:
 *   get:
 *     tags: [PaymentTypes]
 *     description: Retrieve a specific payment type by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment type to retrieve
 *     responses:
 *       200:
 *         description: Payment type details
 *       404:
 *         description: Payment type not found
 *       500:
 *         description: Internal server error
 */

// Get payment type by ID
router.get('/payment-types/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM payment_types WHERE payment_type_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment type not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-types:
 *   post:
 *     summary: Create a new payment type
 *     tags: [PaymentTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_type_name
 *             properties:
 *               payment_type_name:
 *                 type: string
 *               payment_category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Payment type created successfully
 *       400:
 *         description: Payment type name is required
 *       500:
 *         description: Internal server error
 */
router.post('/payment-types', async (req, res) => {
  const db = req.db;
  const {
    payment_type_name,
    payment_category,
    is_active
  } = req.body;

  if (!payment_type_name) {
    return res.status(400).json({ error: "Payment type name is required" });
  }

  try {
    const query = `
      INSERT INTO payment_types (
        payment_type_name, payment_category, is_active
      ) 
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      payment_type_name,
      payment_category,
      is_active === false ? false : true
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
 * /payment-types/{id}:
 *   put:
 *     summary: Update an existing payment type by ID
 *     tags: [PaymentTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment type to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_type_name
 *             properties:
 *               payment_type_name:
 *                 type: string
 *               payment_category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment type updated successfully
 *       400:
 *         description: Payment type name is required
 *       404:
 *         description: Payment type not found
 *       500:
 *         description: Internal server error
 */
router.put('/payment-types/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    payment_type_name,
    payment_category,
    is_active
  } = req.body;

  if (!payment_type_name) {
    return res.status(400).json({ error: "Payment type name is required" });
  }

  try {
    const query = `
      UPDATE payment_types 
      SET 
        payment_type_name = $1,
        payment_category = $2,
        is_active = $3
      WHERE payment_type_id = $4
      RETURNING *
    `;
    
    const values = [
      payment_type_name,
      payment_category,
      is_active === false ? false : true,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment type not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-types/{id}:
 *   delete:
 *     summary: Delete a payment type by ID
 *     tags: [PaymentTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment type to delete
 *     responses:
 *       200:
 *         description: Payment type deleted successfully
 *       404:
 *         description: Payment type not found
 *       500:
 *         description: Internal server error
 */
router.delete('/payment-types/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM payment_types WHERE payment_type_id = $1 RETURNING payment_type_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment type not found" });
    }
    
    res.json({ message: "Payment type deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-types/category/{category}:
 *   get:
 *     tags: [PaymentTypes]
 *     description: Retrieve payment types by category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: The category of payment types to retrieve
 *     responses:
 *       200:
 *         description: List of payment types in the specified category
 *       500:
 *         description: Internal server error
 */
router.get('/payment-types/category/:category', async (req, res) => {
  const db = req.db;
  const { category } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_types WHERE payment_category = $1 ORDER BY payment_type_name", 
      [category]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-types/search:
 *   get:
 *     tags: [PaymentTypes]
 *     description: Search payment types by name or category
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for payment type name or category
 *     responses:
 *       200:
 *         description: List of payment types matching the search criteria
 *       500:
 *         description: Internal server error
 */
router.get('/payment-types/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(
      `SELECT * FROM payment_types 
       WHERE payment_type_name ILIKE $1 
       OR payment_category ILIKE $1
       ORDER BY payment_type_name`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-types/active:
 *   get:
 *     tags: [PaymentTypes]
 *     description: Retrieve all active payment types
 *     responses:
 *       200:
 *         description: List of active payment types
 *       500:
 *         description: Internal server error
 */
router.get('/payment-types/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query("SELECT * FROM payment_types WHERE is_active = true ORDER BY payment_type_name");
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;