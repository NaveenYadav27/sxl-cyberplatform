const fs = require('fs');

const attacks = [
  {
    id: 'atk-01',
    name: 'ARP Cache Poisoning (Man-in-the-Middle)',
    category: 'Layer 2 / Data Link',
    targetProtocol: 'ARP',
    targetPort: 'Layer 2 Ethernet',
    mitreTactic: 'Credential Access, Collection (TA0006, TA0009)',
    mitreTechnique: 'Adversary-in-the-Middle: ARP Poisoning (T1557.002)',
    description: 'The attacker broadcasts gratuitous unauthenticated ARP replies associating the IP of the default gateway with the attacker hardware MAC address, rerouting all subnet traffic through the attacker machine.',
    normalTrafficPattern: 'Unicast ARP replies occurring only in response to explicit ARP broadcast requests; stable 1:1 IP-to-MAC associations.',
    attackTrafficPattern: 'High-frequency unsolicited ARP replies mapping multiple distinct IP addresses (e.g. gateway and target) to a single MAC address.',
    indicatorsOfCompromise: [
      'Duplicate MAC addresses mapped to multiple IPs in host ARP tables',
      'Sudden change in the MAC address associated with the default gateway IP',
      'Elevated volume of Gratuitous ARP (GARP) packets on the local switch port'
    ],
    snortRule: 'alert arp any any -> any any (msg:"SX-ATTACK ARP Poisoning Gratuitous Reply Detected"; arp:reply; threshold:type both, track by_src, count 5, seconds 3; sid:2000001; rev:1;)',
    sigmaRule: 'title: ARP Cache Poisoning Detected\nstatus: production\nlogsource:\n  category: network_traffic\ndetection:\n  selection:\n    protocol: arp\n    arp.opcode: reply\n  timeframe: 10s\n  condition: count() > 10',
    investigationSteps: [
      'Inspect endpoint ARP tables using "arp -a" or "ip neigh show" to locate the duplicate MAC.',
      'Check the switch CAM/MAC address table to identify the physical switchport connected to the offending MAC.',
      'Capture local PCAP traffic using tcpdump to verify whether traffic is being forwarded or altered.',
      'Inspect host process tables on the suspect machine for tools like ettercap, arpspoof, or bettercap.'
    ],
    mitigationAndDefense: [
      'Enable Dynamic ARP Inspection (DAI) on all enterprise access switches.',
      'Configure DHCP Snooping to build a trusted binding database for DAI validation.',
      'Deploy 802.1X Port-Based Network Access Control with certificate validation.',
      'Configure static ARP bindings for critical gateway interfaces on legacy static endpoints.'
    ]
  },
  {
    id: 'atk-02',
    name: 'TCP SYN Flood Denial of Service',
    category: 'Layer 4 / Transport',
    targetProtocol: 'TCP',
    targetPort: '80, 443, 8080 (Any TCP Port)',
    mitreTactic: 'Impact (TA0040)',
    mitreTechnique: 'Network Denial of Service: Direct Network Flood (T1498.001)',
    description: 'The adversary transmits an overwhelming flood of TCP SYN packets with randomized spoofed source IP addresses to a target server without completing the 3-way handshake, exhausting the server embryonic connection backlog queue.',
    normalTrafficPattern: 'Balanced ratio of TCP SYN requests to completed TCP 3-way handshakes (SYN -> SYN-ACK -> ACK) and clean FIN/RST teardowns.',
    attackTrafficPattern: 'Massive volume of inbound TCP SYN packets with zero corresponding client ACKs, causing the server connection state table to lock up in SYN_RECV.',
    indicatorsOfCompromise: [
      'Surge in TCP connections in SYN_RECV state on the target server (ss -ant | grep SYN_RECV)',
      'Web services failing to accept new legitimate user connections (HTTP 504 / Connection Timeout)',
      'Disproportionate inbound bandwidth consumption from randomized non-responsive source IPs'
    ],
    snortRule: 'alert tcp any any -> $HOME_NET any (flags:S; msg:"SX-ATTACK Potential TCP SYN Flood Burst"; threshold:type threshold, track by_dst, count 500, seconds 1; sid:2000002; rev:1;)',
    sigmaRule: 'title: High Volume TCP SYN Flood\nstatus: production\nlogsource:\n  category: firewall\ndetection:\n  selection:\n    action: allowed\n    tcp.flags: SYN\n  timeframe: 1s\n  condition: count() > 500',
    investigationSteps: [
      'Run "netstat -s | grep -i syn" on the target host to check dropped embryonic connection counters.',
      'Check firewall connection metrics to identify target ports and verify whether source IPs are globally dispersed (spoofed/botnet).',
      'Analyze Wireshark PCAPs to verify window sizes, TCP options, and lack of client ACK responses.',
      'Activate upstream scrubbing or cloud DDoS mitigation (e.g. Cloudflare, AWS Shield).'
    ],
    mitigationAndDefense: [
      'Enable SYN Cookies in the host operating system kernel (net.ipv4.tcp_syncookies = 1).',
      'Configure TCP Intercept and Embryonic Connection Limits on edge firewalls.',
      'Deploy upstream Anycast DDoS mitigation scrubbing centers to absorb multi-gigabit floods.',
      'Implement rate-limiting on initial SYN requests per source IP.'
    ]
  },
  {
    id: 'atk-03',
    name: 'DNS Tunneling & Data Exfiltration',
    category: 'Layer 7 / Application',
    targetProtocol: 'DNS',
    targetPort: 'UDP/TCP 53',
    mitreTactic: 'Command and Control, Exfiltration (TA0011, TA0010)',
    mitreTechnique: 'Protocol Tunneling (T1572) & Exfiltration Over Alternative Protocol: DNS (T1048.003)',
    description: 'Malware encodes sensitive files or bidirectional C2 commands into base32/base64/hex subdomain prefixes of queries sent to an attacker-controlled authoritative nameserver, bypassing firewall inspection on port 53.',
    normalTrafficPattern: 'Standard hierarchical domain queries with short subdomains (e.g. mail.google.com, api.github.com) exhibiting normal English character distributions.',
    attackTrafficPattern: 'Massive continuous volume of DNS queries for long, randomized subdomains (e.g. 7f8a92c4b1.exfil.attacker.com) with high Shannon entropy and large TXT record responses.',
    indicatorsOfCompromise: [
      'High volume of DNS requests sent to a single root domain with varying subdomains',
      'Average subdomain length exceeding 45 characters',
      'Elevated Shannon entropy score (> 3.8) indicating encoded binary payload strings',
      'Spike in TXT and NULL record DNS response sizes'
    ],
    snortRule: 'alert dns $HOME_NET any -> any 53 (msg:"SX-ATTACK Suspicious Long Subdomain DNS Tunneling Pattern"; dns.query; content:"|00|"; pcre:"/^[a-z0-9+/=]{35,}\./i"; sid:2000003; rev:1;)',
    sigmaRule: 'title: DNS Tunneling Query Volume\nstatus: production\nlogsource:\n  category: dns\ndetection:\n  selection:\n    query_length|gt: 60\n  timeframe: 1m\n  condition: count() > 30',
    investigationSteps: [
      'Extract all queried domain names from DNS logs and sort by query count and subdomain length.',
      'Calculate character entropy on the suspect subdomain strings to confirm encrypted/encoded payloads.',
      'Identify the internal client IP originating the recursive queries in internal DNS server logs.',
      'Perform live endpoint forensic memory dump on the host to capture the running tunneling process (e.g. dnscat2, iodine).'
    ],
    mitigationAndDefense: [
      'Block direct outbound port 53 at firewalls; force all endpoints to query internal inspecting DNS resolvers.',
      'Deploy DNS Security Analytics engines capable of real-time entropy and query frequency scoring.',
      'Implement DNS Sinkholing for known malicious domain infrastructures.',
      'Enforce DNS-over-HTTPS (DoH) inspection policies on enterprise endpoints.'
    ]
  },
  {
    id: 'atk-04',
    name: 'SMB Lateral Movement (PsExec & Named Pipes)',
    category: 'Lateral Movement',
    targetProtocol: 'SMB / RPC',
    targetPort: 'TCP 445 / 135',
    mitreTactic: 'Lateral Movement, Execution (TA0008, TA0002)',
    mitreTechnique: 'Remote Services: SMB/Windows Admin Shares (T1021.002) & Service Execution (T1569.002)',
    description: 'Adversaries use compromised administrative credentials to connect to remote Windows administrative shares (ADMIN$, C$) over SMB port 445, upload a malicious service binary, and execute it via the Service Control Manager using Named Pipes.',
    normalTrafficPattern: 'Workstations communicating with centralized file servers and domain controllers; zero direct workstation-to-workstation SMB traffic.',
    attackTrafficPattern: 'Internal workstation initiating direct TCP 445 sessions to peer workstations, followed by Tree Connects to IPC$ and ADMIN$ and Named Pipe creation (\\pipe\\psexec).',
    indicatorsOfCompromise: [
      'Windows Event ID 7045 (New service installed) with random service names or PSEXESVC.exe',
      'Event ID 4624 (Logon Type 3 - Network Logon) using privileged administrator accounts',
      'Creation of Named Pipes matching patterns like \\pipe\\psexec, \\pipe\\csexec, or \\pipe\\remcom'
    ],
    snortRule: 'alert tcp $HOME_NET any -> $HOME_NET 445 (msg:"SX-ATTACK PsExec Service Named Pipe Access"; flow:to_server,established; content:"|5c|PIPE|5c|"; nocase; content:"psexec"; nocase; distance:0; sid:2000004; rev:1;)',
    sigmaRule: 'title: PsExec Lateral Movement Service Creation\nstatus: production\nlogsource:\n  product: windows\n  service: system\ndetection:\n  selection:\n    EventID: 7045\n    ServiceName|contains: [\'psexec\', \'PSEXESVC\']\n  condition: selection',
    investigationSteps: [
      'Check Windows Event Logs on the target host for Event ID 7045, 4624, and Sysmon Event ID 1 (Process Create).',
      'Identify the source IP that initiated the SMB connection over port 445 in firewall/NetFlow logs.',
      'Check filesystem in C:\\Windows\\ for newly dropped executable files matching the installed service.',
      'Perform Active Directory password reset for the compromised credential used in the lateral movement.'
    ],
    mitigationAndDefense: [
      'Block workstation-to-workstation TCP port 445 traffic using Windows Defender Firewall with Advanced Security.',
      'Enforce Tiered Administrative Architecture (Domain Admins cannot log into standard workstations).',
      'Enable SMB Signing across all endpoints and servers to prevent NTLM relay attacks.',
      'Deploy Microsoft LAPS (Local Administrator Password Solution) to ensure unique local admin passwords.'
    ]
  },
  {
    id: 'atk-05',
    name: 'VLAN Hopping (Double 802.1Q Tagging)',
    category: 'Layer 2 / Data Link',
    targetProtocol: '802.1Q Ethernet',
    targetPort: 'Layer 2 Switchport',
    mitreTactic: 'Lateral Movement (TA0008)',
    mitreTechnique: 'Network Boundary Bypass: VLAN Hopping',
    description: 'An attacker crafts an Ethernet frame containing two 802.1Q VLAN tags. The first tag matches the Native VLAN of the trunk link. The first switch strips the outer tag without retagging; the downstream switch processes the inner tag and forwards the frame into a restricted victim VLAN.',
    normalTrafficPattern: 'Single 802.1Q tag frames traversing trunk links with EtherType 0x8100 matching assigned VLAN memberships.',
    attackTrafficPattern: 'Frames originating from access ports carrying nested dual 802.1Q headers (EtherType 0x8100 followed by another 0x8100 tag).',
    indicatorsOfCompromise: [
      'Unidirectional malicious UDP/ICMP packets appearing on a secure VLAN originating from an untrusted subnet',
      'Switch port security violation logs on trunk-adjacent access ports',
      'NIDS alerts detecting nested 802.1Q headers on edge switch interfaces'
    ],
    snortRule: 'alert ip any any -> any any (msg:"SX-ATTACK Nested Double 802.1Q VLAN Tagging Detected"; byte_test:2,=,0x8100,12; byte_test:2,=,0x8100,16; sid:2000005; rev:1;)',
    sigmaRule: 'title: VLAN Hopping Double Tagging\nstatus: production\nlogsource:\n  category: switch_syslog\ndetection:\n  selection:\n    message|contains: [\'VLAN mismatch\', \'Double tagging violation\']\n  condition: selection',
    investigationSteps: [
      'Identify the physical switch port where the double-tagged frame originated.',
      'Check the trunk configuration between switches to verify the Native VLAN ID.',
      'Verify if any access ports were improperly assigned to the Native VLAN.',
      'Trace destination endpoints on the target VLAN to inspect for exploitation artifacts.'
    ],
    mitigationAndDefense: [
      'Explicitly configure all client-facing ports as access ports (switchport mode access).',
      'Disable Dynamic Trunking Protocol on all interfaces (switchport nonegotiate).',
      'Change the Native VLAN on all trunk links to an unused, isolated VLAN ID (e.g. VLAN 999).',
      'Force explicit tagging of the Native VLAN on trunk links (vlan dot1q tag native).'
    ]
  },
  {
    id: 'atk-06',
    name: 'BGP Route Hijacking & Prefix Interception',
    category: 'Layer 3 / Network',
    targetProtocol: 'BGP',
    targetPort: 'TCP 179',
    mitreTactic: 'Impact, Collection (TA0040, TA0009)',
    mitreTechnique: 'Network Boundary Bypass: Route Hijacking',
    description: 'A rogue or compromised Autonomous System (AS) broadcasts illegitimate BGP announcements claiming ownership of IP prefixes belonging to another entity, advertising more specific prefixes (e.g. /24 over /16) to steal and inspect global traffic.',
    normalTrafficPattern: 'Stable BGP AS-Paths conforming to authorized Route Origin Authorizations (ROAs) published in RPKI repositories.',
    attackTrafficPattern: 'Sudden unauthorized BGP UPDATE messages originating from an unexpected origin AS announcing more specific subnets of victim IP blocks.',
    indicatorsOfCompromise: [
      'Sudden drop in inbound enterprise internet traffic as traffic is redirected to the rogue AS',
      'BGPmon and RPKI monitoring alerts indicating invalid Origin AS for protected prefixes',
      'Traceroute paths from external probes routing through unexpected geographic regions'
    ],
    snortRule: 'alert tcp any 179 -> any any (msg:"SX-ATTACK BGP Malformed Update Prefix Length"; content:"|02|"; offset:18; sid:2000006; rev:1;)',
    sigmaRule: 'title: BGP Route Origin AS Change\nstatus: production\nlogsource:\n  category: network_telemetry\ndetection:\n  selection:\n    bgp.event: UPDATE\n    bgp.roastatus: INVALID\n  condition: selection',
    investigationSteps: [
      'Query global BGP looking glasses (e.g. BGPlay, RouteViews) to identify which AS originated the rogue prefix.',
      'Verify if the announced prefix is more specific than the legitimate organization route announcement.',
      'Contact upstream Tier-1 ISPs and transit providers to filter and drop the rogue BGP announcements.',
      'Publish emergency more-specific BGP announcements (/24s) to reclaim traffic routing authority.'
    ],
    mitigationAndDefense: [
      'Implement Resource Public Key Infrastructure (RPKI) and publish valid Route Origin Authorizations (ROAs).',
      'Configure RPKI Route Origin Validation (ROV) on edge border routers to reject invalid routes.',
      'Deploy BGP MD5/SHA authentication on all external and internal BGP peer sessions.',
      'Implement strict prefix filtering on all upstream and peer BGP relationships.'
    ]
  }
];

const defenses = [
  {
    id: 'def-01',
    name: 'Stateful Next-Generation Firewall (NGFW)',
    layer: 'Layer 3 - Layer 7',
    type: 'Preventative',
    description: 'Next-Generation Firewalls combine stateful connection tracking with Deep Packet Inspection (DPI), Application Identification (App-ID), User-ID integration, and encrypted SSL/TLS inspection.',
    bestPractices: [
      'Enforce an explicit Default Deny rule as the final rule in every policy.',
      'Order firewall rules from most specific (e.g. Host IP + Port) to least specific.',
      'Deploy Forward Proxy SSL Decryption to inspect encrypted HTTPS outbound traffic.',
      'Group rules logically by Security Zones (Trust, Untrust, DMZ, Management).'
    ],
    configurationSnippet: 'set security zones security-zone TRUST address-book address CORP_LAN 10.0.0.0/16\nset security policies from-zone TRUST to-zone UNTRUST policy ALLOW_WEB match source-address CORP_LAN destination-address any application [ junos-http junos-https ] then permit',
    threatsMitigated: ['Unauthorized external ingress', 'Data exfiltration over non-standard ports', 'Covert protocol tunneling', 'C2 beaconing']
  },
  {
    id: 'def-02',
    name: 'Dynamic ARP Inspection (DAI) & DHCP Snooping',
    layer: 'Layer 2 - Data Link',
    type: 'Preventative',
    description: 'DAI intercepts all ARP requests and responses on untrusted switch ports and validates their IP-to-MAC bindings against the trusted database built by DHCP Snooping before forwarding.',
    bestPractices: [
      'Enable DHCP Snooping globally before enabling Dynamic ARP Inspection.',
      'Mark only legitimate switch uplinks and router connections as "trusted" ports.',
      'Configure DAI rate-limiting on untrusted client ports (e.g. 15 pps) to prevent DoS against the switch CPU.',
      'Log and alert on DAI drop violations via centralized switch syslog.'
    ],
    configurationSnippet: 'ip dhcp snooping\nip dhcp snooping vlan 10,20\ninterface GigabitEthernet0/1\n ip dhcp snooping trust\nexit\nip arp inspection vlan 10,20\nip arp inspection validate src-mac dst-mac ip',
    threatsMitigated: ['ARP Cache Poisoning', 'Man-in-the-Middle on LAN', 'Rogue DHCP Server Injection', 'DHCP Starvation']
  },
  {
    id: 'def-03',
    name: 'Zero Trust Network Segmentation (Microsegmentation)',
    layer: 'Layer 2 - Layer 4',
    type: 'Architectural',
    description: 'Eliminates implicit trust inside the enterprise boundary by isolating workloads into micro-segments with least-privilege host firewalls, private VLANs, and identity-aware access proxies.',
    bestPractices: [
      'Block all workstation-to-workstation East-West traffic (ports 445, 135, 3389, 22, 5985).',
      'Isolate the DMZ web tier so that web servers cannot initiate outbound sessions to internal databases.',
      'Mandate multi-factor authentication (MFA) and device posture checks before granting network access.',
      'Deploy Private VLANs (PVLANs) on access switches to isolate peer endpoints on the same subnet.'
    ],
    configurationSnippet: 'New-NetFirewallRule -DisplayName "Block Workstation-to-Workstation SMB" -Direction Inbound -LocalPort 445 -Protocol TCP -Action Block -RemoteAddress 10.0.1.0/24',
    threatsMitigated: ['Lateral movement', 'Ransomware worm spreading', 'Pass-the-Hash exploitation', 'Internal network reconnaissance']
  },
  {
    id: 'def-04',
    name: 'Inline Intrusion Prevention System (IPS)',
    layer: 'Layer 3 - Layer 7',
    type: 'Detective & Corrective',
    description: 'Inline IPS systems inspect real-time network packets against thousands of vulnerability exploit signatures and protocol anomaly rules, automatically dropping malicious packets and resetting TCP sessions.',
    bestPractices: [
      'Deploy IPS inline with automatic fail-open bypass modules to prevent network outages.',
      'Enable protocol normalization preprocessors to defeat fragmentation and URL encoding evasion.',
      'Automate daily threat intelligence and signature rule updates from reliable feeds (e.g. Talos, ET Pro).',
      'Tune rules into "Alert Only" mode in staging before transitioning to active "Drop / Reject" in production.'
    ],
    configurationSnippet: 'drop tcp $EXTERNAL_NET any -> $HTTP_SERVERS $HTTP_PORTS (msg:"EXPLOIT Apache Log4j RCE CVE-2021-44228"; flow:to_server,established; content:"${jndi:"; nocase; sid:2034647; rev:1;)',
    threatsMitigated: ['Known CVE Remote Code Execution', 'SQL Injection and Command Injection', 'Port Scanning sweeps', 'Malware payload downloads']
  }
];

const attacksCode = 'import { AttackInfo } from "../types";\n\nexport const ATTACKS: AttackInfo[] = ' + JSON.stringify(attacks, null, 2) + ';\n';
const defensesCode = 'import { DefenseInfo } from "../types";\n\nexport const DEFENSES: DefenseInfo[] = ' + JSON.stringify(defenses, null, 2) + ';\n';

fs.writeFileSync('src/data/attacks.ts', attacksCode);
fs.writeFileSync('src/data/defenses.ts', defensesCode);

console.log('src/data/attacks.ts and src/data/defenses.ts generated successfully');
