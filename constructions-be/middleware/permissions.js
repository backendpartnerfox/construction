// Permission middlewares. Runs after `authenticate` so it can rely on
// req.roles and req.permissions being populated.
//
// Two shapes:
//
//   requireModule('crm')
//     Module-level enforcement. Method is used to pick the action:
//        GET     -> requires `<module>.view`
//        POST/PUT/PATCH/DELETE -> requires `<module>.edit`
//     Admin bypasses all checks.
//
//   requirePermission('leads.approve')
//     Explicit permission check when a route needs finer control than
//     view/edit (e.g. approve, publish).
//
// Both return 403 with the required permission name in the body so clients
// can show a useful error.

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isAdmin(req) {
  return Array.isArray(req.roles) && req.roles.includes('admin');
}

function requireModule(moduleName) {
  return function moduleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (isAdmin(req)) return next();

    const action = READ_METHODS.has(req.method) ? 'view' : 'edit';
    const need = `${moduleName}.${action}`;

    if (req.permissions?.includes(need)) return next();
    return res.status(403).json({
      error: 'Forbidden',
      required_permission: need,
      user_permissions: req.permissions || [],
    });
  };
}

function requirePermission(permName) {
  return function permGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (isAdmin(req)) return next();
    if (req.permissions?.includes(permName)) return next();
    return res.status(403).json({
      error: 'Forbidden',
      required_permission: permName,
    });
  };
}

function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (isAdmin(req)) return next();
    if (req.roles?.some(r => allowedRoles.includes(r))) return next();
    return res.status(403).json({
      error: 'Forbidden',
      required_role: allowedRoles,
    });
  };
}

module.exports = { requireModule, requirePermission, requireRole };
