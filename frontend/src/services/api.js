import axios from 'axios';
import { Storage } from '../configration/storage';
import { API_BASE_URL } from '../configration/config';

// Reusable API base URL from environment variable
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: `${API}/api/`,
  timeout: 30000,
  withCredentials: true,  // ✅ Enable sending cookies for CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = Storage.getItem('token');
    const tokenExpiration = Storage.getItem('tokenExpiration');
    const currentTime = Date.now();
    
    // Check if token is about to expire (within 5 minutes)
    if (token && tokenExpiration) {
      const timeUntilExpiry = tokenExpiration - currentTime;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        console.log('Token expiring soon, refreshing proactively...');
        try {
          const refreshToken = Storage.getItem('refreshToken');
          
          if (refreshToken) {
            const response = await axios.post(
              `${import.meta.env.VITE_AUTH_URL || 'http://localhost:8000/api/'}token/refresh/`,
              { refresh: refreshToken }
            );

            const { access } = response.data;
            
            if (access) {
              Storage.setItem('token', access);
              const newExpiration = currentTime + (3600 * 1000); // 1 hour
              Storage.setItem('tokenExpiration', newExpiration);
              
              if (response.data.refresh) {
                Storage.setItem('refreshToken', response.data.refresh);
              }
              
              config.headers.Authorization = `Bearer ${access}`;
              console.log('Token refreshed proactively');
              return config;
            }
          }
        } catch (error) {
          console.error('Proactive token refresh failed:', error);
          // Continue with existing token
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Storage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.error('No refresh token available - cannot refresh token');
          // Don't automatically logout, let the component handle it
          return Promise.reject(error);
        }

        console.log('Attempting to refresh token...');
        const response = await axios.post(
          `${API}/api/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        
        if (!access) {
          throw new Error('No access token in refresh response');
        }

        Storage.setItem('token', access);
        
        // Update refresh token if provided
        if (response.data.refresh) {
          Storage.setItem('refreshToken', response.data.refresh);
        }

        console.log('Token refreshed successfully');
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, let the component handle it
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
