const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * tags:
 *   name: UserSessions
 *   description: API for managing user sessions 
 */

// ============================================================
// CRITICAL: Routes here should NOT include /user_sessions prefix
// because server.js already mounts this router at /api/user_sessions
// ============================================================

// Middleware: Log all requests
router.use((req, res, next) => {
  console.log(`[UserSessions] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * @swagger
 * /user_sessions/login:
 *   post:
 *     summary: Login a user and create a new session
 *     tags: [UserSessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               ip_address:
 *                 type: string
 *               user_agent:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, session created
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', async (req, res) => {
  const db = req.db;
  const { username, password, ip_address, user_agent } = req.body;

  console.log('[UserSessions] Login attempt:', { username, ip_address });

  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      error: "Username and password are required" 
    });
  }

  try {
    // Authenticate user — fetch by username only, then bcrypt-compare the password.
    const userResult = await db.query(
      'SELECT id, username, email, first_name, last_name, password FROM users WHERE username = $1 AND is_active = TRUE',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.log('[UserSessions] Login failed: user not found');
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const userRow = userResult.rows[0];
    let passwordOk = false;
    const storedPw = userRow.password || '';
    if (/^\$2[aby]\$/.test(storedPw) && storedPw.length === 60) {
      passwordOk = await bcrypt.compare(password, storedPw);
    } else {
      // Legacy plaintext fallback — upgrade to bcrypt on successful match.
      if (storedPw === password) {
        passwordOk = true;
        const upgraded = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [upgraded, userRow.id]);
        console.log('[UserSessions] Upgraded legacy password to bcrypt for user', userRow.username);
      }
    }
    if (!passwordOk) {
      console.log('[UserSessions] Login failed: bad password');
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Do NOT leak the hash to downstream code.
    const { password: _dropPw, ...user } = userRow;
    console.log('[UserSessions] User authenticated:', user.username);
    
    // Get user roles
    const rolesResult = await db.query(`
      SELECT r.id, r.name AS role_name, r.description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [user.id]);
    
    // Get user permissions (direct permissions only)
    const permissionsResult = await db.query(`
      SELECT p.id, p.name AS permission_name, p.description, p.resource, p.action
      FROM permissions p
      JOIN user_permissions up ON up.permission_id = p.id
      WHERE up.user_id = $1
      ORDER BY p.resource, p.action
    `, [user.id]);
    
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration for 24 hours from now
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    // Create the session
    const sessionResult = await db.query(
      `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, token, created_at, expires_at`,
      [user.id, token, ip_address || null, user_agent || null, expires_at]
    );

    console.log('[UserSessions] Session created successfully');

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
      },
      roles: rolesResult.rows,
      permissions: permissionsResult.rows,
      session: {
        token: sessionResult.rows[0].token,
        expires_at: sessionResult.rows[0].expires_at
      }
    });
  } catch (err) {
    console.error('[UserSessions] Login error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/logout:
 *   post:
 *     summary: Logout current user session
 *     tags: [UserSessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
router.post('/logout', async (req, res) => {
  const db = req.db;
  const { token } = req.body;

  try {
    if (token) {
      await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
    }
    
    res.json({ 
      success: true,
      message: "Logout successful" 
    });
  } catch (err) {
    console.error('[UserSessions] Logout error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions:
 *   get:
 *     tags: [UserSessions]
 *     description: Retrieve all active user sessions 
 *     responses:
 *       200:
 *         description: List of active sessions
 */
router.get('/', async (req, res) => {
  const db = req.db; 
  try {
    const result = await db.query(`
      SELECT us.id, us.user_id, u.username, us.token, us.ip_address, 
             us.user_agent, us.created_at, us.expires_at
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.expires_at > NOW()
      ORDER BY us.created_at DESC
    `);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (queryErr) {
    console.error('[UserSessions] Error:', queryErr.message);
    res.status(500).json({ 
      success: false,
      error: queryErr.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/{id}:
 *   get:
 *     tags: [UserSessions]
 *     description: Retrieve a specific session by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session details
 *       404:
 *         description: Session not found
 */
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT us.id, us.user_id, u.username, us.token, us.ip_address, 
             us.user_agent, us.created_at, us.expires_at
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/token/{token}:
 *   get:
 *     tags: [UserSessions]
 *     description: Validate a session token and get user info
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Valid session with user info
 *       401:
 *         description: Invalid or expired token
 */
router.get('/token/:token', async (req, res) => {
  const db = req.db;
  const { token } = req.params;
  try {
    const result = await db.query(`
      SELECT us.id, us.user_id, u.username, u.email, u.first_name, u.last_name,
             us.created_at, us.expires_at
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.token = $1 AND us.expires_at > NOW() AND u.is_active = TRUE
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }
    
    // Update last activity time
    await db.query('UPDATE user_sessions SET created_at = NOW() WHERE id = $1', [result.rows[0].id]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/{id}:
 *   delete:
 *     summary: End a specific session (logout)
 *     tags: [UserSessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session ended successfully
 *       404:
 *         description: Session not found
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM user_sessions WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Session not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Session ended successfully" 
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/token/{token}:
 *   delete:
 *     summary: End a session by token (logout)
 *     tags: [UserSessions]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 *       404:
 *         description: Session not found
 */
router.delete('/token/:token', async (req, res) => {
  const db = req.db;
  const { token } = req.params;

  try {
    const result = await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Session not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Logout successful" 
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/user/{userId}:
 *   get:
 *     tags: [UserSessions]
 *     description: Retrieve all sessions for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of user's sessions
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', async (req, res) => {
  const db = req.db;
  const { userId } = req.params;
  
  try {
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const result = await db.query(`
      SELECT id, token, ip_address, user_agent, created_at, expires_at
      FROM user_sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/user/{userId}:
 *   delete:
 *     summary: End all sessions for a specific user
 *     tags: [UserSessions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All user sessions ended successfully
 *       404:
 *         description: User not found
 */
router.delete('/user/:userId', async (req, res) => {
  const db = req.db;
  const { userId } = req.params;
  
  try {
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const result = await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    
    res.json({ 
      success: true,
      message: "All sessions for user ended successfully",
      count: result.rowCount
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /user_sessions/refresh/{token}:
 *   put:
 *     summary: Refresh a session token, extending its expiration
 *     tags: [UserSessions]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: integer
 *                 description: Number of hours to extend the session (default 24)
 *     responses:
 *       200:
 *         description: Session refreshed successfully
 *       404:
 *         description: Session not found
 */
router.put('/refresh/:token', async (req, res) => {
  const db = req.db;
  const { token } = req.params;
  const { hours = 24 } = req.body;
  
  try {
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + hours);
    
    const result = await db.query(
      `UPDATE user_sessions 
       SET expires_at = $1 
       WHERE token = $2 AND expires_at > NOW() 
       RETURNING id, user_id, token, expires_at`,
      [expires_at, token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Session not found or already expired" 
      });
    }
    
    res.json({
      success: true,
      message: "Session refreshed successfully",
      session: result.rows[0]
    });
  } catch (err) {
    console.error('[UserSessions] Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
