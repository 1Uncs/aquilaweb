import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mmkvInstance: { getString: (key: string) => string | undefined; set: (key: string, value: string | number | boolean) => void; remove: (key: string) => boolean } | null = null;
let mmkvAvailable: boolean | null = null;

function getMMKVInstance() {
  if (mmkvAvailable !== null) return mmkvAvailable ? mmkvInstance : null;
  try {
    if (Platform.OS === 'web') {
      mmkvAvailable = false;
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic require to avoid NitroModules crash in Expo Go; caught by try/catch below
    mmkvInstance = require('react-native-mmkv').createMMKV();
    mmkvAvailable = true;
    return mmkvInstance;
  } catch {
    mmkvAvailable = false;
    return null;
  }
}

let secureStoreAvailable: boolean | null = null;
let secureStoreModule: { getItemAsync: (key: string) => Promise<string | null>; setItemAsync: (key: string, value: string) => Promise<void>; deleteItemAsync: (key: string) => Promise<void> } | null = null;

function getSecureStoreModule() {
  if (secureStoreAvailable !== null) return secureStoreAvailable ? secureStoreModule : null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic require to avoid NitroModules crash in Expo Go; caught by try/catch below
    secureStoreModule = require('expo-secure-store');
    secureStoreAvailable = true;
    return secureStoreModule;
  } catch {
    secureStoreAvailable = false;
    return null;
  }
}

const asyncStorage = {
  getString: async (key: string) => (await AsyncStorage.getItem(key)) ?? undefined,
  set: async (key: string, value: string | number | boolean) =>
    AsyncStorage.setItem(key, String(value)),
  remove: async (key: string) => AsyncStorage.removeItem(key),
};

const memoryStore = new Map<string, string>();

// reserved for future SecureStore-backed Zustand fallback — keep to avoid churn
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained for fallback
function createSecureStoreStorage() {
  const mod = getSecureStoreModule();
  if (!mod) return null;
  return {
    getItem: (key: string) => mod!.getItemAsync(key).then((v) => (v ?? null)),
    setItem: (key: string, value: string) => mod!.setItemAsync(key, value),
    removeItem: (key: string) => mod!.deleteItemAsync(key),
  };
}

function createAsyncStorageStorage() {
  return {
    getItem: (key: string) => asyncStorage.getString(key).then((v) => (v ?? null)),
    setItem: (key: string, value: string) => asyncStorage.set(key, value),
    removeItem: (key: string) => asyncStorage.remove(key),
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained for memory fallback
function createMemoryStorage() {
  return {
    getItem: (key: string) => Promise.resolve(memoryStore.get(key) ?? null),
    setItem: (key: string, value: string) => Promise.resolve(memoryStore.set(key, value)),
    removeItem: (key: string) => Promise.resolve(memoryStore.delete(key)),
  };
}

export function createMMKVStorage() {
  const instance = getMMKVInstance();
  if (instance) {
    return {
      getItem: (key: string) => {
        try {
          return Promise.resolve(instance.getString(key) ?? null);
        } catch (e) {
          if (__DEV__) console.warn('[mmkv] getString failed, falling back', e);
          return Promise.resolve(null);
        }
      },
      setItem: (_key: string, value: string) => {
        try {
          return Promise.resolve(instance.set(_key, value));
        } catch (e) {
          if (__DEV__) console.warn('[mmkv] set failed', e);
          return Promise.resolve();
        }
      },
      removeItem: (_key: string) => {
        try {
          return Promise.resolve(instance.remove(_key));
        } catch (e) {
          if (__DEV__) console.warn('[mmkv] remove failed', e);
          return Promise.resolve(false as unknown as void);
        }
      },
    } as any;
  }

  // AsyncStorage is the primary fallback — works in Expo Go on both iOS and Android
  const fallback = createAsyncStorageStorage() as any;
  // wrap fallback to never throw unhandled rejection
  const origGet = fallback.getItem;
  const origSet = fallback.setItem;
  const origRemove = fallback.removeItem;
  fallback.getItem = (k: string) => origGet(k).catch((e: unknown) => {
    if (__DEV__) console.warn('[asyncStorage] getItem failed', e);
    return null;
  });
  fallback.setItem = (k: string, v: string) => origSet(k, v).catch((e: unknown) => {
    if (__DEV__) console.warn('[asyncStorage] setItem failed', e);
  });
  fallback.removeItem = (k: string) => origRemove(k).catch((e: unknown) => {
    if (__DEV__) console.warn('[asyncStorage] removeItem failed', e);
  });
  return fallback;
}
