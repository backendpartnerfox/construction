/*
 * Rules engine — applies the Unified Package Rulebook to a quotation.
 *
 * Inputs:
 *   db            — pg client
 *   package_id    — the quotation's package
 *   floor_units   — array of {area_sqft, units_count, area_category, unit_type, ...}
 *   site_answers  — [{condition_id, actual_answer}] (optional)
 *   dwelling_units_count — inferred from floor_units unless provided
 *
 * Output:
 *   {
 *     evaluations: [{rule_id, title, entitled_qty, actual_qty, overage_qty, cap_value,
 *                    per_unit_amount, overage_amount, notes, applied}],
 *     site_deviations: [{code, question, actual_answer, is_deviation, triggered_amount, triggers_rule_id}],
 *     rule_overage_total: 0,
 *     site_escalator_total: 0,
 *   }
 *
 * Notes:
 * - Only the RULE TYPES we can compute today get processed:
 *     entitlement_formula: computes entitled qty from basis+step+qty_per_step
 *     value_cap / rate_cap: informational (attached to entitlement evaluation if paired)
 * - process_qc / brand_spec / dimension_spec / exclusion rows are still returned (with applied=false)
 *   so the detail view can render them as "informational".
 */

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function computeAreas(floorUnits) {
  let pbua = 0;         // package built-up (habitable)
  let stilt = 0;
  let terrace = 0;
  let headroom = 0;
  let plotEstimate = 0; // rough — plot area not directly known
  const dwellingUnits = new Set();

  for (const u of floorUnits || []) {
    const a = num(u.area_sqft) * num(u.units_count, 1);
    const cat = u.area_category || 'built_up';
    if (cat === 'built_up') pbua += a;
    else if (cat === 'stilt') stilt += a;
    else if (cat === 'terrace') terrace += a;
    else if (cat === 'headroom') headroom += a;

    // Dwelling-unit inference: count each row whose unit_type looks like a dwelling
    if (/^(1bhk|2bhk|3bhk|4bhk|5bhk|rk|studio)$/i.test(u.unit_type || '')) {
      const key = `${u.floor_number}-${u.unit_type}-${u.area_sqft}-${Math.random().toString(36).slice(2, 6)}`;
      // Use units_count as DU count for that row
      for (let i = 0; i < num(u.units_count, 1); i++) dwellingUnits.add(key + '-' + i);
    }
  }
  const totalBuiltUp = pbua + stilt + terrace + headroom;
  return { pbua, stilt, terrace, headroom, totalBuiltUp, du: dwellingUnits.size, plotEstimate };
}

/**
 * Compute entitled quantity for a formula rule given the areas.
 */
function computeEntitlement(rule, areas) {
  const { basis, step_size, qty_per_step } = rule;
  const S = num(step_size);
  const Q = num(qty_per_step);
  switch (basis) {
    case 'per_DU':          return areas.du * Q;
    case 'per_room':        return Q; // per-room needs a room count input we don't have yet
    case 'per_500_PBUA':    return Math.floor(areas.pbua / (S || 500)) * (Q || 1);
    case 'per_1000_PBUA':   return Math.floor(areas.pbua / (S || 1000)) * (Q || 1);
    case 'per_1000_plot':   return Math.floor((areas.plotEstimate || 0) / (S || 1000)) * (Q || 1);
    case 'pct_of_PBUA':     return (areas.pbua * Q) / 100;
    case 'pct_of_slab_area':return (areas.totalBuiltUp * Q) / 100;
    case 'fixed':
    case 'per_project':     return Q;
    case 'per_item':
    case 'per_plan':        return null;   // requires plan-level input
    default:                return null;
  }
}

/**
 * Load all rules + this package's tier overrides in one query.
 */
async function loadRulesForPackage(db, packageId) {
  const q = await db.query(
    `SELECT r.rule_id, r.module, r.rule_type, r.title, r.basis, r.step_size, r.qty_per_step,
            r.rounding, r.uom, r.overage_mode, r.spec_text, r.measurement_convention, r.sort_order,
            t.included, t.value_cap, t.rate_cap, t.brand_options, t.overage_rate, t.notes AS tier_notes
       FROM package_rules r
       LEFT JOIN package_rule_tiers t ON t.rule_id = r.rule_id AND t.package_id = $1
       ORDER BY r.sort_order`,
    [packageId]
  );
  return q.rows;
}

/**
 * Apply site conditions. Returns list of deviations with amounts.
 *
 * `site_answers` is [{condition_id, actual_answer}]. Standard = catalog.standard_answer.
 * When actual differs, we mark deviation and — if the linked rule has an overage_rate — surface it.
 */
async function evaluateSiteConditions(db, packageId, siteAnswers) {
  if (!siteAnswers || !siteAnswers.length) return { deviations: [], total: 0 };

  const catalog = await db.query(
    `SELECT c.id, c.code, c.question, c.standard_answer, c.deviation_answer, c.triggers_rule_id,
            c.default_impact,
            t.overage_rate AS trigger_overage_rate
       FROM site_conditions_catalog c
       LEFT JOIN package_rule_tiers t ON t.rule_id = c.triggers_rule_id AND t.package_id = $1`,
    [packageId]
  );
  const byId = new Map(catalog.rows.map(r => [r.id, r]));

  const deviations = [];
  let total = 0;
  for (const ans of siteAnswers) {
    const meta = byId.get(Number(ans.condition_id));
    if (!meta) continue;
    const isDeviation = (ans.actual_answer || '').trim().toLowerCase() !==
                        (meta.standard_answer || '').trim().toLowerCase() &&
                        !!(ans.actual_answer && String(ans.actual_answer).trim());
    let triggered = 0;
    if (isDeviation && meta.trigger_overage_rate != null) {
      // Base impact assumption: rate x 1 (we don't know magnitude yet). UI can accept manual amount later.
      // For now, use the raw overage_rate as a flag amount unless caller supplies notes with numeric extraction.
      triggered = 0; // leave manual for now; frontend can enter magnitude
    }
    deviations.push({
      condition_id: meta.id,
      code: meta.code,
      question: meta.question,
      standard_answer: meta.standard_answer,
      actual_answer: ans.actual_answer || '',
      is_deviation: isDeviation,
      triggered_amount: triggered,
      triggers_rule_id: meta.triggers_rule_id,
      default_impact: meta.default_impact,
    });
    total += triggered;
  }
  return { deviations, total };
}

/**
 * Main entry.
 */
async function evaluateQuotation(db, { package_id, floor_units, site_answers }) {
  if (!package_id) throw new Error('package_id required');
  const areas = computeAreas(floor_units || []);
  const rules = await loadRulesForPackage(db, package_id);

  const evaluations = [];
  for (const r of rules) {
    if (r.included === false) continue;
    const base = {
      rule_id: r.rule_id, module: r.module, rule_type: r.rule_type, title: r.title,
      basis: r.basis, uom: r.uom, spec_text: r.spec_text,
      cap_value: r.value_cap != null ? Number(r.value_cap) : null,
      rate_cap:  r.rate_cap  != null ? Number(r.rate_cap)  : null,
      brand_options: r.brand_options,
      overage_mode: r.overage_mode,
      overage_rate: r.overage_rate != null ? Number(r.overage_rate) : null,
      entitled_qty: null, actual_qty: null, overage_qty: null,
      per_unit_amount: null, overage_amount: 0,
      applied: false,
    };
    if (r.rule_type === 'entitlement_formula') {
      base.entitled_qty = computeEntitlement(r, areas);
      base.applied = base.entitled_qty != null;
    } else if (r.rule_type === 'value_cap' || r.rule_type === 'rate_cap') {
      base.applied = false;   // informational — bound to specific line items downstream
    }
    evaluations.push(base);
  }

  const site = await evaluateSiteConditions(db, package_id, site_answers || []);
  const overageTotal = evaluations.reduce((s, e) => s + (Number(e.overage_amount) || 0), 0);

  return {
    areas,
    evaluations,
    site_deviations: site.deviations,
    rule_overage_total: +overageTotal.toFixed(2),
    site_escalator_total: +site.total.toFixed(2),
  };
}

module.exports = { evaluateQuotation, computeAreas, loadRulesForPackage };
