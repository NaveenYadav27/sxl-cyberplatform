const fs = require('fs');

const code = `import React, { useState } from 'react';
import { Laptop, Cpu, Hash, Layers, ArrowRight, Play, RotateCcw, AlertTriangle, CheckCircle2, Shield, Wrench, RefreshCw, Radio } from 'lucide-react';

export const FoundationsVisualEngine: React.FC = () => {
  // Concept flow state
  const [activeConcept, setActiveConcept] = useState('computer');

  // Binary Workbench State
  const [bits, setBits] = useState<number[]>([1, 1, 0, 0, 0, 0, 0, 0]); // 192
  const [decInput, setDecInput] = useState('192');
  const [binInput, setBinInput] = useState('11000000');

  // IPv4 State
  const [o1, setO1] = useState(192);
  const [o2, setO2] = useState(168);
  const [o3, setO3] = useState(1);
  const [o4, setO4] = useState(10);
  const [cidr, setCidr] = useState(24);

  // ARP Simulation State
  const [arpRunning, setArpRunning] = useState(false);
  const [arpStep, setArpStep] = useState(0);

  // Trace State
  const [traceStep, setTraceStep] = useState(0);
  const [traceRunning, setTraceRunning] = useState(false);

  // Break/Fix State
  const [activeFault, setActiveFault] = useState<string | null>(null);

  const bitWeights = [128, 64, 32, 16, 8, 4, 2, 1];
  const decimalValue = bits.reduce((acc, b, idx) => acc + (b ? bitWeights[idx] : 0), 0);

  const toggleBit = (index: number) => {
    const newBits = [...bits];
    newBits[index] = newBits[index] ? 0 : 1;
    setBits(newBits);
    const newDec = newBits.reduce((acc, b, idx) => acc + (b ? bitWeights[idx] : 0), 0);
    setDecInput(newDec.toString());
    setBinInput(newBits.join(''));
  };

  const handleDecChange = (val: string) => {
    setDecInput(val);
    const n = Math.min(255, Math.max(0, parseInt(val, 10) || 0));
    const newBits = [];
    for (let i = 7; i >= 0; i--) {
      newBits.push((n & (1 << i)) ? 1 : 0);
    }
    setBits(newBits);
    setBinInput(newBits.join(''));
  };

  const handleBinChange = (val: string) => {
    setBinInput(val);
    const clean = val.replace(/[^01]/g, '').padEnd(8, '0').slice(0, 8);
    const newBits = clean.split('').map((c) => parseInt(c, 10));
    setBits(newBits);
    const newDec = newBits.reduce((acc, b, idx) => acc + (b ? bitWeights[idx] : 0), 0);
    setDecInput(newDec.toString());
  };

  // IPv4 calculations
  const calculateSubnet = () => {
    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);
    const maskOctets = [];
    for (let i = 0; i < 4; i++) {
      const bitsInOctet = Math.min(8, Math.max(0, cidr - i * 8));
      let octetVal = 0;
      for (let b = 0; b < bitsInOctet; b++) octetVal += (1 << (7 - b));
      maskOctets.push(octetVal);
    }
    const net1 = o1 & maskOctets[0];
    const net2 = o2 & maskOctets[1];
    const net3 = o3 & maskOctets[2];
    const net4 = o4 & maskOctets[3];
    const bcast4 = net4 + Math.pow(2, Math.max(0, 8 - (cidr % 8 || 8))) - 1;

    return {
      maskStr: maskOctets.join('.'),
      netStr: \`\${net1}.\${net2}.\${net3}.\${net4}\`,
      bcastStr: \`\${net1}.\${net2}.\${net3}.\${cidr <= 24 ? 255 : bcast4}\`,
      usableHosts
    };
  };

  const subnetResult = calculateSubnet();

  const runArp = () => {
    setArpRunning(true);
    setArpStep(1);
    setTimeout(() => setArpStep(2), 1200);
    setTimeout(() => {
      setArpStep(3);
      setArpRunning(false);
    }, 2400);
  };

  const tracePacket = () => {
    setTraceRunning(true);
    setTraceStep(1);
    const timer = setInterval(() => {
      setTraceStep((prev) => {
        if (prev >= 5) {
          clearInterval(timer);
          setTraceRunning(false);
          return 5;
        }
        return prev + 1;
      });
    }, 900);
  };

  return (
    <div className="space-y-8 text-white font-sans">
      {/* 1. Computer -> NIC -> MAC -> Data Link Flow */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase">
              MODULE 01 · LAYER 1 & 2
            </span>
            <span className="text-white font-bold text-sm">Computer ? NIC ? MAC ? Data Link</span>
          </div>
          <span className="text-xs font-mono text-gray-400">FOUNDATIONS ENGINE</span>
        </div>

        {/* Clickable Component Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'computer', label: 'Computer', icon: Laptop, sub: 'Host CPU / OS' },
            { id: 'nic', label: 'NIC', icon: Cpu, sub: 'Hardware Interface' },
            { id: 'mac', label: 'MAC Address', icon: Hash, sub: '48-Bit Layer 2 ID' },
            { id: 'frame', label: 'Ethernet Frame', icon: Layers, sub: 'L2 PDU on Wire' },
            { id: 'switch', label: 'Switch', icon: Radio, sub: 'CAM Forwarder' }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeConcept === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveConcept(item.id)}
                className={\`p-4 rounded-xl border text-center transition \${
                  isSel
                    ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20'
                    : 'bg-[#151922] border-[#242a38] hover:border-gray-500'
                }\`}
              >
                <Icon className={\`w-6 h-6 mx-auto mb-2 \${isSel ? 'text-red-400' : 'text-gray-400'}\`} />
                <div className="font-bold text-xs text-white">{item.label}</div>
                <div className="text-[10px] font-mono text-gray-400 mt-0.5">{item.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Card */}
        <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl text-xs space-y-2">
          {activeConcept === 'computer' && (
            <div>
              <strong className="text-white text-sm">Computer (Host End System)</strong>
              <p className="text-gray-300 mt-1 leading-relaxed">
                A networked computer uses applications to create data, relying on the operating system TCP/IP stack to bind network sockets and hand traffic to the hardware Network Interface Card.
              </p>
            </div>
          )}
          {activeConcept === 'nic' && (
            <div>
              <strong className="text-white text-sm">Network Interface Card (NIC)</strong>
              <p className="text-gray-300 mt-1 leading-relaxed">
                The physical transceiver (Ethernet0 / Wi-Fi) that converts digital bits into electrical, optical, or radio signals. Every NIC is manufactured with a globally unique burned-in MAC address.
              </p>
            </div>
          )}
          {activeConcept === 'mac' && (
            <div>
              <strong className="text-white text-sm">MAC Address (48-Bit Physical Identifier)</strong>
              <p className="text-gray-300 mt-1 leading-relaxed">
                Form: AA:BB:CC:11:22:33 (6 octets / 48 bits). The first 24 bits represent the Organizationally Unique Identifier (OUI vendor code), and the last 24 bits represent the NIC serial number.
              </p>
            </div>
          )}
          {activeConcept === 'frame' && (
            <div>
              <strong className="text-white text-sm">Ethernet II Frame Structure</strong>
              <p className="text-gray-300 mt-1 leading-relaxed">
                Preamble (7B) + SFD (1B) | Dest MAC (6B) | Source MAC (6B) | EtherType 0x0800 (2B) | IP Payload (46–1500B) | FCS/CRC32 Checksum (4B).
              </p>
            </div>
          )}
          {activeConcept === 'switch' && (
            <div>
              <strong className="text-white text-sm">Layer 2 Switch & CAM Table</strong>
              <p className="text-gray-300 mt-1 leading-relaxed">
                Learns Source MACs on incoming switchports and forwards frames directly to Destination MACs without modifying Layer 3 IP headers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Binary Number System & Powers of Two Interactive Workbench */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold uppercase">
              MODULE 02 · BINARY ENGINE
            </span>
            <span className="text-white font-bold text-sm">Binary Number System — Powers of Two</span>
          </div>
          <span className="text-xs font-mono text-purple-400 font-bold">2^8 = 256 COMBINATIONS</span>
        </div>

        {/* 8-Bit Interactive Toggle Row */}
        <div>
          <span className="text-xs font-mono text-gray-400 uppercase font-bold block mb-3">
            Click any bit position to toggle 0 / 1 state:
          </span>
          <div className="grid grid-cols-8 gap-2">
            {bits.map((bit, idx) => (
              <button
                key={idx}
                onClick={() => toggleBit(idx)}
                className={\`p-3 rounded-xl border flex flex-col items-center justify-center transition \${
                  bit
                    ? 'bg-purple-600 border-purple-400 text-white font-extrabold shadow-lg shadow-purple-600/30 scale-105'
                    : 'bg-[#151922] border-[#242a38] text-gray-400 hover:border-gray-500'
                }\`}
              >
                <span className="text-[10px] font-mono text-gray-400">2^{7 - idx}</span>
                <span className="text-xs font-mono font-bold text-yellow-400 my-1">{bitWeights[idx]}</span>
                <span className="text-lg font-mono font-bold">{bit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] uppercase text-gray-400 block">8-Bit Binary</span>
              <span className="text-xl font-bold text-cyan-400 tracking-widest">{bits.join('')}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-gray-400 block">Decimal Value</span>
              <span className="text-2xl font-bold text-green-400">{decimalValue}</span>
            </div>
          </div>

          <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl font-mono text-xs space-y-1">
            <span className="text-gray-400 uppercase text-[10px] font-bold block">Formula Decomposition:</span>
            <div className="text-gray-300">
              {bits.map((b, i) => (b ? \`\${bitWeights[i]}\` : null)).filter(Boolean).join(' + ') || '0'} = <strong className="text-green-400">{decimalValue}</strong>
            </div>
          </div>
        </div>

        {/* Decimal ? Binary Converter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl space-y-2">
            <label className="text-gray-400 uppercase font-bold text-[10px] block">Decimal ? Binary (0-255)</label>
            <input
              type="number"
              min="0"
              max="255"
              value={decInput}
              onChange={(e) => handleDecChange(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white font-bold"
            />
          </div>

          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl space-y-2">
            <label className="text-gray-400 uppercase font-bold text-[10px] block">Binary ? Decimal (8 Bits)</label>
            <input
              type="text"
              maxLength={8}
              value={binInput}
              onChange={(e) => handleBinChange(e.target.value)}
              className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-cyan-400 font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. IPv4 Addressing & 4-Octet Subnet Builder */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-bold uppercase">
              MODULE 03 · IPv4 ARCHITECTURE
            </span>
            <span className="text-white font-bold text-sm">IPv4 = 32 Bits = 4 Octets</span>
          </div>
          <span className="text-xs font-mono text-gray-400">RFC 791 / RFC 1918</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { val: o1, setter: setO1, label: 'OCTET 1' },
            { val: o2, setter: setO2, label: 'OCTET 2' },
            { val: o3, setter: setO3, label: 'OCTET 3' },
            { val: o4, setter: setO4, label: 'OCTET 4' }
          ].map((oct, i) => (
            <div key={i} className="p-3 bg-[#151922] border border-[#242a38] rounded-xl text-center font-mono">
              <span className="text-[10px] text-gray-400 uppercase block mb-1">{oct.label}</span>
              <input
                type="number"
                min="0"
                max="255"
                value={oct.val}
                onChange={(e) => oct.setter(Math.min(255, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-full text-center bg-[#181c26] border border-[#242a38] rounded p-2 text-lg font-bold text-yellow-400"
              />
              <div className="text-[10px] text-gray-400 mt-1">
                {oct.val.toString(2).padStart(8, '0')}
              </div>
            </div>
          ))}
        </div>

        {/* CIDR Prefix Selector */}
        <div className="flex items-center justify-between bg-[#151922] p-4 rounded-xl border border-[#242a38] font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 uppercase">Subnet Mask CIDR:</span>
            <select
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value, 10))}
              className="bg-[#181c26] border border-[#242a38] rounded px-3 py-1.5 text-white font-bold"
            >
              {[8, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((p) => (
                <option key={p} value={p}>/{p}</option>
              ))}
            </select>
            <span className="text-cyan-400 font-bold">{subnetResult.maskStr}</span>
          </div>

          <span className="text-gray-400">{subnetResult.usableHosts.toLocaleString()} Usable Hosts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#0a0c10] border border-[#242a38] rounded-lg">
            <span className="text-gray-400 text-[10px] block uppercase">Network Address</span>
            <span className="text-cyan-400 font-bold">{subnetResult.netStr}</span>
          </div>
          <div className="p-3 bg-[#0a0c10] border border-[#242a38] rounded-lg">
            <span className="text-gray-400 text-[10px] block uppercase">Broadcast Address</span>
            <span className="text-orange-400 font-bold">{subnetResult.bcastStr}</span>
          </div>
          <div className="p-3 bg-[#0a0c10] border border-[#242a38] rounded-lg">
            <span className="text-gray-400 text-[10px] block uppercase">Capacity</span>
            <span className="text-white font-bold">{subnetResult.usableHosts} hosts</span>
          </div>
          <div className="p-3 bg-[#0a0c10] border border-[#242a38] rounded-lg">
            <span className="text-gray-400 text-[10px] block uppercase">Net / Host Bits</span>
            <span className="text-yellow-400 font-bold">{cidr} / {32 - cidr}</span>
          </div>
        </div>
      </div>

      {/* 4. Live ARP IP-to-MAC Resolution Sandbox */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30 font-bold uppercase">
              MODULE 04 · ARP SIMULATOR
            </span>
            <span className="text-white font-bold text-sm">Address Resolution Protocol (IP ? MAC)</span>
          </div>
          <button
            onClick={runArp}
            disabled={arpRunning}
            className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run ARP Resolution</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center font-mono text-xs">
          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl space-y-1">
            <Laptop className="w-6 h-6 mx-auto text-cyan-400" />
            <div className="font-bold text-white">PC-01 (Requester)</div>
            <div className="text-[10px] text-gray-400">192.168.1.10</div>
            <div className="text-[10px] text-gray-400">AA:BB:CC:11:22:33</div>
          </div>

          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-yellow-400">
              {arpStep === 0 && 'Ready to resolve 192.168.1.20'}
              {arpStep === 1 && 'ARP Request (Broadcast FF:FF:FF:FF:FF:FF) ->'}
              {arpStep === 2 && '<- ARP Reply (Unicast to PC-01)'}
              {arpStep === 3 && 'ARP Cache Updated!'}
            </div>
            <div className={\`p-2 rounded text-[10px] font-bold \${
              arpStep === 3 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#181c26] text-gray-300'
            }\`}>
              {arpStep === 3 ? '192.168.1.20 -> AA:BB:CC:44:55:66' : 'Cache: Not learned'}
            </div>
          </div>

          <div className="p-4 bg-[#151922] border border-[#242a38] rounded-xl space-y-1">
            <Server className="w-6 h-6 mx-auto text-green-400" />
            <div className="font-bold text-white">PC-02 (Target)</div>
            <div className="text-[10px] text-gray-400">192.168.1.20</div>
            <div className="text-[10px] text-gray-400">AA:BB:CC:44:55:66</div>
          </div>
        </div>
      </div>

      {/* 5. Complete Encapsulation & Journey Trace */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase">
              MODULE 05 · ENCAPSULATION TRACE
            </span>
            <span className="text-white font-bold text-sm">Encapsulation & Full Packet Journey</span>
          </div>
          <button
            onClick={tracePacket}
            disabled={traceRunning}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trace Packet Journey</span>
          </button>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {[
            { step: 1, layer: 'L7', name: 'Application creates data payload', pdu: 'GET /index.html' },
            { step: 2, layer: 'L4', name: 'TCP segment header prepends source/dest ports', pdu: 'Src: 51542 ? Dst: 443' },
            { step: 3, layer: 'L3', name: 'IPv4 packet header prepends logical addresses & TTL', pdu: '192.168.1.10 ? 192.168.1.100' },
            { step: 4, layer: 'L2', name: 'Ethernet frame header prepends MAC addresses & FCS', pdu: 'Src MAC ? Gateway MAC' },
            { step: 5, layer: 'L1', name: 'Physical transceiver encodes bits into signals on wire', pdu: '01001100 01101111' }
          ].map((item) => (
            <div
              key={item.step}
              className={\`p-3.5 rounded-xl border flex items-center justify-between transition \${
                traceStep >= item.step
                  ? 'bg-red-500/15 border-red-500 text-white font-bold'
                  : 'bg-[#151922] border-[#242a38] text-gray-400 opacity-60'
              }\`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                  {item.step}
                </span>
                <div>
                  <span className="text-white block">{item.name}</span>
                  <span className="text-gray-400 text-[11px]">{item.pdu}</span>
                </div>
              </div>
              <span className="text-yellow-400 text-xs font-bold">{item.layer}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Break / Fix Fault Injection Sandbox */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#242a38] pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase">
              MODULE 06 · BREAK / FIX
            </span>
            <span className="text-white font-bold text-sm">NOC & SOC Fault Injection Sandbox</span>
          </div>
          {activeFault && (
            <button
              onClick={() => setActiveFault(null)}
              className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restore Network</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {[
            { id: 'nic', label: 'Disable NIC', desc: 'Physical / Interface Loss' },
            { id: 'ip', label: 'Wrong IP', desc: 'Layer 3 Addressing Conflict' },
            { id: 'mask', label: 'Wrong Mask', desc: 'Subnet Boundary Mismatch' },
            { id: 'gateway', label: 'Wrong Gateway', desc: 'Remote Routing Failure' },
            { id: 'arp', label: 'Missing ARP', desc: 'L2 Local Delivery Drop' },
            { id: 'port', label: 'Blocked Port', desc: 'Transport/Service Drop' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFault(f.id)}
              className={\`p-3 rounded-xl border text-left transition \${
                activeFault === f.id
                  ? 'bg-red-500/20 border-red-500 font-bold shadow-lg shadow-red-500/20'
                  : 'bg-[#151922] border-[#242a38] hover:border-gray-500'
              }\`}
            >
              <div className="text-white font-bold">{f.label}</div>
              <div className="text-[11px] text-gray-400">{f.desc}</div>
            </button>
          ))}
        </div>

        {activeFault ? (
          <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-xl text-xs space-y-1 font-mono">
            <div className="flex items-center gap-2 text-red-400 font-bold uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Fault Injected: {activeFault.toUpperCase()}</span>
            </div>
            <p className="text-gray-200">
              {activeFault === 'nic' && 'NIC link state down: packets cannot be serialized to physical medium (Layer 1 failure).'}
              {activeFault === 'ip' && 'Host IP misconfigured: host cannot establish default route or communicate with same subnet (Layer 3).'}
              {activeFault === 'mask' && 'Mask misconfigured: host misidentifies remote IPs as local and skips sending to Default Gateway (Layer 3).'}
              {activeFault === 'gateway' && 'Gateway IP wrong: packets targeting off-subnet IPs fail router ARP resolution and get dropped.'}
              {activeFault === 'arp' && 'ARP resolution failure: destination MAC cannot be resolved on local link; frame dropped at L2.'}
              {activeFault === 'port' && 'Target port 443 blocked: TCP SYN packet dropped or rejected with RST/ACK (Layer 4/Firewall drop).'}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-300 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Network healthy. Select any failure scenario above to investigate symptoms.</span>
          </div>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/simulators/FoundationsVisualEngine.tsx', code);
console.log('FoundationsVisualEngine.tsx generated successfully');
