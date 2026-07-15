-- ============================================================
-- Fix quotation status CHECK constraints (both lead and client)
-- ============================================================
-- Context: /api/client_quotations/:id/send and the lead quotation
-- send flow both set status = 'Sent', but the original DB CHECK
-- constraints omit 'Sent', throwing:
--   new row for relation "X_quotations" violates check constraint
--   "X_quotations_status_check"
--
-- This script fixes both tables. Idempotent — safe to re-run.
-- ============================================================

BEGIN;

-- =========================================================
-- client_quotations
-- =========================================================
ALTER TABLE client_quotations
    DROP CONSTRAINT IF EXISTS client_quotations_status_check;

ALTER TABLE client_quotations
    ADD CONSTRAINT client_quotations_status_check
    CHECK (status IN (
        'Draft',
        'Under_Review',
        'Client_Review',
        'Sent',
        'Approved',
        'Contract_Signed',
        'Active',
        'Completed',
        'Cancelled'
    ));

-- =========================================================
-- lead_quotations
-- =========================================================
-- Only apply if this table has a check constraint on status.
-- Common original values: Draft, Under_Review, Sent, Viewed,
-- Accepted, Rejected, Revised, Expired, Converted
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'lead_quotations'::regclass
           AND conname = 'lead_quotations_status_check'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        ALTER TABLE lead_quotations
            DROP CONSTRAINT lead_quotations_status_check;
    END IF;

    ALTER TABLE lead_quotations
        ADD CONSTRAINT lead_quotations_status_check
        CHECK (status IN (
            'Draft',
            'Under_Review',
            'Sent',
            'Viewed',
            'Accepted',
            'Rejected',
            'Revised',
            'Expired',
            'Converted',
            'Superseded'
        ));
END $$;

-- =========================================================
-- Verify: list the constraint definitions on both tables
-- =========================================================
SELECT
    conrelid::regclass AS table_name,
    conname           AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('client_quotations'::regclass, 'lead_quotations'::regclass)
  AND contype = 'c'
  AND conname LIKE '%_status_check'
ORDER BY table_name;

COMMIT;
