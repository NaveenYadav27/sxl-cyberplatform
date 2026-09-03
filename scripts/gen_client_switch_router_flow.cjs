const fs = require('fs');

const clientSwitchRouterFlowCode = `import React, { useState, useEffect } from 'react';
import { Laptop, Shuffle, Radio, Server, Play, Pause, RotateCcw, HelpCircle, FastForward, CheckCircle2, Shield, ArrowRight, Package } from 'lucide-react';

interface DeviceInfo {
  id: string;
  name: string;
  code: string;
  ip: string;
  mac: string;
  osiLayer: string;
  tcpLayer: string;
  protocol: string;
  role: string;
  hopDescription: string;
  securityImpact: string;
  icon: any;
}

const DEVICES: DeviceInfo[] = [
  {
    id: 'client',
    name: 'Client Workstation',
    code: 'PC-01',
    ip: '192.168.1.50',
    mac: '00:50:56:a1:b2:c3',
    osiLayer: 'L7 — Application (Originates L7-L1)',
    tcpLayer: 'L4 — Application',
    protocol: 'HTTP / TCP',
    role: 'Endpoint Client Originator',
    hopDescription: 'The client application generates an HTTP GET request, encapsulates it into a TCP segment (Port 54120 -> 80), wraps it in an IPv4 packet (192.168.1.50 -> 10.0.2.10), and places it in an Ethernet frame with Destination MAC set to the Default Gateway router.',
    securityImpact: 'Vulnerable to client-side malware, reverse shells, and unencrypted credential sniffing.',
    icon: Laptop
  },
  {
    id: 'switch',
    name: 'Access Switch',
    code: 'SW-1',
    ip: '192.168.1.2 (Management)',
    mac: '00:50:56:a1:b2:02',
    osiLayer: 'L2 — Data Link',
    tcpLayer: 'L1 — Network Interface',
    protocol: 'Ethernet (802.3)',
    role: 'Layer 2 Frame Forwarder',
    hopDescription: 'The switch inspects the Layer 2 Ethernet frame. It learns the client source MAC on Port 1, performs a CAM table lookup for the destination router MAC, and forwards the frame out Port 2. It does NOT modify the IP or MAC addresses.',
    securityImpact: 'Target of MAC Flooding (CAM Table Exhaustion) and ARP Poisoning attacks.',
    icon: Shuffle
  },
  {
    id: 'router',
    name: 'Default Gateway Router',
    code: 'RTR-1',
    ip: '192.168.1.1 / 10.0.2.1',
    mac: '00:50:56:a1:b2:01 (LAN) / 00:50:56:a1:b2:11 (WAN)',
    osiLayer: 'L3 — Network',
    tcpLayer: 'L2 — Internet',
    protocol: 'IPv4 / Routing',
    role: 'Layer 3 Packet Router & NAT',
    hopDescription: 'The router receives the frame on interface eth0, strips the Layer 2 header, inspects the destination IP (10.0.2.10), checks its routing table (Longest Prefix Match), decrements the TTL by 1 (64 -> 63), recalculates the IP checksum, prepends a new L2 frame with the Web Server destination MAC, and forwards the packet out interface eth1.',
    securityImpact: 'Critical boundary for ACL enforcement, anti-spoofing (uRPF), and NAT tracking.',
    icon: Radio
  },
  {
    id: 'server',
    name: 'Web Server',
    code: 'SRV-1',
    ip: '10.0.2.10:80',
    mac: '00:50:56:a1:b2:10',
    osiLayer: 'L7 — Application (Decapsulates L1-L7)',
    tcpLayer: 'L4 — Application',
    protocol: 'HTTP',
    role: 'Target Application Daemon',
    hopDescription: 'The server network interface receives the frame, decapsulates Layer 2 (MAC) -> Layer 3 (IP) -> Layer 4 (TCP socket on port 80) -> Layer 7 (HTTP parser). The web server daemon processes the GET request and generates an HTTP 200 OK response.',
    securityImpact: 'Target for Web application exploits (SQLi, RCE), SYN floods, and TLS downgrade attacks.',
    icon: Server
  }
];

export const ClientSwitchRouterFlow: React.FC = () => {
  const [activeDeviceIdx, setActiveDeviceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'return'>('forward');
  const [speed, setSpeed] = useState(1);
  const [showExplanation, setShowExplanation] = useState(true);

  const activeDevice = DEVICES[activeDeviceIdx];

  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 1600 / speed;
    const timer = setInterval(() => {
      setActiveDeviceIdx((prev) => {
        if (direction === 'forward') {
          if (prev < DEVICES.length - 1) {
            return prev + 1;
          } else {
            // Turn around
            setDirection('return');
            return prev - 1;
          }
        } else {
          if (prev > 0) {
            return prev - 1;
          } else {
            // Completed roundtrip
            setDirection('forward');
            setIsPlaying(false);
            return 0;
          }
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, direction, speed]);

  const handleSendRequest = () => {
    setDirection('forward');
    setActiveDeviceIdx(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStep = () => {
    setIsPlaying(false);
    setActiveDeviceIdx((prev) => (prev + 1) % DEVICES.length);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setDirection('forward');
    setActiveDeviceIdx(0);
  };

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-[#151922] border-b border-[#242a38] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">
              Client ? Switch ? Router ? Server
            </h3>
            <p className="text-xs text-gray-400">
              Click any device to inspect it. Press <strong>Send Request</strong> to watch an HTTP request travel hop by hop, with the OSI layer, protocol, and device updating live below.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm">
          LIVE TOPOLOGY
        </span>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div className="p-6 sm:p-10 bg-[#090b0f] relative overflow-hidden">
        {/* Animated Dashed Connection Line */}
        <div className="relative flex items-center justify-between max-w-4xl mx-auto py-8">
          {/* Background Track */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-red-500/60 z-0 animate-pulse"></div>

          {/* 4 Connected Nodes */}
          {DEVICES.map((dev, idx) => {
            const Icon = dev.icon;
            const isActive = activeDeviceIdx === idx;

            return (
              <div key={dev.id} className="relative z-10 flex flex-col items-center group">
                {/* Node Box with Red Glowing Ring when active */}
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveDeviceIdx(idx);
                  }}
                  className={\`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 relative \${
                    isActive
                      ? 'bg-red-500/20 border-red-500 ring-4 ring-red-500/30 scale-110 shadow-xl shadow-red-500/20'
                      : 'bg-[#151922] border-[#242a38] hover:border-gray-500 hover:scale-105'
                  }\`}
                >
                  <Icon className={\`w-7 h-7 sm:w-8 sm:h-8 transition-colors \${
                    isActive ? 'text-red-400' : 'text-gray-400 group-hover:text-white'
                  }\`} />

                  {/* Packet Indicator Package Icon */}
                  {isActive && (
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-600 text-white border-2 border-[#090b0f] flex items-center justify-center animate-bounce shadow-lg">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {/* Node Labels */}
                <div className="text-center mt-3 space-y-0.5">
                  <div className={\`font-bold text-xs sm:text-sm transition \${
                    isActive ? 'text-red-400 font-extrabold' : 'text-white'
                  }\`}>
                    {dev.name.split(' ')[0]}
                  </div>
                  <div className="text-[11px] font-mono text-gray-400">
                    {dev.code}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-Column Live Telemetry HUD Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#242a38] border-t border-b border-[#242a38] bg-[#12151c] text-xs">
        <div className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
            CURRENT DEVICE
          </span>
          <span className="font-bold text-white text-sm block truncate">
            {activeDevice.name} ({activeDevice.code})
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
            PROTOCOL
          </span>
          <span className="font-bold text-red-400 text-sm block font-mono truncate">
            {activeDevice.protocol}
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
            OSI LAYER
          </span>
          <span className="font-bold text-white text-sm block font-mono truncate">
            {activeDevice.osiLayer}
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
            TCP/IP LAYER
          </span>
          <span className="font-bold text-white text-sm block font-mono truncate">
            {activeDevice.tcpLayer}
          </span>
        </div>
      </div>

      {/* Control Buttons Row */}
      <div className="p-4 sm:p-5 bg-[#151922] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Send Request Primary Action */}
          <button
            onClick={handleSendRequest}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Send Request</span>
          </button>

          {/* Pause / Resume */}
          <button
            onClick={handlePause}
            className="px-3.5 py-2.5 rounded-xl bg-[#181c26] border border-[#242a38] text-gray-300 hover:text-white font-mono text-xs transition flex items-center gap-1.5"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>

          {/* Step */}
          <button
            onClick={handleStep}
            className="px-3.5 py-2.5 rounded-xl bg-[#181c26] border border-[#242a38] text-gray-300 hover:text-white font-mono text-xs transition flex items-center gap-1.5"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl bg-[#181c26] border border-[#242a38] text-gray-300 hover:text-white font-mono text-xs transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Explain */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={\`px-3.5 py-2.5 rounded-xl border font-mono text-xs transition flex items-center gap-1.5 \${
              showExplanation
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-[#181c26] text-gray-300 border-[#242a38] hover:text-white'
            }\`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explain</span>
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400">Speed:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="bg-[#181c26] border border-[#242a38] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x (Normal)</option>
            <option value="1.5">1.5x (Fast)</option>
            <option value="2">2x (Turbo)</option>
          </select>
        </div>
      </div>

      {/* Deep Hop Explanation Drawer */}
      {showExplanation && (
        <div className="p-5 sm:p-6 bg-[#0e1117] border-t border-[#242a38] text-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-red-400 font-bold uppercase">Hop {activeDeviceIdx + 1} of 4:</span>
              <span className="text-white font-bold text-sm">{activeDevice.name}</span>
              <span className="text-gray-400">({activeDevice.ip})</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">MAC: {activeDevice.mac}</span>
          </div>

          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-gray-200 leading-relaxed font-sans text-xs sm:text-sm">
            {activeDevice.hopDescription}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#12151c] border border-red-500/30 rounded-lg">
              <span className="font-mono uppercase text-red-400 font-bold text-[11px] block mb-1">
                Security Risk & Attack Vectors at this Hop:
              </span>
              <p className="text-gray-300 leading-relaxed">{activeDevice.securityImpact}</p>
            </div>

            <div className="p-3 bg-[#12151c] border border-green-500/30 rounded-lg">
              <span className="font-mono uppercase text-green-400 font-bold text-[11px] block mb-1">
                Diagnostic & Forensic Inspection:
              </span>
              <p className="text-gray-300 leading-relaxed">
                Inspect packet headers with Wireshark. Verify TTL decrement at Layer 3, Ethernet Source/Destination MAC rewriting, and TCP sequence synchronization.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/components/simulators/ClientSwitchRouterFlow.tsx', clientSwitchRouterFlowCode);
console.log('ClientSwitchRouterFlow.tsx generated successfully');
