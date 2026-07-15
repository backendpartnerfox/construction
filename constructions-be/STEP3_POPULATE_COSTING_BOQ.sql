-- =============================================================================
-- SCRIPT 3 OF 3: POPULATE COSTING BOQ FOR PROJECT 16
-- Run in pgAdmin AFTER Script 2 succeeds
-- =============================================================================
-- Links BOQ items to their units via item_id join
-- costing_boq.unit_id FK → units.unit_id (must exist from STEP2)
-- =============================================================================

BEGIN;

-- Clear any existing costing_boq for project 16
DELETE FROM costing_boq WHERE project_id = 16;

-- Insert costing_boq records by joining BOQ tables with units on item_id
-- This dynamically resolves unit_id instead of hardcoding

-- 1 & 2: Structural (TMT Bar + RMC)
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-' || LPAD(ROW_NUMBER() OVER (ORDER BY b.boq_id)::text, 3, '0'),
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_rate,
    b.quantity * b.unit_rate,        -- material_cost
    b.quantity * b.unit_rate,        -- base_amount
    b.quantity * b.unit_rate,        -- total_cost (before GST)
    18.00,                            -- gst_percentage
    b.quantity * b.unit_rate * 0.18, -- gst_amount
    b.quantity * b.unit_rate * 1.18, -- total_amount (incl GST)
    1
FROM project_boq_structural b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 3: Walls (Brick)
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-003',
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    18.00,
    b.quantity * b.unit_rate * 0.18,
    b.quantity * b.unit_rate * 1.18,
    1
FROM project_boq_walls b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 4: Doors
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-004',
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_price,
    b.quantity * b.unit_price,
    b.quantity * b.unit_price,
    b.quantity * b.unit_price,
    18.00,
    b.quantity * b.unit_price * 0.18,
    b.quantity * b.unit_price * 1.18,
    1
FROM project_boq_doors b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 5: Windows
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-005',
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_price,
    b.quantity * b.unit_price,
    b.quantity * b.unit_price,
    b.quantity * b.unit_price,
    18.00,
    b.quantity * b.unit_price * 0.18,
    b.quantity * b.unit_price * 1.18,
    1
FROM project_boq_windows b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 6 & 7: Electrical (Wiring + Conduit)
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-' || CASE WHEN b.item_id = 48 THEN '006' ELSE '007' END,
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_price,
    b.quantity * b.unit_price,
    b.quantity * b.unit_price,
    b.quantity * b.unit_price,
    18.00,
    b.quantity * b.unit_price * 0.18,
    b.quantity * b.unit_price * 1.18,
    1
FROM project_boq_electrical b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 8 & 9: Plumbing (Fixtures + CPVC Pipe)
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-' || CASE WHEN b.item_id = 51 THEN '008' ELSE '009' END,
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    18.00,
    b.quantity * b.unit_rate * 0.18,
    b.quantity * b.unit_rate * 1.18,
    1
FROM project_boq_plumbing b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 10 & 11: Flooring (Floor Tile + Skirting)
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-' || CASE WHEN b.item_id = 52 THEN '010' ELSE '011' END,
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    18.00,
    b.quantity * b.unit_rate * 0.18,
    b.quantity * b.unit_rate * 1.18,
    1
FROM project_boq_flooring b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- 12, 13, 14: Painting (Exterior Paint + Primer + Wall Putty)
INSERT INTO costing_boq (project_id, unit_id, uid, boq_code, boq_description, element_id, item_id, quantity, unit, unit_rate, material_cost, base_amount, total_cost, gst_percentage, gst_amount, total_amount, created_by)
SELECT 
    b.project_id,
    u.unit_id,
    'CB-P16-' || CASE 
        WHEN b.item_id = 55 THEN '012' 
        WHEN b.item_id = 56 THEN '013' 
        ELSE '014' 
    END,
    u.unit_code,
    u.unit_name,
    b.element_id,
    b.item_id,
    b.quantity,
    u.unit_measure,
    b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    b.quantity * b.unit_rate,
    18.00,
    b.quantity * b.unit_rate * 0.18,
    b.quantity * b.unit_rate * 1.18,
    1
FROM project_boq_painting b
JOIN units u ON u.project_id = b.project_id AND u.item_id = b.item_id
WHERE b.project_id = 16;

-- =============================================
-- VERIFICATION: Should show 14 costing_boq records
-- =============================================
SELECT 
    cb.costing_boq_id,
    cb.uid,
    cb.boq_description,
    cb.item_id,
    cb.quantity,
    cb.unit,
    cb.unit_rate,
    cb.base_amount,
    cb.gst_amount,
    cb.total_amount,
    cb.unit_id
FROM costing_boq cb
WHERE cb.project_id = 16
ORDER BY cb.uid;

COMMIT;
