// src/api.ts — Axios instance for monorepo deployment
import axios from 'axios';

const api = axios.create({
  // Hardcoded to /api. This works on Vercel (via rewrites) 
  // and locally (via vite.config.ts proxy).
  baseURL: '/api',
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
