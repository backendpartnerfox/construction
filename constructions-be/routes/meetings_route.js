const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: API for managing meetings
 */

/**
 * @swagger
 * /meetings:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve all meetings
 *     responses:
 *       200:
 *         description: List of meetings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type_of_meeting:
 *                     type: string
 *                   enquiry_id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   source:
 *                     type: string
 *                   target:
 *                     type: string
 *                   to_be_included:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   created_by:
 *                     type: string
 *                   location:
 *                     type: string
 *                   meeting_id:
 *                     type: string
 */

// Get all meetings
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const query = `
      SELECT 
        m.*,
        p.project_name,
        p.project_code,
        p.location as project_location,
        c.client_name
      FROM meetings m
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      ORDER BY m.date DESC
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
 * /meetings/{id}:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve a specific meeting by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the meeting to retrieve
 *     responses:
 *       200:
 *         description: Meeting details
 *       404:
 *         description: Meeting not found
 *       500:
 *         description: Internal server error
 */

// Get meeting by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        m.*,
        p.project_name,
        p.project_code,
        p.location as project_location,
        c.client_name
      FROM meetings m
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      WHERE m.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
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
 * /meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type_of_meeting:
 *                 type: string
 *               enquiry_id:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *               source:
 *                 type: string
 *               target:
 *                 type: string
 *               to_be_included:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               created_by:
 *                 type: string
 *               location:
 *                 type: string
 *               meeting_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    type_of_meeting,
    project_id,
    source,
    target,
    to_be_included,
    date,
    location,
    meeting_id,
    // New CRM-workflow fields (all optional, migration 007)
    title,
    related_entity_type,   // 'enquiry' | 'lead' | 'client' | 'project'
    related_entity_id,
    status,                // Scheduled|Confirmed|Completed|Cancelled|Rescheduled
    notes,
  } = req.body;

  // Prefer the authenticated user for coordinator + created_by; fall back to
  // whatever the client sent for backwards compat.
  const coordinator_user_id = req.body.coordinator_user_id || req.user?.id || null;
  const created_by = req.body.created_by || req.user?.username || null;

  try {
    const result = await db.query(
      `INSERT INTO meetings (
         type_of_meeting, project_id, source, target,
         to_be_included, date, created_by, location, meeting_id,
         title, related_entity_type, related_entity_id, status, notes,
         coordinator_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13,'Scheduled'),$14,$15)
       RETURNING *`,
      [
        type_of_meeting, project_id, source, target,
        to_be_included, date, created_by, location, meeting_id,
        title, related_entity_type, related_entity_id, status, notes,
        coordinator_user_id,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @swagger
 * /meetings/{id}:
 *   put:
 *     summary: Update an existing meeting by ID
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the meeting to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type_of_meeting:
 *                 type: string
 *               enquiry_id:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *               source:
 *                 type: string
 *               target:
 *                 type: string
 *               to_be_included:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               created_by:
 *                 type: string
 *               location:
 *                 type: string
 *               meeting_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       404:
 *         description: Meeting not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    type_of_meeting,
    project_id,
    source,
    target,
    to_be_included,
    date,
    created_by,
    location,
    meeting_id
  } = req.body;

  try {
    const query = `
      UPDATE meetings 
      SET 
        type_of_meeting = $1,
        project_id = $2,
        source = $3,
        target = $4,
        to_be_included = $5,
        date = $6,
        created_by = $7,
        location = $8,
        meeting_id = $9
      WHERE id = $10
      RETURNING *
    `;
    
    const values = [
      type_of_meeting,
      project_id,
      source,
      target,
      to_be_included,
      date,
      created_by,
      location,
      meeting_id,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Meeting not found" 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /meetings/{id}:
 *   delete:
 *     summary: Delete a meeting by ID
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the meeting to delete
 *     responses:
 *       200:
 *         description: Meeting deleted successfully
 *       404:
 *         description: Meeting not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM meetings WHERE id = $1 RETURNING id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Meeting not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Meeting deleted successfully" 
    });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /meetings/enquiry/{enquiryId}:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve all meetings for a specific enquiry
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the enquiry
 *     responses:
 *       200:
 *         description: List of meetings for the enquiry
 *       500:
 *         description: Internal server error
 */
router.get('/enquiry/:enquiryId', async (req, res) => {
  const db = req.db;
  const { enquiryId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM meetings WHERE enquiry_id = $1 ORDER BY date DESC", 
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
 * /meetings/project/{projectId}:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve all meetings for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of meetings for the project
 *       500:
 *         description: Internal server error
 */
// Get meetings by project
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const query = `
      SELECT 
        m.*,
        p.project_name,
        p.project_code,
        c.client_name
      FROM meetings m
      LEFT JOIN projects p ON m.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      WHERE m.project_id = $1 
      ORDER BY m.date DESC
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
 * /meetings/type/{type}:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve all meetings by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of meetings to retrieve
 *     responses:
 *       200:
 *         description: List of meetings of specified type
 *       500:
 *         description: Internal server error
 */
router.get('/type/:type', async (req, res) => {
  const db = req.db;
  const { type } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM meetings WHERE type_of_meeting = $1 ORDER BY date DESC", 
      [type]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /meetings/upcoming:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve all upcoming meetings
 *     responses:
 *       200:
 *         description: List of upcoming meetings
 *       500:
 *         description: Internal server error
 */
router.get('/upcoming', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM meetings WHERE date >= NOW() ORDER BY date ASC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /meetings/past:
 *   get:
 *     tags: [Meetings]
 *     description: Retrieve all past meetings
 *     responses:
 *       200:
 *         description: List of past meetings
 *       500:
 *         description: Internal server error
 */
router.get('/past', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM meetings WHERE date < NOW() ORDER BY date DESC"
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

// -----------------------------------------------------------------------
// CRM-workflow helpers (migration 007)
// -----------------------------------------------------------------------

// GET /meetings/entity/:type/:id — filter by any related entity
router.get('/entity/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!['enquiry','lead','client','project'].includes(type)) {
    return res.status(400).json({ error: 'type must be enquiry|lead|client|project' });
  }
  try {
    const r = await req.db.query(
      `SELECT * FROM meetings
        WHERE related_entity_type = $1 AND related_entity_id = $2
        ORDER BY date DESC NULLS LAST, id DESC`,
      [type, id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('[meetings/entity] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /meetings/:id/status — quick status update (Scheduled -> Confirmed etc.)
router.patch('/:id/status', async (req, res) => {
  const { status, notes } = req.body || {};
  const ALLOWED = ['Scheduled','Confirmed','Completed','Cancelled','Rescheduled'];
  if (!ALLOWED.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${ALLOWED.join(', ')}` });
  }
  try {
    const r = await req.db.query(
      `UPDATE meetings
          SET status = $1,
              notes  = COALESCE($2, notes)
        WHERE id = $3
        RETURNING *`,
      [status, notes || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('[meetings/:id/status] ', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;