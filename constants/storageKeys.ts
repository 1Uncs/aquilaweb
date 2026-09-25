export const STORAGE_KEYS = {
  AUTH_TOKEN: 'aquila_auth_token',
  USER: 'aquila_user',
  ONBOARDED: 'aquila_onboarded',
  ELECTIONS_CACHE: 'aquila_elections_cache',
  RESULTS_CACHE: 'aquila_results_cache',
  INCIDENTS_CACHE: 'aquila_incidents_cache',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
