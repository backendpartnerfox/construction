const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Quotations
 *   description: API for managing client quotations
 */

// Get all client quotations
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query(`
      SELECT 
        cq.*,
        c.client_name,
        c.email as client_email,
        c.phone as client_phone,
        cr.requirement_title
      FROM client_quotations cq
      LEFT JOIN clients c ON cq.client_id = c.client_id
      LEFT JOIN client_requirements cr ON cq.client_requirement_id = cr.client_requirement_id
      ORDER BY cq.created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} client quotations`);
    res.json({ success: true, data: result.rows });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ success: false, error: queryErr.message });
  }
});

// Get client quotations by client ID
router.get('/client/:clientId', async (req, res) => {
  const db = req.db;
  const { clientId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cq.*,
        cr.requirement_title
      FROM client_quotations cq
      LEFT JOIN client_requirements cr ON cq.client_requirement_id = cr.client_requirement_id
      WHERE cq.client_id = $1
      ORDER BY cq.created_at DESC
    `, [clientId]);
    
    console.log(`Found ${result.rows.length} quotations for client ${clientId}`);
    res.json({ success: true, data: result.rows });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ success: false, error: queryErr.message });
  }
});

// Get client quotation by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        cq.*,
        c.client_name,
        c.email as client_email,
        c.phone as client_phone,
        cr.requirement_title
      FROM client_quotations cq
      LEFT JOIN clients c ON cq.client_id = c.client_id
      LEFT JOIN client_requirements cr ON cq.client_requirement_id = cr.client_requirement_id
      WHERE cq.client_quotation_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Client quotation not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client quotation
router.post('/', async (req, res) => {
  const db = req.db;
  const data = req.body;

  console.log('=== CLIENT QUOTATION CREATE DEBUG ===');
  console.log('Received data:', JSON.stringify(data, null, 2));

  // Validate required fields
  if (!data.client_id) {
    return res.status(400).json({ success: false, error: "client_id is required" });
  }

  try {
    // Get or create requirement
    let requirementId = data.client_requirement_id;
    
    if (!requirementId) {
      const existingReq = await db.query(
        'SELECT client_requirement_id FROM client_requirements WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1',
        [data.client_id]
      );
      
      if (existingReq.rows.length > 0) {
        requirementId = existingReq.rows[0].client_requirement_id;
        console.log('Using existing requirement:', requirementId);
      } else {
        console.log('Creating default requirement for client:', data.client_id);
        const defaultReq = await db.query(`
          INSERT INTO client_requirements (
            client_id, 
            requirement_title, 
            requirement_description,
            status
          ) VALUES ($1, $2, $3, $4) 
          RETURNING client_requirement_id
        `, [
          data.client_id,
          'Default Requirement',
          'Auto-generated for quotation',
          'Draft'
        ]);
        
        requirementId = defaultReq.rows[0].client_requirement_id;
        console.log('Created default requirement:', requirementId);
      }
    }

    // Generate quotation number
    let quotation_number = data.quotation_number || data.client_quotation_number;
    if (!quotation_number) {
      const yearPrefix = new Date().getFullYear();
      const countResult = await db.query(
        `SELECT client_quotation_number FROM client_quotations 
         WHERE client_quotation_number LIKE $1 
         ORDER BY client_quotation_number DESC LIMIT 1`,
        [`CQ-${yearPrefix}-%`]
      );
      
      let nextNum = 1;
      if (countResult.rows.length > 0) {
        const lastNumber = countResult.rows[0].client_quotation_number;
        const matches = lastNumber.match(/-([0-9]+)$/);
        if (matches && matches[1]) {
          nextNum = parseInt(matches[1]) + 1;
        }
      }
      
      quotation_number = `CQ-${yearPrefix}-${String(nextNum).padStart(3, '0')}`;
    }

    // Get prepared_by user
    let preparedBy = data.prepared_by || null;
    if (!preparedBy) {
      try {
        const userQuery = await db.query('SELECT employee_id FROM employees ORDER BY employee_id LIMIT 1');
        if (userQuery.rows.length > 0) {
          preparedBy = userQuery.rows[0].employee_id;
        } else {
          preparedBy = 1;
        }
      } catch (err) {
        console.log('Using default prepared_by = 1');
        preparedBy = 1;
      }
    }

    console.log('Inserting quotation with:');
    console.log('- client_id:', data.client_id);
    console.log('- requirement_id:', requirementId);
    console.log('- quotation_number:', quotation_number);
    console.log('- prepared_by:', preparedBy);

    const query = `
      INSERT INTO client_quotations (
        client_id,
        client_requirement_id,
        client_quotation_number,
        quotation_date,
        valid_until,
        version_number,
        project_title,
        package_type,
        package_rate_per_sqft,
        habitable_area,
        balcony_area,
        stilt_area,
        terrace_area,
        gst_percentage,
        status,
        preparation_notes,
        prepared_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;
    
    const values = [
      parseInt(data.client_id),
      requirementId,
      quotation_number,
      data.quotation_date || new Date(),
      data.valid_until || new Date(new Date().setDate(new Date().getDate() + 30)),
      data.version_number || 1,
      data.project_title || data.package_name || 'Quotation',
      data.package_type || data.package_name || 'Standard',
      parseFloat(data.package_rate_per_sqft || data.package_rate) || 0,
      parseFloat(data.habitable_area) || 0,
      parseFloat(data.balcony_area) || 0,
      parseFloat(data.stilt_area) || 0,
      parseFloat(data.terrace_area) || 0,
      parseFloat(data.gst_percentage) || 18.00,
      data.status || 'Draft',
      data.remarks || data.preparation_notes || null,
      preparedBy
    ];

    console.log('Executing with values:', values);
    const result = await db.query(query, values);
    
    console.log('✅ Quotation created successfully:', result.rows[0].client_quotation_id);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    
    if (err.code === '23502') {
      return res.status(400).json({ 
        success: false,
        error: "Required field missing", 
        details: err.message,
        column: err.column
      });
    }
    
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false,
        error: "Foreign key constraint violation", 
        details: err.message,
        hint: "Please ensure the referenced client or requirement exists"
      });
    }
    
    if (err.code === '23505') {
      return res.status(400).json({ 
        success: false,
        error: "Duplicate quotation number", 
        details: err.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: err.message,
      code: err.code 
    });
  }
});

// Update client quotation
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  console.log('=== CLIENT QUOTATION UPDATE DEBUG ===');
  console.log('Updating quotation ID:', id);
  console.log('Update data:', JSON.stringify(data, null, 2));

  if (!data.client_id) {
    return res.status(400).json({ success: false, error: "client_id is required" });
  }

  try {
    // Check if quotation exists
    const checkResult = await db.query(
      'SELECT client_quotation_id FROM client_quotations WHERE client_quotation_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }

    // Build update query with only the fields that can be updated
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Only update fields that are provided
    if (data.client_requirement_id !== undefined) {
      updateFields.push(`client_requirement_id = $${paramCount}`);
      values.push(data.client_requirement_id);
      paramCount++;
    }

    if (data.quotation_number !== undefined) {
      updateFields.push(`client_quotation_number = $${paramCount}`);
      values.push(data.quotation_number);
      paramCount++;
    }

    if (data.quotation_date !== undefined) {
      updateFields.push(`quotation_date = $${paramCount}`);
      values.push(data.quotation_date);
      paramCount++;
    }

    if (data.valid_until !== undefined) {
      updateFields.push(`valid_until = $${paramCount}`);
      values.push(data.valid_until);
      paramCount++;
    }

    if (data.package_name !== undefined) {
      updateFields.push(`project_title = $${paramCount}`);
      values.push(data.package_name);
      paramCount++;
    }

    if (data.package_type !== undefined) {
      updateFields.push(`package_type = $${paramCount}`);
      values.push(data.package_type);
      paramCount++;
    }

    if (data.package_rate !== undefined) {
      updateFields.push(`package_rate_per_sqft = $${paramCount}`);
      values.push(parseFloat(data.package_rate));
      paramCount++;
    }

    if (data.habitable_area !== undefined) {
      updateFields.push(`habitable_area = $${paramCount}`);
      values.push(parseFloat(data.habitable_area) || 0);
      paramCount++;
    }

    if (data.balcony_area !== undefined) {
      updateFields.push(`balcony_area = $${paramCount}`);
      values.push(parseFloat(data.balcony_area) || 0);
      paramCount++;
    }

    if (data.stilt_area !== undefined) {
      updateFields.push(`stilt_area = $${paramCount}`);
      values.push(parseFloat(data.stilt_area) || 0);
      paramCount++;
    }

    if (data.terrace_area !== undefined) {
      updateFields.push(`terrace_area = $${paramCount}`);
      values.push(parseFloat(data.terrace_area) || 0);
      paramCount++;
    }

    if (data.status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(data.status);
      paramCount++;
    }

    if (data.remarks !== undefined) {
      updateFields.push(`preparation_notes = $${paramCount}`);
      values.push(data.remarks);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add ID as last parameter
    values.push(id);

    const query = `
      UPDATE client_quotations 
      SET ${updateFields.join(', ')}
      WHERE client_quotation_id = $${paramCount}
      RETURNING *
    `;

    console.log('Update query:', query);
    console.log('Update values:', values);

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }

    console.log('✅ Quotation updated successfully:', result.rows[0].client_quotation_id);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ Update error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    
    res.status(500).json({ 
      success: false, 
      error: err.message,
      code: err.code
    });
  }
});

// Update status
router.patch('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Draft', 'Under_Review', 'Client_Review', 'Approved', 'Contract_Signed', 'Active', 'Completed', 'Cancelled', 'Sent'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: `Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  try {
    const result = await db.query(
      'UPDATE client_quotations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE client_quotation_id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Status update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send quotation
router.patch('/:id/send', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE client_quotations 
       SET status = 'Sent', 
           sent_to_client_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE client_quotation_id = $1 
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }

    res.json({ success: true, message: 'Quotation sent successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Send error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete quotation
// Handles the full dependency chain:
//  1. Deletes any client_quotation_history rows referencing this quotation
//  2. Nullifies or promotes sibling version rows that reference this one
//     - If the deleted row is the current version and a previous version exists,
//       promote the previous version back to current
//     - Any row with previous_version_id = this.id gets that FK cleared
//     - Any row with superseded_by = this.id gets that FK cleared
//  3. Deletes the quotation itself
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  console.log('=== CLIENT QUOTATION DELETE ===');
  console.log('Deleting quotation ID:', id);

  try {
    await db.query('BEGIN');

    // Fetch the row first so we know what we're dealing with
    const currentResult = await db.query(
      'SELECT * FROM client_quotations WHERE client_quotation_id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const row = currentResult.rows[0];

    // 1. Delete history rows for this quotation
    await db.query(
      'DELETE FROM client_quotation_history WHERE client_quotation_id = $1',
      [id]
    );

    // 2a. If deleting the CURRENT version and a previous version exists,
    //     promote that previous version back to current.
    if (row.is_current_version && row.previous_version_id) {
      await db.query(
        `UPDATE client_quotations
            SET is_current_version = TRUE,
                superseded_by = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE client_quotation_id = $1`,
        [row.previous_version_id]
      );
    }

    // 2b. Clear any sibling rows that point back at this row.
    await db.query(
      'UPDATE client_quotations SET previous_version_id = NULL WHERE previous_version_id = $1',
      [id]
    );
    await db.query(
      'UPDATE client_quotations SET superseded_by = NULL WHERE superseded_by = $1',
      [id]
    );

    // 3. Delete the quotation itself
    const delResult = await db.query(
      'DELETE FROM client_quotations WHERE client_quotation_id = $1 RETURNING client_quotation_id, client_quotation_number',
      [id]
    );

    await db.query('COMMIT');
    console.log('✅ Quotation deleted:', delResult.rows[0]);
    res.json({
      success: true,
      message: 'Quotation deleted successfully',
      data: delResult.rows[0]
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('❌ Delete error:', err.message, err.code);

    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete: this quotation is still referenced by another record. Remove the dependent record first.',
        details: err.detail || err.message
      });
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Create new version of a client quotation
// POST /:id/version
// body: { notes, change_reason, scope_changes, material_changes, specification_changes, client_feedback }
// ============================================================
// Copies the current quotation into a new row with version_number + 1,
// marks the current row as superseded, and records a history entry.
// ============================================================
router.post('/:id/version', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    notes = '',
    change_reason = '',
    change_description = '',
    scope_changes = '',
    material_changes = '',
    specification_changes = '',
    client_feedback = '',
    change_requested_by = 'Client'
  } = req.body || {};

  console.log('=== CREATE CLIENT QUOTATION VERSION ===');
  console.log('Source quotation ID:', id);

  try {
    await db.query('BEGIN');

    // 1. Fetch the source quotation
    const currentResult = await db.query(
      'SELECT * FROM client_quotations WHERE client_quotation_id = $1',
      [id]
    );
    if (currentResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Client quotation not found' });
    }
    const current = currentResult.rows[0];

    // 2. Guard: only allow versioning from the current version
    if (current.is_current_version === false) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cannot create a new version from a superseded quotation. Open the current version and try again.'
      });
    }

    // 3. Compute new version number and unique quotation number
    const newVersionNumber = (current.version_number || 1) + 1;
    const baseNumber = (current.client_quotation_number || `CQ-${id}`).replace(/-v\d+$/i, '');
    let newQuotationNumber = `${baseNumber}-v${newVersionNumber}`;

    const collisionCheck = await db.query(
      'SELECT 1 FROM client_quotations WHERE client_quotation_number = $1',
      [newQuotationNumber]
    );
    if (collisionCheck.rows.length > 0) {
      newQuotationNumber = `${newQuotationNumber}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Insert the new version. All editable fields are copied.
    //    Generated columns (base_package_amount, subtotal, gst_amount, contract_value, value_change)
    //    are excluded — PostgreSQL will recompute them.
    const insertResult = await db.query(
      `INSERT INTO client_quotations (
        client_id, client_requirement_id, lead_quotation_id,
        client_quotation_number, quotation_date, valid_until, version_number, quotation_type,
        project_title, project_scope, site_area, built_up_area, construction_type,
        package_type, package_rate_per_sqft,
        habitable_area, balcony_area, stilt_area, terrace_area,
        electrical_work_amount, plumbing_work_amount, finishing_work_amount,
        special_features_amount, miscellaneous_amount,
        variation_amount, additional_work_amount, discount_amount,
        gst_percentage, advance_percentage, payment_schedule,
        project_start_date, estimated_completion_date, contract_duration_months,
        terms_conditions, scope_of_work, inclusions, exclusions, assumptions,
        delay_penalty_percentage, early_completion_bonus_percentage, quality_standards,
        status, is_current_version, previous_version_id,
        original_contract_value,
        prepared_by, reviewed_by,
        preparation_notes
      ) VALUES (
        $1, $2, $3,
        $4, CURRENT_DATE, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23,
        $24, $25, $26,
        $27, $28, $29,
        $30, $31, $32,
        $33, $34, $35, $36, $37,
        $38, $39, $40,
        'Draft', TRUE, $41,
        $42,
        $43, $44,
        $45
      ) RETURNING *`,
      [
        current.client_id, current.client_requirement_id, current.lead_quotation_id,
        newQuotationNumber, current.valid_until, newVersionNumber, current.quotation_type || 'Variation',
        current.project_title, current.project_scope, current.site_area, current.built_up_area, current.construction_type,
        current.package_type, current.package_rate_per_sqft,
        current.habitable_area, current.balcony_area, current.stilt_area, current.terrace_area,
        current.electrical_work_amount, current.plumbing_work_amount, current.finishing_work_amount,
        current.special_features_amount, current.miscellaneous_amount,
        current.variation_amount, current.additional_work_amount, current.discount_amount,
        current.gst_percentage, current.advance_percentage, current.payment_schedule,
        current.project_start_date, current.estimated_completion_date, current.contract_duration_months,
        current.terms_conditions, current.scope_of_work, current.inclusions, current.exclusions, current.assumptions,
        current.delay_penalty_percentage, current.early_completion_bonus_percentage, current.quality_standards,
        current.client_quotation_id,
        current.original_contract_value || current.contract_value,
        current.prepared_by, current.reviewed_by,
        notes || current.preparation_notes
      ]
    );
    const newVersion = insertResult.rows[0];

    // 5. Mark the old row as superseded
    await db.query(
      `UPDATE client_quotations
         SET is_current_version = FALSE,
             superseded_by = $1,
             updated_at = CURRENT_TIMESTAMP
       WHERE client_quotation_id = $2`,
      [newVersion.client_quotation_id, current.client_quotation_id]
    );

    // 6. Total area for history snapshot
    const areaFloat = v => parseFloat(v) || 0;
    const totalAreaBefore =
      areaFloat(current.habitable_area) +
      areaFloat(current.balcony_area) +
      areaFloat(current.stilt_area) +
      areaFloat(current.terrace_area);
    const totalAreaAfter =
      areaFloat(newVersion.habitable_area) +
      areaFloat(newVersion.balcony_area) +
      areaFloat(newVersion.stilt_area) +
      areaFloat(newVersion.terrace_area);

    // 7. Write a history record on the NEW version
    //    (UNIQUE(client_quotation_id, version_number))
    try {
      await db.query(
        `INSERT INTO client_quotation_history (
          client_quotation_id, version_number,
          change_type, change_category, change_description, change_reason,
          change_requested_by,
          contract_value_before, contract_value_after,
          total_area_before, total_area_after,
          completion_date_before, completion_date_after,
          scope_changes, material_changes, specification_changes,
          change_status, client_approval_required, created_by,
          history_notes
        ) VALUES (
          $1, $2,
          'Modified', 'Price_Change', $3, $4,
          $5,
          $6, $7,
          $8, $9,
          $10, $11,
          $12, $13, $14,
          'Proposed', TRUE, $15,
          $16
        )`,
        [
          newVersion.client_quotation_id,
          newVersionNumber,
          change_description || `Version v${newVersionNumber} created from v${current.version_number || 1}`,
          change_reason || notes || null,
          change_requested_by,
          current.contract_value || null,
          newVersion.contract_value || null,
          totalAreaBefore,
          totalAreaAfter,
          current.estimated_completion_date || null,
          newVersion.estimated_completion_date || null,
          scope_changes || null,
          material_changes || null,
          specification_changes || null,
          newVersion.prepared_by,
          notes || client_feedback || null
        ]
      );
    } catch (histErr) {
      // Don't fail the whole operation if history insert fails
      console.warn('History insert failed (non-fatal):', histErr.message);
    }

    await db.query('COMMIT');
    console.log('✅ New client quotation version created:', newVersion.client_quotation_number);

    res.status(201).json({
      success: true,
      message: `Version v${newVersionNumber} created successfully`,
      data: newVersion
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('❌ Error creating version:', err.message, err.stack);
    res.status(500).json({ success: false, error: err.message, code: err.code });
  }
});

module.exports = router;
