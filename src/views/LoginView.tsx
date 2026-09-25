import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Lock, Mail, Building, CheckCircle2 } from 'lucide-react';

const ORG_PRESETS = [
  { id: 'org-aquila-hq', name: 'Aquila Central Situation Command', tag: 'HQ' },
  { id: 'org-party-hq', name: 'Political Party Situation Desk', tag: 'PARTY' },
  { id: 'org-media-desk', name: 'Channels TV Election Desk', tag: 'MEDIA' },
  { id: 'org-cdd', name: 'CDD West Africa Observer Mission', tag: 'CSO' },
  { id: 'org-tmg', name: 'Transition Monitoring Group (TMG)', tag: 'OBSERVER' },
];

export const LoginView: React.FC = () => {
  const { loginWithAccount } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(ORG_PRESETS[0]);
  const [customOrg, setCustomOrg] = useState('');
  const [isCustomOrg, setIsCustomOrg] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const orgName = isCustomOrg ? customOrg.trim() : selectedOrg.name;
    const orgId = isCustomOrg ? `org-${customOrg.toLowerCase().replace(/\s+/g, '-')}` : selectedOrg.id;

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    if (isCustomOrg && !customOrg.trim()) {
      setError('Please specify your organization name');
      return;
    }

    loginWithAccount({
      name: email.split('@')[0].toUpperCase(),
      email: email.trim(),
      role: 'FIELD_AGENT',
      roleTitle: 'Field Agent (Cluster Supervisor)',
      organizationId: orgId,
      organizationName: orgName,
      description: 'Connected via station credentials.',
      assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
    });
  };

  const launchDemo = (role: 'agent' | 'polling' | 'officer') => {
    if (role === 'agent') {
      loginWithAccount({
        name: 'Ibrahim Danladi',
        email: 'agent.ibrahim@yiaga.org',
        role: 'FIELD_AGENT',
        roleTitle: 'Field Agent (Cluster Supervisor)',
        organizationId: 'org-yiaga',
        organizationName: 'Yiaga Africa WTV',
        description: 'Assigned to 3 Polling Units in Ikeja cluster for parallel vote tabulation.',
        assignedPus: ['pu-s25-lga-1-1', 'pu-s25-lga-1-2', 'pu-s25-lga-1-3'],
      });
    } else if (role === 'polling') {
      loginWithAccount({
        name: 'Chinedu Eze',
        email: 'pu.chinedu@tmg-nigeria.org',
        role: 'POLLING_AGENT',
        roleTitle: 'Polling Unit Agent',
        organizationId: 'org-tmg',
        organizationName: 'Transition Monitoring Group (TMG)',
        description: 'Stationed exclusively at PU 001 Ikeja Grammar School.',
        assignedPus: ['pu-s25-lga-1-1'],
      });
    } else {
      loginWithAccount({
        name: 'Dr. Adebayo Adeleke',
        email: 'officer.adebayo@cddwestafrica.org',
        role: 'ELECTION_OFFICER',
        roleTitle: 'Election Officer (Supervisory)',
        organizationId: 'org-cdd',
        organizationName: 'Centre for Democracy and Development (CDD)',
        description: 'National election situation room supervisor with collation audit access.',
        assignedPus: [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070C09] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070C09] via-[#0D2619] to-[#0D6338]/30 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Header / Brand Identity */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#0D6338] to-[#10B981] p-3 shadow-2xl flex items-center justify-center">
            <img
              src="/assets/eagle-head.png"
              alt="Aquila"
              className="w-14 h-14 object-contain drop-shadow"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white">AQUILA</h1>
          <p className="text-xs font-semibold tracking-wider text-[#34D399]">
            trusted election intelligence in real time
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-[#0E1712] border border-[#1C2E24] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sign In to Station</h2>
            <p className="text-xs text-[#718579]">
              Enter credentials to connect to your assigned situation room.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Organization Tenant Selector (Audio Part 1) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#718579] uppercase flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#10B981]" />
                ORGANIZATION / TENANT
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {ORG_PRESETS.map((org) => {
                  const active = !isCustomOrg && selectedOrg.id === org.id;
                  return (
                    <button
                      type="button"
                      key={org.id}
                      onClick={() => {
                        setIsCustomOrg(false);
                        setSelectedOrg(org);
                      }}
                      className={`p-2 rounded-xl text-left text-xs font-semibold transition border truncate ${
                        active
                          ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                          : 'bg-[#070C09] border-[#1C2E24] text-[#94A89D] hover:text-white'
                      }`}
                    >
                      {org.name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsCustomOrg(!isCustomOrg)}
                className={`w-full p-2 rounded-xl text-xs font-semibold transition border text-center ${
                  isCustomOrg
                    ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                    : 'bg-[#070C09] border-[#1C2E24] text-[#718579] hover:text-white'
                }`}
              >
                + Custom Organization
              </button>

              {isCustomOrg && (
                <input
                  type="text"
                  placeholder="Enter custom organization name"
                  value={customOrg}
                  onChange={(e) => setCustomOrg(e.target.value)}
                  className="w-full mt-2 bg-[#070C09] border border-[#1C2E24] rounded-xl px-3 py-2 text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
                />
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#718579] uppercase">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@aquila.ng"
                  className="w-full pl-9 pr-3 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#718579] uppercase">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718579] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security passkey"
                  className="w-full pl-9 pr-3 py-2 bg-[#070C09] border border-[#1C2E24] rounded-xl text-xs text-white placeholder-[#718579] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D6338] to-[#10B981] hover:from-[#15803D] hover:to-[#34D399] text-white font-bold text-xs transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Connect &amp; Access Console</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-3 border-t border-[#1C2E24] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#718579] block text-center">
              ONE-TAP DEMO ROLES
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => launchDemo('agent')}
                className="py-1.5 px-2 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] text-xs font-semibold text-white transition text-center"
              >
                Field Agent
              </button>
              <button
                type="button"
                onClick={() => launchDemo('polling')}
                className="py-1.5 px-2 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] text-xs font-semibold text-white transition text-center"
              >
                PU Agent
              </button>
              <button
                type="button"
                onClick={() => launchDemo('officer')}
                className="py-1.5 px-2 rounded-xl bg-[#070C09] border border-[#1C2E24] hover:border-[#10B981] text-xs font-semibold text-white transition text-center"
              >
                Election Officer
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#718579] text-center">
          Independent Observer Intelligence System · End-to-End Encrypted
        </p>
      </div>
    </div>
  );
};
