-- =============================================================================
-- SCRIPT 1 OF 3: APPLY COSTS TO BOQ
-- Project 16 - Run in pgAdmin FIRST
-- =============================================================================
-- BOQ is already clean (14 records, single batch)
-- Just applying Hyderabad market rates
-- 
-- 'amount' is GENERATED (= quantity * unit_rate) in:
--   structural, walls, plumbing, flooring, painting → only update unit_rate
-- doors/windows/electrical → update unit_price + total_price directly
-- =============================================================================

BEGIN;

-- Structural (unit_rate only — amount auto-calculates)
UPDATE project_boq_structural SET unit_rate = 76700 WHERE project_id = 16 AND item_id = 1;  -- TMT Bar ₹76,700/ton
UPDATE project_boq_structural SET unit_rate = 6490  WHERE project_id = 16 AND item_id = 2;  -- RMC ₹6,490/cum

-- Walls (unit_rate only — amount auto-calculates)
UPDATE project_boq_walls SET unit_rate = 8.96 WHERE project_id = 16 AND item_id = 4;  -- Brick ₹8.96/piece

-- Plumbing (unit_rate only — amount auto-calculates)
UPDATE project_boq_plumbing SET unit_rate = 4130  WHERE project_id = 16 AND item_id = 51;  -- Fixtures ₹4,130/nos
UPDATE project_boq_plumbing SET unit_rate = 76.70 WHERE project_id = 16 AND item_id = 50;  -- CPVC Pipe ₹76.70/Rft

-- Flooring (unit_rate only — amount auto-calculates)
UPDATE project_boq_flooring SET unit_rate = 64.90 WHERE project_id = 16 AND item_id = 52;  -- Floor Tile ₹64.90/sqft
UPDATE project_boq_flooring SET unit_rate = 41.30 WHERE project_id = 16 AND item_id = 53;  -- Skirting ₹41.30/Rft

-- Painting (unit_rate only — amount auto-calculates)
UPDATE project_boq_painting SET unit_rate = 25.96 WHERE project_id = 16 AND item_id = 55;  -- Exterior Paint ₹25.96/sqft
UPDATE project_boq_painting SET unit_rate = 9.44  WHERE project_id = 16 AND item_id = 56;  -- Primer ₹9.44/sqft
UPDATE project_boq_painting SET unit_rate = 14.16 WHERE project_id = 16 AND item_id = 57;  -- Wall Putty ₹14.16/sqft

-- Doors/Windows/Electrical (total_price is NOT generated, update both)
UPDATE project_boq_doors SET unit_price = 14160, total_price = quantity * 14160 WHERE project_id = 16 AND item_id = 46;
UPDATE project_boq_windows SET unit_price = 9440, total_price = quantity * 9440 WHERE project_id = 16 AND item_id = 47;
UPDATE project_boq_electrical SET unit_price = 413, total_price = quantity * 413 WHERE project_id = 16 AND item_id = 48;
UPDATE project_boq_electrical SET unit_price = 29.50, total_price = quantity * 29.50 WHERE project_id = 16 AND item_id = 49;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'structural' as boq_type, count(*) as records, string_agg(unit_rate::text, ', ') as rates FROM project_boq_structural WHERE project_id = 16
UNION ALL SELECT 'walls', count(*), string_agg(unit_rate::text, ', ') FROM project_boq_walls WHERE project_id = 16
UNION ALL SELECT 'doors', count(*), string_agg(unit_price::text, ', ') FROM project_boq_doors WHERE project_id = 16
UNION ALL SELECT 'windows', count(*), string_agg(unit_price::text, ', ') FROM project_boq_windows WHERE project_id = 16
UNION ALL SELECT 'electrical', count(*), string_agg(unit_price::text, ', ') FROM project_boq_electrical WHERE project_id = 16
UNION ALL SELECT 'plumbing', count(*), string_agg(unit_rate::text, ', ') FROM project_boq_plumbing WHERE project_id = 16
UNION ALL SELECT 'flooring', count(*), string_agg(unit_rate::text, ', ') FROM project_boq_flooring WHERE project_id = 16
UNION ALL SELECT 'painting', count(*), string_agg(unit_rate::text, ', ') FROM project_boq_painting WHERE project_id = 16;

COMMIT;
