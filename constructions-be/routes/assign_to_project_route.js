const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Assignments
 *   description: API for assigning users to projects
 */

// Get all project assignments
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, assignee, assigned_by } = req.query;
  
  try {
    let query = `
      SELECT 
        atp.*,
        p.project_name,
        p.project_code,
        p.status as project_status,
        p.location,
        u1.username as assignee_username,
        u1.email as assignee_email,
        u2.username as assigned_by_username,
        u2.email as assigned_by_email
      FROM assign_to_project atp
      LEFT JOIN projects p ON atp.project_id = p.project_id
      LEFT JOIN users u1 ON atp.assignee = u1.id
      LEFT JOIN users u2 ON atp.assigned_by = u2.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      query += ` AND atp.project_id = $${paramCount}`;
      params.push(project_id);
    }

    if (assignee) {
      paramCount++;
      query += ` AND atp.assignee = $${paramCount}`;
      params.push(assignee);
    }

    if (assigned_by) {
      paramCount++;
      query += ` AND atp.assigned_by = $${paramCount}`;
      params.push(assigned_by);
    }

    query += ` ORDER BY atp.date DESC`;

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get assignments by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('Fetching assignments for project:', projectId);
    
    const result = await db.query(`
      SELECT 
        atp.*,
        u1.username as assignee_username,
        u1.email as assignee_email,
        u2.username as assigned_by_username,
        u2.email as assigned_by_email
      FROM assign_to_project atp
      LEFT JOIN users u1 ON atp.assignee = u1.id
      LEFT JOIN users u2 ON atp.assigned_by = u2.id
      WHERE atp.project_id = $1
      ORDER BY atp.date DESC
    `, [projectId]);
    
    console.log(`Found ${result.rows.length} assignments for project ${projectId}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get assignments by user (assignee)
router.get('/user/:userId', async (req, res) => {
  const db = req.db;
  const { userId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        atp.*,
        p.project_name,
        p.project_code,
        p.status as project_status,
        p.location,
        u2.username as assigned_by_username
      FROM assign_to_project atp
      LEFT JOIN projects p ON atp.project_id = p.project_id
      LEFT JOIN users u2 ON atp.assigned_by = u2.id
      WHERE atp.assignee = $1
      ORDER BY atp.date DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single assignment by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        atp.*,
        p.project_name,
        p.project_code,
        p.status as project_status,
        u1.username as assignee_username,
        u1.email as assignee_email,
        u2.username as assigned_by_username,
        u2.email as assigned_by_email
      FROM assign_to_project atp
      LEFT JOIN projects p ON atp.project_id = p.project_id
      LEFT JOIN users u1 ON atp.assignee = u1.id
      LEFT JOIN users u2 ON atp.assigned_by = u2.id
      WHERE atp.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new project assignment
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    assignee,
    assigned_by,
    date
  } = req.body;

  // Validation
  if (!project_id || !assignee || !assigned_by) {
    return res.status(400).json({
      success: false,
      error: 'Project ID, assignee, and assigned_by are required'
    });
  }

  try {
    // Check if user is already assigned to this project
    const existingCheck = await db.query(
      `SELECT id FROM assign_to_project 
       WHERE project_id = $1 AND assignee = $2`,
      [project_id, assignee]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User is already assigned to this project'
      });
    }

    const result = await db.query(
      `INSERT INTO assign_to_project (project_id, assignee, assigned_by, date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [project_id, assignee, assigned_by, date || new Date().toISOString().split('T')[0]]
    );

    // Get full details
    const fullResult = await db.query(`
      SELECT 
        atp.*,
        p.project_name,
        u1.username as assignee_username,
        u2.username as assigned_by_username
      FROM assign_to_project atp
      LEFT JOIN projects p ON atp.project_id = p.project_id
      LEFT JOIN users u1 ON atp.assignee = u1.id
      LEFT JOIN users u2 ON atp.assigned_by = u2.id
      WHERE atp.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: fullResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update project assignment
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    assignee,
    assigned_by,
    date
  } = req.body;

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (project_id !== undefined) {
      fields.push(`project_id = $${paramIndex}`);
      values.push(project_id);
      paramIndex++;
    }

    if (assignee !== undefined) {
      fields.push(`assignee = $${paramIndex}`);
      values.push(assignee);
      paramIndex++;
    }

    if (assigned_by !== undefined) {
      fields.push(`assigned_by = $${paramIndex}`);
      values.push(assigned_by);
      paramIndex++;
    }

    if (date !== undefined) {
      fields.push(`date = $${paramIndex}`);
      values.push(date);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(id);

    const query = `
      UPDATE assign_to_project 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Get full details
    const fullResult = await db.query(`
      SELECT 
        atp.*,
        p.project_name,
        u1.username as assignee_username,
        u2.username as assigned_by_username
      FROM assign_to_project atp
      LEFT JOIN projects p ON atp.project_id = p.project_id
      LEFT JOIN users u1 ON atp.assignee = u1.id
      LEFT JOIN users u2 ON atp.assigned_by = u2.id
      WHERE atp.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: fullResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete project assignment
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `DELETE FROM assign_to_project 
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user workload summary
router.get('/workload/summary', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        COUNT(atp.id) as total_assignments,
        STRING_AGG(DISTINCT p.project_name, ', ' ORDER BY p.project_name) as assigned_projects
      FROM users u
      LEFT JOIN assign_to_project atp ON u.id = atp.assignee
      LEFT JOIN projects p ON atp.project_id = p.project_id
      GROUP BY u.id, u.username, u.email
      HAVING COUNT(atp.id) > 0
      ORDER BY total_assignments DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching workload summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get project team roster
router.get('/project/:projectId/roster', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        p.project_id,
        p.project_name,
        p.project_code,
        COUNT(atp.id) as team_size,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'user_id', u.id,
            'username', u.username,
            'email', u.email,
            'assigned_date', atp.date
          ) ORDER BY atp.date
        ) as team_members
      FROM projects p
      LEFT JOIN assign_to_project atp ON p.project_id = atp.project_id
      LEFT JOIN users u ON atp.assignee = u.id
      WHERE p.project_id = $1
      GROUP BY p.project_id, p.project_name, p.project_code
    `, [projectId]);
    
    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching team roster:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
