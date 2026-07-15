const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectDrawings
 *   description: API for managing architect drawings
 */

/**
 * @swagger
 * /architect_drawings:
 *   get:
 *     tags: [ArchitectDrawings]
 *     description: Retrieve all architect drawings with project information
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: drawing_type
 *         schema:
 *           type: string
 *         description: Filter by drawing type
 *       - in: query
 *         name: status_of_drawing
 *         schema:
 *           type: string
 *         description: Filter by drawing status
 *     responses:
 *       200:
 *         description: List of architect drawings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   drawing_id:
 *                     type: string
 *                   drawing_type:
 *                     type: string
 *                   project_id:
 *                     type: integer
 *                   status_of_drawing:
 *                     type: string
 *                   submit_to_client:
 *                     type: boolean
 *                   client_finalising:
 *                     type: boolean
 *                   remarks:
 *                     type: string
 *                   datetime:
 *                     type: string
 *                     format: date-time
 */

// Get all architect drawings
router.get('/', async (req, res) => {
  const db = req.db;
  const { project_id, drawing_type, status_of_drawing } = req.query;
  
  try {
    let query = `
      SELECT ad.*, p.project_name
      FROM architect_drawings ad
      LEFT JOIN projects p ON ad.project_id = p.project_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (project_id) {
      conditions.push(`ad.project_id = $${params.length + 1}`);
      params.push(project_id);
    }
    
    if (drawing_type) {
      conditions.push(`ad.drawing_type = $${params.length + 1}`);
      params.push(drawing_type);
    }
    
    if (status_of_drawing) {
      conditions.push(`ad.status_of_drawing = $${params.length + 1}`);
      params.push(status_of_drawing);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ad.datetime DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_drawings/{id}:
 *   get:
 *     tags: [ArchitectDrawings]
 *     description: Retrieve a specific architect drawing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to retrieve
 *     responses:
 *       200:
 *         description: Architect drawing details
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */

// Get architect drawing by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT ad.*, p.project_name
      FROM architect_drawings ad
      LEFT JOIN projects p ON ad.project_id = p.project_id
      WHERE ad.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Architect drawing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_drawings/project/{projectId}:
 *   get:
 *     tags: [ArchitectDrawings]
 *     description: Retrieve all drawings for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of drawings for the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

// Get drawings by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    // First check if project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [projectId]);
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const result = await db.query(`
      SELECT *
      FROM architect_drawings
      WHERE project_id = $1
      ORDER BY datetime DESC
    `, [projectId]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_drawings:
 *   post:
 *     summary: Create a new architect drawing
 *     tags: [ArchitectDrawings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - drawing_id
 *               - drawing_type
 *               - project_id
 *             properties:
 *               drawing_id:
 *                 type: string
 *               drawing_type:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               status_of_drawing:
 *                 type: string
 *                 default: 'Draft'
 *               submit_to_client:
 *                 type: boolean
 *                 default: false
 *               client_finalising:
 *                 type: boolean
 *                 default: false
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Drawing created successfully
 *       400:
 *         description: Invalid input - required fields missing
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    drawing_id, drawing_type, project_id, status_of_drawing = 'Draft',
    submit_to_client = false, client_finalising = false, remarks
  } = req.body;

  // Validate required fields
  if (!drawing_id) {
    return res.status(400).json({ error: "Drawing ID is required" });
  }
  if (!drawing_type) {
    return res.status(400).json({ error: "Drawing type is required" });
  }
  if (!project_id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    // Verify project exists
    const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.query(
      `INSERT INTO architect_drawings (
        drawing_id, drawing_type, project_id, status_of_drawing,
        submit_to_client, client_finalising, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [drawing_id, drawing_type, project_id, status_of_drawing, submit_to_client, client_finalising, remarks]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_drawings/{id}:
 *   put:
 *     summary: Update an existing architect drawing by ID
 *     tags: [ArchitectDrawings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               drawing_id:
 *                 type: string
 *               drawing_type:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               status_of_drawing:
 *                 type: string
 *               submit_to_client:
 *                 type: boolean
 *               client_finalising:
 *                 type: boolean
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Drawing updated successfully
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    drawing_id, drawing_type, project_id, status_of_drawing,
    submit_to_client, client_finalising, remarks
  } = req.body;

  try {
    // If project_id is being updated, verify it exists
    if (project_id) {
      const projectCheck = await db.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
      if (projectCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    const result = await db.query(
      `UPDATE architect_drawings 
       SET drawing_id = COALESCE($1, drawing_id), 
           drawing_type = COALESCE($2, drawing_type),
           project_id = COALESCE($3, project_id),
           status_of_drawing = COALESCE($4, status_of_drawing),
           submit_to_client = COALESCE($5, submit_to_client),
           client_finalising = COALESCE($6, client_finalising),
           remarks = COALESCE($7, remarks),
           datetime = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [drawing_id, drawing_type, project_id, status_of_drawing, submit_to_client, client_finalising, remarks, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Architect drawing not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_drawings/{id}/submit-to-client:
 *   patch:
 *     summary: Submit drawing to client
 *     tags: [ArchitectDrawings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to submit
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Drawing submitted to client successfully
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/submit-to-client', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const result = await db.query(
      `UPDATE architect_drawings 
       SET submit_to_client = true, 
           status_of_drawing = 'Submitted to Client',
           remarks = COALESCE($1, remarks),
           datetime = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [remarks, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Architect drawing not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_drawings/{id}/finalize:
 *   patch:
 *     summary: Finalize drawing by client
 *     tags: [ArchitectDrawings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to finalize
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Drawing finalized successfully
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/finalize', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const result = await db.query(
      `UPDATE architect_drawings 
       SET client_finalising = true, 
           status_of_drawing = 'Finalized',
           remarks = COALESCE($1, remarks),
           datetime = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [remarks, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Architect drawing not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_drawings/{id}:
 *   delete:
 *     summary: Delete an architect drawing by ID
 *     tags: [ArchitectDrawings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to delete
 *     responses:
 *       200:
 *         description: Drawing deleted successfully
 *       400:
 *         description: Cannot delete finalized drawing
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if drawing is finalized (shouldn't be deleted if finalized)
    const statusCheck = await db.query(
      'SELECT client_finalising FROM architect_drawings WHERE id = $1', 
      [id]
    );
    
    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "Architect drawing not found" });
    }
    
    if (statusCheck.rows[0].client_finalising) {
      return res.status(400).json({ 
        error: "Cannot delete finalized drawing. Change status first." 
      });
    }
    
    const result = await db.query('DELETE FROM architect_drawings WHERE id = $1', [id]);
    
    res.json({ message: "Architect drawing deleted successfully" });
  } catch (err) {
    console.error('Database delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_drawings/search/{drawingId}:
 *   get:
 *     tags: [ArchitectDrawings]
 *     description: Search drawings by drawing ID
 *     parameters:
 *       - in: path
 *         name: drawingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The drawing ID or part of drawing ID to search for
 *     responses:
 *       200:
 *         description: List of matching drawings
 *       500:
 *         description: Internal server error
 */
router.get('/search/:drawingId', async (req, res) => {
  const db = req.db;
  const { drawingId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT ad.*, p.project_name
      FROM architect_drawings ad
      LEFT JOIN projects p ON ad.project_id = p.project_id
      WHERE ad.drawing_id ILIKE $1
      ORDER BY ad.datetime DESC
    `, [`%${drawingId}%`]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_drawings/drawing-types:
 *   get:
 *     tags: [ArchitectDrawings]
 *     description: Get all unique drawing types
 *     responses:
 *       200:
 *         description: List of unique drawing types
 *       500:
 *         description: Internal server error
 */
router.get('/drawing-types', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT DISTINCT drawing_type 
      FROM architect_drawings 
      WHERE drawing_type IS NOT NULL
      ORDER BY drawing_type
    `);
    
    res.json(result.rows.map(row => row.drawing_type));
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_drawings/statuses:
 *   get:
 *     tags: [ArchitectDrawings]
 *     description: Get all unique drawing statuses
 *     responses:
 *       200:
 *         description: List of unique drawing statuses
 *       500:
 *         description: Internal server error
 */
router.get('/statuses', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT DISTINCT status_of_drawing 
      FROM architect_drawings 
      WHERE status_of_drawing IS NOT NULL
      ORDER BY status_of_drawing
    `);
    
    res.json(result.rows.map(row => row.status_of_drawing));
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;