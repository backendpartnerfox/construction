const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cities
 *   description: API for managing cities 
 */

/**
 * @swagger
 * /cities:
 *   get:
 *     tags: [Cities]
 *     description: Retrieve all cities with their state information 
 *     responses:
 *       200:
 *         description: List of cities
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
 *                   state_id:
 *                     type: integer
 *                   state_name:
 *                     type: string
 *                   state_code:
 *                     type: string
 */

// Get all cities with state info
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query(`
      SELECT c.id, c.name, c.state_id, s.name AS state_name, s.code AS state_code
      FROM cities c
      JOIN states s ON c.state_id = s.id
      ORDER BY s.name, c.name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /cities/{id}:
 *   get:
 *     tags: [Cities]
 *     description: Retrieve a specific city by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the city to retrieve
 *     responses:
 *       200:
 *         description: City details
 *       404:
 *         description: City not found
 *       500:
 *         description: Internal server error
 */

// Get city by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT c.id, c.name, c.state_id, s.name AS state_name, s.code AS state_code
      FROM cities c
      JOIN states s ON c.state_id = s.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /cities/state/{stateId}:
 *   get:
 *     tags: [Cities]
 *     description: Retrieve all cities for a specific state
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the state to get cities for
 *     responses:
 *       200:
 *         description: List of cities in the state
 *       404:
 *         description: State not found
 *       500:
 *         description: Internal server error
 */

// Get cities by state ID
router.get('/state/:stateId', async (req, res) => {
  const db = req.db;
  const { stateId } = req.params;
  
  try {
    // First check if state exists
    const stateCheck = await db.query('SELECT id FROM states WHERE id = $1', [stateId]);
    
    if (stateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'State not found' });
    }
    
    const result = await db.query(
      'SELECT * FROM cities WHERE state_id = $1 ORDER BY name',
      [stateId]
    );
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /cities:
 *   post:
 *     summary: Create a new city
 *     tags: [Cities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               state_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: City created successfully
 *       400:
 *         description: Invalid input - name and state_id are required
 *       404:
 *         description: State not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { name, state_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: "City name is required" });
  }

  if (!state_id) {
    return res.status(400).json({ error: "State ID is required" });
  }

  try {
    // First verify the state exists
    const stateCheck = await db.query('SELECT id FROM states WHERE id = $1', [state_id]);
    
    if (stateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'State not found' });
    }

    const result = await db.query(
      `INSERT INTO cities (name, state_id) 
       VALUES ($1, $2) 
       RETURNING id, name, state_id`,
      [name, state_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /cities/{id}:
 *   put:
 *     summary: Update an existing city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the city to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               state_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: City updated successfully
 *       400:
 *         description: Invalid input - name and state_id are required
 *       404:
 *         description: City or state not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { name, state_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: "City name is required" });
  }

  if (!state_id) {
    return res.status(400).json({ error: "State ID is required" });
  }

  try {
    // First verify the state exists
    const stateCheck = await db.query('SELECT id FROM states WHERE id = $1', [state_id]);
    
    if (stateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'State not found' });
    }

    const result = await db.query(
      `UPDATE cities 
       SET name = $1, state_id = $2 
       WHERE id = $3 
       RETURNING id, name, state_id`,
      [name, state_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /cities/{id}:
 *   delete:
 *     summary: Delete a city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the city to delete
 *     responses:
 *       200:
 *         description: City deleted successfully
 *       400:
 *         description: Cannot delete city with users associated with it
 *       404:
 *         description: City not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // First check if there are any users associated with this city
    const userCheck = await db.query('SELECT COUNT(*) FROM users WHERE city_id = $1', [id]);
    
    if (parseInt(userCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete city because it has associated users. Update the users first." 
      });
    }
    
    const result = await db.query('DELETE FROM cities WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "City not found" });
    }
    
    res.json({ message: "City deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /cities/search/{name}:
 *   get:
 *     tags: [Cities]
 *     description: Search cities by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name or part of name to search for
 *     responses:
 *       200:
 *         description: List of matching cities
 *       500:
 *         description: Internal server error
 */
router.get('/search/:name', async (req, res) => {
  const db = req.db;
  const { name } = req.params;
  
  try {
    const result = await db.query(`
      SELECT c.id, c.name, c.state_id, s.name AS state_name
      FROM cities c
      JOIN states s ON c.state_id = s.id
      WHERE c.name ILIKE $1
      ORDER BY s.name, c.name
    `, [`%${name}%`]);
    
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

module.exports = router;