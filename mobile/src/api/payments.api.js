import api from './axios.instance';

export const createPaymentIntent = (jobId) => api.post('/payments/create-intent', { job_id: jobId });
export const confirmCompletion = (jobId) => api.post('/payments/confirm-completion', { job_id: jobId });
export const getPaymentHistory = () => api.get('/payments/history');
