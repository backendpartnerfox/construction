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
              t.included, t.value_cap, t.rate_cap, t.brand_options, t.overage_rate, t.notes AS tier_notes
         FROM package_rules r
         LEFT JOIN package_rule_tiers t ON t.rule_id = r.rule_id AND t.package_id = $1
         WHERE (t.included IS NULL OR t.included = TRUE)
         ORDER BY r.sort_order`,
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

    // Modules that go into the main annexure vs the electrical/plumbing sub-annexure
    const ELP_MODULES = new Set(['electrical', 'plumbing', 'bathroom']);

    let seq = 1;
    const mainSections = [];
    for (const [modKey, title] of SECTION_ORDER) {
      if (ELP_MODULES.has(modKey)) continue;
      const rows = byModule.get(modKey);
      if (!rows || !rows.length) continue;
      const items = rows.map(r => ({
        seq: seq++,
        rule_id: r.rule_id, rule_type: r.rule_type, title: r.title,
        description: r.spec_text || '', remarks: composeRemarks(r),
      }));
      mainSections.push({ module: modKey, section_title: title, items });
    }

    // Electrical & Plumbing sub-annexure (separate numbering)
    let elpSeq = 1;
    const elpSections = [];
    for (const [modKey, title] of SECTION_ORDER) {
      if (!ELP_MODULES.has(modKey)) continue;
      const rows = byModule.get(modKey);
      if (!rows || !rows.length) continue;
      const items = rows.map(r => ({
        seq: elpSeq++,
        rule_id: r.rule_id, rule_type: r.rule_type, title: r.title,
        description: r.spec_text || '', remarks: composeRemarks(r),
      }));
      elpSections.push({ module: modKey, section_title: title, items });
    }

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
