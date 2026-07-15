-- ============================================================
-- BACKFILL: Create missing Projects for already-converted Clients
-- ============================================================
-- Context (from memory): Clients 18, 6, 19 (and any others) were
-- converted from leads with advance payments captured, but no project
-- was auto-created because the conversion route didn't include that
-- step. The route is now fixed for NEW conversions; this script
-- backfills the existing orphaned clients.
-- ============================================================
-- Run this in pgAdmin. It's idempotent: clients that already have a
-- project are skipped via NOT EXISTS. Run multiple times safely.
-- ============================================================

BEGIN;

-- 1. Preview: which clients are missing projects?
SELECT
    c.client_id,
    c.client_name,
    c.lead_id,
    c.conversion_date,
    c.conversion_payment_id,
    (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.client_id) AS existing_project_count
FROM clients c
WHERE c.converted_from_lead = TRUE
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.client_id = c.client_id)
ORDER BY c.client_id;

-- 2. Backfill each missing project
-- For each client with no project, pull lead + current quotation data
-- and insert a Planning-stage project.
INSERT INTO projects (
    project_name,
    project_code,
    client_id,
    project_manager_id,
    architect_id,
    description,
    project_type,
    location,
    site_address,
    start_date,
    estimated_end_date,
    status,
    completion_percentage,
    estimated_budget,
    actual_cost,
    currency,
    total_area,
    area_unit,
    number_of_floors,
    priority,
    notes,
    created_at
)
SELECT
    COALESCE(q.project_title, l.primary_contact_name || ' - ' || COALESCE(l.lead_number, l.lead_id::TEXT))
        AS project_name,
    'PRJ-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-BF' ||
        LPAD((ROW_NUMBER() OVER (ORDER BY c.client_id))::TEXT, 3, '0')
        AS project_code,
    c.client_id,
    NULL AS project_manager_id,
    l.assigned_architect AS architect_id,
    COALESCE(l.project_scope, l.lead_notes) AS description,
    COALESCE(l.project_type, 'Residential') AS project_type,
    l.city AS location,
    l.site_address,
    COALESCE(c.conversion_date::DATE, CURRENT_DATE) AS start_date,
    CASE
        WHEN COALESCE(q.estimated_duration_months, l.timeline_months) IS NOT NULL
        THEN COALESCE(c.conversion_date::DATE, CURRENT_DATE)
             + (COALESCE(q.estimated_duration_months, l.timeline_months) || ' months')::INTERVAL
        ELSE NULL
    END AS estimated_end_date,
    'Planning' AS status,
    0 AS completion_percentage,
    COALESCE(q.total_amount, l.budget_max, l.budget_min, 0) AS estimated_budget,
    0 AS actual_cost,
    'INR' AS currency,
    COALESCE(l.site_area, l.estimated_built_up_area, 0) AS total_area,
    'sqft' AS area_unit,
    COALESCE(l.number_of_floors, 0) AS number_of_floors,
    3 AS priority,
    'BACKFILL: Auto-created by BACKFILL_MISSING_PROJECTS.sql on ' || CURRENT_DATE ||
    E'\nSource Lead: ' || COALESCE(l.lead_number, l.lead_id::TEXT) ||
    CASE WHEN l.enquiry_id IS NOT NULL THEN E'\nOriginal Enquiry: #' || l.enquiry_id ELSE '' END ||
    CASE WHEN q.lead_quotation_id IS NOT NULL THEN E'\nBased on Quotation: ' || q.lead_quotation_id ELSE '' END ||
    CASE WHEN c.conversion_payment_id IS NOT NULL THEN E'\nConversion Payment ID: ' || c.conversion_payment_id ELSE '' END
        AS notes,
    CURRENT_TIMESTAMP AS created_at
FROM clients c
JOIN leads l ON l.lead_id = c.lead_id
LEFT JOIN LATERAL (
    SELECT lead_quotation_id, project_title, total_amount, estimated_duration_months
    FROM lead_quotations
    WHERE lead_id = c.lead_id AND is_current_version = TRUE
    ORDER BY version_number DESC
    LIMIT 1
) q ON TRUE
WHERE c.converted_from_lead = TRUE
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.client_id = c.client_id);

-- 3. Link each newly-created project back to its conversion payment
-- (This step is skipped silently if finance_payments.project_id column
--  doesn't exist yet. Run ALTER_FINANCE_PAYMENTS_ADD_PROJECT_ID.sql first
--  if you want this linkage — see separate script.)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'finance_payments' AND column_name = 'project_id'
    ) THEN
        UPDATE finance_payments fp
           SET project_id = p.project_id
          FROM clients c, projects p
         WHERE fp.payment_id = c.conversion_payment_id
           AND p.client_id = c.client_id
           AND fp.project_id IS NULL;
        RAISE NOTICE 'Linked backfilled projects to their conversion payments.';
    ELSE
        RAISE NOTICE 'finance_payments.project_id column does not exist yet — skipping payment linkage.';
    END IF;
END $$;

-- 4. Verify: every converted client should now have exactly one project
SELECT
    c.client_id,
    c.client_name,
    c.lead_id,
    COUNT(p.project_id) AS project_count,
    STRING_AGG(p.project_code, ', ') AS project_codes
FROM clients c
LEFT JOIN projects p ON p.client_id = c.client_id
WHERE c.converted_from_lead = TRUE
GROUP BY c.client_id, c.client_name, c.lead_id
ORDER BY c.client_id;

-- If the counts and codes look right, commit. Otherwise ROLLBACK and investigate.
COMMIT;
-- ROLLBACK;
