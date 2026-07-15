const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Lead Quotations
 *   description: API for managing lead quotations
 */

// Get all lead quotations
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM lead_quotations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get quotations by lead ID
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM lead_quotations WHERE lead_id = $1 ORDER BY created_at DESC',
      [parseInt(leadId)]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// Get single quotation by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM lead_quotations WHERE lead_quotation_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead quotation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create new quotation - IMPROVED WITH BETTER ERROR HANDLING
router.post('/', async (req, res) => {
  const db = req.db;
  const data = req.body;
  
  console.log('=== QUOTATION CREATE DEBUG ===');
  console.log('Received data:', JSON.stringify(data, null, 2));
  
  try {
    // Validate required fields
    if (!data.lead_id) {
      return res.status(400).json({ error: "lead_id is required" });
    }

    if (!data.quotation_title && !data.project_title) {
      return res.status(400).json({ error: "quotation_title or project_title is required" });
    }

    // Check if lead exists
    const leadCheck = await db.query('SELECT lead_id FROM leads WHERE lead_id = $1', [data.lead_id]);
    if (leadCheck.rows.length === 0) {
      return res.status(400).json({ error: `Lead with ID ${data.lead_id} does not exist` });
    }

    // FIXED: Get or create a requirement for this lead
    let requirementId = null;
    
    if (data.lead_requirement_id) {
      // Check if provided requirement exists and belongs to this lead
      const reqCheck = await db.query(
        'SELECT lead_requirement_id FROM lead_requirements WHERE lead_requirement_id = $1 AND lead_id = $2',
        [data.lead_requirement_id, data.lead_id]
      );
      if (reqCheck.rows.length > 0) {
        requirementId = data.lead_requirement_id;
        console.log('Using provided requirement:', requirementId);
      }
    }
    
    // If no valid requirement found, get the first requirement for this lead
    if (!requirementId) {
      const existingReq = await db.query(
        'SELECT lead_requirement_id FROM lead_requirements WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1',
        [data.lead_id]
      );
      
      if (existingReq.rows.length > 0) {
        requirementId = existingReq.rows[0].lead_requirement_id;
        console.log('Using existing requirement:', requirementId);
      } else {
        // Create a default requirement for this lead
        console.log('Creating default requirement for lead:', data.lead_id);
        
        try {
          const defaultReq = await db.query(`
            INSERT INTO lead_requirements (
              lead_id, 
              requirement_title, 
              requirement_description,
              status
            ) VALUES ($1, $2, $3, $4) 
            RETURNING lead_requirement_id
          `, [
            data.lead_id,
            'Default Requirement for Quotation',
            'Auto-generated requirement for quotation creation',
            'Draft'
          ]);
          
          requirementId = defaultReq.rows[0].lead_requirement_id;
          console.log('Created default requirement:', requirementId);
        } catch (reqErr) {
          console.error('Error creating default requirement:', reqErr.message);
          return res.status(500).json({ 
            error: 'Failed to create default requirement', 
            details: reqErr.message 
          });
        }
      }
    }

    // Generate unique quotation number
    let quotation_number;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      // Get the highest quotation number for this year
      const yearPrefix = new Date().getFullYear();
      const existingQuery = await db.query(
        `SELECT lead_quotation_number FROM lead_quotations 
         WHERE lead_quotation_number LIKE $1 
         ORDER BY lead_quotation_number DESC LIMIT 1`,
        [`LQ-${yearPrefix}-%`]
      );
      
      let nextNum = 1;
      if (existingQuery.rows.length > 0) {
        // Extract the number from the last quotation (e.g., "LQ-2025-003" -> 3)
        const lastNumber = existingQuery.rows[0].lead_quotation_number;
        const matches = lastNumber.match(/-([0-9]+)$/);
        if (matches && matches[1]) {
          nextNum = parseInt(matches[1]) + 1;
        }
      }
      
      quotation_number = `LQ-${yearPrefix}-${String(nextNum).padStart(3, '0')}`;
      
      // Check if this number already exists
      const checkUnique = await db.query(
        'SELECT lead_quotation_id FROM lead_quotations WHERE lead_quotation_number = $1',
        [quotation_number]
      );
      
      if (checkUnique.rows.length === 0) {
        isUnique = true;
      } else {
        attempts++;
        // If number exists, try with timestamp to make it unique
        if (attempts >= maxAttempts - 1) {
          quotation_number = `LQ-${yearPrefix}-${String(nextNum).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
          isUnique = true;
        }
      }
    }

    console.log('Final values:');
    console.log('- lead_id:', data.lead_id);
    console.log('- requirement_id:', requirementId);
    console.log('- quotation_number:', quotation_number);

    // Get a valid user for prepared_by (required field)
    let preparedBy = data.prepared_by || null;
    
    // If not provided, try to get from authenticated user or use a default
    if (!preparedBy) {
      // Try to get first available user ID
      try {
        const userQuery = await db.query('SELECT user_id FROM users ORDER BY user_id LIMIT 1');
        if (userQuery.rows.length > 0) {
          preparedBy = userQuery.rows[0].user_id;
        } else {
          // If no users exist, set to 1 as default
          preparedBy = 1;
        }
      } catch (err) {
        console.log('Could not fetch user, using default prepared_by = 1');
        preparedBy = 1;
      }
    }
    
    console.log('- prepared_by:', preparedBy);

    // Insert quotation with valid requirement_id
    const query = `
      INSERT INTO lead_quotations (
        lead_id, 
        lead_requirement_id,
        lead_quotation_number, 
        project_title,
        quotation_date,
        package_type,
        package_rate_per_sqft,
        habitable_area,
        balcony_area,
        stilt_area,
        terrace_area,
        electrical_additional,
        plumbing_additional,
        finishing_additional,
        special_features_amount,
        miscellaneous_amount,
        discount_amount,
        gst_percentage,
        advance_percentage,
        estimated_duration_months,
        prepared_by,
        status,
        terms_conditions,
        inclusions,
        exclusions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *
    `;
    
    const values = [
      parseInt(data.lead_id),                                    // $1
      requirementId,                                             // $2 - FIXED: Always provide valid requirement_id
      quotation_number,                                          // $3
      data.quotation_title || data.project_title || 'Quotation', // $4
      data.quotation_date || new Date(),                         // $5
      data.package_type || 'Standard',                           // $6
      parseFloat(data.package_rate_per_sqft) || 0,               // $7
      parseFloat(data.habitable_area) || 0,                      // $8
      parseFloat(data.balcony_area) || 0,                        // $9
      parseFloat(data.stilt_area) || 0,                          // $10
      parseFloat(data.terrace_area) || 0,                        // $11
      parseFloat(data.electrical_additional) || 0,               // $12
      parseFloat(data.plumbing_additional) || 0,                 // $13
      parseFloat(data.finishing_additional) || 0,                // $14
      parseFloat(data.special_features_amount) || 0,             // $15
      parseFloat(data.miscellaneous_amount) || 0,                // $16
      parseFloat(data.discount_amount) || 0,                     // $17
      parseFloat(data.gst_percentage) || 18.00,                  // $18
      parseFloat(data.advance_percentage) || 20.00,              // $19
      parseInt(data.estimated_duration_months) || null,          // $20
      preparedBy,                                                // $21 - FIXED: Always provide prepared_by
      'Draft',                                                   // $22
      data.terms_conditions || null,                             // $23
      data.inclusions || null,                                   // $24
      data.exclusions || null                                    // $25
    ];

    console.log('Executing query with values:', values);

    const result = await db.query(query, values);
    
    console.log('✅ Quotation created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error code:', err.code);
    
    if (err.code === '23502') {
      return res.status(400).json({ 
        error: "Required field missing", 
        details: err.message,
        column: err.column
      });
    }
    
    if (err.code === '23503') {
      return res.status(400).json({ 
        error: "Foreign key constraint violation", 
        details: err.message
      });
    }
    
    res.status(500).json({ 
      error: err.message,
      code: err.code 
    });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;

  try {
    const query = `
      UPDATE lead_quotations 
      SET 
        project_title = $1,
        package_type = $2,
        package_rate_per_sqft = $3,
        habitable_area = $4,
        balcony_area = $5,
        stilt_area = $6,
        terrace_area = $7,
        gst_percentage = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE lead_quotation_id = $9
      RETURNING *
    `;
    
    const values = [
      data.quotation_title || data.project_title,
      data.package_type || 'Standard',
      parseFloat(data.package_rate_per_sqft) || 0,
      parseFloat(data.habitable_area) || 0,
      parseFloat(data.balcony_area) || 0,
      parseFloat(data.stilt_area) || 0,
      parseFloat(data.terrace_area) || 0,
      parseFloat(data.gst_percentage) || 18,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead quotation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete quotation
// Handles the full dependency chain:
//  1. Deletes any lead_quotation_history rows referencing this quotation
//  2. Nullifies or promotes sibling version rows that reference this one
//     - If the deleted row is the current version and a previous version exists,
//       promote the previous version back to current
//     - Any row with previous_version_id = this.id gets that FK cleared
//     - Any row with superseded_by = this.id gets that FK cleared
//  3. Deletes the quotation itself
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    // Fetch the row first so we know what we're dealing with
    const currentResult = await db.query(
      'SELECT * FROM lead_quotations WHERE lead_quotation_id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead quotation not found' });
    }

    const row = currentResult.rows[0];

    // 1. Delete history rows for this quotation (FK: lead_quotation_history.lead_quotation_id)
    await db.query(
      'DELETE FROM lead_quotation_history WHERE lead_quotation_id = $1',
      [id]
    );

    // 2a. If deleting the CURRENT version and a previous version exists,
    //     promote that previous version back to current.
    if (row.is_current_version && row.previous_version_id) {
      await db.query(
        `UPDATE lead_quotations
            SET is_current_version = TRUE,
                superseded_by = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE lead_quotation_id = $1`,
        [row.previous_version_id]
      );
    }

    // 2b. Clear any sibling rows that point back at this row.
    await db.query(
      'UPDATE lead_quotations SET previous_version_id = NULL WHERE previous_version_id = $1',
      [id]
    );
    await db.query(
      'UPDATE lead_quotations SET superseded_by = NULL WHERE superseded_by = $1',
      [id]
    );

    // 3. Delete the quotation itself
    const delResult = await db.query(
      'DELETE FROM lead_quotations WHERE lead_quotation_id = $1 RETURNING lead_quotation_id',
      [id]
    );

    if (delResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead quotation not found' });
    }

    await db.query('COMMIT');
    console.log('✅ Quotation deleted:', id);
    res.json({
      success: true,
      message: 'Lead quotation deleted successfully',
      deleted_id: parseInt(id)
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('❌ Delete quotation error:', err.message, err.code);

    // Surface a friendlier message for FK violations that we didn't anticipate
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Cannot delete: this quotation is still referenced by another record. Remove the dependent record first.',
        details: err.detail || err.message
      });
    }

    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Update quotation status
router.patch('/:id/status', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status, feedback } = req.body;

  try {
    const query = `
      UPDATE lead_quotations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE lead_quotation_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead quotation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Send quotation
router.post('/:id/send', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const query = `
      UPDATE lead_quotations 
      SET status = 'Sent', sent_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
      WHERE lead_quotation_id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead quotation not found" });
    }

    res.json({ 
      message: 'Quotation sent successfully',
      data: result.rows[0] 
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Create new version of a quotation
// POST /:id/version
// body: { notes, reason_for_change, changes_made, client_feedback }
// ============================================================
// Copies the current quotation into a new row with version_number + 1,
// marks the current row as superseded, and records a history entry.
// ============================================================
router.post('/:id/version', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    notes = '',
    reason_for_change = '',
    changes_made = '',
    client_feedback = ''
  } = req.body || {};

  console.log('=== CREATE QUOTATION VERSION ===');
  console.log('Source quotation ID:', id);

  try {
    await db.query('BEGIN');

    // 1. Fetch the source quotation
    const currentResult = await db.query(
      'SELECT * FROM lead_quotations WHERE lead_quotation_id = $1',
      [id]
    );
    if (currentResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead quotation not found' });
    }
    const current = currentResult.rows[0];

    // 2. Guard: only allow versioning from the current version
    if (current.is_current_version === false) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cannot create a new version from a superseded quotation. Open the current version and try again.'
      });
    }

    // 3. Compute new version number and unique quotation number
    const newVersionNumber = (current.version_number || 1) + 1;
    const baseNumber = (current.lead_quotation_number || `LQ-${id}`).replace(/-v\d+$/i, '');
    let newQuotationNumber = `${baseNumber}-v${newVersionNumber}`;

    // In the unlikely event the generated number collides, append a timestamp tail
    const collisionCheck = await db.query(
      'SELECT 1 FROM lead_quotations WHERE lead_quotation_number = $1',
      [newQuotationNumber]
    );
    if (collisionCheck.rows.length > 0) {
      newQuotationNumber = `${newQuotationNumber}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Insert the new version (copy all editable fields from the current row).
    //    Generated columns (package_construction_amount, base_construction_amount, total_amount)
    //    are intentionally excluded — PostgreSQL will recompute them.
    const insertResult = await db.query(
      `INSERT INTO lead_quotations (
        lead_id, lead_requirement_id, enquiry_quotation_id,
        lead_quotation_number, quotation_date, valid_until, version_number,
        project_title, project_scope,
        site_area, built_up_area, construction_type, number_of_floors,
        package_type, package_rate_per_sqft,
        habitable_area, balcony_area, stilt_area, terrace_area,
        electrical_additional, plumbing_additional, finishing_additional,
        special_features_amount, miscellaneous_amount, discount_amount,
        gst_percentage, advance_percentage, estimated_duration_months,
        status, is_current_version, previous_version_id,
        prepared_by,
        terms_conditions, inclusions, exclusions, payment_terms,
        preparation_notes
      ) VALUES (
        $1, $2, $3,
        $4, CURRENT_DATE, $5, $6,
        $7, $8,
        $9, $10, $11, $12,
        $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24,
        $25, $26, $27,
        'Draft', TRUE, $28,
        $29,
        $30, $31, $32, $33,
        $34
      ) RETURNING *`,
      [
        current.lead_id, current.lead_requirement_id, current.enquiry_quotation_id,
        newQuotationNumber, current.valid_until, newVersionNumber,
        current.project_title, current.project_scope,
        current.site_area, current.built_up_area, current.construction_type, current.number_of_floors,
        current.package_type, current.package_rate_per_sqft,
        current.habitable_area, current.balcony_area, current.stilt_area, current.terrace_area,
        current.electrical_additional, current.plumbing_additional, current.finishing_additional,
        current.special_features_amount, current.miscellaneous_amount, current.discount_amount,
        current.gst_percentage, current.advance_percentage, current.estimated_duration_months,
        current.lead_quotation_id,
        current.prepared_by,
        current.terms_conditions, current.inclusions, current.exclusions, current.payment_terms,
        notes || current.preparation_notes
      ]
    );
    const newVersion = insertResult.rows[0];

    // 5. Mark the old row as superseded
    await db.query(
      `UPDATE lead_quotations
         SET is_current_version = FALSE,
             superseded_by = $1,
             updated_at = CURRENT_TIMESTAMP
       WHERE lead_quotation_id = $2`,
      [newVersion.lead_quotation_id, current.lead_quotation_id]
    );

    // 6. Write a history record on the NEW version
    //    (lead_quotation_history has UNIQUE(lead_quotation_id, version_number))
    try {
      await db.query(
        `INSERT INTO lead_quotation_history (
          lead_quotation_id, version_number, change_type, change_description,
          total_amount_snapshot, package_rate_snapshot,
          habitable_area_snapshot, balcony_area_snapshot, stilt_area_snapshot,
          changes_made, reason_for_change, client_feedback_received,
          status_at_time, changed_by, history_notes
        ) VALUES (
          $1, $2, 'Created', $3,
          $4, $5, $6, $7, $8,
          $9, $10, $11,
          'Draft', $12, $13
        )`,
        [
          newVersion.lead_quotation_id,
          newVersionNumber,
          `Version v${newVersionNumber} created from v${current.version_number || 1}`,
          newVersion.total_amount || null,
          newVersion.package_rate_per_sqft,
          newVersion.habitable_area,
          newVersion.balcony_area,
          newVersion.stilt_area,
          changes_made || null,
          reason_for_change || notes || null,
          client_feedback || null,
          newVersion.prepared_by,
          notes || null
        ]
      );
    } catch (histErr) {
      // Don't fail the whole operation if history insert fails — log it
      console.warn('History insert failed (non-fatal):', histErr.message);
    }

    await db.query('COMMIT');
    console.log('✅ New version created:', newVersion.lead_quotation_number);

    res.status(201).json({
      success: true,
      message: `Version v${newVersionNumber} created successfully`,
      data: newVersion
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('❌ Error creating version:', err.message, err.stack);
    res.status(500).json({ error: err.message, code: err.code });
  }
});

module.exports = router;
