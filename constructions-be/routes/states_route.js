const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: States
 *   description: API for managing states 
 */

/**
 * @swagger
 * /states:
 *   get:
 *     tags: [States]
 *     description: Retrieve all states from the states table 
 *     responses:
 *       200:
 *         description: List of states
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 */

// Get all states
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    const result = await db.query('SELECT * FROM states ORDER BY name');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /states/{id}:
 *   get:
 *     tags: [States]
 *     description: Retrieve a specific state by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the state to retrieve
 *     responses:
 *       200:
 *         description: State details
 *       404:
 *         description: State not found
 *       500:
 *         description: Internal server error
 */

// Get state by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM states WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /states:
 *   post:
 *     summary: Create a new state
 *     tags: [States]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: State created successfully
 *       400:
 *         description: Invalid input - name is required
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { name, code } = req.body;

  if (!name) {
    return res.status(400).json({ error: "State name is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO states (name, code) 
       VALUES ($1, $2) 
       RETURNING id, name, code`,
      [name, code || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Check for unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: "State with this name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /states/{id}:
 *   put:
 *     summary: Update an existing state by ID
 *     tags: [States]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the state to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: State updated successfully
 *       400:
 *         description: Invalid input - name is required
 *       404:
 *         description: State not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { name, code } = req.body;

  if (!name) {
    return res.status(400).json({ error: "State name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE states 
       SET name = $1, code = $2 
       WHERE id = $3 
       RETURNING id, name, code`,
      [name, code || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "State not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    // Check for unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: "State with this name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /states/{id}:
 *   delete:
 *     summary: Delete a state by ID
 *     tags: [States]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the state to delete
 *     responses:
 *       200:
 *         description: State deleted successfully
 *       400:
 *         description: Cannot delete state with associated cities
 *       404:
 *         description: State not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // First check if there are any cities associated with this state
    const cityCheck = await db.query('SELECT COUNT(*) FROM cities WHERE state_id = $1', [id]);
    
    if (parseInt(cityCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete state because it has associated cities. Delete the cities first." 
      });
    }
    
    const result = await db.query('DELETE FROM states WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "State not found" });
    }
    
    res.json({ message: "State deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /states/{id}/cities:
 *   get:
 *     tags: [States]
 *     description: Retrieve all cities for a specific state
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the state
 *     responses:
 *       200:
 *         description: List of cities in the state
 *       404:
 *         description: State not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/cities', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if the state exists
    const stateCheck = await db.query('SELECT id FROM states WHERE id = $1', [id]);
    
    if (stateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'State not found' });
    }
    
    const result = await db.query(
      'SELECT * FROM cities WHERE state_id = $1 ORDER BY name',
      [id]
    );
    
    res.json(result.rows);
  } catch (queryErr) {
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;