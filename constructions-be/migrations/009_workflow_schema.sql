-- Project Workflow Module - Database Schema

-- ============================================
-- 1. PROJECT UNITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_units (
    unit_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Unit Details
    unit_number VARCHAR(50) NOT NULL,
    unit_name VARCHAR(100),
    unit_type VARCHAR(50) NOT NULL, -- Flat, Shop, Parking, Office, Villa, etc.
    block_id INTEGER, -- Will reference project_blocks
    floor_number INTEGER,
    
    -- Specifications
    carpet_area DECIMAL(10, 2),
    built_up_area DECIMAL(10, 2),
    super_built_up_area DECIMAL(10, 2),
    balcony_area DECIMAL(10, 2),
    
    -- Configuration
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    facing VARCHAR(50), -- North, South, East, West, etc.
    
    -- Pricing
    base_price DECIMAL(15, 2),
    final_price DECIMAL(15, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'Available',
    -- Status: Available, Booked, Sold, Reserved, Blocked
    
    -- Assignment
    client_name VARCHAR(100),
    client_contact VARCHAR(20),
    booking_date DATE,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_unit_status CHECK (status IN (
        'Available', 'Booked', 'Sold', 'Reserved', 'Blocked'
    )),
    UNIQUE(project_id, unit_number)
);

-- ============================================
-- 2. PROJECT PHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_phases (
    phase_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Phase Details
    phase_name VARCHAR(100) NOT NULL,
    phase_code VARCHAR(20),
    phase_order INTEGER NOT NULL, -- Sequence: 1, 2, 3...
    description TEXT,
    
    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    duration_days INTEGER,
    
    -- Progress
    status VARCHAR(20) DEFAULT 'Not Started',
    -- Status: Not Started, In Progress, On Hold, Completed, Delayed
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Dependencies
    depends_on_phase_id INTEGER REFERENCES project_phases(phase_id),
    
    -- Budget
    estimated_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_phase_status CHECK (status IN (
        'Not Started', 'In Progress', 'On Hold', 'Completed', 'Delayed'
    )),
    UNIQUE(project_id, phase_code)
);

-- ============================================
-- 3. PROJECT BLOCKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_blocks (
    block_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Block Details
    block_name VARCHAR(100) NOT NULL,
    block_code VARCHAR(20),
    description TEXT,
    
    -- Specifications
    total_floors INTEGER,
    units_per_floor INTEGER,
    total_units INTEGER,
    
    -- Timeline
    construction_start_date DATE,
    construction_end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Planned',
    -- Status: Planned, Under Construction, Completed
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_block_status CHECK (status IN (
        'Planned', 'Under Construction', 'Completed'
    )),
    UNIQUE(project_id, block_code)
);

-- Add foreign key to project_units for block_id
ALTER TABLE project_units
ADD CONSTRAINT fk_unit_block 
FOREIGN KEY (block_id) REFERENCES project_blocks(block_id);

-- ============================================
-- 4. PROJECT SELECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_selections (
    selection_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES project_units(unit_id) ON DELETE CASCADE,
    
    -- Selection Details
    category VARCHAR(50) NOT NULL, -- Flooring, Kitchen, Bathroom, Electrical, etc.
    item_name VARCHAR(100) NOT NULL,
    specification TEXT,
    
    -- Choice Details
    choice_option_id INTEGER REFERENCES item_choices(choice_option_id),
    brand VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(50),
    finish VARCHAR(50),
    
    -- Quantity & Pricing
    quantity DECIMAL(10, 2),
    unit VARCHAR(20),
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'Pending',
    -- Status: Pending, Approved, Ordered, Delivered, Installed
    
    -- Client Approval
    approved_by_client BOOLEAN DEFAULT FALSE,
    client_approval_date DATE,
    client_notes TEXT,
    
    -- Metadata
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_selection_status CHECK (status IN (
        'Pending', 'Approved', 'Ordered', 'Delivered', 'Installed'
    ))
);

-- ============================================
-- 5. PROJECT SEQUENCING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_sequencing (
    sequence_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    phase_id INTEGER REFERENCES project_phases(phase_id),
    
    -- Task Details
    task_name VARCHAR(200) NOT NULL,
    task_code VARCHAR(50),
    task_order INTEGER NOT NULL,
    description TEXT,
    
    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    duration_days INTEGER,
    
    -- Dependencies
    depends_on_sequence_id INTEGER REFERENCES project_sequencing(sequence_id),
    dependency_type VARCHAR(20) DEFAULT 'FS',
    -- FS: Finish-to-Start, SS: Start-to-Start, FF: Finish-to-Finish, SF: Start-to-Finish
    
    -- Assignment
    assigned_to VARCHAR(100),
    contractor_id INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Not Started',
    -- Status: Not Started, In Progress, Completed, Delayed, Blocked
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Resources
    labor_required INTEGER,
    equipment_required TEXT,
    
    -- Metadata
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE, -- Critical path task
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_sequence_status CHECK (status IN (
        'Not Started', 'In Progress', 'Completed', 'Delayed', 'Blocked'
    )),
    CONSTRAINT check_dependency_type CHECK (dependency_type IN (
        'FS', 'SS', 'FF', 'SF'
    ))
);

-- ============================================
-- 6. PROJECT MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_modules (
    module_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Module Details
    module_name VARCHAR(100) NOT NULL,
    module_code VARCHAR(50),
    module_type VARCHAR(50), -- Structural, MEP, Finishing, etc.
    description TEXT,
    
    -- Specifications
    module_template TEXT, -- JSON data for reusable module template
    
    -- Components
    components_list TEXT, -- JSON array of component IDs
    
    -- Status
    status VARCHAR(20) DEFAULT 'Draft',
    -- Status: Draft, Active, Completed, Archived
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_module_status CHECK (status IN (
        'Draft', 'Active', 'Completed', 'Archived'
    )),
    UNIQUE(project_id, module_code)
);

-- ============================================
-- 7. PROJECT WORK PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_work_packages (
    work_package_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    phase_id INTEGER REFERENCES project_phases(phase_id),
    
    -- Work Package Details
    package_name VARCHAR(200) NOT NULL,
    package_code VARCHAR(50),
    description TEXT,
    
    -- Scope
    scope_of_work TEXT,
    deliverables TEXT,
    
    -- Assignment
    contractor_name VARCHAR(100),
    vendor_id INTEGER REFERENCES vendors(vendor_id),
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    duration_days INTEGER,
    
    -- Budget
    estimated_cost DECIMAL(15, 2),
    contract_amount DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'Planned',
    -- Status: Planned, Assigned, In Progress, Completed, On Hold, Cancelled
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Payment
    payment_terms TEXT,
    advance_percentage DECIMAL(5, 2),
    advance_paid BOOLEAN DEFAULT FALSE,
    
    -- Documents
    contract_document_path TEXT,
    drawings_path TEXT,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_work_package_status CHECK (status IN (
        'Planned', 'Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'
    )),
    UNIQUE(project_id, package_code)
);

-- ============================================
-- 8. WORKFLOW STATUS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_workflow_status (
    workflow_status_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    
    -- Workflow Stage Status
    components_status VARCHAR(20) DEFAULT 'active',
    units_status VARCHAR(20) DEFAULT 'pending',
    phases_status VARCHAR(20) DEFAULT 'pending',
    blocks_status VARCHAR(20) DEFAULT 'pending',
    selections_status VARCHAR(20) DEFAULT 'pending',
    sequencing_status VARCHAR(20) DEFAULT 'pending',
    modules_status VARCHAR(20) DEFAULT 'pending',
    work_packages_status VARCHAR(20) DEFAULT 'pending',
    
    -- Progress Tracking
    components_progress DECIMAL(5, 2) DEFAULT 0,
    units_progress DECIMAL(5, 2) DEFAULT 0,
    phases_progress DECIMAL(5, 2) DEFAULT 0,
    blocks_progress DECIMAL(5, 2) DEFAULT 0,
    selections_progress DECIMAL(5, 2) DEFAULT 0,
    sequencing_progress DECIMAL(5, 2) DEFAULT 0,
    modules_progress DECIMAL(5, 2) DEFAULT 0,
    work_packages_progress DECIMAL(5, 2) DEFAULT 0,
    
    -- Completion Dates
    components_completed_at TIMESTAMP,
    units_completed_at TIMESTAMP,
    phases_completed_at TIMESTAMP,
    blocks_completed_at TIMESTAMP,
    selections_completed_at TIMESTAMP,
    sequencing_completed_at TIMESTAMP,
    modules_completed_at TIMESTAMP,
    work_packages_completed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_units_project ON project_units(project_id);
CREATE INDEX idx_units_block ON project_units(block_id);
CREATE INDEX idx_units_status ON project_units(status);

CREATE INDEX idx_phases_project ON project_phases(project_id);
CREATE INDEX idx_phases_order ON project_phases(phase_order);
CREATE INDEX idx_phases_status ON project_phases(status);

CREATE INDEX idx_blocks_project ON project_blocks(project_id);
CREATE INDEX idx_blocks_status ON project_blocks(status);

CREATE INDEX idx_selections_project ON project_selections(project_id);
CREATE INDEX idx_selections_unit ON project_selections(unit_id);
CREATE INDEX idx_selections_status ON project_selections(status);

CREATE INDEX idx_sequencing_project ON project_sequencing(project_id);
CREATE INDEX idx_sequencing_phase ON project_sequencing(phase_id);
CREATE INDEX idx_sequencing_order ON project_sequencing(task_order);

CREATE INDEX idx_modules_project ON project_modules(project_id);
CREATE INDEX idx_modules_status ON project_modules(status);

CREATE INDEX idx_work_packages_project ON project_work_packages(project_id);
CREATE INDEX idx_work_packages_phase ON project_work_packages(phase_id);
CREATE INDEX idx_work_packages_status ON project_work_packages(status);

-- ============================================
-- TRIGGERS TO AUTO-CREATE WORKFLOW STATUS
-- ============================================
CREATE OR REPLACE FUNCTION create_workflow_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_workflow_status (project_id)
    VALUES (NEW.project_id)
    ON CONFLICT (project_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_workflow_status
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION create_workflow_status();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE project_units IS 'Manages project units (flats, shops, parking spaces)';
COMMENT ON TABLE project_phases IS 'Defines project execution phases';
COMMENT ON TABLE project_blocks IS 'Manages building blocks within projects';
COMMENT ON TABLE project_selections IS 'Tracks client material/finish selections';
COMMENT ON TABLE project_sequencing IS 'Defines task sequence and dependencies';
COMMENT ON TABLE project_modules IS 'Reusable work modules/templates';
COMMENT ON TABLE project_work_packages IS 'Groups tasks into assignable work packages';
COMMENT ON TABLE project_workflow_status IS 'Tracks overall workflow progress';
