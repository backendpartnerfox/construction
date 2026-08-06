-- RBAC overhaul: 22 defined roles, module-level permission matrix,
-- role_permissions join table so permissions attach to roles (not just users).
--
-- Design decisions:
-- 1. Permission model is `<module>.<action>` where action ∈ {view, edit}.
--    Edit implies create/update/delete for that module. Approval flows use
--    a separate `.approve` action where needed.
-- 2. Existing user assignments are remapped to the closest new role (see
--    the UPDATE block at the bottom).
-- 3. This migration is IDEMPOTENT — safe to re-run. Uses ON CONFLICT DO
--    NOTHING for inserts.

BEGIN;

-- --------------------------------------------------------------------------
-- 1. role_permissions join table (was missing entirely)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id       ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- --------------------------------------------------------------------------
-- 2. Seed the 22 canonical roles (upsert by name)
-- --------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('admin',               'System administrator — full access to all modules'),
  ('crm',                 'CRM team — manages enquiries and initial contact'),
  ('sales',               'Sales team — manages leads and quotations'),
  ('architect',           'Architect — drawings and design'),
  ('designer',            'Interior/exterior designer'),
  ('client',              'External client — view own projects and approve'),
  ('sourcing',            'Sourcing team — identifies and evaluates vendors'),
  ('procurement',         'Procurement team — issues purchase orders'),
  ('vendor_onboarding',   'Onboards new vendors into the system'),
  ('finance',             'Finance team — payments and financial approvals'),
  ('finance_assistant',   'Finance assistant — read-only finance access'),
  ('vendor',              'External vendor — view own POs and deliveries'),
  ('manager',             'Team manager — cross-project oversight'),
  ('execution_engineer',  'Execution engineer — site-level project execution'),
  ('structural_engineer', 'Structural engineer — BOQ and structural design'),
  ('ep',                  'Electrical/Plumbing engineer'),
  ('dispatch',            'Dispatch — material movement and inventory OUT'),
  ('project_manager',     'Project manager — end-to-end project ownership'),
  ('marketing',           'Marketing team — campaigns and lead generation'),
  ('inventory',           'Inventory manager — stock control'),
  ('lms',                 'Learning management — training content'),
  ('hr',                  'Human resources — staff records and training')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- --------------------------------------------------------------------------
-- 3. Seed the 44 canonical permissions (22 modules × view+edit)
-- --------------------------------------------------------------------------
INSERT INTO permissions (name, description, resource, action) VALUES
  -- Dashboard & Reports (view-only across most)
  ('dashboard.view',       'View dashboard',        'dashboard',       'view'),
  ('reports.view',         'View reports',          'reports',         'view'),

  -- CRM
  ('crm.view',             'View CRM',              'crm',             'view'),
  ('crm.edit',             'Edit CRM',              'crm',             'edit'),

  -- Clients
  ('clients.view',         'View clients',          'clients',         'view'),
  ('clients.edit',         'Edit clients',          'clients',         'edit'),

  -- Quotations
  ('quotations.view',      'View quotations',       'quotations',      'view'),
  ('quotations.edit',      'Edit quotations',       'quotations',      'edit'),

  -- Projects
  ('projects.view',        'View projects',         'projects',        'view'),
  ('projects.edit',        'Edit projects',         'projects',        'edit'),

  -- BOQ (Bill of Quantities)
  ('boq.view',             'View BOQ',              'boq',             'view'),
  ('boq.edit',             'Edit BOQ',              'boq',             'edit'),

  -- Drawings (architect assets)
  ('drawings.view',        'View drawings',         'drawings',        'view'),
  ('drawings.edit',        'Edit drawings',         'drawings',        'edit'),

  -- Execution tracking
  ('execution.view',       'View execution',        'execution',       'view'),
  ('execution.edit',       'Edit execution',        'execution',       'edit'),

  -- Payments
  ('payments.view',        'View payments',         'payments',        'view'),
  ('payments.edit',        'Edit payments',         'payments',        'edit'),

  -- Purchase Orders
  ('purchase_orders.view', 'View POs',              'purchase_orders', 'view'),
  ('purchase_orders.edit', 'Edit POs',              'purchase_orders', 'edit'),

  -- Packages (admin-only master)
  ('packages.view',        'View packages',         'packages',        'view'),
  ('packages.edit',        'Edit packages',         'packages',        'edit'),

  -- Items (admin-only master)
  ('items.view',           'View items',            'items',           'view'),
  ('items.edit',           'Edit items',            'items',           'edit'),

  -- Rulebook (admin-only master)
  ('rulebook.view',        'View rulebook',         'rulebook',        'view'),
  ('rulebook.edit',        'Edit rulebook',         'rulebook',        'edit'),

  -- Vendors
  ('vendors.view',         'View vendors',          'vendors',         'view'),
  ('vendors.edit',         'Edit vendors',          'vendors',         'edit'),

  -- Users (admin-only)
  ('users.view',           'View users',            'users',           'view'),
  ('users.edit',           'Edit users',            'users',           'edit'),

  -- Roles (admin-only)
  ('roles.view',           'View roles',            'roles',           'view'),
  ('roles.edit',           'Edit roles',            'roles',           'edit'),

  -- Inventory
  ('inventory.view',       'View inventory',        'inventory',       'view'),
  ('inventory.edit',       'Edit inventory',        'inventory',       'edit'),

  -- HR
  ('hr.view',              'View HR',               'hr',              'view'),
  ('hr.edit',              'Edit HR',               'hr',              'edit'),

  -- LMS (training)
  ('lms.view',             'View training content', 'lms',             'view'),
  ('lms.edit',             'Edit training content', 'lms',             'edit'),

  -- Sourcing
  ('sourcing.view',        'View sourcing',         'sourcing',        'view'),
  ('sourcing.edit',        'Edit sourcing',         'sourcing',        'edit'),

  -- Dispatch
  ('dispatch.view',        'View dispatch',         'dispatch',        'view'),
  ('dispatch.edit',        'Edit dispatch',         'dispatch',        'edit'),

  -- Marketing
  ('marketing.view',       'View marketing',        'marketing',       'view'),
  ('marketing.edit',       'Edit marketing',        'marketing',       'edit')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource    = EXCLUDED.resource,
  action      = EXCLUDED.action;

-- --------------------------------------------------------------------------
-- 4. Assign permissions to roles (the matrix)
-- --------------------------------------------------------------------------

-- Convenience: everyone signed in gets dashboard.view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE p.name = 'dashboard.view'
ON CONFLICT DO NOTHING;

-- admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'admin'), id FROM permissions
ON CONFLICT DO NOTHING;

-- Helper CTE-style assignment: role name + list of permission names
-- (Written as one big INSERT + UNION ALL for clarity)
WITH role_perm_pairs (role_name, perm_name) AS (
  VALUES
    -- crm
    ('crm', 'crm.view'), ('crm', 'crm.edit'),
    ('crm', 'clients.view'), ('crm', 'quotations.view'),

    -- sales
    ('sales', 'crm.view'), ('sales', 'crm.edit'),
    ('sales', 'clients.view'), ('sales', 'clients.edit'),
    ('sales', 'quotations.view'), ('sales', 'quotations.edit'),
    ('sales', 'reports.view'),

    -- architect
    ('architect', 'projects.view'), ('architect', 'projects.edit'),
    ('architect', 'boq.view'), ('architect', 'boq.edit'),
    ('architect', 'drawings.view'), ('architect', 'drawings.edit'),

    -- designer
    ('designer', 'projects.view'),
    ('designer', 'boq.view'), ('designer', 'boq.edit'),
    ('designer', 'drawings.view'),

    -- client (view-only on own data — filtering happens in query layer)
    ('client', 'clients.view'), ('client', 'projects.view'),
    ('client', 'quotations.view'), ('client', 'payments.view'),

    -- sourcing
    ('sourcing', 'sourcing.view'), ('sourcing', 'sourcing.edit'),
    ('sourcing', 'vendors.view'), ('sourcing', 'vendors.edit'),
    ('sourcing', 'purchase_orders.view'),

    -- procurement
    ('procurement', 'purchase_orders.view'), ('procurement', 'purchase_orders.edit'),
    ('procurement', 'vendors.view'), ('procurement', 'inventory.view'),

    -- vendor_onboarding
    ('vendor_onboarding', 'vendors.view'), ('vendor_onboarding', 'vendors.edit'),

    -- finance
    ('finance', 'payments.view'), ('finance', 'payments.edit'),
    ('finance', 'purchase_orders.view'), ('finance', 'quotations.view'),
    ('finance', 'reports.view'),

    -- finance_assistant (read-only mirror of finance)
    ('finance_assistant', 'payments.view'),
    ('finance_assistant', 'purchase_orders.view'),
    ('finance_assistant', 'quotations.view'),

    -- vendor (external — sees own POs)
    ('vendor', 'purchase_orders.view'), ('vendor', 'inventory.view'),

    -- manager
    ('manager', 'projects.view'), ('manager', 'projects.edit'),
    ('manager', 'execution.view'), ('manager', 'execution.edit'),
    ('manager', 'hr.view'), ('manager', 'reports.view'),
    ('manager', 'clients.view'), ('manager', 'quotations.view'),

    -- execution_engineer
    ('execution_engineer', 'projects.view'),
    ('execution_engineer', 'execution.view'), ('execution_engineer', 'execution.edit'),
    ('execution_engineer', 'boq.view'),

    -- structural_engineer
    ('structural_engineer', 'projects.view'),
    ('structural_engineer', 'boq.view'), ('structural_engineer', 'boq.edit'),
    ('structural_engineer', 'drawings.view'),

    -- ep (electrical/plumbing)
    ('ep', 'projects.view'),
    ('ep', 'boq.view'), ('ep', 'boq.edit'),
    ('ep', 'drawings.view'),

    -- dispatch
    ('dispatch', 'purchase_orders.view'),
    ('dispatch', 'inventory.view'), ('dispatch', 'inventory.edit'),
    ('dispatch', 'dispatch.view'), ('dispatch', 'dispatch.edit'),

    -- project_manager
    ('project_manager', 'projects.view'), ('project_manager', 'projects.edit'),
    ('project_manager', 'execution.view'), ('project_manager', 'execution.edit'),
    ('project_manager', 'boq.view'), ('project_manager', 'boq.edit'),
    ('project_manager', 'payments.view'),
    ('project_manager', 'clients.view'), ('project_manager', 'quotations.view'),
    ('project_manager', 'reports.view'), ('project_manager', 'drawings.view'),

    -- marketing
    ('marketing', 'crm.view'),
    ('marketing', 'marketing.view'), ('marketing', 'marketing.edit'),
    ('marketing', 'reports.view'),

    -- inventory
    ('inventory', 'inventory.view'), ('inventory', 'inventory.edit'),
    ('inventory', 'purchase_orders.view'),

    -- lms
    ('lms', 'lms.view'), ('lms', 'lms.edit'),
    ('lms', 'hr.view'),

    -- hr — also manages users/roles/permissions (add users, assign roles, view permissions)
    ('hr', 'hr.view'), ('hr', 'hr.edit'),
    ('hr', 'lms.view'),
    ('hr', 'users.view'), ('hr', 'users.edit'),
    ('hr', 'roles.view'), ('hr', 'roles.edit')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM role_perm_pairs rpp
  JOIN roles       r ON r.name = rpp.role_name
  JOIN permissions p ON p.name = rpp.perm_name
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------------------------
-- 5. Remap existing user assignments to the new role catalog
-- --------------------------------------------------------------------------
-- super_admin -> admin
UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'admin')
 WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');
-- consultant -> manager
UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'manager')
 WHERE role_id = (SELECT id FROM roles WHERE name = 'consultant');
-- engineer -> execution_engineer
UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'execution_engineer')
 WHERE role_id = (SELECT id FROM roles WHERE name = 'engineer');
-- contractor -> vendor
UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'vendor')
 WHERE role_id = (SELECT id FROM roles WHERE name = 'contractor');
-- viewer -> client
UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE name = 'client')
 WHERE role_id = (SELECT id FROM roles WHERE name = 'viewer');

-- Deduplicate any dupes created by the remaps
DELETE FROM user_roles a USING user_roles b
 WHERE a.user_id = b.user_id
   AND a.role_id = b.role_id
   AND a.ctid < b.ctid;

-- --------------------------------------------------------------------------
-- 6. Drop the 5 obsolete roles (super_admin, consultant, engineer,
--    contractor, viewer). CASCADE cleans up any lingering FKs.
-- --------------------------------------------------------------------------
DELETE FROM roles WHERE name IN ('super_admin', 'consultant', 'engineer', 'contractor', 'viewer');

-- --------------------------------------------------------------------------
-- 7. Report
-- --------------------------------------------------------------------------
SELECT 'roles seeded'       AS what, COUNT(*)::text AS n FROM roles
UNION ALL
SELECT 'permissions seeded' AS what, COUNT(*)::text FROM permissions
UNION ALL
SELECT 'role_permissions'   AS what, COUNT(*)::text FROM role_permissions
UNION ALL
SELECT 'user_roles'         AS what, COUNT(*)::text FROM user_roles;

COMMIT;
