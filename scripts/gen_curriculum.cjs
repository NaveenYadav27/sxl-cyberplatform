const fs = require('fs');

const rawPhases = [
  {
    id: 'phase-01', phaseNumber: 1, title: 'Networking Mental Model',
    subtitle: 'Architecture, Trust Boundaries & Network Flow',
    description: 'Establish the core mental model of computer networks: how hosts talk, network topologies, boundaries, and how architecture defines the cyber attack surface.',
    category: 'Fundamentals',
    learningOutcomes: [
      'Understand why networks exist and how client-server communication works',
      'Distinguish LAN, WAN, DMZ, Intranet, and Internet trust boundaries',
      'Analyze North-South vs East-West traffic flows for threat modeling',
      'Recognize how segmentation failures lead to lateral movement'
    ],
    securityMapping: {
      attackSurface: 'Unsegmented networks allow flat lateral movement and unchecked reconnaissance.',
      indicators: 'Unusual East-West traffic flows between workstations, unexpected DMZ to internal database connections.',
      detectionMethod: 'Flow baseline anomaly detection, zone transition monitoring, internal NetFlow analysis.',
      defenseStrategy: 'Zero Trust architecture, micro-segmentation, strict edge and internal firewalls.'
    },
    featuredLabId: 'lab-01',
    topics: [
      {
        id: 'topic-01-01', phaseId: 'phase-01', title: 'What Is Networking & Why Networks Exist', slug: 'what-is-networking',
        estimatedMinutes: 15, difficulty: 'Beginner',
        summary: 'Networks connect computational nodes to share data and services. In cybersecurity, the network is the primary medium through which attacks propagate and where defenders observe threat telemetry.',
        concepts: [
          {
            id: 'c-01-01', title: 'The Client-Server & Peer Model',
            shortDesc: 'How endpoints request and provide digital resources across network boundaries.',
            detailedContent: 'Clients initiate requests to listening daemon services (servers) bound to network sockets (IP + Port). Understanding who initiates a connection is essential for firewall ingress/egress rules and identifying Reverse Shells.',
            securityImpact: 'Attackers frequently use Reverse Shells to invert the client-server relationship: compromised internal servers initiate outbound connections to attacker C2 servers to bypass inbound firewall rules.',
            attackSurface: 'Every open listening port on a server exposes code to remote input parsing vulnerabilities.',
            detectionAngle: 'Monitor listening ports on endpoints and track unexpected outbound socket connections initiated by system processes.',
            defenseControl: 'Egress filtering, endpoint host-based firewalls, disabling unneeded services.',
            cliCommand: 'ss -tulnp || netstat -ano',
            keyTakeaways: [
              'A socket is an IP address combined with a Transport Layer port number.',
              'Inbound connections target open server ports; outbound connections originate from ephemeral client ports.',
              'Reverse shells leverage outbound client connections to bypass inbound perimeter blocks.'
            ]
          },
          {
            id: 'c-01-02', title: 'Network Types: LAN, WAN, Intranet, DMZ',
            shortDesc: 'Geographic and security boundary classifications of computer networks.',
            detailedContent: 'LANs connect local trusted hosts; WANs span wide geographic distances across untrusted carrier networks. The DMZ (Demilitarized Zone) is an isolated subnet exposing public services (Web, Mail) while preventing direct connections into the private internal LAN.',
            securityImpact: 'DMZ breaches must never grant automatic access to the internal network. Flat LANs allow single compromised endpoints to pivot into domain controllers.',
            attackSurface: 'Dual-homed DMZ servers bridging public and private subnets.',
            detectionAngle: 'Alert on any direct session initiated from DMZ hosts into internal management subnets.',
            defenseControl: 'Dual-firewall DMZ architecture, jump boxes, air-gapped backups.',
            keyTakeaways: [
              'DMZ isolates external-facing servers from critical internal corporate assets.',
              'Never store sensitive backend databases directly in the DMZ.',
              'Trust is not binary; treat internal networks as hostile (Zero Trust).'
            ]
          }
        ],
        knowledgeChecks: [
          {
            id: 'kc-01-01',
            question: 'Why do attackers frequently deploy Reverse Shells instead of standard Bind Shells?',
            options: [
              'Reverse shells consume less network bandwidth',
              'Perimeter firewalls typically allow outbound traffic while blocking inbound connections',
              'Reverse shells automatically encrypt packet payloads',
              'Bind shells require administrative root privileges'
            ],
            correctIndex: 1,
            explanation: 'Most network firewalls block incoming connections from the Internet to internal hosts, but allow outbound traffic. A reverse shell connects outward from the victim to the attacker, evading standard inbound perimeter blocks.',
            securityContext: 'Firewall Egress Filtering & C2 Detection'
          }
        ],
        relatedLabIds: ['lab-01', 'lab-02']
      },
      {
        id: 'topic-01-02', phaseId: 'phase-01', title: 'Traffic Flows: North-South vs East-West', slug: 'traffic-flows-segmentation',
        estimatedMinutes: 20, difficulty: 'Beginner',
        summary: 'Master the fundamental distinction between perimeter traffic crossing boundaries (North-South) and internal peer-to-peer traffic (East-West).',
        concepts: [
          {
            id: 'c-01-03', title: 'North-South vs East-West Traffic Flow Dynamics',
            shortDesc: 'Directional network flows dictate defensive control placement and visibility.',
            detailedContent: 'North-South traffic enters or leaves the enterprise boundary (Client to Internet, or Internet to Web Server). East-West traffic flows laterally between internal hosts within the datacenter or LAN (workstation to workstation, web tier to database tier). Over 80% of modern enterprise traffic is East-West.',
            securityImpact: 'Traditional perimeter firewalls only inspect North-South traffic, leaving lateral movement completely invisible without internal micro-segmentation.',
            attackSurface: 'Unrestricted workstation-to-workstation communication facilitates Pass-the-Hash, SMB worm propagation, and ransomware distribution.',
            detectionAngle: 'Internal network taps, NDR (Network Detection and Response), and host connection telemetry.',
            defenseControl: 'Microsegmentation, host-based firewalls blocking workstation-to-workstation SMB (TCP 445), private VLANs.',
            keyTakeaways: [
              'North-South traffic crosses the perimeter gateway/firewall.',
              'East-West traffic travels laterally within the internal network.',
              'Defenders need visibility into East-West flows to stop ransomware and lateral movement.'
            ]
          }
        ],
        knowledgeChecks: [
          {
            id: 'kc-01-02',
            question: 'An attacker uses PsExec to execute malicious binaries across 50 internal workstations over port 445. What traffic flow type is this?',
            options: [
              'North-South Ingress traffic',
              'North-South Egress traffic',
              'East-West Lateral traffic',
              'Broadcast Loop traffic'
            ],
            correctIndex: 2,
            explanation: 'Traffic moving between internal workstations inside the same corporate boundary is East-West traffic. A perimeter firewall will not see or block this traffic unless internal segmentation is enforced.',
            securityContext: 'Lateral Movement & Internal Microsegmentation'
          }
        ],
        relatedLabIds: ['lab-03']
      }
    ]
  },
  {
    id: 'phase-02', phaseNumber: 2, title: 'OSI & TCP/IP Reference Models',
    subtitle: 'Encapsulation, Decapsulation, PDUs & Layer Security',
    description: 'Deconstruct the 7 layers of the OSI model and 4 layers of TCP/IP. Master packet encapsulation, Protocol Data Units (PDUs), and layer-specific security vulnerabilities.',
    category: 'Fundamentals',
    learningOutcomes: [
      'Trace data from Application layer down to Physical bits and back',
      'Map protocols, devices, and vulnerabilities to each specific layer',
      'Understand header encapsulation and decapsulation headers',
      'Diagnose network and cybersecurity incidents using layer-by-layer methodology'
    ],
    securityMapping: {
      attackSurface: 'Attacks target every layer: L2 (ARP spoofing), L3 (IP spoofing), L4 (SYN flood), L7 (SQLi/XSS).',
      indicators: 'Mismatched headers, malformed layer sizes, layer-specific anomalies in Wireshark.',
      detectionMethod: 'Deep Packet Inspection (DPI), multi-layer protocol decoders.',
      defenseStrategy: 'Defense-in-depth deploying controls matching each layer (802.1X at L2, IPsec at L3, TLS at L6/L7, WAF at L7).'
    },
    featuredLabId: 'lab-04',
    topics: [
      {
        id: 'topic-02-01', phaseId: 'phase-02', title: 'The 7-Layer OSI & 4-Layer TCP/IP Model', slug: 'osi-tcp-ip-models',
        estimatedMinutes: 25, difficulty: 'Beginner',
        summary: 'Deep architectural comparison of OSI and TCP/IP, encapsulation lifecycles, and layer troubleshooting.',
        concepts: [
          {
            id: 'c-02-01', title: 'Encapsulation & Protocol Data Units (PDUs)',
            shortDesc: 'How payload data gets wrapped with layer-specific control headers.',
            detailedContent: 'As data travels down the stack, each layer prepends a header: Data (L7-5) -> Segment (L4: TCP/UDP) -> Packet (L3: IP) -> Frame (L2: Ethernet) -> Bits (L1: Physical). Decapsulation strips these headers upon arrival.',
            securityImpact: 'Attacks can hide payloads inside outer encapsulation tunnels (e.g. DNS tunneling, ICMP tunneling, IPv6 over IPv4 tunnels) to evade security tools.',
            attackSurface: 'Protocol tunneling and MTU fragmentation abuse.',
            detectionAngle: 'Deep Packet Inspection (DPI) looking past outer headers to inspect encapsulated payload data.',
            defenseControl: 'Protocol normalization engines in Next-Gen Firewalls and IPS.',
            keyTakeaways: [
              'L2 PDU = Frame (MAC address), L3 PDU = Packet (IP address), L4 PDU = Segment (Ports).',
              'Encapsulation wraps headers; decapsulation strips them layer by layer.',
              'Security tools must parse and unwrap encapsulation to detect nested threats.'
            ]
          }
        ],
        knowledgeChecks: [
          {
            id: 'kc-02-01',
            question: 'What is the correct PDU term for data encapsulated at the Network Layer (Layer 3)?',
            options: ['Frame', 'Packet (or Datagram)', 'Segment', 'Bitstream'],
            correctIndex: 1,
            explanation: 'Layer 2 uses Frames, Layer 3 uses Packets, and Layer 4 uses Segments.',
            securityContext: 'PDU Layer Mapping'
          }
        ],
        relatedLabIds: ['lab-04']
      }
    ]
  }
];

const phaseDefinitions = [
  { num: 3, id: 'phase-03', title: 'Ethernet & Data Link Layer', sub: 'MAC Addressing, Framing, Collision/Broadcast Domains & ARP', cat: 'Fundamentals', lab: 'lab-11', t: 'Ethernet Frames, MAC & ARP Poisoning', slug: 'ethernet-mac-arp', cTitle: 'ARP Protocol Mechanics & Man-in-the-Middle Spoofing', cDesc: 'ARP resolution (IP to MAC) and ARP cache poisoning attacks.', cDetail: 'ARP maps IP to MAC. Gratuitous ARP allows unauthenticated cache updates, permitting Man-in-the-Middle.', cSec: 'ARP spoofing intercepts unencrypted passwords and session tokens.', cAtk: 'Local broadcast domains.', cDet: 'Duplicate IP-MAC mappings in ARP tables.', cDef: 'Dynamic ARP Inspection (DAI) and DHCP Snooping.' },
  { num: 4, id: 'phase-04', title: 'IPv4 Addressing & Architecture', sub: '32-Bit Dotted Decimal, Binary, Classes & Special Ranges', cat: 'Addressing', lab: 'lab-05', t: 'IPv4 Addressing & Header Analysis', slug: 'ipv4-addressing-headers', cTitle: 'IPv4 Header Structure, TTL & Protocol Fields', cDesc: '32-bit addresses, RFC 1918 private subnets, and TTL packet mechanics.', cDetail: 'IPv4 headers specify Source/Dest IP, TTL (Time to Live), and Protocol (1=ICMP, 6=TCP, 17=UDP). TTL decrements at each hop.', cSec: 'Attackers spoof IP source addresses in stateless UDP/ICMP attacks and manipulate TTL for OS fingerprinting.', cAtk: 'IP spoofing and fragmentation offset attacks.', cDet: 'Inbound RFC 1918 traffic on public interfaces (Martian packets).', cDef: 'BCP 38 ingress anti-spoofing filters.' },
  { num: 5, id: 'phase-05', title: 'Visual Subnetting Engine & Math', sub: 'FLSM, VLSM, CIDR, AND Operations & Sizing', cat: 'Addressing', lab: 'lab-07', t: 'Subnet Math, CIDR & Host Sizing', slug: 'subnet-math-cidr-vlsm', cTitle: 'Bitwise ANDing & Network Address Calculation', cDesc: 'Using subnet masks to derive Network ID, Broadcast ID, and Host Ranges.', cDetail: 'Routers calculate Network ID = IP & Subnet Mask. Usable hosts = 2^(32-CIDR) - 2. /24 has 254 hosts, /28 has 14 hosts, /30 has 2 hosts.', cSec: 'Oversized subnets enlarge the broadcast attack surface and simplify lateral discovery.', cAtk: 'Scanning large unsegmented IP blocks.', cDet: 'Sequential ICMP/ARP sweeps across entire subnets.', cDef: 'Right-sizing subnets with VLSM and isolating workloads.' },
  { num: 6, id: 'phase-06', title: 'IPv6 Architecture & Security', sub: '128-Bit Hex Architecture, SLAAC, NDP & Threat Vectors', cat: 'Addressing', lab: 'lab-10', t: 'IPv6 Addressing & Neighbor Discovery Protocol', slug: 'ipv6-ndp-threats', cTitle: 'Neighbor Discovery Protocol (NDP) & SLAAC', cDesc: '128-bit hexadecimal addressing, Link-Local (fe80::), and ICMPv6 replacement for ARP.', cDetail: 'IPv6 uses NDP (Neighbor Solicitation/Advertisement and Router Solicitation/Advertisement). Rogue RAs advertise attacker gateways.', cSec: 'Dual-stack endpoints frequently leave IPv6 unmonitored by legacy firewalls.', cAtk: 'Rogue Router Advertisements (RA injection).', cDet: 'Detecting multiple default IPv6 routes or unexpected ICMPv6 Type 134 packets.', cDef: 'Enable IPv6 RA Guard on switch access ports.' },
  { num: 7, id: 'phase-07', title: 'Switching & Layer 2 Security', sub: 'CAM Tables, MAC Learning, STP & Switch Hardening', cat: 'Switching & Routing', lab: 'lab-11', t: 'Switch CAM Tables & Spanning Tree Protocol', slug: 'switch-cam-stp-security', cTitle: 'MAC Learning, CAM Table Flooding & STP Root Takeover', cDesc: 'Dynamic CAM tables, frame forwarding, and preventing Layer 2 loops.', cDetail: 'Switches populate CAM tables by reading source MACs. When CAM table overflows, switch fails open and floods packets like a hub.', cSec: 'MAC flooding (macof) allows passive sniffing of switched network traffic.', cAtk: 'CAM table memory exhaustion and STP BPDU spoofing.', cDet: 'High unicast flood rates and rapid CAM table thrashing.', cDef: 'Port Security with maximum MAC limits and BPDU Guard on edge ports.' },
  { num: 8, id: 'phase-08', title: 'VLANs, Trunking & Segmentation', sub: '802.1Q Tagging, Trunk Ports, Inter-VLAN Routing & VLAN Hopping', cat: 'Switching & Routing', lab: 'lab-13', t: '802.1Q VLANs & Double Tagging Attacks', slug: 'vlan-8021q-hopping', cTitle: '802.1Q Frame Tagging & Double Encapsulation Hopping', cDesc: 'Logical segmentation, 4-byte 802.1Q tags, and trunking negotiation.', cDetail: 'VLAN tags separate traffic. Double Tagging exploits switches stripping the outer native VLAN tag without retagging, bypassing isolation.', cSec: 'Allows unidirectional packet delivery into isolated high-security VLANs.', cAtk: 'Access ports left on default Native VLAN with DTP enabled.', cDet: 'Frames with nested 802.1Q EtherTypes (0x8100) arriving on access ports.', cDef: 'Explicitly set switchport mode access, disable DTP, and change Native VLAN away from 1.' },
  { num: 9, id: 'phase-09', title: 'Routing Fundamentals & Protocols', sub: 'Routing Tables, Static vs Dynamic, OSPF, BGP & Route Hijacking', cat: 'Switching & Routing', lab: 'lab-15', t: 'Routing Tables, OSPF & BGP Prefix Hijacking', slug: 'routing-tables-ospf-bgp', cTitle: 'Longest Prefix Match & BGP Route Hijacking', cDesc: 'How routers make forwarding decisions and how route poisoning redirects global traffic.', cDetail: 'Routers forward packets using Longest Prefix Match (/24 wins over /16). BGP Hijacking advertises more specific prefixes to steal traffic.', cSec: 'BGP Hijacks enable massive global MitM and credential interception.', cAtk: 'Unauthenticated BGP peering and rogue route injection.', cDet: 'BGP route anomaly monitoring alerting on origin AS changes.', cDef: 'Resource Public Key Infrastructure (RPKI) and cryptographic route validation.' },
  { num: 10, id: 'phase-10', title: 'NAT, PAT & Network Boundary Translation', sub: 'Static NAT, Dynamic NAT, Port Address Translation & Logging', cat: 'Switching & Routing', lab: 'lab-18', t: 'NAT, PAT & Forensic Log Correlation', slug: 'nat-pat-forensics', cTitle: 'PAT Port Mapping & Incident Attribution', cDesc: 'How private RFC 1918 IPs share public IPs and state table mechanics.', cDetail: 'PAT (NAT Overload) maps multiple internal IPs to one public IP using source ports. Correlating source port + timestamp is mandatory for SOC attribution.', cSec: 'Without high-resolution NAT logging, internal compromised hosts behind NAT cannot be identified.', cAtk: 'UPnP automated port forwarding exploitation.', cDet: 'Correlating external threat IP + port with firewall NAT session tables.', cDef: 'Enable high-fidelity NAT session logging to centralized SIEM.' },
  { num: 11, id: 'phase-11', title: 'TCP Protocol & Deep State Machine', sub: '3-Way Handshake, Sequence Numbers, Flags & SYN Floods', cat: 'Transport & Services', lab: 'lab-19', t: 'TCP 3-Way Handshake & SYN Flood Attacks', slug: 'tcp-handshake-syn-floods', cTitle: 'TCP State Machine, Sequence Math & SYN Cookies', cDesc: 'Connection-oriented transport, flags (SYN, ACK, FIN, RST), and sequence tracking.', cDetail: 'TCP uses SYN -> SYN-ACK -> ACK. SYN Floods generate half-open connections to exhaust server memory buffers.', cSec: 'SYN floods crash web services; SYN scans port-scan stealthily without full connections.', cAtk: 'Half-open TCP connection queues.', cDet: 'High ratio of SYN packets with no subsequent ACKs (Wireshark tcp.flags.syn==1).', cDef: 'Enable SYN Cookies in OS kernel to encode state in sequence numbers.' },
  { num: 12, id: 'phase-12', title: 'UDP & ICMP Diagnostic Protocols', sub: 'Connectionless Transport, ICMP Types, Ping, Traceroute & Abuse', cat: 'Transport & Services', lab: 'lab-20', t: 'UDP Mechanics, ICMP Diagnostics & Covert Channels', slug: 'udp-icmp-tunneling', cTitle: 'ICMP Diagnostics & Protocol Tunneling Abuse', cDesc: 'Stateless datagrams, ICMP Type/Code pairs, and traceroute TTL mechanics.', cDetail: 'Traceroute uses incrementing TTLs and ICMP Type 11 (Time Exceeded). ICMP Echo payloads can be abused for covert C2 tunnels.', cSec: 'ICMP and UDP tunnels bypass firewalls that only inspect Layer 4 port headers.', cAtk: 'Permissive egress firewall rules allowing outbound ICMP.', cDet: 'Large ICMP packets (>128 bytes) or high-frequency ICMP conversations.', cDef: 'Inspect ICMP payload contents and rate-limit ICMP at firewalls.' },
  { num: 13, id: 'phase-13', title: 'Domain Name System (DNS) & Threats', sub: 'Recursive Resolution, Record Types, DNS Tunneling & Poisoning', cat: 'Transport & Services', lab: 'lab-21', t: 'DNS Resolution Flow & Tunneling Investigation', slug: 'dns-resolution-tunneling', cTitle: 'DNS Hierarchy & Subdomain Data Exfiltration', cDesc: 'Root servers, TLDs, Authoritative nameservers, and DNS Tunneling mechanics.', cDetail: 'DNS resolves names to IPs. Adversaries encode stolen data into subdomains (e.g. data.evil.com) to exfiltrate data past firewalls.', cSec: 'DNS Tunneling enables covert C2 communication even when all web egress is blocked.', cAtk: 'Open outbound UDP 53 to arbitrary public DNS resolvers.', cDet: 'High Shannon entropy (>3.8) and long subdomain labels in DNS query logs.', cDef: 'Enforce internal DNS resolvers and block external port 53 directly from endpoints.' },
  { num: 14, id: 'phase-14', title: 'DHCP Architecture & Attacks', sub: 'DORA Process, Leases, Relay Agents, Rogue DHCP & Starvation', cat: 'Transport & Services', lab: 'lab-23', t: 'DHCP DORA Process & Rogue DHCP Hijacking', slug: 'dhcp-dora-snooping', cTitle: 'DHCP DORA Sequence & Rogue Gateway Hijacking', cDesc: 'Discover, Offer, Request, ACK leasing process and DHCP Snooping defense.', cDetail: 'DHCP leases IP, gateway, and DNS. A Rogue DHCP server replies faster than legitimate servers, injecting the attacker IP as the default gateway.', cSec: 'Rogue DHCP grants instant Man-in-the-Middle over newly connected workstations.', cAtk: 'Access switch ports without DHCP Snooping protection.', cDet: 'Multiple DHCP Offer packets arriving from differing IP/MAC sources.', cDef: 'Enable DHCP Snooping on switches and mark only legitimate uplinks as trusted.' },
  { num: 15, id: 'phase-15', title: 'HTTP, HTTPS & TLS Encryption', sub: 'Methods, Headers, Status Codes, TLS Handshake & Interception', cat: 'Transport & Services', lab: 'lab-24', t: 'HTTP Headers, TLS 1.3 Handshake & JA3 Fingerprints', slug: 'http-tls-encryption', cTitle: 'HTTP Protocol Anatomy & TLS 1.3 Cryptography', cDesc: 'Request/Response lifecycle, security headers (HSTS), and TLS 1.3 key exchange.', cDetail: 'HTTP is plaintext. TLS 1.3 encrypts traffic using ephemeral Diffie-Hellman (ECDHE). JA3 fingerprints client hello parameters to identify malware.', cSec: 'Cleartext HTTP exposes session cookies and credentials to Wireshark sniffing.', cAtk: 'SSL stripping and insecure cookie flags (missing HttpOnly/Secure).', cDet: 'JA3 hashes matching known C2 framework signatures (e.g. Cobalt Strike).', cDef: 'Enforce HTTPS with HSTS and TLS 1.3 with Perfect Forward Secrecy.' },
  { num: 16, id: 'phase-16', title: 'Network Services, Ports & Daemon Security', sub: 'Well-Known Ports, Service Fingerprinting & Vulnerability Mapping', cat: 'Transport & Services', lab: 'lab-26', t: 'Enterprise Port Analysis & Service Exploitation', slug: 'enterprise-ports-services', cTitle: 'Critical Enterprise Services: SMB 445, RDP 3389 & SSH 22', cDesc: 'Mapping 30+ ports (21 FTP, 22 SSH, 53 DNS, 80 HTTP, 445 SMB, 3389 RDP).', cDetail: 'SMB (445) is targeted by EternalBlue and PsExec; RDP (3389) is targeted for brute force. Cleartext protocols must be replaced with encrypted equivalents.', cSec: 'Exposing SMB or RDP directly to the internet leads to rapid automated ransomware infection.', cAtk: 'Internet-exposed management interfaces and unpatched services.', cDet: 'Spike in Event ID 4625 (Failed Logons) and Nmap service scans.', cDef: 'Require VPN + MFA for all remote access and disable legacy protocols.' },
  { num: 17, id: 'phase-17', title: 'Wireless Networking & 802.11 Security', sub: 'SSID, BSSID, 4-Way Handshake, WPA2/WPA3 & Rogue APs', cat: 'Transport & Services', lab: 'lab-27', t: '802.11 Frames, WPA2 Handshake & Deauth Attacks', slug: 'wireless-wpa3-deauth', cTitle: 'WPA2 4-Way Handshake & Deauthentication Forgery', cDesc: 'Wireless frames, EAPOL 4-way key exchange, and Protected Management Frames.', cDetail: 'WPA2 derives encryption keys during 4-Way Handshake. Attackers send spoofed Deauth frames to force re-authentication and capture EAPOL frames.', cSec: 'Captured 4-way handshakes can be cracked offline with dictionary wordlists.', cAtk: 'Unprotected 802.11 management frames in legacy Wi-Fi.', cDet: 'High frequency of 802.11 Deauth frames on specific BSSIDs.', cDef: 'Enable 802.11w (Protected Management Frames) and migrate to WPA3.' },
  { num: 18, id: 'phase-18', title: 'Firewalls & Network Security Controls', sub: 'Packet Filtering, Stateful Inspection, NGFW, ACLs & Rule Ordering', cat: 'Security & Analysis', lab: 'lab-28', t: 'Firewall Rule Engines, Zones & Top-Down Evaluation', slug: 'firewall-rule-engine', cTitle: 'Stateful Connection Tracking & Top-Down Rule Processing', cDesc: 'Stateless vs stateful inspection, zone policies, and first-match rule logic.', cDetail: 'Stateful firewalls maintain connection tables to auto-permit established replies. Rules evaluate top-to-bottom; first matching rule takes action.', cSec: 'Placing broad rules near the top shadows and disables specific security rules below it.', cAtk: 'Shadowed rules and overly permissive temporary test rules.', cDet: 'Firewall hit-count monitoring and shadowed-rule configuration audits.', cDef: 'Enforce Default Deny and place most specific rules at the top of the policy.' },
  { num: 19, id: 'phase-19', title: 'IDS / IPS & Network Telemetry', sub: 'Snort Signatures, Suricata, Anomaly Detection, NetFlow & Alert Triage', cat: 'Security & Analysis', lab: 'lab-34', t: 'NIDS vs NIPS, Snort Syntax & Flow Telemetry', slug: 'nids-nips-snort-telemetry', cTitle: 'Signature-Based Detection & 5-Tuple NetFlow Analysis', cDesc: 'Passive NIDS vs inline NIPS, Snort rule writing, and NetFlow traffic monitoring.', cDetail: 'Snort rules inspect 5-tuples and packet payload strings. NetFlow records session metadata without payload overhead for baseline profiling.', cSec: 'NIDS evasion via packet fragmentation, URL encoding, and encrypted payloads.', cAtk: 'Alert fatigue caused by overly generic signatures.', cDet: 'Snort/Suricata signature hits and NetFlow volume anomalies.', cDef: 'Deploy inline IPS with automated blocking and regular rule tuning.' },
  { num: 20, id: 'phase-20', title: 'Traffic Analysis & Wireshark Forensics', sub: 'Packet Dissection, Display Filters, TCP Streams & Forensics', cat: 'Security & Analysis', lab: 'lab-35', t: 'Wireshark Navigation, Display Filters & Stream Analysis', slug: 'wireshark-traffic-forensics', cTitle: 'Packet Dissection, Display Filters & Stream Reconstruction', cDesc: 'Display filter syntax, Follow TCP Stream, and carving files from PCAPs.', cDetail: 'Display filters isolate target protocols (e.g. http.request or dns). Follow TCP Stream reassembles segments to reveal full application payloads.', cSec: 'Allows extraction of unencrypted credentials, executed commands, and malware files.', cAtk: 'Cleartext protocol transmissions captured in network dumps.', cDet: 'Wireshark Protocol Hierarchy anomalies and TCP RST flag spikes.', cDef: 'Mandate full TLS encryption across all enterprise communications.' },
  { num: 21, id: 'phase-21', title: 'Network Attacks & Threat Simulation', sub: 'Mapping Attacks to Traffic: Scans, Floods, Spoofing, C2 & Exfiltration', cat: 'Security & Analysis', lab: 'lab-31', t: 'Attack-to-Traffic Mapping & C2 Beaconing Analytics', slug: 'network-attacks-traffic-signatures', cTitle: 'C2 Beaconing Detection, Jitter & Traffic Profiling', cDesc: 'How malware communicates with command servers and statistical detection.', cDetail: 'C2 agents periodically check in with external servers. Even with randomized jitter, statistical delta-time distributions reveal automated beacons.', cSec: 'C2 maintains persistent unauthorized access inside the internal network.', cAtk: 'Unrestricted outbound HTTPS connections to arbitrary Internet domains.', cDet: 'Low delta-time variance in outbound session logs to external destinations.', cDef: 'Egress SSL inspection proxies and threat intelligence domain blocking.' },
  { num: 22, id: 'phase-22', title: 'Network Defense & SOC Operations', sub: 'Alert Triage Pipeline, SIEM, Playbooks, Containment & Remediation', cat: 'SOC & Operations', lab: 'lab-34', t: 'SOC Triage Pipeline & Host Isolation Playbooks', slug: 'soc-operations-incident-triage', cTitle: 'SOC Alert Triage, True Positive Verification & Network Containment', cDesc: 'SIEM correlation, L1/L2 triage workflows, and incident containment.', cDetail: 'SOC pipeline: Ingestion -> Correlation -> Triage -> Investigation -> Containment. Rapid network isolation stops malware propagation.', cSec: 'Slow triage times increase attacker dwell time and allow enterprise-wide encryption.', cAtk: 'Lateral movement and ransomware distribution.', cDet: 'SIEM correlation alerts combining network anomalies with endpoint events.', cDef: 'Automated host network quarantine via EDR and dynamic firewall blocklisting.' },
  { num: 23, id: 'phase-23', title: 'Enterprise Capstone: Full Incident Reconstruction', sub: 'Recon -> Initial Access -> DNS C2 -> Lateral Movement -> Exfiltration', cat: 'Capstone', lab: 'lab-38', t: 'Full Multi-Stage Enterprise Attack Reconstruction', slug: 'enterprise-capstone-incident', cTitle: 'The Complete Multi-Stage Enterprise Attack Chain', cDesc: 'End-to-end incident forensics: Recon, Exploitation, C2, Lateral Movement, and Exfiltration.', cDetail: 'Reconstruct a 9-stage attack from PCAPs: External Nmap Scan -> Web SQLi -> Reverse Shell -> DNS Tunneling -> Internal ARP Sweep -> SMB Lateral Movement -> Database Exfiltration.', cSec: 'Demonstrates how a single web flaw allows full internal compromise without segmentation.', cAtk: 'Chained vulnerabilities across perimeter, DMZ, and internal subnets.', cDet: 'Multi-source log correlation linking perimeter firewall alerts with internal database spikes.', cDef: 'Zero Trust architecture and strict DMZ-to-Internal firewall restrictions.' }
];

const allPhases = [...rawPhases];

for (const p of phaseDefinitions) {
  allPhases.push({
    id: p.id,
    phaseNumber: p.num,
    title: p.title,
    subtitle: p.sub,
    description: p.sub + '. Deep hands-on training with network packet flows, security analysis, detection strategies, and mitigation controls.',
    category: p.cat,
    learningOutcomes: [
      'Master core protocol mechanics and header structure for ' + p.title,
      'Analyze normal baseline vs anomalous attack traffic signatures',
      'Deploy defensive network controls and detection rules',
      'Investigate security incidents using Wireshark and SIEM telemetry'
    ],
    securityMapping: {
      attackSurface: p.cAtk,
      indicators: p.cDet,
      detectionMethod: p.cDet,
      defenseStrategy: p.cDef
    },
    featuredLabId: p.lab,
    topics: [
      {
        id: 'topic-' + (p.num < 10 ? '0' + p.num : p.num) + '-01',
        phaseId: p.id,
        title: p.t,
        slug: p.slug,
        estimatedMinutes: 25,
        difficulty: p.num > 18 ? 'Advanced' : (p.num > 6 ? 'Intermediate' : 'Beginner'),
        summary: p.cDesc,
        concepts: [
          {
            id: 'c-' + (p.num < 10 ? '0' + p.num : p.num) + '-01',
            title: p.cTitle,
            shortDesc: p.cDesc,
            detailedContent: p.cDetail,
            securityImpact: p.cSec,
            attackSurface: p.cAtk,
            detectionAngle: p.cDet,
            defenseControl: p.cDef,
            keyTakeaways: [
              p.cDetail.split('.')[0] + '.',
              'Key security impact: ' + p.cSec.split('.')[0] + '.',
              'Defensive best practice: ' + p.cDef
            ]
          }
        ],
        knowledgeChecks: [
          {
            id: 'kc-' + (p.num < 10 ? '0' + p.num : p.num) + '-01',
            question: 'What is the primary security recommendation to mitigate ' + p.title + ' vulnerabilities?',
            options: [
              'Disable all firewalls and antivirus software',
              p.cDef,
              'Increase physical cable lengths',
              'Change monitor resolution'
            ],
            correctIndex: 1,
            explanation: 'The primary recommended defensive control is: ' + p.cDef,
            securityContext: p.title + ' Defensive Mitigation'
          }
        ],
        relatedLabIds: [p.lab]
      }
    ]
  });
}

const fileContent = 'import { Phase } from "../types";\n\nexport const PHASES: Phase[] = ' + JSON.stringify(allPhases, null, 2) + ';\n';
fs.writeFileSync('src/data/curriculum.ts', fileContent);
console.log('src/data/curriculum.ts regenerated with exact Topic fields');
