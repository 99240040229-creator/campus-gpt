// src/api.ts — Axios instance for monorepo deployment
import axios from 'axios';

const api = axios.create({
  // baseURL is intentionally empty because our path strings in the 
  // components already start with '/api'.
  baseURL: '',
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
