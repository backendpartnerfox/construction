import axios from 'axios';

const API_URL = 'http://localhost:9000/api';

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
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

// Helper function to extract data from response
const extractData = (response) => {
  // Handle {success: true, data: [...]} format
  if (response.data?.success && response.data?.data !== undefined) {
    return { success: true, data: response.data.data };
  }
  // Handle direct array [...] format
  if (Array.isArray(response.data)) {
    return { success: true, data: response.data };
  }
  // Handle direct object format
  if (response.data && typeof response.data === 'object') {
    return { success: true, data: response.data };
  }
  // Default
  return { success: true, data: response.data };
};

// Packages Service
export const packagesService = {
  getAll: async () => {
    try {
      const response = await api.get(`${API_URL}/packages`);
      return extractData(response);
    } catch (error) {
      console.error('Packages getAll error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/packages/${id}`);
      return extractData(response);
    } catch (error) {
      console.error('Packages getById error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
};

// Projects Service
export const projectsService = {
  getAll: async () => {
    try {
      const response = await api.get(`${API_URL}/projects`);
      console.log('Projects getAll response:', response.data);
      return extractData(response);
    } catch (error) {
      console.error('Projects getAll error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getByClientId: async (clientId) => {
    try {
      console.log('Fetching projects for client:', clientId);
      const response = await api.get(`${API_URL}/projects/client/${clientId}`);
      console.log('Projects by client response:', response.data);
      
      const result = extractData(response);
      console.log('Extracted projects data:', result);
      return result;
    } catch (error) {
      console.error('Projects getByClientId error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/projects/${id}`);
      return extractData(response);
    } catch (error) {
      console.error('Projects getById error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
};

// Selection Items Service
export const selectionItemsService = {
  getAll: async () => {
    try {
      const response = await api.get(`${API_URL}/selection_items`);
      console.log('Selection items getAll response:', response.data);
      return extractData(response);
    } catch (error) {
      console.error('Selection items getAll error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getByProjectId: async (projectId) => {
    try {
      console.log('Fetching selection items for project:', projectId);
      const response = await api.get(`${API_URL}/selection_items/project/${projectId}`);
      console.log('Selection items by project response:', response.data);
      
      const result = extractData(response);
      console.log('Extracted selection items data:', result);
      return result;
    } catch (error) {
      console.error('Selection items getByProjectId error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/selection_items/${id}`);
      return extractData(response);
    } catch (error) {
      console.error('Selection items getById error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
};

// Item Choices Service
export const itemChoicesService = {
  getAll: async () => {
    try {
      const response = await api.get(`${API_URL}/item_choices`);
      console.log('Item choices getAll response:', response.data);
      return extractData(response);
    } catch (error) {
      console.error('Item choices getAll error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getByItemId: async (itemId) => {
    try {
      console.log('Fetching item choices for item:', itemId);
      const response = await api.get(`${API_URL}/item_choices/item/${itemId}`);
      console.log('Item choices by item response:', response.data);
      
      const result = extractData(response);
      console.log('Extracted item choices data:', result);
      return result;
    } catch (error) {
      console.error('Item choices getByItemId error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/item_choices/${id}`);
      return extractData(response);
    } catch (error) {
      console.error('Item choices getById error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
};

// Items Service
export const itemsService = {
  getAll: async () => {
    try {
      const response = await api.get(`${API_URL}/items`);
      return extractData(response);
    } catch (error) {
      console.error('Items getAll error:', error);
      return { success: false, error: error.response?.data?.error || error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/items/${id}`);
      return extractData(response);
    } catch (error) {
      console.error('Items getById error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
};
