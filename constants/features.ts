export const FEATURES = {
  ENABLE_LIVE_POLLING: true,
  ENABLE_INCIDENT_MARQUEE: true,
  ENABLE_STEALTH_RECORDING: true,
  LIVE_POLL_INTERVAL_MS: 15_000,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
