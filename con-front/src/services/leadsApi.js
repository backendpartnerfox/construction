import axios from 'axios';

//const API_URL = 'http://localhost:9000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';


// Create axios instance
const api = axios.create({
  baseURL: API_URL,
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

// ==================== Leads API ====================
export const leadsAPI = {
  // Basic CRUD operations
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/leads', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      console.log('[leadsAPI] Fetching lead:', id);
      const response = await api.get(`/api/leads/${id}`);
      console.log('[leadsAPI] Response:', response.data);
      // Return the data directly - handle both formats
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead ${id}:`, error);
      throw error;
    }
  },

  create: async (leadData) => {
    try {
      const response = await api.post('/api/leads', leadData);
      return response.data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  update: async (id, leadData) => {
    try {
      const response = await api.put(`/api/leads/${id}`, leadData);
      return response.data;
    } catch (error) {
      console.error(`Error updating lead ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/api/leads/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting lead ${id}:`, error);
      throw error;
    }
  },

  // Update lead stage
  updateStage: async (id, stage, notes = '') => {
    try {
      const response = await api.patch(`/api/leads/${id}/stage`, { stage, notes });
      return response.data;
    } catch (error) {
      console.error(`Error updating lead ${id} stage:`, error);
      throw error;
    }
  },

  // Update probability
  updateProbability: async (id, probability) => {
    try {
      const response = await api.patch(`/api/leads/${id}/probability`, { probability });
      return response.data;
    } catch (error) {
      console.error(`Error updating lead ${id} probability:`, error);
      throw error;
    }
  },

  // Convert to client (manual/offline payment)
  convertToClient: async (id, conversionData) => {
    try {
      const response = await api.post(`/api/leads/${id}/convert-to-client`, conversionData);
      return response.data;
    } catch (error) {
      console.error(`Error converting lead ${id} to client:`, error);
      throw error;
    }
  },

  // Create Razorpay payment order for lead conversion
  createPaymentOrder: async (leadId, amount) => {
    try {
      const response = await api.post(`/api/leads/${leadId}/create-payment-order`, { amount });
      return response.data;
    } catch (error) {
      console.error(`Error creating payment order for lead ${leadId}:`, error);
      throw error;
    }
  },

  // Verify Razorpay payment and convert lead to client
  verifyPaymentAndConvert: async (leadId, paymentData) => {
    try {
      const response = await api.post(`/api/leads/${leadId}/verify-payment-and-convert`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error verifying payment for lead ${leadId}:`, error);
      throw error;
    }
  },

  // Get payment orders for a lead
  getPaymentOrders: async (leadId) => {
    try {
      const response = await api.get(`/api/leads/${leadId}/payment-orders`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment orders for lead ${leadId}:`, error);
      throw error;
    }
  },

  // Get lead statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/api/leads/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching lead statistics:', error);
      throw error;
    }
  }
};

// ==================== Lead Requirements API ====================
export const leadRequirementsAPI = {
  // Get all requirements for a lead
  getByLeadId: async (leadId) => {
    try {
      const response = await api.get(`/api/lead_requirements/lead/${leadId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lead requirements:', error);
      throw error;
    }
  },

  // Get a specific requirement
  getById: async (requirementId) => {
    try {
      const response = await api.get(`/api/lead_requirements/${requirementId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching requirement:', error);
      throw error;
    }
  },

  // Create a new requirement
  create: async (leadId, data) => {
    try {
      const payload = {
        ...data,
        lead_id: leadId
      };
      const response = await api.post(`/api/lead_requirements`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating requirement:', error);
      throw error;
    }
  },

  // Update a requirement
  update: async (requirementId, data) => {
    try {
      console.log('Updating requirement:', requirementId, data);
      const response = await api.put(`/api/lead_requirements/${requirementId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating requirement:', error);
      throw error;
    }
  },

  // Delete a requirement
  delete: async (requirementId) => {
    try {
      const response = await api.delete(`/api/lead_requirements/${requirementId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting requirement:', error);
      throw error;
    }
  },

  // Finalize a requirement
  finalize: async (requirementId) => {
    try {
      const response = await api.patch(`/api/lead_requirements/${requirementId}/finalize`);
      return response.data;
    } catch (error) {
      console.error('Error finalizing requirement:', error);
      throw error;
    }
  },
};

// ==================== Lead Quotations API ====================
export const leadQuotationsAPI = {
  // Get all quotations for a lead
  getByLeadId: async (leadId) => {
    try {
      const response = await api.get(`/api/lead_quotations/lead/${leadId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quotations for lead ${leadId}:`, error);
      return [];
    }
  },

  // Get specific quotation
  getById: async (quotationId) => {
    try {
      const response = await api.get(`/api/lead_quotations/${quotationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quotation ${quotationId}:`, error);
      throw error;
    }
  },

  // Create new quotation
  create: async (leadId, quotationData) => {
    try {
      const dataToSend = {
        ...quotationData,
        lead_id: leadId
      };
      const response = await api.post(`/api/lead_quotations`, dataToSend);
      return response.data;
    } catch (error) {
      console.error(`Error creating quotation for lead ${leadId}:`, error);
      throw error;
    }
  },

  // Update quotation
  update: async (leadId, quotationId, quotationData) => {
    try {
      const response = await api.put(`/api/lead_quotations/${quotationId}`, quotationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating quotation ${quotationId}:`, error);
      throw error;
    }
  },

  // Delete quotation
  delete: async (leadId, quotationId) => {
    try {
      const response = await api.delete(`/api/lead_quotations/${quotationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting quotation ${quotationId}:`, error);
      throw error;
    }
  },

  // Send quotation to client
  send: async (leadId, quotationId, sendData) => {
    try {
      const response = await api.post(`/api/lead_quotations/${quotationId}/send`, sendData);
      return response.data;
    } catch (error) {
      console.error(`Error sending quotation ${quotationId}:`, error);
      throw error;
    }
  },

  // Update quotation status
  updateStatus: async (leadId, quotationId, status, feedback = '') => {
    try {
      const response = await api.patch(`/api/lead_quotations/${quotationId}/status`, { status, feedback });
      return response.data;
    } catch (error) {
      console.error(`Error updating quotation ${quotationId} status:`, error);
      throw error;
    }
  },

  // Get quotation history
  getHistory: async (leadId, quotationId) => {
    try {
      const response = await api.get(`/api/lead_quotation_history/quotation/${quotationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quotation ${quotationId} history:`, error);
      return [];
    }
  },

  // Create new version
  createVersion: async (leadId, quotationId, versionData) => {
    try {
      const response = await api.post(`/api/lead_quotations/${quotationId}/version`, versionData);
      return response.data;
    } catch (error) {
      console.error(`Error creating new version for quotation ${quotationId}:`, error);
      throw error;
    }
  },

  // Download quotation PDF
  downloadPDF: async (leadId, quotationId) => {
    try {
      const response = await api.get(`/api/lead_quotations/${quotationId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading quotation ${quotationId} PDF:`, error);
      throw error;
    }
  }
};

// ==================== Lead Activities API ====================
export const leadActivitiesAPI = {
  // Get all activities for a lead
  getByLeadId: async (leadId) => {
    try {
      const response = await api.get(`/api/lead_activities/lead/${leadId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching activities for lead ${leadId}:`, error);
      return [];
    }
  },

  // Create new activity
  create: async (leadId, activityData) => {
    try {
      const dataToSend = {
        ...activityData,
        lead_id: leadId
      };
      const response = await api.post(`/api/lead_activities`, dataToSend);
      return response.data;
    } catch (error) {
      console.error(`Error creating activity for lead ${leadId}:`, error);
      throw error;
    }
  },

  // Update activity
  update: async (leadId, activityId, activityData) => {
    try {
      const response = await api.put(`/api/lead_activities/${activityId}`, activityData);
      return response.data;
    } catch (error) {
      console.error(`Error updating activity ${activityId}:`, error);
      throw error;
    }
  },

  // Delete activity
  delete: async (leadId, activityId) => {
    try {
      const response = await api.delete(`/api/lead_activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting activity ${activityId}:`, error);
      throw error;
    }
  },

  // Complete activity
  complete: async (leadId, activityId, notes = '') => {
    try {
      const response = await api.patch(`/api/lead_activities/${activityId}/complete`, { notes });
      return response.data;
    } catch (error) {
      console.error(`Error completing activity ${activityId}:`, error);
      throw error;
    }
  }
};

export default api;
