-- Unified Package Rulebook schema.
-- One rule per row, tier-specific overrides in the child table.
BEGIN;

CREATE TABLE IF NOT EXISTS package_rules (
    rule_id                TEXT PRIMARY KEY,         -- 'R-DOR-004'
    module                 TEXT NOT NULL,            -- 'doors'|'earthwork'|...
    rule_type              TEXT NOT NULL,            -- entitlement_formula|value_cap|rate_cap|brand_spec|dimension_spec|process_qc|risk_allocation|exclusion|fixture_matrix
    title                  TEXT NOT NULL,
    basis                  TEXT,                     -- per_DU|per_500_PBUA|per_1000_PBUA|pct_of_PBUA|pct_of_slab_area|per_1000_plot|per_item|per_project|per_plan|fixed
    step_size              NUMERIC,
    qty_per_step           NUMERIC,
    rounding               TEXT,                     -- floor|prorata|null
    uom                    TEXT,                     -- sft|nos|L|rft|kg|%
    overage_mode           TEXT,                     -- prorata|actuals|per_item_rate|market_price|owner_scope
    spec_text              TEXT,
    measurement_convention TEXT,
    sort_order             INT NOT NULL DEFAULT 0,
    created_at             TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pkg_rules_module ON package_rules(module, sort_order);

CREATE TABLE IF NOT EXISTS package_rule_tiers (
    id             SERIAL PRIMARY KEY,
    rule_id        TEXT NOT NULL REFERENCES package_rules(rule_id) ON DELETE CASCADE,
    package_id     INT  NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    included       BOOLEAN NOT NULL DEFAULT TRUE,
    value_cap      NUMERIC,                          -- "up to Rs X" line-item cap
    rate_cap       NUMERIC,                          -- "up to Rs X/sft" rate cap
    brand_options  TEXT[],                           -- {'Anchor Roma', 'GM'}
    overage_rate   NUMERIC,                          -- when overage_mode = per_item_rate
    notes          TEXT,
    UNIQUE (rule_id, package_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_rule_tiers ON package_rule_tiers(package_id);

CREATE TABLE IF NOT EXISTS site_conditions_catalog (
    id                 SERIAL PRIMARY KEY,
    code               TEXT UNIQUE NOT NULL,          -- 'offsets_gt_3ft'
    question           TEXT NOT NULL,
    standard_answer    TEXT NOT NULL,                 -- '>3 Ft' | 'No' | 'Yes'
    deviation_answer   TEXT,                          -- e.g. 'No' means "not >3ft"
    triggers_rule_id   TEXT REFERENCES package_rules(rule_id) ON DELETE SET NULL,
    default_impact     TEXT,                          -- short human note
    sort_order         INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quotation_site_conditions (
    id                    SERIAL PRIMARY KEY,
    client_quotation_id   INT NOT NULL REFERENCES client_quotations(client_quotation_id) ON DELETE CASCADE,
    condition_id          INT NOT NULL REFERENCES site_conditions_catalog(id) ON DELETE RESTRICT,
    actual_answer         TEXT,
    is_deviation          BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_amount      NUMERIC DEFAULT 0,
    notes                 TEXT,
    created_at            TIMESTAMP DEFAULT NOW(),
    UNIQUE (client_quotation_id, condition_id)
);

CREATE TABLE IF NOT EXISTS quotation_rule_evaluations (
    id                    SERIAL PRIMARY KEY,
    client_quotation_id   INT NOT NULL REFERENCES client_quotations(client_quotation_id) ON DELETE CASCADE,
    rule_id               TEXT NOT NULL REFERENCES package_rules(rule_id) ON DELETE RESTRICT,
    entitled_qty          NUMERIC,
    actual_qty            NUMERIC,
    overage_qty           NUMERIC,
    cap_value             NUMERIC,
    per_unit_amount       NUMERIC,
    overage_amount        NUMERIC DEFAULT 0,
    applied               BOOLEAN NOT NULL DEFAULT TRUE,
    notes                 TEXT,
    created_at            TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qre_quo ON quotation_rule_evaluations(client_quotation_id);

-- Also store aggregate rule + site amounts on the quotation itself
ALTER TABLE client_quotations
    ADD COLUMN IF NOT EXISTS rule_overage_amount    NUMERIC(14,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS site_escalator_amount  NUMERIC(14,2) DEFAULT 0;

COMMIT;
SELECT 'rulebook schema applied' AS status;
