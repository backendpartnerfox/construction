import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

// Guards a route. Accepts optional `permission` (a single perm string) or
// `role` (a single role name). Admin bypasses all permission checks.
// If the user is signed in but lacks the required perm/role, renders a
// friendly "no access" panel instead of the child.
const ProtectedRoute = ({ children, permission, role }) => {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <NoAccess required={`permission: ${permission}`} />;
  }
  if (role && !hasRole(role)) {
    return <NoAccess required={`role: ${role}`} />;
  }

  return children;
};

const NoAccess = ({ required }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
    <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-10">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access denied</h1>
      <p className="text-slate-600 mb-4">
        You don't have permission to view this page.
      </p>
      <p className="text-xs text-slate-400 mb-6">Required — {required}</p>
      <a href="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Back to dashboard
      </a>
    </div>
  </div>
);

export default ProtectedRoute;
