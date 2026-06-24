import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getNotifications, markAllRead, markOneRead } from '../api/notifications.api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await getNotifications();
    return data.notifications;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load notifications');
  }
});

export const markNotificationRead = createAsyncThunk('notifications/markOne', async (id) => {
  await markOneRead(id);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAll', async () => {
  await markAllRead();
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item) item.is_read = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.is_read = true; });
      });
  },
});

export default notificationSlice.reducer;
