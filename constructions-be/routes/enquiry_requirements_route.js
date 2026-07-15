const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EnquiryRequirements
 *   description: API for managing enquiry requirements
 */

/**
 * @swagger
 * /enquiry_requirements:
 *   get:
 *     tags: [EnquiryRequirements]
 *     description: Retrieve all enquiry requirements
 *     responses:
 *       200:
 *         description: List of enquiry requirements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   enquiry_requirement_id:
 *                     type: integer
 *                   enquiry_id:
 *                     type: integer
 *                   requirement_number:
 *                     type: string
 *                   requirement_title:
 *                     type: string
 *                   requirement_description:
 *                     type: string
 *                   project_type:
 *                     type: string
 *                   construction_type:
 *                     type: string
 *                   site_area:
 *                     type: number
 *                   site_area_unit:
 *                     type: string
 *                   built_up_area:
 *                     type: number
 *                   approximate_area:
 *                     type: number
 *                   number_of_floors:
 *                     type: integer
 *                   number_of_bedrooms:
 *                     type: integer
 *                   number_of_bathrooms:
 *                     type: integer
 *                   has_balcony:
 *                     type: boolean
 *                   has_parking:
 *                     type: boolean
 *                   parking_spaces:
 *                     type: integer
 *                   quality_preference:
 *                     type: string
 *                   budget_range_min:
 *                     type: number
 *                   budget_range_max:
 *                     type: number
 *                   package_type:
 *                     type: string
 *                   package_inclusions:
 *                     type: array
 *                   expected_timeline:
 *                     type: string
 *                   status:
 *                     type: string
 *                   client_requirements:
 *                     type: string
 *                   initial_discussion_notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: integer
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 */

// Get all enquiry requirements
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM enquiry_requirements ORDER BY created_at DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /enquiry_requirements/{id}:
 *   get:
 *     tags: [EnquiryRequirements]
 *     description: Retrieve a specific enquiry requirement by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry requirement to retrieve
 *     responses:
 *       200:
 *         description: Enquiry requirement details
 *       404:
 *         description: Enquiry requirement not found
 *       500:
 *         description: Internal server error
 */

// Get enquiry requirement by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM enquiry_requirements WHERE enquiry_requirement_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry requirement not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirements:
 *   post:
 *     summary: Create a new enquiry requirement
 *     tags: [EnquiryRequirements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - requirement_title
 *             properties:
 *               enquiry_id:
 *                 type: integer
 *               requirement_number:
 *                 type: string
 *               requirement_title:
 *                 type: string
 *               requirement_description:
 *                 type: string
 *               project_type:
 *                 type: string
 *               construction_type:
 *                 type: string
 *               site_area:
 *                 type: number
 *               site_area_unit:
 *                 type: string
 *               built_up_area:
 *                 type: number
 *               approximate_area:
 *                 type: number
 *               number_of_floors:
 *                 type: integer
 *               number_of_bedrooms:
 *                 type: integer
 *               number_of_bathrooms:
 *                 type: integer
 *               has_balcony:
 *                 type: boolean
 *               has_parking:
 *                 type: boolean
 *               parking_spaces:
 *                 type: integer
 *               quality_preference:
 *                 type: string
 *               budget_range_min:
 *                 type: number
 *               budget_range_max:
 *                 type: number
 *               package_type:
 *                 type: string
 *               package_inclusions:
 *                 type: array
 *               expected_timeline:
 *                 type: string
 *               status:
 *                 type: string
 *               client_requirements:
 *                 type: string
 *               initial_discussion_notes:
 *                 type: string
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Enquiry requirement created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    enquiry_id,
    requirement_number,
    requirement_title,
    requirement_description,
    project_type,
    construction_type,
    site_area,
    site_area_unit,
    built_up_area,
    approximate_area,
    number_of_floors,
    number_of_bedrooms,
    number_of_bathrooms,
    has_balcony,
    has_parking,
    parking_spaces,
    quality_preference,
    budget_range_min,
    budget_range_max,
    package_type,
    package_inclusions,
    expected_timeline,
    status,
    client_requirements,
    initial_discussion_notes,
    created_by
  } = req.body;

  if (!enquiry_id || !requirement_title) {
    return res.status(400).json({ error: "Enquiry ID and Requirement Title are required" });
  }

  try {
    const query = `
      INSERT INTO enquiry_requirements (
        enquiry_id, requirement_number, requirement_title, requirement_description,
        project_type, construction_type, site_area, site_area_unit, built_up_area,
        approximate_area, number_of_floors, number_of_bedrooms, number_of_bathrooms,
        has_balcony, has_parking, parking_spaces, quality_preference, budget_range_min,
        budget_range_max, package_type, package_inclusions, expected_timeline, status,
        client_requirements, initial_discussion_notes, created_by
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      RETURNING *
    `;
    
    const values = [
      enquiry_id,
      requirement_number,
      requirement_title,
      requirement_description,
      project_type,
      construction_type,
      site_area,
      site_area_unit || 'sqft',
      built_up_area,
      approximate_area,
      number_of_floors,
      number_of_bedrooms,
      number_of_bathrooms,
      has_balcony === true ? true : false,
      has_parking === true ? true : false,
      parking_spaces || 0,
      quality_preference,
      budget_range_min,
      budget_range_max,
      package_type,
      package_inclusions,
      expected_timeline,
      status || 'Draft',
      client_requirements,
      initial_discussion_notes,
      created_by
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
 * /enquiry_requirements/{id}:
 *   put:
 *     summary: Update an existing enquiry requirement by ID
 *     tags: [EnquiryRequirements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry requirement to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enquiry_id
 *               - requirement_title
 *             properties:
 *               enquiry_id:
 *                 type: integer
 *               requirement_number:
 *                 type: string
 *               requirement_title:
 *                 type: string
 *               requirement_description:
 *                 type: string
 *               project_type:
 *                 type: string
 *               construction_type:
 *                 type: string
 *               site_area:
 *                 type: number
 *               site_area_unit:
 *                 type: string
 *               built_up_area:
 *                 type: number
 *               approximate_area:
 *                 type: number
 *               number_of_floors:
 *                 type: integer
 *               number_of_bedrooms:
 *                 type: integer
 *               number_of_bathrooms:
 *                 type: integer
 *               has_balcony:
 *                 type: boolean
 *               has_parking:
 *                 type: boolean
 *               parking_spaces:
 *                 type: integer
 *               quality_preference:
 *                 type: string
 *               budget_range_min:
 *                 type: number
 *               budget_range_max:
 *                 type: number
 *               package_type:
 *                 type: string
 *               package_inclusions:
 *                 type: array
 *               expected_timeline:
 *                 type: string
 *               status:
 *                 type: string
 *               client_requirements:
 *                 type: string
 *               initial_discussion_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enquiry requirement updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Enquiry requirement not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    enquiry_id,
    requirement_number,
    requirement_title,
    requirement_description,
    project_type,
    construction_type,
    site_area,
    site_area_unit,
    built_up_area,
    approximate_area,
    number_of_floors,
    number_of_bedrooms,
    number_of_bathrooms,
    has_balcony,
    has_parking,
    parking_spaces,
    quality_preference,
    budget_range_min,
    budget_range_max,
    package_type,
    package_inclusions,
    expected_timeline,
    status,
    client_requirements,
    initial_discussion_notes
  } = req.body;

  if (!enquiry_id || !requirement_title) {
    return res.status(400).json({ error: "Enquiry ID and Requirement Title are required" });
  }

  try {
    const query = `
      UPDATE enquiry_requirements 
      SET 
        enquiry_id = $1,
        requirement_number = $2,
        requirement_title = $3,
        requirement_description = $4,
        project_type = $5,
        construction_type = $6,
        site_area = $7,
        site_area_unit = $8,
        built_up_area = $9,
        approximate_area = $10,
        number_of_floors = $11,
        number_of_bedrooms = $12,
        number_of_bathrooms = $13,
        has_balcony = $14,
        has_parking = $15,
        parking_spaces = $16,
        quality_preference = $17,
        budget_range_min = $18,
        budget_range_max = $19,
        package_type = $20,
        package_inclusions = $21,
        expected_timeline = $22,
        status = $23,
        client_requirements = $24,
        initial_discussion_notes = $25,
        updated_at = CURRENT_TIMESTAMP
      WHERE enquiry_requirement_id = $26
      RETURNING *
    `;
    
    const values = [
      enquiry_id,
      requirement_number,
      requirement_title,
      requirement_description,
      project_type,
      construction_type,
      site_area,
      site_area_unit || 'sqft',
      built_up_area,
      approximate_area,
      number_of_floors,
      number_of_bedrooms,
      number_of_bathrooms,
      has_balcony === true ? true : false,
      has_parking === true ? true : false,
      parking_spaces || 0,
      quality_preference,
      budget_range_min,
      budget_range_max,
      package_type,
      package_inclusions,
      expected_timeline,
      status || 'Draft',
      client_requirements,
      initial_discussion_notes,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry requirement not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirements/{id}:
 *   delete:
 *     summary: Delete an enquiry requirement by ID
 *     tags: [EnquiryRequirements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry requirement to delete
 *     responses:
 *       200:
 *         description: Enquiry requirement deleted successfully
 *       404:
 *         description: Enquiry requirement not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM enquiry_requirements WHERE enquiry_requirement_id = $1 RETURNING enquiry_requirement_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry requirement not found" });
    }
    
    res.json({ message: "Enquiry requirement deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /enquiry_requirements/enquiry/{enquiryId}:
 *   get:
 *     tags: [EnquiryRequirements]
 *     description: Retrieve all requirements for a specific enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry
 *     responses:
 *       200:
 *         description: List of requirements for the enquiry
 *       500:
 *         description: Internal server error
 */
router.get('/enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_requirements WHERE enquiry_id = $1 ORDER BY created_at DESC", 
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
 * /enquiry_requirements/status/{status}:
 *   get:
 *     tags: [EnquiryRequirements]
 *     description: Retrieve all requirements by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The status of requirements to retrieve
 *     responses:
 *       200:
 *         description: List of requirements with specified status
 *       500:
 *         description: Internal server error
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM enquiry_requirements WHERE status = $1 ORDER BY created_at DESC", 
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
 * /enquiry_requirements/search:
 *   get:
 *     tags: [EnquiryRequirements]
 *     description: Search requirements by title or description
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for requirement title or description
 *     responses:
 *       200:
 *         description: List of requirements matching the search criteria
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
      `SELECT * FROM enquiry_requirements 
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

module.exports = router;