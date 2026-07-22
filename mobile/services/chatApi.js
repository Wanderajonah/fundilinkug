import api from './api';

export const getOrCreateConversation = (bookingId, targetUserId) =>
  api.post('/chat/conversations', { bookingId, targetUserId });

export const getConversations = () =>
  api.get('/chat/conversations');

export const getMessages = (conversationId) =>
  api.get(`/chat/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, text) =>
  api.post(`/chat/conversations/${conversationId}/messages`, { text });

export const sendSupportMessage = (message, history = []) =>
  api.post('/chat/support', { message, history });

export const markConversationRead = (conversationId) =>
  api.post(`/chat/conversations/${conversationId}/read`);

export const uploadChatImage = (formData) =>
  api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';
