// Global axios interceptors — imported once at app boot.
//
// Many pages call `axios.get(...)` directly instead of going through the
// `./services/api.js` wrapper. Without a global interceptor, those requests
// would go out unauthenticated and hit the backend RBAC middleware as
// anonymous users. This file wires the same auth-token attach + 401 handling
// onto the default axios instance so every direct call is covered.

import axios from 'axios';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 -> session expired or missing token. Wipe local auth and bounce to /login.
    if (error?.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      localStorage.removeItem('permissions');
      // Avoid redirect loop if we're already on /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
