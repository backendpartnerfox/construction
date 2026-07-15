// backend/routes/lead_requirements.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LeadRequirements
 *   description: API for managing lead requirements
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeadRequirement:
 *       type: object
 *       properties:
 *         lead_requirement_id:
 *           type: integer
 *           description: Unique identifier for the requirement
 *         lead_id:
 *           type: integer
 *           description: Reference to the lead
 *         requirement_number:
 *           type: string
 *           description: Generated requirement number
 *         requirement_title:
 *           type: string
 *           description: Title of the requirement
 *         requirement_description:
 *           type: string
 *           description: Detailed description
 *         project_type:
 *           type: string
 *           description: Type of project (Residential, Commercial, etc.)
 *         construction_type:
 *           type: string
 *           description: Type of construction (New, Renovation, etc.)
 *         site_area:
 *           type: number
 *           format: decimal
 *           description: Area of the site
 *         site_area_unit:
 *           type: string
 *           default: 'sqft'
 *           description: Unit of site area measurement
 *         built_up_area:
 *           type: number
 *           format: decimal
 *           description: Built-up area
 *         carpet_area:
 *           type: number
 *           format: decimal
 *           description: Carpet area
 *         number_of_floors:
 *           type: integer
 *           description: Number of floors
 *         number_of_bedrooms:
 *           type: integer
 *           description: Number of bedrooms
 *         number_of_bathrooms:
 *           type: integer
 *           description: Number of bathrooms
 *         budget_range_min:
 *           type: number
 *           format: decimal
 *           description: Minimum budget range
 *         budget_range_max:
 *           type: number
 *           format: decimal
 *           description: Maximum budget range
 *         quality_preference:
 *           type: string
 *           description: Quality preference (Basic, Standard, Premium)
 *         package_type:
 *           type: string
 *           description: Package type preference
 *         status:
 *           type: string
 *           enum: [Draft, Under_Discussion, Finalized, Quoted, Selected, Rejected]
 *           default: Draft
 *           description: Current status of the requirement
 *         created_by:
 *           type: integer
 *           description: Employee who created the requirement
 *         updated_by:
 *           type: integer
 *           description: Employee who last updated the requirement
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - lead_id
 *         - requirement_title
 */

/**
 * @swagger
 * /lead_requirements:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Retrieve all lead requirements
 *     responses:
 *       200:
 *         description: List of lead requirements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadRequirement'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM lead_requirements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirements/{id}:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Retrieve a specific lead requirement by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead requirement
 *     responses:
 *       200:
 *         description: Lead requirement details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadRequirement'
 *       404:
 *         description: Lead requirement not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM lead_requirements WHERE lead_requirement_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirements:
 *   post:
 *     summary: Create a new lead requirement
 *     tags: [LeadRequirements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lead_id
 *               - requirement_title
 *             properties:
 *               lead_id:
 *                 type: integer
 *                 description: Reference to the lead
 *               requirement_title:
 *                 type: string
 *                 description: Title of the requirement
 *               requirement_description:
 *                 type: string
 *                 description: Detailed description
 *               project_type:
 *                 type: string
 *                 description: Type of project
 *               construction_type:
 *                 type: string
 *                 description: Type of construction
 *               site_area:
 *                 type: number
 *                 description: Site area
 *               site_area_unit:
 *                 type: string
 *                 default: sqft
 *                 description: Unit of measurement
 *               built_up_area:
 *                 type: number
 *                 description: Built-up area
 *               carpet_area:
 *                 type: number
 *                 description: Carpet area
 *               number_of_floors:
 *                 type: integer
 *                 description: Number of floors
 *               number_of_bedrooms:
 *                 type: integer
 *                 description: Number of bedrooms
 *               number_of_bathrooms:
 *                 type: integer
 *                 description: Number of bathrooms
 *               budget_range_min:
 *                 type: number
 *                 description: Minimum budget
 *               budget_range_max:
 *                 type: number
 *                 description: Maximum budget
 *               quality_preference:
 *                 type: string
 *                 description: Quality preference
 *               package_type:
 *                 type: string
 *                 description: Package type
 *               created_by:
 *                 type: integer
 *                 description: Employee creating the requirement
 *     responses:
 *       201:
 *         description: Lead requirement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadRequirement'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const data = req.body;
  
  console.log('Creating lead requirement with data:', data);

  if (!data.lead_id || !data.requirement_title) {
    return res.status(400).json({ error: "Lead ID and Requirement Title are required" });
  }

  try {
    // Validate lead exists
    const leadCheck = await db.query('SELECT lead_id FROM leads WHERE lead_id = $1', [data.lead_id]);
    if (leadCheck.rows.length === 0) {
      return res.status(400).json({ error: `Lead with ID ${data.lead_id} does not exist` });
    }

    // Generate requirement number
    const countResult = await db.query(
      'SELECT COUNT(*) + 1 as next_num FROM lead_requirements WHERE lead_id = $1',
      [data.lead_id]
    );
    const requirement_number = `REQ-${data.lead_id}-${String(countResult.rows[0].next_num).padStart(3, '0')}`;

    // Get valid employee for created_by
    let validCreatedBy = 1;
    if (data.created_by) {
      const employeeCheck = await db.query('SELECT employee_id FROM employees WHERE employee_id = $1', [data.created_by]);
      if (employeeCheck.rows.length > 0) {
        validCreatedBy = data.created_by;
      }
    } else {
      const firstEmployee = await db.query('SELECT employee_id FROM employees ORDER BY employee_id LIMIT 1');
      if (firstEmployee.rows.length > 0) {
        validCreatedBy = firstEmployee.rows[0].employee_id;
      }
    }

    // Validate status
    const validStatuses = ['Draft', 'Under_Discussion', 'Finalized', 'Quoted', 'Selected', 'Rejected'];
    const finalStatus = data.status && validStatuses.includes(data.status) ? data.status : 'Draft';

    const query = `
      INSERT INTO lead_requirements (
        lead_id, requirement_number, requirement_title, requirement_description,
        project_type, construction_type, site_area, site_area_unit, built_up_area,
        carpet_area, number_of_floors, number_of_bedrooms, number_of_bathrooms,
        budget_range_min, budget_range_max, quality_preference, package_type,
        status, created_by
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      RETURNING *
    `;
    
    const values = [
      parseInt(data.lead_id),
      requirement_number,
      data.requirement_title.trim(),
      data.requirement_description || null,
      data.project_type || null,
      data.construction_type || null,
      parseFloat(data.site_area) || null,
      data.site_area_unit || 'sqft',
      parseFloat(data.built_up_area) || null,
      parseFloat(data.carpet_area) || null,
      parseInt(data.number_of_floors) || null,
      parseInt(data.number_of_bedrooms) || null,
      parseInt(data.number_of_bathrooms) || null,
      parseFloat(data.budget_range_min) || null,
      parseFloat(data.budget_range_max) || null,
      data.quality_preference || null,
      data.package_type || null,
      finalStatus,
      validCreatedBy
    ];

    console.log('Executing insert with values:', values);

    const result = await db.query(query, values);
    
    console.log('✅ Requirement created successfully');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error code:', err.code);
    
    if (err.code === '23503') {
      return res.status(400).json({ error: "Foreign key constraint violation. Check that referenced IDs exist." });
    }
    
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirements/{id}:
 *   put:
 *     summary: Update an existing lead requirement
 *     tags: [LeadRequirements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead requirement to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirement_title
 *             properties:
 *               requirement_title:
 *                 type: string
 *                 description: Title of the requirement
 *               requirement_description:
 *                 type: string
 *                 description: Detailed description
 *               project_type:
 *                 type: string
 *                 description: Type of project
 *               construction_type:
 *                 type: string
 *                 description: Type of construction
 *               site_area:
 *                 type: number
 *                 description: Site area
 *               built_up_area:
 *                 type: number
 *                 description: Built-up area
 *               number_of_floors:
 *                 type: integer
 *                 description: Number of floors
 *               number_of_bedrooms:
 *                 type: integer
 *                 description: Number of bedrooms
 *               number_of_bathrooms:
 *                 type: integer
 *                 description: Number of bathrooms
 *               budget_range_min:
 *                 type: number
 *                 description: Minimum budget
 *               budget_range_max:
 *                 type: number
 *                 description: Maximum budget
 *               quality_preference:
 *                 type: string
 *                 description: Quality preference
 *               package_type:
 *                 type: string
 *                 description: Package type
 *               status:
 *                 type: string
 *                 enum: [Draft, Under_Discussion, Finalized, Quoted, Selected, Rejected]
 *                 description: Status of the requirement
 *               updated_by:
 *                 type: integer
 *                 description: Employee updating the requirement
 *     responses:
 *       200:
 *         description: Lead requirement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadRequirement'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Lead requirement not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const data = req.body;
  
  console.log('Updating lead requirement ID:', id);
  console.log('Update data:', data);

  if (!data.requirement_title) {
    return res.status(400).json({ error: "Requirement Title is required" });
  }

  try {
    // Check if requirement exists
    const existsCheck = await db.query(
      'SELECT lead_requirement_id FROM lead_requirements WHERE lead_requirement_id = $1', 
      [id]
    );
    
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lead requirement not found" });
    }

    // Validate status
    const validStatuses = ['Draft', 'Under_Discussion', 'Finalized', 'Quoted', 'Selected', 'Rejected'];
    const finalStatus = data.status && validStatuses.includes(data.status) ? data.status : 'Draft';

    // Get valid employee for updated_by (optional)
    let validUpdatedBy = null;
    if (data.updated_by) {
      const employeeCheck = await db.query('SELECT employee_id FROM employees WHERE employee_id = $1', [data.updated_by]);
      if (employeeCheck.rows.length > 0) {
        validUpdatedBy = data.updated_by;
      } else {
        // Get first available employee as fallback
        const firstEmployee = await db.query('SELECT employee_id FROM employees ORDER BY employee_id LIMIT 1');
        if (firstEmployee.rows.length > 0) {
          validUpdatedBy = firstEmployee.rows[0].employee_id;
        }
      }
    }

    // Build the update query - always include core fields, optionally include updated_by
    let query = `
      UPDATE lead_requirements 
      SET 
        requirement_title = $1,
        requirement_description = $2,
        project_type = $3,
        construction_type = $4,
        site_area = $5,
        built_up_area = $6,
        number_of_floors = $7,
        number_of_bedrooms = $8,
        number_of_bathrooms = $9,
        budget_range_min = $10,
        budget_range_max = $11,
        quality_preference = $12,
        package_type = $13,
        status = $14,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    let values = [
      data.requirement_title.trim(),                    // $1
      data.requirement_description || null,            // $2
      data.project_type || null,                       // $3
      data.construction_type || null,                  // $4
      parseFloat(data.site_area) || null,              // $5
      parseFloat(data.built_up_area) || null,          // $6
      parseInt(data.number_of_floors) || null,         // $7
      parseInt(data.number_of_bedrooms) || null,       // $8
      parseInt(data.number_of_bathrooms) || null,      // $9
      parseFloat(data.budget_range_min) || null,       // $10
      parseFloat(data.budget_range_max) || null,       // $11
      data.quality_preference || null,                 // $12
      data.package_type || null,                       // $13
      finalStatus                                       // $14
    ];

    // Add updated_by if available
    if (validUpdatedBy) {
      query += `, updated_by = $15`;
      values.push(validUpdatedBy);                      // $15
      query += ` WHERE lead_requirement_id = $16 RETURNING *`;
      values.push(id);                                  // $16
    } else {
      query += ` WHERE lead_requirement_id = $15 RETURNING *`;
      values.push(id);                                  // $15
    }

    console.log('Update query:', query);
    console.log('Update values:', values);

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead requirement not found or update failed" });
    }

    console.log('✅ Update successful');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    
    if (err.code === '23503') {
      return res.status(400).json({ error: "Foreign key constraint violation" });
    }
    if (err.code === '42703') {
      return res.status(500).json({ error: "Database column does not exist: " + err.message });
    }
    
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirements/{id}:
 *   delete:
 *     summary: Delete a lead requirement
 *     tags: [LeadRequirements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead requirement to delete
 *     responses:
 *       200:
 *         description: Lead requirement deleted successfully
 *       404:
 *         description: Lead requirement not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM lead_requirements WHERE lead_requirement_id = $1 RETURNING lead_requirement_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead requirement not found" });
    }
    
    res.json({ message: "Lead requirement deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirements/lead/{leadId}:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Retrieve all requirements for a specific lead
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead
 *     responses:
 *       200:
 *         description: List of requirements for the lead
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadRequirement'
 *       500:
 *         description: Internal server error
 */
router.get('/lead/:leadId', async (req, res) => {
  const db = req.db;
  const { leadId } = req.params;
  
  console.log('Fetching requirements for lead ID:', leadId);
  
  try {
    const leadIdInt = parseInt(leadId, 10);
    console.log('Converted lead ID to integer:', leadIdInt);
    
    const result = await db.query(
      "SELECT * FROM lead_requirements WHERE lead_id = $1 ORDER BY created_at DESC", 
      [leadIdInt]
    );
    
    console.log('Found', result.rows.length, 'requirements for lead', leadIdInt);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirements/status/{status}:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Retrieve requirements by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Draft, Under_Discussion, Finalized, Quoted, Selected, Rejected]
 *         description: The status to filter by
 *     responses:
 *       200:
 *         description: List of requirements with specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadRequirement'
 *       500:
 *         description: Internal server error
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM lead_requirements WHERE status = $1 ORDER BY created_at DESC", 
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
 * /lead_requirements/search:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Search requirements by title or description
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for requirement title or description
 *     responses:
 *       200:
 *         description: List of requirements matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadRequirement'
 *       400:
 *         description: Search query is required
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
      `SELECT * FROM lead_requirements 
       WHERE requirement_title ILIKE $1 
       OR requirement_description ILIKE $1
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirements/table-structure:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Get the table structure for lead_requirements
 *     responses:
 *       200:
 *         description: Table structure information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   column_name:
 *                     type: string
 *                   data_type:
 *                     type: string
 *                   is_nullable:
 *                     type: string
 *                   column_default:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.get('/table-structure', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'lead_requirements'
      ORDER BY ordinal_position
    `);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirements/{id}/finalize:
 *   patch:
 *     summary: Finalize a lead requirement
 *     tags: [LeadRequirements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead requirement to finalize
 *     responses:
 *       200:
 *         description: Lead requirement finalized successfully
 *       404:
 *         description: Lead requirement not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/finalize', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  console.log('Finalizing lead requirement ID:', id);

  try {
    // Check if requirement exists
    const existsCheck = await db.query(
      'SELECT lead_requirement_id, status FROM lead_requirements WHERE lead_requirement_id = $1', 
      [id]
    );
    
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement not found' });
    }

    // Check if already finalized
    if (existsCheck.rows[0].status === 'Finalized') {
      return res.json({ 
        message: 'Requirement already finalized',
        data: existsCheck.rows[0]
      });
    }

    // Update status to Finalized
    const result = await db.query(
      `UPDATE lead_requirements 
       SET status = 'Finalized',
           finalized_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE lead_requirement_id = $1
       RETURNING *`,
      [id]
    );

    console.log('✅ Requirement finalized successfully');
    res.json({
      message: 'Requirement finalized successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error finalizing requirement:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirements/valid-statuses:
 *   get:
 *     tags: [LeadRequirements]
 *     summary: Get valid status values
 *     responses:
 *       200:
 *         description: List of valid status values
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statuses:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/valid-statuses', async (req, res) => {
  const validStatuses = ['Draft', 'Under_Discussion', 'Finalized', 'Quoted', 'Selected', 'Rejected'];
  res.json({ statuses: validStatuses });
});

module.exports = router;