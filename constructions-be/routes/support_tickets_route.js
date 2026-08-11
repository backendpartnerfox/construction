const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Support Tickets
 *   description: Customer support tickets — logged by CRM, resolved by support/PM.
 */

const SELECT_FIELDS = `
  t.*,
  c.client_name,
  e.contact_person_name  AS enquiry_contact_name,
  p.project_name,
  emp.first_name || ' ' || emp.last_name AS assigned_to_name,
  cu.first_name || ' ' || cu.last_name   AS created_by_name
`;

const BASE_FROM = `
  FROM support_tickets t
  LEFT JOIN clients   c  ON t.client_id  = c.client_id
  LEFT JOIN enquiries e  ON t.enquiry_id = e.enquiry_id
  LEFT JOIN projects  p  ON t.project_id = p.project_id
  LEFT JOIN employees emp ON t.assigned_to = emp.employee_id
  LEFT JOIN users     cu  ON t.created_by  = cu.id
`;

// GET /support_tickets — list with optional ?status= filter
router.get('/', async (req, res) => {
  const { status, priority } = req.query;
  const where = [];
  const params = [];
  if (status)   { params.push(status);   where.push(`t.status = $${params.length}`); }
  if (priority) { params.push(priority); where.push(`t.priority = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} ${whereSql} ORDER BY t.created_at DESC`,
      params
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[support_tickets list] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /support_tickets/stats — counts by status/priority for dashboard tiles
router.get('/stats/summary', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Open')             AS open,
         COUNT(*) FILTER (WHERE status = 'In_Progress')      AS in_progress,
         COUNT(*) FILTER (WHERE status = 'Waiting_On_Customer') AS waiting,
         COUNT(*) FILTER (WHERE status = 'Resolved')         AS resolved,
         COUNT(*) FILTER (WHERE status = 'Closed')           AS closed,
         COUNT(*) FILTER (WHERE priority = 'Urgent' AND status NOT IN ('Resolved','Closed')) AS urgent_open,
         COUNT(*) AS total
       FROM support_tickets`
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[support_tickets stats] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /support_tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE t.ticket_id = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[support_tickets byId] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /support_tickets — create
router.post('/', async (req, res) => {
  const d = req.body || {};
  if (!d.subject) return res.status(400).json({ error: 'subject is required' });

  try {
    // Auto-generate ticket_number as SUP-YY-NNN
    const countRes = await req.db.query('SELECT COUNT(*)::int AS n FROM support_tickets');
    const seq = countRes.rows[0].n + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    const ticketNumber = d.ticket_number || `SUP-${yy}-${String(seq).padStart(3, '0')}`;

    const r = await req.db.query(
      `INSERT INTO support_tickets (
         ticket_number, subject, description, priority, status, category,
         client_id, enquiry_id, project_id,
         contact_name, contact_phone, contact_email,
         assigned_to, created_by
       ) VALUES ($1,$2,$3,COALESCE($4,'Medium'),COALESCE($5,'Open'),$6,
                 $7,$8,$9,
                 $10,$11,$12,
                 $13,$14)
       RETURNING *`,
      [
        ticketNumber, d.subject, d.description || null, d.priority, d.status, d.category || null,
        d.client_id || null, d.enquiry_id || null, d.project_id || null,
        d.contact_name || null, d.contact_phone || null, d.contact_email || null,
        d.assigned_to || null, req.user?.id || null,
      ]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[support_tickets create] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /support_tickets/:id — update
router.put('/:id', async (req, res) => {
  const d = req.body || {};
  try {
    const r = await req.db.query(
      `UPDATE support_tickets SET
         subject        = COALESCE($1, subject),
         description    = COALESCE($2, description),
         priority       = COALESCE($3, priority),
         status         = COALESCE($4, status),
         category       = COALESCE($5, category),
         client_id      = COALESCE($6, client_id),
         enquiry_id     = COALESCE($7, enquiry_id),
         project_id     = COALESCE($8, project_id),
         contact_name   = COALESCE($9, contact_name),
         contact_phone  = COALESCE($10, contact_phone),
         contact_email  = COALESCE($11, contact_email),
         assigned_to    = COALESCE($12, assigned_to),
         resolution     = COALESCE($13, resolution),
         resolved_at    = CASE WHEN $4 IN ('Resolved','Closed') AND resolved_at IS NULL
                               THEN CURRENT_TIMESTAMP ELSE resolved_at END,
         updated_at     = CURRENT_TIMESTAMP
       WHERE ticket_id = $14
       RETURNING *`,
      [
        d.subject, d.description, d.priority, d.status, d.category,
        d.client_id, d.enquiry_id, d.project_id,
        d.contact_name, d.contact_phone, d.contact_email,
        d.assigned_to, d.resolution, req.params.id,
      ]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[support_tickets update] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /support_tickets/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await req.db.query(
      'DELETE FROM support_tickets WHERE ticket_id = $1 RETURNING ticket_id',
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[support_tickets delete] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
