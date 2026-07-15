const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PaymentMethods
 *   description: API for managing payment methods
 *
 * NOTE: Router is mounted at /api/payment_methods in server.js, so every
 * handler path below is RELATIVE to that mount point (no "/payment-methods"
 * prefix, and no hyphen-vs-underscore mismatch).
 */

// ---------------------------------------------------------------------
// GET /api/payment_methods/active   (must come before '/:id')
// ---------------------------------------------------------------------
router.get('/active', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT * FROM payment_methods WHERE is_active = true ORDER BY method_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[payment_methods] getActive error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/payment_methods/search?query=... (must come before '/:id')
// ---------------------------------------------------------------------
router.get('/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const result = await db.query(
      `SELECT * FROM payment_methods
       WHERE method_name ILIKE $1
       ORDER BY method_name`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[payment_methods] search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/payment_methods    (list all)
// ---------------------------------------------------------------------
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT * FROM payment_methods ORDER BY method_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[payment_methods] getAll error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/payment_methods/:id
// ---------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM payment_methods WHERE payment_method_id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[payment_methods] getById error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/payment_methods
// ---------------------------------------------------------------------
router.post('/', async (req, res) => {
  const db = req.db;
  const { method_name, is_active } = req.body;

  if (!method_name) {
    return res.status(400).json({ error: 'Method name is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO payment_methods (method_name, is_active)
       VALUES ($1, $2)
       RETURNING *`,
      [method_name, is_active === false ? false : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[payment_methods] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// PUT /api/payment_methods/:id
// ---------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { method_name, is_active } = req.body;

  if (!method_name) {
    return res.status(400).json({ error: 'Method name is required' });
  }

  try {
    const result = await db.query(
      `UPDATE payment_methods
       SET method_name = $1, is_active = $2
       WHERE payment_method_id = $3
       RETURNING *`,
      [method_name, is_active === false ? false : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[payment_methods] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// DELETE /api/payment_methods/:id
// ---------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM payment_methods WHERE payment_method_id = $1 RETURNING payment_method_id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.json({ message: 'Payment method deleted successfully' });
  } catch (err) {
    console.error('[payment_methods] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
