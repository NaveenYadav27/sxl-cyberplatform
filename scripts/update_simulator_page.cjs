const fs = require('fs');

const simulatorPageCode = `import React, { useState } from 'react';
import { ClientSwitchRouterFlow } from '../components/simulators/ClientSwitchRouterFlow';
import { FoundationsVisualEngine } from '../components/simulators/FoundationsVisualEngine';
import { SubnettingToolkit } from '../components/simulators/SubnettingToolkit';
import { FailureSecuritySimulator } from '../components/simulators/FailureSecuritySimulator';
import { InternetRoutingVisualizer } from '../components/simulators/InternetRoutingVisualizer';
import { ProtocolLabsSuite } from '../components/simulators/ProtocolLabsSuite';
import { SecurityArenaLabs } from '../components/simulators/SecurityArenaLabs';
import { VisualTopology } from '../components/simulators/VisualTopology';
import { SubnetCalculator } from '../components/simulators/SubnetCalculator';
import { FirewallSimulator } from '../components/simulators/FirewallSimulator';
import { PacketAnalyzer } from '../components/simulators/PacketAnalyzer';
import { TCPHandshakeSimulator } from '../components/simulators/TCPHandshakeSimulator';
import { DNSResolverSimulator } from '../components/simulators/DNSResolverSimulator';
import { ARPSimulator } from '../components/simulators/ARPSimulator';
import { TrafficMonitor } from '../components/simulators/TrafficMonitor';
import { AttackSimulator } from '../components/simulators/AttackSimulator';

export const SimulatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hop-flow');

  const tabs = [
    { id: 'hop-flow', label: 'Client ? Server Flow' },
    { id: 'foundations', label: 'Foundations Visual Engine' },
    { id: 'subnet-toolkit', label: 'Subnetting Toolkit' },
    { id: 'failure-sim', label: 'Failure & SOC Troubleshooting' },
    { id: 'internet-sim', label: 'Internet / WAN Routing' },
    { id: 'protocol-labs', label: 'Protocol Labs Suite' },
    { id: 'security-arena', label: 'Security Arena' },
    { id: 'topology', label: 'Enterprise Digital Twin' },
    { id: 'subnet', label: 'Subnet Calculator' },
    { id: 'firewall', label: 'Firewall Engine' },
    { id: 'tcp', label: 'TCP Handshake' },
    { id: 'dns', label: 'DNS Resolver' },
    { id: 'arp', label: 'ARP Poisoning' },
    { id: 'traffic', label: 'Telemetry NOC' },
    { id: 'attacks', label: 'Attack Simulator' },
    { id: 'analyzer', label: 'Packet Inspector' }
  ];

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Visual Simulation Laboratory Suite</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Interactive digital twin simulation primitives for protocols, topologies, subnetting, firewalls, and attack dynamics.
        </p>
      </div>

      {/* Simulator Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-[#242a38]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={\`px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap \${
              activeTab === tab.id
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 font-bold shadow-lg'
                : 'bg-[#151922] text-gray-400 border border-[#242a38] hover:text-white'
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Simulator Render */}
      <div>
        {activeTab === 'hop-flow' && <ClientSwitchRouterFlow />}
        {activeTab === 'foundations' && <FoundationsVisualEngine />}
        {activeTab === 'subnet-toolkit' && <SubnettingToolkit />}
        {activeTab === 'failure-sim' && <FailureSecuritySimulator />}
        {activeTab === 'internet-sim' && <InternetRoutingVisualizer />}
        {activeTab === 'protocol-labs' && <ProtocolLabsSuite />}
        {activeTab === 'security-arena' && <SecurityArenaLabs />}
        {activeTab === 'topology' && <VisualTopology />}
        {activeTab === 'subnet' && <SubnetCalculator />}
        {activeTab === 'firewall' && <FirewallSimulator />}
        {activeTab === 'tcp' && <TCPHandshakeSimulator />}
        {activeTab === 'dns' && <DNSResolverSimulator />}
        {activeTab === 'arp' && <ARPSimulator />}
        {activeTab === 'traffic' && <TrafficMonitor />}
        {activeTab === 'attacks' && <AttackSimulator />}
        {activeTab === 'analyzer' && <PacketAnalyzer />}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/pages/SimulatorPage.tsx', simulatorPageCode);
console.log('SimulatorPage.tsx updated with all visual engines');
