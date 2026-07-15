-- ============================================================
-- Fix client_quotations status CHECK constraint
-- ============================================================
-- Context: The /api/client_quotations/:id/send endpoint has always
-- tried to set status = 'Sent', but the DB CHECK constraint omits
-- 'Sent' from the allowed list, so every "mark as sent" action throws:
--   new row for relation "client_quotations" violates check constraint
--   "client_quotations_status_check"
--
-- Fix: drop the existing check constraint and recreate it with
-- 'Sent' included. Idempotent — safe to run multiple times.
-- ============================================================

BEGIN;

-- Drop the existing constraint if present
ALTER TABLE client_quotations
    DROP CONSTRAINT IF EXISTS client_quotations_status_check;

-- Re-add with the full status set including 'Sent'
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

-- Verify: this should show the updated constraint definition
SELECT conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
 WHERE conrelid = 'client_quotations'::regclass
   AND contype = 'c'
   AND conname = 'client_quotations_status_check';

COMMIT;
