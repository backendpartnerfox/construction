const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: UserPermissions
 *   description: API for managing user permission assignments 
 */

/**
 * @swagger
 * /user_permissions:
 *   get:
 *     tags: [UserPermissions]
 *     description: Retrieve all user permission assignments 
 *     responses:
 *       200:
 *         description: List of user permission assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                   permission_id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   permission_name:
 *                     type: string
 */

// Get all user-permission assignments
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query(`
      SELECT up.user_id, up.permission_id, u.username, p.name AS permission_name
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      JOIN permissions p ON up.permission_id = p.id
      ORDER BY u.username, p.name
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /user_permissions/{userId}/{permissionId}:
 *   get:
 *     tags: [UserPermissions]
 *     description: Check if a specific user has a specific permission
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the permission
 *     responses:
 *       200:
 *         description: Permission assignment exists
 *       404:
 *         description: Permission assignment not found
 *       500:
 *         description: Internal server error
 */

// Check if user has permission
router.get('/:userId/:permissionId', async (req, res) => {
  const db = req.db;
  const { userId, permissionId } = req.params;
  try {
    const result = await db.query(`
      SELECT up.user_id, up.permission_id, u.username, p.name AS permission_name
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 AND up.permission_id = $2
    `, [userId, permissionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission assignment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_permissions:
 *   post:
 *     summary: Assign a permission to a user
 *     tags: [UserPermissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               permission_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Permission assigned successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User or permission not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { user_id, permission_id } = req.body;

  if (!user_id || !permission_id) {
    return res.status(400).json({ error: "User ID and permission ID are required" });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id, username FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if permission exists
    const permCheck = await db.query('SELECT id, name FROM permissions WHERE id = $1', [permission_id]);
    if (permCheck.rows.length === 0) {
      return res.status(404).json({ error: "Permission not found" });
    }

    // Add permission to user
    await db.query(
      'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, permission_id]
    );

    res.status(201).json({
      message: "Permission assigned successfully",
      user_id: parseInt(user_id),
      permission_id: parseInt(permission_id),
      username: userCheck.rows[0].username,
      permission_name: permCheck.rows[0].name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_permissions/{userId}/{permissionId}:
 *   delete:
 *     summary: Remove a permission from a user
 *     tags: [UserPermissions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the permission to remove
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *       404:
 *         description: Permission assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:userId/:permissionId', async (req, res) => {
  const db = req.db;
  const { userId, permissionId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
      [userId, permissionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Permission assignment not found" });
    }

    res.json({ message: "Permission removed from user successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_permissions/user/{userId}:
 *   get:
 *     tags: [UserPermissions]
 *     description: Get all permissions for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: List of permissions assigned to the user
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
      SELECT p.id, p.name, p.description
      FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
      ORDER BY p.name
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_permissions/permission/{permissionId}:
 *   get:
 *     tags: [UserPermissions]
 *     description: Get all users with a specific permission
 *     parameters:
 *       - in: path
 *         name: permissionId
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
router.get('/permission/:permissionId', async (req, res) => {
  const db = req.db;
  const { permissionId } = req.params;
  
  try {
    // Check if permission exists
    const permCheck = await db.query('SELECT id FROM permissions WHERE id = $1', [permissionId]);
    if (permCheck.rows.length === 0) {
      return res.status(404).json({ error: "Permission not found" });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active
      FROM users u
      JOIN user_permissions up ON u.id = up.user_id
      WHERE up.permission_id = $1
      ORDER BY u.username
    `, [permissionId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_permissions/user/{userId}/bulkAssign:
 *   post:
 *     summary: Assign multiple permissions to a user
 *     tags: [UserPermissions]
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
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
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
  const { permission_ids } = req.body;
  
  if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
    return res.status(400).json({ error: "Permission IDs array is required" });
  }
  
  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Add each permission to user
    for (const permissionId of permission_ids) {
      await db.query(
        'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, permissionId]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    // Get the updated permissions for this user
    const result = await db.query(`
      SELECT p.id, p.name
      FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
      ORDER BY p.name
    `, [userId]);
    
    res.json({
      message: "Permissions assigned successfully",
      assigned_permissions: result.rows
    });
  } catch (err) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /user_permissions/check:
 *   post:
 *     summary: Check if a user has a specific permission (either directly or through roles)
 *     tags: [UserPermissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               permission_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission check result
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/check', async (req, res) => {
  const db = req.db;
  const { user_id, permission_name } = req.body;
  
  if (!user_id || !permission_name) {
    return res.status(400).json({ error: "User ID and permission name are required" });
  }
  
  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check for direct permission assignment
    const directPermission = await db.query(`
      SELECT 1
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 AND p.name = $2
    `, [user_id, permission_name]);
    
    if (directPermission.rows.length > 0) {
      return res.json({
        has_permission: true,
        source: 'direct'
      });
    }
    
    // Check for permission through roles
    const rolePermission = await db.query(`
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1 AND p.name = $2
    `, [user_id, permission_name]);
    
    if (rolePermission.rows.length > 0) {
      return res.json({
        has_permission: true,
        source: 'role'
      });
    }
    
    // If we get here, the user doesn't have the permission
    res.json({
      has_permission: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;