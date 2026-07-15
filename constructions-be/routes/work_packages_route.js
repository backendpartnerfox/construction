const express = require('express');
const router = express.Router();

// GET all phases (for dropdown)
router.get('/phases', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT phase_id, phase_name FROM phases ORDER BY phase_name'
    );
    console.log('Found', result.rows.length, 'phases');
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching phases:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET all vendors/contractors (for dropdown)
router.get('/contractors', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      'SELECT vendor_id, vendor_name FROM vendors ORDER BY vendor_name'
    );
    console.log('Found', result.rows.length, 'contractors');
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET all employees (for team lead dropdown)
router.get('/employees', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(
      `SELECT employee_id, first_name || ' ' || last_name as full_name 
       FROM employees 
       WHERE status = 'Active' 
       ORDER BY first_name, last_name`
    );
    console.log('Found', result.rows.length, 'employees');
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET all work packages (supports project_id filter)
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id } = req.query;
  
  try {
    let query = `
      SELECT 
        wp.package_id,
        wp.project_id,
        wp.package_code,
        wp.package_name,
        wp.package_type,
        wp.sequence_id,
        wp.team_lead_id,
        wp.subcontractor_id,
        wp.scope_of_work,
        wp.planned_start_date,
        wp.planned_end_date,
        wp.actual_start_date,
        wp.actual_end_date,
        wp.progress_percentage,
        wp.status,
        wp.manpower_deployed,
        wp.execution_notes,
        wp.created_at,
        wp.created_by,
        p.project_name,
        e.first_name || ' ' || e.last_name as team_lead_name,
        v.vendor_name as contractor_name
      FROM work_packages wp
      LEFT JOIN projects p ON wp.project_id = p.project_id
      LEFT JOIN employees e ON wp.team_lead_id = e.employee_id
      LEFT JOIN vendors v ON wp.subcontractor_id = v.vendor_id
    `;
    
    const values = [];
    if (project_id) {
      query += ' WHERE wp.project_id = $1';
      values.push(project_id);
    }
    
    query += ' ORDER BY wp.created_at DESC';
    
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await db.query(query, values);
    
    console.log('Query successful, found', result.rows.length, 'work packages');
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET specific work package by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT wp.*, p.project_name, 
             e.first_name || ' ' || e.last_name as team_lead_name,
             v.vendor_name as contractor_name
      FROM work_packages wp
      LEFT JOIN projects p ON wp.project_id = p.project_id
      LEFT JOIN employees e ON wp.team_lead_id = e.employee_id
      LEFT JOIN vendors v ON wp.subcontractor_id = v.vendor_id
      WHERE wp.package_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Work package not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching work package:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST - Create new work package
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id,
    package_name,
    package_code,
    package_type,
    phase,
    contractor_name,
    team_lead_id,
    subcontractor_id,
    scope_of_work,
    planned_start_date,
    planned_end_date,
    manpower_deployed,
    status,
    execution_notes
  } = req.body;

  console.log('Creating work package with data:', req.body);

  // Validate required fields
  if (!project_id || !package_name) {
    return res.status(400).json({ 
      success: false,
      error: 'Required fields missing: project_id, package_name' 
    });
  }

  try {
    // Validate project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid project_id: ${project_id}. Project does not exist.`
      });
    }

    // Validate team_lead_id if provided
    if (team_lead_id && team_lead_id !== '') {
      const leadCheck = await db.query('SELECT employee_id FROM employees WHERE employee_id = $1', [team_lead_id]);
      if (leadCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid team_lead_id: ${team_lead_id}. Employee does not exist.`
        });
      }
      console.log('Team lead validation passed for employee_id:', team_lead_id);
    }

    // Validate subcontractor_id if provided
    if (subcontractor_id && subcontractor_id !== '') {
      const contractorCheck = await db.query('SELECT vendor_id FROM vendors WHERE vendor_id = $1', [subcontractor_id]);
      if (contractorCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid subcontractor_id: ${subcontractor_id}. Vendor does not exist.`
        });
      }
      console.log('Contractor validation passed for vendor_id:', subcontractor_id);
    }

    // Auto-generate package_code if not provided
    let finalPackageCode = package_code;
    if (!finalPackageCode) {
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM work_packages WHERE project_id = $1',
        [project_id]
      );
      const nextNumber = parseInt(countResult.rows[0].count) + 1;
      finalPackageCode = `WP-${String(nextNumber).padStart(3, '0')}`;
      console.log('Auto-generated package_code:', finalPackageCode);
    }

    // Prepare values with proper null handling
    const finalTeamLeadId = (team_lead_id && team_lead_id !== '' && !isNaN(team_lead_id)) ? parseInt(team_lead_id) : null;
    const finalSubcontractorId = (subcontractor_id && subcontractor_id !== '' && !isNaN(subcontractor_id)) ? parseInt(subcontractor_id) : null;
    const finalManpowerDeployed = (manpower_deployed && manpower_deployed !== '') ? parseInt(manpower_deployed) : null;

    const insertQuery = `
      INSERT INTO work_packages (
        project_id,
        package_name,
        package_code,
        package_type,
        team_lead_id,
        subcontractor_id,
        scope_of_work,
        planned_start_date,
        planned_end_date,
        manpower_deployed,
        status,
        execution_notes,
        progress_percentage,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const insertValues = [
      project_id,
      package_name,
      finalPackageCode,
      package_type || 'Standard',
      finalTeamLeadId,
      finalSubcontractorId,
      scope_of_work || null,
      planned_start_date || null,
      planned_end_date || null,
      finalManpowerDeployed,
      status || 'Not Started',
      execution_notes || null,
      0, // progress_percentage default
      1 // created_by default (you can change this to actual user ID)
    ];

    console.log('Executing INSERT with values:', insertValues);

    const result = await db.query(insertQuery, insertValues);

    console.log('Work package created successfully:', result.rows[0].package_id);
    res.status(201).json({ 
      success: true,
      data: result.rows[0],
      message: 'Work package created successfully'
    });

  } catch (error) {
    console.error('Error creating work package:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === '23503') {
      if (error.constraint === 'work_packages_team_lead_id_fkey') {
        errorMessage = 'Invalid team lead selected. Please choose a valid employee or leave empty.';
      } else if (error.constraint === 'work_packages_subcontractor_id_fkey') {
        errorMessage = 'Invalid contractor selected. Please choose a valid vendor or leave empty.';
      } else if (error.constraint === 'work_packages_project_id_fkey') {
        errorMessage = 'Invalid project ID. Project does not exist.';
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error.detail
    });
  }
});

// PUT - Update work package
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updateData = req.body;

  console.log('Updating work package', id, 'with data:', updateData);

  try {
    // Check if work package exists
    const existingResult = await db.query('SELECT * FROM work_packages WHERE package_id = $1', [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Work package not found' 
      });
    }

    // Validate foreign keys if they're being updated
    if (updateData.team_lead_id && updateData.team_lead_id !== '') {
      const leadCheck = await db.query('SELECT employee_id FROM employees WHERE employee_id = $1', [updateData.team_lead_id]);
      if (leadCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid team_lead_id: ${updateData.team_lead_id}. Employee does not exist.`
        });
      }
    }

    if (updateData.subcontractor_id && updateData.subcontractor_id !== '') {
      const contractorCheck = await db.query('SELECT vendor_id FROM vendors WHERE vendor_id = $1', [updateData.subcontractor_id]);
      if (contractorCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid subcontractor_id: ${updateData.subcontractor_id}. Vendor does not exist.`
        });
      }
    }

    const updateQuery = `
      UPDATE work_packages 
      SET 
        package_name = $2,
        package_code = $3,
        package_type = $4,
        team_lead_id = $5,
        subcontractor_id = $6,
        scope_of_work = $7,
        planned_start_date = $8,
        planned_end_date = $9,
        actual_start_date = $10,
        actual_end_date = $11,
        manpower_deployed = $12,
        status = $13,
        execution_notes = $14,
        progress_percentage = $15,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $16
      WHERE package_id = $1
      RETURNING *
    `;

    const finalTeamLeadId = (updateData.team_lead_id && updateData.team_lead_id !== '') ? parseInt(updateData.team_lead_id) : null;
    const finalSubcontractorId = (updateData.subcontractor_id && updateData.subcontractor_id !== '') ? parseInt(updateData.subcontractor_id) : null;
    const finalManpowerDeployed = (updateData.manpower_deployed && updateData.manpower_deployed !== '') ? parseInt(updateData.manpower_deployed) : null;
    const finalProgressPercentage = (updateData.progress_percentage && updateData.progress_percentage !== '') ? parseFloat(updateData.progress_percentage) : 0;

    const updateValues = [
      id,
      updateData.package_name,
      updateData.package_code,
      updateData.package_type,
      finalTeamLeadId,
      finalSubcontractorId,
      updateData.scope_of_work || null,
      updateData.planned_start_date || null,
      updateData.planned_end_date || null,
      updateData.actual_start_date || null,
      updateData.actual_end_date || null,
      finalManpowerDeployed,
      updateData.status,
      updateData.execution_notes || null,
      finalProgressPercentage,
      1 // updated_by (change to actual user ID)
    ];

    const result = await db.query(updateQuery, updateValues);

    console.log('Work package updated successfully');
    res.json({ 
      success: true,
      data: result.rows[0],
      message: 'Work package updated successfully'
    });

  } catch (error) {
    console.error('Error updating work package:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE - Delete work package
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  console.log('Deleting work package:', id);

  try {
    const result = await db.query('DELETE FROM work_packages WHERE package_id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Work package not found' 
      });
    }
    
    console.log('Work package deleted successfully');
    res.json({ 
      success: true,
      message: 'Work package deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting work package:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
