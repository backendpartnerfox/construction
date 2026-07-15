/*
 * Expand plumbing + CP & sanitary brand tiers into package_items_mapping.
 * Tiering (price-based):
 *   Plumbing:      Finolex -> Economy; Prince -> Standard; Supreme -> Pro; Astral, Ashirvad, Hindware -> Premium
 *   CP&Sanitary:   Parryware -> Economy; Hindware -> Standard; Cera -> Pro; Jaquar, Kohler -> Premium
 * Idempotency: aborts if any mapping for a plumbing/sanitary tagged choice already exists.
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PACKAGE_IDS = { Economy: 6, Standard: 1, Pro: 2, Premium: 3 };

const PLUMBING_TIERS = {
  'Finolex':  ['Economy'],
  'Prince':   ['Standard'],
  'Supreme':  ['Pro'],
  'Astral':   ['Premium'],
  'Ashirvad': ['Premium'],
  'Hindware': ['Premium'],
};

const SANITARY_TIERS = {
  'Parryware': ['Economy'],
  'Hindware':  ['Standard'],
  'Cera':      ['Pro'],
  'Jaquar':    ['Premium'],
  'Kohler':    ['Premium'],
};

async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();

  const guard = await client.query(`
    SELECT COUNT(*)::int AS n
    FROM package_items_mapping pim
    JOIN item_choices ic ON ic.choice_option_id = pim.item_choice_id
    WHERE ic.description LIKE '%[mep-plumbing-import-v1]%' OR ic.description LIKE '%[mep-cp-sanitary-import-v1]%'
  `);
  if (guard.rows[0].n > 0) {
    console.error(`ABORT: ${guard.rows[0].n} plumbing/sanitary mappings already exist. Delete them first if you want to re-run.`);
    await client.end();
    process.exit(2);
  }

  try {
    await client.query('BEGIN');
    let inserted = 0;

    async function mapCategory(sourceTag, tierMap, label) {
      const choices = await client.query(
        `SELECT ic.choice_option_id, ic.item_id, ic.brand
         FROM item_choices ic
         WHERE ic.description LIKE $1`,
        [`%${sourceTag}%`]
      );
      for (const row of choices.rows) {
        const packages = tierMap[row.brand];
        if (!packages) {
          console.warn(`  ${label}: no tier for brand "${row.brand}" (choice ${row.choice_option_id}) — skipped`);
          continue;
        }
        for (const pkgName of packages) {
          await client.query(
            `INSERT INTO package_items_mapping (package_id, item_id, item_choice_id) VALUES ($1, $2, $3)`,
            [PACKAGE_IDS[pkgName], row.item_id, row.choice_option_id]
          );
          inserted++;
        }
      }
      console.log(`  ${label}: ${choices.rows.length} choices processed`);
    }

    console.log('Mapping plumbing...');
    await mapCategory('[mep-plumbing-import-v1]', PLUMBING_TIERS, 'Plumbing');

    console.log('Mapping CP & Sanitary...');
    await mapCategory('[mep-cp-sanitary-import-v1]', SANITARY_TIERS, 'CP & Sanitary');

    await client.query('COMMIT');
    console.log(`\nInserted ${inserted} package_items_mapping rows.`);

    const summary = await client.query(`
      SELECT p.package_name, i.item_category, COUNT(DISTINCT pim.item_id) AS items, COUNT(DISTINCT pim.item_choice_id) AS choices
      FROM package_items_mapping pim
      JOIN packages p ON p.id = pim.package_id
      JOIN item_choices ic ON ic.choice_option_id = pim.item_choice_id
      JOIN items i ON i.item_id = pim.item_id
      WHERE i.item_category IN ('Plumbing','CP & Sanitary')
      GROUP BY p.sort_order, p.package_name, i.item_category
      ORDER BY p.sort_order, i.item_category
    `);
    console.table(summary.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
