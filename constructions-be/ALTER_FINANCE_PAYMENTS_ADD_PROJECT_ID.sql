-- ============================================================
-- Add project_id FK to finance_payments
-- ============================================================
-- Context: finance_payments stores lead_id and client_id but not
-- project_id. Once a project exists (auto-created on lead conversion
-- or created manually later), we want payments to link back to it so
-- the project dashboard can show "advance received", and so future
-- milestone payments can use the same table keyed by project_id.
-- ============================================================
-- Idempotent: safe to run multiple times.
-- ============================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'finance_payments' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE finance_payments
            ADD COLUMN project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL;

        CREATE INDEX IF NOT EXISTS idx_finance_payments_project_id
            ON finance_payments(project_id);

        RAISE NOTICE '✅ Added finance_payments.project_id column + index.';
    ELSE
        RAISE NOTICE 'ℹ️  finance_payments.project_id already exists — skipping.';
    END IF;
END $$;

-- Backfill: for payments already linked to a converted client, infer
-- the project_id. If a client has exactly one project, link it.
-- If a client has multiple projects, skip (ambiguous — leave for manual review).
UPDATE finance_payments fp
   SET project_id = sub.project_id
  FROM (
      SELECT p.client_id, MIN(p.project_id) AS project_id
        FROM projects p
       GROUP BY p.client_id
      HAVING COUNT(*) = 1
  ) sub
 WHERE fp.client_id = sub.client_id
   AND fp.project_id IS NULL;

-- Verify
SELECT
    COUNT(*) FILTER (WHERE project_id IS NULL) AS payments_without_project,
    COUNT(*) FILTER (WHERE project_id IS NOT NULL) AS payments_with_project,
    COUNT(*) AS total_payments
FROM finance_payments;

COMMIT;
