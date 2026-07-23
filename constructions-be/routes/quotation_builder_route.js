const express = require('express');
const router = express.Router();
const { evaluateQuotation } = require('../lib/rules_engine');

/**
 * Quotation builder — Brick&Bolt-style whole-house quotations.
 *
 * Rate model:
 *   area_category 'built_up'  → packages.total_price_per_sqft
 *   area_category 'stilt'     → packages.stilt_price_per_sqft
 *   area_category 'terrace'   → 0.65 × total_price_per_sqft (defaultRatio; TODO make configurable)
 *   area_category 'headroom'  → 0                            (excluded from cost)
 *   floor line rate_per_sqft (if provided) overrides the derived rate
 */

const CATEGORY_RATE_KEY = {
  built_up: 'total_price_per_sqft',
  stilt:    'stilt_price_per_sqft',
  terrace:  'total_price_per_sqft',  // reduced by ratio
  headroom: null,                    // free
};
const TERRACE_RATIO  = 0.65;
const HEADROOM_RATIO = 0.00;

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function loadPackage(db, packageId) {
  const r = await db.query(
    `SELECT id, package_name, total_price_per_sqft, stilt_price_per_sqft
       FROM packages WHERE id = $1`,
    [packageId]
  );
  return r.rows[0] || null;
}

function computeFloorLine(pkg, line) {
  const cat = line.area_category || 'built_up';
  let rate = num(line.rate_per_sqft, null);
  if (rate == null) {
    if (cat === 'built_up') rate = num(pkg.total_price_per_sqft);
    else if (cat === 'stilt') rate = num(pkg.stilt_price_per_sqft);
    else if (cat === 'terrace') rate = num(pkg.total_price_per_sqft) * TERRACE_RATIO;
    else if (cat === 'headroom') rate = num(pkg.total_price_per_sqft) * HEADROOM_RATIO;
    else rate = 0;
  }
  const area = num(line.area_sqft);
  const count = num(line.units_count, 1);
  const amount = +(area * count * rate).toFixed(2);
  return { ...line, area_category: cat, rate_per_sqft: +rate.toFixed(2), computed_amount: amount };
}

async function computeQuotation(db, payload) {
  const pkg = await loadPackage(db, payload.package_id);
  if (!pkg) throw new Error(`Package ${payload.package_id} not found`);

  const floorUnits = (payload.floor_units || []).map(u => computeFloorLine(pkg, u));
  const floorUnitsTotal = +floorUnits.reduce((s, u) => s + u.computed_amount, 0).toFixed(2);

  // Rules engine — evaluate the rulebook against this payload
  const engineOut = await evaluateQuotation(db, {
    package_id: payload.package_id,
    floor_units: floorUnits,
    site_answers: payload.site_answers || [],
  });

  // Add-ons — snapshot rate from DB unless overridden.
  const addonIds = (payload.addons || []).map(a => a.addon_id);
  let catalog = new Map();
  if (addonIds.length) {
    const res = await db.query(
      `SELECT id, name, unit, default_rate FROM package_addons WHERE id = ANY($1::int[])`,
      [addonIds]
    );
    res.rows.forEach(r => catalog.set(r.id, r));
  }
  const addonLines = (payload.addons || []).map(a => {
    const cat = catalog.get(a.addon_id);
    const rate = num(a.rate, cat ? num(cat.default_rate) : 0);
    const qty  = num(a.quantity, 1);
    return {
      addon_id: a.addon_id,
      name: cat ? cat.name : a.name || 'Add-on',
      unit: cat ? cat.unit : 'unit',
      rate: +rate.toFixed(2),
      quantity: qty,
      computed_amount: +(rate * qty).toFixed(2),
    };
  });
  const addonsTotal = +addonLines.reduce((s, l) => s + l.computed_amount, 0).toFixed(2);

  const ruleOverage = num(engineOut.rule_overage_total);
  const siteEscalator = num(engineOut.site_escalator_total);
  const constructionCost = +(floorUnitsTotal + addonsTotal + ruleOverage + siteEscalator).toFixed(2);

  const archPct   = num(payload.architectural_fee_percentage, 2.00);
  const otherPct  = num(payload.other_design_fee_percentage,  2.50);
  const architecturalFee = +(constructionCost * archPct / 100).toFixed(2);
  const otherDesignFee   = +(constructionCost * otherPct / 100).toFixed(2);
  const designTotal      = +(architecturalFee + otherDesignFee).toFixed(2);

  const finalCost = +(constructionCost + designTotal).toFixed(2);

  // Areas summary (for storing on the parent row)
  const area = { built_up: 0, stilt: 0, terrace: 0, headroom: 0 };
  floorUnits.forEach(u => { area[u.area_category] = +(area[u.area_category] + num(u.area_sqft) * num(u.units_count, 1)).toFixed(2); });
  const packageBuiltUpArea = area.built_up;
  const totalBuiltUpArea = +(area.built_up + area.stilt + area.terrace + area.headroom).toFixed(2);

  return {
    package: {
      id: pkg.id, name: pkg.package_name,
      rate_per_sqft: num(pkg.total_price_per_sqft),
      stilt_rate_per_sqft: num(pkg.stilt_price_per_sqft),
    },
    floor_units: floorUnits,
    addon_lines: addonLines,
    areas: {
      built_up: area.built_up,
      stilt: area.stilt,
      terrace: area.terrace,
      headroom: area.headroom,
      package_built_up: packageBuiltUpArea,
      total_built_up: totalBuiltUpArea,
    },
    breakup: {
      floor_units_total: floorUnitsTotal,
      addons_total: addonsTotal,
      rule_overage_total: ruleOverage,
      site_escalator_total: siteEscalator,
      construction_cost: constructionCost,
      architectural_fee_percentage: archPct,
      architectural_fee_amount: architecturalFee,
      other_design_fee_percentage: otherPct,
      other_design_fee_amount: otherDesignFee,
      design_total: designTotal,
      final_cost: finalCost,
    },
    rule_evaluations: engineOut.evaluations,
    site_deviations: engineOut.site_deviations,
  };
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Site conditions catalog + rules
// -----------------------------------------------------------------------------
router.get('/site-conditions', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT id, code, question, standard_answer, deviation_answer, triggers_rule_id, default_impact, sort_order
         FROM site_conditions_catalog ORDER BY sort_order`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/site-conditions', async (req, res) => {
  const { code, question, standard_answer, deviation_answer, triggers_rule_id, default_impact, sort_order } = req.body || {};
  if (!code || !question || !standard_answer) return res.status(400).json({ error: 'code, question, standard_answer required' });
  try {
    const r = await req.db.query(
      `INSERT INTO site_conditions_catalog (code, question, standard_answer, deviation_answer, triggers_rule_id, default_impact, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, 999)) RETURNING *`,
      [code, question, standard_answer, deviation_answer || null, triggers_rule_id || null, default_impact || null, sort_order]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/site-conditions/:id', async (req, res) => {
  const { id } = req.params;
  const { question, standard_answer, deviation_answer, triggers_rule_id, default_impact, sort_order } = req.body || {};
  try {
    const r = await req.db.query(
      `UPDATE site_conditions_catalog
         SET question = COALESCE($1, question), standard_answer = COALESCE($2, standard_answer),
             deviation_answer = $3, triggers_rule_id = $4, default_impact = $5,
             sort_order = COALESCE($6, sort_order)
       WHERE id = $7 RETURNING *`,
      [question, standard_answer, deviation_answer, triggers_rule_id, default_impact, sort_order, id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/site-conditions/:id', async (req, res) => {
  try {
    const r = await req.db.query(`DELETE FROM site_conditions_catalog WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add-ons CRUD (list already exists at /addons)
router.post('/addons', async (req, res) => {
  const { package_id, name, description, unit, default_rate, inclusions, exclusions, sort_order } = req.body || {};
  if (!name || default_rate == null) return res.status(400).json({ error: 'name and default_rate required' });
  try {
    const r = await req.db.query(
      `INSERT INTO package_addons (package_id, name, description, unit, default_rate, inclusions, exclusions, sort_order, is_active)
       VALUES ($1,$2,$3,COALESCE($4,'unit'),$5,$6,$7, COALESCE($8, 999), TRUE) RETURNING *`,
      [package_id || null, name, description || null, unit, default_rate, inclusions || null, exclusions || null, sort_order]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/addons/:id', async (req, res) => {
  const { name, description, unit, default_rate, inclusions, exclusions, sort_order, is_active, package_id } = req.body || {};
  try {
    const r = await req.db.query(
      `UPDATE package_addons
         SET name = COALESCE($1, name), description = $2, unit = COALESCE($3, unit),
             default_rate = COALESCE($4, default_rate), inclusions = $5, exclusions = $6,
             sort_order = COALESCE($7, sort_order), is_active = COALESCE($8, is_active),
             package_id = $9, updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [name, description, unit, default_rate, inclusions, exclusions, sort_order, is_active, package_id || null, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/addons/:id', async (req, res) => {
  try {
    const r = await req.db.query(`DELETE FROM package_addons WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Qty per SFT CRUD
router.get('/qty-ratios', async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT iq.id, iq.item_id, iq.package_id, iq.qty_per_sqft, iq.wastage_pct, iq.notes,
              i.item_name, i.item_category, i.item_unit
         FROM item_qty_per_sqft iq
         JOIN items i ON i.item_id = iq.item_id
         ORDER BY i.item_category, i.item_name, iq.package_id NULLS FIRST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/qty-ratios', async (req, res) => {
  const { item_id, package_id, qty_per_sqft, wastage_pct, notes } = req.body || {};
  if (!item_id || qty_per_sqft == null) return res.status(400).json({ error: 'item_id and qty_per_sqft required' });
  try {
    const r = await req.db.query(
      `INSERT INTO item_qty_per_sqft (item_id, package_id, qty_per_sqft, wastage_pct, notes)
       VALUES ($1,$2,$3, COALESCE($4, 0), $5)
       ON CONFLICT (item_id, package_id) DO UPDATE
         SET qty_per_sqft = EXCLUDED.qty_per_sqft, wastage_pct = EXCLUDED.wastage_pct, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *`,
      [item_id, package_id || null, qty_per_sqft, wastage_pct, notes || null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/qty-ratios/:id', async (req, res) => {
  const { qty_per_sqft, wastage_pct, notes } = req.body || {};
  try {
    const r = await req.db.query(
      `UPDATE item_qty_per_sqft
         SET qty_per_sqft = COALESCE($1, qty_per_sqft), wastage_pct = COALESCE($2, wastage_pct),
             notes = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [qty_per_sqft, wastage_pct, notes, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/qty-ratios/:id', async (req, res) => {
  try {
    const r = await req.db.query(`DELETE FROM item_qty_per_sqft WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rules', async (req, res) => {
  try {
    const { package_id } = req.query;
    const r = await req.db.query(
      `SELECT r.*, t.included, t.value_cap, t.rate_cap, t.brand_options, t.overage_rate, t.notes AS tier_notes
         FROM package_rules r
         LEFT JOIN package_rule_tiers t ON t.rule_id = r.rule_id AND t.package_id = $1
         ORDER BY r.sort_order`,
      [package_id || null]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Full rulebook + all tiers pivoted for the editor grid.
router.get('/rules/grid', async (req, res) => {
  try {
    const rules = (await req.db.query(
      `SELECT rule_id, module, rule_type, title, basis, uom, overage_mode,
              spec_text, pdf_annexure, pdf_item_number, sort_order
         FROM package_rules ORDER BY sort_order`
    )).rows;
    const tiers = (await req.db.query(
      `SELECT rule_id, package_id, included, value_cap, rate_cap, brand_options, overage_rate, notes
         FROM package_rule_tiers`
    )).rows;
    const packages = (await req.db.query(
      `SELECT id, package_name, sort_order FROM packages ORDER BY sort_order`
    )).rows;

    // pivot tiers into {rule_id: {package_id: tier}}
    const tierMap = new Map();
    for (const t of tiers) {
      if (!tierMap.has(t.rule_id)) tierMap.set(t.rule_id, {});
      tierMap.get(t.rule_id)[t.package_id] = t;
    }
    const merged = rules.map(r => ({ ...r, tiers: tierMap.get(r.rule_id) || {} }));
    res.json({ packages, rules: merged });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update or create a tier row for a specific rule+package.
router.put('/rules/:rule_id/tiers/:package_id', async (req, res) => {
  const { rule_id, package_id } = req.params;
  const { included, value_cap, rate_cap, brand_options, overage_rate, notes } = req.body || {};
  try {
    // Ensure the rule and package both exist
    const chk = await req.db.query(
      `SELECT 1 FROM package_rules WHERE rule_id = $1 UNION ALL SELECT 1 FROM packages WHERE id = $2`,
      [rule_id, package_id]
    );
    if (chk.rows.length < 2) return res.status(404).json({ error: 'rule_id or package_id not found' });

    const brandArr = Array.isArray(brand_options) ? brand_options
      : (typeof brand_options === 'string' && brand_options.trim())
        ? brand_options.split(',').map(s => s.trim()).filter(Boolean)
        : null;

    const r = await req.db.query(
      `INSERT INTO package_rule_tiers (rule_id, package_id, included, value_cap, rate_cap, brand_options, overage_rate, notes)
       VALUES ($1, $2, COALESCE($3, TRUE), $4, $5, $6, $7, $8)
       ON CONFLICT (rule_id, package_id) DO UPDATE
         SET included = COALESCE(EXCLUDED.included, package_rule_tiers.included),
             value_cap = EXCLUDED.value_cap,
             rate_cap = EXCLUDED.rate_cap,
             brand_options = EXCLUDED.brand_options,
             overage_rate = EXCLUDED.overage_rate,
             notes = EXCLUDED.notes
       RETURNING *`,
      [rule_id, package_id,
       included === undefined ? null : included,
       value_cap === '' || value_cap == null ? null : Number(value_cap),
       rate_cap  === '' || rate_cap  == null ? null : Number(rate_cap),
       brandArr,
       overage_rate === '' || overage_rate == null ? null : Number(overage_rate),
       notes || null]
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[rules tier update]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// List saved quotations. Supports ?client_id=, ?status=, ?limit=, ?offset=.
router.get('/', async (req, res) => {
  const db = req.db;
  const { client_id, status, limit = 50, offset = 0 } = req.query;
  try {
    const params = [];
    const clauses = [];
    if (client_id) { params.push(client_id); clauses.push(`cq.client_id = $${params.length}`); }
    if (status)    { params.push(status);    clauses.push(`cq.status = $${params.length}`); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    params.push(Number(limit) || 50, Number(offset) || 0);
    const r = await db.query(
      `SELECT cq.client_quotation_id, cq.client_quotation_number, cq.client_id,
              cq.quotation_date, cq.valid_until, cq.status, cq.project_title,
              cq.package_type, cq.package_rate_per_sqft,
              cq.built_up_area, cq.habitable_area, cq.stilt_area,
              cq.floor_units_total_amount, cq.addons_total_amount,
              cq.total_design_amount,
              (COALESCE(cq.floor_units_total_amount,0) + COALESCE(cq.addons_total_amount,0) + COALESCE(cq.total_design_amount,0))
                AS final_cost,
              c.client_name, c.email AS client_email,
              cq.created_at, cq.updated_at
         FROM client_quotations cq
         LEFT JOIN clients c ON c.client_id = cq.client_id
         ${where}
         ORDER BY cq.created_at DESC NULLS LAST, cq.client_quotation_id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[quotation_builder] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// List add-ons available for building a quotation.
router.get('/addons', async (req, res) => {
  const db = req.db;
  const { package_id } = req.query;
  try {
    const params = [];
    let where = 'is_active = TRUE';
    if (package_id) { params.push(package_id); where += ` AND (package_id IS NULL OR package_id = $${params.length})`; }
    const r = await db.query(
      `SELECT id, package_id, name, description, unit, default_rate, inclusions, exclusions, sort_order
         FROM package_addons WHERE ${where}
         ORDER BY sort_order, name`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[quotation_builder] addons error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Live-calc preview — computes totals from the posted payload without persisting.
// Body shape:
//   {
//     package_id: int,
//     floor_units: [{ floor_number, floor_label, unit_type, units_count, area_sqft, area_category, rate_per_sqft?, notes? }],
//     addons: [{ addon_id, quantity, rate? }],
//     architectural_fee_percentage?: number,   default 2.00
//     other_design_fee_percentage?:  number,   default 2.50
//   }
router.post('/preview', async (req, res) => {
  const db = req.db;
  try {
    const out = await computeQuotation(db, req.body || {});
    res.json(out);
  } catch (err) {
    console.error('[quotation_builder] preview error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Create + persist a quotation.
// Body: same as /preview + client_id, project_title?, quotation_date?, valid_until?
router.post('/', async (req, res) => {
  const db = req.db;
  const body = req.body || {};
  if (!body.package_id) return res.status(400).json({ error: 'package_id required' });
  if (!body.client_id)  return res.status(400).json({ error: 'client_id required' });

  try {
    const calc = await computeQuotation(db, body);

    // Generate a quotation number: CRN-YYYYMMDD-<seq>
    const seq = await db.query(`SELECT COUNT(*)::int + 1 AS n FROM client_quotations`);
    const yyyymmdd = (body.quotation_date ? new Date(body.quotation_date) : new Date())
      .toISOString().slice(0, 10).replace(/-/g, '');
    const quotationNumber = `CRN-${yyyymmdd}-${String(seq.rows[0].n).padStart(4, '0')}`;

    await db.query('BEGIN');
    // Skip generated columns: base_package_amount, subtotal, gst_amount, contract_value.
    // We store our own totals in floor_units_total_amount / addons_total_amount / total_design_amount.
    const ins = await db.query(
      `INSERT INTO client_quotations
        (client_id, client_quotation_number, quotation_date, valid_until,
         project_title, package_type, package_rate_per_sqft,
         habitable_area, stilt_area, terrace_area, built_up_area,
         special_features_amount,
         architectural_fee_percentage, other_design_fee_percentage,
         architectural_fee_amount, other_design_fee_amount, total_design_amount,
         addons_total_amount, floor_units_total_amount,
         status, quotation_type, version_number, is_current_version)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), COALESCE($4::date, CURRENT_DATE + INTERVAL '30 days'),
               $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
               'Draft', 'Standard', 1, TRUE)
       RETURNING client_quotation_id`,
      [
        body.client_id, quotationNumber,
        body.quotation_date || null, body.valid_until || null,
        body.project_title || null, calc.package.name, calc.package.rate_per_sqft,
        calc.areas.built_up, calc.areas.stilt, calc.areas.terrace, calc.areas.total_built_up,
        calc.breakup.addons_total,
        calc.breakup.architectural_fee_percentage, calc.breakup.other_design_fee_percentage,
        calc.breakup.architectural_fee_amount, calc.breakup.other_design_fee_amount, calc.breakup.design_total,
        calc.breakup.addons_total, calc.breakup.floor_units_total,
      ]
    );
    const qid = ins.rows[0].client_quotation_id;

    for (const u of calc.floor_units) {
      await db.query(
        `INSERT INTO quotation_floor_units
           (client_quotation_id, floor_number, floor_label, unit_type,
            units_count, area_sqft, area_category, rate_per_sqft, computed_amount, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [qid, u.floor_number, u.floor_label || null, u.unit_type,
         u.units_count || 1, u.area_sqft, u.area_category, u.rate_per_sqft, u.computed_amount, u.notes || null]
      );
    }
    for (const a of calc.addon_lines) {
      await db.query(
        `INSERT INTO quotation_addons (client_quotation_id, addon_id, quantity, rate, computed_amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [qid, a.addon_id, a.quantity, a.rate, a.computed_amount]
      );
    }
    // Persist rule evaluations (only rows where entitled_qty is computed OR overage is > 0)
    for (const ev of calc.rule_evaluations || []) {
      if (ev.entitled_qty == null && !ev.overage_amount) continue;
      await db.query(
        `INSERT INTO quotation_rule_evaluations
           (client_quotation_id, rule_id, entitled_qty, actual_qty, overage_qty,
            cap_value, per_unit_amount, overage_amount, applied, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [qid, ev.rule_id, ev.entitled_qty, ev.actual_qty, ev.overage_qty,
         ev.cap_value, ev.per_unit_amount, ev.overage_amount, ev.applied, ev.spec_text || null]
      );
    }
    // Persist site condition answers
    for (const s of calc.site_deviations || []) {
      await db.query(
        `INSERT INTO quotation_site_conditions
           (client_quotation_id, condition_id, actual_answer, is_deviation, triggered_amount)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (client_quotation_id, condition_id) DO UPDATE
           SET actual_answer = EXCLUDED.actual_answer,
               is_deviation  = EXCLUDED.is_deviation,
               triggered_amount = EXCLUDED.triggered_amount`,
        [qid, s.condition_id, s.actual_answer, s.is_deviation, s.triggered_amount]
      );
    }
    // Aggregate escalators on parent
    await db.query(
      `UPDATE client_quotations
         SET rule_overage_amount = $1, site_escalator_amount = $2
         WHERE client_quotation_id = $3`,
      [calc.breakup.rule_overage_total, calc.breakup.site_escalator_total, qid]
    );

    await db.query('COMMIT');

    res.status(201).json({
      client_quotation_id: qid,
      quotation_number: quotationNumber,
      ...calc,
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('[quotation_builder] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Material Annexure — render-ready section list for a quotation
// Returns modules → items with description + remarks lines derived from tier data.
router.get('/:id/annexure', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const q = await db.query(
      `SELECT cq.client_quotation_id, cq.client_quotation_number, cq.project_title,
              cq.package_type, cq.package_rate_per_sqft,
              cq.built_up_area, cq.habitable_area,
              c.client_name, p.id AS package_id
         FROM client_quotations cq
         LEFT JOIN clients c ON c.client_id = cq.client_id
         LEFT JOIN packages p ON p.package_name = cq.package_type
         WHERE cq.client_quotation_id = $1`,
      [id]
    );
    if (!q.rows.length) return res.status(404).json({ error: 'Quotation not found' });
    const head = q.rows[0];

    if (!head.package_id) return res.status(400).json({ error: 'Package not resolved for quotation' });

    const rules = await db.query(
      `SELECT r.rule_id, r.module, r.rule_type, r.title, r.spec_text, r.uom, r.basis, r.overage_mode,
              r.measurement_convention, r.sort_order,
              r.pdf_item_number, r.pdf_annexure, r.pdf_sub_label,
              t.included, t.value_cap, t.rate_cap, t.brand_options, t.overage_rate, t.notes AS tier_notes
         FROM package_rules r
         LEFT JOIN package_rule_tiers t ON t.rule_id = r.rule_id AND t.package_id = $1
         WHERE (t.included IS NULL OR t.included = TRUE)
         ORDER BY r.pdf_annexure NULLS LAST, r.pdf_item_number NULLS LAST, r.sort_order`,
      [head.package_id]
    );

    // Human-readable section titles for each module, in display order
    const SECTION_ORDER = [
      ['earthwork',    '1. Site & Earthwork'],
      ['structure',    '2. Foundation & Structure'],
      ['masonry',      '3. Masonry & Plastering'],
      ['waterproofing','4. Waterproofing'],
      ['doors',        '5. Doors'],
      ['windows',      '6. Windows & Ventilators'],
      ['flooring',     '7. Flooring'],
      ['kitchen',      '8. Kitchen'],
      ['bathroom',     '9. Bathroom & Sanitary'],
      ['plumbing',     '10. Plumbing'],
      ['electrical',   '11. Electrical'],
      ['painting',     '12. Painting'],
      ['tanks',        '13. Tanks & Water'],
      ['railings',     '14. Railings & Steel'],
      ['misc',         '15. Miscellaneous'],
      ['lift',         '16. Lift Provisions'],
      ['commercial',   '17. Commercial Terms'],
    ];

    const byModule = new Map();
    rules.rows.forEach(r => {
      if (!byModule.has(r.module)) byModule.set(r.module, []);
      byModule.get(r.module).push(r);
    });

    // Compose the remarks line for each rule (brand + cap + overage clause)
    function composeRemarks(r) {
      const parts = [];
      if (r.brand_options && r.brand_options.length) {
        parts.push('Brand: ' + r.brand_options.join(' / '));
      }
      if (r.value_cap != null) {
        parts.push(`RS ${Number(r.value_cap).toLocaleString('en-IN')}/-`);
      }
      if (r.rate_cap != null) {
        parts.push(`RS ${Number(r.rate_cap).toLocaleString('en-IN')}${r.uom ? '/' + r.uom : ''}`);
      }
      if (r.overage_rate != null) {
        parts.push(`Overage: RS ${Number(r.overage_rate).toLocaleString('en-IN')}${r.uom ? '/' + r.uom : ''}`);
      }
      if (r.rule_type === 'risk_allocation' || r.overage_mode === 'per_item_rate' || r.overage_mode === 'actuals') {
        parts.push('Anything above shall be compensated.');
      } else if (r.overage_mode === 'owner_scope') {
        parts.push('Excluded — Owner scope.');
      } else if (r.overage_mode === 'market_price') {
        parts.push('Excluded — Market price.');
      }
      if (r.measurement_convention) {
        parts.push(`(${r.measurement_convention})`);
      }
      return parts;
    }

    // Group rules by pdf_item_number → each PDF row can bundle several rules as sub-blocks.
    // PDF item titles (canonical WH/JS numbering) — used as the row heading when defined.
    const MAIN_TITLES = {
      1:'EXCAVATION',                     2:'ROCK CUTTING',                     3:'BACK FILLING',
      4:'TERMITE PROTECTION (ATT)',       5:'SURFACE GROUND WATER',             6:'FOUNDATION / STRUCTURE',
      7:'FLOOR HEIGHT',                   8:'STEEL BARS FOR RCC STRUCTURE',     9:'PLAIN CEMENT CONCRETE (PCC)',
     10:'CONCRETE FOR RCC STRUCTURE',    11:'CEMENT FOR RCC STRUCTURE',        12:'SAND FOR RCC STRUCTURE',
     13:'AGGREGATE FOR RCC STRUCTURE',   14:'CRS / TOTAL FLOORING WORK',       15:'BRICK WORK (RED / CEMENT / LIGHT-WEIGHT)',
     16:'CEMENT BRICK / MORTAR',         17:'SAND FOR BRICK WORK',             18:'PLASTERING — EXTERNAL WALLS',
     19:'PLASTERING — INTERNAL WALLS',   20:'WATERPROOFING (Toilets / Utility / Balcony / Sump / Lift / Terrace)',
     21:'HONEYCOMB',                     22:'PAINTING — EXTERNAL WALLS / COMPOUND WALL',
     23:'PAINTING — INTERNAL WALLS',     24:'PAINTING — ENTRANCE MAIN DOORS',
     25:'PAINTING — INTERNAL DOORS',     26:'PAINTING — INTERNAL TOILET DOORS',
     27:'PAINTING — MS WORK',            28:'DOORS / WINDOWS / VENTILATORS',
     29:'MILD / STAINLESS STEEL WORK',   30:'FLOORING',
     31:'ELEVATION ELEMENTS',            32:'CURING',
     33:'SCAFFOLDING',                   34:'DEEP CLEANING',
    };
    const ELP_TITLES = {
      1:'ELECTRICAL — POWER WIRING',
      2:'ELECTRICAL FIXTURES',
      3:'DISTRIBUTION BOARDS / MCBs',
      4:'PLUMBING (Water Supply / Drainage / Manholes / Sump / OHT)',
      5:'SANITARYWARE (per-bathroom fixture set + kitchen / utility taps)',
    };

    // Aggregate multiple rules into one PDF row.
    function bucketRow(target, rule) {
      const remarks = composeRemarks(rule);
      target.rules.push({
        rule_id: rule.rule_id,
        sub_label: rule.pdf_sub_label || null,
        description: rule.spec_text || '',
        remarks,
      });
      // Roll up brand/cap/remark lines to row level too (deduplicated by string)
      for (const r of remarks) {
        if (!target.remarks_seen.has(r)) { target.remarks_seen.add(r); target.remarks.push(r); }
      }
    }

    const mainBuckets = new Map(); // pdf_item_number → {seq, title, rules[], remarks[]}
    const elpBuckets  = new Map();
    for (const r of rules.rows) {
      if (r.pdf_item_number == null) continue;
      const bucket = (r.pdf_annexure === 'elp') ? elpBuckets : mainBuckets;
      if (!bucket.has(r.pdf_item_number)) {
        const titleMap = (r.pdf_annexure === 'elp') ? ELP_TITLES : MAIN_TITLES;
        bucket.set(r.pdf_item_number, {
          seq: r.pdf_item_number,
          title: titleMap[r.pdf_item_number] || r.title.toUpperCase(),
          rules: [],
          remarks: [],
          remarks_seen: new Set(),
        });
      }
      bucketRow(bucket.get(r.pdf_item_number), r);
    }
    const mainSections = [...mainBuckets.values()].sort((a, b) => a.seq - b.seq)
      .map(({ remarks_seen, ...b }) => b);
    const elpSections  = [...elpBuckets.values()].sort((a, b) => a.seq - b.seq)
      .map(({ remarks_seen, ...b }) => b);
    let seq = mainSections.length;
    let elpSeq = elpSections.length;

    // Room-by-room electrical fixture matrix (from WH/B&B PDFs, tier-agnostic; brand switches per tier)
    const brandRow = rules.rows.find(r => r.rule_id === 'R-ELE-003');
    const switchBrandForTier = brandRow?.brand_options?.length
      ? brandRow.brand_options.join(' / ')
      : head.package_type === 'Economy' ? 'Anchor Penta'
      : head.package_type === 'Premium' ? 'Legrand Myrius / Arteor'
      : head.package_type === 'Pro' ? 'Legrand Myrius / Schneider Livia'
      : 'Anchor Roma / Legrand Allzy';

    const electricalMatrix = [
      { room: 'Entry',            points: [
        '1 Bell push point',
        '1 Ceiling light point',
        '2-way wall light for staircase (every landing)',
        '1 Lift entrance ceiling light (if lift)',
      ]},
      { room: 'Living / Hall',    points: [
        '1 Fan point with dimmer',
        '3 Wall light points',
        '3 Sockets & switches',
        '1 LAN point', '1 AC socket', '1 TV socket',
        '3 TV accessory sockets',
      ]},
      { room: 'Dining',           points: [
        '1 Fan point with dimmer',
        '3 Wall light points',
        '1 Socket & switch',
        '1 AC socket',
      ]},
      { room: 'Kitchen',          points: [
        '1 Fan point with dimmer',
        '2 Wall light points',
        '1 Socket & switch',
        '1 HOB point', '1 RO purifier point',
        '1 Fridge socket', '1 Micro-oven socket',
        '2 Other electrical application sockets',
        '1 Exhaust fan with switch (including core cutting)',
      ]},
      { room: 'Utility (each)',   points: [
        '1 Washing machine socket & switch',
        '1 Wall light point',
      ]},
      { room: 'Bedroom (each)',   points: [
        '1 Pair 2-way fan switch with dimmer',
        '1 Pair 2-way light point',
        '2 Sockets & switches',
        '2 Wall light points',
        '1 AC socket',
        '2 Study AC sockets',
        '1 Exhaust fan with switch',
      ]},
      { room: 'Toilet (each)',    points: [
        '2 Wall light points',
        '1 Exhaust fan point',
        '1 Geyser point',
        '2 Sockets & switches',
      ]},
      { room: 'Balcony / Stilt / Elevation', points: [
        '1 Wall light point + 1 Ceiling light point',
        '2 Sockets & switches',
        '2 Elevation light points',
        '2 Compound wall light points',
        '4 Stilt floor ceiling lights',
        'Note: No false-ceiling wiring & lights',
      ]},
    ];

    // Sanitary room-keyed budgets (from R-BTH-002 tier value_cap + fallback for "other" baths)
    const masterCap = (rules.rows.find(r => r.rule_id === 'R-BTH-002')?.value_cap) || null;
    const otherCap = masterCap ? Math.max(15000, Math.round(Number(masterCap) * 0.6)) : null;

    res.json({
      quotation_number: head.client_quotation_number,
      project_title: head.project_title,
      client_name: head.client_name,
      package_type: head.package_type,
      package_rate: head.package_rate_per_sqft,
      built_up_area: head.built_up_area,
      habitable_area: head.habitable_area,
      main_sections: mainSections,
      elp_sections: elpSections,
      total_items: seq - 1,
      total_elp_items: elpSeq - 1,
      electrical_matrix: electricalMatrix,
      electrical_switch_brand: switchBrandForTier,
      sanitary_budgets: {
        master: masterCap,
        other:  otherCap,
      },
      notes: [
        'Demolition charges (if any) will be charged extra as per market price.',
        'Low roofs & lofts will be charged extra as per market price.',
        'Groove cutting, double moulding, and double charging of granite are charged extra as per market.',
        'Any item not included in the specification is charged extra.',
      ],
    });
  } catch (err) {
    console.error('[annexure] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Status transition for a quotation.
// Legal transitions:
//   Draft   → Sent | Cancelled
//   Sent    → Approved | Rejected | Expired
//   Approved → Contract Signed
//   Rejected / Cancelled / Expired → (terminal)
// DB CHECK constraint uses underscored spellings — align with it.
const ALLOWED_STATUS_TRANSITIONS = {
  'Draft':           ['Under_Review', 'Sent', 'Cancelled'],
  'Under_Review':    ['Client_Review', 'Cancelled'],
  'Client_Review':   ['Sent', 'Cancelled'],
  'Sent':            ['Approved', 'Cancelled'],
  'Approved':        ['Contract_Signed', 'Cancelled'],
  'Contract_Signed': ['Active'],
  'Active':          ['Completed'],
  'Completed':       [],
  'Cancelled':       [],
};

router.patch('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status: nextStatus } = req.body || {};
  if (!nextStatus) return res.status(400).json({ error: 'status required' });

  try {
    const current = await db.query(
      `SELECT client_quotation_id, status, contract_signed FROM client_quotations WHERE client_quotation_id = $1`,
      [id]
    );
    if (!current.rows.length) return res.status(404).json({ error: 'Quotation not found' });
    const currentStatus = current.rows[0].status || 'Draft';

    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        error: `Illegal transition ${currentStatus} → ${nextStatus}`,
        allowed_next: allowed,
      });
    }

    // Some transitions have side-effects (dates, flags)
    const now = new Date().toISOString().slice(0, 10);
    const patch = { status: nextStatus };
    if (nextStatus === 'Sent')            patch.sent_to_client_date = now;
    if (nextStatus === 'Client_Review')   patch.client_review_date = now;
    if (nextStatus === 'Approved')        patch.client_approval_date = now;
    if (nextStatus === 'Contract_Signed') { patch.contract_signed = true; patch.contract_signed_date = now; }

    const setClauses = Object.keys(patch).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(patch);
    values.push(id);

    const r = await db.query(
      `UPDATE client_quotations SET ${setClauses}, updated_at = NOW()
         WHERE client_quotation_id = $${values.length}
         RETURNING client_quotation_id, client_quotation_number, status,
                   sent_to_client_date, client_review_date, client_approval_date,
                   contract_signed, contract_signed_date`,
      values
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[quotation status]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Promote an approved / signed quotation into a project row.
// Preserves the link via project_id ↔ client_quotation_id in metadata.
router.post('/:id/promote-to-project', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const qres = await db.query(
      `SELECT cq.*, c.client_name FROM client_quotations cq
         LEFT JOIN clients c ON c.client_id = cq.client_id
         WHERE cq.client_quotation_id = $1`,
      [id]
    );
    if (!qres.rows.length) return res.status(404).json({ error: 'Quotation not found' });
    const q = qres.rows[0];
    if (!['Approved', 'Contract_Signed', 'Active'].includes(q.status)) {
      return res.status(400).json({ error: `Quotation must be Approved / Contract_Signed / Active. Current: ${q.status}` });
    }

    // Guard: if a project already exists for this quotation, don't create a second one.
    const existing = await db.query(
      `SELECT project_id FROM projects WHERE metadata->>'from_quotation_id' = $1`,
      [String(id)]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Project already exists for this quotation', project_id: existing.rows[0].project_id });
    }

    const floorUnits = (await db.query(
      `SELECT floor_number, floor_label, unit_type, units_count, area_sqft, area_category
         FROM quotation_floor_units WHERE client_quotation_id = $1 ORDER BY floor_number, id`,
      [id]
    )).rows;

    const totalArea = floorUnits.reduce((s, f) => s + Number(f.area_sqft) * (Number(f.units_count) || 1), 0);
    const maxFloor = floorUnits.reduce((m, f) => Math.max(m, Number(f.floor_number) || 0), 0);
    const projectName = q.project_title || (q.client_name ? `${q.client_name} — ${q.client_quotation_number}` : q.client_quotation_number);
    const finalCost = (Number(q.floor_units_total_amount) || 0)
                    + (Number(q.addons_total_amount) || 0)
                    + (Number(q.total_design_amount) || 0);

    await db.query('BEGIN');
    const projIns = await db.query(
      `INSERT INTO projects (
         project_name, client_id, description, project_type,
         start_date, status, estimated_budget, currency,
         contract_number, contract_date, total_area, area_unit, number_of_floors,
         metadata
       ) VALUES ($1, $2, $3, 'Residential', CURRENT_DATE, 'Planning', $4, 'INR',
                 $5, COALESCE($6::date, CURRENT_DATE), $7, 'sqft', $8, $9)
       RETURNING project_id`,
      [
        projectName,
        q.client_id,
        `Auto-created from quotation ${q.client_quotation_number} (${q.package_type} package)`,
        finalCost,
        q.client_quotation_number,
        q.contract_signed_date,
        totalArea,
        Math.max(1, maxFloor + 1),   // count of floors present (0-indexed + 1)
        JSON.stringify({
          from_quotation_id: Number(id),
          quotation_number: q.client_quotation_number,
          package_type: q.package_type,
          package_rate_per_sqft: q.package_rate_per_sqft,
        }),
      ]
    );
    const project_id = projIns.rows[0].project_id;

    // Seed project_floors from quotation floor units (dedup by floor_number)
    const seenFloors = new Set();
    for (const f of floorUnits) {
      if (seenFloors.has(f.floor_number)) continue;
      seenFloors.add(f.floor_number);
      const label = f.floor_label || `Floor ${f.floor_number}`;
      const areaOnFloor = floorUnits
        .filter(x => x.floor_number === f.floor_number)
        .reduce((s, x) => s + Number(x.area_sqft) * (Number(x.units_count) || 1), 0);
      await db.query(
        `INSERT INTO project_floors (project_id, floor_number, floor_name, floor_type, floor_area)
         VALUES ($1, $2, $3, $4, $5)`,
        [project_id, f.floor_number, label, f.area_category || 'built_up', areaOnFloor]
      );
    }
    await db.query('COMMIT');

    res.status(201).json({
      project_id,
      project_name: projectName,
      total_area: totalArea,
      floors_created: seenFloors.size,
      from_quotation_id: Number(id),
      from_quotation_number: q.client_quotation_number,
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('[promote-to-project]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Fetch a saved quotation with its child rows and recomputed totals.
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const head = await db.query(
      `SELECT cq.*, c.client_name FROM client_quotations cq
         LEFT JOIN clients c ON c.client_id = cq.client_id
         WHERE cq.client_quotation_id = $1`,
      [id]
    );
    if (!head.rows.length) return res.status(404).json({ error: 'Quotation not found' });
    const floors  = (await db.query(
      `SELECT * FROM quotation_floor_units WHERE client_quotation_id = $1 ORDER BY floor_number, id`,
      [id]
    )).rows;
    const addons  = (await db.query(
      `SELECT qa.*, pa.name, pa.unit FROM quotation_addons qa
         LEFT JOIN package_addons pa ON pa.id = qa.addon_id
         WHERE qa.client_quotation_id = $1 ORDER BY qa.id`,
      [id]
    )).rows;
    const siteConditions = (await db.query(
      `SELECT sc.*, c.code, c.question, c.standard_answer, c.default_impact, c.triggers_rule_id, c.sort_order
         FROM quotation_site_conditions sc
         JOIN site_conditions_catalog c ON c.id = sc.condition_id
         WHERE sc.client_quotation_id = $1 ORDER BY c.sort_order`,
      [id]
    )).rows;
    const ruleEvals = (await db.query(
      `SELECT qre.*, r.title, r.module, r.rule_type, r.uom, r.spec_text
         FROM quotation_rule_evaluations qre
         JOIN package_rules r ON r.rule_id = qre.rule_id
         WHERE qre.client_quotation_id = $1 ORDER BY r.sort_order`,
      [id]
    )).rows;
    res.json({ ...head.rows[0], floor_units: floors, addon_lines: addons,
               site_conditions: siteConditions, rule_evaluations: ruleEvals });
  } catch (err) {
    console.error('[quotation_builder] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
