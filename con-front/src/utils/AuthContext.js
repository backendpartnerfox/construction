import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper: does the given permission list include the requested one?
// Admins pass everything.
function permissionCheck(roles, permissions, need) {
  if (Array.isArray(roles) && roles.includes('admin')) return true;
  if (!need) return true;
  return Array.isArray(permissions) && permissions.includes(need);
}

export const useHasPermission = (perm) => {
  const { roles, permissions } = useAuth();
  return permissionCheck(roles, permissions, perm);
};

export const useHasRole = (role) => {
  const { roles } = useAuth();
  if (Array.isArray(roles) && roles.includes('admin')) return true;
  return Array.isArray(roles) && roles.includes(role);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        const rolesData = localStorage.getItem('roles');
        const permsData = localStorage.getItem('permissions');

        if (token && userData) {
          setUser(JSON.parse(userData));
          setRoles(rolesData ? JSON.parse(rolesData) : []);
          setPermissions(permsData ? JSON.parse(permsData) : []);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setRoles([]);
          setPermissions([]);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('roles');
        localStorage.removeItem('permissions');
        setUser(null);
        setRoles([]);
        setPermissions([]);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);

      const token = response?.session?.token || response?.token;
      if (!token) {
        const msg = response?.message || response?.error || 'Login failed — no token returned';
        toast.error(msg);
        return { success: false, error: msg };
      }

      const userData = response.user || {};
      const roleList = (response.roles || []).map(r => r.role_name || r.name).filter(Boolean);
      const permList = (response.permissions || []).map(p => p.permission_name || p.name).filter(Boolean);

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('roles', JSON.stringify(roleList));
      localStorage.setItem('permissions', JSON.stringify(permList));

      setUser(userData);
      setRoles(roleList);
      setPermissions(permList);
      setIsAuthenticated(true);

      toast.success(`Welcome, ${userData.first_name || userData.username}`);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let msg = 'Login failed. Please try again.';
      if (error.response) {
        msg = error.response.data?.message || error.response.data?.error || `Login failed (${error.response.status})`;
        if (error.response.status === 401) msg = 'Invalid username or password';
      } else if (error.request) {
        msg = 'Cannot connect to server.';
      }
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      if (response && !response.error) {
        toast.success('Registration successful! Please login.');
        return { success: true };
      }
      const msg = response.message || response.error || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (err) { /* ignore */ }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    localStorage.removeItem('permissions');
    localStorage.removeItem('debugToken');
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setIsAuthenticated(false);
    toast.success('Logged out');
    window.location.href = '/login';
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        toast.success('Password reset link sent to your email');
        return { success: true };
      }
      toast.error(response.message || 'Failed to send reset link');
      return { success: false, error: response.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send reset link';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (perm) => permissionCheck(roles, permissions, perm);
  const hasRole = (role) => {
    if (roles.includes('admin')) return true;
    return roles.includes(role);
  };

  const value = {
    user, roles, permissions,
    loading, isAuthenticated,
    login, register, logout, forgotPassword,
    hasPermission, hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
