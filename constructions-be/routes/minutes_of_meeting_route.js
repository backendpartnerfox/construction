const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MinutesOfMeeting
 *   description: API for managing minutes of meeting
 */

/**
 * @swagger
 * /minutes_of_meeting:
 *   get:
 *     tags: [MinutesOfMeeting]
 *     description: Retrieve all minutes of meeting
 *     responses:
 *       200:
 *         description: List of minutes of meeting
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   mom_id:
 *                     type: integer
 *                   meeting_id:
 *                     type: integer
 *                   initial_mom:
 *                     type: string
 *                   mom_sending:
 *                     type: string
 *                   project_id:
 *                     type: integer
 */

// Get all minutes of meeting
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const query = `
      SELECT 
        mom.*,
        m.type_of_meeting,
        m.date as meeting_date,
        m.location as meeting_location,
        p.project_name,
        p.project_code,
        c.client_name
      FROM minutes_of_meeting mom
      LEFT JOIN meetings m ON mom.meeting_id = m.id
      LEFT JOIN projects p ON mom.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      ORDER BY mom.mom_id DESC
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
 * /minutes_of_meeting/{id}:
 *   get:
 *     tags: [MinutesOfMeeting]
 *     description: Retrieve a specific minutes of meeting by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the minutes of meeting to retrieve
 *     responses:
 *       200:
 *         description: Minutes of meeting details
 *       404:
 *         description: Minutes of meeting not found
 *       500:
 *         description: Internal server error
 */

// Get minutes of meeting by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        mom.*,
        m.type_of_meeting,
        m.date as meeting_date,
        m.location as meeting_location,
        m.to_be_included,
        p.project_name,
        p.project_code,
        c.client_name
      FROM minutes_of_meeting mom
      LEFT JOIN meetings m ON mom.meeting_id = m.id
      LEFT JOIN projects p ON mom.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      WHERE mom.mom_id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Minutes of meeting not found' 
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
 * /minutes_of_meeting:
 *   post:
 *     summary: Create new minutes of meeting
 *     tags: [MinutesOfMeeting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meeting_id:
 *                 type: integer
 *               initial_mom:
 *                 type: string
 *               mom_sending:
 *                 type: string
 *               project_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Minutes of meeting created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    meeting_id,
    initial_mom,
    mom_sending,
    project_id
  } = req.body;

  try {
    const query = `
      INSERT INTO minutes_of_meeting (meeting_id, initial_mom, mom_sending, project_id) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      meeting_id,
      initial_mom,
      mom_sending,
      project_id
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
 * /minutes_of_meeting/{id}:
 *   put:
 *     summary: Update existing minutes of meeting by ID
 *     tags: [MinutesOfMeeting]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the minutes of meeting to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meeting_id:
 *                 type: integer
 *               initial_mom:
 *                 type: string
 *               mom_sending:
 *                 type: string
 *               project_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Minutes of meeting updated successfully
 *       404:
 *         description: Minutes of meeting not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    meeting_id,
    initial_mom,
    mom_sending,
    project_id
  } = req.body;

  try {
    const query = `
      UPDATE minutes_of_meeting 
      SET 
        meeting_id = $1,
        initial_mom = $2,
        mom_sending = $3,
        project_id = $4
      WHERE mom_id = $5
      RETURNING *
    `;
    
    const values = [
      meeting_id,
      initial_mom,
      mom_sending,
      project_id,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Minutes of meeting not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /minutes_of_meeting/{id}:
 *   delete:
 *     summary: Delete minutes of meeting by ID
 *     tags: [MinutesOfMeeting]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the minutes of meeting to delete
 *     responses:
 *       200:
 *         description: Minutes of meeting deleted successfully
 *       404:
 *         description: Minutes of meeting not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM minutes_of_meeting WHERE mom_id = $1 RETURNING mom_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Minutes of meeting not found" });
    }
    
    res.json({ message: "Minutes of meeting deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /minutes_of_meeting/meeting/{meetingId}:
 *   get:
 *     tags: [MinutesOfMeeting]
 *     description: Retrieve all minutes for a specific meeting
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the meeting
 *     responses:
 *       200:
 *         description: List of minutes for the meeting
 *       500:
 *         description: Internal server error
 */
router.get('/meeting/:meetingId', async (req, res) => {
  const db = req.db;
  const { meetingId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM minutes_of_meeting WHERE meeting_id = $1 ORDER BY mom_id DESC", 
      [meetingId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /minutes_of_meeting/project/{projectId}:
 *   get:
 *     tags: [MinutesOfMeeting]
 *     description: Retrieve all minutes for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of minutes for the project
 *       500:
 *         description: Internal server error
 */
// Get minutes by project
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const query = `
      SELECT 
        mom.*,
        m.type_of_meeting,
        m.date as meeting_date,
        m.location as meeting_location,
        p.project_name,
        p.project_code
      FROM minutes_of_meeting mom
      LEFT JOIN meetings m ON mom.meeting_id = m.id
      LEFT JOIN projects p ON mom.project_id = p.project_id
      WHERE mom.project_id = $1 
      ORDER BY mom.mom_id DESC
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
 * /minutes_of_meeting/search:
 *   get:
 *     tags: [MinutesOfMeeting]
 *     description: Search minutes by content
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term for minutes content
 *     responses:
 *       200:
 *         description: List of minutes matching the search criteria
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
      `SELECT * FROM minutes_of_meeting 
       WHERE initial_mom ILIKE $1 
       OR mom_sending ILIKE $1
       ORDER BY mom_id DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;