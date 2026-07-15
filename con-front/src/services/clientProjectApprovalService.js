import axios from 'axios';

// Use direct backend URL
const API_URL = 'http://localhost:9000/api/client_project_approval';

// Create axios instance
const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const clientProjectApprovalService = {
  // Get all approvals
  getAll: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get approvals by client ID
  getByClientId: async (clientId) => {
    try {
      const response = await api.get(`${API_URL}/client/${clientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get by ID
  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new approval
  create: async (data) => {
    try {
      const response = await api.post(API_URL, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update approval
  update: async (id, data) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Approve
  approve: async (id, approverData) => {
    try {
      const response = await api.put(`${API_URL}/${id}/approve`, approverData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reject
  reject: async (id, rejectionData) => {
    try {
      const response = await api.put(`${API_URL}/${id}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete approval
  delete: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
