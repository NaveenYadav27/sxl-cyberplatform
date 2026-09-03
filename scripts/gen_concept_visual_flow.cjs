const fs = require('fs');

const conceptVisualFlowCode = `import React, { useState, useEffect } from 'react';
import { Concept } from '../../types';
import { Play, Pause, RotateCcw, Shield, AlertTriangle, ArrowRight, Laptop, Server, Router, Globe, Lock, Activity, Layers, CheckCircle2, ChevronRight } from 'lucide-react';

interface ConceptVisualFlowProps {
  concept: Concept;
}

export const ConceptVisualFlow: React.FC<ConceptVisualFlowProps> = ({ concept }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'normal' | 'attack'>('normal');

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Client-Server vs Reverse Shell Visual Flow (c-01-01)
  if (concept.id === 'c-01-01') {
    return (
      <div className="p-5 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-4 font-sans shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2430] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase">
            <Activity className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Interactive Visual Flow: Connection Architecture</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('normal'); setActiveStep(0); }}
              className={\`px-3 py-1 rounded text-xs font-mono transition font-bold \${
                mode === 'normal'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-[#151922] text-gray-400 border border-[#242a38] hover:text-white'
              }\`}
            >
              Standard Client-Server (Inbound)
            </button>
            <button
              onClick={() => { setMode('attack'); setActiveStep(0); }}
              className={\`px-3 py-1 rounded text-xs font-mono transition font-bold \${
                mode === 'attack'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-[#151922] text-gray-400 border border-[#242a38] hover:text-white'
              }\`}
            >
              Adversary Reverse Shell (Outbound C2)
            </button>
          </div>
        </div>

        {/* Visual Animated Diagram */}
        <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
            {/* Node 1 */}
            <div className="p-4 bg-[#181c26] border border-[#2e374a] rounded-xl space-y-2">
              <Laptop className={\`w-8 h-8 mx-auto \${mode === 'attack' ? 'text-red-400 animate-pulse' : 'text-cyan-400'}\`} />
              <div className="font-bold text-xs text-white">
                {mode === 'normal' ? 'Client Workstation' : 'Compromised Target Host'}
              </div>
              <div className="text-[11px] font-mono text-gray-400">192.168.1.50:54120</div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242a38] text-gray-300 block">
                {mode === 'normal' ? 'Initiates Outbound Request' : 'Executes /bin/sh Reverse Connection'}
              </span>
            </div>

            {/* Middle Firewall Gateway */}
            <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl space-y-2 relative">
              <Shield className="w-8 h-8 mx-auto text-yellow-400" />
              <div className="font-bold text-xs text-white">Perimeter Firewall</div>
              <div className="text-[11px] font-mono text-gray-400">Policy: Egress Allowed</div>
              <div className={\`p-2 rounded text-[11px] font-mono font-bold \${
                mode === 'normal'
                  ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                  : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
              }\`}>
                {mode === 'normal' ? 'Permits Inbound to Port 443' : 'Bypasses Inbound Blocks (Outbound Traffic)'}
              </div>
            </div>

            {/* Node 2 */}
            <div className="p-4 bg-[#181c26] border border-[#2e374a] rounded-xl space-y-2">
              <Server className={\`w-8 h-8 mx-auto \${mode === 'attack' ? 'text-red-500' : 'text-green-400'}\`} />
              <div className="font-bold text-xs text-white">
                {mode === 'normal' ? 'HTTPS Web Server' : 'Attacker C2 Listener'}
              </div>
              <div className="text-[11px] font-mono text-gray-400">
                {mode === 'normal' ? '10.0.2.10:443 (LISTEN)' : '198.51.100.42:4444 (LISTEN)'}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242a38] text-gray-300 block">
                {mode === 'normal' ? 'Accepts Inbound Client Socket' : 'Receives Root Shell Socket'}
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-step Explanation Drawer */}
        <div className="p-4 bg-[#151922] border border-[#242a38] rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between font-mono font-bold text-yellow-400 uppercase text-[11px]">
            <span>Security Flow Analysis: {mode === 'normal' ? 'Standard Inbound Flow' : 'Reverse Shell Inversion'}</span>
            <span>Step {activeStep + 1} of 4</span>
          </div>

          <p className="text-gray-300 leading-relaxed">
            {mode === 'normal'
              ? 'Client creates an ephemeral port socket (54120) and sends a TCP SYN to port 443. The firewall allows the stateful session and the server daemon accepts the connection.'
              : 'The attacker cannot connect directly into the internal host due to the perimeter firewall. Instead, malware on the internal victim initiates an OUTBOUND connection to the attacker IP:4444. Because firewalls typically allow outbound traffic, the connection succeeds, granting an interactive shell.'}
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-[#1e2430] text-[11px] font-mono">
            <span className="text-cyan-400">Socket: {mode === 'normal' ? '192.168.1.50:54120 -> 10.0.2.10:443' : '192.168.1.50:52418 -> 198.51.100.42:4444'}</span>
            <span className="text-green-400 font-bold">Mitigation: Egress Filtering on Outbound Ports</span>
          </div>
        </div>
      </div>
    );
  }

  // Network Types & Trust Zones (c-01-02)
  if (concept.id === 'c-01-02') {
    return (
      <div className="p-5 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-4 font-sans shadow-inner">
        <div className="flex items-center justify-between border-b border-[#1e2430] pb-3 font-mono text-xs text-red-400 font-bold uppercase">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <span>Interactive Visual Flow: DMZ & Segmentation Boundaries</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
          <div className="p-4 bg-[#151922] border border-red-500/30 rounded-xl space-y-1">
            <Globe className="w-6 h-6 mx-auto text-red-400" />
            <div className="font-bold text-white">Untrusted Internet</div>
            <div className="text-[10px] text-gray-400">WAN Zone</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 block">Trust Level: 0</span>
          </div>

          <div className="p-4 bg-[#151922] border border-yellow-500/30 rounded-xl space-y-1">
            <Server className="w-6 h-6 mx-auto text-yellow-400" />
            <div className="font-bold text-white">DMZ Subnet</div>
            <div className="text-[10px] text-gray-400">Web / Mail (10.0.2.0/24)</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 block">Semi-Trusted</span>
          </div>

          <div className="p-4 bg-[#151922] border border-blue-500/30 rounded-xl space-y-1">
            <Laptop className="w-6 h-6 mx-auto text-blue-400" />
            <div className="font-bold text-white">Corporate LAN</div>
            <div className="text-[10px] text-gray-400">Clients (10.0.1.0/24)</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 block">Internal Trusted</span>
          </div>

          <div className="p-4 bg-[#151922] border border-green-500/30 rounded-xl space-y-1">
            <Lock className="w-6 h-6 mx-auto text-green-400" />
            <div className="font-bold text-white">Database Vault</div>
            <div className="text-[10px] text-gray-400">PII Data (10.0.3.0/24)</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 block">Crown Jewels</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg text-xs space-y-1">
          <span className="font-mono text-red-400 font-bold uppercase text-[11px] block">Architectural Defense Rule:</span>
          <p className="text-gray-300">
            Perimeter firewalls permit Internet traffic strictly into the DMZ. The internal firewall prohibits DMZ servers from initiating sessions into the Corporate LAN or Database Vault, containing intrusions to the DMZ.
          </p>
        </div>
      </div>
    );
  }

  // North-South vs East-West Traffic Flow (c-01-03)
  if (concept.id === 'c-01-03') {
    return (
      <div className="p-5 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-4 font-sans shadow-inner">
        <div className="flex items-center justify-between border-b border-[#1e2430] pb-3 font-mono text-xs text-red-400 font-bold uppercase">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            <span>Interactive Visual Flow: North-South vs East-West Dynamics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#12151c] border border-cyan-500/30 rounded-xl space-y-2">
            <span className="text-cyan-400 font-bold uppercase text-[11px] block">North-South (Perimeter Cross-Boundary)</span>
            <div className="p-3 bg-[#181c26] rounded-lg text-gray-300 space-y-1">
              <div className="text-white font-bold">Client ? Perimeter Firewall ? Internet</div>
              <p className="text-gray-400 text-[11px] font-sans">
                Traffic entering or leaving the enterprise perimeter. Inspected by edge Next-Gen Firewalls and web proxies.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#12151c] border border-red-500/30 rounded-xl space-y-2">
            <span className="text-red-400 font-bold uppercase text-[11px] block">East-West (Lateral Internal Movement)</span>
            <div className="p-3 bg-[#181c26] rounded-lg text-gray-300 space-y-1">
              <div className="text-white font-bold">Workstation A ? Core Switch ? Workstation B (SMB:445)</div>
              <p className="text-gray-400 text-[11px] font-sans">
                Over 80% of enterprise traffic. Traditional perimeter firewalls never see this lateral traffic without internal microsegmentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Encapsulation & Decapsulation (c-02-01)
  if (concept.id === 'c-02-01') {
    return (
      <div className="p-5 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-4 font-sans shadow-inner">
        <div className="flex items-center justify-between border-b border-[#1e2430] pb-3 font-mono text-xs text-red-400 font-bold uppercase">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <span>Interactive Visual Flow: Multi-Layer Protocol Encapsulation</span>
          </div>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
            <div>
              <span className="text-red-400 font-bold">Layer 7 (Application): </span>
              <span className="text-white">Payload Data (HTTP GET /index.html)</span>
            </div>
            <span className="text-[10px] text-gray-400">PDU: Data</span>
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
            <div>
              <span className="text-yellow-400 font-bold">Layer 4 (Transport): </span>
              <span className="text-white">[TCP Header: SrcPort=54120, DstPort=443, Seq=1000] + Data</span>
            </div>
            <span className="text-[10px] text-gray-400">PDU: Segment</span>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-blue-400 font-bold">Layer 3 (Network): </span>
              <span className="text-white">[IPv4 Header: SrcIP=192.168.1.50, DstIP=10.0.2.10, TTL=64] + Segment</span>
            </div>
            <span className="text-[10px] text-gray-400">PDU: Packet</span>
          </div>

          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-purple-400 font-bold">Layer 2 (Data Link): </span>
              <span className="text-white">[Ethernet Frame: SrcMAC, DstMAC, EtherType=0x0800] + Packet + [FCS/CRC32]</span>
            </div>
            <span className="text-[10px] text-gray-400">PDU: Frame</span>
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
            <div>
              <span className="text-green-400 font-bold">Layer 1 (Physical): </span>
              <span className="text-cyan-300 tracking-widest">01001100 01101111 01100001 01100100</span>
            </div>
            <span className="text-[10px] text-gray-400">PDU: Bits</span>
          </div>
        </div>
      </div>
    );
  }

  // Generic Interactive Visual Flow for any concept
  return (
    <div className="p-5 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-4 font-sans shadow-inner">
      <div className="flex items-center justify-between border-b border-[#1e2430] pb-3">
        <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span>Interactive Visual Flow: {concept.title}</span>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1f2533] text-gray-400">
          Digital Twin Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs font-mono">
        <div className="p-4 bg-[#12151c] border border-cyan-500/30 rounded-xl space-y-1">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto font-bold">1</div>
          <div className="font-bold text-white">Source / Protocol Origin</div>
          <p className="text-[11px] text-gray-400 font-sans">{concept.shortDesc}</p>
        </div>

        <div className="p-4 bg-[#12151c] border border-yellow-500/30 rounded-xl space-y-1">
          <div className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto font-bold">2</div>
          <div className="font-bold text-white">Inspection / Network Hop</div>
          <p className="text-[11px] text-gray-400 font-sans">{concept.attackSurface}</p>
        </div>

        <div className="p-4 bg-[#12151c] border border-green-500/30 rounded-xl space-y-1">
          <div className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto font-bold">3</div>
          <div className="font-bold text-white">Defense & Verification</div>
          <p className="text-[11px] text-gray-400 font-sans">{concept.defenseControl}</p>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/common/ConceptVisualFlow.tsx', conceptVisualFlowCode);
console.log('ConceptVisualFlow.tsx generated successfully');
