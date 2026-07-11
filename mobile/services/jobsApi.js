import api from './api';

export const getJobsForUser = (userId) => api.get(`/jobs/${userId}`);

export const updateJobStatus = (jobId, status) =>
  api.patch(`/jobs/detail/${jobId}/status`, { status });

export const createJob = (payload) => api.post('/jobs', payload);

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Request failed.';
