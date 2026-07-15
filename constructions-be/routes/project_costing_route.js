const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Costing
 *   description: API for project costing and cost analysis
 */

/**
 * Get project costing summary
 * GET /api/project-costing/summary/:projectId
 */
router.get('/summary/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  console.log('💰 Fetching costing summary for project:', projectId);

  try {
    // Get BOQ totals
    const boqTotals = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as boq_total
      FROM (
        SELECT COALESCE(amount, 0) as amount FROM project_boq_structural WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(amount, 0) FROM project_boq_walls WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(total_price, 0) FROM project_boq_doors WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(total_price, 0) FROM project_boq_windows WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(total_price, 0) FROM project_boq_electrical WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(amount, 0) FROM project_boq_plumbing WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(amount, 0) FROM project_boq_flooring WHERE project_id = $1
        UNION ALL
        SELECT COALESCE(amount, 0) FROM project_boq_painting WHERE project_id = $1
      ) as all_boq
    `, [projectId]);

    // Get material costing totals
    const materialCosts = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(total_amount), 0) as total_material_cost,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(total_gst), 0) as total_gst
      FROM project_material_costing
      WHERE project_id = $1
    `, [projectId]);

    // Get project details
    const projectDetails = await db.query(`
      SELECT 
        project_name,
        estimated_budget,
        actual_cost,
        status as project_status
      FROM projects
      WHERE project_id = $1
    `, [projectId]);

    // Calculate summary
    const boqTotal = parseFloat(boqTotals.rows[0]?.boq_total || 0);
    const materialCostTotal = parseFloat(materialCosts.rows[0]?.total_material_cost || 0);
    const budget = parseFloat(projectDetails.rows[0]?.estimated_budget || 0);
    
    const summary = {
      projectId: parseInt(projectId),
      projectName: projectDetails.rows[0]?.project_name || '',
      budget: budget,
      
      boq: {
        total: boqTotal,
        percentage: budget > 0 ? ((boqTotal / budget) * 100).toFixed(2) : 0
      },
      
      materialCosts: {
        items: parseInt(materialCosts.rows[0]?.total_items || 0),
        subtotal: parseFloat(materialCosts.rows[0]?.subtotal || 0),
        gst: parseFloat(materialCosts.rows[0]?.total_gst || 0),
        total: materialCostTotal,
        percentage: budget > 0 ? ((materialCostTotal / budget) * 100).toFixed(2) : 0
      },
      
      variance: {
        amount: budget - boqTotal,
        percentage: budget > 0 ? (((budget - boqTotal) / budget) * 100).toFixed(2) : 0
      },
      
      status: projectDetails.rows[0]?.project_status || 'Active'
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (err) {
    console.error('❌ Error fetching costing summary:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch costing summary',
      details: err.message 
    });
  }
});

/**
 * Get material costing breakdown
 * GET /api/project-costing/materials/:projectId
 */
router.get('/materials/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    const materials = await db.query(`
      SELECT 
        pmc.*,
        i.item_name,
        v.vendor_name,
        v.contact_person,
        v.contact_number
      FROM project_material_costing pmc
      LEFT JOIN items i ON pmc.item_id = i.item_id
      LEFT JOIN vendors v ON pmc.vendor_id = v.vendor_id
      WHERE pmc.project_id = $1
      ORDER BY pmc.created_at DESC
    `, [projectId]);

    res.json({
      success: true,
      data: materials.rows
    });

  } catch (err) {
    console.error('Error fetching materials:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch materials',
      details: err.message 
    });
  }
});

/**
 * Get vendor comparison
 * GET /api/project-costing/vendor-comparison/:projectId/:itemId
 */
router.get('/vendor-comparison/:projectId/:itemId', async (req, res) => {
  const db = req.db;
  const { projectId, itemId } = req.params;

  try {
    const comparison = await db.query(`
      SELECT 
        pmc.costing_id,
        pmc.vendor_id,
        v.vendor_name,
        v.contact_person,
        pmc.unit_price,
        pmc.discount_percentage,
        pmc.unit_price_after_discount,
        pmc.gst_percentage,
        pmc.total_amount,
        pmc.quotation_reference,
        pmc.pricing_validity_date,
        pmc.is_approved,
        pmc.status
      FROM project_material_costing pmc
      JOIN vendors v ON pmc.vendor_id = v.vendor_id
      WHERE pmc.project_id = $1 AND pmc.item_id = $2
      ORDER BY pmc.unit_price_after_discount ASC
    `, [projectId, itemId]);

    res.json({
      success: true,
      data: comparison.rows
    });

  } catch (err) {
    console.error('Error fetching vendor comparison:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch vendor comparison',
      details: err.message 
    });
  }
});

/**
 * Add material costing
 * POST /api/project-costing/materials
 */
router.post('/materials', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    boq_id,
    item_id,
    vendor_id,
    boq_quantity,
    unit,
    unit_price,
    discount_percentage = 0,
    gst_percentage = 18,
    quotation_reference,
    pricing_validity_date,
    created_by,
    element_id
  } = req.body;

  console.log('💰 Adding material costing for project:', project_id);
  console.log('📋 BOQ ID received:', boq_id, 'Type:', typeof boq_id);

  try {
    // Check if boq_id has a valid value
    const hasBoqId = Boolean(
      boq_id && 
      boq_id !== '' && 
      boq_id !== 'null' && 
      boq_id !== 'undefined' &&
      !isNaN(parseInt(boq_id))
    );
    
    console.log('✅ Has valid BOQ ID?', hasBoqId);
    
    let query, values;
    
    if (hasBoqId) {
      console.log('Including boq_id in INSERT');
      // Include boq_id in query
      query = `
        INSERT INTO project_material_costing (
          project_id, boq_id, item_id, vendor_id, element_id,
          boq_quantity, unit, unit_price,
          discount_percentage, gst_percentage,
          quotation_reference, pricing_validity_date,
          status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      values = [
        project_id, 
        boq_id, 
        item_id, 
        vendor_id,
        element_id || 1,
        boq_quantity, 
        unit, 
        unit_price,
        discount_percentage, 
        gst_percentage,
        quotation_reference || null, 
        pricing_validity_date || null,
        'Pending', 
        created_by
      ];
    } else {
      console.log('Excluding boq_id from INSERT (not provided or invalid)');
      // Exclude boq_id from query
      query = `
        INSERT INTO project_material_costing (
          project_id, item_id, vendor_id, element_id,
          boq_quantity, unit, unit_price,
          discount_percentage, gst_percentage,
          quotation_reference, pricing_validity_date,
          status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      values = [
        project_id, 
        item_id, 
        vendor_id,
        element_id || 1,
        boq_quantity, 
        unit, 
        unit_price,
        discount_percentage, 
        gst_percentage,
        quotation_reference || null, 
        pricing_validity_date || null,
        'Pending', 
        created_by
      ];
    }

    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Material costing added successfully',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Error adding material costing:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add material costing',
      details: err.message 
    });
  }
});

/**
 * Approve material costing
 * PUT /api/project-costing/materials/:costingId/approve
 */
router.put('/materials/:costingId/approve', async (req, res) => {
  const db = req.db;
  const { costingId } = req.params;
  const { approved_by, approval_notes } = req.body;

  console.log('✅ Approving material costing:', costingId);
  console.log('Approved by:', approved_by, 'Notes:', approval_notes);

  try {
    // Handle notes properly - use empty string if null/undefined
    const notes = approval_notes || '';
    
    const result = await db.query(`
      UPDATE project_material_costing
      SET 
        status = 'Approved',
        approved_by = $1,
        approval_date = CURRENT_DATE,
        notes = CASE 
          WHEN notes IS NULL AND $2 = '' THEN NULL
          WHEN notes IS NULL THEN $2
          WHEN $2 = '' THEN notes
          ELSE notes || ' | ' || $2
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE costing_id = $3
      RETURNING *
    `, [approved_by, notes, costingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material costing not found'
      });
    }

    res.json({
      success: true,
      message: 'Material costing approved successfully',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error approving material costing:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve material costing',
      details: err.message 
    });
  }
});

/**
 * Reject material costing
 * PUT /api/project-costing/materials/:costingId/reject
 */
router.put('/materials/:costingId/reject', async (req, res) => {
  const db = req.db;
  const { costingId } = req.params;
  const { rejected_by, rejection_reason } = req.body;

  console.log('❌ Rejecting material costing:', costingId);
  console.log('Rejected by:', rejected_by, 'Reason:', rejection_reason);

  try {
    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const result = await db.query(`
      UPDATE project_material_costing
      SET 
        status = 'Rejected',
        approved_by = $1,
        approval_date = CURRENT_DATE,
        notes = CASE 
          WHEN notes IS NULL THEN 'REJECTED: ' || $2
          ELSE notes || ' | REJECTED: ' || $2
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE costing_id = $3
      RETURNING *
    `, [rejected_by, rejection_reason.trim(), costingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material costing not found'
      });
    }

    res.json({
      success: true,
      message: 'Material costing rejected',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error rejecting material costing:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject material costing',
      details: err.message 
    });
  }
});

/**
 * Update material status (generic)
 * PUT /api/project-costing/materials/:costingId/status
 */
router.put('/materials/:costingId/status', async (req, res) => {
  const db = req.db;
  const { costingId } = req.params;
  const { status, updated_by, notes } = req.body;

  console.log('🔄 Updating material status:', costingId, 'to', status);
  console.log('Updated by:', updated_by, 'Notes:', notes);

  try {
    // Validate status
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Handle notes and approved_by based on status
    let query;
    let values;

    if (status === 'Pending') {
      // Resetting to Pending
      const statusNotes = notes || 'Status reset to Pending';
      query = `
        UPDATE project_material_costing
        SET 
          status = $1::text,
          notes = CASE 
            WHEN notes IS NULL THEN $2::text
            ELSE notes || ' | ' || $2::text
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE costing_id = $3
        RETURNING *
      `;
      values = [status, statusNotes, costingId];
    } else {
      // Approving or Rejecting
      const statusNotes = notes || '';
      query = `
        UPDATE project_material_costing
        SET 
          status = $1::text,
          approved_by = $2,
          approval_date = CURRENT_DATE,
          notes = CASE 
            WHEN $3 = '' THEN notes
            WHEN notes IS NULL THEN $3::text
            ELSE notes || ' | ' || $3::text
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE costing_id = $4
        RETURNING *
      `;
      values = [status, updated_by, statusNotes, costingId];
    }

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material costing not found'
      });
    }

    res.json({
      success: true,
      message: `Material costing status updated to ${status}`,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error updating material status:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update material status',
      details: err.message 
    });
  }
});

/**
 * Get cost breakdown by category
 * GET /api/project-costing/breakdown/:projectId
 */
router.get('/breakdown/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;

  try {
    // Get module-wise BOQ costs
    const breakdown = {
      structural: 0,
      walls: 0,
      doors: 0,
      windows: 0,
      electrical: 0,
      plumbing: 0,
      flooring: 0,
      painting: 0
    };

    // Fetch from each BOQ table
    const structural = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM project_boq_structural WHERE project_id = $1`, [projectId]);
    const walls = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM project_boq_walls WHERE project_id = $1`, [projectId]);
    const doors = await db.query(`SELECT COALESCE(SUM(total_price), 0) as total FROM project_boq_doors WHERE project_id = $1`, [projectId]);
    const windows = await db.query(`SELECT COALESCE(SUM(total_price), 0) as total FROM project_boq_windows WHERE project_id = $1`, [projectId]);
    const electrical = await db.query(`SELECT COALESCE(SUM(total_price), 0) as total FROM project_boq_electrical WHERE project_id = $1`, [projectId]);
    const plumbing = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM project_boq_plumbing WHERE project_id = $1`, [projectId]);
    const flooring = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM project_boq_flooring WHERE project_id = $1`, [projectId]);
    const painting = await db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM project_boq_painting WHERE project_id = $1`, [projectId]);

    breakdown.structural = parseFloat(structural.rows[0].total);
    breakdown.walls = parseFloat(walls.rows[0].total);
    breakdown.doors = parseFloat(doors.rows[0].total);
    breakdown.windows = parseFloat(windows.rows[0].total);
    breakdown.electrical = parseFloat(electrical.rows[0].total);
    breakdown.plumbing = parseFloat(plumbing.rows[0].total);
    breakdown.flooring = parseFloat(flooring.rows[0].total);
    breakdown.painting = parseFloat(painting.rows[0].total);

    const grandTotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    res.json({
      success: true,
      data: {
        breakdown,
        grandTotal
      }
    });

  } catch (err) {
    console.error('Error fetching cost breakdown:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch cost breakdown',
      details: err.message 
    });
  }
});

/**
 * Delete material costing
 * DELETE /api/project-costing/materials/:costingId
 */
router.delete('/materials/:costingId', async (req, res) => {
  const db = req.db;
  const { costingId } = req.params;

  console.log('🗑️ Deleting material costing:', costingId);

  try {
    const result = await db.query(`
      DELETE FROM project_material_costing
      WHERE costing_id = $1
      RETURNING costing_id
    `, [costingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material costing not found'
      });
    }

    res.json({
      success: true,
      message: 'Material costing deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting material costing:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete material costing',
      details: err.message 
    });
  }
});

/**
 * Update material costing
 * PUT /api/project-costing/materials/:costingId
 */
router.put('/materials/:costingId', async (req, res) => {
  const db = req.db;
  const { costingId } = req.params;
  const {
    boq_quantity,
    unit,
    unit_price,
    discount_percentage,
    gst_percentage,
    quotation_reference,
    pricing_validity_date,
    updated_by
  } = req.body;

  console.log('🔄 Updating material costing:', costingId);

  try {
    // Do NOT calculate these - they are GENERATED columns
    // The database will auto-update:
    // - unit_price_after_discount
    // - subtotal  
    // - total_gst
    // - total_amount

    const result = await db.query(`
      UPDATE project_material_costing
      SET 
        boq_quantity = $1,
        unit = $2,
        unit_price = $3,
        discount_percentage = $4,
        gst_percentage = $5,
        quotation_reference = $6,
        pricing_validity_date = $7,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $8
      WHERE costing_id = $9
      RETURNING *
    `, [
      boq_quantity, 
      unit, 
      unit_price,
      discount_percentage,
      gst_percentage,
      quotation_reference,
      pricing_validity_date,
      updated_by, 
      costingId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material costing not found'
      });
    }

    res.json({
      success: true,
      message: 'Material costing updated successfully',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Error updating material costing:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update material costing',
      details: err.message 
    });
  }
});

module.exports = router;
