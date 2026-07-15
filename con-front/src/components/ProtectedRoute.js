import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { isAuthenticated, loading, hasUser: !!user, path: location.pathname });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('User is authenticated, allowing access');
  return children;
};

export default ProtectedRoute;
