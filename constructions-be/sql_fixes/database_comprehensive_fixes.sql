-- =============================================
-- COMPREHENSIVE DATABASE FIXES FOR CONSTRUCTION SYSTEM
-- =============================================

-- 1. FIX: Ensure employees table exists with proper structure
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    employee_code VARCHAR(20) UNIQUE,
    designation VARCHAR(100),
    department VARCHAR(100),
    role VARCHAR(50),
    reporting_manager_id INT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Terminated', 'Resigned')),
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reporting_manager_id) REFERENCES employees(employee_id)
);

-- Insert sample employees
INSERT INTO employees (first_name, last_name, email, employee_code, designation, department, role, status, join_date)
VALUES 
    ('Rajesh', 'Kumar', 'rajesh@constructpro.com', 'EMP001', 'Project Manager', 'Projects', 'Manager', 'Active', '2023-01-15'),
    ('Priya', 'Singh', 'priya@constructpro.com', 'EMP002', 'Site Engineer', 'Engineering', 'Engineer', 'Active', '2023-02-10'),
    ('Anand', 'Sharma', 'anand@constructpro.com', 'EMP003', 'Architect', 'Design', 'Senior Staff', 'Active', '2023-03-05');

-- 2. FIX: Correct table name inconsistencies
-- Drop and recreate TMT calculations table with proper naming
DROP TABLE IF EXISTS items_TMT_calculations CASCADE;
DROP TABLE IF EXISTS items_steel_calculations CASCADE;

CREATE TABLE items_tmt_calculations (
    calculation_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    element_id INT NOT NULL,
    measurement_id INT NOT NULL,
    
    -- Steel Bar Details
    main_bar_dia DECIMAL(5,2),
    distribution_bar_dia DECIMAL(5,2),
    qty_main_bars INT,
    qty_distribution_bars INT,
    
    -- Bar Length Calculations
    main_bar_length DECIMAL(10,2),
    distribution_bar_length DECIMAL(10,2),
    
    -- Weight Calculations
    main_bar_weight_per_meter DECIMAL(8,4),
    distribution_bar_weight_per_meter DECIMAL(8,4),
    
    main_bar_total_weight DECIMAL(12,2) GENERATED ALWAYS AS (
        qty_main_bars * main_bar_length * main_bar_weight_per_meter
    ) STORED,
    
    distribution_bar_total_weight DECIMAL(12,2) GENERATED ALWAYS AS (
        qty_distribution_bars * distribution_bar_length * distribution_bar_weight_per_meter
    ) STORED,
    
    total_steel_weight DECIMAL(12,2) GENERATED ALWAYS AS (
        main_bar_total_weight + distribution_bar_total_weight
    ) STORED,
    
    -- Wastage and Additional Factors
    wastage_percentage DECIMAL(5,2) DEFAULT 5.00,
    total_steel_with_wastage DECIMAL(12,2) GENERATED ALWAYS AS (
        total_steel_weight * (1 + (wastage_percentage/100))
    ) STORED,
    
    bending_factor DECIMAL(5,2) DEFAULT 1.10,
    cutting_factor DECIMAL(5,2) DEFAULT 1.05,
    
    -- Metadata
    calculated_by INT,
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by INT,
    verification_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) CHECK (status IN ('Draft', 'Verified', 'Pending')) DEFAULT 'Draft',
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (element_id) REFERENCES elements(element_id),
    FOREIGN KEY (measurement_id) REFERENCES architect_measurements_structural(structural_measurement_id),
    FOREIGN KEY (calculated_by) REFERENCES employees(employee_id),
    FOREIGN KEY (verified_by) REFERENCES employees(employee_id)
);

-- 3. FIX: Create workflow management tables
CREATE TABLE project_components (
    component_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    component_category VARCHAR(50) NOT NULL, -- 'Structural', 'Electrical', 'Plumbing', 'Flooring', 'Painting', etc.
    floor_number INT, -- Ground=0, First=1, etc.
    floor_name VARCHAR(50), -- 'Ground Floor', 'First Floor'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE project_units (
    unit_id SERIAL PRIMARY KEY,
    component_id INT NOT NULL,
    unit_name VARCHAR(150) NOT NULL, -- e.g., 'Ground Floor - Electrical Pipes'
    unit_description TEXT,
    unit_category VARCHAR(50), -- 'Material', 'Labor', 'Equipment'
    
    -- Workflow Status
    status VARCHAR(50) DEFAULT 'Requirement' CHECK (status IN (
        'Requirement', 'Component', 'Unit', 'Phase', 'Selection', 
        'Block', 'Sequencing', 'Module', 'Work_Package', 'Completed'
    )),
    
    -- Dependencies
    depends_on_units INT[], -- Array of unit_ids this unit depends on
    client_selection_required BOOLEAN DEFAULT FALSE,
    client_selection_deadline DATE,
    
    -- Costing
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    
    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Assignments
    assigned_to INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (component_id) REFERENCES project_components(component_id),
    FOREIGN KEY (assigned_to) REFERENCES employees(employee_id)
);

-- 4. FIX: Add component mapping to architect measurements if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'architect_measurements_structural' 
        AND column_name = 'component_id'
    ) THEN
        ALTER TABLE architect_measurements_structural 
        ADD COLUMN component_id INT,
        ADD FOREIGN KEY (component_id) REFERENCES project_components(component_id);
    END IF;
END $$;

-- 5. FIX: Create separate BOQ tables for different categories
CREATE TABLE IF NOT EXISTS project_boq_structural (
    boq_structural_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    component_id INT,
    element_id INT NOT NULL,
    item_id INT NOT NULL,
    
    -- Measurements reference
    measurement_id INT,
    
    -- Quantities
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    
    -- Specifications
    specifications JSONB,
    
    -- Costing
    unit_rate DECIMAL(10,2),
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Draft',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (component_id) REFERENCES project_components(component_id),
    FOREIGN KEY (element_id) REFERENCES elements(element_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (measurement_id) REFERENCES architect_measurements_structural(structural_measurement_id)
);

CREATE TABLE IF NOT EXISTS project_boq_electrical (
    boq_electrical_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    component_id INT,
    unit_id INT,
    item_description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    unit_rate DECIMAL(10,2),
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    specifications JSONB,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (component_id) REFERENCES project_components(component_id),
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id)
);

CREATE TABLE IF NOT EXISTS project_boq_plumbing (
    boq_plumbing_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    component_id INT,
    unit_id INT,
    item_description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    unit_rate DECIMAL(10,2),
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    specifications JSONB,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (component_id) REFERENCES project_components(component_id),
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id)
);

CREATE TABLE IF NOT EXISTS project_boq_flooring (
    boq_flooring_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    component_id INT,
    unit_id INT,
    item_description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    unit_rate DECIMAL(10,2),
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    specifications JSONB,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (component_id) REFERENCES project_components(component_id),
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id)
);

CREATE TABLE IF NOT EXISTS project_boq_painting (
    boq_painting_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    component_id INT,
    unit_id INT,
    item_description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    unit_rate DECIMAL(10,2),
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    specifications JSONB,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (component_id) REFERENCES project_components(component_id),
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id)
);

-- 6. FIX: Create consolidated costing table
CREATE TABLE IF NOT EXISTS costing_boq (
    costing_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    unit_id INT,
    
    -- Source BOQ reference (polymorphic)
    boq_type VARCHAR(50) NOT NULL, -- 'structural', 'electrical', 'plumbing', etc.
    boq_id INT NOT NULL, -- ID from the specific BOQ table
    
    -- Costing details
    item_description VARCHAR(255),
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    unit_rate DECIMAL(10,2),
    material_cost DECIMAL(15,2),
    labor_cost DECIMAL(15,2),
    equipment_cost DECIMAL(15,2),
    overhead_percentage DECIMAL(5,2) DEFAULT 10.00,
    overhead_cost DECIMAL(15,2) GENERATED ALWAYS AS (
        (material_cost + labor_cost + equipment_cost) * (overhead_percentage / 100)
    ) STORED,
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (
        material_cost + labor_cost + equipment_cost + 
        ((material_cost + labor_cost + equipment_cost) * (overhead_percentage / 100))
    ) STORED,
    
    -- Status and approvals
    status VARCHAR(50) DEFAULT 'Draft',
    approved_by INT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
);

-- 7. FIX: Create phases table for scheduling
CREATE TABLE IF NOT EXISTS project_phases (
    phase_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    phase_description TEXT,
    phase_order INT,
    
    -- Units grouped in this phase
    unit_ids INT[], -- Array of unit_ids in this phase
    
    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Dependencies
    depends_on_phases INT[], -- Array of phase_ids this phase depends on
    
    -- Status
    status VARCHAR(50) DEFAULT 'Planned' CHECK (status IN (
        'Planned', 'Ready', 'In_Progress', 'On_Hold', 'Completed', 'Cancelled'
    )),
    
    -- Assignments
    phase_manager_id INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (phase_manager_id) REFERENCES employees(employee_id)
);

-- 8. FIX: Create client selections tracking
CREATE TABLE IF NOT EXISTS client_selections (
    selection_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    unit_id INT,
    
    -- Selection details
    selection_category VARCHAR(100), -- 'Flooring', 'Paint Color', 'Fixtures', etc.
    selection_description TEXT,
    available_options JSONB, -- JSON array of available choices
    client_selected_option JSONB, -- Client's selection
    
    -- Pricing impact
    base_cost DECIMAL(15,2),
    selected_cost DECIMAL(15,2),
    price_difference DECIMAL(15,2) GENERATED ALWAYS AS (selected_cost - base_cost) STORED,
    
    -- Timeline
    selection_deadline DATE,
    selection_made_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'In_Progress', 'Selected', 'Approved', 'Changed', 'Cancelled'
    )),
    
    -- Client interaction
    presented_to_client_date DATE,
    client_response_date DATE,
    client_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id)
);

-- 9. FIX: Create work packages table for execution
CREATE TABLE IF NOT EXISTS work_packages (
    work_package_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    phase_id INT,
    
    -- Work package details
    work_package_name VARCHAR(150) NOT NULL,
    work_package_description TEXT,
    work_order_number VARCHAR(100),
    
    -- Units in this work package
    unit_ids INT[],
    
    -- Resources
    assigned_contractor INT,
    assigned_supervisor INT,
    labor_required INT,
    equipment_required TEXT[],
    
    -- Timeline
    scheduled_start_date DATE,
    scheduled_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Materials and procurement
    materials_ordered BOOLEAN DEFAULT FALSE,
    materials_delivered BOOLEAN DEFAULT FALSE,
    materials_approved BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN (
        'Scheduled', 'Materials_Ordered', 'Ready_to_Start', 'In_Progress', 
        'On_Hold', 'Quality_Check', 'Completed', 'Cancelled'
    )),
    
    -- Quality and completion
    quality_check_passed BOOLEAN DEFAULT FALSE,
    quality_checked_by INT,
    quality_check_date DATE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (phase_id) REFERENCES project_phases(phase_id),
    FOREIGN KEY (assigned_contractor) REFERENCES employees(employee_id),
    FOREIGN KEY (assigned_supervisor) REFERENCES employees(employee_id),
    FOREIGN KEY (quality_checked_by) REFERENCES employees(employee_id)
);

-- 10. FIX: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_components_project ON project_components(project_id);
CREATE INDEX IF NOT EXISTS idx_project_components_category ON project_components(component_category);
CREATE INDEX IF NOT EXISTS idx_project_units_component ON project_units(component_id);
CREATE INDEX IF NOT EXISTS idx_project_units_status ON project_units(status);
CREATE INDEX IF NOT EXISTS idx_costing_boq_project ON costing_boq(project_id);
CREATE INDEX IF NOT EXISTS idx_costing_boq_unit ON costing_boq(unit_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_project ON client_selections(project_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_status ON client_selections(status);
CREATE INDEX IF NOT EXISTS idx_work_packages_project ON work_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_phase ON work_packages(phase_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_status ON work_packages(status);

-- 11. SAMPLE DATA for testing workflow
-- Insert sample components for project 1
INSERT INTO project_components (project_id, component_name, component_category, floor_number, floor_name) 
VALUES 
    (1, 'Ground Floor Structural', 'Structural', 0, 'Ground Floor'),
    (1, 'First Floor Structural', 'Structural', 1, 'First Floor'),
    (1, 'Ground Floor Electrical', 'Electrical', 0, 'Ground Floor'),
    (1, 'First Floor Electrical', 'Electrical', 1, 'First Floor'),
    (1, 'Ground Floor Plumbing', 'Plumbing', 0, 'Ground Floor'),
    (1, 'First Floor Plumbing', 'Plumbing', 1, 'First Floor'),
    (1, 'Ground Floor Flooring', 'Flooring', 0, 'Ground Floor'),
    (1, 'First Floor Flooring', 'Flooring', 1, 'First Floor'),
    (1, 'Exterior Painting', 'Painting', NULL, 'Exterior'),
    (1, 'Interior Painting', 'Painting', NULL, 'Interior')
ON CONFLICT DO NOTHING;

-- Insert sample units
INSERT INTO project_units (component_id, unit_name, unit_category, status, client_selection_required, estimated_cost)
VALUES 
    (1, 'Ground Floor - Foundation Work', 'Material', 'Unit', FALSE, 500000.00),
    (1, 'Ground Floor - Column Construction', 'Material', 'Unit', FALSE, 300000.00),
    (1, 'Ground Floor - Beam Construction', 'Material', 'Unit', FALSE, 250000.00),
    (3, 'Ground Floor - Electrical Conduits', 'Material', 'Unit', FALSE, 75000.00),
    (3, 'Ground Floor - Switch Boards', 'Material', 'Selection', TRUE, 25000.00),
    (3, 'Ground Floor - Wiring', 'Material', 'Unit', FALSE, 45000.00),
    (5, 'Ground Floor - Water Supply Lines', 'Material', 'Unit', FALSE, 45000.00),
    (5, 'Ground Floor - Drainage System', 'Material', 'Unit', FALSE, 35000.00),
    (7, 'Ground Floor - Living Room Flooring', 'Material', 'Selection', TRUE, 120000.00),
    (7, 'Ground Floor - Kitchen Flooring', 'Material', 'Selection', TRUE, 80000.00),
    (10, 'Interior Walls - Primer and Paint', 'Material', 'Selection', TRUE, 95000.00)
ON CONFLICT DO NOTHING;

-- Insert sample phases
INSERT INTO project_phases (project_id, phase_name, phase_description, phase_order, unit_ids, status)
VALUES 
    (1, 'Foundation & Structure', 'Foundation work and basic structural elements', 1, ARRAY[1,2,3], 'Planned'),
    (1, 'MEP Rough-in', 'Mechanical, Electrical, and Plumbing rough installation', 2, ARRAY[4,5,6,7,8], 'Planned'),
    (1, 'Finishing Work', 'Flooring, painting, and final touches', 3, ARRAY[9,10,11], 'Planned')
ON CONFLICT DO NOTHING;

-- Insert sample client selections
INSERT INTO client_selections (
    project_id, unit_id, selection_category, selection_description, 
    available_options, base_cost, status
)
VALUES 
    (1, 5, 'Electrical', 'Switch Board Brand Selection', 
     '[{"brand": "Legrand", "price": 25000}, {"brand": "Schneider", "price": 28000}, {"brand": "Havells", "price": 23000}]'::jsonb,
     25000.00, 'Pending'),
    (1, 9, 'Flooring', 'Living Room Flooring Type',
     '[{"type": "Marble", "price": 120000}, {"type": "Vitrified Tiles", "price": 80000}, {"type": "Wooden", "price": 150000}]'::jsonb,
     100000.00, 'Pending'),
    (1, 10, 'Flooring', 'Kitchen Flooring Type',
     '[{"type": "Ceramic Tiles", "price": 60000}, {"type": "Vitrified Tiles", "price": 80000}, {"type": "Stone", "price": 100000}]'::jsonb,
     70000.00, 'Pending'),
    (1, 11, 'Painting', 'Interior Paint Color Scheme',
     '[{"scheme": "Neutral Whites", "price": 95000}, {"scheme": "Warm Pastels", "price": 98000}, {"scheme": "Bold Colors", "price": 105000}]'::jsonb,
     95000.00, 'Pending')
ON CONFLICT DO NOTHING;

-- 12. CREATE FUNCTIONS FOR WORKFLOW AUTOMATION

-- Function to move units through workflow stages
CREATE OR REPLACE FUNCTION advance_unit_status(p_unit_id INT, p_new_status VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(50);
    allowed_transitions VARCHAR(50)[];
BEGIN
    -- Get current status
    SELECT status INTO current_status FROM project_units WHERE unit_id = p_unit_id;
    
    -- Define allowed status transitions
    allowed_transitions := CASE current_status
        WHEN 'Requirement' THEN ARRAY['Component']
        WHEN 'Component' THEN ARRAY['Unit']
        WHEN 'Unit' THEN ARRAY['Phase', 'Selection']
        WHEN 'Selection' THEN ARRAY['Block'] -- After client selection
        WHEN 'Phase' THEN ARRAY['Block'] -- Direct path if no selection needed
        WHEN 'Block' THEN ARRAY['Sequencing']
        WHEN 'Sequencing' THEN ARRAY['Module']
        WHEN 'Module' THEN ARRAY['Work_Package']
        WHEN 'Work_Package' THEN ARRAY['Completed']
        ELSE ARRAY[]::VARCHAR(50)[]
    END;
    
    -- Check if transition is allowed
    IF p_new_status = ANY(allowed_transitions) THEN
        UPDATE project_units 
        SET status = p_new_status, updated_at = CURRENT_TIMESTAMP
        WHERE unit_id = p_unit_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check unit dependencies before advancing status
CREATE OR REPLACE FUNCTION check_unit_dependencies(p_unit_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    dependency_id INT;
    dependency_status VARCHAR(50);
    all_dependencies_met BOOLEAN := TRUE;
BEGIN
    -- Check each dependency
    FOR dependency_id IN 
        SELECT unnest(depends_on_units) FROM project_units WHERE unit_id = p_unit_id
    LOOP
        SELECT status INTO dependency_status 
        FROM project_units 
        WHERE unit_id = dependency_id;
        
        -- If any dependency is not completed, return false
        IF dependency_status NOT IN ('Completed', 'Work_Package') THEN
            all_dependencies_met := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN all_dependencies_met;
END;
$$ LANGUAGE plpgsql;

-- 13. CREATE VIEWS for easy querying

-- View for project workflow overview
CREATE OR REPLACE VIEW project_workflow_overview AS
SELECT 
    p.project_id,
    p.project_name,
    COUNT(pu.unit_id) as total_units,
    COUNT(CASE WHEN pu.status = 'Completed' THEN 1 END) as completed_units,
    COUNT(CASE WHEN pu.status = 'Work_Package' THEN 1 END) as in_progress_units,
    COUNT(CASE WHEN pu.status = 'Selection' THEN 1 END) as pending_selection_units,
    ROUND(
        (COUNT(CASE WHEN pu.status = 'Completed' THEN 1 END)::DECIMAL / COUNT(pu.unit_id)) * 100, 
        2
    ) as completion_percentage
FROM projects p
LEFT JOIN project_components pc ON p.project_id = pc.project_id
LEFT JOIN project_units pu ON pc.component_id = pu.component_id
GROUP BY p.project_id, p.project_name;

-- View for client selections pending
CREATE OR REPLACE VIEW pending_client_selections AS
SELECT 
    cs.selection_id,
    p.project_name,
    cs.selection_category,
    cs.selection_description,
    cs.selection_deadline,
    cs.base_cost,
    CASE 
        WHEN cs.selection_deadline < CURRENT_DATE THEN 'Overdue'
        WHEN cs.selection_deadline <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due Soon'
        ELSE 'On Track'
    END as urgency_status
FROM client_selections cs
JOIN projects p ON cs.project_id = p.project_id
WHERE cs.status = 'Pending'
ORDER BY cs.selection_deadline ASC;

-- View for work package readiness
CREATE OR REPLACE VIEW work_package_readiness AS
SELECT 
    wp.work_package_id,
    wp.work_package_name,
    p.project_name,
    wp.status,
    wp.materials_ordered,
    wp.materials_delivered,
    wp.scheduled_start_date,
    CASE 
        WHEN wp.materials_delivered AND wp.status = 'Ready_to_Start' THEN 'Ready'
        WHEN wp.materials_ordered AND NOT wp.materials_delivered THEN 'Waiting for Materials'
        WHEN NOT wp.materials_ordered THEN 'Materials Not Ordered'
        ELSE 'Not Ready'
    END as readiness_status
FROM work_packages wp
JOIN projects p ON wp.project_id = p.project_id
WHERE wp.status IN ('Scheduled', 'Materials_Ordered', 'Ready_to_Start');

COMMENT ON TABLE project_components IS 'Components are logical groupings of work by category and floor (e.g., Ground Floor Electrical)';
COMMENT ON TABLE project_units IS 'Units are the smallest work packages that can be tracked through the workflow';
COMMENT ON TABLE costing_boq IS 'Consolidated costing table that aggregates all BOQ items for financial tracking';
COMMENT ON TABLE client_selections IS 'Tracks client choices for materials, finishes, and other customizable elements';
COMMENT ON TABLE work_packages IS 'Final executable work packages ready for on-site implementation';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database comprehensive fixes applied successfully!';
    RAISE NOTICE 'Created workflow management tables: project_components, project_units, costing_boq';
    RAISE NOTICE 'Created scheduling tables: project_phases, work_packages';
    RAISE NOTICE 'Created client interaction tables: client_selections';
    RAISE NOTICE 'Created helper functions: advance_unit_status, check_unit_dependencies';
    RAISE NOTICE 'Created overview views: project_workflow_overview, pending_client_selections, work_package_readiness';
END $$;
