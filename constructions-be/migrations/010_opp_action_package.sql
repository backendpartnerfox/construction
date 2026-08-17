-- Opportunity actions can now carry a package_id (used by the Quotation
-- action to record which package the quote will be based on).
-- Idempotent — safe to re-run.

BEGIN;

ALTER TABLE opportunity_actions
  ADD COLUMN IF NOT EXISTS package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opp_actions_package_id ON opportunity_actions(package_id);

SELECT 'ok' AS status, COUNT(*)::text AS existing_actions FROM opportunity_actions;

COMMIT;
