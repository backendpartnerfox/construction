-- Check what table boq_id references
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='project_material_costing' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'boq_id';

-- Check what BOQ records exist for this project
SELECT 'Structural BOQ' as type, boq_id FROM project_boq_structural WHERE project_id = 16
UNION ALL
SELECT 'Walls BOQ', boq_id FROM project_boq_walls WHERE project_id = 16
UNION ALL
SELECT 'Doors BOQ', boq_id FROM project_boq_doors WHERE project_id = 16
UNION ALL
SELECT 'Windows BOQ', boq_id FROM project_boq_windows WHERE project_id = 16
UNION ALL
SELECT 'Electrical BOQ', boq_id FROM project_boq_electrical WHERE project_id = 16
UNION ALL
SELECT 'Plumbing BOQ', boq_id FROM project_boq_plumbing WHERE project_id = 16
UNION ALL
SELECT 'Flooring BOQ', boq_id FROM project_boq_flooring WHERE project_id = 16
UNION ALL
SELECT 'Painting BOQ', boq_id FROM project_boq_painting WHERE project_id = 16
ORDER BY boq_id;
