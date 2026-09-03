const fs = require('fs');

const topologyCode = `import React, { useState, useEffect } from 'react';
import { NetworkNode } from '../../types';
import { Shield, Server, Laptop, Router, Globe, Activity, Lock, AlertTriangle, Play, Pause, Layers } from 'lucide-react';

export const TOPOLOGY_NODES: NetworkNode[] = [
  {
    id: 'internet', name: 'Internet Gateway', type: 'internet', ip: '198.51.100.1', mac: '00:00:5e:00:53:01', zone: 'Internet',
    role: 'Public WAN Uplink', function: 'Carries external untrusted traffic into the edge router.', layer: 'Network',
    protocols: ['BGP', 'IPv4', 'IPv6', 'TCP', 'UDP'], ports: ['Any'],
    securityImportance: 'Perimeter entry point; source of external reconnaissance, DDoS, and exploit payloads.',
    commonAttacks: ['DDoS Floods', 'BGP Route Hijacking', 'External Port Scanning'],
    detection: 'ISP edge flow metrics, BGP monitoring, external threat feeds.',
    defense: 'Anycast DDoS mitigation scrubbing, BCP 38 filtering, RPKI validation.', relatedLabIds: ['lab-01', 'lab-15']
  },
  {
    id: 'router-edge', name: 'Edge Border Router', type: 'router', ip: '203.0.113.1', mac: '00:50:56:a1:00:01', zone: 'Edge',
    role: 'Layer 3 Border Gateway', function: 'Performs BGP/Static routing, Longest Prefix Match forwarding, and initial bogon IP filtering.', layer: 'Network',
    protocols: ['BGP', 'OSPF', 'ICMP', 'IPv4'], ports: ['179 (BGP)'],
    securityImportance: 'First line of defense against IP spoofing and invalid routing updates.',
    commonAttacks: ['BGP Hijacking', 'ICMP Floods', 'SNMP Community Exploitation'],
    detection: 'uRPF drop counters, BGP neighbor status logs, CPU load alarms.',
    defense: 'Strict uRPF (Reverse Path Forwarding), MD5 BGP auth, ACL ingress filtering.', relatedLabIds: ['lab-01', 'lab-15', 'lab-16']
  },
  {
    id: 'firewall-perimeter', name: 'Perimeter Next-Gen Firewall', type: 'firewall', ip: '10.0.0.1', mac: '00:50:56:a1:00:02', zone: 'Edge',
    role: 'Stateful Firewall & DPI', function: 'Tracks TCP states, performs PAT translation, inspects L7 payloads, and separates DMZ from internal LAN.', layer: 'Network',
    protocols: ['TCP', 'UDP', 'IPsec', 'TLS', 'NAT/PAT'], ports: ['443 (Management)', '500 (IPsec)'],
    securityImportance: 'Enforces security policies; prevents unauthorized access into internal networks.',
    commonAttacks: ['Firewall Evasion via Tunneling', 'State Table Exhaustion', 'Exploiting Misconfigured Shadow Rules'],
    detection: 'Firewall drop logs, hit counters, high session creation rate alerts.',
    defense: 'Default Deny policy, top-down rule ordering, SSL decryption, App-ID enforcement.', relatedLabIds: ['lab-18', 'lab-28']
  },
  {
    id: 'core-switch', name: 'Core Distribution Switch', type: 'core_switch', ip: '10.0.1.1', mac: '00:50:56:a1:00:03', zone: 'Corporate',
    role: 'Layer 2/3 Enterprise Switching', function: 'Performs 802.1Q VLAN trunking, CAM table MAC learning, and Spanning Tree Protocol (RSTP).', layer: 'Data Link',
    protocols: ['802.1Q', 'STP/RSTP', 'ARP', 'Ethernet'], ports: ['Trunk / Access'],
    securityImportance: 'Core Layer 2 backbone; prevents switching loops and enforces VLAN isolation.',
    commonAttacks: ['MAC Flooding (CAM Overflow)', 'VLAN Hopping (Double Tagging)', 'STP Root Hijacking'],
    detection: 'Port Security violation traps, CAM table overflow alarms, STP topology change notifications.',
    defense: 'Port Security with sticky MACs, BPDU Guard, Dynamic ARP Inspection (DAI), DHCP Snooping.', relatedLabIds: ['lab-11', 'lab-13', 'lab-14']
  },
  {
    id: 'server-web-dmz', name: 'DMZ Web Server', type: 'dmz', ip: '10.0.2.10', mac: '00:50:56:a1:00:10', zone: 'DMZ',
    role: 'Public Web Application Portal', function: 'Serves HTTPS web traffic (Nginx/Apache) to external and internal clients.', layer: 'Application',
    protocols: ['HTTP', 'HTTPS', 'TLS 1.3', 'TCP'], ports: ['80 (HTTP)', '443 (HTTPS)'],
    securityImportance: 'Publicly reachable server; primary target for Initial Access and web exploits.',
    commonAttacks: ['SQL Injection', 'Command Injection / Reverse Shells', 'TLS Downgrade Attacks'],
    detection: 'Web Application Firewall (WAF) blocks, anomalous outbound socket connections (ss -tulnp).',
    defense: 'WAF, disabling unneeded services, HSTS enforcement, read-only containerized filesystems.', relatedLabIds: ['lab-24', 'lab-25']
  },
  {
    id: 'server-db-internal', name: 'Internal Database Server', type: 'server', ip: '10.0.3.50', mac: '00:50:56:a1:00:50', zone: 'Corporate',
    role: 'Core Database & PII Storage', function: 'Stores customer records and sensitive enterprise business data in PostgreSQL/MySQL.', layer: 'Application',
    protocols: ['MySQL', 'PostgreSQL', 'TLS', 'TCP'], ports: ['3306 (MySQL)', '5432 (Postgres)'],
    securityImportance: 'High-value target (Crown Jewels); must be isolated from DMZ and standard workstations.',
    commonAttacks: ['SQL Credential Dumping', 'Lateral Movement via SMB/RPC', 'Ransomware Data Encryption'],
    detection: 'Database query auditing, mass SELECT alerts, unauthorized connection attempts.',
    defense: 'Database encryption-at-rest, strict microsegmentation firewalls, private database VLAN.', relatedLabIds: ['lab-01', 'lab-38']
  },
  {
    id: 'workstations', name: 'Corporate Workstations', type: 'user', ip: '10.0.1.50 - 10.0.1.99', mac: '00:50:56:a1:01:xx', zone: 'Corporate',
    role: 'End-User Corporate Endpoints', function: 'Employee workstations accessing internal portals, email, and external SaaS services.', layer: 'Application',
    protocols: ['DHCP', 'DNS', 'SMB', 'HTTP/HTTPS', 'TCP'], ports: ['Dynamic / Ephemeral'],
    securityImportance: 'Common initial infection vector via Phishing, malicious downloads, and C2 malware.',
    commonAttacks: ['Phishing Payloads', 'DNS Tunneling C2', 'Pass-the-Hash Lateral Movement'],
    detection: 'EDR process creation (Sysmon), anomalous DNS entropy queries, high outbound traffic.',
    defense: 'EDR host isolation, disabling workstation-to-workstation SMB (445), Least Privilege users.', relatedLabIds: ['lab-03', 'lab-31', 'lab-32']
  }
];

export const VisualTopology: React.FC<{ onSelectNode?: (node: NetworkNode) => void }> = ({ onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode>(TOPOLOGY_NODES[2]);
  const [packetFlowing, setPacketFlowing] = useState(true);

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 bg-[#151922] border-b border-[#242a38] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <h3 className="font-bold text-sm text-white">Enterprise Network Digital Twin</h3>
          <span className="text-[10px] font-mono uppercase bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded">Live Telemetry</span>
        </div>
        <button
          onClick={() => setPacketFlowing(!packetFlowing)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#242a38] bg-[#181c26] hover:text-white text-xs font-mono text-gray-300 transition"
        >
          {packetFlowing ? <Pause className="w-3.5 h-3.5 text-yellow-400" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
          <span>{packetFlowing ? 'Pause Flow' : 'Resume Flow'}</span>
        </button>
      </div>

      <div className="p-6 bg-[#0a0c10] relative min-h-[360px] flex items-center justify-center overflow-x-auto">
        <div className="flex flex-col items-center gap-6 z-10 w-full max-w-4xl py-2">
          {/* Level 0: Internet */}
          <button
            onClick={() => handleNodeClick(TOPOLOGY_NODES[0])}
            className={\`p-2.5 px-4 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
              selectedNode.id === 'internet' ? 'bg-red-500/20 border-red-500' : 'bg-[#151922] border-[#242a38] hover:border-gray-500'
            }\`}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="font-bold text-xs text-white">Internet Gateway</div>
              <div className="text-[10px] font-mono text-gray-400">198.51.100.1 · WAN</div>
            </div>
          </button>

          {/* Level 1: Router */}
          <button
            onClick={() => handleNodeClick(TOPOLOGY_NODES[1])}
            className={\`p-2.5 px-4 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
              selectedNode.id === 'router-edge' ? 'bg-red-500/20 border-red-500' : 'bg-[#151922] border-[#242a38] hover:border-gray-500'
            }\`}
          >
            <Router className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <div className="font-bold text-xs text-white">Edge Border Router</div>
              <div className="text-[10px] font-mono text-gray-400">203.0.113.1 · BGP/OSPF</div>
            </div>
          </button>

          {/* Level 2: Firewall */}
          <button
            onClick={() => handleNodeClick(TOPOLOGY_NODES[2])}
            className={\`p-3 px-5 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
              selectedNode.id === 'firewall-perimeter' ? 'bg-red-500/20 border-red-500 shadow-red-500/30' : 'bg-[#151922] border-red-500/50 hover:border-red-400'
            }\`}
          >
            <Shield className="w-5 h-5 text-red-500" />
            <div className="text-left">
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span>Perimeter NGFW</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">10.0.0.1 · Stateful DPI</div>
            </div>
          </button>

          {/* Level 3: Core Switch */}
          <button
            onClick={() => handleNodeClick(TOPOLOGY_NODES[3])}
            className={\`p-2.5 px-4 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
              selectedNode.id === 'core-switch' ? 'bg-red-500/20 border-red-500' : 'bg-[#151922] border-[#242a38] hover:border-gray-500'
            }\`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <div className="font-bold text-xs text-white">Core Switch</div>
              <div className="text-[10px] font-mono text-gray-400">10.0.1.1 · 802.1Q Trunk</div>
            </div>
          </button>

          {/* Level 4: Segmented Subnets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              onClick={() => handleNodeClick(TOPOLOGY_NODES[4])}
              className={\`p-2.5 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
                selectedNode.id === 'server-web-dmz' ? 'bg-red-500/20 border-red-500' : 'bg-[#151922] border-yellow-500/40 hover:border-yellow-400'
              }\`}
            >
              <Server className="w-4 h-4 text-yellow-400" />
              <div className="text-left">
                <div className="font-bold text-xs text-white">DMZ Web Server</div>
                <div className="text-[10px] font-mono text-gray-400">10.0.2.10 · HTTPS</div>
              </div>
            </button>

            <button
              onClick={() => handleNodeClick(TOPOLOGY_NODES[6])}
              className={\`p-2.5 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
                selectedNode.id === 'workstations' ? 'bg-red-500/20 border-red-500' : 'bg-[#151922] border-[#242a38] hover:border-gray-500'
              }\`}
            >
              <Laptop className="w-4 h-4 text-green-400" />
              <div className="text-left">
                <div className="font-bold text-xs text-white">Workstations (VLAN 10)</div>
                <div className="text-[10px] font-mono text-gray-400">10.0.1.0/24 · Users</div>
              </div>
            </button>

            <button
              onClick={() => handleNodeClick(TOPOLOGY_NODES[5])}
              className={\`p-2.5 rounded-xl border flex items-center gap-2.5 transition shadow-lg \${
                selectedNode.id === 'server-db-internal' ? 'bg-red-500/20 border-red-500' : 'bg-[#151922] border-blue-500/40 hover:border-blue-400'
              }\`}
            >
              <Lock className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <div className="font-bold text-xs text-white">Database (VLAN 30)</div>
                <div className="text-[10px] font-mono text-gray-400">10.0.3.50 · SQL</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      <div className="p-5 bg-[#12151c] border-t border-[#242a38]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1e2430]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{selectedNode.name}</span>
              <span className="text-[10px] font-mono uppercase bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">Zone: {selectedNode.zone}</span>
              <span className="text-[10px] font-mono uppercase bg-[#1f2533] text-gray-400 px-2 py-0.5 rounded">Layer: {selectedNode.layer}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{selectedNode.function}</p>
          </div>
          <div className="text-right font-mono text-xs">
            <div className="text-white font-bold">IP: {selectedNode.ip}</div>
            <div className="text-gray-400 text-[11px]">MAC: {selectedNode.mac}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#151922] p-3 rounded-lg border border-[#242a38]">
            <div className="flex items-center gap-1.5 text-yellow-400 font-mono font-bold uppercase mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Common Attacks</span>
            </div>
            <ul className="space-y-1 text-gray-300">
              {selectedNode.commonAttacks.map((atk, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{atk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#151922] p-3 rounded-lg border border-[#242a38]">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold uppercase mb-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Detection</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{selectedNode.detection}</p>
          </div>

          <div className="bg-[#151922] p-3 rounded-lg border border-[#242a38]">
            <div className="flex items-center gap-1.5 text-green-400 font-mono font-bold uppercase mb-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Defense Hardening</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{selectedNode.defense}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/simulators/VisualTopology.tsx', topologyCode);
console.log('VisualTopology.tsx generated successfully');
