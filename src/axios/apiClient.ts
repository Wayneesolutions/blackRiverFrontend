// src/config/apiClient.js
import axios from "axios";
import { message } from "antd";

const baseUrl = import.meta.env.VITE_APP_BASE_URL

// Create instance
const apiClient = axios.create({
  baseURL: baseUrl // Base URL for all requests
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
  (error) => {
    if (error.response) {
      // Show error message
      message.error(error.response.data.message || "Something went wrong");
    } else if (error.request) {
      message.error("No response from server");
    } else {
      message.error(error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
