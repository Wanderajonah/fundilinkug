import api from './api';

// Client endpoints
export const createBooking = (bookingData) => api.post('/bookings/client/create', bookingData);

export const getClientBookings = (status) => api.get(`/bookings/client/bookings${status ? `?status=${status}` : ''}`);

export const getClientBookingById = (bookingId) => api.get(`/bookings/client/bookings/${bookingId}`);

export const completeBooking = (bookingId) => api.post(`/bookings/client/bookings/${bookingId}/complete`);

export const cancelClientBooking = (bookingId, reason) => 
  api.post(`/bookings/client/bookings/${bookingId}/cancel`, { reason });

// Fundi endpoints
export const acceptBooking = (bookingId) => api.post('/bookings/fundi/accept', { bookingId });

export const declineBooking = (bookingId) => api.post('/bookings/fundi/decline', { bookingId });

export const updateBookingStatus = (bookingId, status) => 
  api.put('/bookings/fundi/status', { bookingId, status });

export const cancelFundiBooking = (bookingId, reason) => 
  api.post('/bookings/fundi/cancel', { bookingId, reason });

export const getFundiBookings = (status) => api.get(`/bookings/fundi/bookings${status ? `?status=${status}` : ''}`);

export const getFundiBookingById = (bookingId) => api.get(`/bookings/fundi/bookings/${bookingId}`);

export const updateFundiLocation = (lat, lng) => api.put('/bookings/fundi/location', { lat, lng });

export const updateFundiAvailability = (isAvailable) => 
  api.put('/bookings/fundi/availability', { isAvailable });

export const negotiateClientPrice = (bookingId, { price, action }) =>
  api.post(`/bookings/client/bookings/${bookingId}/price`, { price, action });

export const negotiateFundiPrice = (bookingId, { price, action }) =>
  api.post(`/bookings/fundi/bookings/${bookingId}/price`, { price, action });

export const uploadBookingImage = (formData) =>
  api.post('/bookings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';
