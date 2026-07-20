/*
 * Import the Package Comparison sheet (Comparison_HYD.xlsx) into package_specifications.
 * Sheet is a matrix: rows = features, cols B-E = Economy | Standard | Standard Pro | Premium.
 * Rows with only col A filled are section headers.
 * Rows named 'Item' are the repeated column-title headers — skip.
 *
 * Sheet has package name 'Standard Pro'; our DB has 'Pro'. Map accordingly.
 * The row header column is Sheet's own 'Item / Economy / Standard / Standard Pro / Premium'
 * so we only care about numeric offsets.
 */
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const XLSX_PATH = 'C:/Users/fs1.PartnerFoxACER/Downloads/Comparison_HYD.xlsx';

// Sheet's column heading order → DB package name.
const SHEET_TO_DB = {
  'Economy':       'Economy',
  'Standard':      'Standard',
  'Standard Pro':  'Pro',
  'Premium':       'Premium',
};

async function main() {
  const client = new Client({
    host: process.env.DB_HOST, user: process.env.DB_USER, port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await client.connect();

  try {
    // Resolve package IDs by name
    const pkgRes = await client.query(`SELECT id, package_name FROM packages`);
    const pkgIdByName = new Map(pkgRes.rows.map(r => [r.package_name, r.id]));

    const wb = XLSX.readFile(XLSX_PATH);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['Package Comparison'], { header: 1, defval: '' });

    let section = null;
    let columnNames = null; // ['Economy','Standard','Standard Pro','Premium']
    const inserts = [];  // {package_name, section, feature, spec_text, sort_order}
    let sortCounter = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const a = (r[0] || '').toString().trim();
      const cols = [r[1], r[2], r[3], r[4]].map(c => (c || '').toString().trim());
      const otherEmpty = cols.every(c => c === '');

      if (i === 0 || i === 1) {
        // First rows are the banner + column-title row
        if (a === 'Item' || (r[1] === 'Economy' && r[2] === 'Standard')) {
          columnNames = cols;   // ['Economy','Standard','Standard Pro','Premium']
        } else if (a && otherEmpty) {
          section = a;
        }
        continue;
      }

      // 'Item' repeats as header before each new section — refresh column mapping.
      if (a === 'Item' && r[1] === 'Economy') { columnNames = cols; continue; }
      // Section header row: col A has text, all others empty
      if (a && otherEmpty) { section = a; continue; }
      // No feature name → skip
      if (!a) continue;
      // Section not yet known → skip
      if (!section) continue;

      // Otherwise this is a feature row: cols[0..3] are the 4 package specs
      cols.forEach((text, idx) => {
        if (!text) return;
        const sheetPkgName = columnNames ? columnNames[idx] : null;
        const dbPkgName = SHEET_TO_DB[sheetPkgName] || null;
        if (!dbPkgName) return;
        inserts.push({ package_name: dbPkgName, section, feature: a, spec_text: text, sort_order: ++sortCounter });
      });
    }

    await client.query('BEGIN');
    await client.query(`TRUNCATE package_specifications RESTART IDENTITY`);
    let ok = 0, missing = 0;
    for (const ins of inserts) {
      const pid = pkgIdByName.get(ins.package_name);
      if (!pid) { missing++; continue; }
      await client.query(
        `INSERT INTO package_specifications (package_id, section, feature, spec_text, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (package_id, section, feature) DO UPDATE SET spec_text = EXCLUDED.spec_text, sort_order = EXCLUDED.sort_order`,
        [pid, ins.section, ins.feature, ins.spec_text, ins.sort_order]
      );
      ok++;
    }
    await client.query('COMMIT');
    console.log(`inserted ${ok} spec rows, ${missing} skipped (unknown package)`);

    // Summary
    const sum = await client.query(`
      SELECT p.package_name, COUNT(*) AS rows, COUNT(DISTINCT section) AS sections
      FROM package_specifications ps
      JOIN packages p ON p.id = ps.package_id
      GROUP BY p.sort_order, p.package_name
      ORDER BY p.sort_order`);
    console.table(sum.rows);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('ROLLBACK:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
