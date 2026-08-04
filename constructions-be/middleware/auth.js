// Session-based authentication middleware.
//
// The app uses opaque random session tokens stored in `user_sessions` (not
// JWT), so this middleware:
//   1. Reads the token from `Authorization: Bearer <token>` (or the
//      `x-auth-token` header as a fallback for older clients).
//   2. Looks the token up in `user_sessions`, verifies it hasn't expired.
//   3. Fetches the effective permission set for that user — the UNION of:
//        a) permissions granted directly via `user_permissions`, and
//        b) permissions granted transitively via `user_roles` -> `role_permissions`.
//   4. Attaches `req.user`, `req.roles` (array of role names), and
//      `req.permissions` (array of permission names).
//
// If auth fails, returns 401. Downstream routes can then call
// `requireModule('crm')` from `./permissions.js` to enforce module access.

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearer || req.headers['x-auth-token'] || null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const sessionResult = await req.db.query(
      `SELECT s.user_id, s.expires_at,
              u.username, u.email, u.first_name, u.last_name, u.is_active
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = $1`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session token' });
    }
    const sess = sessionResult.rows[0];
    if (!sess.is_active) {
      return res.status(401).json({ error: 'User is inactive' });
    }
    if (sess.expires_at && new Date(sess.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const rolesResult = await req.db.query(
      `SELECT r.name
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1`,
      [sess.user_id]
    );

    // UNION of role-derived + directly-assigned permissions.
    const permsResult = await req.db.query(
      `SELECT DISTINCT p.name
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur       ON ur.role_id       = rp.role_id
        WHERE ur.user_id = $1
        UNION
       SELECT DISTINCT p.name
         FROM permissions p
         JOIN user_permissions up ON up.permission_id = p.id
        WHERE up.user_id = $1`,
      [sess.user_id]
    );

    req.user = {
      id:         sess.user_id,
      username:   sess.username,
      email:      sess.email,
      first_name: sess.first_name,
      last_name:  sess.last_name,
    };
    req.roles       = rolesResult.rows.map(r => r.name);
    req.permissions = permsResult.rows.map(p => p.name);

    return next();
  } catch (err) {
    console.error('[auth] error:', err.message);
    return res.status(500).json({ error: 'Auth check failed' });
  }
}

module.exports = { authenticate };
