/*
 * Populate item_qty_per_sqft with typical Hyderabad G+1 residential ratios.
 * All ratios are per SFT of built-up area. package_id=NULL means "applies to any package".
 * Idempotent: TRUNCATE first then insert.
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Map by item_name -> qty/sqft (assumes items are uniquely named enough after MEP import).
// For duplicates in DB, we use the row that has priced choices.
const RATIOS = [
  // Electrical - switchboard components (in Pc/SFT). Typical 1000 SFT house: ~20 switches, 15 sockets.
  { where: `item_name IN ('Switch','2 Way Switch','Bell Switch','Dummy','Regulator')`, qty: 0.020, wastage: 5, notes: 'Typical switch density incl. bell/regulator' },
  { where: `item_name IN ('Socket','Data Socket','Plug 6amps','Plug 16amps')`,          qty: 0.015, wastage: 5, notes: 'Typical socket density incl. data/plug points' },
  { where: `item_name LIKE 'Face Plate %'`,                                              qty: 0.008, wastage: 5, notes: 'One plate per gang box (~8 per 1000 SFT)' },
  { where: `item_name = 'Wire' AND item_category = 'Electrical'`,                        qty: 1.20,  wastage: 8, notes: '~1200 m per 1000 SFT (all circuits combined)' },
  { where: `item_name = 'Switchgear' AND item_category = 'Electrical'`,                  qty: 0.006, wastage: 0, notes: 'MCBs in main + sub DBs' },

  // Plumbing (per SFT)
  { where: `item_name LIKE 'Pipe %' AND item_category = 'Plumbing'`,                     qty: 0.20, wastage: 8, notes: '~200 m per 1000 SFT (hot+cold+drain simplified)' },
  { where: `item_name LIKE 'Elbow %' OR item_name LIKE 'Tee %' OR item_name LIKE 'Coupler %'`, qty: 0.10, wastage: 10, notes: '~100 fittings per 1000 SFT (avg)' },
  { where: `item_name LIKE 'FTA %' OR item_name LIKE 'MTA %'`,                           qty: 0.03, wastage: 10, notes: '~30 threaded adaptors per 1000 SFT' },
  { where: `item_name LIKE 'Ball Valve %'`,                                              qty: 0.008, wastage: 0, notes: '~8 shut-offs per 1000 SFT' },
  { where: `item_name LIKE 'Brass %'`,                                                   qty: 0.008, wastage: 5, notes: '~8 brass fittings per 1000 SFT' },
  { where: `item_name = 'Solvent Cement (250ml)'`,                                       qty: 0.003, wastage: 0, notes: '~3 tins per 1000 SFT' },

  // CP & Sanitary (per SFT) - a 1000 SFT house has ~2 bathrooms + 1 kitchen
  { where: `item_name IN ('Pillar Cock / Basin Mixer','Wall Mixer with Provision for Overhead Shower','Health Faucet with 1.5 Meter Tube & Wall Hook','2-In-1 Bib Cock','Concealed Stop Cock (Regular Size)','Overhead Shower (ABS Chrome Plated Body)')`, qty: 0.003, wastage: 0, notes: '~3 per 1000 SFT (per fixture type)' },
  { where: `item_name IN ('Wall Hung Water Closet (WC) with Slim Seat Cover','Wash Basin (Wall Mounted with Half Pedestal)')`, qty: 0.002, wastage: 0, notes: '~2 WCs / basins per 1000 SFT' },
  { where: `item_name IN ('Kitchen Sink (Double Bowl with Drain Board, SS)','Kitchen Sink Faucet (Pillar Cock)','Angle Cock (with Wall Flange)')`, qty: 0.001, wastage: 0, notes: '~1 per 1000 SFT (per fixture type)' },
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE TABLE item_qty_per_sqft`);
    let inserted = 0, skippedNoItem = 0;

    for (const rule of RATIOS) {
      const itemsRes = await client.query(
        `SELECT DISTINCT i.item_id, i.item_name
         FROM items i
         JOIN item_choices ic ON ic.item_id = i.item_id
         JOIN item_choice_pricing icp ON icp.choice_option_id = ic.choice_option_id
         WHERE i.is_active = TRUE AND ${rule.where}`
      );
      if (itemsRes.rows.length === 0) {
        console.warn(`  no priced items match: ${rule.where.slice(0, 60)}...`);
        skippedNoItem++;
        continue;
      }
      for (const it of itemsRes.rows) {
        await client.query(
          `INSERT INTO item_qty_per_sqft (item_id, package_id, qty_per_sqft, wastage_pct, notes)
           VALUES ($1, NULL, $2, $3, $4)
           ON CONFLICT (item_id, package_id) DO UPDATE
             SET qty_per_sqft = EXCLUDED.qty_per_sqft, wastage_pct = EXCLUDED.wastage_pct, notes = EXCLUDED.notes, updated_at = NOW()`,
          [it.item_id, rule.qty, rule.wastage, rule.notes]
        );
        inserted++;
      }
    }

    await client.query('COMMIT');
    console.log(`\nInserted ${inserted} qty_per_sqft rows (${skippedNoItem} rules skipped for no matching items).`);

    const summary = await client.query(`
      SELECT i.item_category, COUNT(*) AS items_covered, MIN(iq.qty_per_sqft) AS min_qty, MAX(iq.qty_per_sqft) AS max_qty
      FROM item_qty_per_sqft iq
      JOIN items i ON i.item_id = iq.item_id
      GROUP BY i.item_category
      ORDER BY i.item_category
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
