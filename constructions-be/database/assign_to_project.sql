-- =============================================
-- PROJECT ASSIGNMENTS TABLE
-- =============================================
-- This table manages team member assignments to projects
-- Tracks who is assigned to which project, when, and by whom

CREATE TABLE IF NOT EXISTS assign_to_project (
    assignment_id SERIAL PRIMARY KEY,
    
    -- Project reference
    project_id INT NOT NULL,
    
    -- Assignment details
    assigned_employee_id INT NOT NULL,        -- Who is being assigned
    role_in_project VARCHAR(100),             -- Role: Project Manager, Architect, Engineer, Supervisor, etc.
    assignment_type VARCHAR(50),              -- Full-time, Part-time, Consultant, Temporary
    
    -- Assignment metadata
    assigned_by INT NOT NULL,                 -- Who assigned this person
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assignment_start_date DATE,               -- When assignment becomes active
    assignment_end_date DATE,                 -- When assignment ends (if applicable)
    
    -- Status
    assignment_status VARCHAR(50) DEFAULT 'Active' CHECK (assignment_status IN ('Active', 'Completed', 'Cancelled', 'On Hold')),
    is_primary BOOLEAN DEFAULT FALSE,         -- Is this the primary person for this role?
    
    -- Work details
    estimated_hours_per_week DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    fixed_assignment_cost DECIMAL(12,2),
    
    -- Responsibilities
    responsibilities TEXT,
    deliverables TEXT,
    
    -- Performance tracking
    performance_notes TEXT,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Notes and remarks
    assignment_notes TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (assignment_end_date IS NULL OR assignment_end_date >= assignment_start_date),
    CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assign_project_id ON assign_to_project(project_id);
CREATE INDEX IF NOT EXISTS idx_assign_employee_id ON assign_to_project(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_assign_assigned_by ON assign_to_project(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assign_status ON assign_to_project(assignment_status);
CREATE INDEX IF NOT EXISTS idx_assign_role ON assign_to_project(role_in_project);
CREATE INDEX IF NOT EXISTS idx_assign_dates ON assign_to_project(assignment_start_date, assignment_end_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assign_to_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assign_to_project_timestamp
    BEFORE UPDATE ON assign_to_project
    FOR EACH ROW
    EXECUTE FUNCTION update_assign_to_project_timestamp();

-- =============================================
-- SAMPLE DATA FOR ASSIGN_TO_PROJECT
-- =============================================

-- Assign project managers to projects
INSERT INTO assign_to_project (
    project_id, assigned_employee_id, role_in_project, assignment_type,
    assigned_by, assignment_start_date, assignment_status, is_primary,
    estimated_hours_per_week, responsibilities
) VALUES
-- Project 1: Green Valley Residences
(1, 1, 'Project Manager', 'Full-time', 1, '2024-05-15', 'Active', TRUE, 40.00, 
 'Overall project coordination, client communication, budget management, timeline tracking'),

(1, 3, 'Architect', 'Full-time', 1, '2024-05-15', 'Active', TRUE, 40.00,
 'Architectural design, drawings preparation, site coordination, design approvals'),

(1, 2, 'Site Engineer', 'Full-time', 1, '2024-06-01', 'Active', FALSE, 40.00,
 'Daily site supervision, quality control, material management, labor coordination'),

-- Project 2: Tech Park Phase II  
(2, 1, 'Project Manager', 'Full-time', 1, '2024-07-01', 'Active', TRUE, 40.00,
 'Project planning, stakeholder management, progress monitoring, risk management'),

(2, 3, 'Architect', 'Full-time', 1, '2024-07-01', 'Active', TRUE, 40.00,
 'Commercial design, space planning, MEP coordination, compliance management'),

-- Project 3: Serenity Villa
(3, 2, 'Project Manager', 'Full-time', 1, '2024-04-10', 'Active', TRUE, 40.00,
 'Villa construction management, luxury finishes coordination, client liaison'),

(3, 3, 'Architect', 'Part-time', 1, '2024-04-10', 'Active', TRUE, 20.00,
 'Luxury villa design, interior coordination, landscape design'),

-- Project 4: Metro Mall & Entertainment Hub
(4, 1, 'Project Manager', 'Full-time', 1, '2024-09-01', 'Active', TRUE, 40.00,
 'Large-scale project management, multi-vendor coordination, budget oversight'),

(4, 3, 'Lead Architect', 'Full-time', 1, '2024-09-01', 'Active', TRUE, 40.00,
 'Master planning, retail design, entertainment zone design, approval management'),

-- Project 5: Riverside Township
(5, 2, 'Project Manager', 'Full-time', 1, '2024-11-15', 'Active', TRUE, 40.00,
 'Township development management, infrastructure coordination, multi-phase planning'),

(5, 3, 'Chief Architect', 'Full-time', 1, '2024-11-15', 'Active', TRUE, 40.00,
 'Master planning, residential design, commercial planning, landscape architecture');

-- =============================================
-- USEFUL VIEWS FOR PROJECT ASSIGNMENTS
-- =============================================

-- View: Current project assignments with employee and project details
CREATE OR REPLACE VIEW v_current_project_assignments AS
SELECT 
    ap.assignment_id,
    ap.project_id,
    p.project_name,
    p.project_code,
    p.status as project_status,
    ap.assigned_employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.designation as employee_designation,
    e.department as employee_department,
    ap.role_in_project,
    ap.assignment_type,
    ap.assignment_status,
    ap.is_primary,
    ap.assigned_date,
    ap.assignment_start_date,
    ap.assignment_end_date,
    ap.estimated_hours_per_week,
    ab.first_name || ' ' || ab.last_name as assigned_by_name,
    ap.responsibilities,
    ap.completion_percentage
FROM assign_to_project ap
LEFT JOIN projects p ON ap.project_id = p.project_id
LEFT JOIN employees e ON ap.assigned_employee_id = e.employee_id
LEFT JOIN employees ab ON ap.assigned_by = ab.employee_id
WHERE ap.assignment_status = 'Active'
ORDER BY p.project_name, ap.is_primary DESC, ap.role_in_project;

-- View: Employee workload summary
CREATE OR REPLACE VIEW v_employee_workload AS
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.designation,
    COUNT(ap.assignment_id) as active_projects,
    SUM(ap.estimated_hours_per_week) as total_hours_per_week,
    STRING_AGG(p.project_name, ', ' ORDER BY ap.is_primary DESC) as assigned_projects
FROM employees e
LEFT JOIN assign_to_project ap ON e.employee_id = ap.assigned_employee_id 
    AND ap.assignment_status = 'Active'
LEFT JOIN projects p ON ap.project_id = p.project_id
GROUP BY e.employee_id, e.first_name, e.last_name, e.designation
ORDER BY active_projects DESC, total_hours_per_week DESC;

-- View: Project team roster
CREATE OR REPLACE VIEW v_project_team_roster AS
SELECT 
    p.project_id,
    p.project_name,
    p.project_code,
    p.status as project_status,
    COUNT(ap.assignment_id) as team_size,
    STRING_AGG(
        DISTINCT CASE WHEN ap.is_primary = TRUE 
        THEN e.first_name || ' ' || e.last_name || ' (' || ap.role_in_project || ')' 
        END, ', '
    ) as primary_team,
    STRING_AGG(
        DISTINCT CASE WHEN ap.is_primary = FALSE 
        THEN e.first_name || ' ' || e.last_name || ' (' || ap.role_in_project || ')' 
        END, ', '
    ) as support_team
FROM projects p
LEFT JOIN assign_to_project ap ON p.project_id = ap.project_id 
    AND ap.assignment_status = 'Active'
LEFT JOIN employees e ON ap.assigned_employee_id = e.employee_id
GROUP BY p.project_id, p.project_name, p.project_code, p.status
ORDER BY p.project_name;

-- =============================================
-- COMMENTS ON TABLE AND COLUMNS
-- =============================================

COMMENT ON TABLE assign_to_project IS 'Manages team member assignments to construction projects';
COMMENT ON COLUMN assign_to_project.assignment_id IS 'Unique identifier for each assignment';
COMMENT ON COLUMN assign_to_project.project_id IS 'Reference to the project';
COMMENT ON COLUMN assign_to_project.assigned_employee_id IS 'Employee being assigned to the project';
COMMENT ON COLUMN assign_to_project.role_in_project IS 'Role of employee in this project (e.g., Project Manager, Architect)';
COMMENT ON COLUMN assign_to_project.assigned_by IS 'Employee who made this assignment';
COMMENT ON COLUMN assign_to_project.assigned_date IS 'Timestamp when assignment was created';
COMMENT ON COLUMN assign_to_project.assignment_start_date IS 'Date when assignment becomes active';
COMMENT ON COLUMN assign_to_project.assignment_end_date IS 'Date when assignment ends (if applicable)';
COMMENT ON COLUMN assign_to_project.is_primary IS 'Indicates if this is the primary person for this role';
COMMENT ON COLUMN assign_to_project.assignment_status IS 'Current status of assignment (Active, Completed, Cancelled, On Hold)';
