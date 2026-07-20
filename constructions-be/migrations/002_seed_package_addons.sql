-- Seed common add-ons (applies to all packages; package_id NULL).
-- Rates are B&B-style typical for Hyderabad G+3/G+4.

INSERT INTO package_addons (package_id, name, description, unit, default_rate, inclusions, exclusions, sort_order) VALUES
(NULL, 'Lift Provision - Sub Structure (Above G+2)',
       'For lift of 5''x5''.',
       'unit', 177800,
       'Lift foundation; retaining wall upto Lift ground level; additional structure; waterproofing for lift pit',
       'Steel', 10),

(NULL, 'Lift Provision - Super Structure per Floor',
       'Per floor stop, for lift of 5''x5''. After deduction of lift cutout size including walls.',
       'per_floor', 58100,
       'Additional structure; masonry walls; finishings; provision for BulkHead/Socket',
       'Steel; 3-core 4-sqmm copper cable; 32A 4-pole MCB with distribution panel; earthing pit', 20),

(NULL, 'Compound Wall (SS/MS)',
       '5 ft height, cement block masonry with buttress every 10 ft.',
       'per_sft', 1699,
       'Block masonry; buttresses; foundation SSM; plaster; paint',
       'Gate; wickets', 30),

(NULL, 'Rain Water Harvesting Pit',
       '7 ft depth per GHMC/HMDA norms.',
       'unit', 30000,
       'Rings installation; coarse and fine aggregate bed',
       'Filter media beyond spec', 40),

(NULL, 'Antitermite Treatment',
       'Chemical treatment before plinth work.',
       'per_sft', 24, NULL, NULL, 50),

(NULL, 'Puja Room',
       'Additional puja room fitout.',
       'unit', 31000,
       'Door with fixtures',
       'Idol; interior décor', 60),

(NULL, 'External Drain Cover (100mm, natural stone)',
       'Per sq.ft of drain cover area.',
       'per_sft', 300, NULL, NULL, 70),

(NULL, 'SSM Below Plinth',
       'Size stone masonry below the plinth beam.',
       'per_cft', 160, NULL, NULL, 80),

(NULL, 'Overhead Tank Extra Capacity',
       'Per litre above the 1000 L included in package.',
       'per_ltr', 9, NULL, NULL, 90),

(NULL, 'RCC Underground Sump Extra Capacity',
       'Per litre above the 4000 L included in package.',
       'per_ltr', 18, NULL, NULL, 100)
ON CONFLICT DO NOTHING;

SELECT COUNT(*) AS addons_available FROM package_addons;
