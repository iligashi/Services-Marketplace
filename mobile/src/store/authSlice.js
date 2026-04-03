import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios.instance';

const AUTH_STORAGE_KEY = '@auth_state';

async function saveAuthToStorage(user, accessToken, refreshToken) {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
  } catch {}
}

async function clearAuthStorage() {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

export const restoreAuth = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return rejectWithValue('No stored auth');
    const parsed = JSON.parse(stored);
    if (!parsed.accessToken || !parsed.user) return rejectWithValue('Invalid stored auth');
    return parsed;
  } catch {
    return rejectWithValue('Failed to restore auth');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    await saveAuthToStorage(data.user, data.accessToken, data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    await saveAuthToStorage(data.user, data.accessToken, data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/profile');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    isRestoring: true,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      clearAuthStorage();
    },
    setTokens(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      saveAuthToStorage(state.user, action.payload.accessToken, action.payload.refreshToken);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.pending, (state) => { state.isRestoring = true; })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.isRestoring = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(restoreAuth.rejected, (state) => { state.isRestoring = false; })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      });
  },
});

export const { logout, setTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
