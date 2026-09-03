const fs = require('fs');

const typesContent = `export type LayerType = 'Application' | 'Presentation' | 'Session' | 'Transport' | 'Network' | 'Data Link' | 'Physical';

export interface Concept {
  id: string;
  title: string;
  shortDesc: string;
  detailedContent: string;
  securityImpact: string;
  attackSurface: string;
  detectionAngle: string;
  defenseControl: string;
  wiresharkFilter?: string;
  cliCommand?: string;
  keyTakeaways: string[];
}

export interface Topic {
  id: string;
  phaseId: string;
  title: string;
  slug: string;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  concepts: Concept[];
  knowledgeChecks: KnowledgeCheckQuestion[];
  relatedLabIds: string[];
  packetExampleId?: string;
}

export interface Phase {
  id: string;
  phaseNumber: number;
  title: string;
  subtitle: string;
  description: string;
  category: 'Fundamentals' | 'Addressing' | 'Switching & Routing' | 'Transport & Services' | 'Security & Analysis' | 'SOC & Operations' | 'Capstone';
  topics: Topic[];
  learningOutcomes: string[];
  securityMapping: {
    attackSurface: string;
    indicators: string;
    detectionMethod: string;
    defenseStrategy: string;
  };
  featuredLabId?: string;
}

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  securityContext: string;
}

export interface LabStep {
  stepNumber: number;
  title: string;
  instruction: string;
  actionType: 'click' | 'filter' | 'input' | 'simulate' | 'inspect' | 'calculate' | 'command' | 'observe';
  expectedInput?: string;
  targetNodeId?: string;
  hint: string;
  validationExplanation: string;
}

export interface Lab {
  id: string;
  title: string;
  phaseId: string;
  category: 'Fundamentals' | 'Addressing' | 'Switching' | 'Routing' | 'Protocols' | 'Security' | 'SOC' | 'Capstone';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  scenario: string;
  objective: string;
  environmentDescription: string;
  steps: LabStep[];
  knowledgeCheck?: KnowledgeCheckQuestion;
  completed?: boolean;
}

export interface ProtocolInfo {
  name: string;
  shortName: string;
  layer: LayerType;
  port?: number | string;
  transport: 'TCP' | 'UDP' | 'TCP/UDP' | 'IP' | 'Ethernet' | 'N/A';
  purpose: string;
  headerFields: { name: string; size: string; purpose: string; securityRelevance: string }[];
  rfc: string;
  securityRisks: string[];
  commonAttacks: string[];
  detectionMechanisms: string[];
  defenseControls: string[];
  wiresharkFilters: string[];
}

export interface PortInfo {
  port: number;
  service: string;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  purpose: string;
  trafficProfile: string;
  authentication: string;
  securityRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  commonAttacks: string[];
  detectionGuidance: string;
  defenseRemediation: string;
}

export interface AttackInfo {
  id: string;
  name: string;
  category: 'Layer 2 / Data Link' | 'Layer 3 / Network' | 'Layer 4 / Transport' | 'Layer 7 / Application' | 'Lateral Movement' | 'Exfiltration' | 'C2';
  targetProtocol: string;
  targetPort?: string;
  mitreTactic: string;
  mitreTechnique: string;
  description: string;
  normalTrafficPattern: string;
  attackTrafficPattern: string;
  indicatorsOfCompromise: string[];
  snortRule: string;
  sigmaRule: string;
  investigationSteps: string[];
  mitigationAndDefense: string[];
}

export interface DefenseInfo {
  id: string;
  name: string;
  layer: string;
  type: 'Preventative' | 'Detective' | 'Corrective' | 'Architectural' | 'Detective & Corrective';
  description: string;
  bestPractices: string[];
  configurationSnippet?: string;
  threatsMitigated: string[];
}

export interface RolePath {
  id: string;
  title: string;
  code: string;
  badge: string;
  shortDesc: string;
  fullDesc: string;
  recommendedPhaseIds: string[];
  keySkills: string[];
  primaryTools: string[];
  careerOverview: string;
}

export interface Mission {
  id: string;
  title: string;
  category: string;
  xp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  taskGoal: string;
  verificationType: 'visit_topic' | 'complete_lab' | 'calculate_subnet' | 'simulate_firewall' | 'inspect_packet';
  targetId: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'firewall' | 'core_switch' | 'server' | 'user' | 'dmz' | 'soc' | 'internet' | 'attacker';
  ip: string;
  mac: string;
  zone: 'Internet' | 'Edge' | 'Corporate' | 'DMZ' | 'SOC' | 'Untrusted';
  role: string;
  function: string;
  layer: LayerType;
  protocols: string[];
  ports: string[];
  securityImportance: string;
  commonAttacks: string[];
  detection: string;
  defense: string;
  relatedLabIds: string[];
}

export interface Packet {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  srcMac?: string;
  dstMac?: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ARP' | 'DNS' | 'DHCP' | 'HTTP' | 'HTTPS' | 'TLS';
  length: number;
  flags?: string[];
  seq?: number;
  ack?: number;
  info: string;
  payloadHex?: string;
  payloadAscii?: string;
  layerDetails: {
    ethernet?: { src: string; dst: string; type: string };
    ip?: { version: string; src: string; dst: string; ttl: number; proto: string; checksum: string };
    transport?: { srcPort: number; dstPort: number; flags?: string; seq?: number; ack?: number; window?: number; length?: number };
    app?: { type: string; summary: string; details: Record<string, string> };
  };
  anomalyFlag?: boolean;
  anomalyDescription?: string;
}

export interface FirewallRule {
  id: string;
  order: number;
  name: string;
  srcIp: string;
  dstIp: string;
  proto: 'ANY' | 'TCP' | 'UDP' | 'ICMP';
  port: string;
  action: 'ALLOW' | 'DENY' | 'LOG & DENY';
  enabled: boolean;
  hits: number;
}

export interface SubnetResult {
  ip: string;
  cidr: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  ipBinary: string[];
  maskBinary: string[];
  netBinary: string[];
  classType: string;
  isPrivate: boolean;
}

export interface CommandDoc {
  command: string;
  category: 'Diagnostic' | 'Routing' | 'Socket' | 'DNS' | 'Capture' | 'Security';
  syntax: string;
  purpose: string;
  simulatedOutput: string;
  whatToLookFor: string[];
  securityRelevance: string;
  flags: { flag: string; description: string }[];
}

export interface LearnerProgress {
  completedTopics: string[];
  completedLabs: string[];
  masteredSkills: string[];
  completedMissions: string[];
  quizScores: Record<string, number>;
  selectedRoleId?: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActive: string;
}
`;

fs.writeFileSync('src/types/index.ts', typesContent);
console.log('src/types/index.ts updated with comprehensive unions');
