const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: API for managing construction leads
 */

// ============================================================
// CRITICAL: Routes here should NOT include /leads prefix
// because server.js already mounts this router at /api/leads
// ============================================================

// Middleware: Log all requests
router.use((req, res, next) => {
  console.log(`[Leads] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// SPECIFIC ROUTES FIRST (must be before /:id route)
// ============================================================

// Get leads by stage
router.get('/stage/:stage', async (req, res) => {
  const db = req.db;
  const { stage } = req.params;
  
  try {
    const result = await db.query(`
      SELECT l.*
      FROM leads l
      WHERE l.stage = $1
      ORDER BY l.created_at DESC
    `, [stage]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Leads] Error in /stage/:stage:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get leads by salesperson
router.get('/salesperson/:salespersonId', async (req, res) => {
  const db = req.db;
  const { salespersonId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT l.*
      FROM leads l
      WHERE l.assigned_sales_person = $1
      ORDER BY l.created_at DESC
    `, [salespersonId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Leads] Error in /salesperson/:salespersonId:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get converted leads
router.get('/converted', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT l.*
      FROM leads l
      WHERE l.converted_to_client = true
      ORDER BY l.client_conversion_date DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Leads] Error in /converted:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get leads by enquiry ID
router.get('/enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT l.*
      FROM leads l
      WHERE l.enquiry_id = $1
    `, [enquiryId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Leads] Error in /enquiry/:enquiryId:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET ALL LEADS
// ============================================================
router.get('/', async (req, res) => {
  const db = req.db;
  
  console.log('[Leads] GET / - Getting all leads');
  
  try {
    const result = await db.query(`
      SELECT l.*
      FROM leads l
      ORDER BY l.created_at DESC
    `);
    
    console.log(`[Leads] Found ${result.rows.length} leads`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Leads] Error in GET /:', err.message);
    console.error('[Leads] Stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================================
// CREATE LEAD
// ============================================================
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    enquiry_id, lead_number, lead_title, project_description, primary_contact_name,
    company_name, designation, primary_phone, email, whatsapp_number, site_address,
    city, state, postal_code, project_type, construction_type, site_area,
    estimated_built_up_area, number_of_floors, budget_min, budget_max, timeline_months,
    preferred_start_date, is_decision_maker, budget_confirmed, timeline_confirmed,
    site_ownership_confirmed, approvals_status, stage, probability_percentage,
    expected_closure_date, assigned_sales_person, assigned_architect, assigned_engineer,
    lead_notes
  } = req.body;

  console.log('[Leads] Creating new lead:', { primary_contact_name, enquiry_id });

  if (!enquiry_id || !assigned_sales_person) {
    return res.status(400).json({ 
      success: false,
      error: "Enquiry ID and assigned sales person are required" 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO leads (
        enquiry_id, lead_number, lead_title, project_description, primary_contact_name,
        company_name, designation, primary_phone, email, whatsapp_number, site_address,
        city, state, postal_code, project_type, construction_type, site_area,
        estimated_built_up_area, number_of_floors, budget_min, budget_max, timeline_months,
        preferred_start_date, is_decision_maker, budget_confirmed, timeline_confirmed,
        site_ownership_confirmed, approvals_status, stage, probability_percentage,
        expected_closure_date, assigned_sales_person, assigned_architect, assigned_engineer,
        lead_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35) 
      RETURNING lead_id`,
      [
        enquiry_id, lead_number || null, lead_title || null, project_description || null,
        primary_contact_name || null, company_name || null, designation || null,
        primary_phone || null, email || null, whatsapp_number || null, site_address || null,
        city || null, state || null, postal_code || null, project_type || null,
        construction_type || null, site_area || null, estimated_built_up_area || null,
        number_of_floors || null, budget_min || null, budget_max || null,
        timeline_months || null, preferred_start_date || null, is_decision_maker || false,
        budget_confirmed || false, timeline_confirmed || false,
        site_ownership_confirmed || false, approvals_status || null, stage || 'Qualified',
        probability_percentage || 25, expected_closure_date || null, assigned_sales_person,
        assigned_architect || null, assigned_engineer || null, lead_notes || null
      ]
    );

    const lead_id = result.rows[0].lead_id;

    console.log('[Leads] Created successfully:', lead_id);
    res.status(201).json({
      success: true,
      data: { lead_id },
      message: 'Lead created successfully'
    });

  } catch (err) {
    console.error('[Leads] Create error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================================
// GET BY ID (FIXED WITH BETTER ERROR HANDLING)
// ============================================================
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  console.log('[Leads] GET /:id with ID:', id);
  
  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid lead ID. Must be a number.'
    });
  }
  
  try {
    // First, try simple query to check if lead exists
    const simpleResult = await db.query(`
      SELECT * FROM leads WHERE lead_id = $1
    `, [leadId]);

    if (simpleResult.rows.length === 0) {
      console.log('[Leads] Lead not found:', leadId);
      return res.status(404).json({ 
        success: false,
        error: 'Lead not found' 
      });
    }

    console.log('[Leads] Lead found, returning data');
    
    // Return simple result without complex joins for now
    res.json({
      success: true,
      data: simpleResult.rows[0]
    });
    
  } catch (err) {
    console.error('[Leads] Error in GET /:id:', err.message);
    console.error('[Leads] Stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ============================================================
// UPDATE STAGE (PATCH)
// ============================================================
router.patch('/:id/stage', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { stage, notes } = req.body;
  
  console.log('[Leads] UPDATE STAGE /:id/stage with ID:', id);
  console.log('[Leads] New stage:', stage);
  
  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid lead ID'
    });
  }
  
  if (!stage) {
    return res.status(400).json({
      success: false,
      error: 'Stage is required'
    });
  }

  try {
    const query = `
      UPDATE leads 
      SET stage = $1, updated_at = CURRENT_TIMESTAMP
      WHERE lead_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [stage, leadId]);

    if (result.rowCount === 0) {
      console.log('[Leads] Lead not found for stage update:', leadId);
      return res.status(404).json({ 
        success: false, 
        error: "Lead not found" 
      });
    }

    console.log('[Leads] ✅ Lead stage updated successfully');
    res.json({ 
      success: true, 
      message: 'Lead stage updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[Leads] ❌ Stage update error:', err.message);
    console.error('[Leads] Error stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ============================================================
// UPDATE - FIXED WITH PROPER $ SYMBOLS
// ============================================================
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  console.log('[Leads] UPDATE /:id with ID:', id);
  console.log('[Leads] Update data:', JSON.stringify(req.body, null, 2));
  
  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid lead ID'
    });
  }
  
  const data = req.body;

  try {
    // Build dynamic UPDATE query
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Helper function to add field to update - FIXED WITH $
    const addField = (fieldName, value) => {
      if (value !== undefined) {
        fields.push(`${fieldName} = $${paramCount}`);  // ✅ FIXED: Added $
        values.push(value);
        paramCount++;
      }
    };

    // Add all possible fields
    addField('lead_title', data.lead_title);
    addField('project_description', data.project_description);
    addField('primary_contact_name', data.primary_contact_name);
    addField('company_name', data.company_name);
    addField('designation', data.designation);
    addField('primary_phone', data.primary_phone);
    addField('email', data.email);
    addField('whatsapp_number', data.whatsapp_number);
    addField('site_address', data.site_address);
    addField('city', data.city);
    addField('state', data.state);
    addField('postal_code', data.postal_code);
    addField('project_type', data.project_type);
    addField('construction_type', data.construction_type);
    addField('site_area', data.site_area);
    addField('estimated_built_up_area', data.estimated_built_up_area);
    addField('number_of_floors', data.number_of_floors);
    addField('budget_min', data.budget_min);
    addField('budget_max', data.budget_max);
    addField('timeline_months', data.timeline_months);
    
    // Handle date field - convert empty string to null - FIXED WITH $
    if (data.preferred_start_date !== undefined) {
      const dateValue = data.preferred_start_date === '' ? null : data.preferred_start_date;
      fields.push(`preferred_start_date = $${paramCount}`);  // ✅ FIXED: Added $
      values.push(dateValue);
      paramCount++;
    }
    
    addField('is_decision_maker', data.is_decision_maker);
    addField('budget_confirmed', data.budget_confirmed);
    addField('timeline_confirmed', data.timeline_confirmed);
    addField('site_ownership_confirmed', data.site_ownership_confirmed);
    addField('approvals_status', data.approvals_status);
    addField('stage', data.stage);
    addField('probability_percentage', data.probability_percentage);
    // Remove assigned_to and lead_source - these columns don't exist
    // addField('assigned_to', data.assigned_to);
    // addField('lead_source', data.lead_source);
    addField('lead_notes', data.notes); // Map 'notes' to 'lead_notes'

    // Always update updated_at
    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) { // Only updated_at
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const query = `
      UPDATE leads 
      SET ${fields.join(', ')}
      WHERE lead_id = $${paramCount}
      RETURNING *
    `;  // ✅ FIXED: Added $ in WHERE clause
    
    values.push(leadId);

    console.log('[Leads] Executing update query');
    console.log('[Leads] Query:', query);
    console.log('[Leads] Values:', values);

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      console.log('[Leads] Lead not found for update:', leadId);
      return res.status(404).json({ 
        success: false, 
        error: "Lead not found" 
      });
    }

    console.log('[Leads] ✅ Lead updated successfully');
    res.json({ 
      success: true, 
      message: 'Lead updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[Leads] ❌ Update error:', err.message);
    console.error('[Leads] Error stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ============================================================
// DELETE
// ============================================================
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  const leadId = parseInt(id);
  if (isNaN(leadId)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  try {
    const result = await db.query("DELETE FROM leads WHERE lead_id = $1", [leadId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }
    
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    console.error('[Leads] Delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
