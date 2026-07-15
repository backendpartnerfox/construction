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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        console.log('Initializing auth with:', { hasToken: !!token, hasUserData: !!userData });
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            console.log('Setting authenticated user:', parsedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No stored auth data found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        console.log('Auth initialization complete');
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('Login attempt with credentials:', { username: credentials.username });
      
      const response = await authAPI.login(credentials);
      console.log('Login response received:', response);
      
      // Handle different possible response structures
      if (response && (response.success || response.session?.token || response.token || response.access_token)) {
        const token = response.session?.token || response.token || response.access_token || 'temp-token-' + Date.now();
        const userData = response.user || response.data || response.session?.user || { 
          username: credentials.username,
          id: response.user_id || 1,
          first_name: 'Admin',
          last_name: 'User',
          email: credentials.username.includes('@') ? credentials.username : 'admin@constructpro.com'
        };
        
        console.log('Login successful, storing:', { userData, hasToken: !!token });
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Login successful!');
        return { success: true };
      } else {
        // Handle case where response structure is different
        console.log('Unexpected login response structure:', response);
        const errorMessage = response.message || response.error || 'Login failed - invalid response format';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        console.log('Server error response:', error.response.data);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Login failed (${error.response.status})`;
        
        // Handle specific error cases
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (error.response.status === 404) {
          errorMessage = 'Login endpoint not found. Please check backend server.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Network error
        console.log('Network error:', error.request);
        errorMessage = 'Cannot connect to server. Backend may not be running on localhost:8000.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server is not running. Please start the server.';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
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
      } else {
        const errorMessage = response.message || response.error || 'Registration failed';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Registration failed (${error.response.status})`;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('debugToken');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Logged out successfully');
      
      // Force redirect to login
      window.location.href = '/login';
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset link sent to your email');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to send reset link');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
