const fs = require('fs');

const labsPageCode = `import React, { useState } from 'react';
import { LABS } from '../data/labs';
import { Terminal, Shield, CheckCircle2, ArrowRight, Filter, BookOpen } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const LabsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { progress } = useProgress();
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const categories = ['ALL', 'Fundamentals', 'Addressing', 'Switching', 'Routing', 'Protocols', 'Security', 'SOC', 'Capstone'];

  const filteredLabs = LABS.filter((l) => selectedCat === 'ALL' || l.category === selectedCat);

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Guided Hands-On Lab Library</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Over 40 structured guided labs. Teach before testing: scenario, objective, environment, steps, observation, and verification.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={\`px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap \${
                selectedCat === cat
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 font-bold'
                  : 'bg-[#151922] text-gray-400 border border-[#242a38] hover:text-white'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLabs.map((lab) => {
          const isDone = progress.completedLabs.includes(lab.id);
          return (
            <div
              key={lab.id}
              onClick={() => navigate('/lab/' + lab.id)}
              className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl hover:border-red-500/40 cursor-pointer transition shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-center mb-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#1f2533] text-gray-300 border border-[#2e374a] font-bold">
                    {lab.category}
                  </span>
                  <span className={\`text-[11px] \${
                    lab.difficulty === 'Beginner' ? 'text-green-400' : lab.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'
                  }\`}>
                    {lab.difficulty} · {lab.estimatedMinutes}m
                  </span>
                </div>

                <h3 className="font-bold text-base text-white group-hover:text-red-400 transition mb-1">
                  {lab.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                  {lab.scenario}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1e2430] flex items-center justify-between text-xs font-mono">
                {isDone ? (
                  <span className="flex items-center gap-1 text-green-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                ) : (
                  <span className="text-gray-400">{lab.steps.length} Guided Steps</span>
                )}
                <span className="text-red-400 font-bold group-hover:translate-x-1 transition">
                  Launch Lab ?
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

const labWorkspaceCode = `import React, { useState } from 'react';
import { LABS } from '../data/labs';
import { ArrowLeft, CheckCircle2, AlertCircle, Play, HelpCircle, Terminal, Shield, Award } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const LabWorkspacePage: React.FC<{ labId: string; navigate: (route: string) => void }> = ({ labId, navigate }) => {
  const { completeLab, progress } = useProgress();
  const lab = LABS.find((l) => l.id === labId) || LABS[0];

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [stepValidated, setStepValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [labFinished, setLabFinished] = useState(false);

  const currentStep = lab.steps[currentStepIdx];
  const isLabAlreadyDone = progress.completedLabs.includes(lab.id);

  const handleValidateStep = () => {
    setStepValidated(true);
  };

  const handleNextStep = () => {
    if (currentStepIdx < lab.steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
      setUserInput('');
      setStepValidated(false);
      setShowHint(false);
    } else {
      setLabFinished(true);
      completeLab(lab.id, 100);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <button
        onClick={() => navigate('/labs')}
        className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Lab Catalog</span>
      </button>

      {/* Lab Header */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold">
              {lab.category}
            </span>
            <span className="text-gray-400">{lab.difficulty} · {lab.estimatedMinutes} mins</span>
          </div>
          {isLabAlreadyDone && (
            <span className="flex items-center gap-1 text-green-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed (+100 XP)
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{lab.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3 bg-[#151922] border border-[#242a38] rounded-lg">
            <span className="font-mono uppercase text-yellow-400 font-bold block mb-1">Scenario Brief:</span>
            <p className="text-gray-300 leading-relaxed">{lab.scenario}</p>
          </div>
          <div className="p-3 bg-[#151922] border border-[#242a38] rounded-lg">
            <span className="font-mono uppercase text-green-400 font-bold block mb-1">Objective:</span>
            <p className="text-gray-300 leading-relaxed">{lab.objective}</p>
          </div>
        </div>
      </div>

      {/* Step Workspace Runner */}
      {!labFinished ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step Instructions */}
          <div className="lg:col-span-2 p-6 bg-[#12151c] border border-[#242a38] rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#242a38] pb-3">
              <span className="text-xs font-mono uppercase text-red-400 font-bold">
                Step {currentStep.stepNumber} of {lab.steps.length}: {currentStep.title}
              </span>
              <span className="text-xs font-mono text-gray-400">
                Action: {currentStep.actionType}
              </span>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed">
              {currentStep.instruction}
            </p>

            {/* Interactive Step Input / Trigger */}
            <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl space-y-3">
              <span className="text-xs font-mono text-gray-400 uppercase font-bold block">
                Lab Action Terminal
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={currentStep.expectedInput ? \`e.g. \${currentStep.expectedInput}\` : 'Perform step action...'}
                  className="flex-1 bg-[#151922] border border-[#242a38] rounded p-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={handleValidateStep}
                  className="px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                >
                  Execute & Verify
                </button>
              </div>
            </div>

            {/* Validation Feedback Drawer */}
            {stepValidated && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-green-400 font-bold font-mono uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Step Successfully Verified</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{currentStep.validationExplanation}</p>
                <div className="pt-2">
                  <button
                    onClick={handleNextStep}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-xs transition"
                  >
                    {currentStepIdx < lab.steps.length - 1 ? 'Proceed to Next Step ?' : 'Complete Lab Mission'}
                  </button>
                </div>
              </div>
            )}

            {/* Hint Drawer */}
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
                <span>{showHint ? 'Hide Instructor Hint' : 'Need Help? Show Hint'}</span>
              </button>
              {showHint && (
                <p className="p-3 bg-[#151922] border border-yellow-500/30 rounded-lg text-xs text-yellow-200 mt-2 font-mono">
                  ?? Hint: {currentStep.hint}
                </p>
              )}
            </div>
          </div>

          {/* Side Progress & Environment Overview */}
          <div className="space-y-4">
            <div className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl text-xs space-y-3">
              <span className="font-mono uppercase text-gray-400 font-bold block">Lab Step Progress</span>
              <div className="space-y-2">
                {lab.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={\`p-2.5 rounded border text-xs flex items-center justify-between \${
                      idx === currentStepIdx
                        ? 'bg-red-500/15 border-red-500 text-white font-semibold'
                        : idx < currentStepIdx
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-[#151922] border-[#242a38] text-gray-400'
                    }\`}
                  >
                    <span>Step {s.stepNumber}: {s.title}</span>
                    {idx < currentStepIdx && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl text-xs space-y-2">
              <span className="font-mono uppercase text-gray-400 font-bold block">Simulated Environment</span>
              <p className="text-gray-300 leading-relaxed">{lab.environmentDescription}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-[#12151c] border border-green-500/40 rounded-2xl text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mx-auto text-green-400">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Lab Mission Accomplished!</h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
            You successfully completed all steps for &quot;{lab.title}&quot;. Your progress has been recorded (+100 XP).
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => navigate('/labs')}
              className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
            >
              Explore Next Lab
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="px-6 py-2.5 rounded-lg bg-[#181c26] border border-[#242a38] text-gray-300 hover:text-white text-xs font-mono transition"
            >
              Return to Curriculum
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
`;

const simulatorPageCode = `import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('topology');

  const tabs = [
    { id: 'topology', label: 'Network Topology' },
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
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 font-bold'
                : 'bg-[#151922] text-gray-400 border border-[#242a38] hover:text-white'
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Simulator Render */}
      <div>
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

const packetAnalyzerPageCode = `import React from 'react';
import { PacketAnalyzer } from '../components/simulators/PacketAnalyzer';

export const PacketAnalyzerPage: React.FC = () => {
  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Wireshark Packet Forensics Laboratory</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Filter, dissect, and reconstruct application payloads from educational simulated enterprise packet captures.
        </p>
      </div>
      <PacketAnalyzer />
    </div>
  );
};
`;

const capstonePageCode = `import React, { useState } from 'react';
import { Shield, AlertTriangle, Terminal, FileText, CheckCircle2, ArrowRight, Play } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const CapstonePage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { completeLab } = useProgress();
  const [activeStage, setActiveStage] = useState(1);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const stages = [
    { num: 1, title: 'External Reconnaissance', desc: 'Attacker performs WHOIS queries and DNS reconnaissance targeting shadowxlab.internal.', ioc: 'Query from 198.51.100.77 for public DNS zones' },
    { num: 2, title: 'Port Scanning & Service Mapping', desc: 'Nmap SYN stealth scan sweeps ports 80, 443, 8080, and 3306 on DMZ web server.', ioc: 'TCP SYN packets without completed handshakes to port 80/443' },
    { num: 3, title: 'Initial Access Exploitation', desc: 'SQL injection and command injection executed against HTTPS web portal on port 443.', ioc: 'URI containing "UNION SELECT" and system command strings' },
    { num: 4, title: 'Outbound Reverse Shell', desc: 'Web server initiates an outbound TCP connection on port 4444 to attacker listener.', ioc: 'ESTABLISHED socket to 198.51.100.77:4444 spawning /bin/sh' },
    { num: 5, title: 'Covert DNS Tunneling C2', desc: 'Malware drops secondary DNS tunneling agent for redundant command and control.', ioc: 'High-entropy queries to *.tunnel.c2server.net on UDP 53' },
    { num: 6, title: 'Internal Network Reconnaissance', desc: 'Attacker executes ARP sweep on internal subnet 10.0.1.0/24 discovering internal DB at 10.0.3.50.', ioc: 'Broadcast ARP sweeps originating from DMZ Web Server' },
    { num: 7, title: 'Lateral Movement (SMB / PsExec)', desc: 'Adversary connects to database server over TCP port 445 and executes remote service.', ioc: 'Windows Event ID 7045 and \\pipe\\psexec Named Pipe creation' },
    { num: 8, title: 'Database Staging & Exfiltration', desc: '50,000 customer PII database records archived and exfiltrated over HTTPS POST.', ioc: '14MB outbound POST request to 198.51.100.42 carrying base64 blob' },
    { num: 9, title: 'SOC Incident Containment & Remediation', desc: 'Isolate compromised endpoints, block attacker IP at firewall, and patch vulnerabilities.', ioc: 'Quarantine DMZ server and database server; reset domain admin credentials' }
  ];

  const handleFinishCapstone = () => {
    setReportSubmitted(true);
    completeLab('lab-38', 100);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-[#12151c] border border-red-500/40 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold">
          <Shield className="w-4 h-4 text-red-500" />
          <span>PHASE 23 · NETWORKING CYBERSECURITY CAPSTONE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Full Enterprise Incident Reconstruction
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
          Reconstruct the entire 9-stage Cyber Kill Chain attack across the enterprise digital twin. Connect packet evidence from perimeter recon to database exfiltration and author the definitive incident report.
        </p>
      </div>

      {/* 9 Stages Interactive Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <span className="font-mono uppercase text-gray-400 font-bold text-xs block mb-2">9-Stage Attack Timeline</span>
          {stages.map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStage(s.num)}
              className={\`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between \${
                activeStage === s.num
                  ? 'bg-red-500/20 border-red-500 text-white font-bold'
                  : 'bg-[#151922] border-[#242a38] text-gray-400 hover:text-white'
              }\`}
            >
              <span>Stage {s.num}: {s.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 p-6 bg-[#12151c] border border-[#242a38] rounded-xl space-y-5">
          <div>
            <span className="text-xs font-mono uppercase text-red-400 font-bold">Stage {activeStage} Analysis</span>
            <h3 className="text-xl font-bold text-white mt-1">{stages[activeStage - 1].title}</h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">{stages[activeStage - 1].desc}</p>
          </div>

          <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-xl font-mono text-xs space-y-1">
            <span className="text-yellow-400 font-bold uppercase text-[11px] block">Observed Network Indicator (IOC):</span>
            <p className="text-cyan-300">{stages[activeStage - 1].ioc}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#1e2430]">
            <button
              onClick={() => setActiveStage((prev) => Math.max(1, prev - 1))}
              disabled={activeStage === 1}
              className="px-4 py-2 rounded bg-[#181c26] border border-[#242a38] text-gray-300 text-xs font-mono disabled:opacity-30"
            >
              ? Previous Stage
            </button>

            {activeStage < 9 ? (
              <button
                onClick={() => setActiveStage((prev) => Math.min(9, prev + 1))}
                className="px-5 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
              >
                Next Stage ?
              </button>
            ) : (
              <button
                onClick={handleFinishCapstone}
                className="px-6 py-2.5 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-xs transition shadow-lg shadow-green-600/30 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit SOC Incident Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {reportSubmitted && (
        <div className="p-6 bg-green-500/15 border border-green-500/40 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Capstone Certified Master!</h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto">
            You successfully reconstructed the enterprise cyber intrusion and validated complete containment.
          </p>
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/pages/LabsPage.tsx', labsPageCode);
fs.writeFileSync('src/pages/LabWorkspacePage.tsx', labWorkspaceCode);
fs.writeFileSync('src/pages/SimulatorPage.tsx', simulatorPageCode);
fs.writeFileSync('src/pages/PacketAnalyzerPage.tsx', packetAnalyzerPageCode);
fs.writeFileSync('src/pages/CapstonePage.tsx', capstonePageCode);

console.log('Lab and simulator pages generated successfully');
