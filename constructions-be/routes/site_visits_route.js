const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SiteVisits
 *   description: API for managing site visits
 */

/**
 * @swagger
 * /site_visits:
 *   get:
 *     tags: [SiteVisits]
 *     description: Retrieve all site visits
 *     responses:
 *       200:
 *         description: List of site visits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   created_by:
 *                     type: string
 *                   project_id:
 *                     type: integer
 *                   mom_id:
 *                     type: integer
 */

// Get all site visits
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const query = `
      SELECT 
        sv.*,
        p.project_name,
        p.project_code,
        p.location as project_location,
        c.client_name,
        m.type_of_meeting,
        m.date as meeting_date,
        mom.initial_mom
      FROM site_visits sv
      LEFT JOIN projects p ON sv.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      LEFT JOIN minutes_of_meeting mom ON sv.mom_id = mom.mom_id
      LEFT JOIN meetings m ON mom.meeting_id = m.id
      ORDER BY sv.id DESC
    `;
    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /site_visits/{id}:
 *   get:
 *     tags: [SiteVisits]
 *     description: Retrieve a specific site visit by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the site visit to retrieve
 *     responses:
 *       200:
 *         description: Site visit details
 *       404:
 *         description: Site visit not found
 *       500:
 *         description: Internal server error
 */

// Get site visit by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        sv.*,
        p.project_name,
        p.project_code,
        p.location as project_location,
        p.site_address,
        c.client_name,
        m.type_of_meeting,
        m.date as meeting_date,
        m.location as meeting_location,
        mom.initial_mom,
        mom.mom_sending
      FROM site_visits sv
      LEFT JOIN projects p ON sv.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      LEFT JOIN minutes_of_meeting mom ON sv.mom_id = mom.mom_id
      LEFT JOIN meetings m ON mom.meeting_id = m.id
      WHERE sv.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Site visit not found' 
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /site_visits:
 *   post:
 *     summary: Create a new site visit
 *     tags: [SiteVisits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               created_by:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               mom_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Site visit created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    created_by,
    project_id,
    mom_id
  } = req.body;

  try {
    const query = `
      INSERT INTO site_visits (
        created_by, project_id, mom_id
      ) 
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      created_by,
      project_id,
      mom_id
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
 * /site_visits/{id}:
 *   put:
 *     summary: Update an existing site visit by ID
 *     tags: [SiteVisits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the site visit to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               created_by:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               mom_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Site visit updated successfully
 *       404:
 *         description: Site visit not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    created_by,
    project_id,
    mom_id
  } = req.body;

  try {
    const query = `
      UPDATE site_visits 
      SET 
        created_by = $1,
        project_id = $2,
        mom_id = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [
      created_by,
      project_id,
      mom_id,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Site visit not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /site_visits/{id}:
 *   delete:
 *     summary: Delete a site visit by ID
 *     tags: [SiteVisits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the site visit to delete
 *     responses:
 *       200:
 *         description: Site visit deleted successfully
 *       404:
 *         description: Site visit not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM site_visits WHERE id = $1 RETURNING id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Site visit not found" });
    }
    
    res.json({ message: "Site visit deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /site_visits/project/{projectId}:
 *   get:
 *     tags: [SiteVisits]
 *     description: Retrieve all site visits for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of site visits for the project
 *       500:
 *         description: Internal server error
 */
// Get site visits by project
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const query = `
      SELECT 
        sv.*,
        p.project_name,
        p.project_code,
        m.type_of_meeting,
        m.date as meeting_date,
        mom.initial_mom,
        mom.mom_sending
      FROM site_visits sv
      LEFT JOIN projects p ON sv.project_id = p.project_id
      LEFT JOIN minutes_of_meeting mom ON sv.mom_id = mom.mom_id
      LEFT JOIN meetings m ON mom.meeting_id = m.id
      WHERE sv.project_id = $1 
      ORDER BY sv.id DESC
    `;
    const result = await db.query(query, [projectId]);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /site_visits/mom/{momId}:
 *   get:
 *     tags: [SiteVisits]
 *     description: Retrieve all site visits for a specific MOM
 *     parameters:
 *       - in: path
 *         name: momId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the minutes of meeting
 *     responses:
 *       200:
 *         description: List of site visits for the MOM
 *       500:
 *         description: Internal server error
 */
router.get('/mom/:momId', async (req, res) => {
  const db = req.db;
  const { momId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM site_visits WHERE mom_id = $1 ORDER BY id DESC", 
      [momId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;