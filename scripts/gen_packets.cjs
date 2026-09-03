const fs = require('fs');

const packets = [
  {
    id: 'pkt-01', timestamp: '14:22:01.104829', srcIp: '192.168.1.50', dstIp: '10.0.2.10',
    srcPort: 54102, dstPort: 443, srcMac: '00:50:56:a1:b2:c3', dstMac: '00:50:56:a1:b2:01',
    protocol: 'TCP', length: 74, flags: ['SYN'], seq: 1000, ack: 0,
    info: '54102 ? 443 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM=1',
    payloadHex: '4500003c 7a1b4000 40062b8a c0a80132 0a00020a d35601bb 000003e8 00000000 a002faf0 b2340000 020405b4 0402080a',
    payloadAscii: 'E..<z.@.@.+....2...V...........4....',
    layerDetails: {
      ethernet: { src: '00:50:56:a1:b2:c3', dst: '00:50:56:a1:b2:01 (Default Gateway)', type: 'IPv4 (0x0800)' },
      ip: { version: 'IPv4', src: '192.168.1.50', dst: '10.0.2.10', ttl: 64, proto: 'TCP (6)', checksum: '0x2b8a [correct]' },
      transport: { srcPort: 54102, dstPort: 443, flags: '0x002 (SYN)', seq: 1000, ack: 0, window: 64240, length: 0 },
      app: { type: 'TCP Handshake', summary: 'Connection Request to HTTPS server', details: { 'Initial Sequence Number': '1000', 'MSS': '1460 bytes' } }
    }
  },
  {
    id: 'pkt-02', timestamp: '14:22:01.105948', srcIp: '10.0.2.10', dstIp: '192.168.1.50',
    srcPort: 443, dstPort: 54102, srcMac: '00:50:56:a1:b2:01', dstMac: '00:50:56:a1:b2:c3',
    protocol: 'TCP', length: 74, flags: ['SYN', 'ACK'], seq: 5000, ack: 1001,
    info: '443 ? 54102 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0 MSS=1460',
    payloadHex: '4500003c 00004000 4006a5a6 0a00020a c0a80132 01bbd356 00001388 000003e9 a012fe88 9c2a0000 020405b4 0402080a',
    payloadAscii: 'E..<..@.@......2...V.........*......',
    layerDetails: {
      ethernet: { src: '00:50:56:a1:b2:01', dst: '00:50:56:a1:b2:c3', type: 'IPv4 (0x0800)' },
      ip: { version: 'IPv4', src: '10.0.2.10', dst: '192.168.1.50', ttl: 64, proto: 'TCP (6)', checksum: '0xa5a6 [correct]' },
      transport: { srcPort: 443, dstPort: 54102, flags: '0x012 (SYN, ACK)', seq: 5000, ack: 1001, window: 65160, length: 0 },
      app: { type: 'TCP Handshake', summary: 'Server Acknowledgement and SYN response', details: { 'Server ISN': '5000', 'Acknowledged Client ISN': '1001' } }
    }
  },
  {
    id: 'pkt-03', timestamp: '14:22:01.106012', srcIp: '192.168.1.50', dstIp: '10.0.2.10',
    srcPort: 54102, dstPort: 443, srcMac: '00:50:56:a1:b2:c3', dstMac: '00:50:56:a1:b2:01',
    protocol: 'TCP', length: 54, flags: ['ACK'], seq: 1001, ack: 5001,
    info: '54102 ? 443 [ACK] Seq=1 Ack=1 Win=64240 Len=0',
    payloadHex: '45000028 7a1c4000 40062b9d c0a80132 0a00020a d35601bb 000003e9 00001389 5010faf0 b2200000',
    payloadAscii: 'E..(z.@.@.+....2...V........P.. ..',
    layerDetails: {
      ethernet: { src: '00:50:56:a1:b2:c3', dst: '00:50:56:a1:b2:01', type: 'IPv4 (0x0800)' },
      ip: { version: 'IPv4', src: '192.168.1.50', dst: '10.0.2.10', ttl: 64, proto: 'TCP (6)', checksum: '0x2b9d' },
      transport: { srcPort: 54102, dstPort: 443, flags: '0x010 (ACK)', seq: 1001, ack: 5001, window: 64240, length: 0 },
      app: { type: 'TCP Handshake', summary: '3-Way Handshake Established', details: { 'Status': 'ESTABLISHED' } }
    }
  },
  {
    id: 'pkt-04', timestamp: '14:22:05.340192', srcIp: '192.168.1.50', dstIp: '10.0.0.2',
    srcPort: 58912, dstPort: 53, srcMac: '00:50:56:a1:b2:c3', dstMac: '00:50:56:a1:b2:01',
    protocol: 'DNS', length: 112,
    info: 'Standard query 0x4a7f A 7a8f29c4e1b99214.exfil.attacker-c2.net',
    payloadHex: '45000062 1a2b0000 401189ac c0a80132 0a000002 e6200035 004e3892 4a7f0100 00010000 00000000 20376138 66323963 34653162 39393231 34056578 66696c0b 61747461 636b6572 2d633203 6e657400 00010001',
    payloadAscii: 'E..b.+..@......2... .5.N8.J........ 7a8f29c4e1b99214.exfil.attacker-c2.net...',
    layerDetails: {
      ethernet: { src: '00:50:56:a1:b2:c3', dst: '00:50:56:a1:b2:01', type: 'IPv4 (0x0800)' },
      ip: { version: 'IPv4', src: '192.168.1.50', dst: '10.0.0.2 (Internal DNS)', ttl: 64, proto: 'UDP (17)', checksum: '0x89ac' },
      transport: { srcPort: 58912, dstPort: 53, length: 78 },
      app: { type: 'DNS Query', summary: 'High Entropy Subdomain Query', details: { 'Query Name': '7a8f29c4e1b99214.exfil.attacker-c2.net', 'Record Type': 'A (IPv4 Address)', 'Transaction ID': '0x4a7f' } }
    },
    anomalyFlag: true,
    anomalyDescription: 'Suspicious DNS Tunneling Query: Subdomain contains encoded hex data with high Shannon entropy (>3.9).'
  },
  {
    id: 'pkt-05', timestamp: '14:22:08.829104', srcIp: '192.168.1.50', dstIp: '198.51.100.42',
    srcPort: 52418, dstPort: 4444, srcMac: '00:50:56:a1:b2:c3', dstMac: '00:50:56:a1:b2:01',
    protocol: 'TCP', length: 142, flags: ['PSH', 'ACK'], seq: 120, ack: 45,
    info: '52418 ? 4444 [PSH, ACK] Seq=120 Ack=45 Win=64240 Len=88 [Reverse Shell Traffic]',
    payloadHex: '45000080 3c4a4000 3f065a21 c0a80132 c633642a ccbf115c 00000078 0000002d 5018faf0 49200000 756e616d 65202d61 3b206964 3b207768 6f616d69 0a4c696e 75782075 62756e74 7520352e 31352e30 20756964 3d302872 6f6f7429 20676964 3d302872 6f6f7429 0a',
    payloadAscii: 'E...<J@.?.Z!..2.3d*...\\...x...-P..I ..uname -a; id; whoami.Linux ubuntu 5.15.0 uid=0(root) gid=0(root).',
    layerDetails: {
      ethernet: { src: '00:50:56:a1:b2:c3', dst: '00:50:56:a1:b2:01', type: 'IPv4 (0x0800)' },
      ip: { version: 'IPv4', src: '192.168.1.50', dst: '198.51.100.42', ttl: 63, proto: 'TCP (6)', checksum: '0x5a21' },
      transport: { srcPort: 52418, dstPort: 4444, flags: '0x018 (PSH, ACK)', seq: 120, ack: 45, window: 64240, length: 88 },
      app: { type: 'Cleartext Shell Stream', summary: 'Interactive Shell Command and Response', details: { 'Executed Command': 'uname -a; id; whoami', 'Output': 'Linux ubuntu 5.15.0 uid=0(root) gid=0(root)' } }
    },
    anomalyFlag: true,
    anomalyDescription: 'Active Unencrypted Reverse Shell over non-standard port 4444 executing root system commands!'
  }
];

const missions = [
  {
    id: 'mis-01',
    title: 'Trace a 3-Way TCP Handshake',
    category: 'Protocols',
    xp: 50,
    difficulty: 'Easy',
    description: 'Inspect the TCP packet stream and identify the SYN, SYN-ACK, and ACK sequence numbers.',
    taskGoal: 'Open the TCP Handshake visualizer or Packet Analyzer and locate the ESTABLISHED connection state.',
    verificationType: 'visit_topic',
    targetId: 'topic-11-01'
  },
  {
    id: 'mis-02',
    title: 'Identify the Recursive DNS Resolver',
    category: 'Diagnostics',
    xp: 75,
    difficulty: 'Easy',
    description: 'Use the simulated terminal to run dig/nslookup and identify the configured recursive resolver IP.',
    taskGoal: 'Run "dig" in the command lab to query a domain and view the SERVER line.',
    verificationType: 'visit_topic',
    targetId: 'topic-13-01'
  },
  {
    id: 'mis-03',
    title: 'Calculate a /27 Subnet',
    category: 'Addressing',
    xp: 100,
    difficulty: 'Medium',
    description: 'Use the Visual Subnet Calculator to determine the broadcast address and usable host range for 192.168.10.0/27.',
    taskGoal: 'Enter 192.168.10.0 with CIDR /27 into the Subnetting Engine.',
    verificationType: 'calculate_subnet',
    targetId: 'subnet-calc'
  },
  {
    id: 'mis-04',
    title: 'Investigate Suspicious DNS Tunneling',
    category: 'SOC',
    xp: 150,
    difficulty: 'Hard',
    description: 'Filter packets for long encoded subdomain queries and identify the exfiltrated hostname.',
    taskGoal: 'In the Packet Analyzer, apply filter "dns" and locate the anomalous high-entropy packet.',
    verificationType: 'inspect_packet',
    targetId: 'pkt-04'
  },
  {
    id: 'mis-05',
    title: 'Configure Firewall Rule Against Reverse Shells',
    category: 'Defense',
    xp: 125,
    difficulty: 'Medium',
    description: 'In the Firewall Simulator, build an egress rule to block unauthorized outbound TCP port 4444 traffic.',
    taskGoal: 'Add a rule blocking Source 10.0.0.0/16 to Any Destination on Port 4444.',
    verificationType: 'simulate_firewall',
    targetId: 'firewall-sim'
  }
];

const packetsCode = 'import { Packet } from "../types";\n\nexport const SIMULATED_PACKETS: Packet[] = ' + JSON.stringify(packets, null, 2) + ';\n';
const missionsCode = 'import { Mission } from "../types";\n\nexport const MISSIONS: Mission[] = ' + JSON.stringify(missions, null, 2) + ';\n';

fs.writeFileSync('src/data/simulatedPackets.ts', packetsCode);
fs.writeFileSync('src/data/missions.ts', missionsCode);

console.log('src/data/simulatedPackets.ts and src/data/missions.ts generated successfully');
