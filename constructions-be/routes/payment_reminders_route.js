const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PaymentReminders
 *   description: API for managing payment reminders
 */

/**
 * @swagger
 * /payment-reminders:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Retrieve all payment reminders from the payment_reminders table
 *     responses:
 *       200:
 *         description: List of payment reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   reminder_id:
 *                     type: integer
 *                   payment_id:
 *                     type: integer
 *                   installment_id:
 *                     type: integer
 *                   reminder_date:
 *                     type: string
 *                     format: date
 *                   reminder_type:
 *                     type: string
 *                   reminder_message:
 *                     type: string
 *                   sent_by:
 *                     type: integer
 *                   response_received:
 *                     type: boolean
 *                   response_notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

// Get all payment reminders
router.get('/payment-reminders', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM payment_reminders ORDER BY reminder_date DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-reminders/{id}:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Retrieve a specific payment reminder by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment reminder to retrieve
 *     responses:
 *       200:
 *         description: Payment reminder details
 *       404:
 *         description: Payment reminder not found
 *       500:
 *         description: Internal server error
 */

// Get payment reminder by ID
router.get('/payment-reminders/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM payment_reminders WHERE reminder_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment reminder not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-reminders:
 *   post:
 *     summary: Create a new payment reminder
 *     tags: [PaymentReminders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reminder_date
 *             properties:
 *               payment_id:
 *                 type: integer
 *               installment_id:
 *                 type: integer
 *               reminder_date:
 *                 type: string
 *                 format: date
 *               reminder_type:
 *                 type: string
 *               reminder_message:
 *                 type: string
 *               sent_by:
 *                 type: integer
 *               response_received:
 *                 type: boolean
 *               response_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment reminder created successfully
 *       400:
 *         description: Reminder date is required
 *       500:
 *         description: Internal server error
 */
router.post('/payment-reminders', async (req, res) => {
  const db = req.db;
  const {
    payment_id,
    installment_id,
    reminder_date,
    reminder_type,
    reminder_message,
    sent_by,
    response_received,
    response_notes
  } = req.body;

  if (!reminder_date) {
    return res.status(400).json({ error: "Reminder date is required" });
  }

  try {
    const query = `
      INSERT INTO payment_reminders (
        payment_id, installment_id, reminder_date, reminder_type,
        reminder_message, sent_by, response_received, response_notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      payment_id,
      installment_id,
      reminder_date,
      reminder_type,
      reminder_message,
      sent_by,
      response_received === true ? true : false,
      response_notes
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
 * /payment-reminders/{id}:
 *   put:
 *     summary: Update an existing payment reminder by ID
 *     tags: [PaymentReminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment reminder to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reminder_date
 *             properties:
 *               payment_id:
 *                 type: integer
 *               installment_id:
 *                 type: integer
 *               reminder_date:
 *                 type: string
 *                 format: date
 *               reminder_type:
 *                 type: string
 *               reminder_message:
 *                 type: string
 *               sent_by:
 *                 type: integer
 *               response_received:
 *                 type: boolean
 *               response_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment reminder updated successfully
 *       400:
 *         description: Reminder date is required
 *       404:
 *         description: Payment reminder not found
 *       500:
 *         description: Internal server error
 */
router.put('/payment-reminders/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    payment_id,
    installment_id,
    reminder_date,
    reminder_type,
    reminder_message,
    sent_by,
    response_received,
    response_notes
  } = req.body;

  if (!reminder_date) {
    return res.status(400).json({ error: "Reminder date is required" });
  }

  try {
    const query = `
      UPDATE payment_reminders 
      SET 
        payment_id = $1,
        installment_id = $2,
        reminder_date = $3,
        reminder_type = $4,
        reminder_message = $5,
        sent_by = $6,
        response_received = $7,
        response_notes = $8
      WHERE reminder_id = $9
      RETURNING *
    `;
    
    const values = [
      payment_id,
      installment_id,
      reminder_date,
      reminder_type,
      reminder_message,
      sent_by,
      response_received === true ? true : false,
      response_notes,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment reminder not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-reminders/{id}:
 *   delete:
 *     summary: Delete a payment reminder by ID
 *     tags: [PaymentReminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment reminder to delete
 *     responses:
 *       200:
 *         description: Payment reminder deleted successfully
 *       404:
 *         description: Payment reminder not found
 *       500:
 *         description: Internal server error
 */
router.delete('/payment-reminders/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM payment_reminders WHERE reminder_id = $1 RETURNING reminder_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment reminder not found" });
    }
    
    res.json({ message: "Payment reminder deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-reminders/payment/{paymentId}:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Retrieve all reminders for a specific payment
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment
 *     responses:
 *       200:
 *         description: List of reminders for the payment
 *       500:
 *         description: Internal server error
 */
router.get('/payment-reminders/payment/:paymentId', async (req, res) => {
  const db = req.db;
  const { paymentId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_reminders WHERE payment_id = $1 ORDER BY reminder_date DESC", 
      [paymentId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-reminders/installment/{installmentId}:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Retrieve all reminders for a specific installment
 *     parameters:
 *       - in: path
 *         name: installmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the installment
 *     responses:
 *       200:
 *         description: List of reminders for the installment
 *       500:
 *         description: Internal server error
 */
router.get('/payment-reminders/installment/:installmentId', async (req, res) => {
  const db = req.db;
  const { installmentId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_reminders WHERE installment_id = $1 ORDER BY reminder_date DESC", 
      [installmentId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-reminders/type/{type}:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Retrieve reminders by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of reminders to retrieve
 *     responses:
 *       200:
 *         description: List of reminders of the specified type
 *       500:
 *         description: Internal server error
 */
router.get('/payment-reminders/type/:type', async (req, res) => {
  const db = req.db;
  const { type } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_reminders WHERE reminder_type = $1 ORDER BY reminder_date DESC", 
      [type]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-reminders/pending:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Retrieve all pending reminders (no response received)
 *     responses:
 *       200:
 *         description: List of pending reminders
 *       500:
 *         description: Internal server error
 */
router.get('/payment-reminders/pending', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_reminders WHERE response_received = false ORDER BY reminder_date ASC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-reminders/search:
 *   get:
 *     tags: [PaymentReminders]
 *     description: Search reminders by message content
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for reminder message
 *     responses:
 *       200:
 *         description: List of reminders matching the search criteria
 *       500:
 *         description: Internal server error
 */
router.get('/payment-reminders/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(
      `SELECT * FROM payment_reminders 
       WHERE reminder_message ILIKE $1 
       OR response_notes ILIKE $1
       ORDER BY reminder_date DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;