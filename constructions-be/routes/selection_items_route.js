const express = require('express');
const router = express.Router();

// Get all selection items
router.get('/', async (req, res) => {
  const db = req.db;
  const { selection_item_id, item_id, selection_status, project_id } = req.query;
  
  try {
    let query = `
      SELECT si.*, i.item_name, i.item_description, i.item_category
      FROM selection_items si
      LEFT JOIN items i ON si.item_id = i.item_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (selection_item_id) {
      paramCount++;
      query += ` AND si.selection_item_id = $${paramCount}`;
      params.push(selection_item_id);
    }

    if (item_id) {
      paramCount++;
      query += ` AND si.item_id = $${paramCount}`;
      params.push(item_id);
    }

    if (project_id) {
      paramCount++;
      query += ` AND si.project_id = $${paramCount}`;
      params.push(project_id);
    }

    if (selection_status) {
      paramCount++;
      query += ` AND si.selection_status = $${paramCount}`;
      params.push(selection_status);
    }

    query += ' ORDER BY si.selection_item_id, si.created_at';

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get selection items by project ID - CRITICAL FIX
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    console.log('Fetching selection items for project:', projectId);
    
    const query = `
      SELECT 
        si.selection_item_id,
        si.project_id,
        si.item_id,
        si.selection_category,
        si.selection_subcategory,
        si.selection_name,
        si.selection_description,
        si.quantity_required,
        si.unit,
        si.specifications,
        si.budget_range_min,
        si.budget_range_max,
        si.default_choice_option_id,
        si.requires_client_selection,
        si.selection_priority,
        si.selection_deadline,
        si.selection_status,
        si.selected_choice_option_id,
        si.selected_date,
        si.selected_by,
        si.is_approved,
        si.approved_by,
        si.approved_date,
        si.notes,
        si.created_at,
        i.item_name,
        i.item_description,
        i.item_category,
        i.item_unit,
        ic.display_name as default_choice_name
      FROM selection_items si
      LEFT JOIN items i ON si.item_id = i.item_id
      LEFT JOIN item_choices ic ON si.default_choice_option_id = ic.choice_option_id
      WHERE si.project_id = $1
      ORDER BY si.selection_priority ASC NULLS LAST, si.created_at DESC
    `;
    
    const result = await db.query(query, [projectId]);
    
    console.log(`Found ${result.rows.length} selection items for project ${projectId}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching selection items by project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single selection item by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT si.*, i.item_name, i.item_description, i.item_category
      FROM selection_items si
      LEFT JOIN items i ON si.item_id = i.item_id
      WHERE si.selection_item_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Selection item not found' 
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

// Create new selection item
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    item_id,
    selection_category,
    selection_subcategory,
    selection_name,
    selection_description,
    quantity_required,
    unit,
    specifications,
    budget_range_min,
    budget_range_max,
    default_choice_option_id,
    requires_client_selection,
    selection_priority,
    selection_deadline,
    notes
  } = req.body;

  // Validation
  if (!project_id || !item_id) {
    return res.status(400).json({ 
      success: false,
      error: 'project_id and item_id are required' 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO selection_items (
        project_id, item_id, selection_category, selection_subcategory,
        selection_name, selection_description, quantity_required, unit,
        specifications, budget_range_min, budget_range_max,
        default_choice_option_id, requires_client_selection,
        selection_priority, selection_deadline, selection_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Pending', $16)
      RETURNING *`,
      [
        project_id, item_id, selection_category, selection_subcategory,
        selection_name, selection_description, quantity_required, unit,
        specifications, budget_range_min, budget_range_max,
        default_choice_option_id, requires_client_selection !== false,
        selection_priority, selection_deadline, notes
      ]
    );

    res.status(201).json({
      success: true,
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

// Update selection item
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'selection_item_id') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE selection_items 
      SET ${fields.join(', ')}
      WHERE selection_item_id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Selection item not found' 
      });
    }

    res.json({
      success: true,
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

// Delete selection item
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM selection_items WHERE selection_item_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Selection item not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Selection item deleted successfully',
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

// Update selection status
router.patch('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { selection_status, notes } = req.body;

  if (!selection_status) {
    return res.status(400).json({ 
      success: false,
      error: 'selection_status is required' 
    });
  }

  try {
    const result = await db.query(
      `UPDATE selection_items SET
        selection_status = $1,
        notes = CASE 
          WHEN notes IS NULL THEN $2
          ELSE notes || E'\n' || $2
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE selection_item_id = $3
      RETURNING *`,
      [selection_status, notes || `Status updated to ${selection_status}`, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Selection item not found' 
      });
    }

    res.json({
      success: true,
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

// Get pending selections
router.get('/status/pending', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      `SELECT si.*, i.item_name, i.item_description
       FROM selection_items si
       LEFT JOIN items i ON si.item_id = i.item_id
       WHERE si.selection_status IN ('Pending', 'Options Presented')
       ORDER BY si.created_at ASC`
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
