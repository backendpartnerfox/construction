const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Quotation History
 *   description: API for tracking client quotation version history
 */

// Get all quotation history
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT cqh.*, cq.client_quotation_number, c.client_name
      FROM client_quotation_history cqh
      LEFT JOIN client_quotations cq ON cqh.client_quotation_id = cq.client_quotation_id
      LEFT JOIN clients c ON cq.client_id = c.client_id
      ORDER BY cqh.change_date DESC
    `);
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

// Get history by quotation ID
router.get('/quotation/:quotationId', async (req, res) => {
  const db = req.db;
  const { quotationId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cqh.*,
             e.first_name || ' ' || e.last_name as changed_by_name
      FROM client_quotation_history cqh
      LEFT JOIN users e ON cqh.created_by = e.user_id
      WHERE cqh.client_quotation_id = $1
      ORDER BY cqh.version_number DESC
    `, [quotationId]);
    
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

// Get history by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT cqh.*, cq.client_quotation_number, c.client_name,
             e.first_name || ' ' || e.last_name as changed_by_name
      FROM client_quotation_history cqh
      LEFT JOIN client_quotations cq ON cqh.client_quotation_id = cq.client_quotation_id
      LEFT JOIN clients c ON cq.client_id = c.client_id
      LEFT JOIN users e ON cqh.created_by = e.user_id
      WHERE cqh.history_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Quotation history not found' 
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

// Create new quotation history entry
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    client_quotation_id,
    version_number,
    change_type,
    change_category,
    change_description,
    change_reason,
    change_requested_by,
    change_approved_by,
    contract_value_before,
    contract_value_after,
    total_area_before,
    total_area_after,
    completion_date_before,
    completion_date_after,
    scope_changes,
    material_changes,
    specification_changes,
    additional_work_details,
    cost_impact,
    time_impact_days,
    resource_impact,
    client_approval_required,
    client_approved,
    client_approval_date,
    client_signature_path,
    change_order_number,
    change_order_date,
    change_order_file_path,
    change_status,
    implementation_date,
    implementation_notes,
    change_documentation_path,
    supporting_drawings_path,
    cost_analysis_path,
    created_by,
    history_notes,
    internal_notes,
    client_communication_notes
  } = req.body;

  if (!client_quotation_id || !version_number) {
    return res.status(400).json({ 
      success: false,
      error: "Quotation ID and version number are required" 
    });
  }

  try {
    // Calculate value change
    const value_change = contract_value_after && contract_value_before 
      ? contract_value_after - contract_value_before 
      : null;

    const query = `
      INSERT INTO client_quotation_history (
        client_quotation_id, version_number, change_type, change_category,
        change_description, change_reason, change_requested_by, change_approved_by,
        contract_value_before, contract_value_after, value_change,
        total_area_before, total_area_after,
        completion_date_before, completion_date_after, scope_changes, material_changes,
        specification_changes, additional_work_details, cost_impact, time_impact_days,
        resource_impact, client_approval_required, client_approved, client_approval_date,
        client_signature_path, change_order_number, change_order_date, change_order_file_path,
        change_status, implementation_date, implementation_notes, change_documentation_path,
        supporting_drawings_path, cost_analysis_path, created_by, change_date, history_notes,
        internal_notes, client_communication_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, CURRENT_TIMESTAMP, $36, $37, $38
      )
      RETURNING *
    `;
    
    const values = [
      client_quotation_id, version_number, change_type || 'Revision', change_category,
      change_description, change_reason, change_requested_by, change_approved_by,
      contract_value_before, contract_value_after, value_change,
      total_area_before, total_area_after,
      completion_date_before, completion_date_after, scope_changes, material_changes,
      specification_changes, additional_work_details, cost_impact, time_impact_days,
      resource_impact, client_approval_required !== false, client_approved || false,
      client_approval_date, client_signature_path, change_order_number, change_order_date,
      change_order_file_path, change_status || 'Proposed', implementation_date,
      implementation_notes, change_documentation_path, supporting_drawings_path,
      cost_analysis_path, created_by, history_notes, internal_notes, client_communication_notes
    ];

    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Quotation history created successfully',
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

// Update quotation history entry
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  try {
    // Calculate value change if both values present
    const value_change = data.contract_value_after && data.contract_value_before 
      ? data.contract_value_after - data.contract_value_before 
      : null;

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'change_type', 'change_category', 'change_description', 'change_reason',
      'change_requested_by', 'change_approved_by', 'contract_value_before',
      'contract_value_after', 'total_area_before', 'total_area_after',
      'completion_date_before', 'completion_date_after', 'scope_changes',
      'material_changes', 'specification_changes', 'additional_work_details',
      'cost_impact', 'time_impact_days', 'resource_impact', 'client_approval_required',
      'client_approved', 'client_approval_date', 'client_signature_path',
      'change_order_number', 'change_order_date', 'change_order_file_path',
      'change_status', 'implementation_date', 'implementation_notes',
      'change_documentation_path', 'supporting_drawings_path', 'cost_analysis_path',
      'history_notes', 'internal_notes', 'client_communication_notes'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    });

    // Add value_change if calculated
    if (value_change !== null) {
      updates.push(`value_change = $${paramCount}`);
      values.push(value_change);
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
      UPDATE client_quotation_history 
      SET ${updates.join(', ')}
      WHERE history_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Quotation history entry not found" 
      });
    }

    res.json({
      success: true,
      message: 'Quotation history updated successfully',
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

// Update change status
router.patch('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { change_status } = req.body;

  const validStatuses = ['Proposed', 'Under_Review', 'Client_Approval_Pending', 'Approved', 'Rejected', 'Implemented'];
  if (!change_status || !validStatuses.includes(change_status)) {
    return res.status(400).json({ 
      success: false,
      error: `Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  try {
    const result = await db.query(
      'UPDATE client_quotation_history SET change_status = $1 WHERE history_id = $2 RETURNING *',
      [change_status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Quotation history entry not found" 
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
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

// Delete quotation history entry
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM client_quotation_history WHERE history_id = $1 RETURNING history_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Quotation history entry not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Quotation history entry deleted successfully" 
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
