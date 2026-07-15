-- Fix for client_requirements sequence issue
-- This script will reset the sequence to the correct value

-- Reset the sequence to the next available ID
SELECT setval('client_requirements_client_requirement_id_seq', 
    (SELECT COALESCE(MAX(client_requirement_id), 0) + 1 FROM client_requirements), 
    false);

-- Alternative approach if the above doesn't work:
-- ALTER SEQUENCE client_requirements_client_requirement_id_seq RESTART WITH 2;

-- Verify the fix
SELECT last_value FROM client_requirements_client_requirement_id_seq;
SELECT MAX(client_requirement_id) as max_id, COUNT(*) as total_rows FROM client_requirements;
