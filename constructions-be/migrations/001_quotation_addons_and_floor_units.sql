-- Quotation building blocks: package add-on catalog, per-quotation floor lines,
-- per-quotation add-on lines, and design-fee % columns on client_quotations.

BEGIN;

-- 1. Catalog of add-ons that can be quoted on top of a package.
CREATE TABLE IF NOT EXISTS package_addons (
    id                SERIAL PRIMARY KEY,
    package_id        INT REFERENCES packages(id) ON DELETE CASCADE,  -- NULL = applies to all packages
    name              VARCHAR(200) NOT NULL,                          -- e.g. 'Lift Provision - Sub Structure'
    description       TEXT,
    unit              VARCHAR(40)  NOT NULL DEFAULT 'unit',           -- unit | per_floor | per_sft | per_running_ft | per_ltr
    default_rate      NUMERIC(12, 2) NOT NULL,
    inclusions        TEXT,
    exclusions        TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order        INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_package_addons_pkg ON package_addons(package_id);

-- 2. Floor-by-floor unit breakdown for each quotation.
CREATE TABLE IF NOT EXISTS quotation_floor_units (
    id                    SERIAL PRIMARY KEY,
    client_quotation_id   INT NOT NULL REFERENCES client_quotations(client_quotation_id) ON DELETE CASCADE,
    floor_number          INT NOT NULL,             -- 0=ground, 1=first, 2=second, ...
    floor_label           VARCHAR(40),              -- 'Ground Floor', '1st Floor', 'Headroom', 'Terrace'
    unit_type             VARCHAR(40) NOT NULL,     -- 3bhk | 2bhk | rk | carParking | passage | terrace | headroom | other
    units_count           INT NOT NULL DEFAULT 1,
    area_sqft             NUMERIC(10, 2) NOT NULL,
    area_category         VARCHAR(40) NOT NULL DEFAULT 'built_up',    -- built_up | stilt | terrace | headroom  (drives rate)
    rate_per_sqft         NUMERIC(10, 2),           -- override; null = use package rate for area_category
    computed_amount       NUMERIC(14, 2),           -- populated by trigger on insert/update
    notes                 TEXT,
    created_at            TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qfloor_units_quo ON quotation_floor_units(client_quotation_id, floor_number);

-- 3. Add-on lines selected for each quotation.
CREATE TABLE IF NOT EXISTS quotation_addons (
    id                    SERIAL PRIMARY KEY,
    client_quotation_id   INT NOT NULL REFERENCES client_quotations(client_quotation_id) ON DELETE CASCADE,
    addon_id              INT NOT NULL REFERENCES package_addons(id) ON DELETE RESTRICT,
    quantity              NUMERIC(10, 2) NOT NULL DEFAULT 1,
    rate                  NUMERIC(12, 2) NOT NULL,        -- snapshot at time of quotation
    computed_amount       NUMERIC(14, 2) NOT NULL,        -- quantity * rate
    notes                 TEXT,
    created_at            TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qaddons_quo ON quotation_addons(client_quotation_id);

-- 4. Design-fee percentages on the parent quotation.
ALTER TABLE client_quotations
    ADD COLUMN IF NOT EXISTS architectural_fee_percentage NUMERIC(5, 2) DEFAULT 2.00,
    ADD COLUMN IF NOT EXISTS other_design_fee_percentage  NUMERIC(5, 2) DEFAULT 2.50,
    ADD COLUMN IF NOT EXISTS architectural_fee_amount     NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS other_design_fee_amount      NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS total_design_amount          NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS addons_total_amount          NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS floor_units_total_amount     NUMERIC(14, 2);

COMMIT;

SELECT 'schema migration applied' AS status;
