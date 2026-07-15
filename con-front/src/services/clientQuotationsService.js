import axios from 'axios';

const API_URL = 'http://localhost:9000/api/client_quotations';

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const clientQuotationsService = {
  getAll: async () => {
    try {
      const response = await api.get(API_URL);
      console.log('Get All Quotations Response:', response.data);
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      } else if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get All Error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getByClientId: async (clientId) => {
    try {
      console.log('Fetching quotations for client:', clientId);
      const response = await api.get(`${API_URL}/client/${clientId}`);
      console.log('Raw API Response:', response.data);
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        console.log('Using nested data format:', response.data.data);
        return { success: true, data: response.data.data };
      } else if (Array.isArray(response.data)) {
        console.log('Using array format:', response.data);
        return { success: true, data: response.data };
      }
      
      console.log('Using direct format:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get By Client ID Error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      } else if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get By ID Error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  create: async (data) => {
    try {
      console.log('Creating quotation with data:', data);
      const response = await api.post(API_URL, data);
      console.log('Create Response:', response.data);
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      } else if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create Error:', error.response?.data || error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        details: error.response?.data
      };
    }
  },

  update: async (id, data) => {
    try {
      console.log('Updating quotation:', id, data);
      const response = await api.put(`${API_URL}/${id}`, data);
      console.log('Update Response:', response.data);
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      } else if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update Error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  delete: async (id) => {
    try {
      console.log('Deleting quotation:', id);
      const response = await api.delete(`${API_URL}/${id}`);
      console.log('Delete Response:', response.data);
      
      // Handle both old and new response formats
      if (response.data.success) {
        return { success: true, message: response.data.message, data: response.data.data };
      } else if (response.data.message) {
        return { success: true, message: response.data.message };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete Error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  send: async (id, sendData) => {
    try {
      const response = await api.patch(`${API_URL}/${id}/send`, sendData);
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      } else if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Send Error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateStatus: async (id, status, remarks) => {
    try {
      const response = await api.patch(`${API_URL}/${id}/status`, { status, remarks });
      
      // Handle both old and new response formats
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data };
      } else if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update Status Error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  createVersion: async (id, versionData = {}) => {
    try {
      const response = await api.post(`${API_URL}/${id}/version`, versionData);
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          data: response.data.data
        };
      }
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create Version Error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
};
