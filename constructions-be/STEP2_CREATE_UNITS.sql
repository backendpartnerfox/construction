-- =============================================================================
-- SCRIPT 2 OF 3: CREATE UNITS FOR PROJECT 16
-- Run in pgAdmin AFTER Script 1 succeeds
-- =============================================================================
-- First cleans up: junk unit (227) + its selection_items FK reference
-- Then creates 14 units (one per BOQ item)
-- These unit_ids are needed for costing_boq (FK constraint)
-- component_id = 363 (project 16's only component)
-- =============================================================================

BEGIN;

-- Clean up FK reference first (selection_items → units)
DELETE FROM selection_items WHERE unit_id = 227;

-- Delete existing units for project 16
DELETE FROM units WHERE project_id = 16;

-- 1. TMT Bar - Foundation (item 1, element 3)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-001', 16, 363, 'STR-TMT-001', 'Foundation TMT Bar', 'Structural', 3, 1, 6.69, 'ton', 76700, 513243, 1);

-- 2. RMC - Foundation (item 2, element 3)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-002', 16, 363, 'STR-RMC-001', 'Foundation RMC', 'Structural', 3, 2, 60, 'cum', 6490, 389400, 1);

-- 3. Brick - Wall Masonry (item 4, element 27)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-003', 16, 363, 'WAL-BRK-001', 'Wall Brickwork', 'Walls', 27, 4, 5940, 'piece', 8.96, 53222.40, 1);

-- 4. Door Frame (item 46, element 21)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-004', 16, 363, 'DOR-FRM-001', 'Door Frame Installation', 'Doors', 21, 46, 1, 'nos', 14160, 14160, 1);

-- 5. Window Frame (item 47, element 22)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-005', 16, 363, 'WIN-FRM-001', 'Window Frame Installation', 'Windows', 22, 47, 1, 'nos', 9440, 9440, 1);

-- 6. Electrical Wiring (item 48, element 23)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-006', 16, 363, 'ELE-WIR-001', 'Electrical Wiring', 'Electrical', 23, 48, 62, 'point', 413, 25606, 1);

-- 7. Conduit Pipe (item 49, element 23)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-007', 16, 363, 'ELE-CDP-001', 'Conduit Pipe', 'Electrical', 23, 49, 15, 'Rft', 29.50, 442.50, 1);

-- 8. Plumbing Fixtures (item 51, element 24)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-008', 16, 363, 'PLB-FIX-001', 'Plumbing Fixtures', 'Plumbing', 24, 51, 37, 'nos', 4130, 152810, 1);

-- 9. CPVC Pipe (item 50, element 24)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-009', 16, 363, 'PLB-PIP-001', 'Plumbing CPVC Pipe', 'Plumbing', 24, 50, 32, 'Rft', 76.70, 2454.40, 1);

-- 10. Floor Tile (item 52, element 25)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-010', 16, 363, 'FLR-TIL-001', 'Floor Tiling', 'Flooring', 25, 52, 3234, 'sqft', 64.90, 209886.60, 1);

-- 11. Skirting Tile (item 53, element 25)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-011', 16, 363, 'FLR-SKR-001', 'Skirting Tile', 'Flooring', 25, 53, 5, 'Rft', 41.30, 206.50, 1);

-- 12. Exterior Paint (item 55, element 26)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-012', 16, 363, 'PNT-EXT-001', 'Exterior Paint', 'Painting', 26, 55, 326, 'sqft', 25.96, 8462.96, 1);

-- 13. Primer (item 56, element 26)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-013', 16, 363, 'PNT-PRM-001', 'Primer', 'Painting', 26, 56, 163, 'sqft', 9.44, 1538.72, 1);

-- 14. Wall Putty (item 57, element 26)
INSERT INTO units (uid, project_id, component_id, unit_code, unit_name, unit_category, element_id, item_id, quantity, unit_measure, unit_rate, total_amount, created_by)
VALUES ('U-P16-014', 16, 363, 'PNT-PTY-001', 'Wall Putty', 'Painting', 26, 57, 326, 'sqft', 14.16, 4616.16, 1);

-- =============================================
-- VERIFICATION: Should show 14 units
-- =============================================
SELECT unit_id, uid, unit_name, unit_category, item_id, quantity, unit_measure, unit_rate, total_amount 
FROM units WHERE project_id = 16 ORDER BY uid;

COMMIT;
