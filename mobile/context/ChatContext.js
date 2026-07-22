import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getConversations,
  getMessages,
  sendSupportMessage,
  uploadChatImage,
  getErrorMessage,
} from '../services/chatApi';
import {
  subscribeSocket,
  emitSocket,
} from '../services/socketService';

const ChatContext = createContext(null);

export function ChatProvider({ children, userId, authToken }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const { data } = await getConversations();
      setConversations(data?.conversations || []);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId || !authToken) return;
    setLoading(true);
    try {
      const { data } = await getMessages(conversationId);
      setMessages(data?.messages || []);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const openConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId);
    setMessages([]);
    loadMessages(conversationId);
    emitSocket('join_conversation', { conversationId });
  }, [loadMessages]);

  const closeConversation = useCallback((conversationId) => {
    if (activeConversationId) {
      emitSocket('leave_conversation', { conversationId: activeConversationId });
    }
    setActiveConversationId(null);
    setMessages([]);
  }, [activeConversationId]);

  const sendTextMessage = useCallback(async (conversationId, text) => {
    if (!text?.trim() || !conversationId) return;
    emitSocket('send_message', { conversationId, text: text.trim() });
  }, []);

  const sendImageMessage = useCallback(async (conversationId, imageUri) => {
    if (!imageUri || !conversationId) return;
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    });
    try {
      const { data } = await uploadChatImage(formData);
      if (data?.url) {
        emitSocket('send_message', { conversationId, imageUrl: data.url });
      }
    } catch (e) {
      console.error('Failed to upload image:', e);
    }
  }, []);

  const sendSupportQuery = useCallback(async (message, history) => {
    try {
      const { data } = await sendSupportMessage(message, history);
      return data?.reply || '';
    } catch (e) {
      return 'Sorry, I could not process your request. Please try again.';
    }
  }, []);

  const startTyping = useCallback((conversationId) => {
    emitSocket('typing_start', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId) => {
    emitSocket('typing_stop', { conversationId });
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
    setConversations((prev) => prev.map((c) => {
      if (c._id === msg.conversationId) {
        const preview = msg.imageUrl && !msg.text ? '\uD83D\uDCF7 Photo' : (msg.text || '');
        return { ...c, lastMessage: preview, lastSenderId: msg.senderId, lastMessageAt: new Date() };
      }
      return c;
    }));
  }, []);

  useEffect(() => {
    if (!authToken || !userId) return;
    refreshConversations();

    const unsubs = [
      subscribeSocket('new_message', (payload) => {
        if (payload?.message) addMessage(payload.message);
      }),
      subscribeSocket('conversation_created', (payload) => {
        refreshConversations();
      }),
      subscribeSocket('user_typing', (payload) => {
        if (payload?.conversationId && payload?.userId) {
          setTypingUsers((prev) => ({ ...prev, [payload.conversationId]: payload.userId }));
        }
      }),
      subscribeSocket('user_stopped_typing', (payload) => {
        if (payload?.conversationId) {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[payload.conversationId];
            return next;
          });
        }
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn?.());
    };
  }, [authToken, userId, refreshConversations, addMessage]);

  const value = useMemo(() => ({
    conversations,
    activeConversationId,
    messages,
    loading,
    error,
    typingUsers,
    messagesEndRef,
    refreshConversations,
    loadMessages,
    openConversation,
    closeConversation,
    sendTextMessage,
    sendImageMessage,
    sendSupportQuery,
    startTyping,
    stopTyping,
    setActiveConversationId,
  }), [
    conversations, activeConversationId, messages, loading, error,
    typingUsers, refreshConversations, loadMessages, openConversation,
    closeConversation, sendTextMessage, sendImageMessage, sendSupportQuery,
    startTyping, stopTyping,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

export function useChatOptional() {
  return useContext(ChatContext);
}
