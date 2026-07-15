const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Window Dimensions
 *   description: API for managing window dimensions
 */

/**
 * @swagger
 * /window_dimensions:
 *   get:
 *     tags: [Window Dimensions]
 *     description: Retrieve all window dimensions
 *     responses:
 *       200:
 *         description: List of window dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dimension_id:
 *                     type: integer
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *                   thickness:
 *                     type: number
 *                   description:
 *                     type: string
 *                   window_type:
 *                     type: string
 *                   is_standard:
 *                     type: boolean
 *                   is_active:
 *                     type: boolean
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM window_dimensions');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching window dimensions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /window_dimensions/{id}:
 *   get:
 *     tags: [Window Dimensions]
 *     description: Retrieve a specific window dimension by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the window dimension
 *     responses:
 *       200:
 *         description: Window dimension details
 *       404:
 *         description: Window dimension not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM window_dimensions WHERE dimension_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Window dimension not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching window dimension:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /window_dimensions:
 *   post:
 *     tags: [Window Dimensions]
 *     description: Create a new window dimension
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - width
 *               - height
 *               - thickness
 *             properties:
 *               width:
 *                 type: number
 *                 description: Width of the window
 *               height:
 *                 type: number
 *                 description: Height of the window
 *               thickness:
 *                 type: number
 *                 description: Thickness of the window
 *               description:
 *                 type: string
 *                 description: Description of the window dimension
 *               window_type:
 *                 type: string
 *                 description: Type of window
 *               is_standard:
 *                 type: boolean
 *                 description: Whether this is a standard dimension
 *               is_active:
 *                 type: boolean
 *                 description: Whether this dimension is active
 *     responses:
 *       201:
 *         description: Window dimension created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { 
    width, height, thickness, description, 
    window_type, is_standard, is_active 
  } = req.body;

  // Validate required fields
  if (!width || !height || !thickness) {
    return res.status(400).json({ error: 'Width, height, and thickness are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO window_dimensions 
       (width, height, thickness, description, window_type, is_standard, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        width, height, thickness, 
        description || null, 
        window_type || null, 
        is_standard === undefined ? true : is_standard,
        is_active === undefined ? true : is_active
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating window dimension:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /window_dimensions/{id}:
 *   put:
 *     tags: [Window Dimensions]
 *     description: Update an existing window dimension
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the window dimension
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - width
 *               - height
 *               - thickness
 *             properties:
 *               width:
 *                 type: number
 *                 description: Width of the window
 *               height:
 *                 type: number
 *                 description: Height of the window
 *               thickness:
 *                 type: number
 *                 description: Thickness of the window
 *               description:
 *                 type: string
 *                 description: Description of the window dimension
 *               window_type:
 *                 type: string
 *                 description: Type of window
 *               is_standard:
 *                 type: boolean
 *                 description: Whether this is a standard dimension
 *               is_active:
 *                 type: boolean
 *                 description: Whether this dimension is active
 *     responses:
 *       200:
 *         description: Window dimension updated successfully
 *       404:
 *         description: Window dimension not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { 
    width, height, thickness, description, 
    window_type, is_standard, is_active 
  } = req.body;

  // Validate required fields
  if (!width || !height || !thickness) {
    return res.status(400).json({ error: 'Width, height, and thickness are required' });
  }

  try {
    const result = await db.query(
      `UPDATE window_dimensions 
       SET width = $1, 
           height = $2, 
           thickness = $3, 
           description = $4, 
           window_type = $5, 
           is_standard = $6, 
           is_active = $7
       WHERE dimension_id = $8
       RETURNING *`,
      [
        width, height, thickness, 
        description || null, 
        window_type || null, 
        is_standard === undefined ? true : is_standard,
        is_active === undefined ? true : is_active,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Window dimension not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating window dimension:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /window_dimensions/{id}:
 *   delete:
 *     tags: [Window Dimensions]
 *     description: Delete a window dimension
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the window dimension
 *     responses:
 *       204:
 *         description: Window dimension deleted successfully
 *       404:
 *         description: Window dimension not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM window_dimensions WHERE dimension_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Window dimension not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting window dimension:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete. Window dimension is referenced by existing windows.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /window_dimensions/standard:
 *   get:
 *     tags: [Window Dimensions]
 *     description: Retrieve all standard window dimensions
 *     responses:
 *       200:
 *         description: List of standard window dimensions
 *       500:
 *         description: Internal server error
 */
router.get('/standard', async (req, res) => {
  const db = req.db;
  
  try {
    const result = await db.query(
      "SELECT * FROM window_dimensions WHERE is_standard = TRUE AND is_active = TRUE"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching standard window dimensions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /window_dimensions/type/{windowType}:
 *   get:
 *     tags: [Window Dimensions]
 *     description: Retrieve window dimensions by window type
 *     parameters:
 *       - in: path
 *         name: windowType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of window
 *     responses:
 *       200:
 *         description: List of window dimensions for the specified type
 *       500:
 *         description: Internal server error
 */
router.get('/type/:windowType', async (req, res) => {
  const db = req.db;
  const { windowType } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM window_dimensions WHERE window_type = $1",
      [windowType]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching window dimensions by type:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;