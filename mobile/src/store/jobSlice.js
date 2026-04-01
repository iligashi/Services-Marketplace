import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getJobs, getMyJobs, getCategories } from '../api/jobs.api';

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async (params) => {
  const { data } = await getJobs(params);
  return data;
});

export const fetchMyJobs = createAsyncThunk('jobs/fetchMine', async (params) => {
  const { data } = await getMyJobs(params);
  return data;
});

export const fetchCategories = createAsyncThunk('jobs/fetchCategories', async () => {
  const { data } = await getCategories();
  return data.categories;
});

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    list: [],
    myJobs: [],
    categories: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.jobs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchMyJobs.fulfilled, (state, action) => {
        state.myJobs = action.payload.jobs;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export default jobSlice.reducer;
