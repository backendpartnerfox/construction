const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Purchase Order management API
 */

// Get all POs (with optional filters)
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, vendor_id, status, from_date, to_date } = req.query;
  
  try {
    // purchase_orders has no project_id column — project link is via modules.
    // So we JOIN po -> modules -> projects.
    let query = `
      SELECT
        po.*,
        m.project_id AS project_id,
        p.project_name,
        v.vendor_name,
        v.contact_person,
        v.contact_number,
        COUNT(DISTINCT poi.po_line_id) as item_count
      FROM purchase_orders po
      LEFT JOIN modules m ON po.module_id = m.module_id
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN vendors v ON po.vendor_id = v.vendor_id
      LEFT JOIN po_line_items poi ON po.po_id = poi.po_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (project_id) {
      query += ` AND m.project_id = $${paramIndex}`;
      params.push(project_id);
      paramIndex++;
    }
    
    if (vendor_id) {
      query += ` AND po.vendor_id = $${paramIndex}`;
      params.push(vendor_id);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND po.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (from_date) {
      query += ` AND po.po_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      query += ` AND po.po_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += `
      GROUP BY po.po_id, m.project_id, p.project_name, v.vendor_name, v.contact_person, v.contact_number
      ORDER BY po.created_at DESC
    `;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching POs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get PO by ID with items
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Get PO header — project link via modules chain.
    const poResult = await db.query(`
      SELECT
        po.*,
        m.project_id AS project_id,
        p.project_name,
        v.vendor_name,
        v.contact_person,
        v.contact_number,
        v.email as vendor_email,
        v.address as vendor_address
      FROM purchase_orders po
      LEFT JOIN modules m ON po.module_id = m.module_id
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN vendors v ON po.vendor_id = v.vendor_id
      WHERE po.po_id = $1
    `, [id]);
    
    if (poResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Purchase Order not found'
      });
    }
    
    // Get PO items
    const itemsResult = await db.query(`
      SELECT 
        poi.*,
        i.item_name,
        ic.display_name as choice_name,
        ic.brand,
        ic.series
      FROM purchase_order_items poi
      LEFT JOIN items i ON poi.item_id = i.item_id
      LEFT JOIN item_choices ic ON poi.choice_option_id = ic.choice_option_id
      WHERE poi.po_id = $1
      ORDER BY poi.po_item_id
    `, [id]);
    
    const po = poResult.rows[0];
    po.items = itemsResult.rows;
    
    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    console.error('Error fetching PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new PO. purchase_orders is keyed on module_id (project link is via
// modules), NOT project_id. Line-items live in po_line_items — inserted
// separately via /po_line_items.
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    module_id, work_order_id, po_number, vendor_id, po_date,
    expected_delivery_date, delivery_address,
    subtotal, tax_amount, total_amount, total_items,
    advance_percentage, advance_amount,
    payment_terms, partial_delivery_allowed,
    status, created_by, items,
  } = req.body;

  if (!module_id || !vendor_id || !po_number) {
    return res.status(400).json({ success: false, error: 'module_id, vendor_id and po_number are required' });
  }

  try {
    await db.query('BEGIN');
    const poResult = await db.query(
      `INSERT INTO purchase_orders (
         module_id, work_order_id, po_number, po_date, vendor_id,
         total_items, subtotal, tax_amount, total_amount,
         delivery_address, expected_delivery_date, partial_delivery_allowed,
         payment_terms, advance_percentage, advance_amount,
         status, created_by, created_at
       ) VALUES ($1,$2,$3,COALESCE($4::date, CURRENT_DATE),$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, COALESCE($16,'Draft'),$17, NOW())
       RETURNING *`,
      [
        module_id, work_order_id || null, po_number, po_date || null, vendor_id,
        total_items || 0, subtotal || 0, tax_amount || 0, total_amount || 0,
        delivery_address || null, expected_delivery_date || null, partial_delivery_allowed || false,
        payment_terms || null, advance_percentage || 0, advance_amount || 0,
        status, created_by || null,
      ]
    );
    const po = poResult.rows[0];

    // Optional: caller may include an items[] array — insert into po_line_items.
    if (Array.isArray(items)) {
      let lineNo = 1;
      for (const it of items) {
        await db.query(
          `INSERT INTO po_line_items (
             po_id, line_number, item_id, item_description, specifications,
             quantity, unit, unit_price, discount_percentage, tax_percentage,
             line_total, required_by_date
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            po.po_id, lineNo++,
            it.item_id, it.item_description || null, it.specifications || null,
            it.quantity, it.unit, it.unit_price,
            it.discount_percentage || 0, it.tax_percentage || 18,
            it.line_total || 0, it.required_by_date || null,
          ]
        );
      }
    }
    await db.query('COMMIT');
    res.status(201).json({ success: true, po_id: po.po_id, ...po });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update PO
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Only allow certain fields to be updated
    const allowedFields = [
      'expected_delivery_date', 'payment_terms', 'delivery_terms',
      'notes', 'terms_and_conditions'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE purchase_orders
      SET ${fields.join(', ')}
      WHERE po_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Purchase Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Purchase Order updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update PO Status
router.put('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status, notes, user_id } = req.body;
  
  const validStatuses = [
    'Draft', 'Pending Approval', 'Approved', 'Sent',
    'Acknowledged', 'In Transit', 'Delivered',
    'Partially Delivered', 'Cancelled', 'Closed'
  ];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status'
    });
  }
  
  try {
    await db.query('BEGIN');
    
    // Get current status
    const currentResult = await db.query(
      'SELECT status FROM purchase_orders WHERE po_id = $1',
      [id]
    );
    
    if (currentResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Purchase Order not found'
      });
    }
    
    const oldStatus = currentResult.rows[0].status;
    
    // Update status
    let updateQuery = 'UPDATE purchase_orders SET status = $1, updated_at = CURRENT_TIMESTAMP';
    let updateParams = [status];
    let paramIndex = 2;
    
    // Set approval fields if approving
    if (status === 'Approved') {
      updateQuery += `, approved_by = $${paramIndex}, approval_date = CURRENT_TIMESTAMP`;
      updateParams.push(user_id);
      paramIndex++;
    }
    
    // Set sent date if sending
    if (status === 'Sent') {
      updateQuery += `, sent_date = CURRENT_TIMESTAMP`;
    }
    
    // Set acknowledged date
    if (status === 'Acknowledged') {
      updateQuery += `, acknowledged_date = CURRENT_TIMESTAMP`;
    }
    
    // Set delivered date
    if (status === 'Delivered') {
      updateQuery += `, delivered_date = CURRENT_TIMESTAMP`;
    }
    
    // Set cancelled fields
    if (status === 'Cancelled') {
      updateQuery += `, cancelled_date = CURRENT_TIMESTAMP, cancelled_reason = $${paramIndex}`;
      updateParams.push(notes || 'Cancelled');
      paramIndex++;
    }
    
    updateQuery += ` WHERE po_id = $${paramIndex} RETURNING *`;
    updateParams.push(id);
    
    const updateResult = await db.query(updateQuery, updateParams);
    
    // Record status history
    await db.query(`
      INSERT INTO po_status_history (po_id, from_status, to_status, changed_by, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, oldStatus, status, user_id, notes]);
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: `PO status updated to ${status}`,
      data: updateResult.rows[0]
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating PO status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete PO (only if Draft)
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if PO is in Draft status
    const statusCheck = await db.query(
      'SELECT status FROM purchase_orders WHERE po_id = $1',
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Purchase Order not found'
      });
    }
    
    if (statusCheck.rows[0].status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Only Draft POs can be deleted'
      });
    }
    
    // Delete PO (items will be deleted by CASCADE)
    await db.query('DELETE FROM purchase_orders WHERE po_id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Purchase Order deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting PO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get PO items
router.get('/:id/items', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        poi.*,
        i.item_name,
        ic.display_name as choice_name,
        ic.brand,
        ic.series
      FROM purchase_order_items poi
      LEFT JOIN items i ON poi.item_id = i.item_id
      LEFT JOIN item_choices ic ON poi.choice_option_id = ic.choice_option_id
      WHERE poi.po_id = $1
      ORDER BY poi.po_item_id
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching PO items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get approved materials for PO creation
router.get('/approved-materials/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pmc.*,
        i.item_name,
        v.vendor_name,
        v.vendor_id,
        ic.display_name as choice_name,
        ic.brand,
        ic.series
      FROM project_material_costing pmc
      INNER JOIN items i ON pmc.item_id = i.item_id
      INNER JOIN vendors v ON pmc.vendor_id = v.vendor_id
      LEFT JOIN item_choices ic ON pmc.element_id = ic.choice_option_id
      WHERE pmc.project_id = $1
        AND pmc.status = 'Approved'
        AND pmc.costing_id NOT IN (
          SELECT material_costing_id 
          FROM purchase_order_items 
          WHERE material_costing_id IS NOT NULL
        )
      ORDER BY v.vendor_name, i.item_name
    `, [projectId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching approved materials:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
