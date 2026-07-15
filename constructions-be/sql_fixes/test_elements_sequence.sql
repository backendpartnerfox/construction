-- Test script to verify elements sequence fix
-- Run this after applying the fix

-- 1. Check current state
SELECT 
    'Current State' as status,
    (SELECT last_value FROM elements_element_id_seq) as sequence_value,
    (SELECT MAX(element_id) FROM elements) as max_table_id,
    (SELECT COUNT(*) FROM elements) as total_elements;

-- 2. Test if the issue is fixed
SELECT 
    CASE 
        WHEN (SELECT last_value FROM elements_element_id_seq) > (SELECT MAX(element_id) FROM elements) 
        THEN 'FIXED - Sequence is ahead of table data'
        ELSE 'NEEDS FIX - Sequence is behind table data'
    END as fix_status;

-- 3. Show existing elements to avoid duplicates
SELECT 'Existing Elements:' as info;
SELECT element_id, element_name, element_category FROM elements ORDER BY element_id;
