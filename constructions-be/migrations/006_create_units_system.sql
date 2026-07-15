-- =============================================
-- PHASE 1: UNITS SYSTEM
-- =============================================
-- This creates the foundation for breaking down project requirements
-- into manageable units that can be scheduled, costed, and tracked

-- Main Units Table
CREATE TABLE project_units (
    unit_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    requirement_id INT,                    -- Links to project_requirements (if applicable)
    component_id INT,                      -- Links to project_components (if applicable)
    
    -- Unit identification
    unit_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "GF-ELEC-PIPES-001"
    unit_name VARCHAR(255) NOT NULL,       -- e.g., "Ground Floor - Electrical Pipes"
    unit_description TEXT,
    
    -- Location/floor info
    floor_level VARCHAR(50),               -- Ground Floor, First Floor, Second Floor, etc.
    location_area VARCHAR(100),            -- Living Room, Bedroom 1, Kitchen, etc.
    room_reference VARCHAR(100),           -- Reference to room_dimensions if applicable
    
    -- Unit categorization
    category VARCHAR(100),                 -- Electrical, Plumbing, Civil, Finishing, etc.
    sub_category VARCHAR(100),             -- Pipes, Wiring, Switch boards, Flooring, etc.
    work_type VARCHAR(100),                -- Installation, Finishing, Testing, etc.
    
    -- Financial tracking
    estimated_cost DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    approved_budget DECIMAL(15,2),
    cost_variance DECIMAL(15,2) GENERATED ALWAYS AS (approved_budget - actual_cost) STORED,
    
    -- Quantity tracking
    estimated_quantity DECIMAL(15,3),
    actual_quantity DECIMAL(15,3),
    unit_of_measure VARCHAR(50),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'Planning', -- Planning, Approved, Ready, In Progress, Completed, On Hold
    priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Critical
    
    -- Dependencies
    depends_on_units INT[],                -- Array of unit_ids this unit depends on
    blocks_units INT[],                    -- Array of unit_ids this unit blocks
    can_start_after_completion BOOLEAN DEFAULT true, -- If false, can start in parallel
    
    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    planned_duration_days INT,
    actual_start_date DATE,
    actual_end_date DATE,
    actual_duration_days INT,
    
    -- Progress tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Client selections required
    requires_client_selection BOOLEAN DEFAULT false,
    selection_deadline DATE,
    selection_completed BOOLEAN DEFAULT false,
    
    -- Material requirements
    materials_required BOOLEAN DEFAULT true,
    materials_ordered BOOLEAN DEFAULT false,
    materials_received BOOLEAN DEFAULT false,
    
    -- Team assignment
    assigned_supervisor INT,
    assigned_team_lead INT,
    team_size INT,
    
    -- Quality & Safety
    quality_check_required BOOLEAN DEFAULT true,
    quality_check_status VARCHAR(50),      -- Pending, Passed, Failed, Rework
    safety_checklist_completed BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    tags VARCHAR(100)[],                   -- Array of tags for easy filtering
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    
    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_supervisor) REFERENCES employees(employee_id),
    FOREIGN KEY (assigned_team_lead) REFERENCES employees(employee_id),
    FOREIGN KEY (created_by) REFERENCES employees(employee_id),
    FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
    
    -- Unique constraint
    UNIQUE (project_id, unit_code)
);

-- Indexes for better query performance
CREATE INDEX idx_units_project ON project_units(project_id);
CREATE INDEX idx_units_status ON project_units(status);
CREATE INDEX idx_units_floor ON project_units(floor_level);
CREATE INDEX idx_units_category ON project_units(category);
CREATE INDEX idx_units_priority ON project_units(priority);
CREATE INDEX idx_units_dates ON project_units(planned_start_date, planned_end_date);
CREATE INDEX idx_units_completion ON project_units(completion_percentage);
CREATE INDEX idx_units_active ON project_units(is_active) WHERE is_active = true;

-- =============================================
-- Unit-BOQ Mapping Table
-- =============================================
-- Links units to BOQ items from various BOQ tables

CREATE TABLE unit_boq_mapping (
    mapping_id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL,
    boq_id INT NOT NULL,                   -- ID from the specific BOQ table
    boq_table_name VARCHAR(100) NOT NULL,  -- Which BOQ table: project_boq_structural, project_boq_walls, etc.
    element_id INT,                        -- Reference to the element
    item_id INT,                           -- Reference to the item
    
    -- Quantity allocation
    total_boq_quantity DECIMAL(15,3),      -- Total quantity in BOQ
    allocated_quantity DECIMAL(15,3),      -- Quantity allocated to this unit
    remaining_quantity DECIMAL(15,3) GENERATED ALWAYS AS (total_boq_quantity - allocated_quantity) STORED,
    unit_of_measure VARCHAR(50),
    allocation_percentage DECIMAL(5,2),    -- % of BOQ quantity allocated
    
    -- Cost allocation
    total_boq_cost DECIMAL(15,2),          -- Total cost in BOQ
    allocated_cost DECIMAL(15,2),          -- Cost allocated to this unit
    remaining_cost DECIMAL(15,2) GENERATED ALWAYS AS (total_boq_cost - allocated_cost) STORED,
    cost_percentage DECIMAL(5,2),          -- % of BOQ cost allocated
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_fully_allocated BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    
    -- Foreign keys
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employees(employee_id),
    FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
    
    -- Unique constraint - one BOQ item can be mapped to a unit only once
    UNIQUE (unit_id, boq_table_name, boq_id)
);

-- Indexes
CREATE INDEX idx_unit_boq_unit ON unit_boq_mapping(unit_id);
CREATE INDEX idx_unit_boq_table ON unit_boq_mapping(boq_table_name);
CREATE INDEX idx_unit_boq_item ON unit_boq_mapping(boq_id);
CREATE INDEX idx_unit_boq_active ON unit_boq_mapping(is_active) WHERE is_active = true;

-- =============================================
-- Unit Costing Table
-- =============================================
-- Links material costs to units

CREATE TABLE unit_costing (
    unit_costing_id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL,
    costing_id INT NOT NULL,               -- From project_material_costing
    
    -- Material details
    item_id INT,
    element_id INT,
    vendor_id INT,
    
    -- Allocation
    total_material_quantity DECIMAL(15,3), -- Total quantity from costing
    allocated_quantity DECIMAL(15,3),      -- Quantity allocated to this unit
    unit_of_measure VARCHAR(50),
    
    total_material_amount DECIMAL(15,2),   -- Total amount from costing
    allocated_amount DECIMAL(15,2),        -- Amount allocated to this unit
    allocation_percentage DECIMAL(5,2),    -- % of material cost allocated
    
    -- Breakdown
    allocated_subtotal DECIMAL(15,2),
    allocated_gst DECIMAL(15,2),
    
    -- Status
    is_approved BOOLEAN DEFAULT false,
    approved_by INT,
    approval_date DATE,
    approval_notes TEXT,
    
    -- Usage tracking
    quantity_consumed DECIMAL(15,3) DEFAULT 0,
    remaining_quantity DECIMAL(15,3) GENERATED ALWAYS AS (allocated_quantity - quantity_consumed) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Planned',  -- Planned, Ordered, Received, Consumed, Completed
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    
    -- Foreign keys
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (costing_id) REFERENCES project_material_costing(costing_id),
    FOREIGN KEY (created_by) REFERENCES employees(employee_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
    FOREIGN KEY (updated_by) REFERENCES employees(employee_id),
    
    -- Unique constraint
    UNIQUE (unit_id, costing_id)
);

-- Indexes
CREATE INDEX idx_unit_costing_unit ON unit_costing(unit_id);
CREATE INDEX idx_unit_costing_material ON unit_costing(costing_id);
CREATE INDEX idx_unit_costing_status ON unit_costing(status);
CREATE INDEX idx_unit_costing_approved ON unit_costing(is_approved);
CREATE INDEX idx_unit_costing_active ON unit_costing(is_active) WHERE is_active = true;

-- =============================================
-- Unit Progress Tracking
-- =============================================

CREATE TABLE unit_progress_log (
    progress_log_id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL,
    
    -- Progress details
    previous_percentage DECIMAL(5,2),
    current_percentage DECIMAL(5,2),
    progress_increment DECIMAL(5,2) GENERATED ALWAYS AS (current_percentage - previous_percentage) STORED,
    
    -- Work details
    work_description TEXT,
    work_date DATE DEFAULT CURRENT_DATE,
    hours_worked DECIMAL(8,2),
    
    -- Team
    supervisor_id INT,
    team_members_count INT,
    
    -- Status
    status_update VARCHAR(50),             -- On Track, Delayed, Ahead of Schedule
    
    -- Issues/Notes
    issues_faced TEXT,
    corrective_actions TEXT,
    photos_urls TEXT[],                    -- Array of photo URLs
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    
    -- Foreign keys
    FOREIGN KEY (unit_id) REFERENCES project_units(unit_id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES employees(employee_id),
    FOREIGN KEY (created_by) REFERENCES employees(employee_id)
);

CREATE INDEX idx_progress_unit ON unit_progress_log(unit_id);
CREATE INDEX idx_progress_date ON unit_progress_log(work_date);

-- =============================================
-- Helper Functions
-- =============================================

-- Function to calculate unit total cost
CREATE OR REPLACE FUNCTION calculate_unit_total_cost(p_unit_id INT)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_total_cost DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO v_total_cost
    FROM unit_costing
    WHERE unit_id = p_unit_id AND is_active = true;
    
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to update unit estimated cost from BOQ mappings
CREATE OR REPLACE FUNCTION update_unit_estimated_cost(p_unit_id INT)
RETURNS VOID AS $$
DECLARE
    v_total_cost DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(allocated_cost), 0)
    INTO v_total_cost
    FROM unit_boq_mapping
    WHERE unit_id = p_unit_id AND is_active = true;
    
    UPDATE project_units
    SET estimated_cost = v_total_cost,
        updated_at = CURRENT_TIMESTAMP
    WHERE unit_id = p_unit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if unit dependencies are completed
CREATE OR REPLACE FUNCTION check_unit_dependencies_completed(p_unit_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_dependency_ids INT[];
    v_all_completed BOOLEAN;
BEGIN
    -- Get the dependency array
    SELECT depends_on_units INTO v_dependency_ids
    FROM project_units
    WHERE unit_id = p_unit_id;
    
    -- If no dependencies, return true
    IF v_dependency_ids IS NULL OR array_length(v_dependency_ids, 1) IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if all dependencies are completed
    SELECT bool_and(status = 'Completed')
    INTO v_all_completed
    FROM project_units
    WHERE unit_id = ANY(v_dependency_ids);
    
    RETURN COALESCE(v_all_completed, false);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update completion percentage when progress is logged
CREATE OR REPLACE FUNCTION update_unit_completion_from_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE project_units
    SET completion_percentage = NEW.current_percentage,
        updated_at = CURRENT_TIMESTAMP
    WHERE unit_id = NEW.unit_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_completion_from_progress
AFTER INSERT ON unit_progress_log
FOR EACH ROW
EXECUTE FUNCTION update_unit_completion_from_progress();

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE project_units IS 'Core table for project work breakdown into executable units';
COMMENT ON TABLE unit_boq_mapping IS 'Links units to BOQ items from various BOQ tables';
COMMENT ON TABLE unit_costing IS 'Tracks material costs allocated to each unit';
COMMENT ON TABLE unit_progress_log IS 'Logs progress updates for units over time';
