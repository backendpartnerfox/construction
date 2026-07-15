const express = require('express');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Door Dimensions
 *   description: API for managing Door Dimensions
 */
/**
 * @swagger
 * /door_dimensions:
 *   get:
 *     tags: [Door Dimensions]
 *     description: Retrieve all door dimensions
 *     responses:
 *       200:
 *         description: List of door dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DoorDimension'
 */
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM door_dimensions');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching door dimensions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /door_dimensions/{id}:
 *   get:
 *     tags: [Door Dimensions]
 *     description: Retrieve a single door dimension by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door dimension
 *     responses:
 *       200:
 *         description: A single door dimension
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoorDimension'
 *       404:
 *         description: Door dimension not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM door_dimensions WHERE dimension_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door dimension not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching door dimension:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /door_dimensions:
 *   post:
 *     tags: [Door Dimensions]
 *     description: Create a new door dimension
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoorDimensionInput'
 *     responses:
 *       201:
 *         description: Door dimension created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoorDimension'
 *       400:
 *         description: Invalid input data
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { width, height, thickness, description, is_standard, is_active } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO door_dimensions 
       (width, height, thickness, description, is_standard, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [width, height, thickness, description, is_standard, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating door dimension:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /door_dimensions/{id}:
 *   put:
 *     tags: [Door Dimensions]
 *     description: Update an existing door dimension
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door dimension
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoorDimensionInput'
 *     responses:
 *       200:
 *         description: Door dimension updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoorDimension'
 *       404:
 *         description: Door dimension not found
 *       400:
 *         description: Invalid input data
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { width, height, thickness, description, is_standard, is_active } = req.body;

  try {
    const result = await db.query(
      `UPDATE door_dimensions 
       SET width = $1, height = $2, thickness = $3, description = $4, 
           is_standard = $5, is_active = $6
       WHERE dimension_id = $7
       RETURNING *`,
      [width, height, thickness, description, is_standard, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door dimension not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating door dimension:', err.message);
    if (err.code === '23502') { // not_null_violation
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /door_dimensions/{id}:
 *   delete:
 *     tags: [Door Dimensions]
 *     description: Delete a door dimension
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the door dimension
 *     responses:
 *       204:
 *         description: Door dimension deleted successfully
 *       404:
 *         description: Door dimension not found
 *       400:
 *         description: Cannot delete due to references from other tables
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    const result = await db.query(
      'DELETE FROM door_dimensions WHERE dimension_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Door dimension not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting door dimension:', err.message);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Cannot delete due to references from other tables' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /door_dimensions/standard:
 *   get:
 *     tags: [Door Dimensions]
 *     description: Retrieve all standard door dimensions
 *     responses:
 *       200:
 *         description: List of standard door dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DoorDimension'
 */
router.get('/standard', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM door_dimensions WHERE is_standard = TRUE');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching standard door dimensions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /door_dimensions/active:
 *   get:
 *     tags: [Door Dimensions]
 *     description: Retrieve all active door dimensions
 *     responses:
 *       200:
 *         description: List of active door dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DoorDimension'
 */
router.get('/active', async (req, res) => {
  const db = req.db;
  try {
    const result = await db.query('SELECT * FROM door_dimensions WHERE is_active = TRUE');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching active door dimensions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;