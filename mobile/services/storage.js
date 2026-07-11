import { Platform } from 'react-native';

let AsyncStorage = null;

if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch {
    // native module not available
  }
}

const memoryStore = new Map();

export async function getItem(key) {
  if (AsyncStorage) {
    try { return await AsyncStorage.getItem(key); } catch { /* fall through */ }
  }
  return memoryStore.get(key) ?? null;
}

export async function setItem(key, value) {
  if (AsyncStorage) {
    try { await AsyncStorage.setItem(key, value); return; } catch { /* fall through */ }
  }
  memoryStore.set(key, value);
}

export async function removeItem(key) {
  if (AsyncStorage) {
    try { await AsyncStorage.removeItem(key); return; } catch { /* fall through */ }
  }
  memoryStore.delete(key);
}
