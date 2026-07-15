/*
 * Import Plumbing section of MEP_Procurement_Master_Pricelist.xlsx.
 * Creates: 15 items, 180 item_choices, 180 item_choice_pricing.
 * NO package_items_mapping — sheet has no package matrix for plumbing.
 *
 * Usage:  node scripts/import_plumbing_pricelist.js
 */
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const XLSX_PATH = 'C:/Users/fs1.PartnerFoxACER/Downloads/MEP_Procurement_Master_Pricelist.xlsx';
const SOURCE_TAG = '[mep-plumbing-import-v1]';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  const wb = XLSX.readFile(XLSX_PATH);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Plumbing Pricelist Matrix'], { defval: '' });

  const guard = await client.query(
    `SELECT COUNT(*)::int AS n FROM item_choices WHERE description LIKE $1`,
    [`%${SOURCE_TAG}%`]
  );
  if (guard.rows[0].n > 0) {
    console.error(`ABORT: ${guard.rows[0].n} rows already tagged ${SOURCE_TAG}. Delete them first if you want to re-import.`);
    await client.end();
    process.exit(2);
  }

  try {
    await client.query('BEGIN');

    // Items — unique plumbing item names. Unit is per-row, so pick the first packing unit we see.
    const itemUnitByName = new Map();
    for (const r of rows) {
      const name = r['Plumbing Item List'].toString().trim();
      if (!itemUnitByName.has(name)) itemUnitByName.set(name, (r['Packing Unit'] || 'Pc').toString().trim());
    }

    const itemIdByName = new Map();
    for (const [name, unit] of itemUnitByName) {
      const r = await client.query(
        `INSERT INTO items (item_name, item_description, item_unit, item_category, is_active)
         VALUES ($1, $2, $3, 'Plumbing', TRUE)
         RETURNING item_id`,
        [name, `${SOURCE_TAG} ${name}`, unit]
      );
      itemIdByName.set(name, r.rows[0].item_id);
    }

    // Choices + pricing
    for (const r of rows) {
      const brand = r['Brand'].toString().trim();
      const series = r['Series/Material Type'].toString().trim();
      const itemName = r['Plumbing Item List'].toString().trim();
      const itemId = itemIdByName.get(itemName);
      const displayName = `${brand} ${series} ${itemName}`;

      const choiceRes = await client.query(
        `INSERT INTO item_choices
           (item_id, item_material_type, brand, series, display_name, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING choice_option_id`,
        [itemId, 'Plumbing', brand, series, displayName, `${SOURCE_TAG} ${displayName}`]
      );
      const choiceId = choiceRes.rows[0].choice_option_id;

      const net = Number(r['Price per Unit (Net)']) || 0;
      const gstPct = (Number(r['GST (%)']) || 0) * 100;

      await client.query(
        `INSERT INTO item_choice_pricing
           (choice_option_id, base_price, unit_of_measurement, gst_percentage, is_active)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [choiceId, net, r['Packing Unit'] || 'Pc', gstPct]
      );
    }

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM items WHERE item_description LIKE $1) AS items,
        (SELECT COUNT(*) FROM item_choices WHERE description LIKE $1) AS choices,
        (SELECT COUNT(*) FROM item_choice_pricing icp
           JOIN item_choices ic ON ic.choice_option_id = icp.choice_option_id
           WHERE ic.description LIKE $1) AS pricing_rows
    `, [`%${SOURCE_TAG}%`]);

    await client.query('COMMIT');
    console.log('=== PLUMBING IMPORT SUMMARY ===');
    console.log(`items inserted:                ${counts.rows[0].items}`);
    console.log(`item_choices inserted:         ${counts.rows[0].choices}`);
    console.log(`item_choice_pricing inserted:  ${counts.rows[0].pricing_rows}`);
    console.log(`package_items_mapping:         0  (no plumbing package matrix in xlsx)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — import failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
