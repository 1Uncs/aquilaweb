import Colors from '@/constants/colors';

type Scheme = keyof typeof Colors;

const RESULT_STATUS_KEY: Record<string, 'verified' | 'pending' | 'disputed' | 'rejected'> = {
  PUBLISHED: 'verified',
  VERIFIED: 'verified',
  COLLATED: 'verified',
  SUBMITTED: 'pending',
  DRAFT: 'pending',
  UNDER_REVIEW: 'pending',
  FLAGGED: 'disputed',
  DISPUTED: 'disputed',
  REJECTED: 'rejected',
};

export function resultStatusColor(status: string | undefined, scheme: Scheme): string {
  const key = RESULT_STATUS_KEY[(status ?? '').toUpperCase()] ?? 'pending';
  return Colors[scheme][key] as string;
}

export function resultStatusSubtle(status: string | undefined, scheme: Scheme): string {
  const key = RESULT_STATUS_KEY[(status ?? '').toUpperCase()] ?? 'pending';
  const subtleKey = `${key}Subtle` as 'verifiedSubtle' | 'pendingSubtle' | 'disputedSubtle' | 'rejectedSubtle';
  return Colors[scheme][subtleKey] as string;
}

const INCIDENT_STATUS_KEY: Record<string, 'verified' | 'pending' | 'disputed' | 'rejected'> = {
  RESOLVED: 'verified',
  SUBMITTED: 'pending',
  UNDER_REVIEW: 'pending',
  ESCALATED: 'disputed',
  DISMISSED: 'rejected',
};

export function incidentStatusColor(status: string | undefined, scheme: Scheme): string {
  const key = INCIDENT_STATUS_KEY[(status ?? '').toUpperCase()] ?? 'pending';
  return Colors[scheme][key] as string;
}
