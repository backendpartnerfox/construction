/*
 * Seed the Unified Package Rulebook (Modules 1–16) into package_rules + package_rule_tiers.
 * Values in RULES[] follow the ⭐ "App default" column of the rulebook.
 * Tier overrides (value_cap / rate_cap / brand_options / included / overage_rate) live in TIERS[].
 * Missing tier row => "same as rule default" (all tiers inherit).
 *
 * Idempotent: TRUNCATE both tables first.
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Package IDs we use as tier keys:
const PKG = { Economy: 6, Standard: 1, Pro: 2, Premium: 3 };

/*
 * Each rule row:
 *   [rule_id, module, rule_type, title, basis, step_size, qty_per_step, rounding, uom, overage_mode, spec_text, measurement_convention]
 * (Any of the middle fields can be null.)
 */
const RULES = [
  // --- Module 1: Earthwork ---
  ['R-ERT-001', 'earthwork', 'risk_allocation',   'Excavation depth baseline', 'per_project', 6.5, null, null, 'ft', 'per_item_rate',   'Baseline 6\'6" (2m) from NGL; beyond charged per extra ft on entire site area.', null],
  ['R-ERT-002', 'earthwork', 'risk_allocation',   'Soil bearing baseline',     'per_project', null, null, null, 'kN/m2', 'actuals',      'Baseline SBC 180 kN/m^2, isolated footings; below → structural redesign at actuals.', null],
  ['R-ERT-003', 'earthwork', 'exclusion',         'Rock cutting',              'per_project', null, null, null, null,  'owner_scope',    'Excluded. Owner scope. Flagged in site survey.', null],
  ['R-ERT-004', 'earthwork', 'entitlement_formula','Backfilling',              'per_project', null, null, null, 'ft',  'actuals',        'Up to 2 ft, plinth area only. Beyond compensated.', null],
  ['R-ERT-005', 'earthwork', 'exclusion',         'Dewatering / ground water', 'per_project', null, null, null, null,  'owner_scope',    'Excluded. Owner bears pumping cost.', null],
  ['R-ERT-006', 'earthwork', 'entitlement_formula','Termite treatment',        'pct_of_PBUA', null, null, null, 'sft', 'per_item_rate',  'Sprayed on backfill and below footing/floor PCC.', null],
  ['R-ERT-007', 'earthwork', 'exclusion',         'Demolition of existing',    'per_project', null, null, null, null,  'market_price',   'Excluded. Owner scope.', null],
  ['R-ERT-008', 'earthwork', 'risk_allocation',   'Site below road level',     'per_project', 1, null, null, 'ft',   'per_item_rate',  'Baseline 6" below road level. Beyond → filling at published rate per ft.', null],
  ['R-ERT-009', 'earthwork', 'process_qc',        'Site survey checklist',     'per_project', null, null, null, null, null,            '16-point Yes/No site conditions form. Each non-standard answer triggers matching escalator rule.', null],

  // --- Module 2: Structure ---
  ['R-STR-001', 'structure', 'entitlement_formula','Steel quantity cap',       'pct_of_PBUA', null, 2.9, null, 'kg/sft', 'actuals',      'Fe-550 TMT up to 2.9 kg/SFT included; excess at actuals per kg.', null],
  ['R-STR-002', 'structure', 'brand_spec',        'Steel grade & brand',       'per_project', null, null, null, null, 'per_item_rate',  'Fe-550 TMT. Brand list per tier at baseline Rs/MT for escalation.', null],
  ['R-STR-003', 'structure', 'dimension_spec',    'Concrete grade',            'per_project', null, null, null, null, null,            'M20/M25 per design mix. RMC threshold: hand-mix allowed <6 cum.', null],
  ['R-STR-004', 'structure', 'brand_spec',        'Cement grade & brand',      'per_project', null, null, null, 'bag', 'per_item_rate', 'RCC: UltraTech. Other works: Nagarjuna 43. Rs/bag baseline for escalation.', null],
  ['R-STR-005', 'structure', 'dimension_spec',    'PCC',                       'per_project', null, null, null, null, null,            '100mm M10 with Robo sand and 40mm aggregate at plinth below GF flooring.', null],
  ['R-STR-006', 'structure', 'dimension_spec',    'Floor height',              'per_project', null, null, null, 'ft', null,            'Choose ONE convention: FFL-to-FFL or slab-top-to-slab-top. Store with value.', 'FFL-to-FFL'],
  ['R-STR-007', 'structure', 'risk_allocation',   'Plinth height',             'per_project', 1, null, null, 'ft',   'per_item_rate',  'Baseline 2\'6". Increase +Rs 48,000/ft; SSM +Rs 160/cuft.', null],
  ['R-STR-008', 'structure', 'risk_allocation',   'Lintels',                   'per_project', null, null, null, 'rft', 'per_item_rate','Over openings only (6" bearing). Full concrete band → Rs 200/rft extra.', null],
  ['R-STR-009', 'structure', 'dimension_spec',    'Parapet wall',              'per_project', null, null, null, null, null,            'Blockwork 3\', 150mm thick, buttress every 10\'.', null],
  ['R-STR-010', 'structure', 'exclusion',         'CRS/SSM below plinth',      'per_project', null, null, null, 'cft', 'per_item_rate','Excluded from package. Rs 160/CFT if required.', null],
  ['R-STR-011', 'structure', 'process_qc',        'Curing regimen',            'per_project', null, null, null, null, null,            '3x/day by watchman with photo proof to app/cloud. RCC 14 days, civil 10 days.', null],
  ['R-STR-012', 'structure', 'process_qc',        'Scaffolding',               'per_project', null, null, null, null, null,            'All sides as per site condition.', null],
  ['R-STR-013', 'structure', 'process_qc',        'Structural inspection',     'per_project', null, null, null, null, null,            'Every RCC stage inspected by licensed structural engineer.', null],

  // --- Module 3: Masonry & Plastering ---
  ['R-MSN-001', 'masonry', 'brand_spec',       'External walls',            'per_project', null, null, null, 'pcs', 'per_item_rate', '9" first-class red brick. Per-brick price baseline for escalation.', null],
  ['R-MSN-002', 'masonry', 'dimension_spec',   'Internal walls',            'per_project', null, null, null, null, null,            '4" red brick.', null],
  ['R-MSN-003', 'masonry', 'dimension_spec',   'Mortar ratios',             'per_project', null, null, null, null, null,            'Internal 1:4, external 1:6, river sand.', null],
  ['R-MSN-004', 'masonry', 'dimension_spec',   'External plaster',          'per_project', null, null, null, null, null,            'Double coat 18mm sponge, CM 1:6 / 1:4.', null],
  ['R-MSN-005', 'masonry', 'dimension_spec',   'Internal plaster',          'per_project', null, null, null, null, null,            'Double coat 12mm sponge. Lift shaft: 2-coat.', null],
  ['R-MSN-006', 'masonry', 'process_qc',       'Crack-control mesh',        'per_project', null, null, null, null, null,            '6" diamond mesh at all wall/beam/column joints, chases, bull markings.', null],
  ['R-MSN-007', 'masonry', 'entitlement_formula','Compound wall',           'per_project', null, null, null, null, 'per_item_rate', 'Included in Premium/Pro; add-on in Economy/Standard. Cement brick 4" to 5\', Rs 25/brick baseline.', null],

  // --- Module 4: Waterproofing ---
  ['R-WPF-001', 'waterproofing', 'dimension_spec', 'Wet-area waterproofing', 'per_project', null, null, null, null, null,            'Toilets/utility/balcony/sump/lift pit: CM 1:4 + WP admixture, slopes + weep holes. Fosroc/Dr Fixit.', null],
  ['R-WPF-002', 'waterproofing', 'process_qc',    'Terrace WP method',      'per_project', null, null, null, null, null,            'Remove dead mortar → Brush Bond coat → 3" WP flooring + haunching, sponge finish to slope.', null],
  ['R-WPF-003', 'waterproofing', 'dimension_spec','Terrace plumbing layout','per_project', null, null, null, null, null,            'Lines at 1 ft height, neatly arranged.', null],
  ['R-WPF-004', 'waterproofing', 'process_qc',    'Honeycomb repair',       'per_project', null, null, null, null, null,            'Epoxy pressure grouting + 1:4 WP plaster. Included.', null],

  // --- Module 5: Doors ---
  ['R-DOR-001', 'doors', 'entitlement_formula', 'Main door count',    'per_DU',       null, 1, null, 'nos', 'per_item_rate', '1 per DU. Extras per plan billed at per_item_rate.', null],
  ['R-DOR-002', 'doors', 'value_cap',           'Main door spec+cap', 'per_item',    null, null, null, 'nos', 'per_item_rate', '32mm veneer flush 3\'6"x7\', Sal frame 3"x5". All-in incl. hardware & polish & install.', null],
  ['R-DOR-003', 'doors', 'entitlement_formula', 'Bedroom door count', 'per_500_PBUA', 500, 1, 'floor', 'nos', 'per_item_rate', 'Max 1 bedroom door per 500 SFT PBUA (hard floor rounding). No intermediate doors.', null],
  ['R-DOR-004', 'doors', 'value_cap',           'Bedroom door spec+cap', 'per_item', null, null, null, 'nos', 'per_item_rate', '32mm flush 3\'x7\', Sal 2.5"x4". All-in.', null],
  ['R-DOR-005', 'doors', 'entitlement_formula', 'Toilet door count',  'per_500_PBUA', 500, 1, 'floor', 'nos', 'per_item_rate', 'Max 1 toilet door per 500 SFT PBUA (hard floor).', null],
  ['R-DOR-006', 'doors', 'value_cap',           'Toilet door spec+cap','per_item',   null, null, null, 'nos', 'per_item_rate', 'WPC full frame + shutter 7\'x2\'9". All-in.', null],
  ['R-DOR-007', 'doors', 'dimension_spec',      'Door painting/finish','per_project', null, null, null, null, null,            'Main: wood polish matt/gloss. Internal: 2 coats Asian. Toilet: water-resistant paint.', null],
  ['R-DOR-008', 'doors', 'exclusion',           'Puja room door',      'per_item',    null, null, null, 'nos', 'per_item_rate','Excluded from package. Add-on with fixtures.', null],
  ['R-DOR-009', 'doors', 'process_qc',          'Timber QC',           'per_project', null, null, null, null, null,            'Seasoned, knot/warp/sap/crack-free, accurately fitted, glued joints.', null],

  // --- Module 6: Windows & Ventilators ---
  ['R-WIN-001', 'windows', 'entitlement_formula', 'Opening area allowance', 'pct_of_PBUA', null, 10, null, 'sft', 'rate_cap',      '10% of PBUA (incl. frames). Denominator = PBUA.', 'PBUA'],
  ['R-WIN-002', 'windows', 'rate_cap',            'Window system',           'per_item',   null, null, null, 'sft', 'prorata',      'Aluminium (Economy/Standard) or UPVC (Pro/Premium). Rate cap per SFT.', null],
  ['R-WIN-003', 'windows', 'dimension_spec',      'Ventilators',             'per_project', null, null, null, null, null,           'Within window allowance. UPVC with exhaust provision, 4mm glass.', null],
  ['R-WIN-004', 'windows', 'rate_cap',            'Window grills',           'per_item',    null, null, null, 'sft', 'prorata',     '10mm MS @125mm spacing, enamel painted. Optional add-on.', null],
  ['R-WIN-005', 'windows', 'dimension_spec',      'Chajjas',                 'per_project', null, null, null, null, null,           '1\' projection, 6" bearing, all windows.', null],

  // --- Module 7: Flooring (rate caps Rs/sft) ---
  ['R-FLR-001', 'flooring', 'rate_cap', 'Living/dining/bedroom/kitchen flooring', 'per_item', null, null, null, 'sft', 'prorata', 'Double-charged vitrified 2\'x2\'.', null],
  ['R-FLR-002', 'flooring', 'rate_cap', 'Balcony / open',                          'per_item', null, null, null, 'sft', 'prorata', 'Anti-skid ceramic. Terrace tiles = add-on.', null],
  ['R-FLR-003', 'flooring', 'rate_cap', 'Toilet floor',                            'per_item', null, null, null, 'sft', 'prorata', 'Anti-skid.', null],
  ['R-FLR-004', 'flooring', 'rate_cap', 'Toilet wall cladding',                    'per_item', null, null, null, 'sft', 'prorata', 'Up to 8\' height.', null],
  ['R-FLR-005', 'flooring', 'rate_cap', 'Utility floor & walls',                   'per_item', null, null, null, 'sft', 'prorata', 'Floor + walls up to 3\'6" height.', null],
  ['R-FLR-006', 'flooring', 'rate_cap', 'Staircase / corridor',                    'per_item', null, null, null, 'sft', 'prorata', 'Granite treads + risers, all-in (no separate laying labour).', null],
  ['R-FLR-007', 'flooring', 'dimension_spec', 'Parking/stilt/setback flooring',    'per_project', null, null, null, null, null,    'Design concrete + pavement tiles 1\'x1\'x25mm. 4" RCC with slope + RCC ramp.', null],
  ['R-FLR-008', 'flooring', 'rate_cap', 'Marble / premium extras',                 'per_item',    null, null, null, 'sft', 'per_item_rate','Indian marble at published extra. Italian marble + chemical extra.', null],
  ['R-FLR-009', 'flooring', 'dimension_spec', 'Plinth protection',                 'per_project', null, null, null, null, null,    '2\' wide plinth protection included.', null],
  ['R-FLR-010', 'flooring', 'process_qc', 'Tile QC',                               'per_project', null, null, null, null, null,    '±1.5mm variance, ≥6mm thick, level/plumb. Roff/Weber grout.', null],
  ['R-FLR-011', 'flooring', 'value_cap',  'Lofts add-on',                          'per_item',    null, null, null, 'sft', 'per_item_rate','Fixed published Rs/sqft add-on.', null],

  // --- Module 8: Kitchen ---
  ['R-KIT-001', 'kitchen', 'entitlement_formula', 'Kitchen entitlement',      'per_DU',    null, 80,  null, 'sft', 'prorata',       '1 kitchen up to 80 SFT per DU. Platform up to 24 SFT.', null],
  ['R-KIT-002', 'kitchen', 'rate_cap',           'Platform',                  'per_item',  null, null, null, 'sft', 'prorata',       'RCC platform with granite top. Rate cap per SFT.', null],
  ['R-KIT-003', 'kitchen', 'rate_cap',           'Dado',                      'per_item',  null, null, null, 'sft', 'prorata',       '2\' height, area-capped.', null],
  ['R-KIT-004', 'kitchen', 'value_cap',          'Sink & faucet',             'per_DU',    null, null, null, 'nos', 'per_item_rate', 'Sink cap + faucet cap (separately).', null],
  ['R-KIT-005', 'kitchen', 'dimension_spec',    'Kitchen taps/points',        'per_DU',    null, null, null, null,  null,            'Purifier inlet; washing-machine in/out; 2 long bibcocks (bore + municipal); RO point.', null],

  // --- Module 9: Bathrooms / CP & Sanitary ---
  ['R-BTH-001', 'bathroom', 'entitlement_formula', 'Bathroom count', 'per_500_PBUA', 500, 1, 'floor', 'nos', 'prorata',           'Formula: 1 per 500 SFT PBUA. Override with plan.', null],
  ['R-BTH-002', 'bathroom', 'value_cap',           'Sanitary budget per bath', 'per_room',   null, null, null, 'nos', 'per_item_rate', 'Room-keyed: master bath Rs X, others Rs Y.', null],
  ['R-BTH-003', 'bathroom', 'fixture_matrix',      'Per-bath fixture set', 'per_room',      null, null, null, 'nos', 'per_item_rate', 'EWC, health faucet, wash basin, basin mixer, overhead shower, 2-in-1 wall mixer, concealed stopcock, hot/cold inlets, geyser in/out, floor traps, semi-pedestal basin.', null],
  ['R-BTH-004', 'bathroom', 'brand_spec',          'Bathroom brands', 'per_project',        null, null, null, null,  null,           'Brand list per tier.', null],
  ['R-BTH-005', 'bathroom', 'value_cap',           'Utility set',    'per_DU',              null, null, null, 'nos', 'per_item_rate','Short bibcock + washing angle cock.', null],
  ['R-BTH-006', 'bathroom', 'dimension_spec',      'Exhaust fan',    'per_room',             null, null, null, 'nos', null,           'Provision + core cutting included. Fixture per tier.', null],

  // --- Module 10: Plumbing ---
  ['R-PLB-001', 'plumbing', 'brand_spec',    'Supply piping',    'per_project', null, null, null, null, null,           'CPVC hot + cold. Astral / Supreme (ISI).', null],
  ['R-PLB-002', 'plumbing', 'dimension_spec','Drainage',         'per_project', null, null, null, null, null,           '6" PVC UG drainage with slope. Manholes cement brick on 4" PCC every 10\'. Gate-to-GHMC on owner.', null],
  ['R-PLB-003', 'plumbing', 'entitlement_formula','Rainwater pipes','per_1000_plot', 1000, 2, null, 'nos', 'prorata',    '2 x 6" per 1000 SFT plot.', null],
  ['R-PLB-004', 'plumbing', 'process_qc',    'External pipes',   'per_project', null, null, null, null, null,           'Raised clamps. Terrace lines at 1\' height.', null],

  // --- Module 11: Electrical ---
  ['R-ELE-001', 'electrical', 'entitlement_formula', 'Common-area fallback', 'per_1000_PBUA', 1000, 5, null, 'nos', 'prorata',       '5 lights + 5x 5A per 1000 SFT PBUA (for unlisted zones).', null],
  ['R-ELE-002', 'electrical', 'brand_spec',    'Wiring',   'per_project', null, null, null, null, null,           'FR copper 1-4 sqmm, Finolex/Polycab. Sudhakar conduit.', null],
  ['R-ELE-003', 'electrical', 'brand_spec',    'Switches', 'per_project', null, null, null, null, null,           'Brand list per tier.', null],
  ['R-ELE-004', 'electrical', 'dimension_spec','DB / MCB', 'per_project', null, null, null, null, null,           'Double-door 4-way TPN. Anchor/HPL sized per load.', null],
  ['R-ELE-005', 'electrical', 'entitlement_formula','Earthing','per_1000_PBUA', 1000, 1, null, 'nos', 'prorata',   '1 earthing point per DU per 1000 SFT PBUA.', null],
  ['R-ELE-006', 'electrical', 'dimension_spec','Two-way switching','per_project', null, null, null, null, null,   'Bedrooms 2-way pairs + staircase per landing.', null],
  ['R-ELE-007', 'electrical', 'entitlement_formula','Inverter wiring minimum','per_DU', null, 2, null, 'nos', 'per_item_rate',       'Minimum living + 1 bedroom (1 light + 1 fan). Additional at per_item_rate.', null],
  ['R-ELE-008', 'electrical', 'exclusion',     'Electrical exclusions','per_project', null, null, null, null, 'owner_scope', 'Main panel, pole-to-panel, road cutting, false-ceiling wiring/lights = owner scope.', null],

  // --- Module 12: Painting ---
  ['R-PNT-001', 'painting', 'brand_spec',    'Exterior painting', 'per_project', null, null, null, null, null,          '1 Asian primer + 2 Ace Exterior. 4 sides + compound wall.', null],
  ['R-PNT-002', 'painting', 'brand_spec',    'Interior painting', 'per_project', null, null, null, null, null,          '2 JK Putty + 1 primer + 2 Tractor Emulsion. Includes staircase, cellar ceiling, columns.', null],
  ['R-PNT-003', 'painting', 'value_cap',     'Colour limit',      'per_project', null, null, null, null, 'per_item_rate','2 colours per room, 6 overall. Extras chargeable.', null],
  ['R-PNT-004', 'painting', 'brand_spec',    'MS painting',       'per_project', null, null, null, null, null,          'Sandpaper + 1 primer + 2 enamel.', null],
  ['R-PNT-005', 'painting', 'dimension_spec','Door finishes',      'per_project', null, null, null, null, null,          'Per-door-type finish schedule incl. polish.', null],

  // --- Module 13: Tanks & Water ---
  ['R-TNK-001', 'tanks', 'value_cap',            'Overhead tank',      'per_DU',       null, 1000, null, 'L', 'per_item_rate', '1000 L double-layer included per DU. +Rs 9/L above.', null],
  ['R-TNK-002', 'tanks', 'value_cap',            'Underground sump',   'per_project',  null, 4000, null, 'L', 'per_item_rate', 'RCC 4000 L included. +Rs 18/L (RCC) or Rs 9/L (blockwork).', null],
  ['R-TNK-003', 'tanks', 'entitlement_formula',  'Septic tank',        'per_project',  null, 3000, null, 'L', 'per_item_rate', 'Precast up to 3000 L included where no sewer. Else excluded with published rates.', null],
  ['R-TNK-004', 'tanks', 'entitlement_formula',  'Rainwater harvesting','per_project', null, null, null, null, 'per_item_rate','Per GHMC/HMDA norms. Size baseline with escalator.', null],

  // --- Module 14: Railings, Elevation & Misc ---
  ['R-RLG-001', 'railings', 'rate_cap', 'Staircase railing',        'per_item', null, null, null, 'sft', 'per_item_rate','SS-202 tubes, 3\' height.', null],
  ['R-RLG-002', 'railings', 'rate_cap', 'Balcony/terrace railings', 'per_item', null, null, null, 'sft', 'per_item_rate','MS baseline. Glass as priced upgrade.', null],
  ['R-ELV-001', 'misc',     'dimension_spec','Elevation elements',  'per_project', null, null, null, null, 'market_price','Tile cladding, glass railing, rafters, texture on MS structure. Above scope compensated.', null],
  ['R-MSC-001', 'misc',     'value_cap',   'External drain covers', 'per_item', null, null, null, 'sft', 'per_item_rate','Natural stone 100mm add-on.', null],
  ['R-MSC-002', 'misc',     'process_qc',  'Deep cleaning',         'per_project', null, null, null, null, null,          'Before handover, to client satisfaction. Included.', null],
  ['R-MSC-003', 'misc',     'value_cap',   'Lofts / puja add-ons',  'per_item', null, null, null, 'sft', 'per_item_rate','Lofts Rs/sqft; puja door fixed. Published rates.', null],

  // --- Module 15: Commercial ---
  ['R-COM-001', 'commercial', 'value_cap',       'Design fees',           'per_project', null, 4.5, null, '%',  null,           'Architectural 2% + pre-construction 2.5% = 4.5% of construction cost.', null],
  ['R-COM-002', 'commercial', 'dimension_spec',  'Price lock',            'per_project', null, 30,  null, 'days', null,         'Quotation valid 30 days.', null],
  ['R-COM-003', 'commercial', 'entitlement_formula','Semi-finished rate', 'pct_of_PBUA', null, 65,  null, '%',  null,           'Parking/passage/headroom = 65% of package rate.', null],
  ['R-COM-004', 'commercial', 'value_cap',       'Delay compensation',    'per_project', null, 2.55,null, '%',  null,           'Lower of last milestone or 2.55% of project value.', null],
  ['R-COM-005', 'commercial', 'value_cap',       'Warranty cap',          'per_project', null, 1,   null, '%',  null,           '1 year, capped 1% of contract value.', null],
  ['R-COM-006', 'commercial', 'value_cap',       'Cancellation slabs',    'per_project', null, null, null, '%',  null,           'Stage-wise cumulative refund penalty (Rs 20k → 8.5%).', null],
  ['R-COM-007', 'commercial', 'process_qc',      'Payments',              'per_project', null, null, null, null, null,          'Escrow only. No cash. GST inclusive display.', null],
  ['R-COM-008', 'commercial', 'process_qc',      'Pre-construction timeline','per_project', null, 64, null, 'days', null,       '~64 days before site work.', null],
  ['R-COM-009', 'commercial', 'risk_allocation', 'Universal overage clause','per_project', null, null, null, null, 'prorata',   'Published rates wherever possible. "Market price" only as last resort.', null],

  // --- Module 16: Lift ---
  ['R-LFT-001', 'lift', 'value_cap', 'Lift sub-structure', 'per_item',    null, null, null, 'nos', 'per_item_rate', 'For 5\'x5\' lift. Foundation + retaining wall + WP + pit. Steel bundled.', null],
  ['R-LFT-002', 'lift', 'value_cap', 'Lift per-floor stop','per_item',    null, null, null, 'nos', 'per_item_rate', 'For 5\'x5\' lift. Additional structure + masonry + finishings + BulkHead/Socket provision.', null],
];

/*
 * Tier overrides. Only include rows that differ from a sensible "same everywhere" baseline.
 * Missing (rule, package) rows → tier row will be auto-created with `included=TRUE` and NULL caps.
 */
const TIERS = [
  // Doors: main/bedroom/toilet door value caps per tier (Rs)
  ['R-DOR-002', 'Economy',  20000, null],   ['R-DOR-002', 'Standard', 25000, null],
  ['R-DOR-002', 'Pro',      35000, null],   ['R-DOR-002', 'Premium',  50000, null],
  ['R-DOR-004', 'Economy',   9000, null],   ['R-DOR-004', 'Standard', 12000, null],
  ['R-DOR-004', 'Pro',      15000, null],   ['R-DOR-004', 'Premium',  18000, null],
  ['R-DOR-006', 'Economy',   9000, null],   ['R-DOR-006', 'Standard', 10000, null],
  ['R-DOR-006', 'Pro',      12000, null],   ['R-DOR-006', 'Premium',  15000, null],

  // Flooring rate caps (Rs/sft) per tier
  ['R-FLR-001', 'Economy', null, 40], ['R-FLR-001', 'Standard', null, 50],
  ['R-FLR-001', 'Pro',     null, 60], ['R-FLR-001', 'Premium',  null, 80],
  ['R-FLR-002', 'Economy', null, 30], ['R-FLR-002', 'Standard', null, 40],
  ['R-FLR-002', 'Pro',     null, 50], ['R-FLR-002', 'Premium',  null, 60],
  ['R-FLR-003', 'Economy', null, 30], ['R-FLR-003', 'Standard', null, 40],
  ['R-FLR-003', 'Pro',     null, 45], ['R-FLR-003', 'Premium',  null, 60],
  ['R-FLR-004', 'Economy', null, 30], ['R-FLR-004', 'Standard', null, 40],
  ['R-FLR-004', 'Pro',     null, 45], ['R-FLR-004', 'Premium',  null, 60],
  ['R-FLR-006', 'Economy', null, 60], ['R-FLR-006', 'Standard', null, 70],
  ['R-FLR-006', 'Pro',     null, 80], ['R-FLR-006', 'Premium',  null, 100],

  // Windows rate cap (Rs/sft)
  ['R-WIN-002', 'Economy', null, 400], ['R-WIN-002', 'Standard', null, 450],
  ['R-WIN-002', 'Pro',     null, 550], ['R-WIN-002', 'Premium',  null, 700],
  ['R-WIN-004', 'Economy', null, 180], ['R-WIN-004', 'Standard', null, 180],
  ['R-WIN-004', 'Pro',     null, 200], ['R-WIN-004', 'Premium',  null, 220],

  // Kitchen platform / dado / sink+faucet
  ['R-KIT-002', 'Economy', null, 80],  ['R-KIT-002', 'Standard', null, 100],
  ['R-KIT-002', 'Pro',     null, 120], ['R-KIT-002', 'Premium',  null, 150],
  ['R-KIT-003', 'Economy', null, 30],  ['R-KIT-003', 'Standard', null, 40],
  ['R-KIT-003', 'Pro',     null, 45],  ['R-KIT-003', 'Premium',  null, 60],
  ['R-KIT-004', 'Economy', 4300, null],['R-KIT-004', 'Standard', 5500, null],
  ['R-KIT-004', 'Pro',     8000, null],['R-KIT-004', 'Premium', 12000, null],

  // Bathroom sanitary per bath (master-bath cap)
  ['R-BTH-002', 'Economy', 15000, null], ['R-BTH-002', 'Standard', 20000, null],
  ['R-BTH-002', 'Pro',     30000, null], ['R-BTH-002', 'Premium',  40000, null],

  // Lift add-on rates match package_addons: 177800 sub, 58100 per floor
  ['R-LFT-001', 'Economy', 177800, null], ['R-LFT-001', 'Standard', 177800, null],
  ['R-LFT-001', 'Pro',     177800, null], ['R-LFT-001', 'Premium',  177800, null],
  ['R-LFT-002', 'Economy',  58100, null], ['R-LFT-002', 'Standard',  58100, null],
  ['R-LFT-002', 'Pro',      58100, null], ['R-LFT-002', 'Premium',   58100, null],

  // Compound wall included only in Pro/Premium
  ['R-MSN-007', 'Economy',  null, null],  ['R-MSN-007', 'Standard', null, null],
  ['R-MSN-007', 'Pro',      null, null],  ['R-MSN-007', 'Premium',  null, null],
  // Termite: included Pro/Premium, add-on in Economy/Standard
  ['R-ERT-006', 'Economy',  null, 24],    ['R-ERT-006', 'Standard', null, 24],

  // Steel excess rate per kg (approx market)
  ['R-STR-001', 'Economy', null, 75],  ['R-STR-001', 'Standard', null, 80],
  ['R-STR-001', 'Pro',     null, 85],  ['R-STR-001', 'Premium',  null, 90],

  // Site escalators (per_item_rate → overage_rate)
];

// (rule_id, tier_name, overage_rate) — third batch: sets overage_rate where different per tier
const OVERAGE_RATES = [
  // Doors extras billed at value_cap × 1.0 (default to cap). Overridable per tier.
  // Site conditions:
  ['R-ERT-001', 'Economy',  38], ['R-ERT-001', 'Standard', 38], ['R-ERT-001', 'Pro', 38], ['R-ERT-001', 'Premium', 38],   // per sft per extra ft
  ['R-ERT-008', 'Economy', 48000], ['R-ERT-008', 'Standard', 48000], ['R-ERT-008', 'Pro', 48000], ['R-ERT-008', 'Premium', 48000], // per ft
  ['R-STR-007', 'Economy', 48000], ['R-STR-007', 'Standard', 48000], ['R-STR-007', 'Pro', 48000], ['R-STR-007', 'Premium', 48000],
  ['R-STR-008', 'Economy', 200], ['R-STR-008', 'Standard', 200], ['R-STR-008', 'Pro', 200], ['R-STR-008', 'Premium', 200], // per rft
  ['R-STR-010', 'Economy', 160], ['R-STR-010', 'Standard', 160], ['R-STR-010', 'Pro', 160], ['R-STR-010', 'Premium', 160], // per cft
  ['R-TNK-001', 'Economy',    9], ['R-TNK-001', 'Standard',   9], ['R-TNK-001', 'Pro',   9], ['R-TNK-001', 'Premium',   9], // per L overhead tank
  ['R-TNK-002', 'Economy',   18], ['R-TNK-002', 'Standard',  18], ['R-TNK-002', 'Pro',  18], ['R-TNK-002', 'Premium',  18], // per L sump
];


async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE package_rule_tiers`);
    await client.query(`TRUNCATE package_rules CASCADE`);

    // Insert rules
    let sort = 0;
    for (const r of RULES) {
      const [rule_id, module, rule_type, title, basis, step_size, qty_per_step, rounding, uom, overage_mode, spec_text, measurement_convention] = r;
      sort++;
      await client.query(
        `INSERT INTO package_rules (rule_id, module, rule_type, title, basis, step_size, qty_per_step, rounding, uom, overage_mode, spec_text, measurement_convention, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [rule_id, module, rule_type, title, basis, step_size, qty_per_step, rounding, uom, overage_mode, spec_text, measurement_convention, sort]
      );
    }

    // Auto-create baseline tier rows for every (rule, package) combo (included = TRUE)
    const pkgs = await client.query(`SELECT id, package_name FROM packages ORDER BY sort_order`);
    for (const r of RULES) {
      for (const p of pkgs.rows) {
        await client.query(
          `INSERT INTO package_rule_tiers (rule_id, package_id, included)
           VALUES ($1, $2, TRUE)
           ON CONFLICT (rule_id, package_id) DO NOTHING`,
          [r[0], p.id]
        );
      }
    }

    // Apply TIERS overrides (value_cap, rate_cap)
    for (const t of TIERS) {
      const [rule_id, tierName, valueCap, rateCap] = t;
      const pkgId = PKG[tierName];
      await client.query(
        `UPDATE package_rule_tiers SET value_cap = COALESCE($3, value_cap), rate_cap = COALESCE($4, rate_cap)
         WHERE rule_id = $1 AND package_id = $2`,
        [rule_id, pkgId, valueCap, rateCap]
      );
    }
    // Apply overage rates
    for (const t of OVERAGE_RATES) {
      const [rule_id, tierName, overageRate] = t;
      const pkgId = PKG[tierName];
      await client.query(
        `UPDATE package_rule_tiers SET overage_rate = $3 WHERE rule_id = $1 AND package_id = $2`,
        [rule_id, pkgId, overageRate]
      );
    }

    await client.query('COMMIT');
    console.log(`inserted ${RULES.length} rules, ${RULES.length * pkgs.rows.length} tier rows`);
    console.log(`updated ${TIERS.length + OVERAGE_RATES.length} tier overrides`);

    // Summary by module
    const sum = await client.query(`
      SELECT module, COUNT(*) AS rules
      FROM package_rules GROUP BY module ORDER BY MIN(sort_order)`);
    console.table(sum.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
