// backend/routes/lead_quotation_history_route.js
// API for managing lead quotation history / version audit trail
const express = require('express');
const router = express.Router();

// Helper: resolve a valid employee id for changed_by, fall back to first employee
async function resolveEmployeeId(db, candidate) {
  if (candidate) {
    const check = await db.query(
      'SELECT employee_id FROM employees WHERE employee_id = $1',
      [candidate]
    );
    if (check.rows.length > 0) return candidate;
  }
  const first = await db.query(
    'SELECT employee_id FROM employees ORDER BY employee_id LIMIT 1'
  );
  return first.rows.length > 0 ? first.rows[0].employee_id : null;
}

/**
 * @swagger
 * tags:
 *   name: LeadQuotationHistory
 *   description: API for managing lead quotation history
 */

// ---------------------------------------------------------------------
// GET /api/lead_quotation_history/lead/:leadId
// All history records across every quotation for a given lead.
// MUST come before '/:history_id' so 'lead' isn't captured as an id.
// ---------------------------------------------------------------------
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const leadId = parseInt(req.params.leadId, 10);

  if (isNaN(leadId)) {
    return res.status(400).json({ success: false, error: 'Invalid lead ID' });
  }

  try {
    const result = await db.query(
      `SELECT lqh.*, lq.lead_quotation_number
       FROM lead_quotation_history lqh
       JOIN lead_quotations lq ON lqh.lead_quotation_id = lq.lead_quotation_id
       WHERE lq.lead_id = $1
       ORDER BY lqh.change_date DESC`,
      [leadId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[lead_quotation_history] getByLeadId error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/lead_quotation_history/quotation/:quotationId
// ---------------------------------------------------------------------
router.get('/quotation/:quotationId', async (req, res) => {
  const db = req.db;
  const quotationId = parseInt(req.params.quotationId, 10);

  if (isNaN(quotationId)) {
    return res.status(400).json({ success: false, error: 'Invalid quotation ID' });
  }

  try {
    const result = await db.query(
      `SELECT * FROM lead_quotation_history
       WHERE lead_quotation_id = $1
       ORDER BY version_number DESC, change_date DESC`,
      [quotationId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[lead_quotation_history] getByQuotationId error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/lead_quotation_history  (list all)
// ---------------------------------------------------------------------
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT * FROM lead_quotation_history ORDER BY change_date DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[lead_quotation_history] getAll error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/lead_quotation_history/:history_id
// ---------------------------------------------------------------------
router.get('/:history_id', async (req, res) => {
  const db = req.db;
  const { history_id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM lead_quotation_history WHERE history_id = $1',
      [history_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'History record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[lead_quotation_history] getById error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/lead_quotation_history
// Auto-generates version_number (MAX+1 for that quotation) and
// resolves changed_by against employees table (with fallback).
// Only lead_quotation_id is required from the client.
// ---------------------------------------------------------------------
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    lead_quotation_id,
    version_number,       // optional - auto-generated if missing
    change_type,
    change_description,
    total_amount_snapshot,
    package_rate_snapshot,
    habitable_area_snapshot,
    balcony_area_snapshot,
    stilt_area_snapshot,
    changes_made,
    reason_for_change,
    client_feedback_received,
    negotiation_stage,
    client_counter_offer,
    our_response,
    status_at_time,
    changed_by,           // optional - resolved to first employee if missing
    quotation_file_path,
    history_notes
  } = req.body;

  console.log('[lead_quotation_history] Creating record:', req.body);

  if (!lead_quotation_id) {
    return res.status(400).json({ success: false, error: 'lead_quotation_id is required' });
  }

  try {
    // Validate the quotation exists
    const qCheck = await db.query(
      'SELECT lead_quotation_id FROM lead_quotations WHERE lead_quotation_id = $1',
      [lead_quotation_id]
    );
    if (qCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: `Quotation ${lead_quotation_id} does not exist`
      });
    }

    // Auto-compute version_number if not provided
    let finalVersion = parseInt(version_number, 10);
    if (!finalVersion || isNaN(finalVersion)) {
      const vr = await db.query(
        `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
         FROM lead_quotation_history
         WHERE lead_quotation_id = $1`,
        [lead_quotation_id]
      );
      finalVersion = vr.rows[0].next_version;
    }

    // Resolve changed_by
    const finalChangedBy = await resolveEmployeeId(db, changed_by);
    if (!finalChangedBy) {
      return res.status(400).json({
        success: false,
        error: 'No valid employee found for changed_by (employees table empty?)'
      });
    }

    const result = await db.query(
      `INSERT INTO lead_quotation_history (
         lead_quotation_id, version_number, change_type, change_description,
         total_amount_snapshot, package_rate_snapshot, habitable_area_snapshot,
         balcony_area_snapshot, stilt_area_snapshot, changes_made, reason_for_change,
         client_feedback_received, negotiation_stage, client_counter_offer, our_response,
         status_at_time, changed_by, quotation_file_path, history_notes, change_date
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP
       ) RETURNING *`,
      [
        parseInt(lead_quotation_id, 10),
        finalVersion,
        change_type || null,
        change_description || null,
        total_amount_snapshot ? parseFloat(total_amount_snapshot) : null,
        package_rate_snapshot ? parseFloat(package_rate_snapshot) : null,
        habitable_area_snapshot ? parseFloat(habitable_area_snapshot) : null,
        balcony_area_snapshot ? parseFloat(balcony_area_snapshot) : null,
        stilt_area_snapshot ? parseFloat(stilt_area_snapshot) : null,
        changes_made || null,
        reason_for_change || null,
        client_feedback_received || null,
        negotiation_stage || null,
        client_counter_offer ? parseFloat(client_counter_offer) : null,
        our_response || null,
        status_at_time || null,
        finalChangedBy,
        quotation_file_path || null,
        history_notes || null
      ]
    );

    console.log('[lead_quotation_history] ✅ Created history_id', result.rows[0].history_id, 'v', finalVersion);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[lead_quotation_history] create error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ success: false, error: 'Foreign key violation' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// PUT /api/lead_quotation_history/:history_id
// ---------------------------------------------------------------------
router.put('/:history_id', async (req, res) => {
  const db = req.db;
  const { history_id } = req.params;
  const b = req.body;

  try {
    const exists = await db.query(
      'SELECT history_id FROM lead_quotation_history WHERE history_id = $1',
      [history_id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'History record not found' });
    }

    const finalChangedBy = b.changed_by
      ? await resolveEmployeeId(db, b.changed_by)
      : null;

    const result = await db.query(
      `UPDATE lead_quotation_history SET
         lead_quotation_id        = COALESCE($1, lead_quotation_id),
         version_number           = COALESCE($2, version_number),
         change_type              = $3,
         change_description       = $4,
         total_amount_snapshot    = $5,
         package_rate_snapshot    = $6,
         habitable_area_snapshot  = $7,
         balcony_area_snapshot    = $8,
         stilt_area_snapshot      = $9,
         changes_made             = $10,
         reason_for_change        = $11,
         client_feedback_received = $12,
         negotiation_stage        = $13,
         client_counter_offer     = $14,
         our_response             = $15,
         status_at_time           = $16,
         changed_by               = COALESCE($17, changed_by),
         quotation_file_path      = $18,
         history_notes            = $19
       WHERE history_id = $20
       RETURNING *`,
      [
        b.lead_quotation_id ? parseInt(b.lead_quotation_id, 10) : null,
        b.version_number    ? parseInt(b.version_number, 10)    : null,
        b.change_type || null,
        b.change_description || null,
        b.total_amount_snapshot    ? parseFloat(b.total_amount_snapshot)    : null,
        b.package_rate_snapshot    ? parseFloat(b.package_rate_snapshot)    : null,
        b.habitable_area_snapshot  ? parseFloat(b.habitable_area_snapshot)  : null,
        b.balcony_area_snapshot    ? parseFloat(b.balcony_area_snapshot)    : null,
        b.stilt_area_snapshot      ? parseFloat(b.stilt_area_snapshot)      : null,
        b.changes_made || null,
        b.reason_for_change || null,
        b.client_feedback_received || null,
        b.negotiation_stage || null,
        b.client_counter_offer ? parseFloat(b.client_counter_offer) : null,
        b.our_response || null,
        b.status_at_time || null,
        finalChangedBy,
        b.quotation_file_path || null,
        b.history_notes || null,
        history_id
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[lead_quotation_history] update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// DELETE /api/lead_quotation_history/:history_id
// ---------------------------------------------------------------------
router.delete('/:history_id', async (req, res) => {
  const db = req.db;
  const { history_id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM lead_quotation_history WHERE history_id = $1 RETURNING history_id',
      [history_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'History record not found' });
    }
    res.json({ success: true, message: 'History record deleted successfully' });
  } catch (err) {
    console.error('[lead_quotation_history] delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
