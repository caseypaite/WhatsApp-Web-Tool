import axios from 'axios';

const getApiBaseUrl = () => {
  if (window._CONFIG_ && window._CONFIG_.VITE_API_BASE_URL && window._CONFIG_.VITE_API_BASE_URL !== '$VITE_API_BASE_URL') {
    return window._CONFIG_.VITE_API_BASE_URL;
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[API] Node Initialized with Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // No need to manually set Authorization header, cookies are sent automatically
  // with credentials: true if needed, but standard browser behavior handles it.
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('[API] Unauthorized access detected. Clearing session...');
      localStorage.removeItem('user');
      
      // Prevent infinite reload loops
      if (!window.location.hash.includes('/login')) {
        window.location.href = '/#/login';
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
