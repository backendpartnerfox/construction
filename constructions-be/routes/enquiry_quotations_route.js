const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EnquiryQuotations
 *   description: API for managing enquiry quotations
 */

/**
 * @swagger
 * /enquiry_quotations:
 *   get:
 *     tags: [EnquiryQuotations]
 *     description: Retrieve all enquiry quotations
 *     responses:
 *       200:
 *         description: List of enquiry quotations
 */

// Get all enquiry quotations
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM enquiry_quotations ORDER BY created_at DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations/{id}:
 *   get:
 *     tags: [EnquiryQuotations]
 *     description: Retrieve a specific enquiry quotation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry quotation to retrieve
 *     responses:
 *       200:
 *         description: Enquiry quotation details
 *       404:
 *         description: Enquiry quotation not found
 *       500:
 *         description: Internal server error
 */

// Get enquiry quotation by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM enquiry_quotations WHERE enquiry_quotation_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry quotation not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations:
 *   post:
 *     summary: Create a new enquiry quotation
 *     tags: [EnquiryQuotations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - enquiry_requirement_id
 *               - package_rate_per_sqft
 *               - prepared_by
 *             properties:
 *               enquiry_id:
 *                 type: integer
 *               enquiry_requirement_id:
 *                 type: integer
 *               enquiry_quotation_number:
 *                 type: string
 *               quotation_date:
 *                 type: string
 *                 format: date
 *               valid_until:
 *                 type: string
 *                 format: date
 *               project_title:
 *                 type: string
 *               project_scope:
 *                 type: string
 *               built_up_area:
 *                 type: number
 *               construction_type:
 *                 type: string
 *               package_type:
 *                 type: string
 *               package_rate_per_sqft:
 *                 type: number
 *               total_area:
 *                 type: number
 *               base_construction_cost:
 *                 type: number
 *               additional_work_amount:
 *                 type: number
 *               discount_amount:
 *                 type: number
 *               gst_percentage:
 *                 type: number
 *               estimated_duration_months:
 *                 type: integer
 *               advance_percentage:
 *                 type: number
 *               payment_terms:
 *                 type: string
 *               terms_conditions:
 *                 type: string
 *               status:
 *                 type: string
 *               prepared_by:
 *                 type: integer
 *               approved_by:
 *                 type: integer
 *               preparation_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enquiry quotation created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    enquiry_id,
    enquiry_requirement_id,
    enquiry_quotation_number,
    quotation_date,
    valid_until,
    project_title,
    project_scope,
    built_up_area,
    construction_type,
    package_type,
    package_rate_per_sqft,
    total_area,
    additional_work_amount,
    discount_amount,
    gst_percentage,
    estimated_duration_months,
    advance_percentage,
    payment_terms,
    terms_conditions,
    status,
    prepared_by,
    approved_by,
    preparation_notes
  } = req.body;

  if (!enquiry_id || !enquiry_requirement_id || !package_rate_per_sqft || !prepared_by) {
    return res.status(400).json({ error: "Enquiry ID, Requirement ID, Package Rate per Sqft, and Prepared By are required" });
  }

  try {
    const query = `
      INSERT INTO enquiry_quotations (
        enquiry_id, enquiry_requirement_id, enquiry_quotation_number, quotation_date,
        valid_until, project_title, project_scope, built_up_area, construction_type,
        package_type, package_rate_per_sqft, total_area, 
        additional_work_amount, discount_amount, gst_percentage, estimated_duration_months,
        advance_percentage, payment_terms, terms_conditions, status, prepared_by,
        approved_by, preparation_notes
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *
    `;
    
    const values = [
      enquiry_id,
      enquiry_requirement_id,
      enquiry_quotation_number,
      quotation_date,
      valid_until,
      project_title,
      project_scope,
      built_up_area,
      construction_type,
      package_type,
      package_rate_per_sqft,
      total_area || 0,
      additional_work_amount || 0,
      discount_amount || 0,
      gst_percentage || 18.00,
      estimated_duration_months,
      advance_percentage || 20.00,
      payment_terms,
      terms_conditions,
      status || 'Draft',
      prepared_by,
      approved_by,
      preparation_notes
    ];

    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations/{id}:
 *   put:
 *     summary: Update an existing enquiry quotation by ID
 *     tags: [EnquiryQuotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry quotation to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - enquiry_requirement_id
 *               - package_rate_per_sqft
 *               - prepared_by
 *     responses:
 *       200:
 *         description: Enquiry quotation updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Enquiry quotation not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    enquiry_id,
    enquiry_requirement_id,
    project_title,
    project_scope,
    built_up_area,
    construction_type,
    package_type,
    package_rate_per_sqft,
    total_area,
    base_construction_cost,
    additional_work_amount,
    discount_amount,
    gst_percentage,
    estimated_duration_months,
    advance_percentage,
    payment_terms,
    terms_conditions,
    status,
    prepared_by,
    approved_by,
    preparation_notes,
    client_feedback
  } = req.body;

  if (!enquiry_id || !enquiry_requirement_id || !package_rate_per_sqft || !prepared_by) {
    return res.status(400).json({ error: "Enquiry ID, Requirement ID, Package Rate per Sqft, and Prepared By are required" });
  }

  try {
    const query = `
      UPDATE enquiry_quotations 
      SET 
        enquiry_id = $1,
        enquiry_requirement_id = $2,
        project_title = $3,
        project_scope = $4,
        built_up_area = $5,
        construction_type = $6,
        package_type = $7,
        package_rate_per_sqft = $8,
        total_area = $9,
        base_construction_cost = $10,
        additional_work_amount = $11,
        discount_amount = $12,
        gst_percentage = $13,
        estimated_duration_months = $14,
        advance_percentage = $15,
        payment_terms = $16,
        terms_conditions = $17,
        status = $18,
        prepared_by = $19,
        approved_by = $20,
        preparation_notes = $21,
        client_feedback = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE enquiry_quotation_id = $23
      RETURNING *
    `;
    
    const values = [
      enquiry_id,
      enquiry_requirement_id,
      project_title,
      project_scope,
      built_up_area,
      construction_type,
      package_type,
      package_rate_per_sqft,
      total_area || 0,
      base_construction_cost,
      additional_work_amount || 0,
      discount_amount || 0,
      gst_percentage || 18.00,
      estimated_duration_months,
      advance_percentage || 20.00,
      payment_terms,
      terms_conditions,
      status || 'Draft',
      prepared_by,
      approved_by,
      preparation_notes,
      client_feedback,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry quotation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations/{id}:
 *   delete:
 *     summary: Delete an enquiry quotation by ID
 *     tags: [EnquiryQuotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry quotation to delete
 *     responses:
 *       200:
 *         description: Enquiry quotation deleted successfully
 *       404:
 *         description: Enquiry quotation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM enquiry_quotations WHERE enquiry_quotation_id = $1 RETURNING enquiry_quotation_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry quotation not found" });
    }
    
    res.json({ message: "Enquiry quotation deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations/enquiry/{enquiryId}:
 *   get:
 *     tags: [EnquiryQuotations]
 *     description: Retrieve all quotations for a specific enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry
 *     responses:
 *       200:
 *         description: List of quotations for the enquiry
 *       500:
 *         description: Internal server error
 */
router.get('/enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_quotations WHERE enquiry_id = $1 ORDER BY created_at DESC", 
      [enquiryId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations/status/{status}:
 *   get:
 *     tags: [EnquiryQuotations]
 *     description: Retrieve all quotations by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status of quotations to retrieve
 *     responses:
 *       200:
 *         description: List of quotations with specified status
 *       500:
 *         description: Internal server error
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_quotations WHERE status = $1 ORDER BY created_at DESC", 
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_quotations/search:
 *   get:
 *     tags: [EnquiryQuotations]
 *     description: Search quotations by project title or quotation number
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for project title or quotation number
 *     responses:
 *       200:
 *         description: List of quotations matching the search criteria
 *       500:
 *         description: Internal server error
 */
router.get('/search', async (req, res) => {
  const db = req.db;
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }
  
  try {
    const result = await db.query(
      `SELECT * FROM enquiry_quotations 
       WHERE project_title ILIKE $1 
       OR enquiry_quotation_number ILIKE $1
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;