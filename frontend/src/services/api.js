import axios from 'axios';

const API_BASE_URL = window?._CONFIG_?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  console.warn('[API] Warning: VITE_API_BASE_URL is not defined in environment variables or runtime config. API calls may fail.');
}
console.log('[API] Using base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
