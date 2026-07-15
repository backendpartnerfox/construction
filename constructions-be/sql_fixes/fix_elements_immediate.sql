-- IMMEDIATE FIX for elements sequence
-- Run this command right now to fix the issue

-- Step 1: Check current state
SELECT 'Current sequence value:' as info, last_value FROM elements_element_id_seq;
SELECT 'Max element_id in table:' as info, MAX(element_id) as max_id FROM elements;

-- Step 2: Fix the sequence
SELECT setval('elements_element_id_seq', 
    (SELECT COALESCE(MAX(element_id), 0) + 1 FROM elements), 
    false);

-- Step 3: Verify the fix
SELECT 'After fix - sequence value:' as info, last_value FROM elements_element_id_seq;

-- Alternative if the above doesn't work:
-- ALTER SEQUENCE elements_element_id_seq RESTART WITH 21;
