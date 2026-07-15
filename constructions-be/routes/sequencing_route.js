const express = require('express');
const router = express.Router();

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

// POST - Create a new sequencing record with smart defaults
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

  console.log('📝 Received POST data:', req.body);

  // Only project_id is truly required
  if (!project_id) {
    return res.status(400).json({ 
      error: "Required field missing: project_id" 
    });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Auto-get block_id if not provided
    let finalBlockId = block_id;
    if (!finalBlockId) {
      const blockResult = await db.query(
        'SELECT block_id FROM blocks WHERE project_id = $1 ORDER BY block_id LIMIT 1',
        [project_id]
      );
      if (blockResult.rows.length > 0) {
        finalBlockId = blockResult.rows[0].block_id;
        console.log('🔄 Auto-assigned block_id:', finalBlockId);
      } else {
        return res.status(400).json({ error: 'No blocks found for this project. Please create a block first or provide block_id.' });
      }
    }

    // Verify block exists
    const blockCheck = await db.query('SELECT block_id FROM blocks WHERE block_id = $1', [finalBlockId]);
    if (blockCheck.rows.length === 0) {
      return res.status(404).json({ error: `Block not found: ${finalBlockId}` });
    }

    // Auto-calculate sequence_order if not provided
    let finalSequenceOrder = sequence_order;
    if (finalSequenceOrder === undefined || finalSequenceOrder === null) {
      const orderResult = await db.query(
        'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM sequencing WHERE project_id = $1',
        [project_id]
      );
      finalSequenceOrder = orderResult.rows[0].next_order;
      console.log('🔄 Auto-assigned sequence_order:', finalSequenceOrder);
    }

    // Auto-generate sequence_name if not provided
    const finalSequenceName = sequence_name || `Task ${finalSequenceOrder}`;

    // Auto-generate sequence_code if not provided
    const finalSequenceCode = sequence_code || `SEQ-${finalSequenceOrder}`;

    console.log('✨ Final values:', {
      project_id,
      block_id: finalBlockId,
      sequence_code: finalSequenceCode,
      sequence_name: finalSequenceName,
      sequence_order: finalSequenceOrder
    });

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
        finalBlockId,
        finalSequenceCode,
        finalSequenceName, 
        work_description || null,
        methodology || null,
        safety_requirements || null,
        quality_checkpoints || null,
        finalSequenceOrder,
        predecessor_sequences || null,
        successor_sequences || null,
        labor_requirement || null,
        equipment_requirement || null,
        material_requirement || null,
        estimated_days || null,
        buffer_days || null,
        can_start !== undefined ? can_start : false,
        prerequisites_met !== undefined ? prerequisites_met : false,
        status || 'Planned',
        created_by || null
      ]
    );

    console.log('✅ Successfully created sequence:', result.rows[0].sequence_id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Sequencing create error:', err);
    res.status(500).json({ error: err.message, details: err.detail || err.hint });
  }
});

// PUT - Update an existing sequencing record
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
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
    status
  } = req.body;

  console.log('📝 Received PUT data for sequence_id:', id);
  console.log('📝 PUT body:', req.body);

  try {
    // Check if sequence exists first
    const existingSequence = await db.query('SELECT * FROM sequencing WHERE sequence_id = $1', [id]);
    
    if (existingSequence.rows.length === 0) {
      console.log('❌ Sequence not found:', id);
      return res.status(404).json({ error: "Sequencing record not found" });
    }

    console.log('✅ Found existing sequence:', existingSequence.rows[0].sequence_name);

    // Helper function to handle null/undefined/empty string values
    const processValue = (value, type = 'string') => {
      if (value === null || value === undefined || value === '') return null;
      if (type === 'number') {
        const num = parseInt(value);
        return isNaN(num) ? null : num;
      }
      if (type === 'boolean') {
        return Boolean(value);
      }
      return value;
    };

    const result = await db.query(
      `UPDATE sequencing 
       SET block_id = $2,
           sequence_code = $3,
           sequence_name = $4,
           work_description = $5,
           methodology = $6,
           safety_requirements = $7,
           quality_checkpoints = $8,
           sequence_order = $9,
           predecessor_sequences = $10,
           successor_sequences = $11,
           labor_requirement = $12,
           equipment_requirement = $13,
           material_requirement = $14,
           estimated_days = $15,
           buffer_days = $16,
           can_start = $17,
           prerequisites_met = $18,
           status = $19
       WHERE sequence_id = $1
       RETURNING *`,
      [
        id,
        processValue(block_id, 'number'),
        processValue(sequence_code),
        processValue(sequence_name), 
        processValue(work_description),
        processValue(methodology),
        processValue(safety_requirements),
        quality_checkpoints || null,
        processValue(sequence_order, 'number'),
        predecessor_sequences || null,
        successor_sequences || null,
        processValue(labor_requirement),
        processValue(equipment_requirement),
        processValue(material_requirement),
        processValue(estimated_days, 'number'),
        processValue(buffer_days, 'number'),
        processValue(can_start, 'boolean'),
        processValue(prerequisites_met, 'boolean'),
        processValue(status) || 'Planned'
      ]
    );

    if (result.rowCount === 0) {
      console.log('❌ Update failed for sequence:', id);
      return res.status(404).json({ error: "Sequencing record not found or update failed" });
    }

    console.log('✅ Successfully updated sequence:', result.rows[0].sequence_id);
    console.log('📊 Updated data:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ Sequencing update error:', err);
    console.error('❌ Error details:', err.detail);
    res.status(500).json({ error: err.message, details: err.detail });
  }
});

// DELETE - Delete a sequencing record
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  console.log('🗑️ Attempting to delete sequence_id:', id);

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
    
    console.log('✅ Successfully deleted sequence:', id);
    res.json({ message: "Sequencing record deleted successfully" });
  } catch (err) {
    console.error('❌ Sequencing delete error:', err);
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
