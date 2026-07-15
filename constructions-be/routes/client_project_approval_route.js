const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Project Approval
 *   description: API for managing client project approvals
 */

// Get all project approvals
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT cpa.*, 
             c.client_name, 
             p.project_name,
             p.project_code
      FROM client_project_approval cpa
      LEFT JOIN clients c ON cpa.client_id = c.client_id
      LEFT JOIN projects p ON cpa.project_id = p.project_id
      ORDER BY cpa.id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    console.error('Stack:', queryErr.stack);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get approvals by client ID
router.get('/client/:clientId', async (req, res) => {
  const db = req.db;
  const { clientId } = req.params;
  
  try {
    console.log('Fetching project approvals for client:', clientId);
    
    // Check if client exists
    const clientCheck = await db.query('SELECT client_id FROM clients WHERE client_id = $1', [clientId]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const result = await db.query(`
      SELECT cpa.*, 
             p.project_name,
             p.project_code,
             p.status as project_status
      FROM client_project_approval cpa
      LEFT JOIN projects p ON cpa.project_id = p.project_id
      WHERE cpa.client_id = $1
      ORDER BY cpa.id DESC
    `, [clientId]);
    
    console.log(`Found ${result.rows.length} approvals for client ${clientId}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    console.error('Stack:', queryErr.stack);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get approvals by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cpa.*, c.client_name
      FROM client_project_approval cpa
      LEFT JOIN clients c ON cpa.client_id = c.client_id
      WHERE cpa.project_id = $1
      ORDER BY cpa.id DESC
    `, [projectId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

// Get approval by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cpa.*, c.client_name, p.project_name
      FROM client_project_approval cpa
      LEFT JOIN clients c ON cpa.client_id = c.client_id
      LEFT JOIN projects p ON cpa.project_id = p.project_id
      WHERE cpa.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project approval not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Create new project approval
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    drawings_id,
    client_id,
    project_id,
    drawing_version
  } = req.body;

  if (!client_id || !project_id) {
    return res.status(400).json({ 
      success: false,
      error: "Client ID and project ID are required" 
    });
  }

  try {
    const result = await db.query(`
      INSERT INTO client_project_approval (
        drawings_id, client_id, project_id, drawing_version
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [drawings_id, client_id, project_id, drawing_version]);

    res.status(201).json({
      success: true,
      message: 'Project approval created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Update project approval
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    drawings_id,
    client_id,
    project_id,
    drawing_version
  } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (drawings_id !== undefined) {
      updates.push(`drawings_id = $${paramCount}`);
      values.push(drawings_id);
      paramCount++;
    }
    if (client_id !== undefined) {
      updates.push(`client_id = $${paramCount}`);
      values.push(client_id);
      paramCount++;
    }
    if (project_id !== undefined) {
      updates.push(`project_id = $${paramCount}`);
      values.push(project_id);
      paramCount++;
    }
    if (drawing_version !== undefined) {
      updates.push(`drawing_version = $${paramCount}`);
      values.push(drawing_version);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid fields to update' 
      });
    }

    values.push(id);

    const query = `
      UPDATE client_project_approval 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Project approval not found" 
      });
    }

    res.json({
      success: true,
      message: 'Project approval updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Delete project approval
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM client_project_approval WHERE id = $1 RETURNING id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Project approval not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Project approval deleted successfully" 
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
