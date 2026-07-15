// Example API configuration for your frontend
// Copy this to your frontend project and adjust as needed

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// API client with proper CORS configuration
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for CORS with cookies
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    return this.request('/api/user-sessions/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/api/user-sessions/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/api/user-sessions/current', {
      method: 'GET',
    });
  }

  // Generic CRUD methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Export a singleton instance
const apiClient = new ApiClient();
export default apiClient;

// Example usage in a React component:
/*
import apiClient from './services/apiClient';

// In your login component:
const handleLogin = async (email, password) => {
  try {
    const response = await apiClient.login({ email, password });
    console.log('Login successful:', response);
    // Handle successful login (store token, redirect, etc.)
  } catch (error) {
    console.error('Login failed:', error);
    // Handle error (show error message, etc.)
  }
};

// In other components:
const fetchProjects = async () => {
  try {
    const projects = await apiClient.get('/api/projects');
    setProjects(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
};
*/