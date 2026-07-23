-- Map every rule to its PDF-annexure row so the renderer can group them.
-- Adds 4 rules the WH/JS PDFs list as standalone items but the rulebook folded elsewhere.
-- Adds 4 JS-footnote QC rules.

BEGIN;

ALTER TABLE package_rules
    ADD COLUMN IF NOT EXISTS pdf_item_number  INT,
    ADD COLUMN IF NOT EXISTS pdf_annexure     TEXT DEFAULT 'main',   -- 'main' | 'elp'
    ADD COLUMN IF NOT EXISTS pdf_sub_label    TEXT;                  -- e.g. 'Main Door' when several rules share a PDF row

-- ------------------------------------------------------------------
-- 4 rules that the PDFs list standalone but the rulebook consolidated
-- ------------------------------------------------------------------
INSERT INTO package_rules (rule_id, module, rule_type, title, basis, uom, overage_mode, spec_text, sort_order, pdf_item_number, pdf_annexure)
VALUES
  ('R-STR-014','structure','brand_spec','Sand for RCC Structure',       'per_project',null,'per_item_rate','Pedestals, Columns etc. Hand mix for less than 6 CUM. Grade M-25. 100% River Sand.', 108, 12, 'main'),
  ('R-STR-015','structure','brand_spec','Aggregate for RCC Structure',  'per_project',null,'per_item_rate','20 MM & 40 MM above-size coarse aggregate. From approved quarry.',                    109, 13, 'main'),
  ('R-STR-016','structure','dimension_spec','CRS / Total Flooring Work','per_project',null,'per_item_rate','CM 1:6 wherever required. Outside plinth beam bottom CRS work (depth 1''6", width 1''). Compound wall bottom CRS work (2 ft depth × 1''6" width). Total flooring works.', 110, 14, 'main'),
  ('R-MSN-008','masonry','brand_spec','Sand for Brick Work',            'per_project',null,'per_item_rate','River sand. Brand assured quality from the market.',                                   111, 17, 'main')
ON CONFLICT (rule_id) DO NOTHING;

-- Add default tier rows for the new rules
INSERT INTO package_rule_tiers (rule_id, package_id, included)
SELECT r.rule_id, p.id, TRUE
FROM package_rules r CROSS JOIN packages p
WHERE r.rule_id IN ('R-STR-014','R-STR-015','R-STR-016','R-MSN-008')
ON CONFLICT (rule_id, package_id) DO NOTHING;

-- ------------------------------------------------------------------
-- 4 JS-footnote QC rules
-- ------------------------------------------------------------------
INSERT INTO package_rules (rule_id, module, rule_type, title, basis, uom, overage_mode, spec_text, sort_order, pdf_item_number, pdf_annexure)
VALUES
  ('R-STR-017','structure','process_qc','Cover blocks & vibrator use',   'per_project',null,null,'Cover blocks and mechanical vibrator will be used at every RCC casting.',              112, 6, 'main'),
  ('R-STR-018','structure','dimension_spec','Lintel & sill throughout',   'per_project',null,null,'Lintel and sill bands run continuous throughout the building.',                       113, 6, 'main'),
  ('R-MSN-009','masonry','dimension_spec','Compound wall with RCC columns','per_project',null,null,'Compound wall constructed along with RCC columns at 10'' to 12'' C/C.',                114, 15, 'main'),
  ('R-STR-019','structure','dimension_spec','Sunken slab for washrooms',   'per_project',null,null,'Sunken slab provided for washrooms.',                                                 115, 20, 'main')
ON CONFLICT (rule_id) DO NOTHING;

INSERT INTO package_rule_tiers (rule_id, package_id, included)
SELECT r.rule_id, p.id, TRUE
FROM package_rules r CROSS JOIN packages p
WHERE r.rule_id IN ('R-STR-017','R-STR-018','R-MSN-009','R-STR-019')
ON CONFLICT (rule_id, package_id) DO NOTHING;

-- ------------------------------------------------------------------
-- PDF row mapping (main annexure = rows 1..34)
-- ------------------------------------------------------------------
UPDATE package_rules SET pdf_item_number =  1, pdf_annexure = 'main' WHERE rule_id IN ('R-ERT-001');                              -- Excavation
UPDATE package_rules SET pdf_item_number =  2, pdf_annexure = 'main' WHERE rule_id IN ('R-ERT-003');                              -- Rock Cutting
UPDATE package_rules SET pdf_item_number =  3, pdf_annexure = 'main' WHERE rule_id IN ('R-ERT-004');                              -- Back Filling
UPDATE package_rules SET pdf_item_number =  4, pdf_annexure = 'main' WHERE rule_id IN ('R-ERT-006');                              -- Termite Protection
UPDATE package_rules SET pdf_item_number =  5, pdf_annexure = 'main' WHERE rule_id IN ('R-ERT-005');                              -- Surface Ground Water
UPDATE package_rules SET pdf_item_number =  6, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-013','R-STR-017','R-STR-018');      -- Foundation / Structure + QC
UPDATE package_rules SET pdf_item_number =  7, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-006');                              -- Floor Height
UPDATE package_rules SET pdf_item_number =  8, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-001','R-STR-002');                  -- Steel Bars
UPDATE package_rules SET pdf_item_number =  9, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-005');                              -- PCC
UPDATE package_rules SET pdf_item_number = 10, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-003');                              -- Concrete for RCC
UPDATE package_rules SET pdf_item_number = 11, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-004');                              -- Cement for RCC
UPDATE package_rules SET pdf_item_number = 12, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-014');                              -- Sand for RCC
UPDATE package_rules SET pdf_item_number = 13, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-015');                              -- Aggregate for RCC
UPDATE package_rules SET pdf_item_number = 14, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-016','R-STR-010');                  -- CRS / Total Flooring
UPDATE package_rules SET pdf_item_number = 15, pdf_annexure = 'main' WHERE rule_id IN ('R-MSN-001','R-MSN-002','R-MSN-007','R-STR-009','R-MSN-009'); -- Brick Work (external+internal+parapet+compound)
UPDATE package_rules SET pdf_item_number = 16, pdf_annexure = 'main' WHERE rule_id IN ('R-MSN-003');                              -- Cement Brick Mortar
UPDATE package_rules SET pdf_item_number = 17, pdf_annexure = 'main' WHERE rule_id IN ('R-MSN-008');                              -- Sand for Brick Work
UPDATE package_rules SET pdf_item_number = 18, pdf_annexure = 'main' WHERE rule_id IN ('R-MSN-004','R-MSN-006');                  -- External Plastering + crack mesh
UPDATE package_rules SET pdf_item_number = 19, pdf_annexure = 'main' WHERE rule_id IN ('R-MSN-005');                              -- Internal Plastering
UPDATE package_rules SET pdf_item_number = 20, pdf_annexure = 'main' WHERE rule_id IN ('R-WPF-001','R-WPF-002','R-WPF-003','R-STR-019'); -- Waterproofing + sunken slab
UPDATE package_rules SET pdf_item_number = 21, pdf_annexure = 'main' WHERE rule_id IN ('R-WPF-004');                              -- Honeycomb
UPDATE package_rules SET pdf_item_number = 22, pdf_annexure = 'main' WHERE rule_id IN ('R-PNT-001');                              -- Painting External
UPDATE package_rules SET pdf_item_number = 23, pdf_annexure = 'main' WHERE rule_id IN ('R-PNT-002','R-PNT-003');                  -- Painting Internal + colour limit
UPDATE package_rules SET pdf_item_number = 24, pdf_annexure = 'main' WHERE rule_id IN ('R-DOR-007');                              -- Painting Main Doors (also 25/26 but rule is unified)
UPDATE package_rules SET pdf_item_number = 27, pdf_annexure = 'main' WHERE rule_id IN ('R-PNT-004','R-PNT-005');                  -- Painting MS + door finish schedule
UPDATE package_rules SET pdf_item_number = 28, pdf_annexure = 'main',                                                              -- Doors / Windows / Ventilators
       pdf_sub_label = CASE
         WHEN rule_id IN ('R-DOR-001','R-DOR-002') THEN 'Entrance Main Door'
         WHEN rule_id IN ('R-DOR-003','R-DOR-004') THEN 'Internal Bedroom Doors'
         WHEN rule_id IN ('R-DOR-005','R-DOR-006') THEN 'Internal Toilet Doors'
         WHEN rule_id IN ('R-DOR-008') THEN 'Puja Room Door'
         WHEN rule_id IN ('R-DOR-009') THEN 'Timber QC'
         WHEN rule_id IN ('R-WIN-001','R-WIN-002','R-WIN-003') THEN 'Windows / Ventilators'
         WHEN rule_id IN ('R-WIN-004') THEN 'Window Grills'
         WHEN rule_id IN ('R-WIN-005') THEN 'Chajjas'
       END
       WHERE rule_id IN ('R-DOR-001','R-DOR-002','R-DOR-003','R-DOR-004','R-DOR-005','R-DOR-006','R-DOR-008','R-DOR-009','R-WIN-001','R-WIN-002','R-WIN-003','R-WIN-004','R-WIN-005');
UPDATE package_rules SET pdf_item_number = 29, pdf_annexure = 'main' WHERE rule_id IN ('R-RLG-001','R-RLG-002');                  -- MS / SS work
UPDATE package_rules SET pdf_item_number = 30, pdf_annexure = 'main',                                                              -- Flooring
       pdf_sub_label = CASE
         WHEN rule_id = 'R-FLR-001' THEN 'Living/Dining/Kitchen/Bedrooms'
         WHEN rule_id = 'R-FLR-002' THEN 'Balcony / Open'
         WHEN rule_id = 'R-FLR-003' THEN 'Toilet Floor'
         WHEN rule_id = 'R-FLR-004' THEN 'Toilet Wall Cladding'
         WHEN rule_id = 'R-FLR-005' THEN 'Utility'
         WHEN rule_id = 'R-FLR-006' THEN 'Staircase / Corridor'
         WHEN rule_id = 'R-FLR-007' THEN 'Parking / Stilt / Setback'
         WHEN rule_id = 'R-FLR-008' THEN 'Marble / Premium Extras'
         WHEN rule_id = 'R-FLR-009' THEN 'Plinth Protection'
         WHEN rule_id = 'R-FLR-010' THEN 'Tile QC'
         WHEN rule_id = 'R-FLR-011' THEN 'Lofts'
         WHEN rule_id = 'R-KIT-002' THEN 'Kitchen Granite Platform'
         WHEN rule_id = 'R-KIT-003' THEN 'Kitchen Wall Dado'
       END
       WHERE rule_id IN ('R-FLR-001','R-FLR-002','R-FLR-003','R-FLR-004','R-FLR-005','R-FLR-006','R-FLR-007','R-FLR-008','R-FLR-009','R-FLR-010','R-FLR-011','R-KIT-002','R-KIT-003');
UPDATE package_rules SET pdf_item_number = 31, pdf_annexure = 'main' WHERE rule_id IN ('R-ELV-001','R-MSC-001','R-MSC-003');       -- Elevation elements + drain covers + lofts/puja
UPDATE package_rules SET pdf_item_number = 32, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-011');                              -- Curing
UPDATE package_rules SET pdf_item_number = 33, pdf_annexure = 'main' WHERE rule_id IN ('R-STR-012');                              -- Scaffolding
UPDATE package_rules SET pdf_item_number = 34, pdf_annexure = 'main' WHERE rule_id IN ('R-MSC-002');                              -- Deep Cleaning

-- ------------------------------------------------------------------
-- E&P Annexure (5 rows)
-- ------------------------------------------------------------------
UPDATE package_rules SET pdf_item_number = 1, pdf_annexure = 'elp' WHERE rule_id IN ('R-ELE-002','R-ELE-007');                    -- Electrical / Power Wiring + inverter mins
UPDATE package_rules SET pdf_item_number = 2, pdf_annexure = 'elp' WHERE rule_id IN ('R-ELE-001','R-ELE-003','R-ELE-005','R-ELE-006','R-ELE-008'); -- Electrical fixtures
UPDATE package_rules SET pdf_item_number = 3, pdf_annexure = 'elp' WHERE rule_id IN ('R-ELE-004');                                -- Distribution Boards
UPDATE package_rules SET pdf_item_number = 4, pdf_annexure = 'elp' WHERE rule_id IN ('R-PLB-001','R-PLB-002','R-PLB-003','R-PLB-004','R-TNK-001','R-TNK-002','R-TNK-003','R-TNK-004'); -- Plumbing
UPDATE package_rules SET pdf_item_number = 5, pdf_annexure = 'elp' WHERE rule_id IN ('R-BTH-001','R-BTH-002','R-BTH-003','R-BTH-004','R-BTH-005','R-BTH-006','R-KIT-001','R-KIT-004','R-KIT-005'); -- Sanitary + kitchen fixtures

-- Anything left over (Commercial + Lift + site conditions ancillary) is not on the PDF annexure — keep pdf_item_number NULL.
-- These will render in a separate "Additional Terms" trailing block or be omitted per user preference.

COMMIT;

-- Report
SELECT pdf_annexure, pdf_item_number,
       COUNT(*) AS rules_bound,
       STRING_AGG(rule_id, ', ' ORDER BY sort_order) AS rule_ids
FROM package_rules
WHERE pdf_item_number IS NOT NULL
GROUP BY pdf_annexure, pdf_item_number
ORDER BY pdf_annexure, pdf_item_number;
