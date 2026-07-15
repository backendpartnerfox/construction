const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Work Orders
 *   description: API for managing work orders
 */

/**
 * @swagger
 * /work_orders:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve all work orders
 *     responses:
 *       200:
 *         description: List of work orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   work_order_id:
 *                     type: integer
 *                   module_id:
 *                     type: integer
 *                   wo_number:
 *                     type: string
 *                   wo_date:
 *                     type: string
 *                     format: date
 *                   vendor_id:
 *                     type: integer
 *                   vendor_type:
 *                     type: string
 *                   scope_of_work:
 *                     type: string
 *                   deliverables:
 *                     type: array
 *                   order_value:
 *                     type: number
 *                   payment_terms:
 *                     type: string
 *                   delivery_schedule:
 *                     type: string
 *                   valid_from:
 *                     type: string
 *                     format: date
 *                   valid_until:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                   issued_date:
 *                     type: string
 *                     format: date
 *                   completion_date:
 *                     type: string
 *                     format: date
 *                   approved_by:
 *                     type: integer
 *                   approval_date:
 *                     type: string
 *                     format: date
 *                   wo_document_path:
 *                     type: string
 */

// Get all work orders
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM work_orders ORDER BY work_order_id DESC');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_orders/{id}:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve a specific work order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work order to retrieve
 *     responses:
 *       200:
 *         description: Work order details
 *       404:
 *         description: Work order not found
 *       500:
 *         description: Internal server error
 */

// Get work order by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM work_orders WHERE work_order_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_orders:
 *   post:
 *     summary: Create a new work order
 *     tags: [Work Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module_id
 *               - wo_number
 *               - vendor_id
 *             properties:
 *               module_id:
 *                 type: integer
 *               wo_number:
 *                 type: string
 *               wo_date:
 *                 type: string
 *                 format: date
 *               vendor_id:
 *                 type: integer
 *               vendor_type:
 *                 type: string
 *               scope_of_work:
 *                 type: string
 *               deliverables:
 *                 type: array
 *               order_value:
 *                 type: number
 *               payment_terms:
 *                 type: string
 *               delivery_schedule:
 *                 type: string
 *               valid_from:
 *                 type: string
 *                 format: date
 *               valid_until:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               issued_date:
 *                 type: string
 *                 format: date
 *               completion_date:
 *                 type: string
 *                 format: date
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *               wo_document_path:
 *                 type: string
 *     responses:
 *       201:
 *         description: Work order created successfully
 *       400:
 *         description: Required fields are missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    module_id,
    wo_number,
    wo_date,
    vendor_id,
    vendor_type,
    scope_of_work,
    deliverables,
    order_value,
    payment_terms,
    delivery_schedule,
    valid_from,
    valid_until,
    status,
    issued_date,
    completion_date,
    approved_by,
    approval_date,
    wo_document_path
  } = req.body;

  if (!module_id || !wo_number || !vendor_id) {
    return res.status(400).json({ error: "Module ID, WO number, and vendor ID are required" });
  }

  try {
    const query = `
      INSERT INTO work_orders (
        module_id, wo_number, wo_date, vendor_id, vendor_type, scope_of_work,
        deliverables, order_value, payment_terms, delivery_schedule, valid_from,
        valid_until, status, issued_date, completion_date, approved_by,
        approval_date, wo_document_path
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `;
    
    const values = [
      module_id,
      wo_number,
      wo_date || new Date().toISOString().split('T')[0],
      vendor_id,
      vendor_type,
      scope_of_work,
      deliverables,
      order_value,
      payment_terms,
      delivery_schedule,
      valid_from,
      valid_until,
      status || 'Draft',
      issued_date,
      completion_date,
      approved_by,
      approval_date,
      wo_document_path
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
 * /work_orders/{id}:
 *   put:
 *     summary: Update an existing work order by ID
 *     tags: [Work Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module_id
 *               - wo_number
 *               - vendor_id
 *             properties:
 *               module_id:
 *                 type: integer
 *               wo_number:
 *                 type: string
 *               wo_date:
 *                 type: string
 *                 format: date
 *               vendor_id:
 *                 type: integer
 *               vendor_type:
 *                 type: string
 *               scope_of_work:
 *                 type: string
 *               deliverables:
 *                 type: array
 *               order_value:
 *                 type: number
 *               payment_terms:
 *                 type: string
 *               delivery_schedule:
 *                 type: string
 *               valid_from:
 *                 type: string
 *                 format: date
 *               valid_until:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               issued_date:
 *                 type: string
 *                 format: date
 *               completion_date:
 *                 type: string
 *                 format: date
 *               approved_by:
 *                 type: integer
 *               approval_date:
 *                 type: string
 *                 format: date
 *               wo_document_path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work order updated successfully
 *       400:
 *         description: Required fields are missing
 *       404:
 *         description: Work order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    module_id,
    wo_number,
    wo_date,
    vendor_id,
    vendor_type,
    scope_of_work,
    deliverables,
    order_value,
    payment_terms,
    delivery_schedule,
    valid_from,
    valid_until,
    status,
    issued_date,
    completion_date,
    approved_by,
    approval_date,
    wo_document_path
  } = req.body;

  if (!module_id || !wo_number || !vendor_id) {
    return res.status(400).json({ error: "Module ID, WO number, and vendor ID are required" });
  }

  try {
    const query = `
      UPDATE work_orders 
      SET 
        module_id = $1,
        wo_number = $2,
        wo_date = $3,
        vendor_id = $4,
        vendor_type = $5,
        scope_of_work = $6,
        deliverables = $7,
        order_value = $8,
        payment_terms = $9,
        delivery_schedule = $10,
        valid_from = $11,
        valid_until = $12,
        status = $13,
        issued_date = $14,
        completion_date = $15,
        approved_by = $16,
        approval_date = $17,
        wo_document_path = $18
      WHERE work_order_id = $19
      RETURNING *
    `;
    
    const values = [
      module_id,
      wo_number,
      wo_date,
      vendor_id,
      vendor_type,
      scope_of_work,
      deliverables,
      order_value,
      payment_terms,
      delivery_schedule,
      valid_from,
      valid_until,
      status,
      issued_date,
      completion_date,
      approved_by,
      approval_date,
      wo_document_path,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Work order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_orders/{id}:
 *   delete:
 *     summary: Delete a work order by ID
 *     tags: [Work Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the work order to delete
 *     responses:
 *       200:
 *         description: Work order deleted successfully
 *       404:
 *         description: Work order not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM work_orders WHERE work_order_id = $1 RETURNING work_order_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Work order not found" });
    }
    
    res.json({ message: "Work order deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /work_orders/by-vendor/{vendorId}:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve work orders by vendor ID
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The vendor ID to retrieve work orders for
 *     responses:
 *       200:
 *         description: List of work orders for the specified vendor
 *       500:
 *         description: Internal server error
 */
router.get('/by-vendor/:vendorId', async (req, res) => {
  const db = req.db;
  const { vendorId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_orders WHERE vendor_id = $1 ORDER BY wo_date DESC", 
      [vendorId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_orders/by-status/{status}:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve work orders by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status to filter work orders by
 *     responses:
 *       200:
 *         description: List of work orders with the specified status
 *       500:
 *         description: Internal server error
 */
router.get('/by-status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_orders WHERE status = $1 ORDER BY wo_date DESC", 
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
 * /work_orders/by-module/{moduleId}:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve work orders by module ID
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The module ID to retrieve work orders for
 *     responses:
 *       200:
 *         description: List of work orders for the specified module
 *       500:
 *         description: Internal server error
 */
router.get('/by-module/:moduleId', async (req, res) => {
  const db = req.db;
  const { moduleId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_orders WHERE module_id = $1 ORDER BY wo_date DESC", 
      [moduleId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_orders/active:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve all active work orders
 *     responses:
 *       200:
 *         description: List of active work orders
 *       500:
 *         description: Internal server error
 */
router.get('/active', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_orders WHERE status IN ('Active', 'In Progress', 'Issued') ORDER BY wo_date DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /work_orders/completed:
 *   get:
 *     tags: [Work Orders]
 *     description: Retrieve all completed work orders
 *     responses:
 *       200:
 *         description: List of completed work orders
 *       500:
 *         description: Internal server error
 */
router.get('/completed', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM work_orders WHERE completion_date IS NOT NULL ORDER BY completion_date DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;