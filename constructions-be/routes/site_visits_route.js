const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Site Visits
 *   description: Physical site visits — scheduled and recorded by Sales / PM.
 */

// Extended in migration 008 to work against enquiries/leads/clients/projects,
// not just projects. Old callers passing only project_id still work; the
// legacy fields (project_id, mom_id, created_by) stay untouched.

const SELECT_FIELDS = `
  v.*,
  u.first_name || ' ' || u.last_name AS visited_by_name,
  p.project_name
`;

const BASE_FROM = `
  FROM site_visits v
  LEFT JOIN users     u ON v.visited_by_user_id = u.id
  LEFT JOIN projects  p ON v.project_id         = p.project_id
`;

// GET /site_visits — list, optional ?status= or ?entity_type= filters
router.get('/', async (req, res) => {
  const { status, entity_type, entity_id } = req.query;
  const where = [];
  const params = [];
  if (status)      { params.push(status);      where.push(`v.status = $${params.length}`); }
  if (entity_type) { params.push(entity_type); where.push(`v.related_entity_type = $${params.length}`); }
  if (entity_id)   { params.push(entity_id);   where.push(`v.related_entity_id = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} ${w} ORDER BY v.visit_date DESC NULLS LAST, v.id DESC`,
      params
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[site_visits list] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /site_visits/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Planned')     AS planned,
         COUNT(*) FILTER (WHERE status = 'Confirmed')   AS confirmed,
         COUNT(*) FILTER (WHERE status = 'Completed')   AS completed,
         COUNT(*) FILTER (WHERE status = 'Cancelled')   AS cancelled,
         COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE
                          AND status NOT IN ('Cancelled','Completed'))          AS upcoming,
         COUNT(*)                                                                AS total
       FROM site_visits`
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[site_visits stats] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /site_visits/entity/:type/:id
router.get('/entity/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!['enquiry','lead','client','project'].includes(type)) {
    return res.status(400).json({ error: 'type must be enquiry|lead|client|project' });
  }
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM}
        WHERE v.related_entity_type = $1 AND v.related_entity_id = $2
        ORDER BY v.visit_date DESC NULLS LAST`,
      [type, id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[site_visits entity] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /site_visits/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE v.id = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Site visit not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[site_visits byId] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /site_visits
router.post('/', async (req, res) => {
  const d = req.body || {};
  try {
    // Auto-generate visit_number as SV-YY-NNN
    const cRes = await req.db.query('SELECT COUNT(*)::int AS n FROM site_visits');
    const seq = cRes.rows[0].n + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    const visitNumber = d.visit_number || `SV-${yy}-${String(seq).padStart(3, '0')}`;

    const r = await req.db.query(
      `INSERT INTO site_visits (
         visit_number, purpose, visit_date, address, city, state,
         visited_by_user_id, related_entity_type, related_entity_id,
         status, attendees, notes, findings, next_action,
         project_id, mom_id, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,'Planned'),$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        visitNumber, d.purpose || null, d.visit_date || null,
        d.address || null, d.city || null, d.state || null,
        d.visited_by_user_id || req.user?.id || null,
        d.related_entity_type || null, d.related_entity_id || null,
        d.status || null, d.attendees || null, d.notes || null,
        d.findings || null, d.next_action || null,
        d.project_id || null, d.mom_id || null,
        d.created_by || req.user?.username || null,
      ]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[site_visits create] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /site_visits/:id
router.put('/:id', async (req, res) => {
  const d = req.body || {};
  try {
    const r = await req.db.query(
      `UPDATE site_visits SET
         purpose             = COALESCE($1,  purpose),
         visit_date          = COALESCE($2,  visit_date),
         address             = COALESCE($3,  address),
         city                = COALESCE($4,  city),
         state               = COALESCE($5,  state),
         visited_by_user_id  = COALESCE($6,  visited_by_user_id),
         related_entity_type = COALESCE($7,  related_entity_type),
         related_entity_id   = COALESCE($8,  related_entity_id),
         status              = COALESCE($9,  status),
         attendees           = COALESCE($10, attendees),
         notes               = COALESCE($11, notes),
         findings            = COALESCE($12, findings),
         next_action         = COALESCE($13, next_action),
         project_id          = COALESCE($14, project_id),
         updated_at          = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [
        d.purpose, d.visit_date, d.address, d.city, d.state,
        d.visited_by_user_id, d.related_entity_type, d.related_entity_id,
        d.status, d.attendees, d.notes, d.findings, d.next_action,
        d.project_id, req.params.id,
      ]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Site visit not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[site_visits update] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /site_visits/:id/status — quick status update
router.patch('/:id/status', async (req, res) => {
  const { status, notes, findings } = req.body || {};
  const ALLOWED = ['Planned','Confirmed','Completed','Cancelled','Rescheduled'];
  if (!ALLOWED.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${ALLOWED.join(', ')}` });
  }
  try {
    const r = await req.db.query(
      `UPDATE site_visits
          SET status     = $1,
              notes      = COALESCE($2, notes),
              findings   = COALESCE($3, findings),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *`,
      [status, notes || null, findings || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[site_visits status] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /site_visits/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await req.db.query(
      'DELETE FROM site_visits WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[site_visits delete] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
