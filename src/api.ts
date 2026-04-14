// src/api.ts — Axios instance for Experimental Services deployment
import axios from 'axios';

const api = axios.create({
  // baseURL matches the 'routePrefix' defined in vercel.json for the backend service
  baseURL: '/_/backend',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage before every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cc_token');
    }
    return Promise.reject(error);
  }
);

export default api;
