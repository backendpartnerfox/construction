const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: UserRoles
 *   description: API for managing user role assignments 
 */

/**
 * @swagger
 * /user_roles:
 *   get:
 *     tags: [UserRoles]
 *     description: Retrieve all user role assignments 
 *     responses:
 *       200:
 *         description: List of user role assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                   role_id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   role_name:
 *                     type: string
 */

// Get all user-role assignments
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query(`
      SELECT ur.user_id, ur.role_id, u.username, r.name AS role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      ORDER BY u.username, r.name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /user_roles/{userId}/{roleId}:
 *   get:
 *     tags: [UserRoles]
 *     description: Check if a specific user has a specific role
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the role
 *     responses:
 *       200:
 *         description: Role assignment exists
 *       404:
 *         description: Role assignment not found
 *       500:
 *         description: Internal server error
 */

// Check if user has role
router.get('/:userId/:roleId', async (req, res) => {
  const db = req.db;
  const { userId, roleId } = req.params;
  try {
    const result = await db.query(`
      SELECT ur.user_id, ur.role_id, u.username, r.name AS role_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `, [userId, roleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role assignment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_roles:
 *   post:
 *     summary: Assign a role to a user
 *     tags: [UserRoles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User or role not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { user_id, role_id } = req.body;

  if (!user_id || !role_id) {
    return res.status(400).json({ error: "User ID and role ID are required" });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id, username FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if role exists
    const roleCheck = await db.query('SELECT id, name FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Add role to user
    await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, role_id]
    );

    res.status(201).json({
      message: "Role assigned successfully",
      user_id: parseInt(user_id),
      role_id: parseInt(role_id),
      username: userCheck.rows[0].username,
      role_name: roleCheck.rows[0].name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_roles/{userId}/{roleId}:
 *   delete:
 *     summary: Remove a role from a user
 *     tags: [UserRoles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the role to remove
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       404:
 *         description: Role assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:userId/:roleId', async (req, res) => {
  const db = req.db;
  const { userId, roleId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Role assignment not found" });
    }

    res.json({ message: "Role removed from user successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_roles/user/{userId}:
 *   get:
 *     tags: [UserRoles]
 *     description: Get all roles for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: List of roles assigned to the user
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', async (req, res) => {
  const db = req.db;
  const { userId } = req.params;
  
  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const result = await db.query(`
      SELECT r.id, r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_roles/role/{roleId}:
 *   get:
 *     tags: [UserRoles]
 *     description: Get all users with a specific role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the role
 *     responses:
 *       200:
 *         description: List of users with this role
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get('/role/:roleId', async (req, res) => {
  const db = req.db;
  const { roleId } = req.params;
  
  try {
    // Check if role exists
    const roleCheck = await db.query('SELECT id FROM roles WHERE id = $1', [roleId]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = $1
      ORDER BY u.username
    `, [roleId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_roles/user/{userId}/bulkAssign:
 *   post:
 *     summary: Assign multiple roles to a user
 *     tags: [UserRoles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/user/:userId/bulkAssign', async (req, res) => {
  const db = req.db;
  const { userId } = req.params;
  const { role_ids } = req.body;
  
  if (!Array.isArray(role_ids) || role_ids.length === 0) {
    return res.status(400).json({ error: "Role IDs array is required" });
  }
  
  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Add each role to user
    for (const roleId of role_ids) {
      await db.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, roleId]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    // Get the updated roles for this user
    const result = await db.query(`
      SELECT r.id, r.name
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `, [userId]);
    
    res.json({
      message: "Roles assigned successfully",
      assigned_roles: result.rows
    });
  } catch (err) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;