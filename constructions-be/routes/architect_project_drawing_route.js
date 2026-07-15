const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ArchitectProjectDrawing
 *   description: API for managing architect project drawings and document uploads
 */

/**
 * @swagger
 * /architect_project_drawing:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve all architect project drawings
 *     responses:
 *       200:
 *         description: List of architect project drawings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   project_id:
 *                     type: integer
 *                   architect_id:
 *                     type: integer
 *                   client_id:
 *                     type: integer
 *                   upload_architect_documents:
 *                     type: string
 */

// Get all architect project drawings
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM architect_project_drawing ORDER BY id DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing/{id}:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve a specific architect project drawing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to retrieve
 *     responses:
 *       200:
 *         description: Architect project drawing details
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */

// Get architect project drawing by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM architect_project_drawing WHERE id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Architect project drawing not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing:
 *   post:
 *     summary: Create a new architect project drawing
 *     tags: [ArchitectProjectDrawing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - architect_id
 *               - upload_architect_documents
 *             properties:
 *               project_id:
 *                 type: integer
 *               architect_id:
 *                 type: integer
 *               client_id:
 *                 type: integer
 *               upload_architect_documents:
 *                 type: string
 *                 description: File path or URL to the uploaded document
 *     responses:
 *       201:
 *         description: Architect project drawing created successfully
 *       400:
 *         description: Required fields missing
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    architect_id,
    client_id,
    upload_architect_documents
  } = req.body;

  if (!project_id || !upload_architect_documents) {
    return res.status(400).json({ 
      success: false,
      error: "Project ID and Upload Architect Documents are required" 
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO architect_project_drawing (
        project_id, architect_id, client_id, upload_architect_documents
      ) VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        project_id,
        architect_id || null,
        client_id || null,
        upload_architect_documents
      ]
    );

    res.status(201).json({
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
 * /architect_project_drawing/{id}:
 *   put:
 *     summary: Update an existing architect project drawing by ID
 *     tags: [ArchitectProjectDrawing]
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
 *             required:
 *               - project_id
 *               - architect_id
 *               - upload_architect_documents
 *             properties:
 *               project_id:
 *                 type: integer
 *               architect_id:
 *                 type: integer
 *               client_id:
 *                 type: integer
 *               upload_architect_documents:
 *                 type: string
 *     responses:
 *       200:
 *         description: Architect project drawing updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    architect_id,
    client_id,
    upload_architect_documents
  } = req.body;

  if (!project_id || !upload_architect_documents) {
    return res.status(400).json({ 
      success: false,
      error: "Project ID and Upload Architect Documents are required" 
    });
  }

  try {
    const result = await db.query(
      `UPDATE architect_project_drawing 
       SET project_id = $1, architect_id = $2, client_id = $3, upload_architect_documents = $4
       WHERE id = $5
       RETURNING *`,
      [
        project_id,
        architect_id || null,
        client_id || null,
        upload_architect_documents,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Architect project drawing not found" 
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
 * /architect_project_drawing/{id}:
 *   delete:
 *     summary: Delete an architect project drawing by ID
 *     tags: [ArchitectProjectDrawing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the drawing to delete
 *     responses:
 *       200:
 *         description: Architect project drawing deleted successfully
 *       404:
 *         description: Drawing not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM architect_project_drawing WHERE id = $1 RETURNING id", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Architect project drawing not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Architect project drawing deleted successfully" 
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
 * /architect_project_drawing/project/{projectId}:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve all drawings for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project to get drawings for
 *     responses:
 *       200:
 *         description: List of drawings for the specified project
 *       500:
 *         description: Internal server error
 */

// Get drawings by project ID
router.get('/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect_project_drawing WHERE project_id = $1 ORDER BY id DESC", 
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing/architect/{architectId}:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve all drawings by a specific architect
 *     parameters:
 *       - in: path
 *         name: architectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the architect to get drawings for
 *     responses:
 *       200:
 *         description: List of drawings by the specified architect
 *       500:
 *         description: Internal server error
 */

// Get drawings by architect ID
router.get('/architect/:architectId', async (req, res) => {
  const db = req.db;
  const { architectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect_project_drawing WHERE architect_id = $1 ORDER BY id DESC", 
      [architectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing/client/{clientId}:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve all drawings for a specific client
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client to get drawings for
 *     responses:
 *       200:
 *         description: List of drawings for the specified client
 *       500:
 *         description: Internal server error
 */

// Get drawings by client ID
router.get('/client/:clientId', async (req, res) => {
  const db = req.db;
  const { clientId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect_project_drawing WHERE client_id = $1 ORDER BY id DESC", 
      [clientId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing/project/{projectId}/architect/{architectId}:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve drawings for a specific project and architect
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *       - in: path
 *         name: architectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the architect
 *     responses:
 *       200:
 *         description: List of drawings for the specified project and architect
 *       500:
 *         description: Internal server error
 */

// Get drawings by project ID and architect ID
router.get('/project/:projectId/architect/:architectId', async (req, res) => {
  const db = req.db;
  const { projectId, architectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect_project_drawing WHERE project_id = $1 AND architect_id = $2 ORDER BY id DESC", 
      [projectId, architectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing/with-details:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve all drawings with project, architect, and client details
 *     responses:
 *       200:
 *         description: List of drawings with detailed information
 *       500:
 *         description: Internal server error
 */

// Get drawings with joined details
router.get('/with-details', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(`
      SELECT 
        apd.id,
        apd.project_id,
        apd.architect_id,
        apd.client_id,
        apd.upload_architect_documents,
        p.project_name,
        p.status as project_status,
        u.username as architect_username,
        u.first_name as architect_first_name,
        u.last_name as architect_last_name,
        c.client_name,
        c.primary_phone as client_phone,
        c.email as client_email
      FROM architect_project_drawing apd
      LEFT JOIN projects p ON apd.project_id = p.project_id
      LEFT JOIN users u ON apd.architect_id = u.id
      LEFT JOIN clients c ON apd.client_id = c.client_id
      ORDER BY apd.id DESC
    `);
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect_project_drawing/project/{projectId}/with-details:
 *   get:
 *     tags: [ArchitectProjectDrawing]
 *     description: Retrieve drawings for a specific project with detailed information
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of drawings with detailed information for the project
 *       500:
 *         description: Internal server error
 */

// Get drawings by project with details
router.get('/project/:projectId/with-details', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        apd.id,
        apd.project_id,
        apd.architect_id,
        apd.client_id,
        apd.upload_architect_documents,
        p.project_name,
        p.project_code,
        p.status as project_status,
        c.client_name
      FROM architect_project_drawing apd
      LEFT JOIN projects p ON apd.project_id = p.project_id
      LEFT JOIN clients c ON p.client_id = c.client_id
      WHERE apd.project_id = $1
      ORDER BY apd.id DESC
    `, [projectId]);
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

module.exports = router;