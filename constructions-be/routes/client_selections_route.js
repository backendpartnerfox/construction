const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Selections
 *   description: API for managing client item/material selections
 */

router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT cs.*,
             i.item_name as selection_item_name,
             si.project_id,
             COALESCE(p.client_id, 0) as client_id,
             ic.display_name as selected_choice_name,
             v.vendor_name as preferred_vendor_name
      FROM client_selections cs
      LEFT JOIN selection_items si ON cs.selection_item_id = si.selection_item_id
      LEFT JOIN items i ON si.item_id = i.item_id
      LEFT JOIN projects p ON si.project_id = p.project_id
      LEFT JOIN item_choices ic ON cs.selected_choice_option_id = ic.choice_option_id
      LEFT JOIN vendors v ON cs.preferred_vendor_id = v.vendor_id
      ORDER BY cs.selection_date DESC NULLS LAST
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

router.get('/client/:clientId', async (req, res) => {
  const db = req.db;
  const { clientId } = req.params;
  
  try {
    console.log('Fetching client selections for client:', clientId);
    
    // First check if client exists
    const clientCheck = await db.query('SELECT client_id FROM clients WHERE client_id = $1', [clientId]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Get selections
    const result = await db.query(`
      SELECT cs.*,
             i.item_name as selection_item_name,
             i.item_name,
             si.project_id,
             si.selection_category,
             si.selection_subcategory,
             p.client_id,
             p.project_name,
             p.project_code,
             ic.display_name as selected_choice_name,
             v.vendor_name as preferred_vendor_name
      FROM projects p
      INNER JOIN selection_items si ON p.project_id = si.project_id
      INNER JOIN client_selections cs ON si.selection_item_id = cs.selection_item_id
      LEFT JOIN items i ON si.item_id = i.item_id
      LEFT JOIN item_choices ic ON cs.selected_choice_option_id = ic.choice_option_id
      LEFT JOIN vendors v ON cs.preferred_vendor_id = v.vendor_id
      WHERE p.client_id = $1
      ORDER BY cs.selection_date DESC NULLS LAST
    `, [clientId]);
    
    console.log(`Found ${result.rows.length} selections for client ${clientId}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    console.error('Stack:', queryErr.stack);
    res.status(500).json({ 
      success: false,
      error: queryErr.message,
      details: process.env.NODE_ENV === 'development' ? queryErr.stack : undefined
    });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cs.*,
             i.item_name as selection_item_name,
             i.item_name,
             si.project_id,
             p.client_id,
             p.project_name,
             ic.display_name as selected_choice_name,
             v.vendor_name as preferred_vendor_name
      FROM client_selections cs
      LEFT JOIN selection_items si ON cs.selection_item_id = si.selection_item_id
      LEFT JOIN items i ON si.item_id = i.item_id
      LEFT JOIN projects p ON si.project_id = p.project_id
      LEFT JOIN item_choices ic ON cs.selected_choice_option_id = ic.choice_option_id
      LEFT JOIN vendors v ON cs.preferred_vendor_id = v.vendor_id
      WHERE cs.client_selection_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Client selection not found' 
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

router.post('/', async (req, res) => {
  const db = req.db;
  const {
    selection_item_id,
    selected_choice_option_id,
    selected_brand,
    selected_model,
    selected_color,
    selected_pattern,
    selected_size,
    selected_finish,
    selected_unit_price,
    selected_total_price,
    price_difference,
    custom_specifications,
    reference_images,
    sample_approved,
    sample_approval_date,
    preferred_vendor_id,
    vendor_quotation_ref,
    client_approved,
    client_approval_date,
    architect_approved,
    architect_approval_date,
    architect_notes,
    status
  } = req.body;

  if (!selection_item_id || !selected_choice_option_id) {
    return res.status(400).json({ 
      success: false,
      error: "Selection item ID and selected choice option ID are required" 
    });
  }

  try {
    const result = await db.query(`
      INSERT INTO client_selections (
        selection_item_id, selected_choice_option_id, selected_brand, selected_model,
        selected_color, selected_pattern, selected_size, selected_finish,
        selected_unit_price, selected_total_price, price_difference,
        custom_specifications, reference_images, sample_approved, sample_approval_date,
        preferred_vendor_id, vendor_quotation_ref, client_approved, client_approval_date,
        architect_approved, architect_approval_date, architect_notes, selection_date, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP, $23
      )
      RETURNING *
    `, [
      selection_item_id, selected_choice_option_id, selected_brand, selected_model,
      selected_color, selected_pattern, selected_size, selected_finish,
      selected_unit_price, selected_total_price, price_difference,
      custom_specifications, reference_images, sample_approved, sample_approval_date,
      preferred_vendor_id, vendor_quotation_ref, client_approved || false, client_approval_date,
      architect_approved || false, architect_approval_date, architect_notes, status || 'Pending'
    ]);

    res.status(201).json({
      success: true,
      message: 'Selection created successfully',
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

router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'selection_item_id', 'selected_choice_option_id', 'selected_brand', 'selected_model',
      'selected_color', 'selected_pattern', 'selected_size', 'selected_finish',
      'selected_unit_price', 'selected_total_price', 'price_difference',
      'custom_specifications', 'reference_images', 'sample_approved', 'sample_approval_date',
      'preferred_vendor_id', 'vendor_quotation_ref', 'client_approved', 'client_approval_date',
      'architect_approved', 'architect_approval_date', 'architect_notes', 'status'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid fields to update' 
      });
    }

    values.push(id);

    const query = `
      UPDATE client_selections 
      SET ${updates.join(', ')}
      WHERE client_selection_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Client selection not found" 
      });
    }

    res.json({
      success: true,
      message: 'Selection updated successfully',
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

router.put('/:id/approve', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { approved_by, approval_type = 'client' } = req.body;

  try {
    let query;
    if (approval_type === 'architect') {
      query = `
        UPDATE client_selections 
        SET architect_approved = true, 
            architect_approval_date = CURRENT_TIMESTAMP,
            status = 'Approved'
        WHERE client_selection_id = $1
        RETURNING *
      `;
    } else {
      query = `
        UPDATE client_selections 
        SET client_approved = true, 
            client_approval_date = CURRENT_TIMESTAMP,
            status = 'Approved'
        WHERE client_selection_id = $1
        RETURNING *
      `;
    }

    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Client selection not found" 
      });
    }

    res.json({
      success: true,
      message: 'Selection approved successfully',
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

router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM client_selections WHERE client_selection_id = $1 RETURNING client_selection_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Client selection not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Client selection deleted successfully" 
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
