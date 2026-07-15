/*
 * Fill pricing + qty_per_sqft ratios for structural / masonry / aggregate / concrete / cement
 * so that adding these items to a package moves the Cost/SFT calculation.
 *
 * Actions:
 *   1. Fix TMT: convert "per ton" pricing to "per kg" (divide by 1000) to match item_unit
 *   2. Fill missing pricing for other choices using typical Hyderabad market rates
 *   3. Add qty_per_sqft ratios for these items
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Typical Hyderabad G+1 residential prices (base, excl. GST). GST is 18% for all.
const MARKET_RATES = {
  // TMT Bar - per kg (was per ton, need to be normalized)
  'TATA FE 500D TMT Bars':   { base: 65.00, unit: 'kg' },
  'TATA FE 600D TMT Bars':   { base: 72.00, unit: 'kg' },
  'Radha FE 550D TMT Bars':  { base: 68.00, unit: 'kg' },
  // Cement - per bag (50 kg)
  'Nagarjuna OPC 43 Grade Cement': { base: 380.00, unit: 'bag' },
  'Nagarjuna OPC 53 Grade Cement': { base: 400.00, unit: 'bag' },
  'Ultratech OPC 43 Grade Cement': { base: 410.00, unit: 'bag' },
  'Ultratech OPC 53 Grade Cement': { base: 430.00, unit: 'bag' },
  'Ultratech PPC 43 Grade Cement': { base: 390.00, unit: 'bag' },  // already has 486.40 total in DB, will overwrite
  // Aggregate - per cum
  '20mm Aggregate':          { base: 1400.00, unit: 'cum' },
  '40mm Aggregate':          { base: 1350.00, unit: 'cum' },
  'Crusher Run Stone (CRS)': { base: 850.00,  unit: 'cum' },
  // Sand - per cum
  'M-Sand':                            { base: 1750.00, unit: 'cum' },  // display_name for id 8 & 71
  'Manufactured Sand (M-Sand)':        { base: 1750.00, unit: 'cum' },
  'River Fine Sand':                   { base: 3600.00, unit: 'cum' },
  'River Coarse Sand':                 { base: 3200.00, unit: 'cum' },
  'Robo Sand':                         { base: 1600.00, unit: 'cum' },
  'Stone Dust':                        { base: 1050.00, unit: 'cum' },
  'Green Sand':                        { base: 1300.00, unit: 'cum' },
  // RMC - per cum
  'Ultratech RMC M20 (Dust, 43 Grade)': { base: 5300.00, unit: 'cum' },
  'Ultratech RMC M25 (Dust, 53 Grade)': { base: 5900.00, unit: 'cum' },
  'Aparna RMC M20 (Sand, 43 Grade)':    { base: 5500.00, unit: 'cum' },
  'Aparna RMC M25 (Sand, 53 Grade)':    { base: 6100.00, unit: 'cum' },
  // Brick - per pc
  'Standard Fly Ash Brick':  { base: 7.60, unit: 'pcs' },
  'Standard Cement Brick':   { base: 8.50, unit: 'pcs' },
  'Standard Red Clay Brick': { base: 11.00, unit: 'pcs' },
};

// Qty per SFT of built-up area, wastage %, notes
const QTY_RATIOS = [
  { where: `item_name = 'TMT Bar' AND item_unit = 'kg'`,        qty: 3.5,   wastage: 3, notes: 'Comparison sheet: up to 3.5 kg per SFT' },
  { where: `item_name = 'Cement' AND item_category = 'Binding Material'`, qty: 0.40,  wastage: 5, notes: '~0.4 bags per SFT (foundation + walls + slab)' },
  { where: `item_name = 'Aggregate' AND item_category = 'Aggregate'`,     qty: 0.030, wastage: 5, notes: '~0.03 cum per SFT' },
  { where: `item_name = 'Sand' AND item_category = 'Aggregate'`,          qty: 0.020, wastage: 5, notes: '~0.02 cum per SFT (walls + plaster)' },
  { where: `item_name = 'RMC' AND item_category = 'Concrete'`,            qty: 0.060, wastage: 3, notes: '~0.06 cum per SFT (slab + beams)' },
  { where: `item_name = 'Brick' AND item_category = 'Masonry'`,           qty: 6.0,   wastage: 5, notes: '~6 bricks per SFT (walls averaged over floor area)' },
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();

  try {
    await client.query('BEGIN');

    // 1. Update or insert pricing for named choices
    let priceRows = 0;
    for (const [displayName, spec] of Object.entries(MARKET_RATES)) {
      const choices = await client.query(
        `SELECT choice_option_id FROM item_choices WHERE display_name = $1 AND is_active = TRUE`,
        [displayName]
      );
      for (const c of choices.rows) {
        // Delete existing pricing for this choice, then insert fresh (avoid multiple active rows)
        await client.query(
          `DELETE FROM item_choice_pricing WHERE choice_option_id = $1`,
          [c.choice_option_id]
        );
        await client.query(
          `INSERT INTO item_choice_pricing (choice_option_id, base_price, unit_of_measurement, gst_percentage, is_active)
           VALUES ($1, $2, $3, 18.00, TRUE)`,
          [c.choice_option_id, spec.base, spec.unit]
        );
        priceRows++;
      }
    }

    // 2. Add qty_per_sqft ratios
    let ratioRows = 0;
    for (const rule of QTY_RATIOS) {
      const items = await client.query(
        `SELECT item_id FROM items WHERE is_active = TRUE AND ${rule.where}`
      );
      for (const it of items.rows) {
        await client.query(
          `INSERT INTO item_qty_per_sqft (item_id, package_id, qty_per_sqft, wastage_pct, notes)
           VALUES ($1, NULL, $2, $3, $4)
           ON CONFLICT (item_id, package_id) DO UPDATE
             SET qty_per_sqft = EXCLUDED.qty_per_sqft, wastage_pct = EXCLUDED.wastage_pct, notes = EXCLUDED.notes, updated_at = NOW()`,
          [it.item_id, rule.qty, rule.wastage, rule.notes]
        );
        ratioRows++;
      }
    }

    await client.query('COMMIT');
    console.log(`Priced ${priceRows} choices.`);
    console.log(`Added/updated ${ratioRows} qty ratios.`);

    // Print summary of what's now priced
    const summary = await client.query(`
      SELECT i.item_category, i.item_name,
             (SELECT COUNT(*) FROM item_choices ic WHERE ic.item_id = i.item_id) AS choices,
             (SELECT COUNT(*) FROM item_choices ic JOIN item_choice_pricing icp ON icp.choice_option_id = ic.choice_option_id
                WHERE ic.item_id = i.item_id AND icp.is_active = TRUE) AS priced,
             iq.qty_per_sqft, iq.wastage_pct
      FROM items i
      LEFT JOIN item_qty_per_sqft iq ON iq.item_id = i.item_id AND iq.package_id IS NULL
      WHERE i.item_category IN ('Structural','Aggregate','Binding Material','Concrete','Masonry')
        AND i.is_active = TRUE
        AND EXISTS (SELECT 1 FROM item_choices ic WHERE ic.item_id = i.item_id)
      ORDER BY i.item_category, i.item_name, i.item_id
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
