import api from './axios.instance';

export const getPublicProfile = (userId) => api.get(`/auth/user/${userId}`);
export const getUserReviews = (userId) => api.get(`/reviews/user/${userId}`);

// Saved jobs
export const saveJob = (jobId) => api.post(`/jobs/${jobId}/save`);
export const unsaveJob = (jobId) => api.delete(`/jobs/${jobId}/save`);
export const getSavedJobs = () => api.get('/jobs/saved');

// Provider recommendations
export const getRecommendedJobs = () => api.get('/provider/recommended-jobs');
