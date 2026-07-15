import axios from 'axios';

// Use direct backend URL - consistent with other services
const API_URL = 'http://localhost:9000/api/lead_selection_package';

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

export const leadSelectionPackageService = {
  // Get all selections
  getAll: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get selections by lead ID
  getByLeadId: async (leadId) => {
    try {
      const response = await api.get(`${API_URL}/lead/${leadId}`);
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

  // Create new selection
  create: async (data) => {
    try {
      const response = await api.post(API_URL, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update selection
  update: async (id, data) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Approve selection
  approve: async (id, approverData) => {
    try {
      const response = await api.put(`${API_URL}/${id}/approve`, approverData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete selection
  delete: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Calculate price difference
  calculateDifference: async (data) => {
    try {
      const response = await api.post(`${API_URL}/calculate`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
