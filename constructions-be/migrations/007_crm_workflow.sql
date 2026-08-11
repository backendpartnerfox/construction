-- CRM workflow modules: opportunities stage, support tickets, meetings-for-CRM.
-- Idempotent — safe to re-run.

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Enquiries: add opportunity-stage tracking
-- --------------------------------------------------------------------------
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS is_opportunity        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS opportunity_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opportunity_marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS opportunity_notes     TEXT;

CREATE INDEX IF NOT EXISTS idx_enquiries_is_opportunity ON enquiries(is_opportunity) WHERE is_opportunity = TRUE;

-- --------------------------------------------------------------------------
-- 2. Support tickets — new module
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id       SERIAL PRIMARY KEY,
  ticket_number   VARCHAR(50) UNIQUE NOT NULL,
  subject         VARCHAR(255) NOT NULL,
  description     TEXT,
  priority        VARCHAR(20) NOT NULL DEFAULT 'Medium'
                    CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status          VARCHAR(30) NOT NULL DEFAULT 'Open'
                    CHECK (status IN ('Open', 'In_Progress', 'Waiting_On_Customer', 'Resolved', 'Closed')),
  category        VARCHAR(50),

  -- Optional links — a ticket usually relates to a client, sometimes an
  -- enquiry (pre-conversion) or a project (post-delivery).
  client_id       INTEGER REFERENCES clients(client_id)     ON DELETE SET NULL,
  enquiry_id      INTEGER REFERENCES enquiries(enquiry_id)  ON DELETE SET NULL,
  project_id      INTEGER REFERENCES projects(project_id)   ON DELETE SET NULL,

  contact_name    VARCHAR(100),
  contact_phone   VARCHAR(20),
  contact_email   VARCHAR(100),

  assigned_to     INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
  created_by      INTEGER REFERENCES users(id)              ON DELETE SET NULL,
  resolution      TEXT,
  resolved_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id  ON support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_enquiry_id ON support_tickets(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- --------------------------------------------------------------------------
-- 3. Meetings: broaden from project-only to any entity (enquiry/lead/client/project)
-- --------------------------------------------------------------------------
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(20)
    CHECK (related_entity_type IN ('enquiry','lead','client','project')),
  ADD COLUMN IF NOT EXISTS related_entity_id   INTEGER,
  ADD COLUMN IF NOT EXISTS title               VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status              VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled')),
  ADD COLUMN IF NOT EXISTS notes               TEXT,
  ADD COLUMN IF NOT EXISTS coordinator_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_meetings_entity ON meetings(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date   ON meetings(date);

-- --------------------------------------------------------------------------
-- 4. New RBAC permissions
-- --------------------------------------------------------------------------
INSERT INTO permissions (name, description, resource, action) VALUES
  ('opportunities.view', 'View opportunities', 'opportunities', 'view'),
  ('opportunities.edit', 'Edit / convert opportunities', 'opportunities', 'edit'),
  ('support.view',       'View support tickets', 'support', 'view'),
  ('support.edit',       'Edit / resolve support tickets', 'support', 'edit'),
  ('meetings.view',      'View meetings', 'meetings', 'view'),
  ('meetings.edit',      'Schedule / coordinate meetings', 'meetings', 'edit')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- --------------------------------------------------------------------------
-- 5. Grant new perms to relevant roles
-- --------------------------------------------------------------------------

-- Admin (blanket) — belt-and-braces
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'admin'), id
  FROM permissions
  WHERE name IN ('opportunities.view','opportunities.edit',
                 'support.view','support.edit',
                 'meetings.view','meetings.edit')
ON CONFLICT DO NOTHING;

-- CRM
WITH pairs (role_name, perm_name) AS (VALUES
  ('crm', 'opportunities.view'), ('crm', 'opportunities.edit'),
  ('crm', 'support.view'),       ('crm', 'support.edit'),
  ('crm', 'meetings.view'),      ('crm', 'meetings.edit'),
  ('crm', 'packages.view')       -- read-only Packages access
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM pairs
  JOIN roles r       ON r.name = pairs.role_name
  JOIN permissions p ON p.name = pairs.perm_name
ON CONFLICT DO NOTHING;

-- Sales — opportunities move to them too, plus meetings
WITH pairs (role_name, perm_name) AS (VALUES
  ('sales', 'opportunities.view'), ('sales', 'opportunities.edit'),
  ('sales', 'meetings.view'),      ('sales', 'meetings.edit'),
  ('sales', 'packages.view')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM pairs
  JOIN roles r       ON r.name = pairs.role_name
  JOIN permissions p ON p.name = pairs.perm_name
ON CONFLICT DO NOTHING;

-- Project Manager — meetings coordination naturally sits here too
WITH pairs (role_name, perm_name) AS (VALUES
  ('project_manager', 'meetings.view'), ('project_manager', 'meetings.edit'),
  ('project_manager', 'support.view')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM pairs
  JOIN roles r       ON r.name = pairs.role_name
  JOIN permissions p ON p.name = pairs.perm_name
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 6. Report
-- --------------------------------------------------------------------------
SELECT 'permissions total' AS what, COUNT(*)::text AS n FROM permissions
UNION ALL
SELECT 'role_permissions',        COUNT(*)::text FROM role_permissions
UNION ALL
SELECT 'crm perm count',          COUNT(*)::text FROM role_permissions rp JOIN roles r ON rp.role_id=r.id WHERE r.name='crm'
UNION ALL
SELECT 'sales perm count',        COUNT(*)::text FROM role_permissions rp JOIN roles r ON rp.role_id=r.id WHERE r.name='sales'
UNION ALL
SELECT 'support_tickets exists',  EXISTS(SELECT 1 FROM pg_tables WHERE tablename='support_tickets')::text;

COMMIT;
