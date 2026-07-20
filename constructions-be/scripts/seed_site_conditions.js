/*
 * Seed the 16 site-conditions checkpoints from the B&B PDF (pages 17-18)
 * and link each to the rulebook rule it triggers when the answer deviates from the standard.
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// [code, question, standard_answer, deviation_answer, triggers_rule_id, default_impact]
const CHECKPOINTS = [
  ['offsets',           'Offsets provided by left, right and back neighbours?',   '>3 Ft',       '<3 Ft',   null,          'Reduced scaffolding + skilled work required'],
  ['electric_pole',     'Electric Pole/Transformer location near to site?',       'No',          'Yes',     null,          'Extra safety scaffolding + BESCOM coordination'],
  ['existing_demo',     'Existing infrastructure on site to be demolished?',      'No',          'Yes',     'R-ERT-007',   'Demolition & disposal at market price'],
  ['labour_shed',       'At least 64 sqft area available for labour shed?',       'Yes',         'No',      null,          'Off-site labour housing → productivity loss'],
  ['labour_stay',       'Is labour allowed to stay at site?',                     'Yes',         'No',      null,          'Off-site labour housing → productivity loss'],
  ['storage_10pct',     '10% of site area for storage of materials?',             'Yes',         'No',      null,          'Off-site material staging cost'],
  ['storage_near',      'If Yes, is storage area near the site?',                 'Yes',         'No',      null,          'Extra material handling / transport'],
  ['road_width',        'Road width in front of the plot (excluding footpath)?',  '>20 ft',      '<20 ft',  null,          'Small vehicles only → higher transport cost'],
  ['road_traffic',      'Road traffic conditions at the plot?',                   'Low',         'High',    null,          'Night-only material movement → schedule impact'],
  ['level_diff',        'Difference in level of site vs centre of road?',         '0 Ft',        '>0 Ft',   'R-ERT-008',   'Site fill or SSM required'],
  ['slope',             'Is there any slope in the plot?',                        'No',          'Yes',     'R-ERT-008',   'Retaining / grading works'],
  ['rock_terrain',      'Is there any rocky terrain present on site?',            'No',          'Yes',     'R-ERT-003',   'Rock cutting & disposal at owner scope'],
  ['rock_shared',       'Rocky terrain shared with neighbouring building?',       'No',          'Yes',     'R-ERT-003',   'Cutting near existing structure = higher cost'],
  ['water_table',       'Water table high?',                                      'No',          'Yes',     'R-ERT-005',   'Dewatering pumps required at owner scope'],
  ['site_contour',      'Is site contour provided?',                              'Yes',         'No',      null,          'Contour survey needed'],
  ['drainage_marked',   'Drainage line marking and information provided?',        'Yes',         'No',      null,          'Additional survey / GHMC coordination'],
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE site_conditions_catalog RESTART IDENTITY CASCADE`);
    let n = 1;
    for (const [code, question, std, dev, trigger, impact] of CHECKPOINTS) {
      await client.query(
        `INSERT INTO site_conditions_catalog (code, question, standard_answer, deviation_answer, triggers_rule_id, default_impact, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [code, question, std, dev, trigger, impact, n++]
      );
    }
    await client.query('COMMIT');
    console.log(`inserted ${CHECKPOINTS.length} site conditions`);
    const r = await client.query(`SELECT code, standard_answer, triggers_rule_id FROM site_conditions_catalog ORDER BY sort_order`);
    console.table(r.rows);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
