-- Clean up duplicate items with no meaningful data.
-- These are pairs left over from earlier seed runs where a second row was
-- created with the same (item_name, item_category) but never got choices or
-- package mappings. Also removes one clearly-junk item ('sgdgfdfg') and one
-- test choice ('test/test' on TMT Bar).
--
-- Items 3 (Miller Concrete), 5 (Mortar), 10 (RMC dup) are KEPT because they
-- still reference vendor_pricing / project_boq rows we don't want to lose.

BEGIN;

-- 1. Drop dependent qty ratios for the 8 to-be-deleted items
DELETE FROM item_qty_per_sqft
 WHERE item_id IN (9, 11, 12, 13, 14, 15, 16, 45);

-- 2. Drop dependent element_item_mapping rows
DELETE FROM element_item_mapping
 WHERE item_id IN (12, 14, 15);

-- 3. Drop dependent item_specification_types rows
DELETE FROM item_specification_types
 WHERE item_id IN (15);

-- 4. Drop the junk choice on the real TMT Bar (item 1)
--    First: junk lead_selection_package rows referencing it (all price=1.00 test data)
DELETE FROM lead_selection_package
 WHERE default_choice_id = 78 OR selected_choice_id = 78;
--    Then pricing rows (should be none, but defensive)
DELETE FROM item_choice_pricing
 WHERE choice_option_id = 78;
DELETE FROM item_choices
 WHERE choice_option_id = 78;

-- 5. Drop client_selections referencing the doomed selection_items (junk test data)
DELETE FROM client_selections
 WHERE selection_item_id IN (
   SELECT selection_item_id FROM selection_items
    WHERE item_id IN (9, 11, 12, 13, 14, 15, 16, 45)
 );

-- 5b. Drop junk selection_items row on item 45 (fggfg test row)
DELETE FROM selection_items
 WHERE item_id IN (9, 11, 12, 13, 14, 15, 16, 45);

-- 6. Finally drop the 8 duplicate items
DELETE FROM items
 WHERE item_id IN (9, 11, 12, 13, 14, 15, 16, 45);

-- 6. Report
SELECT 'items removed'   AS what, 8  AS count
UNION ALL
SELECT 'choice removed'      , 1
UNION ALL
SELECT 'qty ratios cleaned'  , (SELECT 8 - (SELECT COUNT(*) FROM item_qty_per_sqft WHERE item_id IN (9,11,12,13,14,15,16,45)))
UNION ALL
SELECT 'items remaining'     , (SELECT COUNT(*)::int FROM items WHERE is_active);

COMMIT;
