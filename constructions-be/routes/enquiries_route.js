const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Enquiries
 *   description: API for managing construction enquiries with package selection
 */

// NOTE: Run this SQL in pgAdmin if not already done:
// ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS building_type VARCHAR(50);
// ALTER TABLE leads ADD COLUMN IF NOT EXISTS building_type VARCHAR(50);

// ============================================================
// CRITICAL: Routes here should NOT include /enquiries prefix
// because server.js already mounts this router at /api/enquiries
// ============================================================

// Middleware: Log all requests
router.use((req, res, next) => {
  console.log(`[Enquiries] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// SPECIFIC ROUTES FIRST
// ============================================================

router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(`
      SELECT e.*,
        p.package_name as primary_package_name,
        p.total_price_per_sqft as primary_package_rate
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      WHERE e.status = $1 
      ORDER BY e.created_at DESC
    `, [status]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Enquiries] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/classification/:classification', async (req, res) => {
  const db = req.db;
  const { classification } = req.params;
  
  try {
    const result = await db.query(`
      SELECT e.*,
        p.package_name as primary_package_name,
        p.total_price_per_sqft as primary_package_rate
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      WHERE e.crm_classification = $1 
      ORDER BY e.created_at DESC
    `, [classification]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Enquiries] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/assigned/:assignedTo', async (req, res) => {
  const db = req.db;
  const { assignedTo } = req.params;
  
  try {
    const result = await db.query(`
      SELECT e.*,
        p.package_name as primary_package_name
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      WHERE e.assigned_to = $1 
      ORDER BY e.created_at DESC
    `, [assignedTo]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Enquiries] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/converted', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT e.*,
        p.package_name as primary_package_name,
        l.lead_number,
        l.lead_id
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      LEFT JOIN leads l ON e.enquiry_id = l.enquiry_id
      WHERE e.converted_to_lead = true 
      ORDER BY e.lead_conversion_date DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Enquiries] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET ALL ENQUIRIES
// ============================================================
router.get('/', async (req, res) => {
  const db = req.db;
  
  console.log('[Enquiries] GET / - Getting all enquiries');
  
  try {
    const query = `
      SELECT e.*,
        p.package_name as primary_package_name,
        p.total_price_per_sqft as primary_package_rate,
        p.base_price_per_sqft as primary_package_base_rate,
        p.gst_amount_per_sqft as primary_package_gst_per_sqft,
        CASE 
          WHEN e.approximate_area IS NOT NULL AND p.total_price_per_sqft IS NOT NULL 
          THEN (e.approximate_area * p.total_price_per_sqft)
          ELSE NULL 
        END as estimated_package_total
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      ORDER BY e.created_at DESC
    `;
    
    const result = await db.query(query);
    
    console.log(`[Enquiries] Found ${result.rows.length} enquiries`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Enquiries] Error:', err.message);
    console.error('[Enquiries] Stack:', err.stack);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================================
// CREATE ENQUIRY
// ============================================================
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    contact_person_name,
    contact_surname,
    company_name,
    primary_phone,
    email,
    whatsapp_number,
    city,
    state,
    project_type,
    construction_type,
    building_type,
    approximate_area,
    area_unit,
    budget_range,
    expected_timeline,
    package_id,
    utm_source,
    utm_medium,
    utm_campaign,
    crm_classification,
    assigned_to,
    status,
    enquiry_notes
  } = req.body;

  console.log('[Enquiries] Creating new enquiry:', { contact_person_name, primary_phone });

  if (!contact_person_name || !primary_phone) {
    return res.status(400).json({ 
      success: false,
      error: "Contact person name and primary phone are required" 
    });
  }

  try {
    await db.query('BEGIN');
    
    let packageInfo = null;
    if (package_id) {
      const packageCheck = await db.query(
        'SELECT id, package_name, total_price_per_sqft FROM packages WHERE id = $1', 
        [package_id]
      );
      if (packageCheck.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ 
          success: false,
          error: 'Invalid package ID provided' 
        });
      }
      packageInfo = packageCheck.rows[0];
    }
    
    const countResult = await db.query('SELECT COUNT(*) as count FROM enquiries');
    const count = parseInt(countResult.rows[0].count) + 1;
    const enquiry_number = `ENQ-24-${count.toString().padStart(3, '0')}`;
    
    const insertQuery = `
      INSERT INTO enquiries (
        enquiry_number,
        contact_person_name, contact_surname, company_name, primary_phone, email,
        whatsapp_number, city, state, project_type, construction_type, building_type,
        approximate_area, area_unit, budget_range, expected_timeline, package_id,
        utm_source, utm_medium, utm_campaign, crm_classification, assigned_to, status, enquiry_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) 
      RETURNING enquiry_id
    `;
    
    const insertValues = [
      enquiry_number,
      contact_person_name,
      contact_surname || null,
      company_name || null,
      primary_phone,
      email || null,
      whatsapp_number || null,
      city || null,
      state || null,
      project_type || null,
      construction_type || null,
      building_type || null,
      approximate_area || null,
      area_unit || 'sqft',
      budget_range || null,
      expected_timeline || null,
      package_id || null,
      utm_source || null,
      utm_medium || null,
      utm_campaign || null,
      crm_classification || 'Cold',
      assigned_to || null,
      status || 'New',
      enquiry_notes || null
    ];

    const result = await db.query(insertQuery, insertValues);
    const enquiry_id = result.rows[0].enquiry_id;

    await db.query('COMMIT');

    console.log('[Enquiries] Created successfully:', enquiry_id);
    res.status(201).json({
      success: true,
      data: { enquiry_id, enquiry_number },
      message: 'Enquiry created successfully'
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[Enquiries] Create error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================================
// GET BY ID
// ============================================================
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  console.log('[Enquiries] GET /:id with ID:', id);
  
  const enquiryId = parseInt(id);
  if (isNaN(enquiryId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid enquiry ID. Must be a number.'
    });
  }
  
  try {
    const result = await db.query(`
      SELECT e.*,
        p.package_name as primary_package_name,
        p.total_price_per_sqft as primary_package_rate
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      WHERE e.enquiry_id = $1
    `, [enquiryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Enquiry not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[Enquiries] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================================
// UPDATE
// ============================================================
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  const enquiryId = parseInt(id);
  if (isNaN(enquiryId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid enquiry ID'
    });
  }
  
  const {
    contact_person_name,
    contact_surname,
    company_name,
    primary_phone,
    email,
    whatsapp_number,
    city,
    state,
    project_type,
    construction_type,
    building_type,
    approximate_area,
    area_unit,
    budget_range,
    expected_timeline,
    package_id,
    crm_classification,
    assigned_to,
    status,
    enquiry_notes
  } = req.body;

  try {
    const updateQuery = `
      UPDATE enquiries 
      SET contact_person_name = $1, contact_surname = $2, company_name = $3, 
          primary_phone = $4, email = $5, whatsapp_number = $6, city = $7, 
          state = $8, project_type = $9, construction_type = $10, 
          building_type = $11, approximate_area = $12, area_unit = $13,
          budget_range = $14, expected_timeline = $15, package_id = $16,
          crm_classification = $17, assigned_to = $18, status = $19,
          enquiry_notes = $20, updated_at = CURRENT_TIMESTAMP
      WHERE enquiry_id = $21
      RETURNING enquiry_id
    `;
    
    const result = await db.query(updateQuery, [
      contact_person_name, contact_surname, company_name, primary_phone,
      email, whatsapp_number, city, state, project_type, construction_type,
      building_type, approximate_area, area_unit, budget_range, expected_timeline,
      package_id, crm_classification, assigned_to, status, enquiry_notes, enquiryId
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.json({ success: true, message: 'Enquiry updated successfully' });
  } catch (err) {
    console.error('[Enquiries] Update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// DELETE
// ============================================================
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  const enquiryId = parseInt(id);
  if (isNaN(enquiryId)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  try {
    const result = await db.query("DELETE FROM enquiries WHERE enquiry_id = $1", [enquiryId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }
    
    res.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (err) {
    console.error('[Enquiries] Delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// CONVERT TO LEAD
// ============================================================
router.post('/:id/convert-to-lead', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { assigned_sales_person, assigned_architect, assigned_engineer, converted_by } = req.body;

  console.log('[Enquiries] Convert to lead - ID:', id);

  const enquiryId = parseInt(id);
  if (isNaN(enquiryId)) {
    return res.status(400).json({ success: false, error: 'Invalid enquiry ID' });
  }

  if (!assigned_sales_person || !converted_by) {
    return res.status(400).json({
      success: false,
      error: 'assigned_sales_person and converted_by are required'
    });
  }

  try {
    await db.query('BEGIN');

    const enquiryResult = await db.query('SELECT * FROM enquiries WHERE enquiry_id = $1', [enquiryId]);
    if (enquiryResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const enquiry = enquiryResult.rows[0];

    if (enquiry.converted_to_lead) {
      await db.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Already converted to lead' });
    }

    const leadCountResult = await db.query('SELECT COUNT(*) as count FROM leads');
    const leadCount = parseInt(leadCountResult.rows[0].count) + 1;
    const leadNumber = `LED-24-${leadCount.toString().padStart(3, '0')}`;

    const leadResult = await db.query(`
      INSERT INTO leads (
        enquiry_id, lead_number, lead_title, primary_contact_name, company_name,
        primary_phone, email, whatsapp_number, city, state, project_type,
        construction_type, building_type, estimated_built_up_area, assigned_sales_person,
        assigned_architect, assigned_engineer, stage, probability_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
      RETURNING lead_id
    `, [
      enquiryId, leadNumber,
      (enquiry.project_type || 'Project') + ' for ' + (enquiry.contact_person_name || 'Client'),
      enquiry.contact_person_name, enquiry.company_name, enquiry.primary_phone,
      enquiry.email, enquiry.whatsapp_number, enquiry.city, enquiry.state,
      enquiry.project_type, enquiry.construction_type, enquiry.building_type,
      enquiry.approximate_area,
      assigned_sales_person, assigned_architect, assigned_engineer, 'Qualified', 25
    ]);

    const leadId = leadResult.rows[0].lead_id;

    await db.query(`
      UPDATE enquiries 
      SET converted_to_lead = true, lead_conversion_date = CURRENT_TIMESTAMP,
          status = 'Converted_to_Lead', updated_at = CURRENT_TIMESTAMP
      WHERE enquiry_id = $1
    `, [enquiryId]);

    await db.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Enquiry successfully converted to lead',
      data: { lead_id: leadId, lead_number: leadNumber, enquiry_id: enquiryId }
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[Enquiries] Conversion error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
