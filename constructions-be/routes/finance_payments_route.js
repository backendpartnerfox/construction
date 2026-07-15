const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FinancePayment:
 *       type: object
 *       required:
 *         - payment_type_id
 *         - payment_method_id
 *         - payment_amount
 *         - payment_date
 *         - payment_purpose
 *         - received_by
 *       properties:
 *         payment_id:
 *           type: integer
 *           description: Auto-generated unique payment ID
 *           example: 1
 *         payment_number:
 *           type: string
 *           description: Unique payment reference number
 *           example: "PAY-2024-001"
 *         receipt_number:
 *           type: string
 *           description: Receipt reference number
 *           example: "RCP-2024-001"
 *         lead_id:
 *           type: integer
 *           description: Associated lead ID
 *           example: 123
 *         client_id:
 *           type: integer
 *           description: Associated client ID
 *           example: 456
 *         quotation_id:
 *           type: integer
 *           description: Associated quotation ID
 *           example: 789
 *         payment_type_id:
 *           type: integer
 *           description: Payment type ID (required)
 *           example: 1
 *         payment_method_id:
 *           type: integer
 *           description: Payment method ID (required)
 *           example: 3
 *         payment_amount:
 *           type: number
 *           format: float
 *           description: Payment amount (required)
 *           example: 25000.50
 *         payment_date:
 *           type: string
 *           format: date
 *           description: Payment date (required)
 *           example: "2024-12-25"
 *         cheque_number:
 *           type: string
 *           description: Cheque number (if payment by cheque)
 *           example: "CHQ123456"
 *         cheque_date:
 *           type: string
 *           format: date
 *           description: Cheque date
 *           example: "2024-12-25"
 *         bank_name:
 *           type: string
 *           description: Bank name
 *           example: "State Bank of India"
 *         branch_name:
 *           type: string
 *           description: Bank branch name
 *           example: "Main Branch Delhi"
 *         upi_transaction_id:
 *           type: string
 *           description: UPI transaction ID
 *           example: "UPI123456789"
 *         online_reference_number:
 *           type: string
 *           description: Online payment reference number
 *           example: "REF123456789"
 *         card_last_four_digits:
 *           type: string
 *           description: Last 4 digits of card used
 *           example: "1234"
 *         paying_account_holder:
 *           type: string
 *           description: Name of the account holder making payment
 *           example: "John Doe"
 *         paying_account_number:
 *           type: string
 *           description: Account number of payer
 *           example: "1234567890"
 *         paying_bank_name:
 *           type: string
 *           description: Payer's bank name
 *           example: "HDFC Bank"
 *         paying_ifsc_code:
 *           type: string
 *           description: Payer's bank IFSC code
 *           example: "HDFC0001234"
 *         received_in_account:
 *           type: string
 *           description: Account where payment was received
 *           example: "Company Current Account"
 *         received_account_number:
 *           type: string
 *           description: Receiver's account number
 *           example: "0987654321"
 *         received_bank_name:
 *           type: string
 *           description: Receiver's bank name
 *           example: "ICICI Bank"
 *         payment_verified:
 *           type: boolean
 *           description: Payment verification status
 *           example: true
 *         verified_by:
 *           type: string
 *           description: Name of person who verified payment
 *           example: "Finance Manager"
 *         verification_date:
 *           type: string
 *           format: date-time
 *           description: Date and time of verification
 *           example: "2024-12-25T10:30:00.000Z"
 *         verification_notes:
 *           type: string
 *           description: Notes about verification
 *           example: "Payment verified against bank statement"
 *         payment_cleared:
 *           type: boolean
 *           description: Payment clearance status
 *           example: true
 *         clearance_date:
 *           type: string
 *           format: date-time
 *           description: Date and time of clearance
 *           example: "2024-12-26T14:30:00.000Z"
 *         clearance_notes:
 *           type: string
 *           description: Notes about clearance
 *           example: "Payment cleared successfully"
 *         payment_purpose:
 *           type: string
 *           description: Purpose of payment (required)
 *           example: "Project advance payment"
 *         project_title:
 *           type: string
 *           description: Associated project title
 *           example: "Website Development Project"
 *         payment_stage:
 *           type: string
 *           description: Payment stage/milestone
 *           example: "Advance"
 *         tds_applicable:
 *           type: boolean
 *           description: Whether TDS is applicable
 *           example: true
 *         tds_percentage:
 *           type: number
 *           format: float
 *           description: TDS percentage
 *           example: 10.0
 *         tds_amount:
 *           type: number
 *           format: float
 *           description: TDS amount deducted
 *           example: 2500.05
 *         gst_applicable:
 *           type: boolean
 *           description: Whether GST is applicable
 *           example: true
 *         gst_percentage:
 *           type: number
 *           format: float
 *           description: GST percentage
 *           example: 18.0
 *         gst_amount:
 *           type: number
 *           format: float
 *           description: GST amount
 *           example: 4500.09
 *         gross_amount:
 *           type: number
 *           format: float
 *           description: Gross amount before deductions
 *           example: 30000.64
 *         net_amount_received:
 *           type: number
 *           format: float
 *           description: Net amount received after deductions
 *           example: 25000.50
 *         status:
 *           type: string
 *           description: Payment status
 *           enum: [Received, Pending, Verified, Cleared, Rejected]
 *           example: "Received"
 *         payment_notes:
 *           type: string
 *           description: General payment notes
 *           example: "Initial project payment received"
 *         internal_notes:
 *           type: string
 *           description: Internal notes for team
 *           example: "Follow up required for project timeline"
 *         received_by:
 *           type: string
 *           description: Name of person who received payment (required)
 *           example: "Admin User"
 *         processed_by:
 *           type: string
 *           description: Name of person who processed payment
 *           example: "Finance Team"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-12-25T08:30:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-12-25T10:30:00.000Z"
 *     
 *     CreatePaymentRequest:
 *       type: object
 *       required:
 *         - payment_type_id
 *         - payment_method_id
 *         - payment_amount
 *         - payment_date
 *         - payment_purpose
 *         - received_by
 *       properties:
 *         payment_number:
 *           type: string
 *           example: "PAY-2024-001"
 *         receipt_number:
 *           type: string
 *           example: "RCP-2024-001"
 *         lead_id:
 *           type: integer
 *           example: 123
 *         client_id:
 *           type: integer
 *           example: 456
 *         quotation_id:
 *           type: integer
 *           example: 789
 *         payment_type_id:
 *           type: integer
 *           example: 1
 *         payment_method_id:
 *           type: integer
 *           example: 3
 *         payment_amount:
 *           type: number
 *           format: float
 *           example: 25000.50
 *         payment_date:
 *           type: string
 *           format: date
 *           example: "2024-12-25"
 *         cheque_number:
 *           type: string
 *           example: "CHQ123456"
 *         cheque_date:
 *           type: string
 *           format: date
 *           example: "2024-12-25"
 *         bank_name:
 *           type: string
 *           example: "State Bank of India"
 *         branch_name:
 *           type: string
 *           example: "Main Branch Delhi"
 *         upi_transaction_id:
 *           type: string
 *           example: "UPI123456789"
 *         online_reference_number:
 *           type: string
 *           example: "REF123456789"
 *         card_last_four_digits:
 *           type: string
 *           example: "1234"
 *         paying_account_holder:
 *           type: string
 *           example: "John Doe"
 *         paying_account_number:
 *           type: string
 *           example: "1234567890"
 *         paying_bank_name:
 *           type: string
 *           example: "HDFC Bank"
 *         paying_ifsc_code:
 *           type: string
 *           example: "HDFC0001234"
 *         received_in_account:
 *           type: string
 *           example: "Company Current Account"
 *         received_account_number:
 *           type: string
 *           example: "0987654321"
 *         received_bank_name:
 *           type: string
 *           example: "ICICI Bank"
 *         payment_purpose:
 *           type: string
 *           example: "Project advance payment"
 *         project_title:
 *           type: string
 *           example: "Website Development Project"
 *         payment_stage:
 *           type: string
 *           example: "Advance"
 *         tds_applicable:
 *           type: boolean
 *           example: true
 *         tds_percentage:
 *           type: number
 *           format: float
 *           example: 10.0
 *         tds_amount:
 *           type: number
 *           format: float
 *           example: 2500.05
 *         gst_applicable:
 *           type: boolean
 *           example: true
 *         gst_percentage:
 *           type: number
 *           format: float
 *           example: 18.0
 *         gst_amount:
 *           type: number
 *           format: float
 *           example: 4500.09
 *         status:
 *           type: string
 *           enum: [Received, Pending, Verified, Cleared, Rejected]
 *           example: "Received"
 *         payment_notes:
 *           type: string
 *           example: "Initial project payment received"
 *         received_by:
 *           type: string
 *           example: "Admin User"
 *     
 *     UpdatePaymentRequest:
 *       type: object
 *       required:
 *         - payment_amount
 *       properties:
 *         payment_number:
 *           type: string
 *         receipt_number:
 *           type: string
 *         lead_id:
 *           type: integer
 *         client_id:
 *           type: integer
 *         quotation_id:
 *           type: integer
 *         payment_type_id:
 *           type: integer
 *         payment_method_id:
 *           type: integer
 *         payment_amount:
 *           type: number
 *           format: float
 *         payment_date:
 *           type: string
 *           format: date
 *         payment_verified:
 *           type: boolean
 *         verified_by:
 *           type: string
 *         verification_date:
 *           type: string
 *           format: date-time
 *         verification_notes:
 *           type: string
 *         payment_cleared:
 *           type: boolean
 *         clearance_date:
 *           type: string
 *           format: date-time
 *         clearance_notes:
 *           type: string
 *         payment_purpose:
 *           type: string
 *         project_title:
 *           type: string
 *         payment_stage:
 *           type: string
 *         tds_applicable:
 *           type: boolean
 *         tds_percentage:
 *           type: number
 *           format: float
 *         tds_amount:
 *           type: number
 *           format: float
 *         gst_applicable:
 *           type: boolean
 *         gst_percentage:
 *           type: number
 *           format: float
 *         gst_amount:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *           enum: [Received, Pending, Verified, Cleared, Rejected]
 *         payment_notes:
 *           type: string
 *         internal_notes:
 *           type: string
 *         received_by:
 *           type: string
 *         processed_by:
 *           type: string
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Payment not found"
 *     
 *     Success:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Operation completed successfully"
 *         payment_id:
 *           type: integer
 *           description: Payment ID
 *           example: 123
 * 
 * tags:
 *   name: Finance Payments
 *   description: Complete API for managing finance payments, receipts, and transactions
 */

/**
 * @swagger
 * /finance_payments:
 *   get:
 *     summary: Get all finance payments
 *     tags: [Finance Payments]
 *     description: Retrieve a comprehensive list of all finance payments ordered by creation date (newest first)
 *     responses:
 *       200:
 *         description: Successfully retrieved list of finance payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancePayment'
 *             example:
 *               - payment_id: 1
 *                 payment_number: "PAY-2024-001"
 *                 payment_amount: 25000.50
 *                 payment_date: "2024-12-25"
 *                 status: "Received"
 *                 received_by: "Admin User"
 *               - payment_id: 2
 *                 payment_number: "PAY-2024-002"
 *                 payment_amount: 15000.00
 *                 payment_date: "2024-12-24"
 *                 status: "Verified"
 *                 received_by: "Finance Team"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM finance_payments ORDER BY created_at DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /finance_payments/{id}:
 *   get:
 *     summary: Get finance payment by ID
 *     tags: [Finance Payments]
 *     description: Retrieve detailed information about a specific finance payment using its unique ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique payment ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 123
 *     responses:
 *       200:
 *         description: Successfully retrieved finance payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancePayment'
 *       404:
 *         description: Finance payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM finance_payments WHERE payment_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Finance payment not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /finance_payments:
 *   post:
 *     summary: Create a new finance payment
 *     tags: [Finance Payments]
 *     description: Create a new finance payment record with comprehensive payment details including tax calculations, bank information, and verification status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *           example:
 *             payment_number: "PAY-2024-001"
 *             receipt_number: "RCP-2024-001"
 *             lead_id: 123
 *             client_id: 456
 *             payment_type_id: 1
 *             payment_method_id: 3
 *             payment_amount: 25000.50
 *             payment_date: "2024-12-25"
 *             payment_purpose: "Project advance payment"
 *             project_title: "Website Development Project"
 *             tds_applicable: true
 *             tds_percentage: 10.0
 *             tds_amount: 2500.05
 *             gst_applicable: true
 *             gst_percentage: 18.0
 *             gst_amount: 4500.09
 *             status: "Received"
 *             received_by: "Admin User"
 *     responses:
 *       201:
 *         description: Finance payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/FinancePayment'
 *                 - type: object
 *                   properties:
 *                     payment_id:
 *                       type: integer
 *                       description: Auto-generated payment ID
 *       400:
 *         description: Bad request - missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    payment_number,
    receipt_number,
    lead_id,
    client_id,
    quotation_id,
    payment_type_id,
    payment_method_id,
    payment_amount,
    payment_date,
    cheque_number,
    cheque_date,
    bank_name,
    branch_name,
    upi_transaction_id,
    online_reference_number,
    card_last_four_digits,
    paying_account_holder,
    paying_account_number,
    paying_bank_name,
    paying_ifsc_code,
    received_in_account,
    received_account_number,
    received_bank_name,
    payment_purpose,
    project_title,
    payment_stage,
    tds_applicable,
    tds_percentage,
    tds_amount,
    gst_applicable,
    gst_percentage,
    gst_amount,
    gross_amount,
    net_amount_received,
    status,
    payment_notes,
    received_by
  } = req.body;

  // Validate required fields
  if (!payment_type_id || !payment_method_id || !payment_amount || !payment_date || !payment_purpose || !received_by) {
    return res.status(400).json({ error: "Payment type, method, amount, date, purpose, and received by are required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO finance_payments (
        payment_number, receipt_number, lead_id, client_id, quotation_id, payment_type_id,
        payment_method_id, payment_amount, payment_date, cheque_number, cheque_date, bank_name,
        branch_name, upi_transaction_id, online_reference_number, card_last_four_digits,
        paying_account_holder, paying_account_number, paying_bank_name, paying_ifsc_code,
        received_in_account, received_account_number, received_bank_name, payment_purpose,
        project_title, payment_stage, tds_applicable, tds_percentage, tds_amount,
        gst_applicable, gst_percentage, gst_amount,
        status, payment_notes, received_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, CURRENT_TIMESTAMP) 
       RETURNING payment_id, gross_amount, net_amount_received`,
      [
        payment_number || null,
        receipt_number || null,
        lead_id || null,
        client_id || null,
        quotation_id || null,
        payment_type_id,
        payment_method_id,
        payment_amount,
        payment_date,
        cheque_number || null,
        cheque_date || null,
        bank_name || null,
        branch_name || null,
        upi_transaction_id || null,
        online_reference_number || null,
        card_last_four_digits || null,
        paying_account_holder || null,
        paying_account_number || null,
        paying_bank_name || null,
        paying_ifsc_code || null,
        received_in_account || null,
        received_account_number || null,
        received_bank_name || null,
        payment_purpose,
        project_title || null,
        payment_stage || null,
        tds_applicable || false,
        tds_percentage || 0,
        tds_amount || 0,
        gst_applicable || false,
        gst_percentage || 0,
        gst_amount || 0,
        status || 'Received',
        payment_notes || null,
        received_by
      ]
    );

    res.status(201).json({ 
      payment_id: result.rows[0].payment_id,
      payment_number,
      receipt_number,
      lead_id,
      client_id,
      quotation_id,
      payment_type_id,
      payment_method_id,
      payment_amount,
      payment_date,
      payment_purpose,
      project_title,
      payment_stage,
      tds_applicable: tds_applicable || false,
      tds_percentage: tds_percentage || 0,
      tds_amount: tds_amount || 0,
      gst_applicable: gst_applicable || false,
      gst_percentage: gst_percentage || 0,
      gst_amount: gst_amount || 0,
      gross_amount: result.rows[0].gross_amount,
      net_amount_received: result.rows[0].net_amount_received,
      status: status || 'Received',
      payment_notes,
      received_by
    });

  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /finance_payments/{id}:
 *   put:
 *     summary: Update finance payment
 *     tags: [Finance Payments]
 *     description: Update an existing finance payment record with new information including verification and clearance details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payment ID to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentRequest'
 *           example:
 *             payment_amount: 25000.50
 *             payment_verified: true
 *             verified_by: "Finance Manager"
 *             verification_date: "2024-12-25T10:30:00.000Z"
 *             verification_notes: "Payment verified against bank statement"
 *             status: "Verified"
 *     responses:
 *       200:
 *         description: Finance payment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Finance payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    payment_number,
    receipt_number,
    lead_id,
    client_id,
    quotation_id,
    payment_type_id,
    payment_method_id,
    payment_amount,
    payment_date,
    cheque_number,
    cheque_date,
    bank_name,
    branch_name,
    upi_transaction_id,
    online_reference_number,
    card_last_four_digits,
    paying_account_holder,
    paying_account_number,
    paying_bank_name,
    paying_ifsc_code,
    received_in_account,
    received_account_number,
    received_bank_name,
    payment_verified,
    verified_by,
    verification_date,
    verification_notes,
    payment_cleared,
    clearance_date,
    clearance_notes,
    payment_purpose,
    project_title,
    payment_stage,
    tds_applicable,
    tds_percentage,
    tds_amount,
    gst_applicable,
    gst_percentage,
    gst_amount,
    gross_amount,
    net_amount_received,
    status,
    payment_notes,
    internal_notes,
    received_by,
    processed_by
  } = req.body;

  if (!payment_amount) {
    return res.status(400).json({ error: "Payment amount is required" });
  }

  try {
    const result = await db.query(
      `UPDATE finance_payments 
       SET payment_number = $1, receipt_number = $2, lead_id = $3, client_id = $4,
           quotation_id = $5, payment_type_id = $6, payment_method_id = $7, payment_amount = $8,
           payment_date = $9, cheque_number = $10, cheque_date = $11, bank_name = $12,
           branch_name = $13, upi_transaction_id = $14, online_reference_number = $15,
           card_last_four_digits = $16, paying_account_holder = $17, paying_account_number = $18,
           paying_bank_name = $19, paying_ifsc_code = $20, received_in_account = $21,
           received_account_number = $22, received_bank_name = $23, payment_verified = $24,
           verified_by = $25, verification_date = $26, verification_notes = $27,
           payment_cleared = $28, clearance_date = $29, clearance_notes = $30,
           payment_purpose = $31, project_title = $32, payment_stage = $33,
           tds_applicable = $34, tds_percentage = $35, tds_amount = $36,
           gst_applicable = $37, gst_percentage = $38, gst_amount = $39,
           status = $40, payment_notes = $41, internal_notes = $42, 
           received_by = $43, processed_by = $44, updated_at = CURRENT_TIMESTAMP
       WHERE payment_id = $45`,
      [
        payment_number,
        receipt_number,
        lead_id,
        client_id,
        quotation_id,
        payment_type_id,
        payment_method_id,
        payment_amount,
        payment_date,
        cheque_number,
        cheque_date,
        bank_name,
        branch_name,
        upi_transaction_id,
        online_reference_number,
        card_last_four_digits,
        paying_account_holder,
        paying_account_number,
        paying_bank_name,
        paying_ifsc_code,
        received_in_account,
        received_account_number,
        received_bank_name,
        payment_verified,
        verified_by,
        verification_date,
        verification_notes,
        payment_cleared,
        clearance_date,
        clearance_notes,
        payment_purpose,
        project_title,
        payment_stage,
        tds_applicable,
        tds_percentage,
        tds_amount,
        gst_applicable,
        gst_percentage,
        gst_amount,
        status,
        payment_notes,
        internal_notes,
        received_by,
        processed_by,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Finance payment not found" });
    }

    res.json({ 
      payment_id: Number(id),
      message: "Finance payment updated successfully"
    });
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /finance_payments/{id}:
 *   delete:
 *     summary: Delete finance payment
 *     tags: [Finance Payments]
 *     description: Permanently delete a finance payment record from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payment ID to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 123
 *     responses:
 *       200:
 *         description: Finance payment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               message: "Finance payment deleted successfully"
 *       404:
 *         description: Finance payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Finance payment not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM finance_payments WHERE payment_id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Finance payment not found" });
    }
    
    res.json({ message: "Finance payment deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /finance_payments/lead/{leadId}:
 *   get:
 *     summary: Get payments by lead ID
 *     tags: [Finance Payments]
 *     description: Retrieve all payments associated with a specific lead, ordered by payment date (newest first)
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: Lead ID to filter payments
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 123
 *     responses:
 *       200:
 *         description: Successfully retrieved payments for the lead
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancePayment'
 *             example:
 *               - payment_id: 1
 *                 lead_id: 123
 *                 payment_amount: 25000.50
 *                 payment_date: "2024-12-25"
 *                 status: "Received"
 *               - payment_id: 2
 *                 lead_id: 123
 *                 payment_amount: 15000.00
 *                 payment_date: "2024-12-20"
 *                 status: "Verified"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM finance_payments WHERE lead_id = $1 ORDER BY payment_date DESC",
      [leadId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /finance_payments/client/{clientId}:
 *   get:
 *     summary: Get payments by client ID
 *     tags: [Finance Payments]
 *     description: Retrieve all payments associated with a specific client, ordered by payment date (newest first)
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         description: Client ID to filter payments
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 456
 *     responses:
 *       200:
 *         description: Successfully retrieved payments for the client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancePayment'
 *             example:
 *               - payment_id: 1
 *                 client_id: 456
 *                 payment_amount: 25000.50
 *                 payment_date: "2024-12-25"
 *                 status: "Received"
 *               - payment_id: 3
 *                 client_id: 456
 *                 payment_amount: 35000.00
 *                 payment_date: "2024-12-15"
 *                 status: "Cleared"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/client/:clientId', async (req, res) => {
  const db = req.db;
  const { clientId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM finance_payments WHERE client_id = $1 ORDER BY payment_date DESC",
      [clientId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /finance_payments/status/{status}:
 *   get:
 *     summary: Get payments by status
 *     tags: [Finance Payments]
 *     description: Retrieve all payments with a specific status, ordered by payment date (newest first)
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         description: Payment status to filter by
 *         schema:
 *           type: string
 *           enum: [Received, Pending, Verified, Cleared, Rejected]
 *         example: "Received"
 *     responses:
 *       200:
 *         description: Successfully retrieved payments with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancePayment'
 *             example:
 *               - payment_id: 1
 *                 payment_amount: 25000.50
 *                 payment_date: "2024-12-25"
 *                 status: "Received"
 *               - payment_id: 4
 *                 payment_amount: 18000.00
 *                 payment_date: "2024-12-22"
 *                 status: "Received"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM finance_payments WHERE status = $1 ORDER BY payment_date DESC",
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
 * /finance_payments/verified:
 *   get:
 *     summary: Get verified payments
 *     tags: [Finance Payments]
 *     description: Retrieve all payments that have been verified, ordered by verification date (newest first)
 *     responses:
 *       200:
 *         description: Successfully retrieved list of verified payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancePayment'
 *             example:
 *               - payment_id: 2
 *                 payment_amount: 15000.00
 *                 payment_verified: true
 *                 verified_by: "Finance Manager"
 *                 verification_date: "2024-12-25T10:30:00.000Z"
 *                 status: "Verified"
 *               - payment_id: 5
 *                 payment_amount: 30000.00
 *                 payment_verified: true
 *                 verified_by: "Admin User"
 *                 verification_date: "2024-12-24T15:45:00.000Z"
 *                 status: "Verified"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verified', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM finance_payments WHERE payment_verified = true ORDER BY verification_date DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /finance_payments/unverified:
 *   get:
 *     summary: Get unverified payments
 *     tags: [Finance Payments]
 *     description: Retrieve all payments that have not been verified yet, ordered by payment date (newest first)
 *     responses:
 *       200:
 *         description: Successfully retrieved list of unverified payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancePayment'
 *             example:
 *               - payment_id: 1
 *                 payment_amount: 25000.50
 *                 payment_verified: false
 *                 verified_by: null
 *                 verification_date: null
 *                 status: "Received"
 *               - payment_id: 6
 *                 payment_amount: 12000.00
 *                 payment_verified: null
 *                 verified_by: null
 *                 verification_date: null
 *                 status: "Pending"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/unverified', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM finance_payments WHERE payment_verified = false OR payment_verified IS NULL ORDER BY payment_date DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;