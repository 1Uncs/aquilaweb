import { Election, ElectionCycle, User, PollingUnit, PoliticalParty, Candidate, ResultSubmission, IncidentReport } from '@/features/auth/store';

const NIGERIA_STATES = [
  { id: 's1', name: 'Abia', code: 'AB' },
  { id: 's2', name: 'Adamawa', code: 'AD' },
  { id: 's3', name: 'Akwa Ibom', code: 'AK' },
  { id: 's4', name: 'Anambra', code: 'AN' },
  { id: 's5', name: 'Bauchi', code: 'BA' },
  { id: 's6', name: 'Bayelsa', code: 'BY' },
  { id: 's7', name: 'Benue', code: 'BE' },
  { id: 's8', name: 'Borno', code: 'BO' },
  { id: 's9', name: 'Cross River', code: 'CR' },
  { id: 's10', name: 'Delta', code: 'DE' },
  { id: 's11', name: 'Ebonyi', code: 'EB' },
  { id: 's12', name: 'Edo', code: 'ED' },
  { id: 's13', name: 'Ekiti', code: 'EK' },
  { id: 's14', name: 'Enugu', code: 'EN' },
  { id: 's15', name: 'FCT', code: 'FC' },
  { id: 's16', name: 'Gombe', code: 'GO' },
  { id: 's17', name: 'Imo', code: 'IM' },
  { id: 's18', name: 'Jigawa', code: 'JI' },
  { id: 's19', name: 'Kaduna', code: 'KD' },
  { id: 's20', name: 'Kano', code: 'KN' },
  { id: 's21', name: 'Katsina', code: 'KT' },
  { id: 's22', name: 'Kebbi', code: 'KE' },
  { id: 's23', name: 'Kogi', code: 'KO' },
  { id: 's24', name: 'Kwara', code: 'KW' },
  { id: 's25', name: 'Lagos', code: 'LA' },
  { id: 's26', name: 'Nasarawa', code: 'NA' },
  { id: 's27', name: 'Niger', code: 'NI' },
  { id: 's28', name: 'Ogun', code: 'OG' },
  { id: 's29', name: 'Ondo', code: 'ON' },
  { id: 's30', name: 'Osun', code: 'OS' },
  { id: 's31', name: 'Oyo', code: 'OY' },
  { id: 's32', name: 'Plateau', code: 'PL' },
  { id: 's33', name: 'Rivers', code: 'RI' },
  { id: 's34', name: 'Sokoto', code: 'SO' },
  { id: 's35', name: 'Taraba', code: 'TA' },
  { id: 's36', name: 'Yobe', code: 'YO' },
  { id: 's37', name: 'Zamfara', code: 'ZA' },
];

const LGAS: Array<{ id: string; name: string; stateId: string }> = [
  ...NIGERIA_STATES.slice(0, 37).flatMap((s) =>
    Array.from({ length: 5 }, (_, i) => ({
      id: `${s.id}-lga-${i + 1}`,
      name: `${s.name} LGA ${i + 1}`,
      stateId: s.id,
    }))
  ),
];

const PARTIES: PoliticalParty[] = [
  { id: 'p1', name: 'All Progressives Congress', acronym: 'APC', code: 'APC', status: 'ACTIVE' },
  { id: 'p2', name: 'Peoples Democratic Party', acronym: 'PDP', code: 'PDP', status: 'ACTIVE' },
  { id: 'p3', name: 'Labour Party', acronym: 'LP', code: 'LP', status: 'ACTIVE' },
  { id: 'p4', name: 'New Nigeria Peoples Party', acronym: 'NNPP', code: 'NNPP', status: 'ACTIVE' },
  { id: 'p5', name: 'All Progressives Grand Alliance', acronym: 'APGA', code: 'APGA', status: 'ACTIVE' },
];

const POSITIONS = [
  { id: 'pos1', name: 'President', electoralAreaType: 'Country' },
  { id: 'pos2', name: 'Governor', electoralAreaType: 'State' },
  { id: 'pos3', name: 'Senator', electoralAreaType: 'Senatorial District' },
  { id: 'pos4', name: 'Member, House of Representatives', electoralAreaType: 'Federal Constituency' },
  { id: 'pos5', name: 'Member, State House of Assembly', electoralAreaType: 'State Constituency' },
  { id: 'pos6', name: 'Local Government Chairman', electoralAreaType: 'LGA / Area Council' },
  { id: 'pos7', name: 'Councillor', electoralAreaType: 'Ward' },
];

const POLLING_UNITS: PollingUnit[] = LGAS.slice(0, 50).flatMap((lga) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `pu-${lga.id}-${i + 1}`,
    name: `PU ${lga.name} ${i + 1}`,
    code: `PU/${lga.id.slice(-3).toUpperCase()}/${i + 1}`,
    wardId: `ward-${lga.id}`,
    wardName: `${lga.name} Ward`,
    lgaId: lga.id,
    lgaName: lga.name,
    stateId: lga.stateId,
    stateName: NIGERIA_STATES.find((s) => s.id === lga.stateId)?.name ?? '',
    latitude: 6.5 + Math.random() * 6,
    longitude: 3 + Math.random() * 7,
    status: 'ACTIVE' as const,
  }))
);

const WARDS = LGAS.slice(0, 20).flatMap((lga) =>
  Array.from({ length: 2 }, (_, i) => ({
    id: `ward-${lga.id}-${i + 1}`,
    name: `${lga.name} Ward ${i + 1}`,
    lgaId: lga.id,
    lgaName: lga.name,
    stateId: lga.stateId,
    stateName: NIGERIA_STATES.find((s) => s.id === lga.stateId)?.name ?? '',
  }))
);

const SENATORIAL_DISTRICTS = NIGERIA_STATES.slice(0, 20).flatMap((state) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `sd-${state.id}-${i + 1}`,
    name: `${state.name} Senatorial District ${i + 1}`,
    stateId: state.id,
    stateName: state.name,
  }))
);

const CONSTITUENCIES = NIGERIA_STATES.slice(0, 15).flatMap((state) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: `con-${state.id}-${i + 1}`,
    name: `${state.name} Federal Constituency ${i + 1}`,
    stateId: state.id,
    stateName: state.name,
    type: i % 2 === 0 ? 'Federal' : 'State',
  }))
);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CANDIDATES_BY_ELECTION: Record<string, Candidate[]> = {
  // e1: Nigeria Presidential (4 candidates)
  e1: [
    {
      id: 'cand1',
      candidateNumber: 1,
      electionId: 'e1',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Bola Ahmed Tinubu',
      shortName: 'Tinubu',
      runningMate: 'Kashim Shettima',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 General Election', partyAcronym: 'APC', partyName: 'All Progressives Congress', votes: 8794726, percentage: 36.6 },
        { electionYear: 2019, electionName: '2019 General Election', partyAcronym: 'APC', partyName: 'All Progressives Congress', votes: 15191847, percentage: 55.6 },
      ],
    },
    {
      id: 'cand2',
      candidateNumber: 2,
      electionId: 'e1',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Atiku Abubakar',
      shortName: 'Atiku',
      runningMate: 'Ifeanyi Okowa',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 General Election', partyAcronym: 'PDP', partyName: 'Peoples Democratic Party', votes: 6984520, percentage: 29.1 },
        { electionYear: 2019, electionName: '2019 General Election', partyAcronym: 'PDP', partyName: 'Peoples Democratic Party', votes: 11262978, percentage: 41.2 },
        { electionYear: 2015, electionName: '2015 Presidential Primary', partyAcronym: 'APC', partyName: 'All Progressives Congress', votes: 954, percentage: 12.0 },
      ],
    },
    {
      id: 'cand3',
      candidateNumber: 7,
      electionId: 'e1',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Peter Gregory Obi',
      shortName: 'Obi',
      runningMate: 'Datti Baba-Ahmed',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 General Election', partyAcronym: 'LP', partyName: 'Labour Party', votes: 6101533, percentage: 25.4 },
        { electionYear: 2019, electionName: '2019 General Election', partyAcronym: 'PDP', partyName: 'Peoples Democratic Party (VP Nominee)', votes: 11262978, percentage: 41.2 },
      ],
    },
    {
      id: 'cand4',
      candidateNumber: 4,
      electionId: 'e1',
      partyId: 'p4',
      partyName: 'New Nigeria Peoples Party',
      partyAcronym: 'NNPP',
      fullName: 'Rabiu Musa Kwankwaso',
      shortName: 'Kwankwaso',
      runningMate: 'Isaac Idahosa',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 General Election', partyAcronym: 'NNPP', partyName: 'New Nigeria Peoples Party', votes: 1496687, percentage: 6.2 },
        { electionYear: 2019, electionName: '2019 General Election', partyAcronym: 'PDP', partyName: 'Peoples Democratic Party', votes: 1250000, percentage: 4.8 },
      ],
    },
  ],

  // e2: Lagos Governorship (4 candidates)
  e2: [
    {
      id: 'cand-e2-1',
      candidateNumber: 1,
      electionId: 'e2',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Babajide Olusola Sanwo-Olu',
      shortName: 'Sanwo-Olu',
      runningMate: 'Kadri Obafemi Hamzat',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 Lagos Governorship', partyAcronym: 'APC', partyName: 'All Progressives Congress', votes: 762134, percentage: 66.2 },
        { electionYear: 2019, electionName: '2019 Lagos Governorship', partyAcronym: 'APC', partyName: 'All Progressives Congress', votes: 739445, percentage: 72.8 },
      ],
    },
    {
      id: 'cand-e2-2',
      candidateNumber: 2,
      electionId: 'e2',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Abdul-Azeez Olajide Adediran (Jandor)',
      shortName: 'Jandor',
      runningMate: 'Funke Akindele',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 Lagos Governorship', partyAcronym: 'PDP', partyName: 'Peoples Democratic Party', votes: 62449, percentage: 5.4 },
      ],
    },
    {
      id: 'cand-e2-3',
      candidateNumber: 3,
      electionId: 'e2',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Gbadebo Rhodes-Vivour (GRV)',
      shortName: 'Rhodes-Vivour',
      runningMate: 'Princess Abiodun Oyefusi',
      status: 'ACTIVE',
      partyHistory: [
        { electionYear: 2023, electionName: '2023 Lagos Governorship', partyAcronym: 'LP', partyName: 'Labour Party', votes: 312329, percentage: 27.1 },
      ],
    },
    {
      id: 'cand-e2-4',
      candidateNumber: 4,
      electionId: 'e2',
      partyId: 'p4',
      partyName: 'New Nigeria Peoples Party',
      partyAcronym: 'NNPP',
      fullName: 'Olufunso Doherty',
      shortName: 'Doherty',
      runningMate: 'Giwa Afeez',
      status: 'ACTIVE',
    },
  ],

  // e3: Senator, Lagos West (3 candidates)
  e3: [
    {
      id: 'cand-e3-1',
      candidateNumber: 1,
      electionId: 'e3',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Idiat Oluranti Adebule',
      shortName: 'Adebule',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e3-2',
      candidateNumber: 2,
      electionId: 'e3',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Segun Adewale (Aeroland)',
      shortName: 'Aeroland',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e3-3',
      candidateNumber: 3,
      electionId: 'e3',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Moshood Adegoke Salvador',
      shortName: 'Salvador',
      status: 'ACTIVE',
    },
  ],

  // e4: Member, House of Representatives - Ikeja Federal Constituency (3 candidates)
  e4: [
    {
      id: 'cand-e4-1',
      candidateNumber: 1,
      electionId: 'e4',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'James Abiodun Faleke',
      shortName: 'Faleke',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e4-2',
      candidateNumber: 2,
      electionId: 'e4',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Olakunle Okunola',
      shortName: 'Okunola',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e4-3',
      candidateNumber: 3,
      electionId: 'e4',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Mutiu Kunle Okunola',
      shortName: 'Mutiu',
      status: 'ACTIVE',
    },
  ],

  // e5: Local Government Chairman - Ikeja LGA (3 candidates)
  e5: [
    {
      id: 'cand-e5-1',
      candidateNumber: 1,
      electionId: 'e5',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Mojeed Alabi Balogun',
      shortName: 'Balogun',
      runningMate: 'Yomi Mayungbe',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e5-2',
      candidateNumber: 2,
      electionId: 'e5',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Adebayo Alao',
      shortName: 'Alao',
      runningMate: 'Titilayo Adeleke',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e5-3',
      candidateNumber: 3,
      electionId: 'e5',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Kingsley Okereke',
      shortName: 'Okereke',
      runningMate: 'Folashade Thomas',
      status: 'ACTIVE',
    },
  ],

  // e6: Governor - Edo State (3 candidates)
  e6: [
    {
      id: 'cand-e6-1',
      candidateNumber: 1,
      electionId: 'e6',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Monday Okpebholo',
      shortName: 'Okpebholo',
      runningMate: 'Dennis Idahosa',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e6-2',
      candidateNumber: 2,
      electionId: 'e6',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Asue Ighodalo',
      shortName: 'Ighodalo',
      runningMate: 'Osarodion Ogie',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e6-3',
      candidateNumber: 3,
      electionId: 'e6',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Olumide Akpata',
      shortName: 'Akpata',
      runningMate: 'Alufohai Faith',
      status: 'ACTIVE',
    },
  ],

  // e7: Senator - Edo Central (3 candidates)
  e7: [
    {
      id: 'cand-e7-1',
      candidateNumber: 1,
      electionId: 'e7',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Monday Okpebholo',
      shortName: 'Okpebholo',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e7-2',
      candidateNumber: 2,
      electionId: 'e7',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Clifford Ordia',
      shortName: 'Ordia',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e7-3',
      candidateNumber: 3,
      electionId: 'e7',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Christabel Ebare',
      shortName: 'Ebare',
      status: 'ACTIVE',
    },
  ],

  // e8: Member, State House of Assembly - Oredo East (3 candidates)
  e8: [
    {
      id: 'cand-e8-1',
      candidateNumber: 1,
      electionId: 'e8',
      partyId: 'p1',
      partyName: 'All Progressives Congress',
      partyAcronym: 'APC',
      fullName: 'Osamwonyi Atu',
      shortName: 'Atu',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e8-2',
      candidateNumber: 2,
      electionId: 'e8',
      partyId: 'p2',
      partyName: 'Peoples Democratic Party',
      partyAcronym: 'PDP',
      fullName: 'Sunny Aguebor',
      shortName: 'Aguebor',
      status: 'ACTIVE',
    },
    {
      id: 'cand-e8-3',
      candidateNumber: 3,
      electionId: 'e8',
      partyId: 'p3',
      partyName: 'Labour Party',
      partyAcronym: 'LP',
      fullName: 'Destiny Eromosele',
      shortName: 'Eromosele',
      status: 'ACTIVE',
    },
  ],
};

const ELECTIONS_SEED: Omit<Election, 'candidateCount'>[] = [
  {
    id: 'e1',
    cycleId: 'c1',
    position: 'President',
    electoralArea: 'Nigeria',
    electoralAreaType: 'Country',
    electionDate: '2027-02-25',
    status: 'SCHEDULED',
  },
  {
    id: 'e2',
    cycleId: 'c1',
    position: 'Governor',
    electoralArea: 'Lagos',
    electoralAreaType: 'State',
    electionDate: '2027-02-25',
    status: 'SCHEDULED',
  },
  {
    id: 'e3',
    cycleId: 'c1',
    position: 'Senator',
    electoralArea: 'Lagos West',
    electoralAreaType: 'Senatorial District',
    electionDate: '2027-02-25',
    status: 'SCHEDULED',
  },
  {
    id: 'e4',
    cycleId: 'c1',
    position: 'Member, House of Representatives',
    electoralArea: 'Ikeja Federal Constituency',
    electoralAreaType: 'Federal Constituency',
    electionDate: '2027-02-25',
    status: 'SCHEDULED',
  },
  {
    id: 'e5',
    cycleId: 'c1',
    position: 'Local Government Chairman',
    electoralArea: 'Ikeja LGA',
    electoralAreaType: 'LGA / Area Council',
    electionDate: '2027-03-15',
    status: 'SCHEDULED',
  },
  {
    id: 'e6',
    cycleId: 'c2',
    position: 'Governor',
    electoralArea: 'Edo State',
    electoralAreaType: 'State',
    electionDate: '2026-09-21',
    status: 'COMPLETED',
  },
  {
    id: 'e7',
    cycleId: 'c2',
    position: 'Senator',
    electoralArea: 'Edo Central',
    electoralAreaType: 'Senatorial District',
    electionDate: '2026-09-21',
    status: 'COMPLETED',
  },
  {
    id: 'e8',
    cycleId: 'c2',
    position: 'Member, State House of Assembly',
    electoralArea: 'Oredo East',
    electoralAreaType: 'State Constituency',
    electionDate: '2026-09-21',
    status: 'COMPLETED',
  },
];

export const mockApi = {
  login: async (email: string, _password: string, organizationId: string, organizationName: string): Promise<User> => {
    await delay(600);
    const lower = email.toLowerCase();
    let role: User['role'] = 'FIELD_AGENT';
    if (lower.includes('officer')) role = 'ELECTION_OFFICER';
    else if (lower.includes('polling') || lower.includes('pu_agent')) role = 'POLLING_AGENT';
    const assignedLocations = role === 'FIELD_AGENT'
      ? ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3']
      : role === 'POLLING_AGENT'
        ? ['pu-s25-lga-1-1']
        : undefined;
    return {
      id: `u-${Date.now()}`,
      email,
      name: email.split('@')[0] ?? email,
      role,
      organizationId,
      organizationName,
      assignedLocations,
      token: `mock-token-${email}-${Date.now()}`,
    };
  },

  getElectionCycles: async (): Promise<ElectionCycle[]> => {
    await delay(400);
    return [
      {
        id: 'c1',
        name: '2027 General Election',
        description: 'Nigeria General Elections 2027',
        startDate: '2027-02-25',
        endDate: '2027-03-15',
        status: 'SCHEDULED',
      },
      {
        id: 'c2',
        name: '2026 Governorship - Edo',
        description: 'Edo State Governorship Election 2026',
        startDate: '2026-09-21',
        endDate: '2026-09-22',
        status: 'COMPLETED',
      },
    ];
  },
  getElections: async (_cycleId?: string): Promise<Election[]> => {
    await delay(500);
    return ELECTIONS_SEED.map((e) => ({
      ...e,
      candidateCount: (CANDIDATES_BY_ELECTION[e.id] ?? CANDIDATES_BY_ELECTION.e1 ?? []).length,
    }));
  },

  getCandidates: async (electionId: string): Promise<Candidate[]> => {
    await delay(350);
    return CANDIDATES_BY_ELECTION[electionId] ?? CANDIDATES_BY_ELECTION.e1 ?? [];
  },

  getResults: async (electionId?: string): Promise<ResultSubmission[]> => {
    await delay(500);
    const bases: ResultSubmission[] = [
      {
        id: 'r1',
        electionId: 'e1',
        pollingUnitId: 'pu-s25-lga-1-1',
        pollingUnitName: 'PU Ikeja LGA 1',
        candidateVotes: { cand1: 234, cand2: 189, cand3: 98, cand4: 45 },
        candidateVotesInec: { cand1: 230, cand2: 190, cand3: 100, cand4: 44 },
        rejectedVotes: 12,
        rejectedVotesInec: 10,
        totalAccreditedVoters: 600,
        totalVotesCast: 578,
        status: 'PUBLISHED',
        latitude: 6.6,
        longitude: 3.35,
        submittedAt: '2027-02-25T14:30:00Z',
        submittedBy: 'u2',
      },
      {
        id: 'r2',
        electionId: 'e1',
        pollingUnitId: 'pu-s25-lga-1-2',
        pollingUnitName: 'PU Ikeja LGA 2',
        candidateVotes: { cand1: 312, cand2: 256, cand3: 120, cand4: 67 },
        candidateVotesInec: { cand1: 310, cand2: 255, cand3: 122, cand4: 68 },
        rejectedVotes: 8,
        rejectedVotesInec: 7,
        totalAccreditedVoters: 780,
        totalVotesCast: 763,
        status: 'PUBLISHED',
        latitude: 6.62,
        longitude: 3.38,
        submittedAt: '2027-02-25T14:45:00Z',
        submittedBy: 'u3',
      },
      {
        id: 'r3',
        electionId: 'e1',
        pollingUnitId: 'pu-s25-lga-2-1',
        pollingUnitName: 'PU Lagos Mainland 1',
        candidateVotes: { cand1: 189, cand2: 345, cand3: 56, cand4: 23 },
        candidateVotesInec: { cand1: 188, cand2: 346, cand3: 57, cand4: 22 },
        rejectedVotes: 5,
        rejectedVotesInec: 5,
        totalAccreditedVoters: 650,
        totalVotesCast: 613,
        status: 'PUBLISHED',
        latitude: 6.5,
        longitude: 3.4,
        submittedAt: '2027-02-25T15:00:00Z',
        submittedBy: 'u2',
      },
    ];
    if (electionId) return bases.filter((r) => r.electionId === electionId);
    return bases;
  },

  getDrafts: async (): Promise<ResultSubmission[]> => {
    await delay(400);
    return [];
  },

  getIncidents: async (electionId?: string): Promise<IncidentReport[]> => {
    await delay(400);
    const incidents: IncidentReport[] = [
      {
        id: 'i1',
        electionId: 'e1',
        pollingUnitId: 'pu-s25-lga-1-1',
        electoralArea: 'Ikeja LGA',
        category: 'VOTE_BUYING',
        severity: 'MEDIUM',
        status: 'UNDER_REVIEW',
        description: 'Suspected vote buying observed near the PU entrance',
        latitude: 6.6,
        longitude: 3.35,
        mediaUrls: [
          'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1000',
          'evidence-recording-001.m4a',
        ],
        reportedBy: 'u2',
        reportedAt: '2027-02-25T12:15:00Z',
      },
      {
        id: 'i2',
        electionId: 'e1',
        electoralArea: 'Lagos Mainland',
        category: 'BVAS_FAILURE',
        severity: 'HIGH',
        status: 'RESOLVED',
        description: 'BVAS device malfunction at 2 polling units',
        mediaUrls: [],
        reportedBy: 'u3',
        reportedAt: '2027-02-25T10:30:00Z',
      },
    ];
    if (electionId) return incidents.filter((i) => i.electionId === electionId);
    return incidents;
  },

  getStates: async () => {
    await delay(300);
    return NIGERIA_STATES;
  },

  getLgas: async (stateId?: string) => {
    await delay(300);
    const filtered = stateId ? LGAS.filter((l) => l.stateId === stateId) : LGAS;
    return filtered.slice(0, 20);
  },

  getPollingUnits: async (lgaId?: string) => {
    await delay(300);
    const filtered = lgaId ? POLLING_UNITS.filter((p) => p.lgaId === lgaId) : POLLING_UNITS;
    return filtered.slice(0, 15);
  },

  getParties: async (): Promise<PoliticalParty[]> => {
    await delay(300);
    return PARTIES;
  },

  getPositions: async () => {
    await delay(300);
    return POSITIONS;
  },

  getWards: async (lgaId?: string) => {
    await delay(300);
    const filtered = lgaId ? WARDS.filter((w) => w.lgaId === lgaId) : WARDS;
    return filtered.slice(0, 20);
  },

  getSenatorialDistricts: async (stateId?: string) => {
    await delay(300);
    const filtered = stateId ? SENATORIAL_DISTRICTS.filter((d) => d.stateId === stateId) : SENATORIAL_DISTRICTS;
    return filtered.slice(0, 10);
  },

  getConstituencies: async (stateId?: string) => {
    await delay(300);
    const filtered = stateId ? CONSTITUENCIES.filter((c) => c.stateId === stateId) : CONSTITUENCIES;
    return filtered.slice(0, 10);
  },

  getAIProjection: async (params?: {
    candidateId?: string;
    currentData?: boolean;
    pastData?: 0 | 1 | 2;
    locationId?: string;
    locationText?: string;
  }): Promise<import('@/features/auth/store').AIProjectionResult> => {
    await delay(300);
    const candidateId = params?.candidateId ?? 'cand1';
    const pastData = params?.pastData ?? 0;
    const locationName = params?.locationText?.trim() || 'National (All 36 States + FCT)';

    const pastLabelMap: Record<0 | 1 | 2, string> = {
      0: '2023 General Election Baseline',
      1: '2019 General Election Baseline',
      2: 'Combined 2019 + 2023 Historical Baseline',
    };

    const pastDataLabel = pastLabelMap[pastData];

    const profiles: Record<string, {
      name: string;
      party: string;
      baseWinProb: number;
      baseVoteShare: number;
      totalVotes: number;
      margin: string;
      swing: string;
      insight: string;
      histParty: string;
    }> = {
      cand1: {
        name: 'Bola Ahmed Tinubu',
        party: 'APC',
        baseWinProb: pastData === 1 ? 52.4 : pastData === 2 ? 61.8 : 64.7,
        baseVoteShare: pastData === 1 ? 42.1 : pastData === 2 ? 40.5 : 44.2,
        totalVotes: 9840300,
        margin: '+1,480,200 votes ahead',
        swing: '+3.8% in South-West corridor',
        insight: `Aquila Neural Model projects a strong incumbency retention corridor across the South-West and North-West axis based on ${pastDataLabel}. Polling Unit collation shows steady turnout resilience in commercial urban centres.`,
        histParty: 'APC',
      },
      cand2: {
        name: 'Atiku Abubakar',
        party: 'PDP',
        baseWinProb: pastData === 1 ? 48.6 : pastData === 2 ? 38.2 : 31.5,
        baseVoteShare: pastData === 1 ? 39.8 : pastData === 2 ? 33.4 : 29.8,
        totalVotes: 6640100,
        margin: '-1,720,000 votes behind',
        swing: '-4.2% across North-Central',
        insight: `Analysis reveals vote fragmentation in traditional North-East strongholds combined with split opposition ballot shares in South-South wards under ${pastDataLabel}.`,
        histParty: pastData === 1 ? 'PDP' : 'PDP (Ex-APC 2015)',
      },
      cand3: {
        name: 'Peter Gregory Obi',
        party: 'LP',
        baseWinProb: pastData === 1 ? 22.0 : pastData === 2 ? 46.5 : 51.2,
        baseVoteShare: pastData === 1 ? 18.4 : pastData === 2 ? 31.8 : 34.6,
        totalVotes: 7720900,
        margin: '+380,000 votes in high-density PUs',
        swing: '+12.4% urban momentum',
        insight: `Simulations indicate exponential youth-voter surges and massive gains in South-East, South-South, and urban FCT/Lagos polling units when cross-referenced against ${pastDataLabel}. Note: Historical 2019 baseline mapped via PDP VP candidacy.`,
        histParty: pastData === 1 ? 'PDP (VP Candidate)' : 'LP (Ex-PDP)',
      },
      cand4: {
        name: 'Rabiu Musa Kwankwaso',
        party: 'NNPP',
        baseWinProb: pastData === 1 ? 8.5 : pastData === 2 ? 11.2 : 14.8,
        baseVoteShare: pastData === 1 ? 6.0 : pastData === 2 ? 7.8 : 9.4,
        totalVotes: 2100400,
        margin: 'Regional concentration (Kano & Jigawa)',
        swing: '+1.5% localized growth',
        insight: `Concentrated territorial density in Kano metropolitan corridor. High single-state margin with limited cross-zonal conversion under ${pastDataLabel}.`,
        histParty: pastData === 1 ? 'PDP' : 'NNPP (Ex-PDP)',
      },
    };

    const target = profiles[candidateId] ?? profiles.cand1!;

    return {
      candidateId,
      candidateName: target.name,
      partyAcronym: target.party,
      projectedVoteShare: target.baseVoteShare,
      projectedVotes: target.totalVotes,
      winProbability: target.baseWinProb,
      confidenceScore: 91.4,
      leadingMargin: target.margin,
      swingDelta: target.swing,
      historicalBaselineYear: pastData === 0 ? '2023' : pastData === 1 ? '2019' : 'Combined',
      historicalParty: target.histParty,
      locationScope: locationName,
      keyInsights: [
        target.insight,
        `Collation rate weighting applied across ${locationName} with 99.4% precinct integrity threshold.`,
      ],
      disclaimer: 'This projection is based on available data and AI simulation. It may not be 100% accurate.',
    };
  },

  searchLocations: async (query: string): Promise<Array<{
    id: string;
    name: string;
    type: 'PU' | 'WARD' | 'LGA' | 'SENATORIAL' | 'STATE';
    qualification: string;
  }>> => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    await delay(150);

    const results: Array<{
      id: string;
      name: string;
      type: 'PU' | 'WARD' | 'LGA' | 'SENATORIAL' | 'STATE';
      qualification: string;
    }> = [];

    // Search Polling Units
    POLLING_UNITS.forEach((pu) => {
      if (pu.name.toLowerCase().includes(q) || pu.code.toLowerCase().includes(q) || pu.lgaName.toLowerCase().includes(q)) {
        results.push({
          id: pu.id,
          name: `${pu.name} (${pu.code})`,
          type: 'PU',
          qualification: `${pu.lgaName}, ${pu.stateName} State`,
        });
      }
    });

    // Search Wards
    WARDS.forEach((w) => {
      if (w.name.toLowerCase().includes(q) || w.lgaName.toLowerCase().includes(q)) {
        results.push({
          id: w.id,
          name: w.name,
          type: 'WARD',
          qualification: `${w.lgaName}, ${w.stateName} State`,
        });
      }
    });

    // Search LGAs
    LGAS.forEach((l) => {
      if (l.name.toLowerCase().includes(q)) {
        const stateName = NIGERIA_STATES.find((s) => s.id === l.stateId)?.name ?? 'State';
        results.push({
          id: l.id,
          name: l.name,
          type: 'LGA',
          qualification: `${stateName} State`,
        });
      }
    });

    // Search Senatorial Districts
    SENATORIAL_DISTRICTS.forEach((sd) => {
      if (sd.name.toLowerCase().includes(q)) {
        results.push({
          id: sd.id,
          name: sd.name,
          type: 'SENATORIAL',
          qualification: `${sd.stateName} State`,
        });
      }
    });

    // Search States
    NIGERIA_STATES.forEach((s) => {
      if (s.name.toLowerCase().includes(q)) {
        results.push({
          id: s.id,
          name: `${s.name} State`,
          type: 'STATE',
          qualification: 'Federal Republic of Nigeria',
        });
      }
    });

    return results.slice(0, 25);
  },
};
