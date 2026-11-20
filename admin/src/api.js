import axios from 'axios';

// VITE_API_URL is a full base URL. VITE_API_HOST is injected by Render as the
// bare service name (e.g. "marketplace-api-b0sd"), public at <name>.onrender.com.
const { VITE_API_URL, VITE_API_HOST } = import.meta.env;
const apiHost = VITE_API_HOST && !VITE_API_HOST.includes('.') ? `${VITE_API_HOST}.onrender.com` : VITE_API_HOST;
const baseURL = VITE_API_URL || (apiHost ? `https://${apiHost}/api` : 'http://localhost:3000/api');

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
