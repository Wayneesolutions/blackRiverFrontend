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
  (response) => {
    return response;
  },
  async (error) => {
    // Don't redirect if already on login page or if error is from a background request
    const isLoginPage = window.location.pathname === '/' || 
                       window.location.pathname === '/admin/adminLogin';
    const isBackgroundRequest = error.config?.url?.includes('expiring') || 
                                error.config?.url?.includes('notification');
    
    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Access forbidden';
      
      // Log detailed error information (only for non-background requests)
      if (!isBackgroundRequest) {
        console.error('❌ 403 Forbidden Error:', {
          message: errorMessage,
          url: error.config?.url,
          status: error.response.status,
          data: error.response.data
        });
      }
      
      // Check if it's a token issue (invalid/expired token)
      if ((errorMessage.includes('Invalid token') || errorMessage.includes('token')) && !isLoginPage && !isBackgroundRequest) {
        console.warn('⚠️ Token issue detected. Clearing token and redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        // Only redirect if not already on login page
        if (!isLoginPage) {
          // Use setTimeout to avoid redirect loop
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
        return Promise.reject(error);
      }
      
      // Check if it's an inactive account
      if (errorMessage.includes('not active') || errorMessage.includes('inactive') || errorMessage.includes('Account is inactive')) {
        if (!isBackgroundRequest) {
          console.error('❌ Account is inactive. Clearing token and redirecting to login...');
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          // Only redirect if not already on login page
          if (!isLoginPage) {
            setTimeout(() => {
              window.location.href = '/admin/login';
            }, 100);
          }
        }
        return Promise.reject(error);
      }
      
      // Check if it's a role/permission issue
      if (errorMessage.includes('Access denied') || errorMessage.includes('role')) {
        if (!isBackgroundRequest) {
          console.error('❌ Access denied. Your role does not have permission to access this resource.');
        }
      }
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401 && !isLoginPage && !isBackgroundRequest) {
      console.warn('⚠️ Unauthorized. Token may be expired. Clearing storage...');
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      // Only redirect if not already on login page
      if (!isLoginPage) {
        // Use setTimeout to avoid redirect loop
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 100);
      }
      return Promise.reject(error);
    }
    
    // For network errors or other errors, just reject without redirecting
    return Promise.reject(error);
  }
);

export default apiClient;
