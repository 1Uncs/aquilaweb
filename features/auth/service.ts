import { useAuthStore } from '@/features/auth/store';
import { mockApi } from '@/features/elections/service';
import { setTokenAsync, deleteTokenAsync } from '@/core/utils/secureStorage';

export const login = async (email: string, password: string, organizationId: string, organizationName: string) => {
  const user = await mockApi.login(email, password, organizationId, organizationName);
  useAuthStore.getState().login(user);
  if (user.token) {
    try {
      await setTokenAsync(user.token);
    } catch (e) {
      if (__DEV__) console.warn('[auth] setTokenAsync failed (non-fatal)', e);
      // do not reject — auth state already committed, SecureStore is auxiliary
    }
  }
};

export const logout = async () => {
  // clear Zustand first so UI navigates even if SecureStore throws
  useAuthStore.getState().logout();
  try {
    await deleteTokenAsync();
  } catch (e) {
    if (__DEV__) console.warn('[auth] deleteTokenAsync failed (non-fatal)', e);
  }
};
