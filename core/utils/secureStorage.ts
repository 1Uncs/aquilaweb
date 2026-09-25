import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'aquila_auth_token';

export async function setTokenAsync(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    if (__DEV__) console.warn('[secureStorage] setItemAsync failed', e);
    throw e;
  }
}

export async function getTokenAsync(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    if (__DEV__) console.warn('[secureStorage] getItemAsync failed', e);
    return null;
  }
}

export async function deleteTokenAsync(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {
    // delete of missing key throws on some Android keystore impls — treat as success
    if (__DEV__) console.warn('[secureStorage] deleteItemAsync failed (treated as non-fatal)', e);
  }
  // one-time cleanup of legacy invalid key that always threw — best-effort
  try {
    await SecureStore.deleteItemAsync('@aquila/auth_token');
  } catch {
    // ignore
  }
}
