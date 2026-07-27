import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
export const getAnalytics = () => api.get('/admin/analytics');
export const getFundis = (params) => api.get('/admin/fundis', { params });
export const verifyFundi = (id) => api.put(`/admin/fundis/${id}/verify`);
export const rejectFundi = (id) => api.put(`/admin/fundis/${id}/reject`);
export const deleteFundi = (id) => api.delete(`/admin/fundis/${id}`);
export const getClients = (params) => api.get('/admin/clients', { params });
export const suspendClient = (id) => api.put(`/admin/clients/${id}/suspend`);
export const getBookings = (params) => api.get('/admin/bookings', { params });
export const updateBookingStatus = (id, status) => api.put(`/admin/bookings/${id}/status`, { status });
export const getPayments = (params) => api.get('/admin/payments', { params });
export const releaseEscrow = (id) => api.put(`/admin/payments/${id}/release`);
export const getReviews = (params) => api.get('/admin/reviews', { params });
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`);

export default api;
