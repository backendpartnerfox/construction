const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sequencing
 *   description: API for managing work sequencing
 */

// GET all sequencing records
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id } = req.query;
  
  try {
    let baseQuery = `
      SELECT 
        sequence_id,
        project_id,
        block_id,
        sequence_code,
        sequence_name,
        work_description,
        methodology,
        safety_requirements,
        quality_checkpoints,
        sequence_order,
        predecessor_sequences,
        successor_sequences,
        labor_requirement,
        equipment_requirement,
        material_requirement,
        estimated_days,
        buffer_days,
        can_start,
        prerequisites_met,
        status,
        created_at,
        created_by
      FROM sequencing
    `;
    
    const values = [];
    if (project_id) {
      baseQuery += ' WHERE project_id = $1';
      values.push(project_id);
    }
    
    baseQuery += ' ORDER BY sequence_order, sequence_id';
    
    const result = await db.query(baseQuery, values);
    res.json({ data: result.rows });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// GET specific sequencing record by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        p.project_name,
        b.block_name,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM sequencing s
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN blocks b ON s.block_id = b.block_id
      LEFT JOIN employees e ON s.created_by = e.employee_id
      WHERE s.sequence_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sequencing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET all sequencing records for a specific project
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT s.*, b.block_name 
      FROM sequencing s
      LEFT JOIN blocks b ON s.block_id = b.block_id
      WHERE s.project_id = $1 
      ORDER BY s.sequence_order
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// GET all sequencing records for a specific block
router.get('/block/:blockId', async (req, res) => {
  const db = req.db;
  const { blockId } = req.params;
  
  try {
    // First check if block exists
    const blockCheck = await db.query('SELECT block_id FROM blocks WHERE block_id = $1', [blockId]);
    
    if (blockCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    const result = await db.query(`
      SELECT s.*, p.project_name 
      FROM sequencing s
      LEFT JOIN projects p ON s.project_id = p.project_id
      WHERE s.block_id = $1 
      ORDER BY s.sequence_order
    `, [blockId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// POST - Create a new sequencing record
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    project_id, 
    block_id,
    sequence_code,
    sequence_name, 
    work_description,
    methodology,
    safety_requirements,
    quality_checkpoints,
    sequence_order,
    predecessor_sequences,
    successor_sequences,
    labor_requirement,
    equipment_requirement,
    material_requirement,
    estimated_days,
    buffer_days,
    can_start,
    prerequisites_met,
    status,
    created_by
  } = req.body;

  // Validate required fields
  if (!project_id || !block_id || !sequence_name || sequence_order === undefined) {
    return res.status(400).json({ 
      error: "Required fields: project_id, block_id, sequence_name, sequence_order" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify block exists
    const blockCheck = await db.query('SELECT block_id FROM blocks WHERE block_id = $1', [block_id]);
    
    if (blockCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const result = await db.query(
      `INSERT INTO sequencing (
        project_id, 
        block_id,
        sequence_code,
        sequence_name, 
        work_description,
        methodology,
        safety_requirements,
        quality_checkpoints,
        sequence_order,
        predecessor_sequences,
        successor_sequences,
        labor_requirement,
        equipment_requirement,
        material_requirement,
        estimated_days,
        buffer_days,
        can_start,
        prerequisites_met,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        project_id, 
        block_id,
        sequence_code || null,
        sequence_name, 
        work_description || null,
        methodology || null,
        safety_requirements || null,
        quality_checkpoints || null,
        sequence_order,
        predecessor_sequences || null,
        successor_sequences || null,
        labor_requirement || null,
        equipment_requirement || null,
        material_requirement || null,
        estimated_days || null,
        buffer_days || null,
        can_start !== undefined ? can_start : false,
        prerequisites_met !== undefined ? prerequisites_met : false,
        status || 'Not Started',
        created_by || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Sequencing create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update an existing sequencing record
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    sequence_code,
    sequence_name, 
    work_description,
    methodology,
    safety_requirements,
    quality_checkpoints,
    sequence_order,
    predecessor_sequences,
    successor_sequences,
    labor_requirement,
    equipment_requirement,
    material_requirement,
    estimated_days,
    buffer_days,
    can_start,
    prerequisites_met,
    status
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE sequencing 
       SET sequence_code = COALESCE($2, sequence_code),
           sequence_name = COALESCE($3, sequence_name),
           work_description = COALESCE($4, work_description),
           methodology = COALESCE($5, methodology),
           safety_requirements = COALESCE($6, safety_requirements),
           quality_checkpoints = COALESCE($7, quality_checkpoints),
           sequence_order = COALESCE($8, sequence_order),
           predecessor_sequences = COALESCE($9, predecessor_sequences),
           successor_sequences = COALESCE($10, successor_sequences),
           labor_requirement = COALESCE($11, labor_requirement),
           equipment_requirement = COALESCE($12, equipment_requirement),
           material_requirement = COALESCE($13, material_requirement),
           estimated_days = COALESCE($14, estimated_days),
           buffer_days = COALESCE($15, buffer_days),
           can_start = COALESCE($16, can_start),
           prerequisites_met = COALESCE($17, prerequisites_met),
           status = COALESCE($18, status)
       WHERE sequence_id = $1
       RETURNING *`,
      [
        id, 
        sequence_code,
        sequence_name, 
        work_description,
        methodology,
        safety_requirements,
        quality_checkpoints,
        sequence_order,
        predecessor_sequences,
        successor_sequences,
        labor_requirement,
        equipment_requirement,
        material_requirement,
        estimated_days,
        buffer_days,
        can_start,
        prerequisites_met,
        status
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sequencing record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Sequencing update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Delete a sequencing record
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if this sequence is referenced in predecessor or successor arrays
    const depCheck = await db.query(
      `SELECT COUNT(*) FROM sequencing 
       WHERE $1 = ANY(predecessor_sequences) OR $1 = ANY(successor_sequences)`,
      [id]
    );
    
    if (parseInt(depCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete sequencing record because other sequences depend on it." 
      });
    }
    
    const result = await db.query('DELETE FROM sequencing WHERE sequence_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sequencing record not found" });
    }
    
    res.json({ message: "Sequencing record deleted successfully" });
  } catch (err) {
    console.error('Sequencing delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET sequences that can start for a project
router.get('/can-start/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT s.*, b.block_name 
      FROM sequencing s
      LEFT JOIN blocks b ON s.block_id = b.block_id
      WHERE s.project_id = $1 AND s.can_start = true
      ORDER BY s.sequence_order
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// GET sequences with prerequisites met for a project
router.get('/prerequisites-met/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT s.*, b.block_name 
      FROM sequencing s
      LEFT JOIN blocks b ON s.block_id = b.block_id
      WHERE s.project_id = $1 AND s.prerequisites_met = true
      ORDER BY s.sequence_order
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// GET sequences by status for a project
router.get('/status/:projectId/:status', async (req, res) => {
  const db = req.db;
  const { projectId, status } = req.params;
  
  try {
    const result = await db.query(`
      SELECT s.*, b.block_name 
      FROM sequencing s
      LEFT JOIN blocks b ON s.block_id = b.block_id
      WHERE s.project_id = $1 AND s.status = $2
      ORDER BY s.sequence_order
    `, [projectId, status]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;
