import axios from 'axios';

const api = axios.create({
  baseURL: 'https://fundilinkug.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const login = (email, password) => api.post('/admin/login', { email, password });
export const getStats = () => api.get('/admin/stats');
export const getAnalytics = () => api.get('/admin/analytics');

export const getFundis = (params) => api.get('/admin/fundis', { params });
export const verifyFundi = (id, notes) => api.patch(`/admin/fundis/${id}/verify`, { status: 'verified', notes });
export const rejectFundi = (id, notes) => api.patch(`/admin/fundis/${id}/verify`, { status: 'rejected', notes });
export const deleteFundi = (id) => api.delete(`/admin/fundis/${id}`);

export const getClients = (params) => api.get('/admin/users', { params });
export const suspendClient = (id) => api.patch(`/admin/users/${id}/status`, { status: 'suspended' });
export const createUser = (data) => api.post('/admin/users', data);

export const getBookings = (params) => api.get('/admin/bookings', { params });
export const updateBookingStatus = (id, status) => api.patch(`/admin/bookings/${id}/status`, { status });

export const getDisputes = (params) => api.get('/admin/disputes', { params });
export const resolveDispute = (id, resolution) => api.patch(`/admin/disputes/${id}/resolve`, { resolution });

export const getPayments = (params) => api.get('/admin/payments', { params });
export const releaseEscrow = (id) => api.patch(`/admin/payments/${id}/release`);

export const getReviews = (params) => api.get('/admin/reviews', { params });
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`);

export const getNotifications = (params) => api.get('/admin/notifications', { params });
export const markNotificationRead = (id) => api.patch(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/admin/notifications/read-all');

export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (data) => api.put('/admin/settings', data);

export default api;
