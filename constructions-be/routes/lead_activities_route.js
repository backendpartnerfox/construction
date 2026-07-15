// backend/routes/lead_activities_route.js
// API for managing activities/tasks associated with leads
const express = require('express');
const router = express.Router();

const VALID_TYPES    = ['Call','Email','Meeting','Site_Visit','Follow_Up','Video_Call','Note'];
const VALID_PRIORITY = ['Low','Medium','High','Urgent'];
const VALID_STATUS   = ['Planned','In_Progress','Completed','Cancelled','Overdue'];

// Helper: resolve a valid employee id, fall back to first employee or null
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
 *   name: LeadActivities
 *   description: API for managing lead activities and tasks
 */

// ---------------------------------------------------------------------
// GET /api/lead_activities/lead/:leadId
// MUST be declared before '/:id' so 'lead' isn't captured as an id.
// ---------------------------------------------------------------------
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const leadId = parseInt(req.params.leadId, 10);

  if (isNaN(leadId)) {
    return res.status(400).json({ error: 'Invalid lead ID' });
  }

  try {
    const result = await db.query(
      `SELECT * FROM lead_activities
       WHERE lead_id = $1
       ORDER BY
         CASE WHEN scheduled_datetime IS NULL THEN 1 ELSE 0 END,
         scheduled_datetime DESC,
         created_at DESC`,
      [leadId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[lead_activities] getByLeadId error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/lead_activities  (list all)
// ---------------------------------------------------------------------
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT * FROM lead_activities ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[lead_activities] getAll error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// GET /api/lead_activities/:id
// ---------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM lead_activities WHERE activity_id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[lead_activities] getById error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// POST /api/lead_activities
// ---------------------------------------------------------------------
router.post('/', async (req, res) => {
  const db = req.db;
  const data = req.body;

  console.log('[lead_activities] Creating activity:', data);

  if (!data.lead_id || !data.activity_type || !data.activity_title) {
    return res.status(400).json({
      error: 'lead_id, activity_type and activity_title are required'
    });
  }

  if (!VALID_TYPES.includes(data.activity_type)) {
    return res.status(400).json({
      error: `Invalid activity_type. Must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  const priority = VALID_PRIORITY.includes(data.priority) ? data.priority : 'Medium';
  const status   = VALID_STATUS.includes(data.status)   ? data.status   : 'Planned';

  try {
    // Validate lead exists
    const leadCheck = await db.query(
      'SELECT lead_id FROM leads WHERE lead_id = $1',
      [data.lead_id]
    );
    if (leadCheck.rows.length === 0) {
      return res.status(400).json({ error: `Lead ${data.lead_id} does not exist` });
    }

    const createdBy = await resolveEmployeeId(db, data.created_by);

    const result = await db.query(
      `INSERT INTO lead_activities (
         lead_id, activity_type, activity_title, activity_description,
         scheduled_datetime, duration_minutes, priority, status, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        parseInt(data.lead_id, 10),
        data.activity_type,
        data.activity_title.trim(),
        data.activity_description || null,
        data.scheduled_datetime || null,
        data.duration_minutes ? parseInt(data.duration_minutes, 10) : null,
        priority,
        status,
        createdBy
      ]
    );

    console.log('[lead_activities] ✅ Created activity', result.rows[0].activity_id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[lead_activities] create error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Foreign key violation - invalid lead_id or employee_id' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Check constraint violation - invalid enum value' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// PUT /api/lead_activities/:id
// ---------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  console.log('[lead_activities] Updating activity', id, data);

  if (!data.activity_type || !data.activity_title) {
    return res.status(400).json({ error: 'activity_type and activity_title are required' });
  }
  if (!VALID_TYPES.includes(data.activity_type)) {
    return res.status(400).json({
      error: `Invalid activity_type. Must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  const priority = VALID_PRIORITY.includes(data.priority) ? data.priority : 'Medium';
  const status   = VALID_STATUS.includes(data.status)   ? data.status   : 'Planned';

  try {
    const exists = await db.query(
      'SELECT activity_id FROM lead_activities WHERE activity_id = $1',
      [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const updatedBy = await resolveEmployeeId(db, data.updated_by);

    const result = await db.query(
      `UPDATE lead_activities
       SET activity_type        = $1,
           activity_title       = $2,
           activity_description = $3,
           scheduled_datetime   = $4,
           duration_minutes     = $5,
           priority             = $6,
           status               = $7,
           updated_by           = $8,
           updated_at           = CURRENT_TIMESTAMP
       WHERE activity_id = $9
       RETURNING *`,
      [
        data.activity_type,
        data.activity_title.trim(),
        data.activity_description || null,
        data.scheduled_datetime || null,
        data.duration_minutes ? parseInt(data.duration_minutes, 10) : null,
        priority,
        status,
        updatedBy,
        id
      ]
    );

    console.log('[lead_activities] ✅ Updated activity', id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[lead_activities] update error:', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Foreign key violation' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Check constraint violation - invalid enum value' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// PATCH /api/lead_activities/:id/complete
// ---------------------------------------------------------------------
router.patch('/:id/complete', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { notes } = req.body || {};

  try {
    const exists = await db.query(
      'SELECT activity_id FROM lead_activities WHERE activity_id = $1',
      [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const result = await db.query(
      `UPDATE lead_activities
       SET status           = 'Completed',
           completion_notes = $1,
           completed_at     = CURRENT_TIMESTAMP,
           updated_at       = CURRENT_TIMESTAMP
       WHERE activity_id = $2
       RETURNING *`,
      [notes || null, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[lead_activities] complete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------
// DELETE /api/lead_activities/:id
// ---------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM lead_activities WHERE activity_id = $1 RETURNING activity_id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    console.error('[lead_activities] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
