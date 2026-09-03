const fs = require('fs');

const dnsSimulatorCode = `import React, { useState } from 'react';
import { Globe, Server, Database, Play, RotateCcw, AlertTriangle } from 'lucide-react';

export const DNSResolverSimulator: React.FC = () => {
  const [domain, setDomain] = useState('secure.shadowxlab.internal');
  const [step, setStep] = useState(0);
  const [tunnelingMode, setTunnelingMode] = useState(false);

  const steps = [
    { title: '1. Client Cache & Hosts File Check', desc: 'Host 192.168.1.50 checks local resolver cache (ipconfig /displaydns). Cache miss occurs.' },
    { title: '2. Query Recursive Resolver', desc: 'Client sends recursive UDP 53 query to Enterprise DNS Resolver (10.0.0.2).' },
    { title: '3. Query Root Nameserver (.)', desc: 'Resolver asks Root Server for authoritative TLD nameservers (returns .internal NS).' },
    { title: '4. Query TLD Nameserver (.internal)', desc: 'Resolver asks TLD Server for shadowxlab.internal authoritative nameservers.' },
    { title: '5. Query Authoritative Nameserver (ns1)', desc: 'Resolver queries ns1.shadowxlab.internal and retrieves A record: 10.0.2.15 (TTL=300).' },
    { title: '6. Resolver Caches & Returns IP', desc: 'Recursive resolver returns 10.0.2.15 to client; client initiates TCP connection.' }
  ];

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white">DNS Recursive Resolution & Tunneling Visualizer</h3>
          <p className="text-xs text-gray-400">Step-by-step query traversal through the global DNS hierarchy</p>
        </div>

        <button
          onClick={() => {
            setTunnelingMode(!tunnelingMode);
            setDomain(!tunnelingMode ? '7a8f29c4e1b99214.exfil.attacker-c2.net' : 'secure.shadowxlab.internal');
            setStep(0);
          }}
          className={\`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition \${
            tunnelingMode ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-[#181c26] text-gray-300 border-[#242a38] hover:text-white'
          }\`}
        >
          {tunnelingMode ? 'Tunneling Mode Active' : 'Simulate DNS Tunneling'}
        </button>
      </div>

      <div className="p-3.5 bg-[#0a0c10] border border-[#242a38] rounded-lg mb-6 flex items-center gap-3 font-mono text-xs">
        <span className="text-gray-400">Target Query:</span>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 bg-[#151922] border border-[#242a38] rounded px-3 py-1.5 text-cyan-400 font-bold focus:outline-none"
        />
      </div>

      {tunnelingMode && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg mb-6 text-xs text-red-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <span className="font-bold font-mono uppercase block">DNS Tunneling Detection Triggered:</span>
            <span>Subdomain length ({domain.split('.')[0].length} chars) and Shannon entropy (3.92) indicate encoded data payload!</span>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-2 mb-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className={\`p-3.5 rounded-lg border text-xs transition \${
              step === idx + 1
                ? 'bg-red-500/15 border-red-500 text-white font-medium shadow-md'
                : step > idx + 1
                ? 'bg-[#151922] border-green-500/30 text-gray-400'
                : 'bg-[#151922] border-[#242a38] text-gray-400 opacity-60'
            }\`}
          >
            <div className="font-bold font-mono text-white text-xs mb-1">{s.title}</div>
            <p className="text-gray-300 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep((prev) => Math.min(steps.length, prev + 1))}
          disabled={step >= steps.length}
          className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Step DNS Query</span>
        </button>
        <button
          onClick={() => setStep(0)}
          className="px-4 py-2 rounded-lg bg-[#181c26] border border-[#242a38] text-gray-300 hover:text-white font-mono text-xs transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
`;

const arpSimulatorCode = `import React, { useState } from 'react';
import { Layers, AlertTriangle, Shield, Play, RotateCcw } from 'lucide-react';

export const ARPSimulator: React.FC = () => {
  const [arpPoisoned, setArpPoisoned] = useState(false);
  const [daiEnabled, setDaiEnabled] = useState(false);

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white">ARP Resolution & Cache Poisoning Simulator</h3>
          <p className="text-xs text-gray-400">Layer 2 address mapping and Dynamic ARP Inspection (DAI) defense</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setArpPoisoned(!arpPoisoned)}
            className={\`px-3 py-1.5 rounded-lg border transition font-bold \${
              arpPoisoned ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-[#181c26] text-gray-300 border-[#242a38] hover:text-white'
            }\`}
          >
            {arpPoisoned ? 'ARP Poisoning: ACTIVE' : 'Launch ARP Poisoning'}
          </button>
          {arpPoisoned && (
            <button
              onClick={() => setDaiEnabled(!daiEnabled)}
              className={\`px-3 py-1.5 rounded-lg border transition font-bold \${
                daiEnabled ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-[#181c26] text-yellow-400 border-yellow-500/40'
              }\`}
            >
              {daiEnabled ? 'DAI Defense: ON' : 'Enable Dynamic ARP Inspection'}
            </button>
          )}
        </div>
      </div>

      {/* Host ARP Table Display */}
      <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl mb-6 font-mono text-xs">
        <div className="flex justify-between items-center mb-3 text-gray-400 uppercase text-[11px] font-bold">
          <span>Victim Host ARP Cache (192.168.1.50)</span>
          <span className={arpPoisoned && !daiEnabled ? 'text-red-400' : 'text-green-400'}>
            {arpPoisoned && !daiEnabled ? 'CRITICAL: GATEWAY MAC POISONED' : 'NORMAL / VALIDATED'}
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#242a38] text-gray-400">
              <th className="pb-2">Internet Address (IP)</th>
              <th className="pb-2">Physical Address (MAC)</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2430]">
            <tr>
              <td className="py-2 text-cyan-400">192.168.1.1 (Gateway)</td>
              <td className={\`py-2 font-bold \${arpPoisoned && !daiEnabled ? 'text-red-400' : 'text-white'}\`}>
                {arpPoisoned && !daiEnabled ? '00:50:56:ee:ff:99 (ATTACKER)' : '00:50:56:a1:00:01 (ROUTER)'}
              </td>
              <td className="py-2 text-gray-400">dynamic</td>
              <td className="py-2">
                <span className={\`px-2 py-0.5 rounded text-[10px] \${
                  arpPoisoned && !daiEnabled ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-green-500/15 text-green-400'
                }\`}>
                  {arpPoisoned && !daiEnabled ? 'SPOOFED' : 'LEGITIMATE'}
                </span>
              </td>
            </tr>
            <tr>
              <td className="py-2 text-cyan-400">192.168.1.99 (Attacker)</td>
              <td className="py-2 text-white">00:50:56:ee:ff:99</td>
              <td className="py-2 text-gray-400">dynamic</td>
              <td className="py-2"><span className="text-gray-400">Normal</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs space-y-2">
        <h4 className="font-bold text-white uppercase font-mono text-[11px] flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Switch Dynamic ARP Inspection (DAI) Mechanics</span>
        </h4>
        <p className="text-gray-300 leading-relaxed">
          When DAI is enabled, the switch validates every gratuitous ARP reply against the DHCP Snooping database. Because 192.168.1.1 is bound to 00:50:56:a1:00:01, any attempt by the attacker MAC (00:50:56:ee:ff:99) to claim IP 192.168.1.1 is dropped at the switch port level with a security syslog violation.
        </p>
      </div>
    </div>
  );
};
`;

const trafficMonitorCode = `import React from 'react';
import { Activity, ShieldAlert, Wifi, Radio, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const TrafficMonitor: React.FC = () => {
  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">SOC Telemetry & Real-Time Traffic Monitor</h3>
            <p className="text-xs text-gray-400">Live network packet rates, stream meters, and active threat feed</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-1 rounded">
          NOC / SOC SENSORS ACTIVE
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Packets / Sec</span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-bold text-cyan-400">14,280</span>
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
        </div>

        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Bandwidth Throughput</span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-bold text-white">482 Mbps</span>
            <ArrowDownRight className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Active TCP Sessions</span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-bold text-yellow-400">1,894</span>
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
        </div>

        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Security Alerts (1h)</span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-bold text-red-400">4 Active</span>
            <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Real-Time Alert Log Feed */}
      <div className="bg-[#0a0c10] border border-[#242a38] rounded-xl p-4 font-mono text-xs">
        <h4 className="text-gray-400 uppercase text-[11px] font-bold mb-3 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Real-Time Network Threat Feed</span>
        </h4>
        <div className="space-y-2 text-[11px]">
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-between">
            <span>[CRITICAL] High Entropy Subdomain DNS Query (7a8f29c4...exfil.attacker-c2.net)</span>
            <span className="text-gray-400">14:22:05</span>
          </div>
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-between">
            <span>[ALERT] Reverse Shell TCP Socket on Port 4444 from 192.168.1.50</span>
            <span className="text-gray-400">14:22:08</span>
          </div>
          <div className="p-2.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 flex items-center justify-between">
            <span>[WARNING] Rapid Outbound TCP SYN Scanning against Subnet 10.0.2.0/24</span>
            <span className="text-gray-400">14:21:40</span>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

const attackSimulatorCode = `import React, { useState } from 'react';
import { ATTACKS } from '../../data/attacks';
import { Shield, Play, AlertTriangle, Code, Terminal, CheckCircle2 } from 'lucide-react';

export const AttackSimulator: React.FC = () => {
  const [selectedAtk, setSelectedAtk] = useState(ATTACKS[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white">Network Attack ? Defense Live Simulator</h3>
          <p className="text-xs text-gray-400">Map attack methodologies directly to live traffic differentials and mitigation rules</p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {ATTACKS.slice(0, 5).map((atk) => (
            <button
              key={atk.id}
              onClick={() => { setSelectedAtk(atk); setIsSimulating(false); }}
              className={\`px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap \${
                selectedAtk.id === atk.id
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                  : 'bg-[#181c26] text-gray-400 hover:text-white border border-[#242a38]'
              }\`}
            >
              {atk.name.split(' ')[0]} {atk.name.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-bold text-white mb-1">{selectedAtk.name}</h4>
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold">{selectedAtk.category}</span>
          <span className="px-2 py-0.5 rounded bg-[#1f2533] text-gray-400">{selectedAtk.mitreTechnique}</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{selectedAtk.description}</p>
      </div>

      {/* Traffic Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs font-mono">
        <div className="p-4 bg-[#0a0c10] border border-green-500/30 rounded-xl">
          <span className="text-green-400 font-bold uppercase text-[11px] block mb-2">Normal Baseline Traffic Pattern</span>
          <p className="text-gray-300 leading-relaxed font-sans">{selectedAtk.normalTrafficPattern}</p>
        </div>

        <div className="p-4 bg-[#0a0c10] border border-red-500/30 rounded-xl">
          <span className="text-red-400 font-bold uppercase text-[11px] block mb-2">Attack Traffic Pattern (Anomalies)</span>
          <p className="text-red-200 leading-relaxed font-sans">{selectedAtk.attackTrafficPattern}</p>
        </div>
      </div>

      {/* Snort Detection Signature Rule */}
      <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl font-mono text-xs mb-6">
        <div className="text-gray-400 uppercase text-[11px] font-bold mb-2 flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-cyan-400" />
          <span>Snort / Suricata NIDS Rule Signature</span>
        </div>
        <pre className="text-cyan-300 leading-relaxed whitespace-pre-wrap">{selectedAtk.snortRule}</pre>
      </div>

      {/* Mitigation & Hardening */}
      <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs">
        <div className="text-green-400 font-mono font-bold uppercase mb-2 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Defensive Mitigation & Hardening Controls</span>
        </div>
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
  );
};
`;

fs.writeFileSync('src/components/simulators/DNSResolverSimulator.tsx', dnsSimulatorCode);
fs.writeFileSync('src/components/simulators/ARPSimulator.tsx', arpSimulatorCode);
fs.writeFileSync('src/components/simulators/TrafficMonitor.tsx', trafficMonitorCode);
fs.writeFileSync('src/components/simulators/AttackSimulator.tsx', attackSimulatorCode);

console.log('DNS, ARP, TrafficMonitor, and AttackSimulator generated successfully');
