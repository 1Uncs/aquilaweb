import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'ELECTION_OFFICER',
  'POLLING_AGENT',
  'FIELD_AGENT',
]);

export const ElectionStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
]);

export const ResultStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'PUBLISHED',
  'CORRECTED',
]);

export const IncidentStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'RESOLVED',
  'CLOSED',
]);

export const IncidentSeveritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const IncidentCategorySchema = z.enum([
  'VIOLENCE',
  'BALLOT_SNATCHING',
  'VOTE_BUYING',
  'VOTER_INTIMIDATION',
  'OVER_VOTING',
  'UNDER_AGE_VOTING',
  'PU_NOT_OPEN',
  'LATE_OFFICIALS',
  'LATE_MATERIALS',
  'EQUIPMENT_FAILURE',
  'BVAS_FAILURE',
  'SECURITY_INCIDENT',
  'PROTEST',
  'WEATHER_DISRUPTION',
  'OTHER',
]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type ElectionStatus = z.infer<typeof ElectionStatusSchema>;
export type ResultStatus = z.infer<typeof ResultStatusSchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;
export type IncidentCategory = z.infer<typeof IncidentCategorySchema>;
