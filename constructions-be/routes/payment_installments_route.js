const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PaymentInstallments
 *   description: API for managing payment installments
 */

/**
 * @swagger
 * /payment-installments:
 *   get:
 *     tags: [PaymentInstallments]
 *     description: Retrieve all payment installments
 *     responses:
 *       200:
 *         description: List of payment installments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   installment_id:
 *                     type: integer
 *                   payment_id:
 *                     type: integer
 *                   installment_number:
 *                     type: integer
 *                   installment_amount:
 *                     type: number
 *                   due_date:
 *                     type: string
 *                     format: date
 *                   paid_date:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                     enum: ['Pending', 'Paid', 'Overdue', 'Cancelled']
 *                   notes:
 *                     type: string
 */

// Get all payment installments
router.get('/payment-installments', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM payment_installments ORDER BY due_date DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-installments/{id}:
 *   get:
 *     tags: [PaymentInstallments]
 *     description: Retrieve a specific payment installment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment installment to retrieve
 *     responses:
 *       200:
 *         description: Payment installment details
 *       404:
 *         description: Payment installment not found
 *       500:
 *         description: Internal server error
 */

// Get payment installment by ID
router.get('/payment-installments/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM payment_installments WHERE installment_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment installment not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-installments:
 *   post:
 *     summary: Create a new payment installment
 *     tags: [PaymentInstallments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_id
 *               - installment_number
 *               - installment_amount
 *               - due_date
 *             properties:
 *               payment_id:
 *                 type: integer
 *               installment_number:
 *                 type: integer
 *               installment_amount:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date
 *               paid_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: ['Pending', 'Paid', 'Overdue', 'Cancelled']
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment installment created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/payment-installments', async (req, res) => {
  const db = req.db;
  const {
    payment_id,
    installment_number,
    installment_amount,
    due_date,
    paid_date,
    status,
    notes
  } = req.body;

  if (!payment_id || !installment_number || !installment_amount || !due_date) {
    return res.status(400).json({ error: "Payment ID, Installment Number, Amount, and Due Date are required" });
  }

  try {
    const query = `
      INSERT INTO payment_installments (
        payment_id, installment_number, installment_amount, due_date, 
        paid_date, status, notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      payment_id,
      installment_number,
      installment_amount,
      due_date,
      paid_date,
      status || 'Pending',
      notes
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
 * /payment-installments/{id}:
 *   put:
 *     summary: Update an existing payment installment by ID
 *     tags: [PaymentInstallments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment installment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_id
 *               - installment_number
 *               - installment_amount
 *               - due_date
 *             properties:
 *               payment_id:
 *                 type: integer
 *               installment_number:
 *                 type: integer
 *               installment_amount:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date
 *               paid_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: ['Pending', 'Paid', 'Overdue', 'Cancelled']
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment installment updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Payment installment not found
 *       500:
 *         description: Internal server error
 */
router.put('/payment-installments/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    payment_id,
    installment_number,
    installment_amount,
    due_date,
    paid_date,
    status,
    notes
  } = req.body;

  if (!payment_id || !installment_number || !installment_amount || !due_date) {
    return res.status(400).json({ error: "Payment ID, Installment Number, Amount, and Due Date are required" });
  }

  try {
    const query = `
      UPDATE payment_installments 
      SET 
        payment_id = $1,
        installment_number = $2,
        installment_amount = $3,
        due_date = $4,
        paid_date = $5,
        status = $6,
        notes = $7
      WHERE installment_id = $8
      RETURNING *
    `;
    
    const values = [
      payment_id,
      installment_number,
      installment_amount,
      due_date,
      paid_date,
      status || 'Pending',
      notes,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment installment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-installments/{id}:
 *   delete:
 *     summary: Delete a payment installment by ID
 *     tags: [PaymentInstallments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment installment to delete
 *     responses:
 *       200:
 *         description: Payment installment deleted successfully
 *       404:
 *         description: Payment installment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/payment-installments/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM payment_installments WHERE installment_id = $1 RETURNING installment_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment installment not found" });
    }
    
    res.json({ message: "Payment installment deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /payment-installments/payment/{paymentId}:
 *   get:
 *     tags: [PaymentInstallments]
 *     description: Retrieve all installments for a specific payment
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the payment
 *     responses:
 *       200:
 *         description: List of installments for the payment
 *       500:
 *         description: Internal server error
 */
router.get('/payment-installments/payment/:paymentId', async (req, res) => {
  const db = req.db;
  const { paymentId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_installments WHERE payment_id = $1 ORDER BY installment_number ASC", 
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
 * /payment-installments/status/{status}:
 *   get:
 *     tags: [PaymentInstallments]
 *     description: Retrieve all installments by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['Pending', 'Paid', 'Overdue', 'Cancelled']
 *         description: The status of installments to retrieve
 *     responses:
 *       200:
 *         description: List of installments with specified status
 *       500:
 *         description: Internal server error
 */
router.get('/payment-installments/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM payment_installments WHERE status = $1 ORDER BY due_date ASC", 
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-installments/overdue:
 *   get:
 *     tags: [PaymentInstallments]
 *     description: Retrieve all overdue installments
 *     responses:
 *       200:
 *         description: List of overdue installments
 *       500:
 *         description: Internal server error
 */
router.get('/payment-installments/overdue', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      `SELECT * FROM payment_installments 
       WHERE due_date < CURRENT_DATE 
       AND status = 'Pending' 
       ORDER BY due_date ASC`
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-installments/upcoming:
 *   get:
 *     tags: [PaymentInstallments]
 *     description: Retrieve all upcoming installments (due within next 30 days)
 *     responses:
 *       200:
 *         description: List of upcoming installments
 *       500:
 *         description: Internal server error
 */
router.get('/payment-installments/upcoming', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      `SELECT * FROM payment_installments 
       WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       AND status = 'Pending' 
       ORDER BY due_date ASC`
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /payment-installments/{id}/mark-paid:
 *   patch:
 *     summary: Mark an installment as paid
 *     tags: [PaymentInstallments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the installment to mark as paid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paid_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Installment marked as paid successfully
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Internal server error
 */
router.patch('/payment-installments/:id/mark-paid', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { paid_date, notes } = req.body;

  try {
    const query = `
      UPDATE payment_installments 
      SET 
        status = 'Paid',
        paid_date = $1,
        notes = $2
      WHERE installment_id = $3
      RETURNING *
    `;
    
    const values = [
      paid_date || new Date().toISOString().split('T')[0], // Current date if not provided
      notes,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment installment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;