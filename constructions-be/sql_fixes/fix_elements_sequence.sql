-- Fix for elements sequence issue
-- This script will reset the sequence to the correct value

-- Reset the sequence to the next available ID
SELECT setval('elements_element_id_seq', 
    (SELECT COALESCE(MAX(element_id), 0) + 1 FROM elements), 
    false);

-- Alternative approach if the above doesn't work:
-- ALTER SEQUENCE elements_element_id_seq RESTART WITH 21;

-- Verify the fix
SELECT last_value FROM elements_element_id_seq;
SELECT MAX(element_id) as max_id, COUNT(*) as total_rows FROM elements;

-- Check current elements
SELECT element_id, element_name, element_category FROM elements ORDER BY element_id;
