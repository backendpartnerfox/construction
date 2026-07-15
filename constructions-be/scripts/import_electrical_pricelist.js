/*
 * Import Electrical section of MEP_Procurement_Master_Pricelist.xlsx into DB.
 * Idempotent-ish: guarded by a "source_tag" marker inserted into item_choices.description.
 * Re-running will abort if it detects the tag already present.
 *
 * Usage:  node scripts/import_electrical_pricelist.js
 */
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const XLSX_PATH = 'C:/Users/fs1.PartnerFoxACER/Downloads/MEP_Procurement_Master_Pricelist.xlsx';
const SOURCE_TAG = '[mep-electrical-import-v1]';

const PACKAGE_IDS = { Economy: 6, Standard: 1, Pro: 2, Premium: 3 };
const PACKAGES = ['Economy', 'Standard', 'Pro', 'Premium'];

const SWITCH_ITEM_UNIT = 'Pc';
const WIRE_ITEM_UNIT = 'meter';
const SWITCHGEAR_ITEM_UNIT = 'Pc';

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

// Sheet-1 brand/series → sheet-2 canonical (case + typo fixes).
// Left side is the normalized sheet-1 value; value is the canonical (brand, series).
const SERIES_ALIAS = {
  'anchor|penta':      { brand: 'Anchor',    series: 'Penta' },
  'anchor|roma':       { brand: 'Anchor',    series: 'Roma' },
  'legrand|allzy':     { brand: 'Legrand',   series: 'Allzy' },
  'legrand|mylinc':    { brand: 'Legrand',   series: 'Mylinc' },
  'legrand|lyncus':    { brand: 'Legrand',   series: 'Lyncus' },
  'legrand|myrius':    { brand: 'Legrand',   series: 'Myrius' },
  'legrand|arteor':    { brand: 'Legrand',   series: 'Arteor' },
  'honeywell|wraparound': { brand: 'Honeywell', series: 'Wraparound' },
  'vguard|torio':      { brand: 'V-Guard',   series: 'Torio' },
  'vguard|matteo':     { brand: 'V-Guard',   series: 'Matteo' },
  'gm|cuba':           { brand: 'GM',        series: 'Cuba' },
  'gm|fourfive':       { brand: 'GM',        series: 'Fourfive' },
  'schneider|livia':   { brand: 'Schneider', series: 'Livia' },
  'schneider|opale':   { brand: 'Schneider', series: 'Opale' },
  'l&t|engm':          { brand: 'L&T',       series: 'Engem' },
  'l&t|entice':        { brand: 'L&T',       series: 'Entice' },
  'havells|coral':     { brand: 'Havells',   series: 'Coral' },
  // Ambiguity: sheet 1 says "crabtree/vorona" but sheet 2 has "Havells/Vorana" with pricing.
  // Treat as sheet-1 typo → Havells Vorana. Flag in report.
  'crabtree|vorona':   { brand: 'Havells',   series: 'Vorana', note: 'assumed sheet-1 typo of Havells/Vorana' },
};

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
  const priceRows = XLSX.utils.sheet_to_json(wb.Sheets['Electrical Pricelist Matrix'], { defval: '' });
  const pkgRows = XLSX.utils.sheet_to_json(wb.Sheets['Electrical'], { header: 1, defval: '' });

  // Guard: don't double-import.
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

    // ---------- 1. Insert Switch items ----------
    const switchItemNames = [...new Set(priceRows.map(r => r['Electrical Item List']))];
    const switchItemIdByName = new Map();
    for (const name of switchItemNames) {
      const r = await client.query(
        `INSERT INTO items (item_name, item_description, item_unit, item_category, is_active)
         VALUES ($1, $2, $3, 'Electrical', TRUE)
         RETURNING item_id`,
        [name, `${SOURCE_TAG} ${name}`, SWITCH_ITEM_UNIT]
      );
      switchItemIdByName.set(name, r.rows[0].item_id);
    }

    // ---------- 2. Insert Wire + Switchgear items ----------
    const wireItem = (await client.query(
      `INSERT INTO items (item_name, item_description, item_unit, item_category, is_active)
       VALUES ('Wire', $1, $2, 'Electrical', TRUE) RETURNING item_id`,
      [`${SOURCE_TAG} Electrical Wire`, WIRE_ITEM_UNIT]
    )).rows[0].item_id;

    const switchgearItem = (await client.query(
      `INSERT INTO items (item_name, item_description, item_unit, item_category, is_active)
       VALUES ('Switchgear', $1, $2, 'Electrical', TRUE) RETURNING item_id`,
      [`${SOURCE_TAG} Electrical Switchgear`, SWITCHGEAR_ITEM_UNIT]
    )).rows[0].item_id;

    // ---------- 3. Insert Switch choices + pricing from Sheet 2 ----------
    // choice key = brand|series|itemName (normalized)
    const switchChoiceIdByKey = new Map();
    for (const r of priceRows) {
      const brand = r['Brand'].toString().trim();
      const series = r['Series'].toString().trim();
      const itemName = r['Electrical Item List'].toString().trim();
      const itemId = switchItemIdByName.get(itemName);
      const displayName = `${brand} ${series} ${itemName}`;

      const choiceRes = await client.query(
        `INSERT INTO item_choices
           (item_id, item_material_type, brand, series, display_name, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING choice_option_id`,
        [itemId, 'Switch', brand, series, displayName, `${SOURCE_TAG} ${displayName}`]
      );
      const choiceId = choiceRes.rows[0].choice_option_id;
      switchChoiceIdByKey.set(`${norm(brand)}|${norm(series)}|${norm(itemName)}`, choiceId);

      const net = Number(r['Price per Unit (Net)']) || 0;
      const gstPct = (Number(r['GST (%)']) || 0) * 100; // sheet has 0.18 = 18%

      // gst_amount and total_price are GENERATED columns — don't insert them.
      await client.query(
        `INSERT INTO item_choice_pricing
           (choice_option_id, base_price, unit_of_measurement, gst_percentage, is_active)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [choiceId, net, r['Packing Unit'] || 'Pc', gstPct]
      );
    }

    // ---------- 4. Parse Sheet 1 into brand+series → packages ----------
    let section = null;
    const sheet1 = [];
    for (let i = 0; i < pkgRows.length; i++) {
      const r = pkgRows[i];
      // Row 1 is the header "Economy Standard Pro Premium"
      if (i === 1) continue;
      // Section header row: col A has text, cols C-F empty
      if (r[0] && !r[2] && !r[3] && !r[4] && !r[5]) {
        section = r[0].toString().trim();
        continue;
      }
      const brand = (r[0] || '').toString().trim();
      const series = (r[1] || '').toString().trim();
      const pkgs = PACKAGES.filter((_, idx) => (r[2 + idx] || '').toString().trim().toUpperCase() === 'Y');
      if (!pkgs.length) continue;
      // Brand may be blank on continuation rows → inherit from previous non-blank
      const lastBrand = brand || sheet1.slice().reverse().find(x => x.section === section)?.brand || '';
      sheet1.push({ section, brand: lastBrand, series, packages: pkgs });
    }

    // ---------- 5. Package mappings ----------
    let mappingCount = 0;
    const warnings = [];
    for (const row of sheet1) {
      if (row.section === 'Switches') {
        const key = `${norm(row.brand)}|${norm(row.series)}`;
        const canon = SERIES_ALIAS[key];
        if (!canon) {
          warnings.push(`No sheet-2 canonical for Switches brand/series: ${row.brand} / ${row.series}`);
          continue;
        }
        if (canon.note) warnings.push(`${row.brand}/${row.series} → ${canon.brand}/${canon.series} (${canon.note})`);
        // Insert (package, item, choice) for each of the 15 items in this brand/series
        for (const itemName of switchItemNames) {
          const choiceKey = `${norm(canon.brand)}|${norm(canon.series)}|${norm(itemName)}`;
          const choiceId = switchChoiceIdByKey.get(choiceKey);
          const itemId = switchItemIdByName.get(itemName);
          if (!choiceId) {
            warnings.push(`Missing choice for ${canon.brand}/${canon.series}/${itemName}`);
            continue;
          }
          for (const pkgName of row.packages) {
            await client.query(
              `INSERT INTO package_items_mapping (package_id, item_id, item_choice_id) VALUES ($1, $2, $3)`,
              [PACKAGE_IDS[pkgName], itemId, choiceId]
            );
            mappingCount++;
          }
        }
      } else if (row.section === 'Wire' || row.section === 'Swtich Gears' || row.section === 'Switch Gears') {
        const itemId = (row.section === 'Wire') ? wireItem : switchgearItem;
        const materialType = (row.section === 'Wire') ? 'Wire' : 'Switchgear';
        // Brand-only choice, no pricing
        const displayName = `${row.brand} ${materialType}`;
        const choiceRes = await client.query(
          `INSERT INTO item_choices
             (item_id, item_material_type, brand, series, display_name, description, is_active)
           VALUES ($1, $2, $3, NULL, $4, $5, TRUE)
           RETURNING choice_option_id`,
          [itemId, materialType, row.brand, displayName, `${SOURCE_TAG} ${displayName}`]
        );
        const choiceId = choiceRes.rows[0].choice_option_id;
        for (const pkgName of row.packages) {
          await client.query(
            `INSERT INTO package_items_mapping (package_id, item_id, item_choice_id) VALUES ($1, $2, $3)`,
            [PACKAGE_IDS[pkgName], itemId, choiceId]
          );
          mappingCount++;
        }
      }
    }

    // ---------- 6. Report ----------
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM items WHERE item_description LIKE $1) AS items,
        (SELECT COUNT(*) FROM item_choices WHERE description LIKE $1) AS choices,
        (SELECT COUNT(*) FROM item_choice_pricing icp
           JOIN item_choices ic ON ic.choice_option_id = icp.choice_option_id
           WHERE ic.description LIKE $1) AS pricing_rows
    `, [`%${SOURCE_TAG}%`]);

    await client.query('COMMIT');
    console.log('=== IMPORT SUMMARY ===');
    console.log(`items inserted:                ${counts.rows[0].items}`);
    console.log(`item_choices inserted:         ${counts.rows[0].choices}`);
    console.log(`item_choice_pricing inserted:  ${counts.rows[0].pricing_rows}`);
    console.log(`package_items_mapping inserted:${mappingCount}`);
    if (warnings.length) {
      console.log('\n=== WARNINGS ===');
      warnings.forEach(w => console.log('  - ' + w));
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK — import failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
