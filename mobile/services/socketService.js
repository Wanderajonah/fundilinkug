import { io } from 'socket.io-client';
import { getSocketUrl } from './api';

let socket = null;
const listeners = new Map();

function ensureListener(event) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
    socket?.on(event, (data) => {
      listeners.get(event)?.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.warn(`Socket listener error (${event}):`, e);
        }
      });
    });
  }
}

export function connectSocket(userId) {
  if (!userId) return null;

  const url = getSocketUrl();
  if (socket?.connected && socket.userId === userId) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.userId = userId;

  socket.on('connect', () => {
    socket.emit('user_connect', { userId });
  });

  listeners.forEach((_, event) => {
    ensureListener(event);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  listeners.clear();
}

export function subscribeSocket(event, handler) {
  ensureListener(event);
  listeners.get(event).add(handler);
  return () => {
    listeners.get(event)?.delete(handler);
  };
}

export function emitSocket(event, data) {
  socket?.emit(event, data);
}

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return Boolean(socket?.connected);
}
