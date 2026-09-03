const fs = require('fs');

const labs = [
  // Fundamentals
  {
    id: 'lab-01', title: 'Build Enterprise Network & Identify Trust Boundaries', phaseId: 'phase-01',
    category: 'Fundamentals', difficulty: 'Beginner', estimatedMinutes: 15,
    scenario: 'You are tasked with mapping the physical and logical boundaries of a corporate network before deploying cybersecurity monitoring controls.',
    objective: 'Identify key network devices, locate perimeter boundaries, and separate the DMZ from internal LAN.',
    environmentDescription: 'Enterprise topology featuring Internet, Edge Router, Perimeter Firewall, DMZ Web Server, Core Switch, Workstations, and Database Server.',
    steps: [
      { stepNumber: 1, title: 'Inspect Edge Router & Perimeter Firewall', instruction: 'Click on the Edge Router node in the topology to view its WAN/LAN interface configuration.', actionType: 'click', targetNodeId: 'router-edge', hint: 'The Edge Router is directly connected to the Internet cloud.', validationExplanation: 'Router interface 203.0.113.1 connects to ISP; internal interface 10.0.0.1 connects to Firewall.' },
      { stepNumber: 2, title: 'Analyze DMZ Server Isolation', instruction: 'Select the DMZ Web Server node and verify which subnet zone it belongs to.', actionType: 'inspect', targetNodeId: 'server-web-dmz', hint: 'DMZ nodes reside on the 10.0.2.0/24 subnet.', validationExplanation: 'The DMZ Web Server (10.0.2.10) is segregated from internal database and client subnets.' },
      { stepNumber: 3, title: 'Validate Segmentation Between DMZ & Internal DB', instruction: 'Review the firewall policy between DMZ (10.0.2.0/24) and Internal DB (10.0.3.0/24).', actionType: 'simulate', expectedInput: '10.0.2.10->10.0.3.50', hint: 'Direct management traffic from DMZ to internal databases must be blocked.', validationExplanation: 'Direct SSH/SMB access from DMZ into internal DB is strictly blocked by the firewall.' }
    ],
    knowledgeCheck: {
      id: 'kc-lab-01', question: 'Why should database servers containing customer PII never reside directly in the DMZ?',
      options: ['Database engines cannot run on Linux servers', 'DMZ servers are directly accessible from the Internet; compromising a DMZ host would grant immediate direct database access', 'Databases require public IPv4 addresses to operate', 'DMZ switches do not support SQL packets'],
      correctIndex: 1, explanation: 'DMZ hosts have internet-facing attack surfaces. Placing databases in internal private zones behind a secondary firewall enforces defense-in-depth.',
      securityContext: 'Network Architecture & DMZ Segmentation'
    }
  },
  {
    id: 'lab-02', title: 'Identify Network Devices & OSI Layer Placement', phaseId: 'phase-01',
    category: 'Fundamentals', difficulty: 'Beginner', estimatedMinutes: 15,
    scenario: 'A SOC analyst needs to understand which network device inspects or modifies which layer of the OSI model to place network taps correctly.',
    objective: 'Map Hubs, Switches, Routers, Firewalls, and WAFs to their operating OSI layers.',
    environmentDescription: 'Interactive device mapping workbench with Layer 1 through Layer 7 inspection zones.',
    steps: [
      { stepNumber: 1, title: 'Classify Layer 2 Switch Function', instruction: 'Identify which address type a Layer 2 switch inspects to forward frames.', actionType: 'input', expectedInput: 'MAC', hint: 'Switches read 48-bit hardware addresses.', validationExplanation: 'Layer 2 switches inspect Ethernet Source and Destination MAC addresses.' },
      { stepNumber: 2, title: 'Classify Layer 3 Router Function', instruction: 'Identify the PDU and addressing used by routers for forwarding.', actionType: 'input', expectedInput: 'IP', hint: 'Routers forward Layer 3 packets using logical IP addresses.', validationExplanation: 'Routers inspect IPv4 and IPv6 packet headers to make routing decisions.' },
      { stepNumber: 3, title: 'Place Next-Generation Firewall', instruction: 'Determine which layers an NGFW with Deep Packet Inspection operates at.', actionType: 'input', expectedInput: 'Layer 3-7', hint: 'NGFWs inspect IP, ports, and application payloads.', validationExplanation: 'NGFWs inspect from Layer 3 up to Layer 7 (Application layer).' }
    ]
  },
  {
    id: 'lab-03', title: 'Follow a Packet Through the Network Stack', phaseId: 'phase-01',
    category: 'Fundamentals', difficulty: 'Beginner', estimatedMinutes: 20,
    scenario: 'Trace an HTTP GET request originating from an internal client (10.0.1.50) traversing the local switch, router, firewall, and arriving at a web server.',
    objective: 'Observe packet header modification, NAT translation, and MAC address rewriting across hops.',
    environmentDescription: 'Live animated packet journey through Client -> Switch -> Router -> Firewall -> Internet Server.',
    steps: [
      { stepNumber: 1, title: 'Observe Source and Destination MAC at Hop 1', instruction: 'Inspect the Layer 2 frame when leaving the client workstation.', actionType: 'inspect', hint: 'Destination MAC is the Default Gateway MAC, not the final server MAC.', validationExplanation: 'The client encapsulates the IP packet into a frame with Destination MAC = Router Gateway MAC.' },
      { stepNumber: 2, title: 'Observe Router Header Rewriting', instruction: 'Verify what happens to the MAC addresses as the packet passes through the router interface.', actionType: 'observe', hint: 'Routers strip the old L2 frame and prepend a new L2 frame with the next-hop MAC.', validationExplanation: 'Layer 3 IP addresses remain constant while Layer 2 MAC addresses change hop-by-hop.' },
      { stepNumber: 3, title: 'Observe NAT Translation at Edge Firewall', instruction: 'Inspect the packet after exiting the PAT/NAT gateway interface.', actionType: 'observe', hint: 'The private source IP 10.0.1.50 is translated to the public interface IP 203.0.113.5.', validationExplanation: 'PAT modifies Source IP and Source Port to permit routing across the public Internet.' }
    ]
  },
  {
    id: 'lab-04', title: 'OSI Model Incident Troubleshooting', phaseId: 'phase-02',
    category: 'Fundamentals', difficulty: 'Beginner', estimatedMinutes: 20,
    scenario: 'A critical financial web application is reported unreachable by finance staff. Apply bottom-up OSI troubleshooting to isolate the root cause.',
    objective: 'Systematically test Layer 1 (Link), Layer 2 (ARP), Layer 3 (Ping/IP), Layer 4 (Port Socket), and Layer 7 (HTTP).',
    environmentDescription: 'Simulated diagnostic terminal with ping, arp, ss, and curl tools.',
    steps: [
      { stepNumber: 1, title: 'Verify Layer 1 & 2 Link Status', instruction: 'Check the physical interface status and local ARP gateway resolution.', actionType: 'command', expectedInput: 'ip link && arp -a', hint: 'Ensure the link is UP and gateway MAC is known.', validationExplanation: 'Interface eth0 is UP and gateway 10.0.1.1 resolves to 00:50:56:a1:b2:c3.' },
      { stepNumber: 2, title: 'Test Layer 3 Network Reachability', instruction: 'Ping the financial web server IP 10.0.2.10.', actionType: 'command', expectedInput: 'ping 10.0.2.10', hint: 'Ping validates ICMP Layer 3 IP routing.', validationExplanation: 'Ping succeeds with 0% packet loss (TTL=63, time=1.2ms).' },
      { stepNumber: 3, title: 'Test Layer 4 & Layer 7 Service', instruction: 'Attempt an HTTP request to verify if the web service port 443 daemon is accepting connections.', actionType: 'command', expectedInput: 'curl -I https://10.0.2.10', hint: 'curl tests Layer 4 TCP connection and Layer 7 HTTP status.', validationExplanation: 'HTTP 200 OK returned with valid SSL certificate, confirming all layers operational.' }
    ]
  },
  // Addressing Labs
  {
    id: 'lab-05', title: 'IPv4 Addressing & Binary Math Mastery', phaseId: 'phase-04',
    category: 'Addressing', difficulty: 'Beginner', estimatedMinutes: 20,
    scenario: 'Practice converting dotted-decimal IPv4 addresses into 32-bit binary representation to understand routing logic.',
    objective: 'Convert octets to 8-bit binary and identify class boundaries and RFC 1918 status.',
    environmentDescription: 'Visual binary converter and bitwise ANDing sandbox.',
    steps: [
      { stepNumber: 1, title: 'Convert 192.168.1.1 to Binary', instruction: 'Enter the 8-bit binary representation of the first octet 192.', actionType: 'input', expectedInput: '11000000', hint: '128 + 64 = 192 -> 11000000.', validationExplanation: '192 in binary is 11000000.' },
      { stepNumber: 2, title: 'Identify RFC 1918 Status', instruction: 'Determine if 172.20.10.5 is a private or public IPv4 address.', actionType: 'input', expectedInput: 'Private', hint: '172.16.0.0/12 covers 172.16.0.0 through 172.31.255.255.', validationExplanation: '172.20.10.5 is within the RFC 1918 Class B private address space.' }
    ]
  },
  {
    id: 'lab-07', title: 'Visual Subnetting Engine & CIDR Calculation', phaseId: 'phase-05',
    category: 'Addressing', difficulty: 'Intermediate', estimatedMinutes: 25,
    scenario: 'An enterprise network architect assigns you the network block 192.168.50.0/26. Calculate the complete network sizing parameters.',
    objective: 'Derive Network Address, Subnet Mask, Broadcast Address, First Usable Host, and Last Usable Host.',
    environmentDescription: 'Interactive Visual Subnet Calculator with bit-toggle matrix.',
    steps: [
      { stepNumber: 1, title: 'Calculate Subnet Mask for /26', instruction: 'Enter the decimal subnet mask corresponding to CIDR prefix /26.', actionType: 'input', expectedInput: '255.255.255.192', hint: 'First two host bits borrowed: 128 + 64 = 192.', validationExplanation: '/26 corresponds to 255.255.255.192.' },
      { stepNumber: 2, title: 'Determine Broadcast Address', instruction: 'Enter the broadcast address for 192.168.50.0/26.', actionType: 'calculate', expectedInput: '192.168.50.63', hint: 'Block size is 64 (256 - 192). Network is .0, Broadcast is .63.', validationExplanation: 'The broadcast address for the first /26 subnet is 192.168.50.63.' },
      { stepNumber: 3, title: 'Calculate Usable Host Range', instruction: 'Identify the total number of usable host IP addresses in a /26 subnet.', actionType: 'calculate', expectedInput: '62', hint: '2^6 - 2 = 64 - 2 = 62 usable hosts.', validationExplanation: 'A /26 subnet supports exactly 62 usable host addresses (.1 to .62).' }
    ]
  },
  // Switching Labs
  {
    id: 'lab-11', title: 'Switch MAC Learning & CAM Table Exhaustion', phaseId: 'phase-07',
    category: 'Switching', difficulty: 'Intermediate', estimatedMinutes: 25,
    scenario: 'Simulate a Layer 2 switch learning MAC addresses during normal operation, then observe what happens when an attacker executes a MAC flooding attack (macof).',
    objective: 'Observe CAM table population, trigger CAM table overflow, and verify switch fail-open broadcasting behavior.',
    environmentDescription: 'Interactive switch with real-time CAM table display and packet sniffer tap.',
    steps: [
      { stepNumber: 1, title: 'Observe Normal MAC Learning', instruction: 'Transmit a test frame from Host A (00:11:22:33:44:aa) on Port 1 and view the CAM table update.', actionType: 'simulate', hint: 'The switch records MAC 00:11:22:33:44:aa on Port 1.', validationExplanation: 'Switch dynamically adds Port 1 -> 00:11:22:33:44:aa with 300s aging timer.' },
      { stepNumber: 2, title: 'Simulate MAC Flooding Attack', instruction: 'Launch simulated MAC flood generating 10,000 random source MACs against the switch.', actionType: 'simulate', hint: 'Watch the CAM table memory utilization reach 100%.', validationExplanation: 'CAM table becomes exhausted; the switch enters fail-open hub mode.' },
      { stepNumber: 3, title: 'Enable Port Security Defense', instruction: 'Apply Port Security with maximum 2 MACs and shutdown violation on edge ports.', actionType: 'input', expectedInput: 'switchport port-security maximum 2', hint: 'Limits MAC address learning per port.', validationExplanation: 'Port Security immediately disables the attacking port upon detecting excess MACs.' }
    ]
  },
  // Routing Labs
  {
    id: 'lab-15', title: 'Routing Table Analysis & Longest Prefix Match', phaseId: 'phase-09',
    category: 'Routing', difficulty: 'Intermediate', estimatedMinutes: 20,
    scenario: 'Analyze a complex enterprise routing table containing default, summary, and specific routes to determine the exact exit interface for incoming packets.',
    objective: 'Apply the Longest Prefix Match rule to resolve forwarding paths for multiple destination IPs.',
    environmentDescription: 'Simulated core router console with full IPv4 routing table.',
    steps: [
      { stepNumber: 1, title: 'Route Lookup for 10.1.5.25', instruction: 'Determine which route matches 10.1.5.25 when table contains 10.0.0.0/8 (via Eth0) and 10.1.5.0/24 (via Eth1).', actionType: 'input', expectedInput: 'Eth1', hint: 'Longest prefix match (/24 is more specific than /8).', validationExplanation: '10.1.5.0/24 (/24) matches 24 bits, overriding the 10.0.0.0/8 (/8) summary route.' }
    ]
  },
  // Protocol Labs
  {
    id: 'lab-19', title: 'TCP 3-Way Handshake & State Machine Simulator', phaseId: 'phase-11',
    category: 'Protocols', difficulty: 'Intermediate', estimatedMinutes: 25,
    scenario: 'Step through a live TCP connection establishment, data transmission, and 4-way teardown between client 192.168.1.50 and server 10.0.2.10:443.',
    objective: 'Trace Sequence and Acknowledgment numbers across SYN, SYN-ACK, ACK, PSH/ACK, and FIN states.',
    environmentDescription: 'Step-by-step interactive TCP state machine visualizer.',
    steps: [
      { stepNumber: 1, title: 'Initiate SYN Packet', instruction: 'Send initial SYN with ISN=1000 from client to server.', actionType: 'simulate', hint: 'Client enters SYN_SENT state.', validationExplanation: 'SYN sent with Seq=1000, Len=0, Flag=SYN.' },
      { stepNumber: 2, title: 'Generate Server SYN-ACK', instruction: 'Calculate the expected ACK number in the server SYN-ACK response.', actionType: 'calculate', expectedInput: '1001', hint: 'SYN consumes 1 sequence number (1000 + 1 = 1001).', validationExplanation: 'Server responds with Seq=5000, Ack=1001, Flags=SYN+ACK.' },
      { stepNumber: 3, title: 'Complete 3-Way Handshake', instruction: 'Send final client ACK to transition connection into ESTABLISHED state.', actionType: 'simulate', hint: 'Client sends Seq=1001, Ack=5001, Flag=ACK.', validationExplanation: 'Connection is now in ESTABLISHED state; bidirectional data transfer can begin.' }
    ]
  },
  {
    id: 'lab-21', title: 'Recursive DNS Resolution & Record Inspection', phaseId: 'phase-13',
    category: 'Protocols', difficulty: 'Beginner', estimatedMinutes: 20,
    scenario: 'Follow a recursive DNS query for "secure.shadowxlab.internal" step-by-step from client cache to Root, TLD, and Authoritative Nameserver.',
    objective: 'Understand DNS caching, recursive vs iterative lookups, and TTL expiration.',
    environmentDescription: 'Visual DNS hierarchy map with query packet inspector.',
    steps: [
      { stepNumber: 1, title: 'Query Local DNS Resolver Cache', instruction: 'Check if secure.shadowxlab.internal is present in the local OS resolver cache.', actionType: 'inspect', hint: 'Local cache returns a cache miss.', validationExplanation: 'Cache miss triggers recursive resolver query.' },
      { stepNumber: 2, title: 'Follow Recursive Queries to Authoritative Server', instruction: 'Step through Root (.) -> TLD (.internal) -> Authoritative Server.', actionType: 'simulate', hint: 'The authoritative server returns the final A record IP address.', validationExplanation: 'Authoritative server responds with A record: 10.0.2.15 (TTL=300).' }
    ]
  },
  // Security Labs
  {
    id: 'lab-28', title: 'Interactive Firewall Rule Builder & Policy Audit', phaseId: 'phase-18',
    category: 'Security', difficulty: 'Intermediate', estimatedMinutes: 30,
    scenario: 'Build and test a perimeter firewall policy controlling traffic between Untrust (Internet), DMZ, and Trust (Internal LAN).',
    objective: 'Create least-privilege allow rules, order rules correctly to avoid shadowing, and test with synthetic traffic.',
    environmentDescription: 'Interactive Firewall Rule Simulator with live rule tester and packet injector.',
    steps: [
      { stepNumber: 1, title: 'Allow Inbound HTTPS to DMZ Web Server', instruction: 'Create a rule permitting Source ANY -> Dest 10.0.2.10 on TCP Port 443 with Action ALLOW.', actionType: 'input', expectedInput: 'ALLOW TCP 443', hint: 'Add rule matching web server IP and port.', validationExplanation: 'Inbound HTTPS rule added and validated.' },
      { stepNumber: 2, title: 'Block All Direct DMZ-to-Internal Database Traffic', instruction: 'Add a rule blocking all traffic from DMZ (10.0.2.0/24) to Internal Subnet (10.0.1.0/24).', actionType: 'input', expectedInput: 'DENY ALL', hint: 'Isolates the DMZ from internal LAN.', validationExplanation: 'Rule prevents compromised DMZ hosts from reaching internal workstations.' },
      { stepNumber: 3, title: 'Test Synthetic Packets Against Rule Base', instruction: 'Inject a test packet from 10.0.2.10 to 10.0.1.50 on port 445 and verify the packet is dropped.', actionType: 'simulate', hint: 'Verify rule hit counter increments on the DENY rule.', validationExplanation: 'Firewall dropped the packet matching the DMZ-to-Internal Deny rule.' }
    ]
  },
  // SOC Labs
  {
    id: 'lab-35', title: 'Wireshark PCAP Investigation & Stream Reconstruction', phaseId: 'phase-20',
    category: 'SOC', difficulty: 'Advanced', estimatedMinutes: 30,
    scenario: 'A suspicious data exfiltration alert was triggered on an executive workstation. Analyze a 500-packet network capture to extract the exfiltrated file and identify the C2 IP.',
    objective: 'Apply display filters, reconstruct the TCP stream, and extract cleartext credentials and downloaded artifacts.',
    environmentDescription: 'Simulated Wireshark Packet Analyzer GUI with full filter engine and stream viewer.',
    steps: [
      { stepNumber: 1, title: 'Filter for HTTP POST Requests', instruction: 'Apply Wireshark display filter to isolate outbound HTTP POST traffic.', actionType: 'filter', expectedInput: 'http.request.method == "POST"', hint: 'Filter isolates data upload sessions.', validationExplanation: 'Isolates 3 POST requests sent to 198.51.100.42 carrying encoded form data.' },
      { stepNumber: 2, title: 'Follow TCP Stream', instruction: 'Reconstruct the TCP conversation to inspect the uploaded payload data.', actionType: 'inspect', hint: 'Follow TCP Stream presents the raw reconstructed HTTP body.', validationExplanation: 'Payload reveals base64 encoded string containing customer database records.' },
      { stepNumber: 3, title: 'Extract Attacker C2 IP and Timestamp', instruction: 'Record the destination IP address and timestamp of the exfiltration event.', actionType: 'input', expectedInput: '198.51.100.42', hint: 'Check the IP destination header in Packet #42.', validationExplanation: 'Confirmed C2 destination IP is 198.51.100.42.' }
    ]
  },
  // Capstone Lab
  {
    id: 'lab-38', title: 'Full Enterprise Network Attack Investigation (Capstone)', phaseId: 'phase-23',
    category: 'Capstone', difficulty: 'Advanced', estimatedMinutes: 45,
    scenario: 'A major enterprise security incident has occurred across the corporate network. Reconstruct the complete 9-stage attack timeline from external reconnaissance to database exfiltration.',
    objective: 'Correlate firewall logs, NIDS alerts, PCAP packet traces, and endpoint telemetry to author a complete SOC Incident Report.',
    environmentDescription: 'Complete Enterprise digital twin environment with full SIEM telemetry, PCAP traces, and incident reporting workspace.',
    steps: [
      { stepNumber: 1, title: 'Stage 1 & 2: Reconnaissance & Port Scanning', instruction: 'Identify the external attacker IP conducting Nmap SYN scans against the DMZ web server.', actionType: 'inspect', hint: 'Check perimeter firewall alert logs for port scan bursts.', validationExplanation: 'Attacker IP 198.51.100.77 identified conducting port scans against ports 80, 443, 8080.' },
      { stepNumber: 2, title: 'Stage 3 & 4: Initial Access & Reverse Shell', instruction: 'Locate the web application exploit and identify the port used for the outbound reverse shell.', actionType: 'filter', expectedInput: 'tcp.port == 4444', hint: 'Filter for non-standard outbound TCP connections originating from DMZ Web Server.', validationExplanation: 'Web server (10.0.2.10) initiated outbound TCP 4444 reverse shell to 198.51.100.77.' },
      { stepNumber: 3, title: 'Stage 5 & 6: DNS C2 & Internal Reconnaissance', instruction: 'Verify DNS tunneling C2 domain and identify internal ARP sweep targets.', actionType: 'inspect', hint: 'Look for queries matching *.tunnel.c2server.net and ARP sweeps on 10.0.1.0/24.', validationExplanation: 'Attacker used DNS tunneling for backup C2 and discovered database server at 10.0.3.50.' },
      { stepNumber: 4, title: 'Stage 7 & 8: Lateral Movement & Database Exfiltration', instruction: 'Identify the protocol and user credential used for lateral movement to the database server.', actionType: 'input', expectedInput: 'SMB 445', hint: 'PsExec service creation over port 445 using compromised admin credentials.', validationExplanation: 'Attacker pivoted to DB server over SMB port 445 and exfiltrated 50,000 customer records.' },
      { stepNumber: 5, title: 'Stage 9: Remediation & Incident Containment', instruction: 'Submit final SOC incident containment actions to isolate the compromised hosts.', actionType: 'simulate', hint: 'Quarantine DMZ web server, block attacker IP at firewall, and enforce password resets.', validationExplanation: 'Containment executed: Attacker IP blocked, endpoints quarantined, and vulnerabilities patched.' }
    ]
  }
];

const fileContent = 'import { Lab } from "../types";\n\nexport const LABS: Lab[] = ' + JSON.stringify(labs, null, 2) + ';\n';
fs.writeFileSync('src/data/labs.ts', fileContent);
console.log('src/data/labs.ts generated successfully with ' + labs.length + ' comprehensive guided labs!');
