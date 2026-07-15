import axios from 'axios';

//const API_BASE_URL = 'http://localhost:9000/api';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// CLIENTS API
// ============================================

export const clientsApi = {
  // Get all clients
  getAll: () => apiClient.get('/api/clients'),

  // Get client by ID
  getById: (id) => apiClient.get(`/api/clients/${id}`),

  // Search clients
  search: (query) => apiClient.get(`/api/clients/search?query=${query}`),

  // Get active clients
  getActive: () => apiClient.get('/api/clients/active'),

  // Get clients by type
  getByType: (type) => apiClient.get(`/api/clients/type/${type}`),

  // Get clients by location
  getByLocation: (city) => apiClient.get(`/api/clients/location/${city}`),

  // Create new client
  create: (data) => apiClient.post('/api/clients', data),

  // Update client
  update: (id, data) => apiClient.put(`/api/clients/${id}`, data),

  // Delete client
  delete: (id) => apiClient.delete(`/api/clients/${id}`),
};

// ============================================
// CLIENT REQUIREMENTS API
// ============================================

export const requirementsApi = {
  // Get all requirements
  getAll: () => apiClient.get('/api/client_requirements'),

  // Get requirement by ID
  getById: (id) => apiClient.get(`/api/client_requirements/${id}`),

  // Get requirements by client
  getByClient: (clientId) => apiClient.get(`/api/client_requirements/client/${clientId}`),

  // Get requirements by status
  getByStatus: (status) => apiClient.get(`/api/client_requirements/status/${status}`),

  // Create new requirement
  create: (data) => apiClient.post('/api/client_requirements', data),

  // Update requirement
  update: (id, data) => apiClient.put(`/api/client_requirements/${id}`, data),

  // Delete requirement
  delete: (id) => apiClient.delete(`/api/client_requirements/${id}`),
};

// ============================================
// CLIENT QUOTATIONS API
// ============================================

export const quotationsApi = {
  // Get all quotations
  getAll: () => apiClient.get('/api/client_quotations'),

  // Get quotation by ID
  getById: (id) => apiClient.get(`/api/client_quotations/${id}`),

  // Get quotations by client
  getByClient: (clientId) => apiClient.get(`/api/client_quotations/client/${clientId}`),

  // Get quotations by status
  getByStatus: (status) => apiClient.get(`/api/client_quotations/status/${status}`),

  // Get quotation history
  getHistory: (id) => apiClient.get(`/api/client_quotations/${id}/history`),

  // Create new quotation
  create: (data) => apiClient.post('/api/client_quotations', data),

  // Update quotation
  update: (id, data) => apiClient.put(`/api/client_quotations/${id}`, data),

  // Create new version of quotation
  createVersion: (id, data) => apiClient.post(`/api/client_quotations/${id}/version`, data),

  // Delete quotation
  delete: (id) => apiClient.delete(`/api/client_quotations/${id}`),
};

// ============================================
// CLIENT QUOTATION HISTORY API
// ============================================

export const quotationHistoryApi = {
  // Get all history
  getAll: () => apiClient.get('/api/client_quotation_history'),

  // Get history by quotation ID
  getByQuotation: (quotationId) => apiClient.get(`/api/client_quotation_history/quotation/${quotationId}`),

  // Get specific history entry
  getById: (id) => apiClient.get(`/api/client_quotation_history/${id}`),

  // Create history entry
  create: (data) => apiClient.post('/api/client_quotation_history', data),

  // Update history entry
  update: (id, data) => apiClient.put(`/api/client_quotation_history/${id}`, data),
};

// ============================================
// CLIENT SELECTIONS API
// ============================================

export const selectionsApi = {
  // Get all selections
  getAll: () => apiClient.get('/api/client_selections'),

  // Get selection by ID
  getById: (id) => apiClient.get(`/api/client_selections/${id}`),

  // Get selections by item
  getByItem: (itemId) => apiClient.get(`/api/client_selections/item/${itemId}`),

  // Create new selection
  create: (data) => apiClient.post('/api/client_selections', data),

  // Update selection
  update: (id, data) => apiClient.put(`/api/client_selections/${id}`, data),

  // Approve selection
  approve: (id, approvalData) => apiClient.put(`/api/client_selections/${id}/approve`, approvalData),

  // Delete selection
  delete: (id) => apiClient.delete(`/api/client_selections/${id}`),
};

// ============================================
// CLIENT CHOICES API
// ============================================

export const choicesApi = {
  // Get all choices
  getAll: () => apiClient.get('/api/client_choices'),

  // Get choice by ID
  getById: (id) => apiClient.get(`/api/client_choices/${id}`),

  // Get choices by project
  getByProject: (projectId) => apiClient.get(`/api/client_choices/project/${projectId}`),

  // Create new choice
  create: (data) => apiClient.post('/api/client_choices', data),

  // Update choice
  update: (id, data) => apiClient.put(`/api/client_choices/${id}`, data),

  // Delete choice
  delete: (id) => apiClient.delete(`/api/client_choices/${id}`),
};

// ============================================
// CLIENT PROJECT APPROVAL API
// ============================================

export const projectApprovalApi = {
  // Get all approvals
  getAll: () => apiClient.get('/api/client_project_approval'),

  // Get approval by ID
  getById: (id) => apiClient.get(`/api/client_project_approval/${id}`),

  // Get approvals by client
  getByClient: (clientId) => apiClient.get(`/api/client_project_approval/client/${clientId}`),

  // Get approvals by project
  getByProject: (projectId) => apiClient.get(`/api/client_project_approval/project/${projectId}`),

  // Create new approval
  create: (data) => apiClient.post('/api/client_project_approval', data),

  // Update approval
  update: (id, data) => apiClient.put(`/api/client_project_approval/${id}`, data),

  // Delete approval
  delete: (id) => apiClient.delete(`/api/client_project_approval/${id}`),
};

// ============================================
// PACKAGE CUSTOMIZATION API
// ============================================

export const packageCustomizationApi = {
  // Get all customizations
  getAll: () => apiClient.get('/api/client_requirement_package_item_choice_customise'),

  // Get customization by ID
  getById: (id) => apiClient.get(`/api/client_requirement_package_item_choice_customise/${id}`),

  // Get customizations by client
  getByClient: (clientId) => apiClient.get(`/api/client_requirement_package_item_choice_customise/client/${clientId}`),

  // Get customizations by project
  getByProject: (projectId) => apiClient.get(`/api/client_requirement_package_item_choice_customise/project/${projectId}`),

  // Get customizations by package
  getByPackage: (packageId) => apiClient.get(`/api/client_requirement_package_item_choice_customise/package/${packageId}`),

  // Create new customization
  create: (data) => apiClient.post('/api/client_requirement_package_item_choice_customise', data),

  // Update customization
  update: (id, data) => apiClient.put(`/api/client_requirement_package_item_choice_customise/${id}`, data),

  // Delete customization
  delete: (id) => apiClient.delete(`/api/client_requirement_package_item_choice_customise/${id}`),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const apiUtils = {
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data?.error || error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server. Please check your connection.',
        status: 0,
        data: null,
      };
    } else {
      // Error in request setup
      return {
        message: error.message || 'An error occurred',
        status: 0,
        data: null,
      };
    }
  },

  // Format success response
  formatSuccess: (response, message = 'Operation successful') => {
    return {
      success: true,
      message,
      data: response.data,
      status: response.status,
    };
  },

  // Build query string
  buildQueryString: (params) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    return query.toString();
  },
};

export default apiClient;
