// src/config/apiClient.js
import axios from "axios";

const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000/api/v1'

// Debug: Log the base URL to console
console.log('VITE_APP_BASE_URL:', baseUrl);

// Create instance
const apiClient = axios.create({
  baseURL: baseUrl // Base URL for all requests with fallback
});

// Request interceptor - Add token or any header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or get from Redux/Context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Clear authentication data (including Redux state via localStorage)
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('superAdminInfo');
      // Legacy cleanup
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      
      // Determine redirect path based on current route
      let redirectPath = '/admin/login';
      if (currentPath.startsWith('/superadmin')) {
        redirectPath = '/superadmin/login';
      }
      
      // Only redirect if not already on login page
      if (!currentPath.includes('/login')) {
        console.warn('Session expired or unauthorized. Redirecting to login...');
        window.location.href = redirectPath;
      }
      
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden errors (inactive account)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.includes('inactive')) {
        const currentPath = window.location.pathname;
        
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('superAdminInfo');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        
        // Determine redirect path based on current route
        let redirectPath = '/admin/login';
        if (currentPath.startsWith('/superadmin')) {
          redirectPath = '/superadmin/login';
        }
        
        // Only redirect if not already on login page
        if (!currentPath.includes('/login')) {
          console.warn('Account is inactive. Redirecting to login...');
          window.location.href = redirectPath;
        }
      }
      
      return Promise.reject(error);
    }
    
    // Handle other errors
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      console.error('API Request Error:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
