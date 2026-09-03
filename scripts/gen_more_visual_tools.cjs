const fs = require('fs');

// FailureSecuritySimulator.tsx
const failureSecCode = `import React, { useState } from 'react';
import { AlertOctagon, Shield, CheckSquare, RefreshCw, AlertTriangle, Layers, Activity } from 'lucide-react';

export const FailureSecuritySimulator: React.FC = () => {
  const [selectedFailure, setSelectedFailure] = useState('cable');
  const [selectedLayer, setSelectedLayer] = useState(1);
  const [events, setEvents] = useState<string[]>(['[BASELINE] Telemetry normal: zero anomalies detected.']);
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false, false]);

  const failures: Record<string, { title: string; symptom: string; layer: string; check: string; desc: string }> = {
    cable: { title: 'Cable / Link Down', symptom: 'No physical carrier signal (Link status DOWN)', layer: 'Layer 1 (Physical)', check: 'Inspect cable, patch panel, and SFP transceiver status', desc: 'When the physical medium fails or is disconnected, no bits can be encoded on the wire. The OS reports "Network cable unplugged".' },
    nic: { title: 'NIC Failure', symptom: 'Hardware device error or driver crash', layer: 'Layer 1 / Layer 2', check: 'Check device manager / lspci and interface logs', desc: 'Hardware or driver faults prevent the host OS from communicating with the NIC transceiver.' },
    switch: { title: 'Switch Failure', symptom: 'Local broadcast domain disconnected', layer: 'Layer 2 (Data Link)', check: 'Check switch power, STP topology change notifications, CAM table state', desc: 'If the switch fails, all local hosts lose Layer 2 frame forwarding, even if individual cables are intact.' },
    ip: { title: 'Wrong IP / Mask', symptom: 'Host cannot communicate with local subnet or gateway', layer: 'Layer 3 (Network)', check: 'Verify IP, CIDR mask, and duplicate IP conflict traps', desc: 'Misconfigured IP addresses prevent proper route evaluation. An invalid mask causes local packets to be routed to the gateway or vice-versa.' },
    gateway: { title: 'Gateway Failure', symptom: 'Local LAN reachable, remote networks fail', layer: 'Layer 3 (Network)', check: 'Check default gateway reachability (ping 192.168.1.1) and router interfaces', desc: 'Hosts can ARP and communicate within the local subnet, but off-subnet traffic targeting external networks is dropped.' },
    dns: { title: 'DNS Resolution Failure', symptom: 'IP ping succeeds, but domain names fail to resolve', layer: 'Layer 7 (Application)', check: 'Test with nslookup / dig against 192.168.1.53 on UDP port 53', desc: 'Direct IP connections succeed, but applications fail to resolve hostnames like www.example.local.' },
    port: { title: 'Service Port Blocked', symptom: 'Network path works, TCP SYN gets dropped or RST/ACK returned', layer: 'Layer 4 / Firewall', check: 'Check firewall ACLs, security groups, and netstat listening daemons', desc: 'Perimeter firewalls or host firewalls filter TCP/UDP ports, rejecting connection handshakes.' },
    arp: { title: 'ARP Resolution Failure', symptom: 'Destination IP known, but destination MAC unresolved (Incomplete)', layer: 'Layer 2 (Data Link)', check: 'Run arp -a and verify gratuitous ARP broadcasts', desc: 'Host cannot build the Layer 2 Ethernet frame without a valid MAC address in the ARP cache.' }
  };

  const layerAttacks: Record<number, { title: string; desc: string; telemetry: string }> = {
    1: { title: 'L1 — Physical Layer Interference', desc: 'Wiretapping, cable cutting, rogue physical taps, and jamming.', telemetry: '[ALERT] Intermittent carrier drop detected on port Gi0/1.' },
    2: { title: 'L2 — Data Link Exploitation', desc: 'ARP Cache Poisoning, MAC Flooding (CAM Table Exhaustion), and VLAN Hopping (Double Tagging).', telemetry: '[CRITICAL] Duplicate MAC AA:BB:CC:99:99 claiming IP 192.168.1.1 (ARP Spoofing).' },
    3: { title: 'L3 — Network Layer Attacks', desc: 'IP Source Spoofing, ICMP Floods, and BGP Route Poisoning / Prefix Hijacking.', telemetry: '[WARNING] Inbound RFC 1918 Martian IP 10.0.5.22 arriving on external WAN uplink.' },
    4: { title: 'L4 — Transport Layer Attacks', desc: 'TCP SYN Floods, UDP Amplification attacks, and Port Scanning reconnaissance.', telemetry: '[CRITICAL] 50,000 SYN packets/sec detected targeting TCP port 443 with 0 ACK completions.' },
    5: { title: 'L5 — Session Hijacking', desc: 'RPC abuse, NetBIOS enumeration, and SMB session hijacking.', telemetry: '[ALERT] Unauthorized SMB Named Pipe PsExec execution over TCP 445.' },
    6: { title: 'L6 — Presentation Exploits', desc: 'TLS Downgrade attacks, SSL Stripping, and malicious encoding evasion.', telemetry: '[WARNING] Insecure cleartext HTTP transmission of authentication headers.' },
    7: { title: 'L7 — Application Layer Attacks', desc: 'SQL Injection, Cross-Site Scripting, DNS Tunneling C2, and HTTP Directory Brute-Forcing.', telemetry: '[CRITICAL] DNS query entropy 3.94 for *.tunnel.attacker-c2.net on UDP port 53.' }
  };

  const curFail = failures[selectedFailure];
  const curAtk = layerAttacks[selectedLayer];

  const triggerAttack = () => {
    setEvents((prev) => [\`[\${new Date().toLocaleTimeString()}] \${curAtk.telemetry}\`, ...prev.slice(0, 4)]);
  };

  const toggleCheck = (idx: number) => {
    const next = [...checklist];
    next[idx] = !next[idx];
    setChecklist(next);
  };

  return (
    <div className="space-y-8 text-white font-sans">
      {/* Failure Sandbox */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <span>When a Network Component Fails (NOC Troubleshooting)</span>
          </div>
          <span className="text-xs font-mono text-gray-400">8 SCENARIOS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {Object.keys(failures).map((k) => (
            <button
              key={k}
              onClick={() => setSelectedFailure(k)}
              className={\`p-3 rounded-xl border text-left transition \${
                selectedFailure === k
                  ? 'bg-red-500/20 border-red-500 font-bold shadow-lg shadow-red-500/20'
                  : 'bg-[#151922] border-[#242a38] hover:border-gray-500 text-gray-300'
              }\`}
            >
              <div className="text-white font-bold">{failures[k].title}</div>
              <div className="text-[10px] text-gray-400 mt-1">{failures[k].layer}</div>
            </button>
          ))}
        </div>

        <div className="p-5 bg-[#151922] border border-[#242a38] rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-base text-white">{curFail.title}</h4>
            <span className="px-2.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
              {curFail.layer}
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">{curFail.desc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0a0c10] border border-red-500/30 rounded-lg">
              <span className="text-red-400 font-bold uppercase text-[10px] block mb-1">Observable Symptom:</span>
              <p className="text-gray-200">{curFail.symptom}</p>
            </div>
            <div className="p-3 bg-[#0a0c10] border border-green-500/30 rounded-lg">
              <span className="text-green-400 font-bold uppercase text-[10px] block mb-1">First Recommended Check:</span>
              <p className="text-gray-200">{curFail.check}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Layer-by-Layer Attacker Interference */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-yellow-400 font-bold uppercase">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span>How Attackers Interfere — Layer by Layer (SOC Telemetry)</span>
          </div>
          <button
            onClick={triggerAttack}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Security Event</span>
          </button>
        </div>

        {/* 7 Layer Selector Pills */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedLayer(num)}
              className={\`p-3 rounded-xl border transition \${
                selectedLayer === num
                  ? 'bg-red-500/20 border-red-500 text-white font-bold shadow-lg'
                  : 'bg-[#151922] border-[#242a38] text-gray-400 hover:border-gray-500'
              }\`}
            >
              <div className="font-bold">L{num}</div>
              <div className="text-[10px] text-gray-400">
                {num === 1 ? 'Phys' : num === 2 ? 'Data' : num === 3 ? 'Net' : num === 4 ? 'Trans' : num === 5 ? 'Sess' : num === 6 ? 'Pres' : 'App'}
              </div>
            </button>
          ))}
        </div>

        <div className="p-5 bg-[#151922] border border-[#242a38] rounded-xl text-xs space-y-2">
          <h4 className="font-bold text-sm text-white">{curAtk.title}</h4>
          <p className="text-gray-300 leading-relaxed">{curAtk.desc}</p>
        </div>

        {/* Real-Time Telemetry Feed */}
        <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl font-mono text-xs space-y-2">
          <span className="text-gray-400 uppercase text-[10px] font-bold block">Live SOC Event Log:</span>
          {events.map((ev, i) => (
            <div key={i} className="p-2 bg-[#12151c] border border-red-500/30 rounded text-red-300">
              {ev}
            </div>
          ))}
        </div>
      </div>

      {/* NOC -> SOC Investigation Checklist */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-green-400 font-bold uppercase">
            <CheckSquare className="w-4 h-4 text-green-400" />
            <span>NOC ? SOC Investigation Workflow</span>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {checklist.filter(Boolean).length} / 5 COMPLETED
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {[
            'Verify physical link status and interface transceiver carrier.',
            'Verify IP / subnet mask / default gateway local addressing.',
            'Inspect ARP / MAC binding behavior for local segment delivery.',
            'Test DNS resolution and target TCP/UDP service port listeners.',
            'Analyze traffic flow volume anomalies and correlate against SIEM threat feeds.'
          ].map((item, idx) => (
            <label
              key={idx}
              className="p-3.5 bg-[#151922] border border-[#242a38] rounded-xl flex items-center gap-3 cursor-pointer hover:border-gray-500 transition"
            >
              <input
                type="checkbox"
                checked={checklist[idx]}
                onChange={() => toggleCheck(idx)}
                className="w-4 h-4 accent-red-500 rounded cursor-pointer"
              />
              <span className={checklist[idx] ? 'line-through text-gray-500' : 'text-gray-200'}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
`;

// InternetRoutingVisualizer.tsx
const internetRoutingCode = `import React, { useState } from 'react';
import { Globe, Laptop, Router, Radio, Server, Play, Cloud, ArrowRight } from 'lucide-react';

export const InternetRoutingVisualizer: React.FC = () => {
  const [activeHop, setActiveHop] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const hops = [
    { num: 1, title: 'Your Device', node: 'Laptop (192.168.1.10)', desc: 'The client application generates an HTTP request. It knows the server is remote, so it frames the packet with the MAC address of its Default Gateway.', layer: 'Layer 7 / Layer 2' },
    { num: 2, title: 'LAN Switch', node: 'Switch (SW-1)', desc: 'The access switch reads the destination MAC address in the frame and forwards it out the uplink port to the router.', layer: 'Layer 2 (Data Link)' },
    { num: 3, title: 'Default Gateway Router', node: 'Border Router (192.168.1.1)', desc: 'The gateway strips the L2 frame, inspects the destination IP (203.0.113.50), applies NAT translation (PAT), and forwards to the ISP.', layer: 'Layer 3 / NAT' },
    { num: 4, title: 'Internet Transit & BGP', node: 'Global Internet / Autonomous Systems', desc: 'Packets traverse Tier-1 and Tier-2 transit carriers using BGP (Border Gateway Protocol) and Longest Prefix Match forwarding.', layer: 'Layer 3 (WAN)' },
    { num: 5, title: 'Remote Web Server', node: 'Server (203.0.113.50:443)', desc: 'The packet arrives at the destination datacenter, decapsulates through the web server stack, and serves the requested HTTPS content.', layer: 'Layer 7 (Application)' }
  ];

  const animateJourney = () => {
    setIsSimulating(true);
    setActiveHop(1);
    const timer = setInterval(() => {
      setActiveHop((prev) => {
        if (prev >= 5) {
          clearInterval(timer);
          setIsSimulating(false);
          return 5;
        }
        return prev + 1;
      });
    }, 1200);
  };

  return (
    <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6 text-white font-sans">
      <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase">
          <Globe className="w-4 h-4 text-red-500" />
          <span>The Internet — From Your NIC to a Global Network</span>
        </div>
        <button
          onClick={animateJourney}
          disabled={isSimulating}
          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Animate Internet Journey</span>
        </button>
      </div>

      {/* 5-Node Internet Highway */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs font-mono">
        {hops.map((h) => (
          <button
            key={h.num}
            onClick={() => setActiveHop(h.num)}
            className={\`p-4 rounded-xl border transition \${
              activeHop === h.num
                ? 'bg-red-500/20 border-red-500 font-bold shadow-lg shadow-red-500/20 scale-105'
                : 'bg-[#151922] border-[#242a38] text-gray-300 hover:border-gray-500'
            }\`}
          >
            <div className="text-[10px] text-gray-400 uppercase mb-1">HOP {h.num}</div>
            <div className="font-bold text-white mb-1">{h.title}</div>
            <div className="text-[10px] text-cyan-400 truncate">{h.node}</div>
          </button>
        ))}
      </div>

      {/* Active Hop Detailed Dossier */}
      <div className="p-5 bg-[#151922] border border-[#242a38] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs">
            <span className="text-red-400 font-bold uppercase">Active Stage {activeHop}: </span>
            <span className="text-white font-bold">{hops[activeHop - 1].title}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
            {hops[activeHop - 1].layer}
          </span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed font-sans sm:text-sm">
          {hops[activeHop - 1].desc}
        </p>

        <div className="p-3 bg-[#0a0c10] border border-[#242a38] rounded-lg text-xs font-mono text-gray-300">
          <strong className="text-yellow-400">Core Mental Model: </strong>
          Your device never sends an Ethernet frame directly to the remote server MAC. It sends the local frame to its Default Gateway; routers make Layer 3 forwarding decisions across autonomous systems until the destination is reached.
        </div>
      </div>
    </div>
  );
};
`;

// SubnettingToolkit.tsx
const subnettingToolkitCode = `import React, { useState } from 'react';
import { Calculator, CheckCircle2, RefreshCw, Layers, Award, Shield } from 'lucide-react';

export const SubnettingToolkit: React.FC = () => {
  // Bitwise AND Visualizer
  const [andIp, setAndIp] = useState('192.168.1.140');
  const [andCidr, setAndCidr] = useState(26);

  // Equal-Split Subnet Planner
  const [splitNet, setSplitNet] = useState('192.168.1.0');
  const [splitCidr, setSplitCidr] = useState(24);
  const [splitCount, setSplitCount] = useState(4);

  // Self-Check Drill State
  const [drillScore, setDrillScore] = useState(0);
  const [drillTarget, setDrillTarget] = useState({ ip: '192.168.10.50', cidr: 26, net: '192.168.10.0', bcast: '192.168.10.63', first: '192.168.10.1', last: '192.168.10.62' });
  const [userNet, setUserNet] = useState('');
  const [userBcast, setUserBcast] = useState('');
  const [userFirst, setUserFirst] = useState('');
  const [userLast, setUserLast] = useState('');
  const [drillResult, setDrillResult] = useState<string | null>(null);

  // Bitwise AND calculation
  const ipOcts = andIp.split('.').map((o) => parseInt(o, 10) || 0);
  while (ipOcts.length < 4) ipOcts.push(0);
  const maskOcts = [];
  for (let i = 0; i < 4; i++) {
    const b = Math.min(8, Math.max(0, andCidr - i * 8));
    let v = 0;
    for (let j = 0; j < b; j++) v += (1 << (7 - j));
    maskOcts.push(v);
  }
  const andNetOcts = ipOcts.map((o, i) => o & maskOcts[i]);

  const newDrill = () => {
    const oct3 = Math.floor(Math.random() * 200) + 1;
    const cidrs = [25, 26, 27, 28, 29, 30];
    const c = cidrs[Math.floor(Math.random() * cidrs.length)];
    const blockSize = Math.pow(2, 32 - c);
    const subnetIndex = Math.floor(Math.random() * (256 / blockSize));
    const netStart = subnetIndex * blockSize;
    const hostOffset = Math.floor(Math.random() * (blockSize - 2)) + 1;

    setDrillTarget({
      ip: \`192.168.\${oct3}.\${netStart + hostOffset}\`,
      cidr: c,
      net: \`192.168.\${oct3}.\${netStart}\`,
      bcast: \`192.168.\${oct3}.\${netStart + blockSize - 1}\`,
      first: \`192.168.\${oct3}.\${netStart + 1}\`,
      last: \`192.168.\${oct3}.\${netStart + blockSize - 2}\`
    });
    setUserNet('');
    setUserBcast('');
    setUserFirst('');
    setUserLast('');
    setDrillResult(null);
  };

  const checkDrill = () => {
    const ok = userNet.trim() === drillTarget.net &&
      userBcast.trim() === drillTarget.bcast &&
      userFirst.trim() === drillTarget.first &&
      userLast.trim() === drillTarget.last;

    if (ok) {
      setDrillScore((s) => s + 1);
      setDrillResult('Correct! All subnet boundaries matched perfectly.');
    } else {
      setDrillResult(\`Incorrect. Expected: Net=\${drillTarget.net}, Bcast=\${drillTarget.bcast}, First=\${drillTarget.first}, Last=\${drillTarget.last}\`);
    }
  };

  return (
    <div className="space-y-8 text-white font-sans">
      {/* 1. Bitwise AND Visualizer */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-bold uppercase">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Bitwise AND Visualizer (IP ? MASK = NETWORK)</span>
          </div>
          <span className="text-xs font-mono text-gray-400">ROUTER FORWARDING MATH</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <label className="text-gray-400 uppercase text-[10px] font-bold block mb-1">Target IP Address</label>
            <input
              type="text"
              value={andIp}
              onChange={(e) => setAndIp(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white font-bold"
            />
          </div>
          <div>
            <label className="text-gray-400 uppercase text-[10px] font-bold block mb-1">CIDR Prefix (/{andCidr})</label>
            <input
              type="range"
              min="1"
              max="32"
              value={andCidr}
              onChange={(e) => setAndCidr(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* 4 Octets Binary Alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="p-3 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-1">
              <span className="text-[10px] text-gray-400 block uppercase">Octet {idx + 1}</span>
              <div className="text-gray-300">IP: {ipOcts[idx].toString(2).padStart(8, '0')}</div>
              <div className="text-yellow-400">Mask: {maskOcts[idx].toString(2).padStart(8, '0')}</div>
              <div className="text-green-400 font-bold pt-1 border-t border-[#1e2430]">
                Net: {andNetOcts[idx].toString(2).padStart(8, '0')} ({andNetOcts[idx]})
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl font-mono text-xs flex items-center justify-between">
          <span>Resolved Network Address: <strong className="text-green-400">{andNetOcts.join('.')}</strong></span>
          <span className="text-gray-400">Mask: {maskOcts.join('.')}</span>
        </div>
      </div>

      {/* 2. Self-Check Interactive Subnetting Drills */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-yellow-400 font-bold uppercase">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Interactive Self-Check Subnetting Drills</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-green-400 font-bold">{drillScore} Correct</span>
            <button
              onClick={newDrill}
              className="px-3 py-1 rounded-lg bg-[#181c26] border border-[#242a38] hover:text-white text-xs font-mono text-gray-300 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>New Problem</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs font-mono">
          <span className="text-gray-400 uppercase text-[10px] block mb-1">Target Host Assignment</span>
          <div className="text-lg font-bold text-cyan-400">{drillTarget.ip} /{drillTarget.cidr}</div>
          <p className="text-gray-300 font-sans mt-1">Calculate the subnet boundary addresses for this host.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="text-gray-400 text-[10px] uppercase block mb-1">Network Address</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.0"
              value={userNet}
              onChange={(e) => setUserNet(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-gray-400 text-[10px] uppercase block mb-1">Broadcast Address</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.63"
              value={userBcast}
              onChange={(e) => setUserBcast(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-gray-400 text-[10px] uppercase block mb-1">First Usable Host</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.1"
              value={userFirst}
              onChange={(e) => setUserFirst(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="text-gray-400 text-[10px] uppercase block mb-1">Last Usable Host</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.62"
              value={userLast}
              onChange={(e) => setUserLast(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={checkDrill}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition font-mono"
          >
            Check Answers
          </button>

          {drillResult && (
            <div className={\`text-xs font-mono font-bold \${
              drillResult.startsWith('Correct') ? 'text-green-400' : 'text-red-400'
            }\`}>
              {drillResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/simulators/FailureSecuritySimulator.tsx', failureSecCode);
fs.writeFileSync('src/components/simulators/InternetRoutingVisualizer.tsx', internetRoutingCode);
fs.writeFileSync('src/components/simulators/SubnettingToolkit.tsx', subnettingToolkitCode);

console.log('FailureSecuritySimulator, InternetRoutingVisualizer, and SubnettingToolkit generated successfully');
