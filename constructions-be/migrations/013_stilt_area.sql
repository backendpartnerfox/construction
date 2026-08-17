-- Stilt area on the plot: typically 70% of the plot footprint (setback rules
-- limit ground-floor coverage). Stored as sqft so it can be used directly by
-- the BOQ / quotation stilt-rate formulas later.
-- Idempotent — safe to re-run.

BEGIN;

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS stilt_area_sqft NUMERIC(12,2);

SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='enquiries' AND column_name='stilt_area_sqft';

COMMIT;
