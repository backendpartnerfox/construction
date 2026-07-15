import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const assignToProjectService = {
  // Get all assignments
  getAll: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign_to_project`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error.response?.data || error;
    }
  },

  // Get assignments by project ID
  getByProjectId: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign_to_project/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project assignments:', error);
      throw error.response?.data || error;
    }
  },

  // Get assignments by user ID
  getByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign_to_project/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      throw error.response?.data || error;
    }
  },

  // Get single assignment
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign_to_project/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error.response?.data || error;
    }
  },

  // Create assignment
  create: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/assign_to_project`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error.response?.data || error;
    }
  },

  // Update assignment
  update: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/assign_to_project/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error.response?.data || error;
    }
  },

  // Delete assignment
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/assign_to_project/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error.response?.data || error;
    }
  },

  // Get workload summary
  getWorkloadSummary: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign_to_project/workload/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workload summary:', error);
      throw error.response?.data || error;
    }
  },

  // Get project roster
  getProjectRoster: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign_to_project/project/${projectId}/roster`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project roster:', error);
      throw error.response?.data || error;
    }
  }
};
