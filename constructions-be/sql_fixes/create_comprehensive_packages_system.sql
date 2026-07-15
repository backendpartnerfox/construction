-- =============================================
-- COMPREHENSIVE PACKAGES SYSTEM
-- =============================================
-- This script creates a complete packages management system
-- for construction projects including package types, items, and customizations

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS package_item_choice_customizations CASCADE;
DROP TABLE IF EXISTS package_items_mapping CASCADE;
DROP TABLE IF EXISTS package_area_multipliers CASCADE;
DROP TABLE IF EXISTS packages CASCADE;

-- =============================================
-- 1. PACKAGES TABLE (Main Package Definition)
-- =============================================
CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL UNIQUE,
    package_code VARCHAR(50) UNIQUE,
    package_type VARCHAR(50) CHECK (package_type IN ('Basic', 'Standard', 'Premium', 'Luxury', 'Custom')) DEFAULT 'Standard',
    
    -- Pricing
    base_price_per_sqft DECIMAL(10,2) NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount_per_sqft DECIMAL(10,2) GENERATED ALWAYS AS (
        ROUND((base_price_per_sqft * gst_percentage / 100)::numeric, 2)
    ) STORED,
    total_price_per_sqft DECIMAL(10,2) GENERATED ALWAYS AS (
        ROUND((base_price_per_sqft * (1 + gst_percentage / 100))::numeric, 2)
    ) STORED,
    
    -- Package Description
    short_description TEXT,
    detailed_description TEXT,
    features TEXT[],  -- Array of key features
    exclusions TEXT[], -- What's not included
    
    -- Package Specifications
    quality_level VARCHAR(50), -- Basic, Standard, Premium, Luxury
    construction_type VARCHAR(100), -- Residential, Commercial, etc.
    suitable_for TEXT[], -- Array: Villa, Apartment, Commercial, etc.
    
    -- Timeline
    estimated_duration_months INT,
    
    -- Area Calculations
    applies_area_multipliers BOOLEAN DEFAULT TRUE,
    habitable_area_rate DECIMAL(5,2) DEFAULT 1.00,
    balcony_area_rate DECIMAL(5,2) DEFAULT 0.65,
    stilt_area_rate DECIMAL(5,2) DEFAULT 0.65,
    terrace_area_rate DECIMAL(5,2) DEFAULT 0.65,
    
    -- Package Status
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    
    -- Marketing
    package_image_url VARCHAR(255),
    brochure_url VARCHAR(255),
    popular_choice BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    
    -- Foreign keys
    FOREIGN KEY (created_by) REFERENCES employees(employee_id),
    FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
);

-- =============================================
-- 2. PACKAGE ITEMS MAPPING (Items included in package)
-- =============================================
CREATE TABLE package_items_mapping (
    mapping_id SERIAL PRIMARY KEY,
    package_id INT NOT NULL,
    item_id INT NOT NULL,
    
    -- Default choice for this item in this package
    default_choice_option_id INT NOT NULL,
    
    -- Item specifications in package
    is_included BOOLEAN DEFAULT TRUE,
    is_customizable BOOLEAN DEFAULT TRUE,
    quantity_multiplier DECIMAL(10,4) DEFAULT 1.0000,
    
    -- Pricing impact
    price_impact_per_sqft DECIMAL(10,2) DEFAULT 0,
    
    -- Display
    display_order INT DEFAULT 0,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (default_choice_option_id) REFERENCES item_choices(choice_option_id),
    
    -- Ensure unique item per package
    UNIQUE(package_id, item_id)
);

-- =============================================
-- 3. PACKAGE ITEM CHOICE CUSTOMIZATIONS
-- =============================================
CREATE TABLE package_item_choice_customizations (
    customization_id SERIAL PRIMARY KEY,
    package_id INT NOT NULL,
    item_id INT NOT NULL,
    choice_option_id INT NOT NULL,
    
    -- Customization details
    is_allowed BOOLEAN DEFAULT TRUE,
    price_difference_per_sqft DECIMAL(10,2) DEFAULT 0,
    
    -- Additional specifications
    specifications TEXT,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (choice_option_id) REFERENCES item_choices(choice_option_id),
    
    -- Ensure unique customization
    UNIQUE(package_id, item_id, choice_option_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_packages_type ON packages(package_type);
CREATE INDEX idx_packages_active ON packages(is_active);
CREATE INDEX idx_packages_published ON packages(is_published);
CREATE INDEX idx_packages_popular ON packages(popular_choice);

CREATE INDEX idx_package_items_package ON package_items_mapping(package_id);
CREATE INDEX idx_package_items_item ON package_items_mapping(item_id);
CREATE INDEX idx_package_items_choice ON package_items_mapping(default_choice_option_id);

CREATE INDEX idx_package_customizations_package ON package_item_choice_customizations(package_id);
CREATE INDEX idx_package_customizations_item ON package_item_choice_customizations(item_id);

-- =============================================
-- SAMPLE DATA - Basic Package
-- =============================================
INSERT INTO packages (
    package_name, package_code, package_type, base_price_per_sqft,
    short_description, detailed_description,
    features, exclusions,
    quality_level, construction_type, suitable_for,
    estimated_duration_months,
    is_active, is_published, display_order
) VALUES (
    'Basic Construction Package',
    'PKG-BASIC-001',
    'Basic',
    1500.00,
    'Essential construction package with standard materials and finishes',
    'Our Basic package includes all essential construction elements using quality materials. Perfect for budget-conscious projects without compromising on structural integrity.',
    ARRAY[
        'Standard structural materials (TATA FE 500D TMT, M25 RMC)',
        'Red clay bricks for masonry',
        'Basic cement (Ultratech OPC 43)',
        'Standard flooring tiles',
        'Basic electrical and plumbing fittings',
        'Single coat emulsion paint'
    ],
    ARRAY[
        'Premium brand materials',
        'False ceiling',
        'Modular kitchen',
        'Premium sanitary ware',
        'Split AC provisions'
    ],
    'Basic',
    'Residential',
    ARRAY['Villa', 'Apartment', 'Individual House'],
    10,
    TRUE,
    TRUE,
    1
);

-- =============================================
-- SAMPLE DATA - Standard Package
-- =============================================
INSERT INTO packages (
    package_name, package_code, package_type, base_price_per_sqft,
    short_description, detailed_description,
    features, exclusions,
    quality_level, construction_type, suitable_for,
    estimated_duration_months,
    popular_choice,
    is_active, is_published, display_order
) VALUES (
    'Standard Construction Package',
    'PKG-STD-001',
    'Standard',
    1800.00,
    'Balanced package with quality materials and modern finishes',
    'Our Standard package offers an excellent balance of quality and value. Includes premium structural materials and contemporary finishes.',
    ARRAY[
        'Premium structural materials (TATA FE 550D TMT, M30 RMC)',
        'Fly ash bricks for masonry',
        'Premium cement (Ultratech OPC 53)',
        'Vitrified flooring tiles',
        'Modular switches and branded CP fittings',
        'Acrylic emulsion paint (2 coats)',
        'Basic false ceiling in living room',
        'Semi-modular kitchen'
    ],
    ARRAY[
        'Fully modular kitchen',
        'Premium imported tiles',
        'Home automation',
        'Swimming pool',
        'Landscaping'
    ],
    'Standard',
    'Residential',
    ARRAY['Villa', 'Duplex', 'Apartment', 'Row House'],
    12,
    TRUE,
    TRUE,
    TRUE,
    2
);

-- =============================================
-- SAMPLE DATA - Premium Package
-- =============================================
INSERT INTO packages (
    package_name, package_code, package_type, base_price_per_sqft,
    short_description, detailed_description,
    features, exclusions,
    quality_level, construction_type, suitable_for,
    estimated_duration_months,
    is_active, is_published, display_order
) VALUES (
    'Premium Construction Package',
    'PKG-PREM-001',
    'Premium',
    2200.00,
    'Premium package with high-end materials and luxury finishes',
    'Our Premium package delivers superior quality with luxury finishes throughout. Perfect for discerning clients who demand the best.',
    ARRAY[
        'High-grade structural materials (TATA FE 600D TMT, M35 RMC)',
        'AAC blocks for masonry',
        'Premium cement (Ultratech PPC)',
        'Premium vitrified or marble flooring',
        'Designer switches and luxury CP fittings',
        'Premium emulsion paint (3 coats)',
        'Complete false ceiling with cove lighting',
        'Fully modular kitchen with premium hardware',
        'Home automation ready',
        'Premium sanitary ware'
    ],
    ARRAY[
        'Swimming pool construction',
        'Complete landscaping',
        'Home theater setup',
        'Solar panel installation',
        'Elevator installation'
    ],
    'Premium',
    'Residential',
    ARRAY['Luxury Villa', 'Penthouse', 'Mansion'],
    14,
    TRUE,
    TRUE,
    3
);

-- =============================================
-- SAMPLE PACKAGE ITEMS MAPPING
-- =============================================
-- Map items to Basic Package
INSERT INTO package_items_mapping (
    package_id, item_id, default_choice_option_id,
    is_included, is_customizable, display_order
) VALUES
    -- Basic Package TMT Bars
    (1, 1, 1, TRUE, TRUE, 1),  -- TATA FE 500D TMT
    -- Basic Package RMC
    (1, 2, 7, TRUE, TRUE, 2),  -- Aparna RMC M20
    -- Basic Package Bricks
    (1, 4, 15, TRUE, TRUE, 3), -- Standard Red Clay Brick
    -- Basic Package Cement
    (1, 6, 21, TRUE, TRUE, 4); -- Ultratech OPC 43

-- Map items to Standard Package
INSERT INTO package_items_mapping (
    package_id, item_id, default_choice_option_id,
    is_included, is_customizable, display_order
) VALUES
    -- Standard Package TMT Bars
    (2, 1, 2, TRUE, TRUE, 1),  -- Radha FE 550D TMT
    -- Standard Package RMC
    (2, 2, 8, TRUE, TRUE, 2),  -- Aparna RMC M25
    -- Standard Package Bricks
    (2, 4, 17, TRUE, TRUE, 3), -- Fly Ash Brick
    -- Standard Package Cement
    (2, 6, 22, TRUE, TRUE, 4); -- Ultratech OPC 53

-- Map items to Premium Package
INSERT INTO package_items_mapping (
    package_id, item_id, default_choice_option_id,
    is_included, is_customizable, display_order
) VALUES
    -- Premium Package TMT Bars
    (3, 1, 3, TRUE, TRUE, 1),  -- TATA FE 600D TMT
    -- Premium Package RMC
    (3, 2, 11, TRUE, TRUE, 2), -- ACC RMC M30
    -- Premium Package Bricks
    (3, 4, 18, TRUE, TRUE, 3), -- AAC Block (Siporex)
    -- Premium Package Cement
    (3, 6, 23, TRUE, TRUE, 4); -- Ultratech PPC

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- View: Package with item counts
CREATE OR REPLACE VIEW package_summary AS
SELECT 
    p.package_id,
    p.package_name,
    p.package_type,
    p.base_price_per_sqft,
    p.total_price_per_sqft,
    p.is_active,
    p.is_published,
    p.popular_choice,
    COUNT(pim.mapping_id) as total_items,
    p.created_at
FROM packages p
LEFT JOIN package_items_mapping pim ON p.package_id = pim.package_id
GROUP BY p.package_id
ORDER BY p.display_order, p.package_name;

-- View: Complete package details with items
CREATE OR REPLACE VIEW package_complete_details AS
SELECT 
    p.package_id,
    p.package_name,
    p.package_type,
    p.total_price_per_sqft,
    i.item_name,
    ic.display_name as choice_name,
    pim.is_customizable
FROM packages p
LEFT JOIN package_items_mapping pim ON p.package_id = pim.package_id
LEFT JOIN items i ON pim.item_id = i.item_id
LEFT JOIN item_choices ic ON pim.default_choice_option_id = ic.choice_option_id
WHERE p.is_active = TRUE
ORDER BY p.package_name, pim.display_order;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PACKAGES SYSTEM CREATED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '  - packages';
    RAISE NOTICE '  - package_items_mapping';
    RAISE NOTICE '  - package_item_choice_customizations';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Data Inserted:';
    RAISE NOTICE '  - 3 Packages (Basic, Standard, Premium)';
    RAISE NOTICE '  - Package item mappings';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Views:';
    RAISE NOTICE '  - package_summary';
    RAISE NOTICE '  - package_complete_details';
    RAISE NOTICE '========================================';
END $$;
