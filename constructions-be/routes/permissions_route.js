const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: API for managing permissions 
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     tags: [Permissions]
 *     description: Retrieve all permissions 
 *     responses:
 *       200:
 *         description: List of permissions
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
 *                   description:
 *                     type: string
 */

// Get all permissions
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query('SELECT * FROM permissions ORDER BY name');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     description: Retrieve a specific permission by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the permission to retrieve
 *     responses:
 *       200:
 *         description: Permission details
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */

// Get permission by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM permissions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Invalid input - name is required or already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Permission name is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO permissions (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name, description`,
      [name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Check for unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: "Permission with this name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /permissions/{id}:
 *   put:
 *     summary: Update an existing permission by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the permission to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Invalid input - name is required or already exists
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Permission name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE permissions 
       SET name = $1, description = $2 
       WHERE id = $3 
       RETURNING id, name, description`,
      [name, description || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Permission not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    // Check for unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: "Permission with this name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /permissions/{id}:
 *   delete:
 *     summary: Delete a permission by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the permission to delete
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       400:
 *         description: Cannot delete permission with user assignments
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if permission is directly assigned to any users
    const userPermCheck = await db.query('SELECT COUNT(*) FROM user_permissions WHERE permission_id = $1', [id]);
    
    if (parseInt(userPermCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete permission because it is directly assigned to users. Remove all permission assignments first."
      });
    }
    
    const result = await db.query('DELETE FROM permissions WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Permission not found" });
    }
    
    res.json({ message: "Permission deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /permissions/{id}/users:
 *   get:
 *     tags: [Permissions]
 *     description: Retrieve all users assigned to a specific permission
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the permission
 *     responses:
 *       200:
 *         description: List of users with this permission
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/users', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if the permission exists
    const permCheck = await db.query('SELECT id FROM permissions WHERE id = $1', [id]);
    
    if (permCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active
      FROM users u
      JOIN user_permissions up ON u.id = up.user_id
      WHERE up.permission_id = $1
      ORDER BY u.username
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;