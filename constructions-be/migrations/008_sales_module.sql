-- Sales module: extend site_visits, add site_visits + packages.customise perms,
-- grant to Sales role. Idempotent.

BEGIN;

-- --------------------------------------------------------------------------
-- 1. site_visits: current schema is just {id, created_by, project_id, mom_id}.
--    Extend with real fields so it's usable for the Sales workflow (site
--    visits attached to enquiries/leads/clients as well as projects).
-- --------------------------------------------------------------------------
ALTER TABLE site_visits
  ADD COLUMN IF NOT EXISTS visit_number         VARCHAR(30) UNIQUE,
  ADD COLUMN IF NOT EXISTS purpose              VARCHAR(100),
  ADD COLUMN IF NOT EXISTS visit_date           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address              TEXT,
  ADD COLUMN IF NOT EXISTS city                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS visited_by_user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_entity_type  VARCHAR(20)
    CHECK (related_entity_type IN ('enquiry','lead','client','project')),
  ADD COLUMN IF NOT EXISTS related_entity_id    INTEGER,
  ADD COLUMN IF NOT EXISTS status               VARCHAR(20) NOT NULL DEFAULT 'Planned'
    CHECK (status IN ('Planned','Confirmed','Completed','Cancelled','Rescheduled')),
  ADD COLUMN IF NOT EXISTS attendees            TEXT,
  ADD COLUMN IF NOT EXISTS notes                TEXT,
  ADD COLUMN IF NOT EXISTS findings             TEXT,
  ADD COLUMN IF NOT EXISTS next_action          TEXT,
  ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_site_visits_date   ON site_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_entity ON site_visits(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);

-- --------------------------------------------------------------------------
-- 2. Permissions
-- --------------------------------------------------------------------------
INSERT INTO permissions (name, description, resource, action) VALUES
  ('site_visits.view',    'View site visits',                   'site_visits', 'view'),
  ('site_visits.edit',    'Schedule and record site visits',    'site_visits', 'edit'),
  ('packages.customise',  'Customize a package for a lead/client', 'packages', 'customise')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- --------------------------------------------------------------------------
-- 3. Grants
-- --------------------------------------------------------------------------
-- Admin (blanket)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'admin'), id
  FROM permissions
  WHERE name IN ('site_visits.view','site_visits.edit','packages.customise')
ON CONFLICT DO NOTHING;

-- Sales (leads/enquiries access already granted via crm.view/crm.edit)
WITH pairs (role_name, perm_name) AS (VALUES
  ('sales', 'site_visits.view'),
  ('sales', 'site_visits.edit'),
  ('sales', 'packages.customise')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM pairs
  JOIN roles r ON r.name = pairs.role_name
  JOIN permissions p ON p.name = pairs.perm_name
ON CONFLICT DO NOTHING;

-- CRM + Project Manager get site_visits view too (they coordinate visits sometimes)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM (VALUES ('crm'), ('project_manager'), ('execution_engineer')) AS t(role_name)
  JOIN roles r ON r.name = t.role_name
  CROSS JOIN permissions p
 WHERE p.name IN ('site_visits.view','site_visits.edit')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 4. Report
-- --------------------------------------------------------------------------
SELECT 'permissions total' AS what, COUNT(*)::text AS n FROM permissions
UNION ALL SELECT 'sales perm count',   COUNT(*)::text FROM role_permissions rp JOIN roles r ON rp.role_id=r.id WHERE r.name='sales'
UNION ALL SELECT 'site_visits.view granted to',
  string_agg(r.name, ', ') FROM role_permissions rp JOIN roles r ON rp.role_id=r.id
    JOIN permissions p ON rp.permission_id=p.id WHERE p.name='site_visits.view';

COMMIT;
