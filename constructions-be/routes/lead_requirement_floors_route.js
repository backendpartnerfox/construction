const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Lead Requirement Floors
 *   description: API for managing lead requirement floor details
 */

/**
 * @swagger
 * /lead_requirement_floors:
 *   get:
 *     tags: [Lead Requirement Floors]
 *     description: Retrieve all lead requirement floors with lead information
 *     parameters:
 *       - in: query
 *         name: lead_requirement_id
 *         schema:
 *           type: integer
 *         description: Filter by lead requirement ID
 *       - in: query
 *         name: floor_number
 *         schema:
 *           type: integer
 *         description: Filter by floor number
 *       - in: query
 *         name: is_habitable
 *         schema:
 *           type: boolean
 *         description: Filter by habitable status
 *     responses:
 *       200:
 *         description: List of lead requirement floors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   floor_detail_id:
 *                     type: integer
 *                   lead_requirement_id:
 *                     type: integer
 *                   floor_number:
 *                     type: integer
 *                   floor_name:
 *                     type: string
 *                   floor_ffl:
 *                     type: number
 *                   floor_height:
 *                     type: number
 *                   floor_usage:
 *                     type: string
 *                   floor_area:
 *                     type: number
 *                   is_habitable:
 *                     type: boolean
 *                   bedrooms_count:
 *                     type: integer
 *                   bathrooms_count:
 *                     type: integer
 *                   living_areas_count:
 *                     type: integer
 *                   balcony_area:
 *                     type: number
 *                   utility_area:
 *                     type: number
 */

// Get all lead requirement floors
router.get('/', async (req, res) => {
  const db = req.db;
  const { lead_requirement_id, floor_number, is_habitable } = req.query;
  
  try {
    let query = `
      SELECT lrf.*, lr.construction_type, l.primary_contact_name, l.primary_phone
      FROM lead_requirement_floors lrf
      LEFT JOIN lead_requirements lr ON lrf.lead_requirement_id = lr.lead_requirement_id
      LEFT JOIN leads l ON lr.lead_id = l.lead_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (lead_requirement_id) {
      conditions.push(`lrf.lead_requirement_id = $${params.length + 1}`);
      params.push(lead_requirement_id);
    }
    
    if (floor_number) {
      conditions.push(`lrf.floor_number = $${params.length + 1}`);
      params.push(floor_number);
    }
    
    if (is_habitable !== undefined) {
      conditions.push(`lrf.is_habitable = $${params.length + 1}`);
      params.push(is_habitable === 'true');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY lrf.floor_number`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirement_floors/{id}:
 *   get:
 *     tags: [Lead Requirement Floors]
 *     description: Retrieve a specific lead requirement floor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the floor detail to retrieve
 *     responses:
 *       200:
 *         description: Lead requirement floor details
 *       404:
 *         description: Floor detail not found
 *       500:
 *         description: Internal server error
 */

// Get lead requirement floor by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT lrf.*, lr.construction_type, l.primary_contact_name, l.primary_phone
      FROM lead_requirement_floors lrf
      LEFT JOIN lead_requirements lr ON lrf.lead_requirement_id = lr.lead_requirement_id
      LEFT JOIN leads l ON lr.lead_id = l.lead_id
      WHERE lrf.floor_detail_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement floor not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_floors/requirement/{requirementId}:
 *   get:
 *     tags: [Lead Requirement Floors]
 *     description: Retrieve all floors for a specific lead requirement
 *     parameters:
 *       - in: path
 *         name: requirementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead requirement
 *     responses:
 *       200:
 *         description: List of floors for the lead requirement
 *       404:
 *         description: Lead requirement not found
 *       500:
 *         description: Internal server error
 */

// Get floors by lead requirement ID
router.get('/requirement/:requirementId', async (req, res) => {
  const db = req.db;
  const { requirementId } = req.params;
  
  try {
    // First check if lead requirement exists
    const requirementCheck = await db.query('SELECT lead_requirement_id FROM lead_requirements WHERE lead_requirement_id = $1', [requirementId]);
    
    if (requirementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement not found' });
    }
    
    const result = await db.query(`
      SELECT *
      FROM lead_requirement_floors
      WHERE lead_requirement_id = $1
      ORDER BY floor_number
    `, [requirementId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /lead_requirement_floors:
 *   post:
 *     summary: Create a new lead requirement floor
 *     tags: [Lead Requirement Floors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lead_requirement_id
 *               - floor_number
 *             properties:
 *               lead_requirement_id:
 *                 type: integer
 *               floor_number:
 *                 type: integer
 *               floor_name:
 *                 type: string
 *               floor_ffl:
 *                 type: number
 *               floor_height:
 *                 type: number
 *               floor_usage:
 *                 type: string
 *               floor_area:
 *                 type: number
 *               is_habitable:
 *                 type: boolean
 *                 default: true
 *               bedrooms_count:
 *                 type: integer
 *                 default: 0
 *               bathrooms_count:
 *                 type: integer
 *                 default: 0
 *               living_areas_count:
 *                 type: integer
 *                 default: 0
 *               balcony_area:
 *                 type: number
 *                 default: 0
 *               utility_area:
 *                 type: number
 *                 default: 0
 *               floor_specific_requirements:
 *                 type: string
 *               flooring_type:
 *                 type: string
 *               ceiling_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Floor detail created successfully
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Lead requirement not found
 *       409:
 *         description: Floor number already exists for this requirement
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    lead_requirement_id, floor_number, floor_name, floor_ffl, floor_height,
    floor_usage, floor_area, is_habitable = true, bedrooms_count = 0,
    bathrooms_count = 0, living_areas_count = 0, balcony_area = 0,
    utility_area = 0, floor_specific_requirements, flooring_type, ceiling_type
  } = req.body;

  // Validate required fields
  if (!lead_requirement_id) {
    return res.status(400).json({ error: "Lead requirement ID is required" });
  }
  if (!floor_number) {
    return res.status(400).json({ error: "Floor number is required" });
  }

  try {
    // Verify lead requirement exists
    const requirementCheck = await db.query('SELECT lead_requirement_id FROM lead_requirements WHERE lead_requirement_id = $1', [lead_requirement_id]);
    if (requirementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement not found' });
    }

    // Check if floor number already exists for this requirement
    const floorCheck = await db.query(
      'SELECT floor_detail_id FROM lead_requirement_floors WHERE lead_requirement_id = $1 AND floor_number = $2',
      [lead_requirement_id, floor_number]
    );
    
    if (floorCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Floor number already exists for this lead requirement' });
    }

    const result = await db.query(
      `INSERT INTO lead_requirement_floors (
        lead_requirement_id, floor_number, floor_name, floor_ffl, floor_height,
        floor_usage, floor_area, is_habitable, bedrooms_count, bathrooms_count,
        living_areas_count, balcony_area, utility_area, floor_specific_requirements,
        flooring_type, ceiling_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
       RETURNING *`,
      [
        lead_requirement_id, floor_number, floor_name, floor_ffl, floor_height,
        floor_usage, floor_area, is_habitable, bedrooms_count, bathrooms_count,
        living_areas_count, balcony_area, utility_area, floor_specific_requirements,
        flooring_type, ceiling_type
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_floors/{id}:
 *   put:
 *     summary: Update an existing lead requirement floor by ID
 *     tags: [Lead Requirement Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the floor detail to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               floor_number:
 *                 type: integer
 *               floor_name:
 *                 type: string
 *               floor_ffl:
 *                 type: number
 *               floor_height:
 *                 type: number
 *               floor_usage:
 *                 type: string
 *               floor_area:
 *                 type: number
 *               is_habitable:
 *                 type: boolean
 *               bedrooms_count:
 *                 type: integer
 *               bathrooms_count:
 *                 type: integer
 *               living_areas_count:
 *                 type: integer
 *               balcony_area:
 *                 type: number
 *               utility_area:
 *                 type: number
 *               floor_specific_requirements:
 *                 type: string
 *               flooring_type:
 *                 type: string
 *               ceiling_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Floor detail updated successfully
 *       404:
 *         description: Floor detail not found
 *       409:
 *         description: Floor number already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    floor_number, floor_name, floor_ffl, floor_height, floor_usage, floor_area,
    is_habitable, bedrooms_count, bathrooms_count, living_areas_count,
    balcony_area, utility_area, floor_specific_requirements, flooring_type, ceiling_type
  } = req.body;

  try {
    // Get current record
    const currentRecord = await db.query('SELECT * FROM lead_requirement_floors WHERE floor_detail_id = $1', [id]);
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: "Lead requirement floor not found" });
    }

    const current = currentRecord.rows[0];

    // If floor number is being changed, check for duplicates
    if (floor_number && floor_number !== current.floor_number) {
      const duplicateCheck = await db.query(
        'SELECT floor_detail_id FROM lead_requirement_floors WHERE lead_requirement_id = $1 AND floor_number = $2 AND floor_detail_id != $3',
        [current.lead_requirement_id, floor_number, id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Floor number already exists for this lead requirement' });
      }
    }

    const result = await db.query(
      `UPDATE lead_requirement_floors 
       SET floor_number = COALESCE($1, floor_number),
           floor_name = COALESCE($2, floor_name),
           floor_ffl = COALESCE($3, floor_ffl),
           floor_height = COALESCE($4, floor_height),
           floor_usage = COALESCE($5, floor_usage),
           floor_area = COALESCE($6, floor_area),
           is_habitable = COALESCE($7, is_habitable),
           bedrooms_count = COALESCE($8, bedrooms_count),
           bathrooms_count = COALESCE($9, bathrooms_count),
           living_areas_count = COALESCE($10, living_areas_count),
           balcony_area = COALESCE($11, balcony_area),
           utility_area = COALESCE($12, utility_area),
           floor_specific_requirements = COALESCE($13, floor_specific_requirements),
           flooring_type = COALESCE($14, flooring_type),
           ceiling_type = COALESCE($15, ceiling_type)
       WHERE floor_detail_id = $16 
       RETURNING *`,
      [
        floor_number, floor_name, floor_ffl, floor_height, floor_usage, floor_area,
        is_habitable, bedrooms_count, bathrooms_count, living_areas_count,
        balcony_area, utility_area, floor_specific_requirements, flooring_type,
        ceiling_type, id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_floors/{id}:
 *   delete:
 *     summary: Delete a lead requirement floor by ID
 *     tags: [Lead Requirement Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the floor detail to delete
 *     responses:
 *       200:
 *         description: Floor detail deleted successfully
 *       404:
 *         description: Floor detail not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM lead_requirement_floors WHERE floor_detail_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lead requirement floor not found" });
    }
    
    res.json({ message: "Lead requirement floor deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /lead_requirement_floors/requirement/{requirementId}/summary:
 *   get:
 *     tags: [Lead Requirement Floors]
 *     description: Get floor summary for a lead requirement
 *     parameters:
 *       - in: path
 *         name: requirementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the lead requirement
 *     responses:
 *       200:
 *         description: Floor summary for the lead requirement
 *       404:
 *         description: Lead requirement not found
 *       500:
 *         description: Internal server error
 */
router.get('/requirement/:requirementId/summary', async (req, res) => {
  const db = req.db;
  const { requirementId } = req.params;
  
  try {
    const requirementCheck = await db.query('SELECT lead_requirement_id FROM lead_requirements WHERE lead_requirement_id = $1', [requirementId]);
    
    if (requirementCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lead requirement not found' });
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_floors,
        COUNT(CASE WHEN is_habitable = true THEN 1 END) as habitable_floors,
        SUM(floor_area) as total_floor_area,
        SUM(balcony_area) as total_balcony_area,
        SUM(utility_area) as total_utility_area,
        SUM(bedrooms_count) as total_bedrooms,
        SUM(bathrooms_count) as total_bathrooms,
        SUM(living_areas_count) as total_living_areas,
        MIN(floor_number) as lowest_floor,
        MAX(floor_number) as highest_floor
      FROM lead_requirement_floors 
      WHERE lead_requirement_id = $1
    `, [requirementId]);
    
    res.json(result.rows[0]);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;