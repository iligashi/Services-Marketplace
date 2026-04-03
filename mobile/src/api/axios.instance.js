import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { logout, setTokens } from '../store/authSlice';

// Web uses localhost, mobile uses LAN IP to reach the backend
const API_URL = Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : 'http://192.168.0.127:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          store.dispatch(setTokens(data));
          // Also persist the refreshed tokens to storage
          const currentState = store.getState();
          await AsyncStorage.setItem('@auth_state', JSON.stringify({
            user: currentState.auth.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }));
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          store.dispatch(logout());
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
