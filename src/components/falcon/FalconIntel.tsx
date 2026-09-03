import React, { useState } from 'react';
import { Flame, Shield, Globe, Tag, ExternalLink, Radio, Search, AlertTriangle, Layers } from 'lucide-react';

interface AdversaryDossier {
  name: string;
  origin: string;
  motivation: 'Nation-State' | 'eCrime' | 'Hacktivist';
  targetSectors: string[];
  signatureKillChain: string;
  mitreTactics: string[];
  observedIoas: string[];
  description: string;
}

const ADVERSARIES: AdversaryDossier[] = [
  {
    name: 'COZY BEAR (APT29)',
    origin: 'Russia (SVR)',
    motivation: 'Nation-State',
    targetSectors: ['Government', 'Defense', 'Energy', 'Think Tanks'],
    signatureKillChain: 'Supply chain compromise, encoded PowerShell cradles, token theft, stealthy C2 beaconing',
    mitreTactics: ['Initial Access', 'Execution (T1059.001)', 'Defense Evasion (T1027)', 'C2 (T1071.001)'],
    observedIoas: [
      'Suspicious_Encoded_PowerShell_DownloadCradle',
      'AMSI_Bypass_Memory_Patching',
      'Domain_Recon_High_Frequency'
    ],
    description: 'Highly capable state-sponsored threat group known for complex persistence, DLL side-loading, and stealthy Living-off-the-Land (LotL) execution.'
  },
  {
    name: 'SCATTERED SPIDER',
    origin: 'Global / US & UK',
    motivation: 'eCrime',
    targetSectors: ['Telecommunications', 'Financial Services', 'Gaming', 'Healthcare'],
    signatureKillChain: 'SMS phishing, SIM swapping, MFA fatigue, LSASS dumping via comsvcs, Okta hijacking',
    mitreTactics: ['Credential Access (T1003.001)', 'Lateral Movement (T1021.002)', 'Persistence (T1078)'],
    observedIoas: [
      'LSASS_Process_Access_Via_Comsvcs',
      'MFA_Bypass_Session_Hijack',
      'SMB_PsExec_Service_Creation'
    ],
    description: 'Financially motivated extortion group specializing in social engineering, cloud identity theft, and ransomware deployment.'
  },
  {
    name: 'FANCY BEAR (APT28)',
    origin: 'Russia (GRU)',
    motivation: 'Nation-State',
    targetSectors: ['Military', 'Government', 'Critical Infrastructure'],
    signatureKillChain: 'Zero-day exploitation, credential harvesting, custom malware droppers (Zebrocy, X-Agent)',
    mitreTactics: ['Initial Access (T1190)', 'Execution (T1059.003)', 'Exfiltration (T1048)'],
    observedIoas: [
      'Kernel_Privilege_Escalation_Attempt',
      'Scheduled_Task_Persistence_Creation'
    ],
    description: 'Cyber military intelligence unit executing high-profile political intrusions, destructive attacks, and espionage.'
  }
];

export const FalconIntel: React.FC = () => {
  const [selectedAdversary, setSelectedAdversary] = useState<AdversaryDossier>(ADVERSARIES[0]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
              CrowdStrike Falcon Intelligence™
            </span>
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            THREAT ADVERSARY INTELLIGENCE DOSSIERS
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Actor attribution, signature kill-chains, and live Indicators of Attack (IOAs) mapped to the cyber range
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Left 1 Col: Adversary List */}
        <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-5 shadow-2xl space-y-3">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-bold block mb-2">
            Tracked Adversaries
          </span>

          <div className="space-y-2">
            {ADVERSARIES.map((adv) => (
              <div
                key={adv.name}
                onClick={() => setSelectedAdversary(adv)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedAdversary.name === adv.name
                    ? 'bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950'
                    : 'bg-[#121620] border-[#202736] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-bold text-white text-sm">{adv.name}</span>
                  <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded font-bold uppercase border border-red-500/40">
                    {adv.motivation}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Origin: {adv.origin}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Adversary Deep-Dive Dossier */}
        <div className="lg:col-span-2 bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#202736]">
            <div>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                Adversary Profile
              </span>
              <h3 className="text-xl font-black text-white">{selectedAdversary.name}</h3>
            </div>
            <span className="px-3 py-1 bg-red-950 border border-red-500 text-red-300 font-bold rounded-lg uppercase">
              {selectedAdversary.motivation}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedAdversary.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Origin / Sponsorship</span>
              <span className="text-white font-bold">{selectedAdversary.origin}</span>
            </div>

            <div className="p-3.5 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Signature Kill-Chain</span>
              <span className="text-amber-300 font-bold text-[11px]">{selectedAdversary.signatureKillChain}</span>
            </div>
          </div>

          {/* Targeted Sectors */}
          <div className="space-y-2">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Observed Targeted Sectors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedAdversary.targetSectors.map((sector, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-[#121620] border border-[#202736] rounded-lg text-cyan-300 font-bold text-[11px]">
                  {sector}
                </span>
              ))}
            </div>
          </div>

          {/* Observed Indicators of Attack (IOAs) */}
          <div className="p-4 bg-[#121620] border border-red-500/40 rounded-xl space-y-2">
            <span className="text-red-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Observed Falcon Indicators of Attack (IOAs)</span>
            </span>
            <div className="space-y-1">
              {selectedAdversary.observedIoas.map((ioa, idx) => (
                <div key={idx} className="p-2 bg-[#080A0E] rounded-lg border border-[#202736] text-purple-300 text-[11px]">
                  • {ioa}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
