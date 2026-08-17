-- Opportunity workflow actions: Sales assigns follow-ups from an opportunity.
-- Actions land in the assignee's queue (PM or Designer).
-- Also adds plot capture fields to enquiries.
-- Idempotent — safe to re-run.

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Enquiries: plot capture fields
-- --------------------------------------------------------------------------
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS plot_length            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS plot_width             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS plot_dimensions_unit   VARCHAR(10) DEFAULT 'ft',
  ADD COLUMN IF NOT EXISTS plot_area_sqyards      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS floor_configuration    VARCHAR(20)
    CHECK (floor_configuration IS NULL OR floor_configuration IN
      ('G','G+1','G+2','G+3','G+4','G+5','Stilt+G','Stilt+G+1','Stilt+G+2','Stilt+G+3','Stilt+G+4','Penthouse'));

-- --------------------------------------------------------------------------
-- 2. Opportunity actions table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_actions (
  action_id             SERIAL PRIMARY KEY,
  action_number         VARCHAR(30) UNIQUE NOT NULL,
  enquiry_id            INTEGER NOT NULL REFERENCES enquiries(enquiry_id) ON DELETE CASCADE,

  -- What Sales is asking for
  action_type           VARCHAR(30) NOT NULL
    CHECK (action_type IN ('site_visit', 'quotation', 'clarification', 'technical_discussion')),

  -- Who owns the follow-up
  assigned_to_role      VARCHAR(30) NOT NULL
    CHECK (assigned_to_role IN ('project_manager', 'designer', 'sales', 'architect', 'ep', 'structural_engineer')),
  assigned_to_user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,

  status                VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'In_Progress', 'Completed', 'Cancelled')),

  title                 VARCHAR(255),
  description           TEXT,
  outcome               TEXT,

  scheduled_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,

  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_opp_actions_enquiry_id  ON opportunity_actions(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_opp_actions_assignee    ON opportunity_actions(assigned_to_role, status);
CREATE INDEX IF NOT EXISTS idx_opp_actions_status      ON opportunity_actions(status);

-- --------------------------------------------------------------------------
-- 3. Permissions
-- --------------------------------------------------------------------------
INSERT INTO permissions (name, description, resource, action) VALUES
  ('opportunity_actions.view',   'View opportunity follow-up actions', 'opportunity_actions', 'view'),
  ('opportunity_actions.edit',   'Create / update opportunity actions', 'opportunity_actions', 'edit')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- --------------------------------------------------------------------------
-- 4. Grants
-- --------------------------------------------------------------------------
-- Admin gets both automatically via the admin bypass, but grant explicitly too
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'admin'), id
  FROM permissions
  WHERE name IN ('opportunity_actions.view', 'opportunity_actions.edit')
ON CONFLICT DO NOTHING;

-- Sales creates the actions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'sales'), id
  FROM permissions
  WHERE name IN ('opportunity_actions.view', 'opportunity_actions.edit')
ON CONFLICT DO NOTHING;

-- PM + Designer need to see their queue + update status (mark completed etc.)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM (VALUES ('project_manager'), ('designer')) AS t(role_name)
  JOIN roles r ON r.name = t.role_name
  CROSS JOIN permissions p
 WHERE p.name IN ('opportunity_actions.view', 'opportunity_actions.edit', 'opportunities.view')
ON CONFLICT DO NOTHING;

-- CRM gets view of actions (situational awareness)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'crm'), id
  FROM permissions
  WHERE name = 'opportunity_actions.view'
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 5. Report
-- --------------------------------------------------------------------------
SELECT 'permissions total'      AS what, COUNT(*)::text AS n FROM permissions
UNION ALL SELECT 'opportunity_actions table exists', EXISTS(SELECT 1 FROM pg_tables WHERE tablename='opportunity_actions')::text
UNION ALL SELECT 'sales perms',           COUNT(*)::text FROM role_permissions rp JOIN roles r ON rp.role_id=r.id WHERE r.name='sales'
UNION ALL SELECT 'project_manager perms', COUNT(*)::text FROM role_permissions rp JOIN roles r ON rp.role_id=r.id WHERE r.name='project_manager'
UNION ALL SELECT 'designer perms',        COUNT(*)::text FROM role_permissions rp JOIN roles r ON rp.role_id=r.id WHERE r.name='designer';

COMMIT;
