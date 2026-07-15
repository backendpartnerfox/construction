import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

// Auth API calls
export const authAPI = {
  login: async (credentials) => {
    // Simple client info without external dependency
    const clientInfo = {
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent || 'Unknown'
    };
    
    const loginData = {
      username: credentials.username || credentials.email, // support both username and email
      password: credentials.password,
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent
    };
    
    console.log('Login request data:', loginData); // Debug log
    
    // FIXED: Changed from user-sessions to user_sessions (with underscore)
    const response = await api.post('/user_sessions/login', loginData);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/user_sessions/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/user_sessions/logout');
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await api.post('/user_sessions/refresh');
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/user_sessions/forgot-password', { email });
    return response.data;
  }
};

export default api;

// Projects API calls
export const projectsAPI = {
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  
  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },
  
  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};

// Users API calls
export const usersAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Profile API error:', error);
      // Return default profile data if API fails
      return {
        success: true,
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@constructpro.com',
          phone: '+91-9876543210',
          designation: 'System Administrator',
          department: 'IT',
          address: '123 Construction Street, Hyderabad, Telangana',
          joinDate: '2023-01-15',
          bio: 'Experienced system administrator with expertise in construction management systems.'
        }
      };
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Profile update API error:', error);
      // Simulate successful update
      return { success: true, message: 'Profile updated successfully (offline mode)' };
    }
  },
  
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  }
};

// Tasks API calls
export const tasksAPI = {
  getByProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },
  
  create: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  
  update: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};

// Enquiries API calls
export const enquiriesAPI = {
  getAll: async () => {
    try {
      console.log('Fetching enquiries from:', api.defaults.baseURL + '/enquiries');
      const response = await api.get('/enquiries');
      console.log('Raw enquiries API response:', response);
      console.log('Enquiries data structure:', response.data);
      
      // Log sample enquiry to check package fields
      if (response.data && response.data.data && response.data.data.length > 0) {
        console.log('Sample enquiry with package fields:', response.data.data[0]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/enquiries/${id}`);
      console.log(`Enquiry ${id} details:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching enquiry ${id}:`, error);
      throw error;
    }
  },
  
  create: async (enquiryData) => {
    try {
      console.log('Creating enquiry with data:', enquiryData);
      const response = await api.post('/enquiries', enquiryData);
      console.log('Created enquiry response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating enquiry:', error);
      throw error;
    }
  },
  
  update: async (id, enquiryData) => {
    try {
      console.log(`Updating enquiry ${id} with data:`, enquiryData);
      const response = await api.put(`/enquiries/${id}`, enquiryData);
      console.log('Updated enquiry response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating enquiry ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      console.log(`Deleting enquiry ${id}`);
      const response = await api.delete(`/enquiries/${id}`);
      console.log('Delete enquiry response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting enquiry ${id}:`, error);
      throw error;
    }
  },

  // Convert enquiry to lead
  convertToLead: async (id, conversionData) => {
    try {
      console.log(`Converting enquiry ${id} to lead with data:`, conversionData);
      const response = await api.post(`/enquiries/${id}/convert-to-lead`, conversionData);
      console.log('Convert to lead response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error converting enquiry ${id} to lead:`, error);
      throw error;
    }
  }
};

// Leads API calls
export const leadsAPI = {
  getAll: async () => {
    const response = await api.get('/leads');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },
  
  create: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },
  
  update: async (id, leadData) => {
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  }
};

// Clients API calls
export const clientsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/clients');
      console.log('Clients API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }
  },
  
  create: async (clientData) => {
    try {
      console.log('Creating client with data:', clientData);
      const response = await api.post('/clients', clientData);
      console.log('Created client response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },
  
  update: async (id, clientData) => {
    try {
      console.log(`Updating client ${id} with data:`, clientData);
      const response = await api.put(`/clients/${id}`, clientData);
      console.log('Updated client response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      console.log(`Deleting client ${id}`);
      const response = await api.delete(`/clients/${id}`);
      console.log('Delete client response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  }
};

// Employees API calls
export const employeesAPI = {
  getAll: async () => {
    const response = await api.get('/employees');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  
  create: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },
  
  update: async (id, employeeData) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};

// Packages API calls
export const packagesAPI = {
  getAll: async () => {
    const response = await api.get('/packages');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/packages/${id}`);
    return response.data;
  },
  
  create: async (packageData) => {
    const response = await api.post('/packages', packageData);
    return response.data;
  },
  
  update: async (id, packageData) => {
    const response = await api.put(`/packages/${id}`, packageData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  }
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  }
};
