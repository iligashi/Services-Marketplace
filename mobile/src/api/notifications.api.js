import api from './axios.instance';

export const getNotifications = (unreadOnly) => api.get('/notifications', { params: unreadOnly ? { unread: 'true' } : {} });
export const markAllRead = () => api.patch('/notifications/read');
export const markOneRead = (id) => api.patch(`/notifications/${id}/read`);
