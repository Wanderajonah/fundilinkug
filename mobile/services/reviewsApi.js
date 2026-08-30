import api from './api';

export const createReview = (payload) => api.post('/reviews', payload);

export const updateReview = (id, payload) => api.patch(`/reviews/${id}`, payload);

export const getMyReviews = () => api.get('/reviews/mine');

export const getReviewsByFundi = (fundiId) => api.get(`/reviews/${fundiId}`);

/** Upload photo(s) for a review and return the server URLs. */
export const uploadReviewImages = async (photoUris) => {
  if (!photoUris || !photoUris.length) return [];
  const formData = new FormData();
  photoUris.forEach((uri, i) => {
    formData.append('images', {
      uri,
      name: `review-${Date.now()}-${i}.jpg`,
      type: 'image/jpeg',
    });
  });
  const { data } = await api.post('/reviews/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data?.urls || [];
};

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Could not save review.';
