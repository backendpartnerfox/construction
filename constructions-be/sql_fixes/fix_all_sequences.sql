-- Comprehensive sequence fix script
-- This will check and fix all sequences that are out of sync

-- Fix elements sequence (immediate issue)
DO $$
DECLARE
    max_id INTEGER;
    seq_val INTEGER;
BEGIN
    SELECT COALESCE(MAX(element_id), 0) INTO max_id FROM elements;
    SELECT last_value INTO seq_val FROM elements_element_id_seq;
    
    IF seq_val <= max_id THEN
        PERFORM setval('elements_element_id_seq', max_id + 1, false);
        RAISE NOTICE 'Fixed elements_element_id_seq: was %, now %', seq_val, max_id + 1;
    END IF;
END $$;

-- Fix client_requirements sequence (if not already fixed)
DO $$
DECLARE
    max_id INTEGER;
    seq_val INTEGER;
BEGIN
    SELECT COALESCE(MAX(client_requirement_id), 0) INTO max_id FROM client_requirements;
    SELECT last_value INTO seq_val FROM client_requirements_client_requirement_id_seq;
    
    IF seq_val <= max_id THEN
        PERFORM setval('client_requirements_client_requirement_id_seq', max_id + 1, false);
        RAISE NOTICE 'Fixed client_requirements_client_requirement_id_seq: was %, now %', seq_val, max_id + 1;
    END IF;
END $$;

-- Check and fix other potentially problematic sequences
-- (These are sequences where last_value seems low compared to typical data)

-- Fix project_boq_doors sequence
DO $$
DECLARE
    max_id INTEGER;
    seq_val INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM project_boq_doors;
    SELECT last_value INTO seq_val FROM project_boq_doors_id_seq;
    
    IF seq_val <= max_id THEN
        PERFORM setval('project_boq_doors_id_seq', max_id + 1, false);
        RAISE NOTICE 'Fixed project_boq_doors_id_seq: was %, now %', seq_val, max_id + 1;
    END IF;
END $$;

-- Fix lead_requirements sequence
DO $$
DECLARE
    max_id INTEGER;
    seq_val INTEGER;
BEGIN
    SELECT COALESCE(MAX(lead_requirement_id), 0) INTO max_id FROM lead_requirements;
    SELECT last_value INTO seq_val FROM lead_requirements_lead_requirement_id_seq;
    
    IF seq_val <= max_id THEN
        PERFORM setval('lead_requirements_lead_requirement_id_seq', max_id + 1, false);
        RAISE NOTICE 'Fixed lead_requirements_lead_requirement_id_seq: was %, now %', seq_val, max_id + 1;
    END IF;
END $$;

-- Fix enquiry_requirements sequence
DO $$
DECLARE
    max_id INTEGER;
    seq_val INTEGER;
BEGIN
    SELECT COALESCE(MAX(enquiry_requirement_id), 0) INTO max_id FROM enquiry_requirements;
    SELECT last_value INTO seq_val FROM enquiry_requirements_enquiry_requirement_id_seq;
    
    IF seq_val <= max_id THEN
        PERFORM setval('enquiry_requirements_enquiry_requirement_id_seq', max_id + 1, false);
        RAISE NOTICE 'Fixed enquiry_requirements_enquiry_requirement_id_seq: was %, now %', seq_val, max_id + 1;
    END IF;
END $$;

-- Verify all fixes
SELECT 'elements' as table_name, last_value FROM elements_element_id_seq
UNION ALL
SELECT 'client_requirements' as table_name, last_value FROM client_requirements_client_requirement_id_seq
UNION ALL
SELECT 'project_boq_doors' as table_name, last_value FROM project_boq_doors_id_seq
UNION ALL
SELECT 'lead_requirements' as table_name, last_value FROM lead_requirements_lead_requirement_id_seq
UNION ALL
SELECT 'enquiry_requirements' as table_name, last_value FROM enquiry_requirements_enquiry_requirement_id_seq;

-- Double-check the elements table specifically
SELECT 'Current elements data:' as info;
SELECT element_id, element_name, element_category FROM elements ORDER BY element_id;
