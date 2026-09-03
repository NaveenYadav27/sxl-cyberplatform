const fs = require('fs');

const roles = [
  {
    id: 'role-soc-l1',
    title: 'SOC Analyst Tier 1',
    code: 'SOC-L1',
    badge: 'Triage & Alert Analysis',
    shortDesc: 'Frontline cyber defense: monitor SIEM alerts, triage network anomalies, investigate PCAPs, and distinguish true attacks from false positives.',
    fullDesc: 'As a Tier 1 SOC Analyst, you are the first line of defense. You inspect real-time network telemetry, analyze firewall and NIDS alerts, extract indicators of compromise (IOCs) from PCAP captures, and escalate genuine security incidents to Tier 2.',
    recommendedPhaseIds: ['phase-01', 'phase-02', 'phase-04', 'phase-11', 'phase-13', 'phase-16', 'phase-19', 'phase-20', 'phase-22'],
    keySkills: ['Network Telemetry Analysis', 'Wireshark PCAP Investigation', 'Snort/Suricata Rule Reading', 'SIEM Alert Triage', 'TCP/IP Diagnostics', 'DNS Analysis'],
    primaryTools: ['Wireshark / Tshark', 'Splunk / Elastic SIEM', 'Suricata / Snort', 'Zeek Network Monitor', 'VirusTotal / Threat Intel'],
    careerOverview: 'Standard entry point into cybersecurity operations with strong progression toward Tier 2, Threat Hunting, and Incident Response.'
  },
  {
    id: 'role-soc-l2',
    title: 'SOC Analyst Tier 2 / Incident Responder',
    code: 'SOC-L2',
    badge: 'Deep Investigation & IR',
    shortDesc: 'Deep incident investigation: scope intrusions, correlate multi-hop lateral movement, analyze encrypted C2 telemetry, and lead containment.',
    fullDesc: 'Tier 2 analysts handle escalated high-severity incidents. You reconstruct complex multi-stage attack timelines, analyze malware network beaconing with jitter, perform live endpoint memory correlation, and execute containment playbooks.',
    recommendedPhaseIds: ['phase-01', 'phase-02', 'phase-08', 'phase-09', 'phase-11', 'phase-13', 'phase-15', 'phase-18', 'phase-20', 'phase-21', 'phase-22', 'phase-23'],
    keySkills: ['Root Cause Analysis', 'C2 Beaconing Traffic Profiling', 'Lateral Movement Forensics', 'Firewall Policy Enforcement', 'Incident Timeline Reconstruction'],
    primaryTools: ['Wireshark', 'EDR (CrowdStrike / Defender)', 'SIEM / SOAR', 'Network Forensics TAPs', 'CyberChef'],
    careerOverview: 'Advanced operations role responsible for active incident containment, forensic investigation, and detection engineering.'
  },
  {
    id: 'role-vapt',
    title: 'Vulnerability Assessment & Penetration Tester',
    code: 'VAPT',
    badge: 'Network Penetration Testing',
    shortDesc: 'Authorized offensive testing: scan network ranges, enumerate services, identify misconfigurations, and exploit network vulnerabilities.',
    fullDesc: 'Penetration testers simulate adversarial attacks to find weaknesses before threat actors do. You will scan subnets, enumerate open ports and daemon banners, test for VLAN hopping and ARP spoofing, and validate perimeter defenses.',
    recommendedPhaseIds: ['phase-01', 'phase-03', 'phase-04', 'phase-05', 'phase-07', 'phase-08', 'phase-11', 'phase-16', 'phase-18', 'phase-21'],
    keySkills: ['Network Port Scanning & Enumeration', 'Vulnerability Exploitation', 'Subnet Sizing & Routing Analysis', 'Layer 2/3 Boundary Bypass', 'Protocol Dissection'],
    primaryTools: ['Nmap / Masscan', 'Metasploit Framework', 'Burp Suite Professional', 'Responder / Impacket', 'Wireshark'],
    careerOverview: 'High-demand offensive cybersecurity role assessing enterprise security posture through ethical hacking.'
  },
  {
    id: 'role-red-team',
    title: 'Red Team Operator',
    code: 'RED-TEAM',
    badge: 'Adversary Simulation',
    shortDesc: 'Advanced adversary emulation: covert C2 channels, DNS tunneling, evasion of NIDS/EDR, lateral movement, and data exfiltration.',
    fullDesc: 'Red Team operators emulate sophisticated Advanced Persistent Threats (APTs). You design custom covert communication channels over DNS and HTTPS, bypass network segmentation, and test the detection capabilities of the Blue Team.',
    recommendedPhaseIds: ['phase-01', 'phase-08', 'phase-09', 'phase-10', 'phase-11', 'phase-13', 'phase-15', 'phase-21', 'phase-23'],
    keySkills: ['Covert C2 Architecture & Jitter', 'DNS / ICMP Protocol Tunneling', 'Evasion of NIDS & Proxies', 'Active Directory Lateral Pivoting', 'Data Exfiltration Tactics'],
    primaryTools: ['Cobalt Strike / Sliver', 'Chisel / ProxyChains', 'Iodine / dnscat2', 'BloodHound', 'Custom Python Sockets'],
    careerOverview: 'Elite offensive role testing organization-wide detection and response capabilities against realistic multi-stage campaigns.'
  },
  {
    id: 'role-net-sec',
    title: 'Network Security Engineer',
    code: 'NET-SEC',
    badge: 'Infrastructure & Defense Architecture',
    shortDesc: 'Design, configure, and maintain enterprise defense controls: NGFWs, VPNs, microsegmentation, 802.1X, and Zero Trust architectures.',
    fullDesc: 'Network Security Engineers build and maintain the defensive infrastructure. You architect secure multi-zone networks, configure firewall rule sets with top-down precision, deploy Dynamic ARP Inspection and DHCP Snooping, and maintain secure remote access.',
    recommendedPhaseIds: ['phase-01', 'phase-02', 'phase-03', 'phase-05', 'phase-07', 'phase-08', 'phase-09', 'phase-10', 'phase-14', 'phase-18', 'phase-19'],
    keySkills: ['Firewall Rule Architecture & Auditing', 'VLAN & Trunk Configuration', 'Dynamic ARP Inspection & DHCP Snooping', 'VPN & IPsec Engineering', 'Zero Trust Microsegmentation'],
    primaryTools: ['Palo Alto / Fortinet / Cisco Firewalls', 'Cisco ISE / 802.1X', 'Wireshark', 'IPAM & Subnet Managers', 'Suricata / Snort'],
    careerOverview: 'Core engineering role responsible for building resilient, segmented, and well-defended enterprise network architectures.'
  },
  {
    id: 'role-dfir',
    title: 'Digital Forensics & Incident Response (DFIR)',
    code: 'DFIR',
    badge: 'Network Evidence & Forensics',
    shortDesc: 'Reconstruct evidence from PCAPs, carve files from network streams, decode protocol tunnels, and build court-admissible timelines.',
    fullDesc: 'DFIR specialists conduct rigorous technical post-mortem and live forensics following major intrusions. You analyze gigabytes of raw packet captures, carve exfiltrated documents, extract decrypted TLS streams, and reconstruct attacker kill chains.',
    recommendedPhaseIds: ['phase-02', 'phase-04', 'phase-11', 'phase-12', 'phase-13', 'phase-15', 'phase-20', 'phase-21', 'phase-22', 'phase-23'],
    keySkills: ['PCAP Stream Carving & Reassembly', 'Decryption & Protocol Forensics', 'Encrypted C2 Analysis', 'Incident Timeline Generation', 'Forensic Evidence Preservation'],
    primaryTools: ['Wireshark / Tshark', 'NetworkMiner', 'Zeek / Brim', 'Volatility Memory Forensics', 'FTK Imager'],
    careerOverview: 'Specialized investigative role providing detailed root cause forensics and technical incident reports.'
  },
  {
    id: 'role-cloud-sec',
    title: 'Cloud Security Architect',
    code: 'CLOUD-SEC',
    badge: 'Cloud Networking & Zero Trust',
    shortDesc: 'Design secure multi-cloud virtual networks (VPCs/VNets), transit gateways, security groups, and cloud microsegmentation.',
    fullDesc: 'Cloud Security Architects design secure software-defined networks in AWS, Azure, and GCP. You configure VPC peering, Security Groups, Network ACLs, Transit Gateways, and integrate cloud-native flow logs (VPC Flow Logs) with SIEM solutions.',
    recommendedPhaseIds: ['phase-01', 'phase-04', 'phase-05', 'phase-08', 'phase-09', 'phase-10', 'phase-15', 'phase-18', 'phase-22'],
    keySkills: ['Cloud VPC / VNet Architecture', 'Security Groups & Cloud NACLs', 'VPC Flow Log Analysis', 'Cloud Transit Gateway Security', 'Identity-Aware Network Proxies'],
    primaryTools: ['AWS VPC / Transit Gateway', 'Azure Virtual Network', 'Terraform / CloudFormation', 'Cloud SIEM / Wiz / Prisma', 'Wireshark'],
    careerOverview: 'Rapidly growing discipline securing hybrid enterprise cloud infrastructure and Kubernetes network overlays.'
  }
];

const commands = [
  {
    command: 'ip addr',
    category: 'Diagnostic',
    syntax: 'ip addr [show [dev <interface>]]',
    purpose: 'Displays all network interfaces, IP addresses (IPv4 & IPv6), subnet masks, MAC addresses, and operational link states.',
    simulatedOutput: '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n    inet6 ::1/128 scope host\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default\n    link/ether 00:50:56:a1:b2:c3 brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.50/24 brd 192.168.1.255 scope global dynamic eth0\n    inet6 fe80::250:56ff:fea1:b2c3/64 scope link',
    whatToLookFor: [
      'Verify interface state is UP, LOWER_UP',
      'Check assigned IP and CIDR subnet mask (/24 indicates 255.255.255.0)',
      'Inspect MAC address for OUI vendor identification',
      'Check for unexpected promiscuous mode flags (PROMISC) indicating packet sniffing'
    ],
    securityRelevance: 'Attacker or defender first step for local host networking reconnaissance. Identifies all connected subnets and interfaces (e.g. dual-homed machines).',
    flags: [
      { flag: '-4', description: 'Show IPv4 addresses only' },
      { flag: '-6', description: 'Show IPv6 addresses only' },
      { flag: '-br', description: 'Print output in brief tabular format' }
    ]
  },
  {
    command: 'ip route',
    category: 'Routing',
    syntax: 'ip route [show]',
    purpose: 'Displays the kernel IPv4 routing table including default gateway, subnet routes, metrics, and exit interfaces.',
    simulatedOutput: 'default via 192.168.1.1 dev eth0 proto dhcp metric 100\n10.0.0.0/16 via 192.168.1.254 dev eth0 metric 20\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50 metric 100',
    whatToLookFor: [
      'Identify default gateway IP address (default via X.X.X.X)',
      'Check for static routes routing internal traffic through unexpected gateways (Man-in-the-Middle)',
      'Verify route metrics to see which path takes precedence'
    ],
    securityRelevance: 'Malware frequently modifies routing tables to redirect victim traffic through rogue proxies or VPN tunnels.',
    flags: [
      { flag: 'get <ip>', description: 'Show the exact route and interface kernel will use for destination IP' }
    ]
  },
  {
    command: 'ss',
    category: 'Socket',
    syntax: 'ss [options]',
    purpose: 'Socket statistics utility replacing netstat; dumps active TCP, UDP, and UNIX socket connections and listening ports.',
    simulatedOutput: 'State      Recv-Q  Send-Q   Local Address:Port          Peer Address:Port   Process\nLISTEN     0       128            0.0.0.0:22                 0.0.0.0:*       users:(("sshd",pid=842,fd=3))\nLISTEN     0       511            0.0.0.0:443                0.0.0.0:*       users:(("nginx",pid=1204,fd=6))\nESTAB      0       0         192.168.1.50:52418         198.51.100.42:4444    users:(("nc",pid=4192,fd=3))',
    whatToLookFor: [
      'Identify all LISTEN sockets to locate exposed services',
      'Look for ESTABLISHED connections to non-standard remote ports (e.g. port 4444 reverse shell above!)',
      'Check process name (users:(("...")) and PID associated with suspicious network sockets'
    ],
    securityRelevance: 'Essential command for discovering backdoors, reverse shells, unauthenticated listening daemons, and C2 sockets on compromised endpoints.',
    flags: [
      { flag: '-t', description: 'Display TCP sockets' },
      { flag: '-u', description: 'Display UDP sockets' },
      { flag: '-l', description: 'Display listening sockets only' },
      { flag: '-n', description: 'Do not resolve service names (numeric ports)' },
      { flag: '-p', description: 'Show process using socket' }
    ]
  },
  {
    command: 'tcpdump',
    category: 'Capture',
    syntax: 'tcpdump [options] [expression]',
    purpose: 'Command-line packet analyzer for capturing and filtering live network traffic on Linux interfaces.',
    simulatedOutput: '15:30:02.104829 IP 192.168.1.50.54210 > 10.0.2.10.443: Flags [S], seq 3829104819, win 64240, options [mss 1460,sackOK,TS val 1029304 ecr 0], length 0\n15:30:02.105948 IP 10.0.2.10.443 > 192.168.1.50.54210: Flags [S.], seq 948201948, ack 3829104820, win 65160, options [mss 1460,sackOK,TS val 2094821 ecr 1029304], length 0\n15:30:02.106012 IP 192.168.1.50.54210 > 10.0.2.10.443: Flags [.], ack 1, win 64240, length 0',
    whatToLookFor: [
      'TCP Flags: [S] = SYN, [S.] = SYN-ACK, [.] = ACK, [P.] = PSH+ACK, [F.] = FIN+ACK, [R] = RST',
      'Sequence and Acknowledgment numbers',
      'Payload lengths and protocol conversation flows'
    ],
    securityRelevance: 'Primary terminal tool for live packet capture, diagnosing network attacks, and saving PCAP files for forensic analysis in Wireshark.',
    flags: [
      { flag: '-i <iface>', description: 'Specify capture network interface' },
      { flag: '-nn', description: 'Do not resolve hostnames or port names' },
      { flag: '-w <file.pcap>', description: 'Write raw packets to PCAP file' },
      { flag: '-r <file.pcap>', description: 'Read packets from PCAP file' },
      { flag: '-v / -vv / -vvv', description: 'Increase protocol decode verbosity' }
    ]
  },
  {
    command: 'nmap',
    category: 'Security',
    syntax: 'nmap [Scan Type] [Options] {target specification}',
    purpose: 'Network exploration tool and security scanner for host discovery, port scanning, OS detection, and vulnerability detection.',
    simulatedOutput: 'Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for target.shadowxlab.internal (10.0.2.10)\nHost is up (0.0012s latency).\nNot shown: 996 closed tcp ports (reset)\nPORT     STATE SERVICE VERSION\n22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)\n80/tcp   open  http    Apache httpd 2.4.52 ((Ubuntu))\n443/tcp  open  ssl/http Apache httpd 2.4.52\n|_http-title: ShadowXLab Corporate Portal\n3306/tcp open  mysql   MySQL 8.0.36-0ubuntu0.22.04.1\nMAC Address: 00:50:56:A1:B2:C4 (VMware)\nService Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel',
    whatToLookFor: [
      'Open ports and exact daemon software versions (OpenSSH 8.9p1, Apache 2.4.52)',
      'Unnecessary open database or administrative ports (Port 3306 MySQL open to network)',
      'Operating system fingerprint details and MAC address manufacturer (VMware)'
    ],
    securityRelevance: 'Standard tool used by penetration testers for reconnaissance and by network defenders to audit exposure and rogue services.',
    flags: [
      { flag: '-sS', description: 'TCP SYN Stealth Scan (does not complete 3-way handshake)' },
      { flag: '-sV', description: 'Probe open ports to determine service and version info' },
      { flag: '-sC', description: 'Run default safe NSE vulnerability scripts' },
      { flag: '-p <ports>', description: 'Specify port range (e.g. -p 1-1000 or -p- for all 65535)' },
      { flag: '-Pn', description: 'Treat all hosts as online (skip ICMP ping host discovery)' }
    ]
  }
];

const rolesCode = 'import { RolePath } from "../types";\n\nexport const ROLES: RolePath[] = ' + JSON.stringify(roles, null, 2) + ';\n';
const commandsCode = 'import { CommandDoc } from "../types";\n\nexport const COMMANDS: CommandDoc[] = ' + JSON.stringify(commands, null, 2) + ';\n';

fs.writeFileSync('src/data/roles.ts', rolesCode);
fs.writeFileSync('src/data/commands.ts', commandsCode);

console.log('src/data/roles.ts and src/data/commands.ts generated successfully');
