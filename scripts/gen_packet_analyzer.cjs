const fs = require('fs');

const packetAnalyzerCode = `import React, { useState } from 'react';
import { SIMULATED_PACKETS } from '../../data/simulatedPackets';
import { Packet } from '../../types';
import { Filter, AlertTriangle, RefreshCw } from 'lucide-react';

export const PacketAnalyzer: React.FC = () => {
  const [filterInput, setFilterInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<Packet>(SIMULATED_PACKETS[0]);
  const [followStream, setFollowStream] = useState(false);

  const filteredPackets = SIMULATED_PACKETS.filter((p) => {
    if (!activeFilter.trim()) return true;
    const f = activeFilter.toLowerCase();
    if (f === 'tcp') return p.protocol === 'TCP';
    if (f === 'dns') return p.protocol === 'DNS';
    if (f.includes('443')) return p.dstPort === 443 || p.srcPort === 443;
    if (f.includes('4444')) return p.dstPort === 4444 || p.srcPort === 4444;
    if (f.includes('syn')) return p.flags?.includes('SYN');
    return p.info.toLowerCase().includes(f) || p.srcIp.includes(f) || p.dstIp.includes(f);
  });

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 bg-[#151922] border-b border-[#242a38] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Filter className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder='Apply Wireshark display filter (e.g. "tcp", "dns", "4444")...'
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveFilter(filterInput)}
            className="w-full bg-[#181c26] border border-[#242a38] rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => setActiveFilter(filterInput)}
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition"
          >
            Apply
          </button>
          <button
            onClick={() => { setFilterInput(''); setActiveFilter(''); }}
            className="p-1.5 rounded bg-[#181c26] text-gray-400 hover:text-white"
            title="Clear filter"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setFollowStream(!followStream)}
          className={\`px-3 py-1.5 rounded border text-xs font-mono font-bold transition \${
            followStream ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-[#181c26] text-gray-300 border-[#242a38] hover:text-white'
          }\`}
        >
          {followStream ? 'Close Stream' : 'Follow TCP Stream'}
        </button>
      </div>

      <div className="max-h-[220px] overflow-y-auto border-b border-[#242a38] bg-[#0d1017]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-[#151922] border-b border-[#242a38] text-gray-400 uppercase text-[10px]">
            <tr>
              <th className="py-1.5 pl-3">No.</th>
              <th className="py-1.5">Time</th>
              <th className="py-1.5">Source</th>
              <th className="py-1.5">Destination</th>
              <th className="py-1.5">Proto</th>
              <th className="py-1.5">Len</th>
              <th className="py-1.5 pr-3">Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d26]">
            {filteredPackets.map((pkt, idx) => (
              <tr
                key={pkt.id}
                onClick={() => setSelectedPacket(pkt)}
                className={\`cursor-pointer transition \${
                  selectedPacket.id === pkt.id
                    ? 'bg-cyan-500/20 text-white font-semibold'
                    : pkt.anomalyFlag
                    ? 'bg-red-500/10 text-red-300 hover:bg-red-500/15'
                    : 'text-gray-300 hover:bg-[#151922]'
                }\`}
              >
                <td className="py-1.5 pl-3 text-gray-400">{idx + 1}</td>
                <td className="py-1.5 text-gray-400">{pkt.timestamp}</td>
                <td className="py-1.5">{pkt.srcIp}</td>
                <td className="py-1.5">{pkt.dstIp}</td>
                <td className="py-1.5 font-bold text-cyan-400">{pkt.protocol}</td>
                <td className="py-1.5 text-gray-400">{pkt.length}</td>
                <td className="py-1.5 pr-3 truncate max-w-xs">{pkt.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {followStream && (
        <div className="p-4 bg-[#0a0c10] border-b border-[#242a38] font-mono text-xs">
          <div className="flex items-center justify-between mb-2 text-red-400 font-bold uppercase text-[11px]">
            <span>Reconstructed TCP Application Payload (Stream #0)</span>
            <span>{selectedPacket.srcIp}:{selectedPacket.srcPort} ? {selectedPacket.dstIp}:{selectedPacket.dstPort}</span>
          </div>
          <div className="p-3 bg-[#12151c] border border-red-500/30 rounded-lg text-red-300 whitespace-pre-wrap leading-relaxed">
            {selectedPacket.payloadAscii || 'No readable ASCII payload in selected packet.'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#242a38] bg-[#12151c] text-xs">
        <div className="p-4 space-y-3 max-h-[260px] overflow-y-auto">
          <div className="font-mono text-gray-400 uppercase text-[11px] font-bold">Packet Protocol Tree Dissection</div>
          {selectedPacket.anomalyFlag && (
            <div className="p-2.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">SOC Threat Flag: </span>
                <span>{selectedPacket.anomalyDescription}</span>
              </div>
            </div>
          )}
          <div className="space-y-1.5 text-gray-300 font-mono text-[11px]">
            <div className="p-2 rounded bg-[#181c26] border border-[#242a38]"><span className="text-gray-400">Frame: </span><span>{selectedPacket.length} bytes on wire</span></div>
            {selectedPacket.layerDetails.ethernet && <div className="p-2 rounded bg-[#181c26] border border-[#242a38]"><span className="text-purple-400 font-bold">Ethernet II: </span><span>Src: {selectedPacket.layerDetails.ethernet.src}, Dst: {selectedPacket.layerDetails.ethernet.dst}</span></div>}
            {selectedPacket.layerDetails.ip && <div className="p-2 rounded bg-[#181c26] border border-[#242a38]"><span className="text-blue-400 font-bold">IPv4: </span><span>Src: {selectedPacket.layerDetails.ip.src}, Dst: {selectedPacket.layerDetails.ip.dst}, TTL: {selectedPacket.layerDetails.ip.ttl}</span></div>}
            {selectedPacket.layerDetails.transport && <div className="p-2 rounded bg-[#181c26] border border-[#242a38]"><span className="text-cyan-400 font-bold">{selectedPacket.protocol}: </span><span>Src Port: {selectedPacket.layerDetails.transport.srcPort}, Dst Port: {selectedPacket.layerDetails.transport.dstPort}</span></div>}
          </div>
        </div>

        <div className="p-4 bg-[#090b0f] font-mono text-[11px] max-h-[260px] overflow-y-auto">
          <div className="text-gray-400 uppercase text-[11px] font-bold mb-2">Raw Hex Dump</div>
          <pre className="text-cyan-300 leading-relaxed whitespace-pre-wrap">{selectedPacket.payloadHex}</pre>
          <div className="mt-3 pt-2 border-t border-[#1c222e] text-gray-300">
            <span className="text-gray-400 block mb-1 text-[10px] uppercase">ASCII Decoding:</span>
            <pre className="text-green-300 leading-relaxed whitespace-pre-wrap">{selectedPacket.payloadAscii}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

const tcpSimulatorCode = `import React, { useState } from 'react';
import { Play, RotateCcw, AlertOctagon, CheckCircle2, Shield } from 'lucide-react';

export const TCPHandshakeSimulator: React.FC = () => {
  const [step, setStep] = useState(0);
  const [synFloodMode, setSynFloodMode] = useState(false);
  const [synCookiesEnabled, setSynCookiesEnabled] = useState(false);

  const steps = [
    { name: '1. Client Initiates SYN', desc: 'Client sends SYN (Seq=1000, Ack=0, Len=0). Client state -> SYN_SENT.', flag: 'SYN' },
    { name: '2. Server Responds SYN-ACK', desc: 'Server acknowledges SYN by requesting byte 1001 and sends its own SYN (Seq=5000, Ack=1001). Server state -> SYN_RCVD.', flag: 'SYN, ACK' },
    { name: '3. Client Completes Handshake (ACK)', desc: 'Client sends ACK (Seq=1001, Ack=5001). Connection is now ESTABLISHED on both sides.', flag: 'ACK' },
    { name: '4. Bidirectional Data Transmission', desc: 'Client sends HTTP GET request (Seq=1001, Len=240). Server ACKs byte 1241.', flag: 'PSH, ACK' },
    { name: '5. Connection Teardown (FIN-ACK)', desc: 'Client initiates FIN teardown. Server responds with ACK followed by FIN-ACK.', flag: 'FIN, ACK' }
  ];

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white">TCP 3-Way Handshake & State Machine</h3>
          <p className="text-xs text-gray-400">Step-by-step state progression and SYN flood resilience engine</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setSynFloodMode(!synFloodMode)}
            className={\`px-3 py-1.5 rounded-lg border transition font-bold \${
              synFloodMode ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-[#181c26] text-gray-300 border-[#242a38] hover:text-white'
            }\`}
          >
            {synFloodMode ? 'SYN Flood Active!' : 'Simulate SYN Flood'}
          </button>
          {synFloodMode && (
            <button
              onClick={() => setSynCookiesEnabled(!synCookiesEnabled)}
              className={\`px-3 py-1.5 rounded-lg border transition font-bold \${
                synCookiesEnabled ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-[#181c26] text-yellow-400 border-yellow-500/40'
              }\`}
            >
              {synCookiesEnabled ? 'SYN Cookies: ON' : 'Enable SYN Cookies'}
            </button>
          )}
        </div>
      </div>

      {synFloodMode ? (
        <div className="p-4 bg-[#0a0c10] border border-red-500/30 rounded-xl mb-6 font-mono text-xs">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-2 uppercase">
            <AlertOctagon className="w-4 h-4" />
            <span>SYN Flood Attack In Progress (50,000 half-open SYNs/sec)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-300">
            <div className="p-3 bg-[#151922] border border-[#242a38] rounded">
              <span className="text-gray-400 block text-[10px]">Server Backlog:</span>
              <span className="text-red-400 font-bold text-sm">{synCookiesEnabled ? 'Protected via Hash' : '1024 / 1024 (EXHAUSTED)'}</span>
            </div>
            <div className="p-3 bg-[#151922] border border-[#242a38] rounded">
              <span className="text-gray-400 block text-[10px]">Legitimate Users:</span>
              <span className={\`font-bold text-sm \${synCookiesEnabled ? 'text-green-400' : 'text-red-400'}\`}>
                {synCookiesEnabled ? 'Able to connect' : 'Connection Timed Out (DoS)'}
              </span>
            </div>
            <div className="p-3 bg-[#151922] border border-[#242a38] rounded">
              <span className="text-gray-400 block text-[10px]">Kernel Defense:</span>
              <span className="text-cyan-400 font-bold">{synCookiesEnabled ? 'net.ipv4.tcp_syncookies = 1' : 'Disabled (Default)'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs font-mono">
            <span className="text-gray-400 uppercase text-[10px] block mb-2 font-bold">Client State Machine (192.168.1.50)</span>
            <div className="text-cyan-400 text-sm font-bold">{step === 0 ? 'CLOSED' : step === 1 ? 'SYN_SENT' : step === 2 ? 'SYN_SENT' : step >= 3 && step <= 4 ? 'ESTABLISHED' : 'TIME_WAIT'}</div>
          </div>
          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs font-mono">
            <span className="text-gray-400 uppercase text-[10px] block mb-2 font-bold">Server State Machine (10.0.2.10:443)</span>
            <div className="text-green-400 text-sm font-bold">{step === 0 ? 'LISTEN' : step === 1 ? 'LISTEN' : step === 2 ? 'SYN_RCVD' : step >= 3 && step <= 4 ? 'ESTABLISHED' : 'CLOSED'}</div>
          </div>
        </div>
      )}

      {/* Handshake Stepper */}
      <div className="space-y-2 mb-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className={\`p-3.5 rounded-lg border text-xs transition flex items-start justify-between gap-4 \${
              step === idx + 1
                ? 'bg-red-500/15 border-red-500 text-white font-medium shadow-md'
                : step > idx + 1
                ? 'bg-[#151922] border-green-500/30 text-gray-400'
                : 'bg-[#151922] border-[#242a38] text-gray-400 opacity-60'
            }\`}
          >
            <div>
              <div className="font-bold font-mono text-white text-xs mb-1">{s.name}</div>
              <p className="text-gray-300 text-xs leading-relaxed">{s.desc}</p>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#181c26] border border-[#242a38] text-yellow-400 whitespace-nowrap">
              {s.flag}
            </span>
          </div>
        ))}
      </div>

      {/* Stepper Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep((prev) => Math.min(steps.length, prev + 1))}
          disabled={step >= steps.length}
          className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Next Handshake Step</span>
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

fs.writeFileSync('src/components/simulators/PacketAnalyzer.tsx', packetAnalyzerCode);
fs.writeFileSync('src/components/simulators/TCPHandshakeSimulator.tsx', tcpSimulatorCode);

console.log('PacketAnalyzer.tsx and TCPHandshakeSimulator.tsx generated successfully');
