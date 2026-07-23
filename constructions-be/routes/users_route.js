const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;
const isBcryptHash = s => typeof s === 'string' && s.length === 60 && /^\$2[aby]\$/.test(s);
async function hashIfPlain(pw) {
  if (!pw) return pw;
  if (isBcryptHash(pw)) return pw;
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users 
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     description: Retrieve all users with their location information 
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   city_id:
 *                     type: integer
 *                   city_name:
 *                     type: string
 *                   state_name:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

// Get all users
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.city_id, u.is_active, u.created_at,
             c.name AS city_name, s.name AS state_name
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      ORDER BY u.username
    `);
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     description: Retrieve a specific user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// Get user by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.city_id, u.is_active, u.created_at,
             c.name AS city_name, s.name AS state_name
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               city_id:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input - required fields missing or duplicate username/email
 *       404:
 *         description: City not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { username, email, password, first_name, last_name, city_id, is_active } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  try {
    // Verify city exists if provided
    if (city_id) {
      const cityCheck = await db.query('SELECT id FROM cities WHERE id = $1', [city_id]);
      if (cityCheck.rows.length === 0) {
        return res.status(404).json({ error: 'City not found' });
      }
    }

    // Hash the password with bcrypt before storing
    const passwordHash = await hashIfPlain(password);

    const result = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name, city_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, first_name, last_name, city_id, is_active, created_at`,
      [
        username,
        email,
        passwordHash,
        first_name || null,
        last_name || null,
        city_id || null,
        is_active === false ? false : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Handle unique constraint violations
    if (err.code === '23505') {
      if (err.constraint.includes('username')) {
        return res.status(400).json({ error: "Username already exists" });
      } else if (err.constraint.includes('email')) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(400).json({ error: "Unique constraint violation" });
    }
    
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update an existing user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               city_id:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input - required fields missing or duplicate username/email
 *       404:
 *         description: User or city not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { username, email, first_name, last_name, city_id, is_active } = req.body;

  // Validate required fields
  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }

  try {
    // Verify city exists if provided
    if (city_id) {
      const cityCheck = await db.query('SELECT id FROM cities WHERE id = $1', [city_id]);
      if (cityCheck.rows.length === 0) {
        return res.status(404).json({ error: 'City not found' });
      }
    }

    // Update user
    const result = await db.query(
      `UPDATE users 
       SET username = $1, email = $2, first_name = $3, last_name = $4, city_id = $5, is_active = $6
       WHERE id = $7
       RETURNING id, username, email, first_name, last_name, city_id, is_active, created_at`,
      [
        username,
        email,
        first_name || null,
        last_name || null,
        city_id || null,
        is_active === false ? false : true,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    // Handle unique constraint violations
    if (err.code === '23505') {
      if (err.constraint.includes('username')) {
        return res.status(400).json({ error: "Username already exists" });
      } else if (err.constraint.includes('email')) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(400).json({ error: "Unique constraint violation" });
    }
    
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}/password:
 *   put:
 *     summary: Update a user's password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to update password for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid input - password is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/password', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    // Hash with bcrypt before storing
    const passwordHash = await hashIfPlain(password);
    const result = await db.query(
      `UPDATE users
       SET password = $1
       WHERE id = $2
       RETURNING id`,
      [passwordHash, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // The CASCADE option in the database will automatically delete related records
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}/roles:
 *   get:
 *     tags: [Users]
 *     description: Retrieve all roles for a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: List of roles for the user
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/roles', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if the user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await db.query(`
      SELECT r.id, r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}/permissions:
 *   get:
 *     tags: [Users]
 *     description: Retrieve all permissions for a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: List of permissions for the user
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/permissions', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if the user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await db.query(`
      SELECT p.id, p.name, p.description
      FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
      ORDER BY p.name
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}/roles:
 *   post:
 *     summary: Assign a role to a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: Invalid input - role_id is required
 *       404:
 *         description: User or role not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/roles', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { role_id } = req.body;

  if (!role_id) {
    return res.status(400).json({ error: "Role ID is required" });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if role exists
    const roleCheck = await db.query('SELECT id FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Insert the role assignment
    await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, role_id]
    );

    // Get the role details for the response
    const roleDetails = await db.query('SELECT name FROM roles WHERE id = $1', [role_id]);

    res.status(201).json({
      message: "Role assigned successfully",
      user_id: parseInt(id),
      role_id: parseInt(role_id),
      role_name: roleDetails.rows[0].name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}/permissions:
 *   post:
 *     summary: Assign a permission to a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               permission_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Permission assigned successfully
 *       400:
 *         description: Invalid input - permission_id is required
 *       404:
 *         description: User or permission not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/permissions', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { permission_id } = req.body;

  if (!permission_id) {
    return res.status(400).json({ error: "Permission ID is required" });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if permission exists
    const permissionCheck = await db.query('SELECT id FROM permissions WHERE id = $1', [permission_id]);
    if (permissionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Insert the permission assignment
    await db.query(
      'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, permission_id]
    );

    // Get the permission details for the response
    const permissionDetails = await db.query('SELECT name FROM permissions WHERE id = $1', [permission_id]);

    res.status(201).json({
      message: "Permission assigned successfully",
      user_id: parseInt(id),
      permission_id: parseInt(permission_id),
      permission_name: permissionDetails.rows[0].name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Remove a role from a user
 *     tags: [Users]
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
 *         description: User-role assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:userId/roles/:roleId', async (req, res) => {
  const db = req.db;
  const { userId, roleId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User-role assignment not found" });
    }

    res.json({ message: "Role removed from user successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{userId}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove a permission from a user
 *     tags: [Users]
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
 *         description: User-permission assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:userId/permissions/:permissionId', async (req, res) => {
  const db = req.db;
  const { userId, permissionId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
      [userId, permissionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User-permission assignment not found" });
    }

    res.json({ message: "Permission removed from user successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;