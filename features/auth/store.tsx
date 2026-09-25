import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole, ElectionStatus, ResultStatus, IncidentStatus, IncidentSeverity, IncidentCategory } from '@/types';
import { createMMKVStorage } from '@/core/utils/mmkvStorage';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (user: User) => void;
  logout: () => void;
  setOnboarded: (val: boolean) => void;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isOnboarded, login, logout, setOnboarded } = useAuthStore();
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isOnboarded, login, logout, setOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  assignedLocations?: string[];
  avatarUrl?: string;
  token?: string;
  watchCandidateId?: string;
  selectedPollingUnitId?: string;
  selectedPollingUnitName?: string;
}

export interface Election {
  id: string;
  cycleId: string;
  position: string;
  electoralArea: string;
  electoralAreaType: string;
  electionDate: string;
  status: ElectionStatus;
  candidateCount: number;
}

export interface ElectionCycle {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ElectionStatus;
}

export interface CandidatePartyHistory {
  electionYear: number;
  electionName: string;
  partyAcronym: string;
  partyName: string;
  votes: number;
  percentage: number;
}

export interface Candidate {
  id: string;
  candidateNumber?: number;
  electionId: string;
  partyId: string;
  partyName: string;
  partyAcronym: string;
  partyLogoUrl?: string;
  fullName: string;
  shortName?: string;
  runningMate?: string;
  photoUrl?: string;
  status: 'ACTIVE' | 'WITHDRAWN';
  partyHistory?: CandidatePartyHistory[];
}

export interface AIProjectionResult {
  candidateId: string;
  candidateName: string;
  partyAcronym: string;
  projectedVoteShare: number;
  projectedVotes: number;
  winProbability: number;
  confidenceScore: number;
  leadingMargin: string;
  swingDelta: string;
  historicalBaselineYear: '2023' | '2019' | 'Combined';
  historicalParty: string;
  locationScope: string;
  keyInsights: string[];
  disclaimer: string;
}

export interface ResultSubmission {
  id: string;
  electionId: string;
  pollingUnitId: string;
  pollingUnitName: string;
  candidateVotes: Record<string, number>;
  candidateVotesInec: Record<string, number>;
  rejectedVotes: number;
  rejectedVotesInec: number;
  totalAccreditedVoters: number;
  totalVotesCast: number;
  status: ResultStatus;
  latitude?: number;
  longitude?: number;
  submittedAt: string;
  submittedBy: string;
}

export interface IncidentReport {
  id: string;
  electionId: string;
  pollingUnitId?: string;
  electoralArea: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  latitude?: number;
  longitude?: number;
  mediaUrls: string[];
  reportedBy: string;
  reportedAt: string;
}

export interface PollingUnit {
  id: string;
  name: string;
  code: string;
  wardId: string;
  wardName: string;
  lgaId: string;
  lgaName: string;
  stateId: string;
  stateName: string;
  latitude?: number;
  longitude?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PoliticalParty {
  id: string;
  name: string;
  acronym: string;
  code: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (user: User) => void;
  logout: () => void;
  setOnboarded: (val: boolean) => void;
  setWatchCandidate: (candidateId: string | undefined) => void;
  setSelectedPollingUnit: (id: string | undefined, name: string | undefined) => void;
  selectedPollingUnitId: string | undefined;
  selectedPollingUnitName: string | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      login: (user) => {
        if (__DEV__) console.log('[auth] login', user.email, user.role);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        if (__DEV__) console.log('[auth] logout');
        set({ user: null, isAuthenticated: false });
      },
      setOnboarded: (val) => set({ isOnboarded: val }),
      setWatchCandidate: (watchCandidateId) =>
        set((s) => ({ user: s.user ? { ...s.user, watchCandidateId } : null })),
      setSelectedPollingUnit: (selectedPollingUnitId, selectedPollingUnitName) =>
        set((s) => ({ user: s.user ? { ...s.user, selectedPollingUnitId, selectedPollingUnitName } : null })),
      // derived selectors — keep as getters for back-compat but persist will stringify their values; prefer useAuthStore(s=>s.user?.selectedPollingUnitId) in components
      get selectedPollingUnitId() { return get().user?.selectedPollingUnitId; },
      get selectedPollingUnitName() { return get().user?.selectedPollingUnitName; },
    }),
    {
      name: 'aquila-auth',
      storage: createJSONStorage(() => createMMKVStorage()),
      // skip hydration errors — treat as fresh install
      onRehydrateStorage: () => (state, error) => {
        if (error && __DEV__) console.warn('[auth] rehydrate failed', error);
        if (__DEV__) console.log('[auth] rehydrated', state?.isAuthenticated);
      },
    }
  )
);

interface ElectionsState {
  cycles: ElectionCycle[];
  elections: Election[];
  selectedCycleId: string | null;
  selectedElectionId: string | null;
  setCycles: (cycles: ElectionCycle[]) => void;
  setElections: (elections: Election[]) => void;
  setSelectedCycleId: (id: string | null) => void;
  setSelectedElectionId: (id: string | null) => void;
  addElection: (election: Election) => void;
  updateElection: (id: string, data: Partial<Election>) => void;
}

export const useElectionsStore = create<ElectionsState>()(
  persist(
    (set) => ({
      cycles: [],
      elections: [],
      selectedCycleId: null,
      selectedElectionId: null,
      setCycles: (cycles) => set({ cycles }),
      setElections: (elections) => set({ elections }),
      setSelectedCycleId: (selectedCycleId) => set({ selectedCycleId }),
      setSelectedElectionId: (selectedElectionId) => set({ selectedElectionId }),
      addElection: (election) => set((s) => ({ elections: [...s.elections, election] })),
      updateElection: (id, data) =>
        set((s) => ({
          elections: s.elections.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
    }),
    {
      name: 'aquila-elections',
      storage: createJSONStorage(() => createMMKVStorage()),
    }
  )
);

interface ResultsState {
  submissions: ResultSubmission[];
  setSubmissions: (submissions: ResultSubmission[]) => void;
  addSubmission: (submission: ResultSubmission) => void;
  updateSubmission: (id: string, data: Partial<ResultSubmission>) => void;
  removeSubmission: (id: string) => void;
}

export const useResultsStore = create<ResultsState>()(
  persist(
    (set) => ({
      submissions: [],
      setSubmissions: (submissions) => set({ submissions }),
      addSubmission: (submission) =>
        set((s) => ({ submissions: [...s.submissions, submission] })),
      updateSubmission: (id, data) =>
        set((s) => ({
          submissions: s.submissions.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      removeSubmission: (id) =>
        set((s) => ({
          submissions: s.submissions.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'aquila-results',
      storage: createJSONStorage(() => createMMKVStorage()),
    }
  )
);

interface IncidentsState {
  incidents: IncidentReport[];
  setIncidents: (incidents: IncidentReport[]) => void;
  addIncident: (incident: IncidentReport) => void;
  updateIncident: (id: string, data: Partial<IncidentReport>) => void;
}

export const useIncidentsStore = create<IncidentsState>()(
  persist(
    (set) => ({
      incidents: [],
      setIncidents: (incidents) => set({ incidents }),
      addIncident: (incident) =>
        set((s) => ({ incidents: [...s.incidents, incident] })),
      updateIncident: (id, data) =>
        set((s) => ({
          incidents: s.incidents.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),
    }),
    {
      name: 'aquila-incidents',
      storage: createJSONStorage(() => createMMKVStorage()),
    }
  )
);

interface LocationsState {
  states: Array<{ id: string; name: string; code: string }>;
  lgas: Array<{ id: string; name: string; stateId: string }>;
  wards: Array<{ id: string; name: string; lgaId: string }>;
  pollingUnits: PollingUnit[];
  selectedStateId: string | null;
  selectedLgaId: string | null;
  setStates: (states: Array<{ id: string; name: string; code: string }>) => void;
  setLgas: (lgas: Array<{ id: string; name: string; stateId: string }>) => void;
  setWards: (wards: Array<{ id: string; name: string; lgaId: string }>) => void;
  setPollingUnits: (units: PollingUnit[]) => void;
  setSelectedStateId: (id: string | null) => void;
  setSelectedLgaId: (id: string | null) => void;
}

export const useLocationsStore = create<LocationsState>()(
  persist(
    (set) => ({
      states: [],
      lgas: [],
      wards: [],
      pollingUnits: [],
      selectedStateId: null,
      selectedLgaId: null,
      setStates: (states) => set({ states }),
      setLgas: (lgas) => set({ lgas }),
      setWards: (wards) => set({ wards }),
      setPollingUnits: (units) => set({ pollingUnits: units }),
      setSelectedStateId: (selectedStateId) => set({ selectedStateId }),
      setSelectedLgaId: (selectedLgaId) => set({ selectedLgaId }),
    }),
    {
      name: 'aquila-locations',
      storage: createJSONStorage(() => createMMKVStorage()),
    }
  )
);
