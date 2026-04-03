import api from './axios.instance';

export const getJobs = (params) => api.get('/jobs', { params });
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const createJob = (formData) => api.post('/jobs', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);
export const cancelJob = (id) => api.patch(`/jobs/${id}/cancel`);
export const startWork = (id) => api.patch(`/jobs/${id}/start`);
export const markJobComplete = (id) => api.patch(`/jobs/${id}/complete`);
export const getMyJobs = (params) => api.get('/jobs/my', { params });
export const getCategories = () => api.get('/jobs/categories');

// Bids
export const submitBid = (data) => api.post('/bids', data);
export const getBidsForJob = (jobId) => api.get(`/bids/job/${jobId}`);
export const acceptBid = (bidId) => api.patch(`/bids/${bidId}/accept`);
export const rejectBid = (bidId) => api.patch(`/bids/${bidId}/reject`);
export const getMyBids = () => api.get('/bids/my');
