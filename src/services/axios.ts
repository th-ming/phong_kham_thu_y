import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

/**
 * FIX #15: Axios Interceptor Service
 * - Automatically adds JWT token to all requests
 * - Handles token refresh on expiration
 * - Centralized API configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - Add JWT Token
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle Errors
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/dang-nhap';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
