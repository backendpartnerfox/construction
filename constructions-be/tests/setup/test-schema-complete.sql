    enquiry_requirement_id INT NOT NULL REFERENCES enquiry_requirements(enquiry_requirement_id),
    package_id INT NOT NULL REFERENCES packages(package_id),
    item_id INT NOT NULL REFERENCES items(item_id),
    item_choice_id INT NOT NULL REFERENCES item_choices(choice_option_id),
    customisation_details TEXT
);

CREATE TABLE IF NOT EXISTS client_requirement_package_item_choice_customise (
    customise_id SERIAL PRIMARY KEY,
    client_requirement_id INT NOT NULL REFERENCES client_requirements(client_requirement_id),
    package_id INT NOT NULL REFERENCES packages(package_id),
    item_id INT NOT NULL REFERENCES items(item_id),
    item_choice_id INT NOT NULL REFERENCES item_choices(choice_option_id),
    customisation_details TEXT
);

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_enquiry_id ON clients(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_architect_measurements_walls_dimension_id ON architect_walls_measurement(wall_dimension_id);
CREATE INDEX IF NOT EXISTS idx_project_boq_painting_paint_choice ON project_boq_painting(paint_choice_id);

-- Insert basic test data
INSERT INTO employees (employee_id, first_name, last_name, email, phone, designation, department, status)
VALUES 
    (1, 'Admin', 'User', 'admin@test.com', '9999999999', 'Administrator', 'Admin', 'Active'),
    (2, 'Test', 'Manager', 'manager@test.com', '8888888888', 'Project Manager', 'Projects', 'Active'),
    (3, 'Test', 'Architect', 'architect@test.com', '7777777777', 'Architect', 'Design', 'Active')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO states (state_id, state_name, state_code)
VALUES 
    (1, 'Maharashtra', 'MH'),
    (2, 'Karnataka', 'KA'),
    (3, 'Tamil Nadu', 'TN'),
    (4, 'Delhi', 'DL'),
    (5, 'Gujarat', 'GJ')
ON CONFLICT (state_id) DO NOTHING;

INSERT INTO cities (city_id, city_name, state_id)
VALUES 
    (1, 'Mumbai', 1),
    (2, 'Pune', 1),
    (3, 'Bangalore', 2),
    (4, 'Chennai', 3),
    (5, 'Delhi', 4),
    (6, 'Ahmedabad', 5)
ON CONFLICT (city_id) DO NOTHING;

INSERT INTO roles (role_id, role_name, role_description)
VALUES 
    (1, 'Admin', 'System Administrator'),
    (2, 'Manager', 'Project Manager'),
    (3, 'Employee', 'Regular Employee'),
    (4, 'Client', 'Client User')
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO permissions (permission_id, permission_name, permission_description, module)
VALUES 
    (1, 'create_project', 'Can create new projects', 'Projects'),
    (2, 'edit_project', 'Can edit projects', 'Projects'),
    (3, 'delete_project', 'Can delete projects', 'Projects'),
    (4, 'view_project', 'Can view projects', 'Projects')
ON CONFLICT (permission_id) DO NOTHING;

INSERT INTO items (item_id, item_name, item_description, item_unit, item_category)
VALUES 
    (1, 'TMT Bar', 'Thermo-Mechanically Treated reinforcement steel bars', 'kg', 'Structural'),
    (2, 'RMC', 'Ready Mix Concrete', 'cum', 'Concrete'),
    (3, 'Brick', 'Standard clay bricks for construction', 'pcs', 'Masonry'),
    (4, 'Cement', 'Portland cement for construction', 'bag', 'Binding Material'),
    (5, 'Sand', 'Fine aggregate for concrete and mortar', 'cum', 'Aggregate')
ON CONFLICT (item_id) DO NOTHING;

INSERT INTO elements (element_id, element_name, element_category, element_description)
VALUES 
    (1, 'Foundation', 'Structural', 'Base foundation structure'),
    (2, 'Column', 'Structural', 'Vertical structural element'),
    (3, 'Beam', 'Structural', 'Horizontal structural element'),
    (4, 'Slab', 'Structural', 'Horizontal surface element'),
    (5, 'Wall', 'Non-Structural', 'Vertical partition element')
ON CONFLICT (element_id) DO NOTHING;

INSERT INTO vendor_type (vendor_type_id, vendor_type)
VALUES 
    (1, 'Material Supplier'),
    (2, 'Service Provider'),
    (3, 'Contractor'),
    (4, 'Consultant')
ON CONFLICT (vendor_type_id) DO NOTHING;

INSERT INTO packages (package_id, package_name, package_description, package_type, rate_per_sqft)
VALUES 
    (1, 'Basic Package', 'Basic construction package', 'Standard', 1500.00),
    (2, 'Premium Package', 'Premium construction package', 'Premium', 2000.00),
    (3, 'Luxury Package', 'Luxury construction package', 'Luxury', 2500.00)
ON CONFLICT (package_id) DO NOTHING;

INSERT INTO phases (phase_id, phase_name, phase_description, phase_order, duration_days)
VALUES 
    (1, 'Foundation', 'Foundation work phase', 1, 30),
    (2, 'Structure', 'Structural work phase', 2, 60),
    (3, 'Finishing', 'Finishing work phase', 3, 90)
ON CONFLICT (phase_id) DO NOTHING;

INSERT INTO payment_types (payment_type_id, payment_type_name, payment_category)
VALUES 
    (1, 'Advance', 'Initial Payment'),
    (2, 'Progress Payment', 'Milestone Payment'),
    (3, 'Final Payment', 'Completion Payment')
ON CONFLICT (payment_type_id) DO NOTHING;

INSERT INTO payment_methods (payment_method_id, method_name)
VALUES 
    (1, 'Bank Transfer'),
    (2, 'Cheque'),
    (3, 'Cash'),
    (4, 'UPI')
ON CONFLICT (payment_method_id) DO NOTHING;

-- Reset sequences to ensure proper auto-increment
SELECT setval('employees_employee_id_seq', COALESCE((SELECT MAX(employee_id) FROM employees), 1), true);
SELECT setval('states_state_id_seq', COALESCE((SELECT MAX(state_id) FROM states), 1), true);
SELECT setval('cities_city_id_seq', COALESCE((SELECT MAX(city_id) FROM cities), 1), true);
SELECT setval('roles_role_id_seq', COALESCE((SELECT MAX(role_id) FROM roles), 1), true);
SELECT setval('permissions_permission_id_seq', COALESCE((SELECT MAX(permission_id) FROM permissions), 1), true);
SELECT setval('items_item_id_seq', COALESCE((SELECT MAX(item_id) FROM items), 1), true);
SELECT setval('elements_element_id_seq', COALESCE((SELECT MAX(element_id) FROM elements), 1), true);
SELECT setval('vendor_type_vendor_type_id_seq', COALESCE((SELECT MAX(vendor_type_id) FROM vendor_type), 1), true);
SELECT setval('packages_package_id_seq', COALESCE((SELECT MAX(package_id) FROM packages), 1), true);
SELECT setval('phases_phase_id_seq', COALESCE((SELECT MAX(phase_id) FROM phases), 1), true);
SELECT setval('payment_types_payment_type_id_seq', COALESCE((SELECT MAX(payment_type_id) FROM payment_types), 1), true);
SELECT setval('payment_methods_payment_method_id_seq', COALESCE((SELECT MAX(payment_method_id) FROM payment_methods), 1), true);

-- Grant permissions (if needed for test user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'Test database schema created successfully!';
    RAISE NOTICE 'All tables, indexes, and basic test data have been inserted.';
END $$;
