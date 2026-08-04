const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: API for managing roles 
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     description: Retrieve all roles 
 *     responses:
 *       200:
 *         description: List of roles
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

// Get all roles
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     description: Retrieve a specific role by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the role to retrieve
 *     responses:
 *       200:
 *         description: Role details
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */

// Get role by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
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
 *         description: Role created successfully
 *       400:
 *         description: Invalid input - name is required or already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Role name is required" });
  }

  try {
    const result = await db.query(
      `INSERT INTO roles (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name, description`,
      [name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Check for unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: "Role with this name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update an existing role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the role to update
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
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input - name is required or already exists
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Role name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE roles 
       SET name = $1, description = $2 
       WHERE id = $3 
       RETURNING id, name, description`,
      [name, description || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    // Check for unique violation
    if (err.code === '23505') {
      return res.status(400).json({ error: "Role with this name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Delete a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the role to delete
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Cannot delete role with user assignments
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    // Check if role is assigned to any users
    const userRoleCheck = await db.query('SELECT COUNT(*) FROM user_roles WHERE role_id = $1', [id]);
    
    if (parseInt(userRoleCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete role because it is assigned to users. Remove all role assignments first."
      });
    }
    
    const result = await db.query('DELETE FROM roles WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /roles/{id}/users:
 *   get:
 *     tags: [Roles]
 *     description: Retrieve all users assigned to a specific role
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id/users', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  
  try {
    // Check if the role exists
    const roleCheck = await db.query('SELECT id FROM roles WHERE id = $1', [id]);
    
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = $1
      ORDER BY u.username
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// Role-permission matrix endpoints (used by the RBAC admin UI)
// -------------------------------------------------------------------------

// GET /roles/matrix
//   Returns { roles: [...], permissions: [...], assignments: {roleId: [permissionId, ...]} }
router.get('/matrix/all', async (req, res) => {
  const db = req.db;
  try {
    const roles       = await db.query('SELECT id, name, description FROM roles ORDER BY name');
    const permissions = await db.query('SELECT id, name, resource, action, description FROM permissions ORDER BY resource, action');
    const links       = await db.query('SELECT role_id, permission_id FROM role_permissions');
    const assignments = {};
    for (const row of links.rows) {
      (assignments[row.role_id] ||= []).push(row.permission_id);
    }
    res.json({ roles: roles.rows, permissions: permissions.rows, assignments });
  } catch (err) {
    console.error('[roles/matrix] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /roles/:id/permissions — permissions assigned to a specific role
router.get('/:id/permissions', async (req, res) => {
  const db = req.db;
  try {
    const r = await db.query(
      `SELECT p.id, p.name, p.resource, p.action, p.description
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.resource, p.action`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[roles/:id/permissions] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /roles/:id/permissions — replace the role's permission set atomically.
// Body: { permission_ids: [1, 2, 3, ...] }
router.put('/:id/permissions', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const ids = Array.isArray(req.body?.permission_ids) ? req.body.permission_ids : null;
  if (!ids) return res.status(400).json({ error: 'permission_ids (array) is required' });
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
    if (ids.length > 0) {
      // Bulk insert via unnest
      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1::int, x FROM UNNEST($2::int[]) AS x
         ON CONFLICT DO NOTHING`,
        [id, ids]
      );
    }
    await db.query('COMMIT');
    res.json({ role_id: Number(id), permission_ids: ids });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('[roles/:id/permissions PUT] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /roles/:id/permissions/:permId — grant a single permission
router.post('/:id/permissions/:permId', async (req, res) => {
  const db = req.db;
  try {
    await db.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.params.permId]
    );
    res.json({ role_id: Number(req.params.id), permission_id: Number(req.params.permId), granted: true });
  } catch (err) {
    console.error('[roles/:id/permissions/:permId POST] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /roles/:id/permissions/:permId — revoke a single permission
router.delete('/:id/permissions/:permId', async (req, res) => {
  const db = req.db;
  try {
    const r = await db.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING role_id',
      [req.params.id, req.params.permId]
    );
    res.json({ role_id: Number(req.params.id), permission_id: Number(req.params.permId), revoked: r.rowCount > 0 });
  } catch (err) {
    console.error('[roles/:id/permissions/:permId DELETE] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;