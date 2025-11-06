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
   
    
    return Promise.reject(error);
  }
);

export default apiClient;
