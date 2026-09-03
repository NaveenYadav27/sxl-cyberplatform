const fs = require('fs');

const protocolLabsSuiteCode = `import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, AlertTriangle, Shield, HelpCircle, ArrowRight } from 'lucide-react';

interface ProtocolLab {
  id: string;
  title: string;
  category: string;
  scenario: string;
  steps: { pos: number; node: string; title: string; log: string; explain: string }[];
  challenge: { question: string; options: string[]; correctIdx: number; explanation: string };
}

const LABS_LIST: ProtocolLab[] = [
  {
    id: 'ip',
    title: 'IP Addressing & Network Boundaries',
    category: 'Addressing',
    scenario: 'PC-01 (192.168.1.10/24) sends a packet to Server (192.168.2.100/24). Because the destination is on a different subnet, the packet must be routed via the Default Gateway.',
    steps: [
      { pos: 0, node: 'PC-01', title: 'Route Evaluation', log: 'Destination 192.168.2.100 is off-subnet. PC-01 addresses frame to Gateway MAC.', explain: 'Local bitwise AND calculation determines destination is outside 192.168.1.0/24.' },
      { pos: 1, node: 'Switch', title: 'L2 Forwarding', log: 'Switch forwards frame to Gateway router interface port.', explain: 'The switch only inspects L2 destination MAC.' },
      { pos: 2, node: 'Router', title: 'L3 Forwarding', log: 'Router inspects IP 192.168.2.100, decrements TTL, rewrites L2 MAC header, and routes out eth1.', explain: 'Router forwards across network boundaries using routing table.' },
      { pos: 3, node: 'Server', title: 'Packet Arrival', log: 'Server receives packet on 192.168.2.100.', explain: 'Full L3 end-to-end delivery accomplished.' }
    ],
    challenge: {
      question: 'Why does PC-01 send the frame to the router MAC instead of the Server MAC?',
      options: [
        'Because the Server does not have a MAC address',
        'Because the Server is on a different subnet, requiring Layer 3 gateway routing',
        'Because switches block direct communication',
        'Because IP packets cannot travel across Ethernet'
      ],
      correctIdx: 1,
      explanation: 'Ethernet frames only travel within a single local broadcast domain. To cross subnets, the frame must be delivered to the Default Gateway router.'
    }
  },
  {
    id: 'switching',
    title: 'Switch CAM Table Learning & Flooding',
    category: 'Switching',
    scenario: 'PC-A sends a frame to PC-B. Watch the switch read the Source MAC to populate its CAM table before forwarding out the specific port.',
    steps: [
      { pos: 0, node: 'PC-A', title: 'Frame Transmission', log: 'PC-A sends frame with Source MAC AA:10.', explain: 'Frame enters switchport Fa0/1.' },
      { pos: 1, node: 'Switch', title: 'CAM Learning', log: 'Switch binds Fa0/1 -> AA:10 in MAC table.', explain: 'Switches always learn from the SOURCE MAC address.' },
      { pos: 2, node: 'Switch', title: 'Forwarding / Flood', log: 'Dest MAC known -> Forwarded out Port 3 only (No flooding).', explain: 'If dest MAC was unknown, the switch would flood out all other ports.' },
      { pos: 3, node: 'PC-B', title: 'Delivery', log: 'PC-B receives unicast frame.', explain: 'Unicast delivery completed at Layer 2.' }
    ],
    challenge: {
      question: 'What does a switch do if the Destination MAC address is not present in its CAM table?',
      options: [
        'Drops the frame immediately',
        'Floods the frame out all ports except the ingress port',
        'Sends an ICMP Host Unreachable error',
        'Forwards the frame directly to the default gateway'
      ],
      correctIdx: 1,
      explanation: 'Unknown unicast frames are flooded out all ports except the arrival port so the target host can respond and be learned.'
    }
  },
  {
    id: 'arp',
    title: 'ARP Resolution (Broadcast & Unicast)',
    category: 'Protocols',
    scenario: 'PC-01 knows the Server IP (192.168.1.20) but not its MAC. It broadcasts an ARP request (FF:FF:FF:FF:FF:FF) and receives a unicast ARP reply.',
    steps: [
      { pos: 0, node: 'PC-01', title: 'ARP Request', log: 'Who has 192.168.1.20? Tell 192.168.1.10 (Broadcast).', explain: 'Sent to MAC FF:FF:FF:FF:FF:FF.' },
      { pos: 1, node: 'Switch', title: 'Broadcast Flood', log: 'Switch floods broadcast to all ports.', explain: 'All local endpoints process the ARP request.' },
      { pos: 2, node: 'Server', title: 'ARP Reply', log: '192.168.1.20 is at AA:BB:CC:20 (Unicast).', explain: 'Server responds directly to PC-01 MAC.' },
      { pos: 3, node: 'PC-01', title: 'Cache Updated', log: 'PC-01 stores 192.168.1.20 -> AA:BB:CC:20 in ARP table.', explain: 'Subsequent frames skip ARP and transmit directly.' }
    ],
    challenge: {
      question: 'Why is the ARP Reply sent as a unicast rather than a broadcast?',
      options: [
        'Because broadcast replies are blocked by switches',
        'Because the target already knows the requester MAC from the ARP request header',
        'Because unicast packets travel faster',
        'Because ARP does not support broadcasts'
      ],
      correctIdx: 1,
      explanation: 'The ARP request includes the sender MAC, so the replier addresses the reply unicast directly back to the requester.'
    }
  }
];

export const ProtocolLabsSuite: React.FC = () => {
  const [activeLabId, setActiveLabId] = useState('ip');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAns, setUserAns] = useState<number | null>(null);

  const activeLab = LABS_LIST.find((l) => l.id === activeLabId) || LABS_LIST[0];

  const handleNextStep = () => {
    if (currentStep < activeLab.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6 text-white font-sans">
      <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase">
          <Shield className="w-4 h-4 text-red-500" />
          <span>Core Protocol & Perimeter Laboratory Suite</span>
        </div>
        <span className="text-xs font-mono text-gray-400">DATA-DRIVEN SIMULATION</span>
      </div>

      {/* Lab Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {LABS_LIST.map((lab) => (
          <button
            key={lab.id}
            onClick={() => { setActiveLabId(lab.id); setCurrentStep(0); setUserAns(null); }}
            className={\`px-3.5 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap \${
              activeLabId === lab.id
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                : 'bg-[#151922] text-gray-400 border border-[#242a38] hover:text-white'
            }\`}
          >
            {lab.title}
          </button>
        ))}
      </div>

      {/* Scenario Brief */}
      <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs space-y-1">
        <span className="text-yellow-400 font-bold uppercase text-[10px] block">Scenario:</span>
        <p className="text-gray-200 leading-relaxed font-sans">{activeLab.scenario}</p>
      </div>

      {/* Step Progression Canvas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        {activeLab.steps.map((st, idx) => (
          <div
            key={idx}
            className={\`p-3.5 rounded-xl border transition \${
              currentStep === idx
                ? 'bg-red-500/20 border-red-500 font-bold shadow-lg shadow-red-500/20'
                : currentStep > idx
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-[#151922] border-[#242a38] text-gray-400 opacity-60'
            }\`}
          >
            <div className="text-[10px] text-gray-400 uppercase mb-1">Step {idx + 1} ({st.node})</div>
            <div className="text-white font-bold mb-1">{st.title}</div>
            <div className="text-[11px] text-gray-300">{st.log}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleNextStep}
          disabled={currentStep >= activeLab.steps.length - 1}
          className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition disabled:opacity-40"
        >
          Step Next Hop ?
        </button>
        <button
          onClick={() => { setCurrentStep(0); setUserAns(null); }}
          className="px-3 py-2 rounded-lg bg-[#181c26] border border-[#242a38] text-gray-300 hover:text-white font-mono text-xs transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Lab Knowledge Verification Challenge */}
      <div className="p-5 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-3 text-xs">
        <span className="text-cyan-400 font-bold uppercase text-[10px] block font-mono">
          Lab Challenge Question:
        </span>
        <div className="text-white font-bold text-sm">{activeLab.challenge.question}</div>

        <div className="space-y-2">
          {activeLab.challenge.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setUserAns(i)}
              className={\`w-full text-left p-3 rounded-lg border text-xs font-mono transition flex items-center justify-between \${
                userAns === i
                  ? i === activeLab.challenge.correctIdx
                    ? 'bg-green-500/20 border-green-500 text-green-300 font-bold'
                    : 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                  : 'bg-[#151922] border-[#242a38] text-gray-300 hover:border-gray-500'
              }\`}
            >
              <span>{opt}</span>
              {userAns === i && (
                i === activeLab.challenge.correctIdx
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </button>
          ))}
        </div>

        {userAns !== null && (
          <div className="p-3 bg-[#12151c] border border-[#242a38] rounded-lg text-gray-300 text-xs font-sans leading-relaxed">
            {activeLab.challenge.explanation}
          </div>
        )}
      </div>
    </div>
  );
};
`;

const securityArenaLabsCode = `import React, { useState } from 'react';
import { ShieldAlert, Play, CheckCircle2, AlertOctagon, Terminal, Activity, ArrowRight } from 'lucide-react';

export const SecurityArenaLabs: React.FC = () => {
  const [selectedArena, setSelectedArena] = useState('synflood');
  const [revealedAnomaly, setRevealedAnomaly] = useState(false);

  const arenas: Record<string, { title: string; desc: string; baseline: string; anomaly: string; ioc: string; defense: string }> = {
    synflood: {
      title: 'SYN Flood Exhaustion (Port 443)',
      desc: 'Adversary floods target server with 50,000 TCP SYN packets per second without returning final ACK completions, exhausting kernel connection backlog tables.',
      baseline: 'Normal baseline: ~10 SYNs/sec with completed 3-way handshakes and valid HTTP requests.',
      anomaly: 'Anomaly: High ratio of half-open TCP connections in SYN_RCVD state from spoofed IP addresses.',
      ioc: 'Wireshark: tcp.flags.syn==1 && tcp.flags.ack==0 at >10,000 PPS without ACK response.',
      defense: 'Enable net.ipv4.tcp_syncookies = 1 and configure upstream DDoS SYN proxy protection.'
    },
    arpspoof: {
      title: 'ARP Cache Poisoning & Man-in-the-Middle',
      desc: 'Adversary broadcasts unsolicited Gratuitous ARP replies mapping Default Gateway IP (192.168.1.1) to Attacker MAC (AA:BB:CC:99:99).',
      baseline: 'Normal baseline: 192.168.1.1 is statically bound to legitimate router MAC AA:BB:CC:01:01.',
      anomaly: 'Anomaly: Host ARP cache overwritten; all outbound WAN traffic routes through attacker.',
      ioc: 'Wireshark: Duplicate IP response with changed MAC address; rapid gratuitous ARP rate.',
      defense: 'Enable Dynamic ARP Inspection (DAI) and DHCP Snooping on all switch access ports.'
    },
    portscan: {
      title: 'Nmap TCP SYN Stealth Port Scan',
      desc: 'External scanner sends rapid TCP SYN probes across ports 21, 22, 80, 443, 445, 3389, and 8080 within 90 milliseconds.',
      baseline: 'Normal baseline: Legitimate users only connect to advertised services (80/443).',
      anomaly: 'Anomaly: Sequential port hits from single external IP with immediate RST tearing down sessions.',
      ioc: 'Snort Rule: alert tcp $EXTERNAL_NET any -> $HOME_NET any (flags: S; threshold: type threshold, track by_src, count 20, seconds 2;)',
      defense: 'Deploy automated IP rate-limiting and drop external scanning traffic at perimeter edge.'
    },
    dnsanomaly: {
      title: 'DNS Tunneling C2 & Data Exfiltration',
      desc: 'Malware encodes stolen corporate PII records inside high-entropy subdomains of attacker-controlled authoritative nameserver.',
      baseline: 'Normal baseline: Short, dictionary-based DNS queries (e.g. mail.google.com).',
      anomaly: 'Anomaly: Continuous long subdomains (60+ characters) with Shannon entropy > 3.8.',
      ioc: 'Query log: a8f912c9b1e9.tunnel.evil-c2.net on UDP 53.',
      defense: 'Enforce internal recursive DNS resolvers and block outbound UDP 53 from all endpoints.'
    }
  };

  const cur = arenas[selectedArena];

  return (
    <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6 text-white font-sans">
      <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>Security Arena — Synthetic Anomaly Investigation</span>
        </div>
        <span className="text-xs font-mono text-gray-400">EDUCATIONAL THREAT MODELS</span>
      </div>

      {/* Arena Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        {Object.keys(arenas).map((key) => (
          <button
            key={key}
            onClick={() => { setSelectedArena(key); setRevealedAnomaly(false); }}
            className={\`p-3 rounded-xl border text-left transition \${
              selectedArena === key
                ? 'bg-red-500/20 border-red-500 font-bold shadow-lg'
                : 'bg-[#151922] border-[#242a38] text-gray-400 hover:border-gray-500'
            }\`}
          >
            <div className="text-white font-bold">{arenas[key].title.split(' ')[0]} {arenas[key].title.split(' ')[1]}</div>
          </button>
        ))}
      </div>

      <div className="p-5 bg-[#151922] border border-[#242a38] rounded-xl space-y-4">
        <div>
          <h3 className="font-bold text-base text-white">{cur.title}</h3>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">{cur.desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#0a0c10] border border-green-500/30 rounded-xl space-y-1">
            <span className="text-green-400 font-bold uppercase text-[10px] block">Normal Baseline:</span>
            <p className="text-gray-300 font-sans">{cur.baseline}</p>
          </div>

          <div className="p-4 bg-[#0a0c10] border border-red-500/30 rounded-xl space-y-1">
            <span className="text-red-400 font-bold uppercase text-[10px] block">Threat Anomaly:</span>
            <p className="text-red-200 font-sans">{cur.anomaly}</p>
          </div>
        </div>

        {/* IOC & Defense */}
        <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl text-xs font-mono space-y-2">
          <span className="text-yellow-400 font-bold uppercase text-[10px] block">Observed IOC Signature:</span>
          <pre className="text-cyan-300 whitespace-pre-wrap">{cur.ioc}</pre>
        </div>

        <div className="p-4 bg-[#181c26] border border-green-500/30 rounded-xl text-xs space-y-1">
          <span className="text-green-400 font-mono font-bold uppercase text-[10px] block">Recommended Hardening:</span>
          <p className="text-gray-300 font-sans">{cur.defense}</p>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/simulators/ProtocolLabsSuite.tsx', protocolLabsSuiteCode);
fs.writeFileSync('src/components/simulators/SecurityArenaLabs.tsx', securityArenaLabsCode);

console.log('ProtocolLabsSuite and SecurityArenaLabs generated successfully');
