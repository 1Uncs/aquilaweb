import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/features/elections/service';
import { FEATURES } from '@/constants/features';

export function useElectionCyclesQuery() {
  return useQuery({
    queryKey: ['elections', 'cycles'],
    queryFn: () => mockApi.getElectionCycles(),
  });
}

export function useElectionsQuery(opts?: { pollIntervalMs?: number }) {
  const pollInterval = opts?.pollIntervalMs ?? (FEATURES.ENABLE_LIVE_POLLING ? FEATURES.LIVE_POLL_INTERVAL_MS : undefined);
  return useQuery({
    queryKey: ['elections', 'list'],
    queryFn: () => mockApi.getElections(),
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false,
  });
}

export function useElectionDetailQuery(electionId: string) {
  return useQuery({
    queryKey: ['elections', 'detail', electionId],
    queryFn: () => mockApi.getElections().then((all) => all.find((e) => e.id === electionId)),
    enabled: !!electionId,
  });
}

export function useCandidatesQuery(electionId: string) {
  return useQuery({
    queryKey: ['elections', 'candidates', electionId],
    queryFn: () => mockApi.getCandidates(electionId),
    enabled: !!electionId,
  });
}

export function useResultsQuery(opts?: { pollIntervalMs?: number }) {
  const pollInterval = opts?.pollIntervalMs ?? (FEATURES.ENABLE_LIVE_POLLING ? FEATURES.LIVE_POLL_INTERVAL_MS : undefined);
  return useQuery({
    queryKey: ['results', 'list'],
    queryFn: () => mockApi.getResults(),
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false,
  });
}

export function useDraftsQuery() {
  return useQuery({
    queryKey: ['results', 'drafts'],
    queryFn: () => mockApi.getDrafts(),
  });
}

export function useIncidentsQuery(opts?: { pollIntervalMs?: number }) {
  const pollInterval = opts?.pollIntervalMs ?? (FEATURES.ENABLE_LIVE_POLLING ? FEATURES.LIVE_POLL_INTERVAL_MS : undefined);
  return useQuery({
    queryKey: ['incidents', 'list'],
    queryFn: () => mockApi.getIncidents(),
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false,
  });
}

export function useIncidentDetailQuery(incidentId?: string) {
  return useQuery({
    queryKey: ['incidents', 'detail', incidentId],
    queryFn: async () => {
      if (!incidentId) return null;
      const all = await mockApi.getIncidents();
      return all.find((i) => i.id === incidentId) ?? null;
    },
    enabled: !!incidentId,
  });
}

export function useStatesQuery() {
  return useQuery({
    queryKey: ['locations', 'states'],
    queryFn: mockApi.getStates,
  });
}

export function useLgasQuery(stateId?: string) {
  return useQuery({
    queryKey: ['locations', 'lgas', stateId],
    queryFn: () => mockApi.getLgas(stateId),
  });
}

export function usePollingUnitsQuery(lgaId?: string) {
  return useQuery({
    queryKey: ['locations', 'pollingUnits', lgaId],
    queryFn: () => mockApi.getPollingUnits(lgaId),
  });
}

export function usePartiesQuery() {
  return useQuery({
    queryKey: ['parties', 'list'],
    queryFn: mockApi.getParties,
  });
}

export function useWardsQuery(lgaId?: string) {
  return useQuery({
    queryKey: ['locations', 'wards', lgaId],
    queryFn: () => mockApi.getWards(lgaId),
  });
}

export function useSenatorialDistrictsQuery(stateId?: string) {
  return useQuery({
    queryKey: ['locations', 'senatorialDistricts', stateId],
    queryFn: () => mockApi.getSenatorialDistricts(stateId),
  });
}

export function useConstituenciesQuery(stateId?: string) {
  return useQuery({
    queryKey: ['locations', 'constituencies', stateId],
    queryFn: () => mockApi.getConstituencies(stateId),
  });
}

export function useAIProjectionQuery(params?: {
  candidateId?: string;
  currentData?: boolean;
  pastData?: 0 | 1 | 2;
  locationId?: string;
  locationText?: string;
}) {
  return useQuery({
    queryKey: ['elections', 'aiProjection', params?.candidateId, params?.pastData, params?.currentData, params?.locationId, params?.locationText],
    queryFn: () => mockApi.getAIProjection(params),
    staleTime: 60 * 1000,
  });
}

export function useLocationSearchQuery(query: string) {
  return useQuery({
    queryKey: ['locations', 'search', query],
    queryFn: () => mockApi.searchLocations(query),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

