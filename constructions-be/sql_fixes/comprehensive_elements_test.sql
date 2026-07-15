-- Comprehensive Elements Route Test and Fix Script
-- This will fix the sequence and test the functionality

-- STEP 1: Current State Check
SELECT 'STEP 1: Current State Check' as step;
SELECT 
    'Before Fix' as status,
    (SELECT last_value FROM elements_element_id_seq) as sequence_value,
    (SELECT MAX(element_id) FROM elements) as max_table_id,
    (SELECT COUNT(*) FROM elements) as total_elements;

-- STEP 2: Fix the Sequence
SELECT 'STEP 2: Fixing Sequence' as step;
SELECT setval('elements_element_id_seq', 
    (SELECT COALESCE(MAX(element_id), 0) + 1 FROM elements), 
    false) as new_sequence_value;

-- STEP 3: Verify Fix
SELECT 'STEP 3: Verify Fix' as step;
SELECT 
    'After Fix' as status,
    (SELECT last_value FROM elements_element_id_seq) as sequence_value,
    (SELECT MAX(element_id) FROM elements) as max_table_id,
    CASE 
        WHEN (SELECT last_value FROM elements_element_id_seq) > (SELECT MAX(element_id) FROM elements) 
        THEN 'FIXED ✅'
        ELSE 'NEEDS ATTENTION ❌'
    END as fix_status;

-- STEP 4: Test Insert (Simulation)
SELECT 'STEP 4: Testing Insert Readiness' as step;
SELECT 
    'Next available ID:' as info,
    (SELECT last_value FROM elements_element_id_seq) as next_id,
    'This should be 21 or higher' as expected;

-- STEP 5: Check for duplicate element names
SELECT 'STEP 5: Check for Duplicate Names' as step;
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM elements WHERE element_name = 'Doors') 
        THEN 'Element "Doors" already exists ❌'
        ELSE 'Element "Doors" does not exist - safe to insert ✅'
    END as duplicate_check;

-- STEP 6: Show current categories for reference
SELECT 'STEP 6: Current Categories' as step;
SELECT DISTINCT element_category, COUNT(*) as count
FROM elements 
WHERE element_category IS NOT NULL
GROUP BY element_category
ORDER BY element_category;

-- STEP 7: Test Insert (ACTUAL)
SELECT 'STEP 7: Attempting Test Insert' as step;
INSERT INTO elements (element_name, element_category, element_description, linetype, phase) 
VALUES ('Test Element for Route', 'Testing', 'This is a test element to verify the route works', 'test', 'test')
RETURNING element_id, element_name, element_category, 'INSERT SUCCESSFUL ✅' as result;

-- STEP 8: Verify the insert worked
SELECT 'STEP 8: Verify Insert' as step;
SELECT 
    'Latest Element' as info,
    element_id,
    element_name,
    element_category,
    element_description
FROM elements 
WHERE element_name = 'Test Element for Route';

-- STEP 9: Clean up test data
SELECT 'STEP 9: Cleaning up test data' as step;
DELETE FROM elements WHERE element_name = 'Test Element for Route';
SELECT 'Test element cleaned up' as cleanup_status;

-- STEP 10: Final State
SELECT 'STEP 10: Final State' as step;
SELECT 
    'Final Status' as status,
    (SELECT last_value FROM elements_element_id_seq) as sequence_value,
    (SELECT MAX(element_id) FROM elements) as max_table_id,
    (SELECT COUNT(*) FROM elements) as total_elements,
    'Ready for API calls ✅' as api_status;
