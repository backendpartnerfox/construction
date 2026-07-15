-- =============================================
-- CLIENT SELECTIONS TABLE STRUCTURE
-- =============================================
-- This table tracks the selection timeline for items requiring client choices

CREATE TABLE IF NOT EXISTS client_selections (
    selection_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    project_id INT NOT NULL,
    requirement_id INT,
    
    -- Selection identification
    selection_category VARCHAR(100) NOT NULL, -- Flooring, Paint, Doors, Windows, etc.
    item_id INT, -- Reference to items table
    selection_title VARCHAR(255),
    selection_description TEXT,
    
    -- Timeline
    selection_required_by DATE,
    selection_reminder_date DATE,
    selection_made_date DATE,
    selection_approved_date DATE,
    
    -- Status tracking
    status VARCHAR(50) CHECK (status IN ('Pending', 'In_Progress', 'Selected', 'Approved', 'Changed', 'Finalized')) DEFAULT 'Pending',
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    
    -- Selection details
    selected_option VARCHAR(255),
    selected_brand VARCHAR(100),
    selected_model VARCHAR(100),
    selected_color VARCHAR(100),
    selected_finish VARCHAR(100),
    quantity_required DECIMAL(12,2),
    unit VARCHAR(20),
    
    -- Pricing impact
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    cost_variance DECIMAL(12,2) GENERATED ALWAYS AS (actual_cost - estimated_cost) STORED,
    
    -- Dependencies
    depends_on_selection_id INT, -- Reference to another selection that must be completed first
    dependent_selections TEXT[], -- Array of selection_ids that depend on this
    blocking_reason TEXT,
    
    -- Client interaction
    client_viewed BOOLEAN DEFAULT FALSE,
    client_viewed_date TIMESTAMP WITH TIME ZONE,
    samples_requested BOOLEAN DEFAULT FALSE,
    samples_provided BOOLEAN DEFAULT FALSE,
    client_feedback TEXT,
    
    -- Approval
    requires_approval BOOLEAN DEFAULT TRUE,
    approved_by INT,
    approval_notes TEXT,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    vendor_notes TEXT,
    
    -- File attachments
    reference_images_path VARCHAR(255),
    selection_document_path VARCHAR(255),
    sample_images_path VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    
    -- Foreign keys
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (requirement_id) REFERENCES client_requirements(client_requirement_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id),
    FOREIGN KEY (depends_on_selection_id) REFERENCES client_selections(selection_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
    FOREIGN KEY (created_by) REFERENCES employees(employee_id),
    FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_selections_client ON client_selections(client_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_project ON client_selections(project_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_requirement ON client_selections(requirement_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_status ON client_selections(status);
CREATE INDEX IF NOT EXISTS idx_client_selections_priority ON client_selections(priority);
CREATE INDEX IF NOT EXISTS idx_client_selections_category ON client_selections(selection_category);
CREATE INDEX IF NOT EXISTS idx_client_selections_required_by ON client_selections(selection_required_by);

-- =============================================
-- SAMPLE DATA FOR CLIENT SELECTIONS
-- =============================================

-- Insert sample client selections (assuming client_id=1, project_id=1 exist)
INSERT INTO client_selections (
    client_id, project_id, requirement_id, selection_category, item_id,
    selection_title, selection_description, selection_required_by,
    status, priority, quantity_required, unit, estimated_cost,
    requires_approval, created_by
) VALUES
-- High priority selections
(1, 1, 1, 'Flooring', 7, 'Living Room Flooring', 
 'Select flooring type, color, and finish for living room', 
 CURRENT_DATE + INTERVAL '15 days', 'Pending', 'High', 450, 'sqft', 135000, TRUE, 1),

(1, 1, 1, 'Paint', 6, 'Exterior Paint Color', 
 'Select exterior paint color scheme', 
 CURRENT_DATE + INTERVAL '20 days', 'Pending', 'High', 3000, 'sqft', 90000, TRUE, 1),

(1, 1, 1, 'Doors', 4, 'Main Entrance Door', 
 'Select main entrance door design, material, and finish', 
 CURRENT_DATE + INTERVAL '25 days', 'Pending', 'Critical', 1, 'pcs', 85000, TRUE, 1),

-- Medium priority selections
(1, 1, 1, 'Windows', 8, 'Bedroom Windows', 
 'Select window type and glass for all bedrooms', 
 CURRENT_DATE + INTERVAL '30 days', 'Pending', 'Medium', 12, 'pcs', 180000, TRUE, 1),

(1, 1, 1, 'Flooring', 7, 'Kitchen Flooring', 
 'Select flooring for kitchen area', 
 CURRENT_DATE + INTERVAL '35 days', 'Pending', 'Medium', 200, 'sqft', 60000, TRUE, 1),

(1, 1, 1, 'Paint', 6, 'Interior Wall Colors', 
 'Select interior wall paint colors for all rooms', 
 CURRENT_DATE + INTERVAL '40 days', 'Pending', 'Medium', 2500, 'sqft', 75000, TRUE, 1),

-- Low priority selections
(1, 1, 1, 'Electrical', 9, 'Light Fixtures', 
 'Select light fixtures for entire house', 
 CURRENT_DATE + INTERVAL '50 days', 'Pending', 'Low', 25, 'pcs', 125000, TRUE, 1),

(1, 1, 1, 'Plumbing', 10, 'Bathroom Fittings', 
 'Select faucets, showerheads, and bathroom accessories', 
 CURRENT_DATE + INTERVAL '55 days', 'Pending', 'Low', 4, 'sets', 160000, TRUE, 1);

-- =============================================
-- VIEWS FOR CLIENT SELECTIONS
-- =============================================

-- View for pending selections
CREATE OR REPLACE VIEW client_selections_pending AS
SELECT 
    cs.*,
    c.client_name,
    p.project_name,
    i.item_name,
    e.first_name || ' ' || e.last_name as created_by_name,
    CURRENT_DATE - cs.selection_required_by as days_overdue
FROM client_selections cs
LEFT JOIN clients c ON cs.client_id = c.client_id
LEFT JOIN projects p ON cs.project_id = p.project_id
LEFT JOIN items i ON cs.item_id = i.item_id
LEFT JOIN employees e ON cs.created_by = e.employee_id
WHERE cs.status IN ('Pending', 'In_Progress')
ORDER BY cs.priority DESC, cs.selection_required_by ASC;

-- View for overdue selections
CREATE OR REPLACE VIEW client_selections_overdue AS
SELECT 
    cs.*,
    c.client_name,
    p.project_name,
    CURRENT_DATE - cs.selection_required_by as days_overdue
FROM client_selections cs
LEFT JOIN clients c ON cs.client_id = c.client_id
LEFT JOIN projects p ON cs.project_id = p.project_id
WHERE cs.status IN ('Pending', 'In_Progress')
  AND cs.selection_required_by < CURRENT_DATE
ORDER BY cs.selection_required_by ASC;

-- View for selection summary by client
CREATE OR REPLACE VIEW client_selections_summary AS
SELECT 
    cs.client_id,
    c.client_name,
    COUNT(*) as total_selections,
    COUNT(CASE WHEN cs.status = 'Pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN cs.status = 'In_Progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN cs.status = 'Selected' THEN 1 END) as selected_count,
    COUNT(CASE WHEN cs.status = 'Approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN cs.status = 'Finalized' THEN 1 END) as finalized_count,
    COUNT(CASE WHEN cs.selection_required_by < CURRENT_DATE AND cs.status IN ('Pending', 'In_Progress') THEN 1 END) as overdue_count,
    SUM(cs.estimated_cost) as total_estimated_cost,
    SUM(cs.actual_cost) as total_actual_cost
FROM client_selections cs
LEFT JOIN clients c ON cs.client_id = c.client_id
GROUP BY cs.client_id, c.client_name;

-- =============================================
-- FUNCTIONS FOR CLIENT SELECTIONS
-- =============================================

-- Function to check selection dependencies
CREATE OR REPLACE FUNCTION check_selection_dependencies(p_selection_id INT)
RETURNS TABLE (
    can_proceed BOOLEAN,
    blocking_selections TEXT[]
) AS $$
DECLARE
    v_depends_on INT;
    v_blocking_selections TEXT[] := ARRAY[]::TEXT[];
    v_dependency_status VARCHAR(50);
BEGIN
    -- Get the dependency
    SELECT depends_on_selection_id INTO v_depends_on
    FROM client_selections
    WHERE selection_id = p_selection_id;
    
    -- If no dependency, can proceed
    IF v_depends_on IS NULL THEN
        RETURN QUERY SELECT TRUE, v_blocking_selections;
        RETURN;
    END IF;
    
    -- Check if dependency is finalized
    SELECT status INTO v_dependency_status
    FROM client_selections
    WHERE selection_id = v_depends_on;
    
    IF v_dependency_status IN ('Approved', 'Finalized') THEN
        RETURN QUERY SELECT TRUE, v_blocking_selections;
    ELSE
        v_blocking_selections := ARRAY[
            'Selection #' || v_depends_on || ' must be completed first (Status: ' || v_dependency_status || ')'
        ];
        RETURN QUERY SELECT FALSE, v_blocking_selections;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update selection status
CREATE OR REPLACE FUNCTION update_selection_status(
    p_selection_id INT,
    p_new_status VARCHAR(50),
    p_updated_by INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_can_proceed BOOLEAN;
BEGIN
    -- Check dependencies if moving to 'In_Progress' or 'Selected'
    IF p_new_status IN ('In_Progress', 'Selected') THEN
        SELECT can_proceed INTO v_can_proceed
        FROM check_selection_dependencies(p_selection_id);
        
        IF NOT v_can_proceed THEN
            RAISE EXCEPTION 'Cannot update status: dependencies not met';
        END IF;
    END IF;
    
    -- Update the status
    UPDATE client_selections
    SET 
        status = p_new_status,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = p_updated_by,
        selection_made_date = CASE WHEN p_new_status = 'Selected' THEN CURRENT_DATE ELSE selection_made_date END,
        selection_approved_date = CASE WHEN p_new_status = 'Approved' THEN CURRENT_DATE ELSE selection_approved_date END
    WHERE selection_id = p_selection_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR CLIENT SELECTIONS
-- =============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_selections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_selections_timestamp
BEFORE UPDATE ON client_selections
FOR EACH ROW
EXECUTE FUNCTION update_client_selections_timestamp();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE client_selections IS 'Tracks client material and finish selections with timeline and dependencies';
COMMENT ON COLUMN client_selections.selection_category IS 'Category of selection (Flooring, Paint, Doors, Windows, etc.)';
COMMENT ON COLUMN client_selections.status IS 'Current status of the selection process';
COMMENT ON COLUMN client_selections.priority IS 'Priority level for the selection';
COMMENT ON COLUMN client_selections.depends_on_selection_id IS 'ID of selection that must be completed first';
COMMENT ON COLUMN client_selections.cost_variance IS 'Automatically calculated difference between actual and estimated cost';
