-- Quotations can now be raised BEFORE a client exists — Sales quotes an
-- opportunity/lead first, and only after payment does the record become
-- a client. So client_quotations.client_id becomes optional; new
-- enquiry_id / lead_id links let a pre-conversion quotation point at
-- the source of the enquiry.
-- Idempotent — safe to re-run.

BEGIN;

-- 1. Drop the NOT NULL on client_id
ALTER TABLE client_quotations ALTER COLUMN client_id DROP NOT NULL;

-- 2. New optional links
ALTER TABLE client_quotations
  ADD COLUMN IF NOT EXISTS enquiry_id INTEGER REFERENCES enquiries(enquiry_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id    INTEGER REFERENCES leads(lead_id)        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_quotations_enquiry_id ON client_quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_client_quotations_lead_id    ON client_quotations(lead_id);

-- Sanity check
SELECT column_name, is_nullable
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='client_quotations'
   AND column_name IN ('client_id','enquiry_id','lead_id')
 ORDER BY column_name;

COMMIT;
