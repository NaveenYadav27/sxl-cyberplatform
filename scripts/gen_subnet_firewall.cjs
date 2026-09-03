const fs = require('fs');

const subnetCalcCode = `import React, { useState } from 'react';
import { SubnetResult } from '../../types';
import { Calculator } from 'lucide-react';

export const SubnetCalculator: React.FC = () => {
  const [ipInput, setIpInput] = useState('192.168.10.0');
  const [cidr, setCidr] = useState(24);

  const calculateSubnet = (ipStr: string, prefix: number): SubnetResult => {
    const octets = ipStr.split('.').map((o) => parseInt(o, 10) || 0);
    while (octets.length < 4) octets.push(0);
    const ipNum = ((octets[0] << 24) >>> 0) + ((octets[1] << 16) >>> 0) + ((octets[2] << 8) >>> 0) + (octets[3] >>> 0);

    const maskNum = prefix === 0 ? 0 : (((0xffffffff << (32 - prefix)) >>> 0) & 0xffffffff) >>> 0;
    const wildcardNum = (~maskNum) >>> 0;

    const netNum = (ipNum & maskNum) >>> 0;
    const bcastNum = (netNum | wildcardNum) >>> 0;

    const numToIp = (n: number) => [
      (n >>> 24) & 0xff,
      (n >>> 16) & 0xff,
      (n >>> 8) & 0xff,
      n & 0xff
    ].join('.');

    const numToBin = (n: number) => [
      ((n >>> 24) & 0xff).toString(2).padStart(8, '0'),
      ((n >>> 16) & 0xff).toString(2).padStart(8, '0'),
      ((n >>> 8) & 0xff).toString(2).padStart(8, '0'),
      (n & 0xff).toString(2).padStart(8, '0')
    ];

    const totalHosts = Math.pow(2, 32 - prefix);
    const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

    const firstHostNum = prefix >= 31 ? netNum : netNum + 1;
    const lastHostNum = prefix >= 31 ? bcastNum : Math.max(firstHostNum, bcastNum - 1);

    const isPrivate = (
      (octets[0] === 10) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );

    let classType = 'Class A';
    if (octets[0] >= 128 && octets[0] <= 191) classType = 'Class B';
    else if (octets[0] >= 192 && octets[0] <= 223) classType = 'Class C';
    else if (octets[0] >= 224 && octets[0] <= 239) classType = 'Class D (Multicast)';

    return {
      ip: numToIp(ipNum),
      cidr: prefix,
      mask: numToIp(maskNum),
      wildcard: numToIp(wildcardNum),
      network: numToIp(netNum),
      broadcast: numToIp(bcastNum),
      firstHost: numToIp(firstHostNum),
      lastHost: numToIp(lastHostNum),
      totalHosts,
      usableHosts,
      ipBinary: numToBin(ipNum),
      maskBinary: numToBin(maskNum),
      netBinary: numToBin(netNum),
      classType,
      isPrivate
    };
  };

  const result = calculateSubnet(ipInput, cidr);

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">Visual Subnetting Engine</h3>
            <p className="text-xs text-gray-400">FLSM, VLSM, CIDR Sizing, and Bitwise AND Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['/24', '/27', '/30'].map((p) => {
            const val = parseInt(p.replace('/', ''), 10);
            return (
              <button
                key={p}
                onClick={() => setCidr(val)}
                className={\`px-2.5 py-1 rounded text-xs font-mono transition \${
                  cidr === val
                    ? 'bg-red-500/20 border-red-500 text-red-400 border font-bold'
                    : 'bg-[#181c26] text-gray-400 border border-[#242a38] hover:text-white'
                }\`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">Target IPv4 Address</label>
          <input
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            className="w-full bg-[#181c26] border border-[#242a38] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-red-500"
            placeholder="192.168.1.0"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-mono uppercase text-gray-400">CIDR: <span className="text-red-400 font-bold">/{cidr}</span></label>
            <span className="text-xs font-mono text-gray-400">{result.mask}</span>
          </div>
          <input
            type="range"
            min="1"
            max="32"
            value={cidr}
            onChange={(e) => setCidr(parseInt(e.target.value, 10))}
            className="w-full accent-red-500 cursor-pointer h-2 bg-[#181c26] rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Network Address</span>
          <span className="font-mono text-sm font-bold text-cyan-400">{result.network}</span>
        </div>
        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Broadcast Address</span>
          <span className="font-mono text-sm font-bold text-orange-400">{result.broadcast}</span>
        </div>
        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Usable Host Range</span>
          <span className="font-mono text-xs font-semibold text-green-400 leading-tight block">{result.firstHost} <br />- {result.lastHost}</span>
        </div>
        <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
          <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Capacity</span>
          <span className="font-mono text-sm font-bold text-white">{result.usableHosts.toLocaleString()} <span className="text-xs text-gray-400 font-normal">hosts</span></span>
        </div>
      </div>

      <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-lg font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-gray-400 pb-1 border-b border-[#1c222e] text-[11px] uppercase">
          <span>Bitwise AND Operation (Router Forwarding Engine)</span>
          <span>{result.isPrivate ? 'RFC 1918 Private' : 'Public Routable IP'}</span>
        </div>
        <div className="grid grid-cols-12 gap-2 text-gray-300 pt-1">
          <span className="col-span-3 text-gray-400">IP (Binary):</span>
          <span className="col-span-9 text-cyan-400 font-mono tracking-wider">{result.ipBinary.join('.')}</span>
        </div>
        <div className="grid grid-cols-12 gap-2 text-gray-300">
          <span className="col-span-3 text-gray-400">Mask (Binary):</span>
          <span className="col-span-9 text-red-400 font-mono tracking-wider">{result.maskBinary.join('.')}</span>
        </div>
        <div className="grid grid-cols-12 gap-2 text-white font-bold pt-1 border-t border-[#1c222e]">
          <span className="col-span-3 text-yellow-400">Net ID (AND):</span>
          <span className="col-span-9 text-green-400 font-mono tracking-wider">{result.netBinary.join('.')}</span>
        </div>
      </div>
    </div>
  );
};
`;

const firewallCode = `import React, { useState } from 'react';
import { FirewallRule } from '../../types';
import { Shield, Play, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

const INITIAL_RULES: FirewallRule[] = [
  { id: 'r1', order: 1, name: 'Allow DMZ Web HTTPS', srcIp: 'ANY', dstIp: '10.0.2.10', proto: 'TCP', port: '443', action: 'ALLOW', enabled: true, hits: 1420 },
  { id: 'r2', order: 2, name: 'Allow NTP Sync', srcIp: '10.0.0.0/16', dstIp: '198.51.100.123', proto: 'UDP', port: '123', action: 'ALLOW', enabled: true, hits: 320 },
  { id: 'r3', order: 3, name: 'Block DMZ to Internal DB SMB', srcIp: '10.0.2.0/24', dstIp: '10.0.3.0/24', proto: 'TCP', port: '445', action: 'DENY', enabled: true, hits: 89 },
  { id: 'r4', order: 4, name: 'Block Outbound Reverse Shell Port 4444', srcIp: '10.0.0.0/16', dstIp: 'ANY', proto: 'TCP', port: '4444', action: 'LOG & DENY', enabled: true, hits: 14 },
  { id: 'r5', order: 5, name: 'Default Deny All Inbound', srcIp: 'ANY', dstIp: 'ANY', proto: 'ANY', port: 'ANY', action: 'DENY', enabled: true, hits: 4590 }
];

export const FirewallSimulator: React.FC = () => {
  const [rules, setRules] = useState<FirewallRule[]>(INITIAL_RULES);
  const [testSrc, setTestSrc] = useState('10.0.2.10');
  const [testDst, setTestDst] = useState('10.0.3.50');
  const [testProto, setTestProto] = useState<'TCP' | 'UDP' | 'ICMP'>('TCP');
  const [testPort, setTestPort] = useState('445');
  const [testResult, setTestResult] = useState<{ matchedRule: FirewallRule; allowed: boolean } | null>(null);

  const moveRule = (idx: number, dir: 'up' | 'down') => {
    const newRules = [...rules];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newRules.length) return;
    const temp = newRules[idx];
    newRules[idx] = newRules[targetIdx];
    newRules[targetIdx] = temp;
    newRules.forEach((r, i) => { r.order = i + 1; });
    setRules(newRules);
  };

  const handleTestPacket = () => {
    for (const rule of rules) {
      if (!rule.enabled) continue;
      const protoMatch = rule.proto === 'ANY' || rule.proto === testProto;
      const portMatch = rule.port === 'ANY' || rule.port === testPort;
      const srcMatch = rule.srcIp === 'ANY' || rule.srcIp === testSrc || (rule.srcIp.includes('/24') && testSrc.startsWith(rule.srcIp.substring(0, 7))) || (rule.srcIp.includes('/16') && testSrc.startsWith('10.0'));
      const dstMatch = rule.dstIp === 'ANY' || rule.dstIp === testDst || (rule.dstIp.includes('/24') && testDst.startsWith(rule.dstIp.substring(0, 7)));

      if (protoMatch && portMatch && srcMatch && dstMatch) {
        rule.hits += 1;
        setTestResult({ matchedRule: rule, allowed: rule.action === 'ALLOW' });
        return;
      }
    }
    setTestResult({
      matchedRule: { id: 'implicit', order: 99, name: 'Implicit Hardware Drop', srcIp: 'ANY', dstIp: 'ANY', proto: 'ANY', port: 'ANY', action: 'DENY', enabled: true, hits: 1 },
      allowed: false
    });
  };

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242a38]">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">Firewall Rule Engine & Policy Tester</h3>
            <p className="text-xs text-gray-400">Simulate Top-Down First-Match evaluation logic and prevent shadow rules</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#242a38] text-gray-400 uppercase text-[11px]">
              <th className="pb-2 pl-2">Order</th>
              <th className="pb-2">Rule Name</th>
              <th className="pb-2">Source</th>
              <th className="pb-2">Destination</th>
              <th className="pb-2">Proto</th>
              <th className="pb-2">Port</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Hits</th>
              <th className="pb-2 text-right pr-2">Reorder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2430]">
            {rules.map((rule, idx) => (
              <tr
                key={rule.id}
                className={\`transition \${
                  testResult?.matchedRule.id === rule.id
                    ? 'bg-red-500/15 text-white font-bold'
                    : 'hover:bg-[#181c26] text-gray-300'
                }\`}
              >
                <td className="py-2 pl-2 text-gray-400 font-bold">{rule.order}</td>
                <td className="py-2 font-sans font-medium text-white">{rule.name}</td>
                <td className="py-2">{rule.srcIp}</td>
                <td className="py-2">{rule.dstIp}</td>
                <td className="py-2">{rule.proto}</td>
                <td className="py-2 text-cyan-400">{rule.port}</td>
                <td className="py-2">
                  <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${
                    rule.action === 'ALLOW' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }\`}>
                    {rule.action}
                  </span>
                </td>
                <td className="py-2 text-gray-400">{rule.hits}</td>
                <td className="py-2 pr-2 text-right space-x-1">
                  <button onClick={() => moveRule(idx, 'up')} disabled={idx === 0} className="p-1 rounded bg-[#1f2533] hover:text-white disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => moveRule(idx, 'down')} disabled={idx === rules.length - 1} className="p-1 rounded bg-[#1f2533] hover:text-white disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-[#0e1117] border border-[#242a38] rounded-xl">
        <h4 className="text-xs font-mono uppercase text-gray-400 font-bold mb-3 flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-red-400" />
          <span>Inject Synthetic Packet to Evaluate Policy</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 text-xs font-mono">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Source IP</label>
            <input type="text" value={testSrc} onChange={(e) => setTestSrc(e.target.value)} className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Destination IP</label>
            <input type="text" value={testDst} onChange={(e) => setTestDst(e.target.value)} className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Protocol</label>
            <select value={testProto} onChange={(e: any) => setTestProto(e.target.value)} className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white">
              <option value="TCP">TCP</option><option value="UDP">UDP</option><option value="ICMP">ICMP</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Port</label>
            <input type="text" value={testPort} onChange={(e) => setTestPort(e.target.value)} className="w-full bg-[#181c26] border border-[#242a38] rounded p-2 text-white" />
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-end">
            <button onClick={handleTestPacket} className="w-full p-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center justify-center gap-1.5">
              <Play className="w-3.5 h-3.5" /><span>Test</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className={\`p-3 rounded-lg border text-xs flex items-center justify-between \${
            testResult.allowed ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-red-500/15 border-red-500/40 text-red-300'
          }\`}>
            <div className="flex items-center gap-2">
              {testResult.allowed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
              <span>Verdict: <strong>{testResult.allowed ? 'PERMITTED (ALLOW)' : 'BLOCKED (DENY / DROP)'}</strong></span>
            </div>
            <div className="font-mono text-[11px]">Matched Rule #{testResult.matchedRule.order}: &quot;{testResult.matchedRule.name}&quot;</div>
          </div>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/simulators/SubnetCalculator.tsx', subnetCalcCode);
fs.writeFileSync('src/components/simulators/FirewallSimulator.tsx', firewallCode);

console.log('SubnetCalculator.tsx and FirewallSimulator.tsx generated successfully');
