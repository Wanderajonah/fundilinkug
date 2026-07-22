import api from './api';

export const createReview = (payload) => api.post('/reviews', payload);

export const updateReview = (id, payload) => api.patch(`/reviews/${id}`, payload);

export const getMyReviews = () => api.get('/reviews/mine');

export const getReviewsByFundi = (fundiId) => api.get(`/reviews/${fundiId}`);

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Could not save review.';
