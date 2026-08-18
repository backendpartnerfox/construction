const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Opportunity Actions
 *   description: Sales-initiated follow-ups on opportunities (site visits, quotations, clarifications, technical discussions).
 */

const SELECT_FIELDS = `
  oa.*,
  e.contact_person_name,
  e.company_name,
  e.enquiry_number,
  e.primary_phone,
  e.city AS enquiry_city,
  e.project_type,
  pkg.package_name,
  pkg.total_price_per_sqft AS package_rate,
  assignee.first_name || ' ' || assignee.last_name AS assigned_to_name,
  assignee.username AS assigned_to_username,
  creator.first_name || ' ' || creator.last_name AS created_by_name
`;

const BASE_FROM = `
  FROM opportunity_actions oa
  LEFT JOIN enquiries e    ON oa.enquiry_id = e.enquiry_id
  LEFT JOIN packages pkg   ON oa.package_id = pkg.id
  LEFT JOIN users assignee ON oa.assigned_to_user_id = assignee.id
  LEFT JOIN users creator  ON oa.created_by = creator.id
`;

const ROLE_FOR_ACTION = {
  site_visit:            'project_manager',
  quotation:             'sales',
  clarification:         'designer',
  technical_discussion:  'project_manager',
};

// GET /opportunity_actions — list, optional filters (?status=&role=&enquiry_id=)
router.get('/', async (req, res) => {
  const { status, role, enquiry_id, action_type } = req.query;
  const where = [];
  const params = [];
  if (status)      { params.push(status);      where.push(`oa.status = $${params.length}`); }
  if (role)        { params.push(role);        where.push(`oa.assigned_to_role = $${params.length}`); }
  if (enquiry_id)  { params.push(enquiry_id);  where.push(`oa.enquiry_id = $${params.length}`); }
  if (action_type) { params.push(action_type); where.push(`oa.action_type = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} ${w} ORDER BY oa.created_at DESC`,
      params
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[opp_actions list] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /opportunity_actions/my-queue — queue for the CURRENT user's role
// (i.e. PM sees site_visit + technical_discussion, Designer sees clarification)
router.get('/my-queue', async (req, res) => {
  if (!req.roles || req.roles.length === 0) {
    return res.status(400).json({ error: 'No role attached to session' });
  }
  const roleList = req.roles;   // e.g. ['project_manager']
  const openOnly = req.query.open === 'true' || req.query.open === '1';
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM}
        WHERE oa.assigned_to_role = ANY($1::text[])
          ${openOnly ? "AND oa.status IN ('Pending', 'In_Progress')" : ''}
        ORDER BY
          CASE oa.status WHEN 'Pending' THEN 1 WHEN 'In_Progress' THEN 2 ELSE 3 END,
          oa.created_at DESC`,
      [roleList]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[opp_actions my-queue] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /opportunity_actions/stats/summary — dashboard tiles
router.get('/stats/summary', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Pending')                                                    AS pending,
         COUNT(*) FILTER (WHERE status = 'In_Progress')                                                AS in_progress,
         COUNT(*) FILTER (WHERE status = 'Completed')                                                  AS completed,
         COUNT(*) FILTER (WHERE action_type = 'site_visit' AND status IN ('Pending','In_Progress'))    AS open_site_visits,
         COUNT(*) FILTER (WHERE action_type = 'clarification' AND status IN ('Pending','In_Progress')) AS open_clarifications,
         COUNT(*) FILTER (WHERE action_type = 'technical_discussion' AND status IN ('Pending','In_Progress')) AS open_tech_discussions,
         COUNT(*) FILTER (WHERE action_type = 'quotation'  AND status IN ('Pending','In_Progress'))    AS open_quotations,
         COUNT(*)                                                                                       AS total
       FROM opportunity_actions`
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[opp_actions stats] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /opportunity_actions/enquiry/:enquiryId — all actions on one opportunity
router.get('/enquiry/:enquiryId', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE oa.enquiry_id = $1 ORDER BY oa.created_at DESC`,
      [req.params.enquiryId]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[opp_actions byEnquiry] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /opportunity_actions/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT ${SELECT_FIELDS} ${BASE_FROM} WHERE oa.action_id = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Action not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[opp_actions byId] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /opportunity_actions — Sales creates a new action
router.post('/', async (req, res) => {
  const d = req.body || {};
  if (!d.enquiry_id || !d.action_type) {
    return res.status(400).json({ error: 'enquiry_id and action_type are required' });
  }
  // Assignee role defaults by action_type unless caller provides one
  const assignedRole = d.assigned_to_role || ROLE_FOR_ACTION[d.action_type] || 'sales';

  try {
    // Auto-number ACT-YY-NNN
    const cRes = await req.db.query('SELECT COUNT(*)::int AS n FROM opportunity_actions');
    const seq = cRes.rows[0].n + 1;
    const yy = new Date().getFullYear().toString().slice(-2);
    const actionNumber = d.action_number || `ACT-${yy}-${String(seq).padStart(3, '0')}`;

    // Quotation must have a package. Other action types may pass one too
    // (e.g. Technical Discussion about a specific package) but it's optional.
    if (d.action_type === 'quotation' && !d.package_id) {
      return res.status(400).json({ error: 'package_id is required for a Quotation action' });
    }

    const r = await req.db.query(
      `INSERT INTO opportunity_actions (
         action_number, enquiry_id, action_type,
         assigned_to_role, assigned_to_user_id,
         status, title, description, scheduled_at, created_by, package_id
       ) VALUES ($1,$2,$3,$4,$5,COALESCE($6,'Pending'),$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        actionNumber,
        d.enquiry_id,
        d.action_type,
        assignedRole,
        d.assigned_to_user_id || null,
        d.status || null,
        d.title || defaultTitle(d.action_type),
        d.description || null,
        d.scheduled_at || null,
        req.user?.id || null,
        d.package_id || null,
      ]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[opp_actions create] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

function defaultTitle(actionType) {
  switch (actionType) {
    case 'site_visit':           return 'Site Visit Requested';
    case 'quotation':            return 'Prepare Quotation';
    case 'clarification':        return 'Clarification Needed';
    case 'technical_discussion': return 'Technical Discussion';
    default:                     return actionType;
  }
}

// PATCH /opportunity_actions/:id/status — assignee marks progress
router.patch('/:id/status', async (req, res) => {
  const { status, outcome } = req.body || {};
  const ALLOWED = ['Pending','In_Progress','Completed','Cancelled'];
  if (!ALLOWED.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${ALLOWED.join(', ')}` });
  }
  try {
    // Cast $1 to text explicitly. Using an unqualified $1 in both a SET and
    // a CASE WHEN $1 = 'Completed' comparison makes Postgres error with
    // "inconsistent types deduced for parameter $1".
    const r = await req.db.query(
      `UPDATE opportunity_actions
          SET status       = $1::text,
              outcome      = COALESCE($2, outcome),
              completed_at = CASE WHEN $1::text = 'Completed' AND completed_at IS NULL
                                    THEN CURRENT_TIMESTAMP ELSE completed_at END,
              updated_at   = CURRENT_TIMESTAMP
        WHERE action_id = $3
        RETURNING *`,
      [status, outcome || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[opp_actions status] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /opportunity_actions/:id — full update
router.put('/:id', async (req, res) => {
  const d = req.body || {};
  try {
    const r = await req.db.query(
      `UPDATE opportunity_actions SET
         action_type         = COALESCE($1, action_type),
         assigned_to_role    = COALESCE($2, assigned_to_role),
         assigned_to_user_id = COALESCE($3, assigned_to_user_id),
         status              = COALESCE($4, status),
         title               = COALESCE($5, title),
         description         = COALESCE($6, description),
         outcome             = COALESCE($7, outcome),
         scheduled_at        = COALESCE($8, scheduled_at),
         package_id          = COALESCE($9, package_id),
         updated_at          = CURRENT_TIMESTAMP
       WHERE action_id = $10
       RETURNING *`,
      [
        d.action_type, d.assigned_to_role, d.assigned_to_user_id,
        d.status, d.title, d.description, d.outcome, d.scheduled_at,
        d.package_id,
        req.params.id,
      ]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[opp_actions update] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /opportunity_actions/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await req.db.query(
      'DELETE FROM opportunity_actions WHERE action_id = $1 RETURNING action_id',
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[opp_actions delete] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
