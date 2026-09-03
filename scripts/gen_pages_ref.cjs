const fs = require('fs');

const protocolsPageCode = `import React, { useState } from 'react';
import { PROTOCOLS, PORTS } from '../data/protocols';
import { Radio, Shield, AlertTriangle, Layers, BookOpen, Search } from 'lucide-react';

export const ProtocolsPage: React.FC = () => {
  const [tab, setTab] = useState<'protocols' | 'ports'>('protocols');
  const [filterQuery, setFilterQuery] = useState('');

  const filteredProtocols = PROTOCOLS.filter((p) =>
    p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.shortName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.purpose.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredPorts = PORTS.filter((p) =>
    p.port.toString().includes(filterQuery) ||
    p.service.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.purpose.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Protocols & Port Directory</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Deep architectural dissection of 30+ network protocols and well-known enterprise ports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#151922] p-1 border border-[#242a38] rounded-lg">
            <button
              onClick={() => setTab('protocols')}
              className={\`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition \${
                tab === 'protocols' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }\`}
            >
              Protocols ({PROTOCOLS.length})
            </button>
            <button
              onClick={() => setTab('ports')}
              className={\`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition \${
                tab === 'ports' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }\`}
            >
              Ports ({PORTS.length})
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter protocols or ports..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full bg-[#12151c] border border-[#242a38] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
        />
      </div>

      {tab === 'protocols' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProtocols.map((proto) => (
            <div key={proto.shortName} className="p-6 bg-[#12151c] border border-[#242a38] rounded-xl space-y-4 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs mb-1">
                    <span className="font-bold text-base text-white">{proto.shortName}</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold">Layer: {proto.layer}</span>
                    {proto.port && <span className="px-2 py-0.5 rounded bg-[#1f2533] text-cyan-400">Port: {proto.port}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-300">{proto.name}</h3>
                </div>
                <span className="text-[11px] font-mono text-gray-400">{proto.rfc}</span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{proto.purpose}</p>

              {/* Header Fields Table */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Key Header Fields:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {proto.headerFields.map((h, i) => (
                    <div key={i} className="p-2 bg-[#181c26] border border-[#242a38] rounded">
                      <div className="text-cyan-400 font-bold">{h.name} ({h.size})</div>
                      <div className="text-gray-400 text-[10px]">{h.securityRelevance}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#151922] border border-[#242a38] rounded-lg text-xs space-y-1">
                <span className="font-mono uppercase text-red-400 font-bold text-[11px] block">Common Attack Vectors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {proto.commonAttacks.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-[11px] font-mono">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPorts.map((p) => (
            <div key={p.port} className="p-4 bg-[#12151c] border border-[#242a38] rounded-xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between font-mono">
                <span className="text-lg font-bold text-cyan-400">Port {p.port}</span>
                <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${
                  p.securityRisk === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  p.securityRisk === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  'bg-green-500/15 text-green-400'
                }\`}>
                  Risk: {p.securityRisk}
                </span>
              </div>
              <div className="text-xs font-bold text-white">{p.service} ({p.protocol})</div>
              <p className="text-xs text-gray-300 line-clamp-2">{p.purpose}</p>

              <div className="pt-2 border-t border-[#1e2430] text-[11px] space-y-1">
                <div><strong className="text-gray-400 font-mono">Auth:</strong> <span className="text-gray-300">{p.authentication}</span></div>
                <div><strong className="text-gray-400 font-mono">Defense:</strong> <span className="text-gray-300">{p.defenseRemediation}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
`;

const attacksPageCode = `import React, { useState } from 'react';
import { ATTACKS } from '../data/attacks';
import { Shield, AlertTriangle, Code, Terminal, CheckCircle2 } from 'lucide-react';

export const AttacksPage: React.FC = () => {
  const [selectedAtk, setSelectedAtk] = useState(ATTACKS[0]);

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Network Attack ? Defense Matrix</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Map 30+ real-world network attacks to live traffic changes, indicators of compromise, Snort rules, and defense controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Attack Directory */}
        <div className="space-y-2">
          {ATTACKS.map((atk) => (
            <button
              key={atk.id}
              onClick={() => setSelectedAtk(atk)}
              className={\`w-full text-left p-3.5 rounded-xl border text-xs transition flex flex-col justify-between \${
                selectedAtk.id === atk.id
                  ? 'bg-red-500/20 border-red-500 text-white font-bold shadow-lg'
                  : 'bg-[#12151c] border-[#242a38] text-gray-300 hover:text-white hover:bg-[#181c26]'
              }\`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-[10px] uppercase text-red-400 font-bold">{atk.category}</span>
                <span className="font-mono text-[10px] text-gray-400">{atk.targetProtocol}</span>
              </div>
              <span className="font-bold text-sm text-white">{atk.name}</span>
            </button>
          ))}
        </div>

        {/* Right Deep Attack Dossier */}
        <div className="lg:col-span-2 p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-red-400 mb-1">
              <span>{selectedAtk.category}</span>
              <span>·</span>
              <span>{selectedAtk.mitreTactic}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">{selectedAtk.name}</h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">{selectedAtk.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#0a0c10] border border-green-500/30 rounded-xl">
              <span className="text-green-400 font-bold uppercase text-[11px] block mb-2">Normal Baseline Traffic</span>
              <p className="text-gray-300 font-sans leading-relaxed">{selectedAtk.normalTrafficPattern}</p>
            </div>
            <div className="p-4 bg-[#0a0c10] border border-red-500/30 rounded-xl">
              <span className="text-red-400 font-bold uppercase text-[11px] block mb-2">Attack Traffic Anomalies</span>
              <p className="text-red-200 font-sans leading-relaxed">{selectedAtk.attackTrafficPattern}</p>
            </div>
          </div>

          <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl font-mono text-xs">
            <div className="text-gray-400 uppercase text-[11px] font-bold mb-2 flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Snort / Suricata NIDS Rule Signature</span>
            </div>
            <pre className="text-cyan-300 leading-relaxed whitespace-pre-wrap">{selectedAtk.snortRule}</pre>
          </div>

          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs space-y-2">
            <span className="text-green-400 font-mono font-bold uppercase text-[11px] block">Defensive Mitigation Steps:</span>
            <ul className="space-y-1.5 text-gray-300">
              {selectedAtk.mitigationAndDefense.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

const defensePageCode = `import React from 'react';
import { DEFENSES } from '../data/defenses';
import { Shield, CheckCircle2, Lock, Layers } from 'lucide-react';

export const DefensePage: React.FC = () => {
  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Network Defense & Security Controls</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Defensive architecture blueprints: NGFWs, Dynamic ARP Inspection, Microsegmentation, and Inline IPS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEFENSES.map((def) => (
          <div key={def.id} className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-red-400">{def.layer}</span>
              <span className="px-2 py-0.5 rounded bg-[#1f2533] text-gray-400 text-xs font-mono uppercase">{def.type}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{def.name}</h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{def.description}</p>

            {def.configurationSnippet && (
              <div className="p-3.5 bg-[#0a0c10] border border-[#242a38] rounded-lg font-mono text-[11px] text-cyan-300 whitespace-pre-wrap leading-relaxed">
                {def.configurationSnippet}
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-[#1e2430] text-xs">
              <span className="font-mono uppercase text-green-400 font-bold text-[11px] block">Best Practices:</span>
              <ul className="space-y-1 text-gray-300">
                {def.bestPractices.map((bp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`;

const toolsPageCode = `import React from 'react';
import { CommandTerminal } from '../components/common/CommandTerminal';

export const ToolsPage: React.FC = () => {
  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Interactive CLI Network Diagnostics</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Practice essential networking commands (ip addr, ping, traceroute, ss, tcpdump, nmap) with live output dissection.
        </p>
      </div>
      <CommandTerminal />
    </div>
  );
};
`;

const rolesPageCode = `import React from 'react';
import { ROLES } from '../data/roles';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const RolesPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { progress, selectRole } = useProgress();

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Targeted Career Pathways</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Select an industry role to generate a customized roadmap tailored for SOC Analyst, Pentesting, DFIR, or Engineering.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLES.map((role) => {
          const isSelected = progress.selectedRoleId === role.id;
          return (
            <div
              key={role.id}
              className={\`p-6 rounded-2xl border transition shadow-xl flex flex-col justify-between \${
                isSelected
                  ? 'bg-[#151a24] border-yellow-500 shadow-yellow-500/10'
                  : 'bg-[#12151c] border-[#242a38] hover:border-gray-500'
              }\`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs font-bold text-yellow-400">{role.code}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1f2533] text-gray-400">{role.badge}</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">{role.title}</h2>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">{role.shortDesc}</p>

                <div className="space-y-1 mb-4 text-xs font-mono">
                  <span className="text-gray-400 uppercase text-[10px] block">Key Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {role.primaryTools.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#181c26] text-gray-300 text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e2430] flex items-center justify-between">
                <button
                  onClick={() => selectRole(role.id)}
                  className={\`px-3 py-1.5 rounded text-xs font-mono font-bold transition \${
                    isSelected ? 'bg-yellow-500 text-black' : 'bg-[#181c26] text-gray-300 hover:text-white'
                  }\`}
                >
                  {isSelected ? 'Active Track' : 'Set as Goal'}
                </button>
                <button
                  onClick={() => navigate('/role/' + role.id)}
                  className="text-xs font-mono text-red-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Deep Roadmap</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

const roleDetailPageCode = `import React from 'react';
import { ROLES } from '../data/roles';
import { PHASES } from '../data/curriculum';
import { ArrowLeft, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const RoleDetailPage: React.FC<{ roleId: string; navigate: (route: string) => void }> = ({ roleId, navigate }) => {
  const { progress, selectRole } = useProgress();
  const role = ROLES.find((r) => r.id === roleId) || ROLES[0];

  const recommendedPhases = PHASES.filter((p) => role.recommendedPhaseIds.includes(p.id));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      <button
        onClick={() => navigate('/roles')}
        className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Roles</span>
      </button>

      <div className="p-6 sm:p-8 bg-[#12151c] border border-yellow-500/40 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs font-bold text-yellow-400 uppercase">{role.code} · {role.badge}</span>
          <button
            onClick={() => selectRole(role.id)}
            className="px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition"
          >
            {progress.selectedRoleId === role.id ? 'Current Target' : 'Set as My Goal Track'}
          </button>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{role.title}</h1>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">{role.fullDesc}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white">Recommended Sequential Phase Path</h2>
        <div className="space-y-3">
          {recommendedPhases.map((phase, idx) => (
            <div
              key={phase.id}
              onClick={() => navigate('/module/' + phase.id)}
              className="p-4 bg-[#12151c] border border-[#242a38] rounded-xl hover:border-red-500/40 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-yellow-400 w-6">
                  {idx + 1}.
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition">{phase.title}</h3>
                  <span className="text-xs text-gray-400">{phase.subtitle}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
`;

const missionsPageCode = `import React from 'react';
import { MISSIONS } from '../data/missions';
import { Zap, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const MissionsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { progress, completeMission } = useProgress();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Daily & Contextual Missions</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Complete practical tactical missions to earn XP and level up your cybersecurity skill rating.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-lg">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>{progress.streakDays} Day Active Streak</span>
        </div>
      </div>

      <div className="space-y-4">
        {MISSIONS.map((m) => {
          const isDone = progress.completedMissions.includes(m.id);
          return (
            <div
              key={m.id}
              className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">+{m.xp} XP</span>
                  <span className="text-gray-400 uppercase">{m.category}</span>
                  <span className={\`text-[11px] \${m.difficulty === 'Easy' ? 'text-green-400' : m.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'}\`}>{m.difficulty}</span>
                </div>
                <h3 className="font-bold text-base text-white">{m.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{m.description}</p>
                <div className="text-[11px] font-mono text-yellow-400">Goal: {m.taskGoal}</div>
              </div>

              <div>
                {isDone ? (
                  <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 font-mono text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      completeMission(m.id);
                      if (m.verificationType === 'calculate_subnet') navigate('/simulator');
                      else if (m.verificationType === 'inspect_packet') navigate('/packet-analyzer');
                      else navigate('/topic/' + m.targetId);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>Execute Mission</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

const progressPageCode = `import React from 'react';
import { useProgress } from '../context/ProgressContext';
import { ProgressBar } from '../components/common/ProgressBar';
import { Award, Zap, RotateCcw, Download, Upload, CheckCircle2 } from 'lucide-react';
import { PHASES } from '../data/curriculum';

export const ProgressPage: React.FC = () => {
  const { progress, resetProgress, exportProgress, importProgress } = useProgress();

  const handleExport = () => {
    const data = exportProgress();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadowxlab-progress.json';
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) importProgress(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Learner Progress & Skill Mastery</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Real-time tracking persisted in browser localStorage with backup export and import options.</p>
      </div>

      <ProgressBar />

      {/* Backup & Management Actions */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-white">Progress Storage Management</h3>
          <p className="text-xs text-gray-400">Export your local progress file or import past certifications.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-[#181c26] border border-[#242a38] hover:text-white text-xs font-mono text-gray-300 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <label className="px-4 py-2 rounded-lg bg-[#181c26] border border-[#242a38] hover:text-white text-xs font-mono text-gray-300 transition flex items-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-yellow-400" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all local progress?')) {
                resetProgress();
              }
            }}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-mono text-red-400 transition flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
`;

const searchPageCode = `import React from 'react';
import { GlobalSearch } from '../components/common/GlobalSearch';

export const SearchPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 text-center">
      <GlobalSearch isOpen={true} onClose={() => navigate('/')} navigate={navigate} />
    </div>
  );
};
`;

fs.writeFileSync('src/pages/ProtocolsPage.tsx', protocolsPageCode);
fs.writeFileSync('src/pages/AttacksPage.tsx', attacksPageCode);
fs.writeFileSync('src/pages/DefensePage.tsx', defensePageCode);
fs.writeFileSync('src/pages/ToolsPage.tsx', toolsPageCode);
fs.writeFileSync('src/pages/RolesPage.tsx', rolesPageCode);
fs.writeFileSync('src/pages/RoleDetailPage.tsx', roleDetailPageCode);
fs.writeFileSync('src/pages/MissionsPage.tsx', missionsPageCode);
fs.writeFileSync('src/pages/ProgressPage.tsx', progressPageCode);
fs.writeFileSync('src/pages/SearchPage.tsx', searchPageCode);

console.log('Reference pages generated successfully');
