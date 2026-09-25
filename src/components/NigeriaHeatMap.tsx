import React, { useState, useMemo } from 'react';
import {
  MapPin,
  AlertTriangle,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store';
import { NIGERIA_STATES } from '../data/mockData';

export type HeatMapMode = 'LEAD' | 'TURNOUT' | 'COLLATION' | 'INCIDENTS';
export type GeoZone = 'ALL' | 'NC' | 'NE' | 'NW' | 'SE' | 'SS' | 'SW';

interface StateHeatData {
  id: string;
  name: string;
  code: string;
  zone: GeoZone;
  zoneName: string;
  totalPus: number;
  reportedPus: number;
  turnoutPct: number;
  leadingParty: 'APC' | 'PDP' | 'LP' | 'NNPP';
  leadingCandidate: string;
  leadMargin: number;
  totalVotes: number;
  incidentsCount: number;
  criticalIncidents: number;
  // SVG centroid for visual positioning
  x: number;
  y: number;
}

const STATE_GEO_METRICS: Record<
  string,
  {
    zone: GeoZone;
    zoneName: string;
    totalPus: number;
    reportedPus: number;
    turnoutPct: number;
    leadingParty: 'APC' | 'PDP' | 'LP' | 'NNPP';
    leadingCandidate: string;
    leadMargin: number;
    totalVotes: number;
    incidentsCount: number;
    criticalIncidents: number;
    x: number;
    y: number;
  }
> = {
  s1: { zone: 'SE', zoneName: 'South East', totalPus: 4062, reportedPus: 3410, turnoutPct: 41.2, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 68.4, totalVotes: 382400, incidentsCount: 4, criticalIncidents: 1, x: 550, y: 560 },
  s2: { zone: 'NE', zoneName: 'North East', totalPus: 4104, reportedPus: 3200, turnoutPct: 37.8, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 54.1, totalVotes: 441000, incidentsCount: 6, criticalIncidents: 2, x: 740, y: 320 },
  s3: { zone: 'SS', zoneName: 'South South', totalPus: 4349, reportedPus: 3820, turnoutPct: 44.5, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 49.3, totalVotes: 512000, incidentsCount: 5, criticalIncidents: 1, x: 540, y: 620 },
  s4: { zone: 'SE', zoneName: 'South East', totalPus: 5720, reportedPus: 4980, turnoutPct: 46.8, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 82.5, totalVotes: 620400, incidentsCount: 7, criticalIncidents: 2, x: 500, y: 530 },
  s5: { zone: 'NE', zoneName: 'North East', totalPus: 5423, reportedPus: 4110, turnoutPct: 39.2, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 48.0, totalVotes: 590000, incidentsCount: 3, criticalIncidents: 0, x: 670, y: 250 },
  s6: { zone: 'SS', zoneName: 'South South', totalPus: 2244, reportedPus: 1910, turnoutPct: 38.6, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 51.2, totalVotes: 215000, incidentsCount: 8, criticalIncidents: 3, x: 440, y: 620 },
  s7: { zone: 'NC', zoneName: 'North Central', totalPus: 5102, reportedPus: 4210, turnoutPct: 42.1, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 43.8, totalVotes: 510000, incidentsCount: 6, criticalIncidents: 2, x: 560, y: 410 },
  s8: { zone: 'NE', zoneName: 'North East', totalPus: 5071, reportedPus: 4190, turnoutPct: 36.4, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 61.5, totalVotes: 610000, incidentsCount: 9, criticalIncidents: 4, x: 790, y: 160 },
  s9: { zone: 'SS', zoneName: 'South South', totalPus: 3281, reportedPus: 2790, turnoutPct: 40.7, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 46.2, totalVotes: 340000, incidentsCount: 3, criticalIncidents: 1, x: 610, y: 560 },
  s10: { zone: 'SS', zoneName: 'South South', totalPus: 5863, reportedPus: 5120, turnoutPct: 45.3, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 53.4, totalVotes: 680000, incidentsCount: 7, criticalIncidents: 2, x: 450, y: 550 },
  s11: { zone: 'SE', zoneName: 'South East', totalPus: 2949, reportedPus: 2510, turnoutPct: 39.8, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 67.9, totalVotes: 290000, incidentsCount: 4, criticalIncidents: 1, x: 570, y: 500 },
  s12: { zone: 'SS', zoneName: 'South South', totalPus: 4519, reportedPus: 3990, turnoutPct: 43.6, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 52.8, totalVotes: 495000, incidentsCount: 8, criticalIncidents: 3, x: 410, y: 490 },
  s13: { zone: 'SW', zoneName: 'South West', totalPus: 2445, reportedPus: 2310, turnoutPct: 48.2, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 65.4, totalVotes: 310000, incidentsCount: 2, criticalIncidents: 0, x: 360, y: 430 },
  s14: { zone: 'SE', zoneName: 'South East', totalPus: 4145, reportedPus: 3780, turnoutPct: 47.9, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 84.2, totalVotes: 480000, incidentsCount: 5, criticalIncidents: 1, x: 530, y: 490 },
  s15: { zone: 'NC', zoneName: 'Federal Capital Territory', totalPus: 2822, reportedPus: 2690, turnoutPct: 53.4, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 59.8, totalVotes: 470000, incidentsCount: 6, criticalIncidents: 1, x: 450, y: 350 },
  s16: { zone: 'NE', zoneName: 'North East', totalPus: 2988, reportedPus: 2450, turnoutPct: 38.9, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 47.3, totalVotes: 360000, incidentsCount: 4, criticalIncidents: 1, x: 710, y: 240 },
  s17: { zone: 'SE', zoneName: 'South East', totalPus: 4758, reportedPus: 3920, turnoutPct: 39.4, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 74.5, totalVotes: 430000, incidentsCount: 9, criticalIncidents: 3, x: 500, y: 570 },
  s18: { zone: 'NW', zoneName: 'North West', totalPus: 4522, reportedPus: 3890, turnoutPct: 41.5, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 55.7, totalVotes: 640000, incidentsCount: 3, criticalIncidents: 0, x: 560, y: 130 },
  s19: { zone: 'NW', zoneName: 'North West', totalPus: 8012, reportedPus: 6940, turnoutPct: 46.1, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 49.8, totalVotes: 1120000, incidentsCount: 8, criticalIncidents: 2, x: 460, y: 240 },
  s20: { zone: 'NW', zoneName: 'North West', totalPus: 11222, reportedPus: 9850, turnoutPct: 47.8, leadingParty: 'NNPP', leadingCandidate: 'Rabiu Kwankwaso', leadMargin: 58.6, totalVotes: 1780000, incidentsCount: 11, criticalIncidents: 3, x: 520, y: 170 },
  s21: { zone: 'NW', zoneName: 'North West', totalPus: 6652, reportedPus: 5810, turnoutPct: 43.7, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 50.2, totalVotes: 890000, incidentsCount: 5, criticalIncidents: 1, x: 450, y: 130 },
  s22: { zone: 'NW', zoneName: 'North West', totalPus: 3745, reportedPus: 3120, turnoutPct: 39.0, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 52.4, totalVotes: 470000, incidentsCount: 3, criticalIncidents: 0, x: 290, y: 160 },
  s23: { zone: 'NC', zoneName: 'North Central', totalPus: 3508, reportedPus: 3080, turnoutPct: 42.6, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 51.6, totalVotes: 440000, incidentsCount: 7, criticalIncidents: 2, x: 450, y: 440 },
  s24: { zone: 'NC', zoneName: 'North Central', totalPus: 2887, reportedPus: 2540, turnoutPct: 40.5, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 56.1, totalVotes: 360000, incidentsCount: 3, criticalIncidents: 0, x: 320, y: 360 },
  s25: { zone: 'SW', zoneName: 'South West', totalPus: 13325, reportedPus: 11840, turnoutPct: 52.1, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 53.2, totalVotes: 1890000, incidentsCount: 12, criticalIncidents: 4, x: 260, y: 520 },
  s26: { zone: 'NC', zoneName: 'North Central', totalPus: 3256, reportedPus: 2790, turnoutPct: 41.0, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 48.2, totalVotes: 365000, incidentsCount: 4, criticalIncidents: 1, x: 510, y: 360 },
  s27: { zone: 'NC', zoneName: 'North Central', totalPus: 4950, reportedPus: 4180, turnoutPct: 38.3, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 58.0, totalVotes: 590000, incidentsCount: 6, criticalIncidents: 2, x: 330, y: 270 },
  s28: { zone: 'SW', zoneName: 'South West', totalPus: 5042, reportedPus: 4560, turnoutPct: 46.4, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 63.8, totalVotes: 670000, incidentsCount: 4, criticalIncidents: 1, x: 280, y: 480 },
  s29: { zone: 'SW', zoneName: 'South West', totalPus: 3933, reportedPus: 3610, turnoutPct: 47.5, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 67.2, totalVotes: 540000, incidentsCount: 3, criticalIncidents: 0, x: 350, y: 480 },
  s30: { zone: 'SW', zoneName: 'South West', totalPus: 3763, reportedPus: 3490, turnoutPct: 50.8, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 50.9, totalVotes: 520000, incidentsCount: 5, criticalIncidents: 1, x: 320, y: 440 },
  s31: { zone: 'SW', zoneName: 'South West', totalPus: 6390, reportedPus: 5820, turnoutPct: 48.9, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 60.1, totalVotes: 870000, incidentsCount: 5, criticalIncidents: 1, x: 260, y: 420 },
  s32: { zone: 'NC', zoneName: 'North Central', totalPus: 4989, reportedPus: 4230, turnoutPct: 45.7, leadingParty: 'LP', leadingCandidate: 'Peter Obi', leadMargin: 52.3, totalVotes: 610000, incidentsCount: 8, criticalIncidents: 3, x: 580, y: 330 },
  s33: { zone: 'SS', zoneName: 'South South', totalPus: 6866, reportedPus: 5990, turnoutPct: 46.2, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 49.5, totalVotes: 860000, incidentsCount: 14, criticalIncidents: 5, x: 480, y: 610 },
  s34: { zone: 'NW', zoneName: 'North West', totalPus: 3991, reportedPus: 3380, turnoutPct: 40.1, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 51.4, totalVotes: 530000, incidentsCount: 4, criticalIncidents: 1, x: 300, y: 100 },
  s35: { zone: 'NE', zoneName: 'North East', totalPus: 3580, reportedPus: 2890, turnoutPct: 37.5, leadingParty: 'PDP', leadingCandidate: 'Atiku Abubakar', leadMargin: 53.8, totalVotes: 390000, incidentsCount: 6, criticalIncidents: 2, x: 670, y: 390 },
  s36: { zone: 'NE', zoneName: 'North East', totalPus: 2823, reportedPus: 2310, turnoutPct: 35.8, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 59.4, totalVotes: 380000, incidentsCount: 4, criticalIncidents: 1, x: 680, y: 150 },
  s37: { zone: 'NW', zoneName: 'North West', totalPus: 3529, reportedPus: 2980, turnoutPct: 38.6, leadingParty: 'APC', leadingCandidate: 'Bola Tinubu', leadMargin: 54.0, totalVotes: 460000, incidentsCount: 8, criticalIncidents: 3, x: 380, y: 150 },
};

const ZONE_LABELS: Record<GeoZone, string> = {
  ALL: 'All 36 States + FCT',
  NW: 'North West (7)',
  NE: 'North East (6)',
  NC: 'North Central (6+FCT)',
  SW: 'South West (6)',
  SE: 'South East (5)',
  SS: 'South South (6)',
};

const PARTY_THEME: Record<
  'APC' | 'PDP' | 'LP' | 'NNPP',
  { color: string; bg: string; border: string; name: string }
> = {
  APC: { color: '#10B981', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', name: 'All Progressives Congress' },
  PDP: { color: '#EF4444', bg: 'bg-red-500/20', border: 'border-red-500/40', name: 'Peoples Democratic Party' },
  LP: { color: '#F59E0B', bg: 'bg-amber-500/20', border: 'border-amber-500/40', name: 'Labour Party' },
  NNPP: { color: '#3B82F6', bg: 'bg-blue-500/20', border: 'border-blue-500/40', name: 'New Nigeria Peoples Party' },
};

export const NigeriaHeatMap: React.FC = () => {
  const { incidents, setActiveTab, setSelectedStateFilter } = useAppStore();

  const [mode, setMode] = useState<HeatMapMode>('LEAD');
  const [selectedZone, setSelectedZone] = useState<GeoZone>('ALL');
  const [selectedStateId, setSelectedStateId] = useState<string>('s25'); // Default Lagos
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Merge dynamic incidents and state data
  const stateDataList: StateHeatData[] = useMemo(() => {
    return NIGERIA_STATES.map((st) => {
      const geo = STATE_GEO_METRICS[st.id] ?? {
        zone: 'NC' as GeoZone,
        zoneName: 'North Central',
        totalPus: 3000,
        reportedPus: 2400,
        turnoutPct: 40.0,
        leadingParty: 'APC' as const,
        leadingCandidate: 'Bola Tinubu',
        leadMargin: 50.0,
        totalVotes: 400000,
        incidentsCount: 2,
        criticalIncidents: 0,
        x: 450,
        y: 350,
      };

      // Count live incidents in this state
      const liveIncidents = incidents.filter((i) =>
        i.electoralArea.toLowerCase().includes(st.name.toLowerCase())
      );
      const critCount = liveIncidents.filter((i) => i.severity === 'CRITICAL').length;

      return {
        id: st.id,
        name: st.name,
        code: st.code,
        zone: geo.zone,
        zoneName: geo.zoneName,
        totalPus: geo.totalPus,
        reportedPus: geo.reportedPus,
        turnoutPct: geo.turnoutPct,
        leadingParty: geo.leadingParty,
        leadingCandidate: geo.leadingCandidate,
        leadMargin: geo.leadMargin,
        totalVotes: geo.totalVotes,
        incidentsCount: Math.max(geo.incidentsCount, liveIncidents.length),
        criticalIncidents: Math.max(geo.criticalIncidents, critCount),
        x: geo.x,
        y: geo.y,
      };
    });
  }, [incidents]);

  const filteredStates = useMemo(() => {
    return stateDataList.filter((st) => {
      const matchesZone = selectedZone === 'ALL' || st.zone === selectedZone;
      const matchesSearch =
        !searchQuery ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesZone && matchesSearch;
    });
  }, [stateDataList, selectedZone, searchQuery]);

  const activeState = useMemo(() => {
    const targetId = hoveredStateId || selectedStateId;
    return stateDataList.find((s) => s.id === targetId) || stateDataList[0];
  }, [stateDataList, hoveredStateId, selectedStateId]);

  // Color helper based on selected heat map mode
  const getStateColor = (st: StateHeatData, isSelected: boolean) => {
    if (mode === 'LEAD') {
      const party = PARTY_THEME[st.leadingParty];
      return party.color;
    }
    if (mode === 'TURNOUT') {
      // 35% -> 55%
      const intensity = Math.min(Math.max((st.turnoutPct - 35) / 20, 0.2), 1);
      return `rgba(16, 185, 129, ${intensity})`;
    }
    if (mode === 'COLLATION') {
      const ratio = st.reportedPus / st.totalPus;
      return `rgba(59, 130, 246, ${Math.min(Math.max(ratio, 0.3), 1)})`;
    }
    if (mode === 'INCIDENTS') {
      if (st.criticalIncidents > 2) return '#EF4444'; // Red
      if (st.incidentsCount > 5) return '#F97316'; // Orange
      if (st.incidentsCount > 2) return '#FBBF24'; // Amber
      return '#34D399'; // Emerald low
    }
    return isSelected ? '#10B981' : '#1C2E24';
  };

  // National Summary Totals
  const nationalSummary = useMemo(() => {
    const totalPus = stateDataList.reduce((acc, s) => acc + s.totalPus, 0);
    const reportedPus = stateDataList.reduce((acc, s) => acc + s.reportedPus, 0);
    const totalVotes = stateDataList.reduce((acc, s) => acc + s.totalVotes, 0);
    const totalIncidents = stateDataList.reduce((acc, s) => acc + s.incidentsCount, 0);
    const partyWins = stateDataList.reduce(
      (acc, s) => {
        acc[s.leadingParty] = (acc[s.leadingParty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalPus,
      reportedPus,
      reportingProgress: ((reportedPus / totalPus) * 100).toFixed(1),
      totalVotes,
      totalIncidents,
      partyWins,
    };
  }, [stateDataList]);

  return (
    <div className="rounded-3xl border border-[#1C2E24] bg-[#0E1712] p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Header & Mode Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1A2C21] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                NIGERIA GEOGRAPHIC HEAT MAP
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/30">
                  Live Collation
                </span>
              </h2>
              <p className="text-xs text-[#718579]">
                Real-time sub-national collation, turnout density &amp; security incident heat map across 36 States + FCT
              </p>
            </div>
          </div>
        </div>

        {/* Heat Map Mode Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#080E0A] border border-[#1C2E24]">
          {[
            { id: 'LEAD' as const, label: 'Candidate Lead', icon: Sparkles },
            { id: 'TURNOUT' as const, label: 'Voter Turnout', icon: Users },
            { id: 'COLLATION' as const, label: 'Collation %', icon: CheckCircle2 },
            { id: 'INCIDENTS' as const, label: 'Incident Hotspots', icon: AlertTriangle },
          ].map((item) => {
            const active = mode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-[#10B981] text-black shadow-md shadow-emerald-950/50'
                    : 'text-[#718579] hover:text-white hover:bg-[#121F18]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Geopolitical Zone Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#718579] shrink-0 mr-1">
          Zone Filter:
        </span>
        {(Object.keys(ZONE_LABELS) as GeoZone[]).map((zone) => {
          const active = selectedZone === zone;
          return (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`shrink-0 px-2.5 py-1 rounded-lg border font-semibold transition ${
                active
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm'
                  : 'bg-[#080E0A] text-[#718579] border-[#1C2E24] hover:text-white hover:border-[#2A4435]'
              }`}
            >
              {ZONE_LABELS[zone]}
            </button>
          );
        })}
      </div>

      {/* Main Map + Detailed State Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Interactive Map (7 Cols) */}
        <div className="lg:col-span-7 bg-[#080E0A] rounded-2xl border border-[#1C2E24] p-4 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          {/* Map Legend Overlay */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#14231B] text-[11px]">
            {mode === 'LEAD' && (
              <div className="flex items-center gap-3">
                <span className="text-[#718579] font-bold">Leading:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> APC ({nationalSummary.partyWins['APC'] ?? 0})
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> LP ({nationalSummary.partyWins['LP'] ?? 0})
                </span>
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> PDP ({nationalSummary.partyWins['PDP'] ?? 0})
                </span>
                <span className="flex items-center gap-1 text-blue-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> NNPP ({nationalSummary.partyWins['NNPP'] ?? 0})
                </span>
              </div>
            )}
            {mode === 'TURNOUT' && (
              <div className="flex items-center gap-2">
                <span className="text-[#718579]">Turnout Density:</span>
                <span className="text-emerald-300">35%</span>
                <div className="w-20 h-2 rounded bg-gradient-to-r from-emerald-950 via-emerald-600 to-emerald-400" />
                <span className="text-emerald-400 font-bold">55%+</span>
              </div>
            )}
            {mode === 'COLLATION' && (
              <div className="flex items-center gap-2">
                <span className="text-[#718579]">Collation Coverage:</span>
                <span className="text-blue-300">0%</span>
                <div className="w-20 h-2 rounded bg-gradient-to-r from-blue-950 via-blue-600 to-blue-400" />
                <span className="text-blue-400 font-bold">100%</span>
              </div>
            )}
            {mode === 'INCIDENTS' && (
              <div className="flex items-center gap-3">
                <span className="text-[#718579] font-bold">Risk Level:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" /> Low
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" /> Moderate
                </span>
                <span className="flex items-center gap-1 text-orange-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" /> High
                </span>
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Critical
                </span>
              </div>
            )}
          </div>

          {/* Interactive Responsive SVG Grid of Nigeria States */}
          <div className="relative w-full aspect-[4/3] flex items-center justify-center">
            <svg
              viewBox="0 0 900 700"
              className="w-full h-full drop-shadow-2xl select-none"
            >
              {/* Sovereign Territory Background Silhouette */}
              <path
                d="M 220 80 Q 400 40 600 60 Q 820 90 850 200 Q 880 340 760 480 Q 660 660 520 660 Q 380 660 260 560 Q 180 460 200 240 Z"
                fill="#0A150E"
                stroke="#1A3324"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* State Interactive Nodes / Centroids */}
              {stateDataList.map((st) => {
                const isSelected = selectedStateId === st.id;
                const isHovered = hoveredStateId === st.id;
                const stateColor = getStateColor(st, isSelected);
                const isInSelectedZone = selectedZone === 'ALL' || st.zone === selectedZone;

                return (
                  <g
                    key={st.id}
                    onClick={() => setSelectedStateId(st.id)}
                    onMouseEnter={() => setHoveredStateId(st.id)}
                    onMouseLeave={() => setHoveredStateId(null)}
                    className="cursor-pointer transition-all duration-200"
                    style={{ opacity: isInSelectedZone ? 1 : 0.25 }}
                  >
                    {/* State Radius Area Bubble */}
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={isSelected || isHovered ? 28 : 22}
                      fill={stateColor}
                      fillOpacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.55}
                      stroke={isSelected ? '#FFFFFF' : isHovered ? '#34D399' : '#070C09'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-300"
                    />

                    {/* State Acronym / Code Label */}
                    <text
                      x={st.x}
                      y={st.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={isSelected || isHovered ? '13' : '11'}
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-md font-mono"
                    >
                      {st.code}
                    </text>

                    {/* Incident Pulse Indicator for Critical States */}
                    {st.criticalIncidents > 0 && (
                      <circle
                        cx={st.x + 14}
                        cy={st.y - 14}
                        r="6"
                        fill="#EF4444"
                        className="animate-pulse"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Stats Ticker below Map */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#14231B] text-center">
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Reporting PUs</p>
              <p className="text-xs font-black text-white">
                {nationalSummary.reportedPus.toLocaleString()} / {nationalSummary.totalPus.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Collation Progress</p>
              <p className="text-xs font-black text-emerald-400">{nationalSummary.reportingProgress}%</p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Total Votes Cast</p>
              <p className="text-xs font-black text-white">{nationalSummary.totalVotes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#718579] uppercase font-bold">Security Flags</p>
              <p className="text-xs font-black text-red-400">{nationalSummary.totalIncidents} Logged</p>
            </div>
          </div>
        </div>

        {/* Selected State Dossier & Leaderboard (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active State Deep-Dive Card */}
          {activeState && (
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-[#0F261A] to-[#0A160F] p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white tracking-wide">{activeState.name} State</h3>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-xs">
                      {activeState.code}
                    </span>
                  </div>
                  <p className="text-xs text-[#718579] font-medium">
                    {activeState.zoneName} Zone · {activeState.totalPus.toLocaleString()} Registered Polling Units
                  </p>
                </div>

                {/* Leading Party Badge */}
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    PARTY_THEME[activeState.leadingParty].bg
                  } ${PARTY_THEME[activeState.leadingParty].border}`}
                  style={{ color: PARTY_THEME[activeState.leadingParty].color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PARTY_THEME[activeState.leadingParty].color }}
                  />
                  <span>{activeState.leadingParty} LEADING</span>
                </div>
              </div>

              {/* State Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Leading Candidate</p>
                  <p className="text-sm font-bold text-white mt-0.5">{activeState.leadingCandidate}</p>
                  <p className="text-[11px] text-emerald-400 font-bold">{activeState.leadMargin.toFixed(1)}% vote share</p>
                </div>

                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Voter Turnout</p>
                  <p className="text-sm font-bold text-white mt-0.5">{activeState.turnoutPct.toFixed(1)}%</p>
                  <p className="text-[11px] text-[#718579]">
                    {activeState.totalVotes.toLocaleString()} votes cast
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Collation Returns</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {((activeState.reportedPus / activeState.totalPus) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-blue-400 font-semibold">
                    {activeState.reportedPus.toLocaleString()} / {activeState.totalPus.toLocaleString()} PUs
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080E0A] border border-[#1A2C21]">
                  <p className="text-[11px] text-[#718579] font-semibold">Field Incidents</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {activeState.incidentsCount} Logged
                  </p>
                  <p className="text-[11px] text-red-400 font-semibold">
                    {activeState.criticalIncidents} critical alerts
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#1C2E24]">
                <button
                  onClick={() => {
                    setSelectedStateFilter(activeState.name);
                    setActiveTab('results');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>Audit {activeState.name} Results</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setSelectedStateFilter(activeState.id);
                    setActiveTab('locations');
                  }}
                  className="py-2 px-3 rounded-xl bg-[#1C2E24] hover:bg-[#253D30] text-white text-xs font-semibold transition"
                >
                  View LGAs
                </button>
              </div>
            </div>
          )}

          {/* Quick State Search & Mini Table */}
          <div className="rounded-2xl border border-[#1C2E24] bg-[#080E0A] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#718579]">
                State Breakdown ({filteredStates.length})
              </h4>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search state..."
                className="w-36 px-2.5 py-1 rounded-lg bg-[#0E1712] border border-[#1C2E24] text-xs text-white placeholder-[#718579] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="max-h-[170px] overflow-y-auto space-y-1.5 pr-1">
              {filteredStates.slice(0, 8).map((st) => {
                const isSelected = selectedStateId === st.id;
                const party = PARTY_THEME[st.leadingParty];
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStateId(st.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-[#0E1712] border-[#1C2E24] text-[#94A89D] hover:border-[#2A4435] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{st.name}</span>
                      <span className="text-[10px] text-[#718579]">({st.zone})</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-xs font-bold" style={{ color: party.color }}>
                        {st.leadingParty} ({st.leadMargin.toFixed(0)}%)
                      </span>
                      <span className="text-[11px] text-[#718579]">
                        {st.turnoutPct.toFixed(1)}% Turnout
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
