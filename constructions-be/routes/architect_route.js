const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Architect
 *   description: API for managing architect assignments
 */

/**
 * @swagger
 * /architect:
 *   get:
 *     tags: [Architect]
 *     description: Retrieve all architect assignments
 *     responses:
 *       200:
 *         description: List of architect assignments
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
 *                   client_requirement_id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 */

// Get all architect assignments
router.get('/architect', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM architect ORDER BY id DESC');
    const rows = result.rows;
    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect/{id}:
 *   get:
 *     tags: [Architect]
 *     description: Retrieve a specific architect assignment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the architect assignment to retrieve
 *     responses:
 *       200:
 *         description: Architect assignment details
 *       404:
 *         description: Architect assignment not found
 *       500:
 *         description: Internal server error
 */

// Get architect assignment by ID
router.get('/architect/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM architect WHERE id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Architect assignment not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect:
 *   post:
 *     summary: Create a new architect assignment
 *     tags: [Architect]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               client_requirement_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Architect assignment created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/architect', async (req, res) => {
  const db = req.db;
  const {
    project_id,
    client_requirement_id,
    user_id
  } = req.body;

  try {
    const query = `
      INSERT INTO architect (project_id, client_requirement_id, user_id) 
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      project_id,
      client_requirement_id,
      user_id
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
 * /architect/{id}:
 *   put:
 *     summary: Update an existing architect assignment by ID
 *     tags: [Architect]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the architect assignment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               client_requirement_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Architect assignment updated successfully
 *       404:
 *         description: Architect assignment not found
 *       500:
 *         description: Internal server error
 */
router.put('/architect/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    project_id,
    client_requirement_id,
    user_id
  } = req.body;

  try {
    const query = `
      UPDATE architect 
      SET 
        project_id = $1,
        client_requirement_id = $2,
        user_id = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [
      project_id,
      client_requirement_id,
      user_id,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Architect assignment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect/{id}:
 *   delete:
 *     summary: Delete an architect assignment by ID
 *     tags: [Architect]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the architect assignment to delete
 *     responses:
 *       200:
 *         description: Architect assignment deleted successfully
 *       404:
 *         description: Architect assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/architect/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM architect WHERE id = $1 RETURNING id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Architect assignment not found" });
    }
    
    res.json({ message: "Architect assignment deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /architect/project/{projectId}:
 *   get:
 *     tags: [Architect]
 *     description: Retrieve all architect assignments for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of architect assignments for the project
 *       500:
 *         description: Internal server error
 */
router.get('/architect/project/:projectId', async (req, res) => {
  const db = req.db;
  const { projectId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect WHERE project_id = $1 ORDER BY id DESC", 
      [projectId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect/user/{userId}:
 *   get:
 *     tags: [Architect]
 *     description: Retrieve all assignments for a specific architect/user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user/architect
 *     responses:
 *       200:
 *         description: List of assignments for the architect
 *       500:
 *         description: Internal server error
 */
router.get('/architect/user/:userId', async (req, res) => {
  const db = req.db;
  const { userId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect WHERE user_id = $1 ORDER BY id DESC", 
      [userId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /architect/requirement/{requirementId}:
 *   get:
 *     tags: [Architect]
 *     description: Retrieve all architect assignments for a specific client requirement
 *     parameters:
 *       - in: path
 *         name: requirementId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the client requirement
 *     responses:
 *       200:
 *         description: List of architect assignments for the requirement
 *       500:
 *         description: Internal server error
 */
router.get('/architect/requirement/:requirementId', async (req, res) => {
  const db = req.db;
  const { requirementId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM architect WHERE client_requirement_id = $1 ORDER BY id DESC", 
      [requirementId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;