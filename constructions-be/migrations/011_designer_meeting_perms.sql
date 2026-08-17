-- Designer needs:
--   crm.view      -> so /api/enquiries/:id loads on the Opportunity detail page
--   meetings.view -> to see meetings scheduled for an opportunity
--   meetings.edit -> to schedule Virtual Meet / In-Person Meeting from a clarification
-- Idempotent — safe to re-run.

BEGIN;

INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='designer'), id
  FROM permissions
  WHERE name IN ('crm.view', 'meetings.view', 'meetings.edit')
ON CONFLICT DO NOTHING;

SELECT p.name AS granted FROM role_permissions rp
JOIN roles r ON r.id=rp.role_id
JOIN permissions p ON p.id=rp.permission_id
WHERE r.name='designer'
ORDER BY p.name;

COMMIT;
