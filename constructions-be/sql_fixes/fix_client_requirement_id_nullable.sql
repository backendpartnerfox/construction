-- Fix project_components table to make client_requirement_id nullable
-- This allows creating components without a client requirement

ALTER TABLE project_components 
ALTER COLUMN client_requirement_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN project_components.client_requirement_id IS 'Optional: Links component to specific client requirement';
