-- FINAL VERIFICATION SCRIPT FOR ELEMENTS ROUTE
-- Run this after fixing the sequence to verify everything works

-- 1. Show current sequence state
SELECT 'Current Sequence State' as test_step;
SELECT 
    last_value as sequence_value,
    CASE 
        WHEN last_value > (SELECT MAX(element_id) FROM elements) 
        THEN 'READY ✅' 
        ELSE 'NEEDS FIX ❌' 
    END as status
FROM elements_element_id_seq;

-- 2. Verify test data won't conflict
SELECT 'Duplicate Check for Test Data' as test_step;
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM elements WHERE element_name = 'Doors') 
        THEN 'CONFLICT: Doors already exists ❌'
        ELSE 'SAFE: Doors does not exist ✅'
    END as duplicate_status;

-- 3. Test the exact INSERT that the API will perform
SELECT 'Testing Exact API INSERT' as test_step;
SELECT 'About to test INSERT...' as info;

-- This simulates the exact INSERT the API route will perform
INSERT INTO elements (element_name, element_category, element_description, linetype, phase) 
VALUES ('API Test Element', 'Testing', 'Test element for API validation', NULL, NULL)
RETURNING 
    element_id,
    element_name,
    'INSERT SUCCESS ✅' as result;

-- 4. Verify the insert worked and get the details  
SELECT 'Verification of Test Insert' as test_step;
SELECT 
    element_id,
    element_name,
    element_category,
    element_description,
    created_at
FROM elements 
WHERE element_name = 'API Test Element';

-- 5. Test UPDATE functionality
SELECT 'Testing UPDATE functionality' as test_step;
UPDATE elements 
SET element_description = 'Updated test description'
WHERE element_name = 'API Test Element'
RETURNING element_id, element_name, element_description, 'UPDATE SUCCESS ✅' as result;

-- 6. Test category filtering (simulates GET /elements/category/Testing)
SELECT 'Testing Category Filter' as test_step;
SELECT element_id, element_name, element_category
FROM elements 
WHERE element_category = 'Testing';

-- 7. Test search functionality (simulates GET /elements/search/test)
SELECT 'Testing Search Functionality' as test_step;
SELECT element_id, element_name, element_description
FROM elements 
WHERE element_name ILIKE '%test%' OR element_description ILIKE '%test%';

-- 8. Clean up test data
SELECT 'Cleaning up test data' as test_step;
DELETE FROM elements WHERE element_name = 'API Test Element';
SELECT 'Test cleanup complete ✅' as cleanup_result;

-- 9. Final verification - ready for real API calls
SELECT 'Final API Readiness Check' as test_step;
SELECT 
    'Sequence Value: ' || last_value as sequence_info,
    'Max Table ID: ' || (SELECT MAX(element_id) FROM elements) as table_info,
    CASE 
        WHEN last_value > (SELECT MAX(element_id) FROM elements) 
        THEN 'API READY FOR PRODUCTION USE ✅' 
        ELSE 'STILL NEEDS ATTENTION ❌' 
    END as final_status
FROM elements_element_id_seq;

-- 10. API Test Data Preview
SELECT 'Your API Test Data Preview' as test_step;
SELECT 
    'POST /elements' as endpoint,
    '{"element_name": "Doors", "element_category": "Finishing", "element_description": "Doors for rooms"}' as test_payload,
    'Expected Status: 201 Created' as expected_result;
