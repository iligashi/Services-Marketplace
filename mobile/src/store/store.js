import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import jobReducer from './jobSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobReducer,
    chat: chatReducer,
  },
});
