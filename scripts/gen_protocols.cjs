const fs = require('fs');

const protocols = [
  {
    name: 'Transmission Control Protocol', shortName: 'TCP', layer: 'Transport', port: 'Variable', transport: 'IP',
    purpose: 'Reliable, connection-oriented, ordered byte-stream delivery service with flow and congestion control.',
    headerFields: [
      { name: 'Source Port', size: '16 bits', purpose: 'Originating client/server port', securityRelevance: 'Ephemeral port tracking in PAT & NAT tables' },
      { name: 'Destination Port', size: '16 bits', purpose: 'Target service port', securityRelevance: 'Service identification and port scanning targets' },
      { name: 'Sequence Number', size: '32 bits', purpose: 'Tracks byte offset in stream', securityRelevance: 'TCP session hijacking if sequence numbers are predictable' },
      { name: 'Acknowledgment Number', size: '32 bits', purpose: 'Next expected byte from peer', securityRelevance: 'Validates bidirectional communication' },
      { name: 'Flags (SYN, ACK, FIN, RST, PSH, URG)', size: '9 bits', purpose: 'Connection state management', securityRelevance: 'SYN flood DoS, stealth scans (Xmas, Null, FIN)' },
      { name: 'Window Size', size: '16 bits', purpose: 'Flow control buffer capacity', securityRelevance: 'Window exhaustion attacks' }
    ],
    rfc: 'RFC 9293 (replaces RFC 793)',
    securityRisks: ['SYN Flood Denial of Service', 'TCP Session Hijacking', 'RST Injection attacks', 'Port Scanning'],
    commonAttacks: ['TCP SYN Flood', 'Nmap SYN Scan (-sS)', 'TCP Reset Injection', 'Out-of-Order Segment Evasion'],
    detectionMechanisms: ['SYN backlog monitoring', 'TCP half-open connection thresholds', 'Sequence number anomaly detection'],
    defenseControls: ['SYN Cookies (syncookies=1)', 'Stateful firewall connection tracking', 'Rate limiting embryonic sessions'],
    wiresharkFilters: ['tcp.flags.syn == 1 && tcp.flags.ack == 0', 'tcp.flags.reset == 1', 'tcp.analysis.retransmission']
  },
  {
    name: 'User Datagram Protocol', shortName: 'UDP', layer: 'Transport', port: 'Variable', transport: 'IP',
    purpose: 'Lightweight, connectionless, unreliable datagram delivery without handshakes or acknowledgments.',
    headerFields: [
      { name: 'Source Port', size: '16 bits', purpose: 'Originating port', securityRelevance: 'Trivially spoofed in amplification attacks' },
      { name: 'Destination Port', size: '16 bits', purpose: 'Destination service port', securityRelevance: 'Targeted UDP service scanning' },
      { name: 'Length', size: '16 bits', purpose: 'Header + payload byte length', securityRelevance: 'Buffer boundary validation' },
      { name: 'Checksum', size: '16 bits', purpose: 'Error detection for header/data', securityRelevance: 'Optional in IPv4, mandatory in IPv6' }
    ],
    rfc: 'RFC 768',
    securityRisks: ['UDP Reflection / Amplification DDoS', 'UDP Port Scanning', 'Covert Channel Tunneling'],
    commonAttacks: ['DNS Amplification DDoS', 'NTP Monlist Flood', 'SNMP Reflection', 'UDP flood'],
    detectionMechanisms: ['Inbound bandwidth threshold monitoring', 'Stateless UDP flow rate trackers', 'Geo-IP anomaly filters'],
    defenseControls: ['BCP 38 Ingress source address validation', 'Disabling open public UDP resolvers', 'Rate limiting UDP traffic at ISP border'],
    wiresharkFilters: ['udp.length > 512', 'udp.port == 53', 'udp.dstport == 123']
  },
  {
    name: 'Domain Name System', shortName: 'DNS', layer: 'Application', port: 53, transport: 'UDP',
    purpose: 'Translates human-readable domain names into IP addresses and routes internet mail/services.',
    headerFields: [
      { name: 'Transaction ID', size: '16 bits', purpose: 'Matches requests to responses', securityRelevance: 'Targeted in Kaminsky DNS cache poisoning attacks' },
      { name: 'Flags (QR, Opcode, AA, TC, RD, RA, RCODE)', size: '16 bits', purpose: 'Query/Response status and error codes', securityRelevance: 'NXDOMAIN floods and truncated response checks' },
      { name: 'Questions / RR Counts', size: '16 bits each', purpose: 'Count of queries and answer records', securityRelevance: 'Unusually high answer counts in amplification' }
    ],
    rfc: 'RFC 1035, RFC 4033 (DNSSEC)',
    securityRisks: ['DNS Tunneling Data Exfiltration', 'DNS Cache Poisoning', 'Fast Flux Domain Hosting', 'DNS Hijacking'],
    commonAttacks: ['Iodine / dnscat2 Tunneling', 'Kaminsky Poisoning', 'Typosquatting Phishing', 'DGA Domain Generation'],
    detectionMechanisms: ['Shannon entropy analysis on subdomains', 'Query length threshold alerts (>50 chars)', 'Tracking newly registered domains (NRDs)'],
    defenseControls: ['DNS Sinkholing', 'Enforcing internal DNS recursive resolvers', 'DNSSEC cryptographic signature validation', 'RPZ (Response Policy Zones)'],
    wiresharkFilters: ['dns.flags.response == 0', 'dns.qry.name.len > 50', 'dns.flags.rcode == 3']
  },
  {
    name: 'Dynamic Host Configuration Protocol', shortName: 'DHCP', layer: 'Application', port: '67 (Server) / 68 (Client)', transport: 'UDP',
    purpose: 'Dynamically assigns IP addresses, subnet masks, default gateways, and DNS servers to network clients.',
    headerFields: [
      { name: 'Message OpCode', size: '8 bits', purpose: '1 = BOOTREQUEST, 2 = BOOTREPLY', securityRelevance: 'Identifies client request vs server offer' },
      { name: 'Transaction ID (XID)', size: '32 bits', purpose: 'Matches DORA exchanges', securityRelevance: 'Session correlation' },
      { name: 'Client IP / Your IP / Server IP', size: '32 bits each', purpose: 'IP address assignments', securityRelevance: 'Rogue server IP injection' },
      { name: 'DHCP Options', size: 'Variable', purpose: 'Option 3 (Gateway), 6 (DNS), 53 (Msg Type)', securityRelevance: 'Malicious Gateway injection for Man-in-the-Middle' }
    ],
    rfc: 'RFC 2131',
    securityRisks: ['Rogue DHCP Server Gateway Hijacking', 'DHCP Starvation (exhausting IP pool)', 'Client DNS redirection'],
    commonAttacks: ['Yersinia DHCP Starvation', 'Rogue DHCP Man-in-the-Middle', 'DHCP Option 121 route injection'],
    detectionMechanisms: ['Alert on multiple DHCP Offer packets with differing MACs', 'DHCP pool utilization monitoring'],
    defenseControls: ['DHCP Snooping on switch access ports', 'Port Security limiting MAC addresses', 'DHCP Starvation rate limiting'],
    wiresharkFilters: ['bootp.option.type == 53', 'bootp.dhcp', 'udp.port == 67 || udp.port == 68']
  },
  {
    name: 'Hypertext Transfer Protocol Secure', shortName: 'HTTPS', layer: 'Application', port: 443, transport: 'TCP',
    purpose: 'Secures web communication by wrapping HTTP inside Transport Layer Security (TLS) encryption.',
    headerFields: [
      { name: 'TLS Record Layer', size: '5 bytes', purpose: 'Content Type, Version, Length', securityRelevance: 'Identifies TLS Handshake vs Application Data' },
      { name: 'ClientHello / ServerHello', size: 'Variable', purpose: 'Cipher negotiation and key exchange', securityRelevance: 'JA3/JA3S TLS fingerprinting for threat detection' },
      { name: 'Certificate', size: 'Variable', purpose: 'Public key identity authentication', securityRelevance: 'Expired, self-signed, or untrusted root CAs' }
    ],
    rfc: 'RFC 9110 (HTTP), RFC 8446 (TLS 1.3)',
    securityRisks: ['Malware C2 Hidden in Encrypted Egress', 'SSL Stripping', 'Compromised Root CA Trust', 'Weak Cipher Suites'],
    commonAttacks: ['Cobalt Strike HTTPS Beaconing', 'SSLstrip Downgrade', 'Man-in-the-Middle with Rogue CA', 'Heartbleed (legacy)'],
    detectionMechanisms: ['JA3 / JA3S TLS hash profiling', 'SSL/TLS Decryption & Inspection (Forward Proxy)', 'Certificate Transparency log monitoring'],
    defenseControls: ['HTTP Strict Transport Security (HSTS)', 'Enforcing TLS 1.3 exclusively', 'Certificate Pinning in mobile applications'],
    wiresharkFilters: ['tls.handshake.type == 1', 'tls.handshake.ciphersuite', 'http2 || tls']
  },
  {
    name: 'Server Message Block', shortName: 'SMB', layer: 'Application', port: 445, transport: 'TCP',
    purpose: 'Network file sharing, print services, and Remote Procedure Call (RPC) inter-process communication in Windows.',
    headerFields: [
      { name: 'SMB Protocol Magic', size: '4 bytes', purpose: '0xFF SMB (v1) or 0xFE SMB (v2/v3)', securityRelevance: 'SMBv1 indicates obsolete vulnerable stack' },
      { name: 'Command Code', size: '8/16 bits', purpose: 'Tree Connect, Create, Read, Write, Trans2', securityRelevance: 'Trans2 secondary abuse in EternalBlue' },
      { name: 'Session ID / Tree ID', size: '64 bits', purpose: 'Identifies authenticated session', securityRelevance: 'Session signing prevents SMB relay attacks' }
    ],
    rfc: 'MS-SMB2 Documentation',
    securityRisks: ['Remote Code Execution (EternalBlue)', 'Pass-the-Hash / Pass-the-Ticket', 'SMB NTLM Relay Attacks', 'Ransomware lateral spreading'],
    commonAttacks: ['EternalBlue (MS17-010)', 'PsExec Lateral Movement', 'Impacket ntlmrelayx', 'WannaCry / NotPetya worm propagation'],
    detectionMechanisms: ['SIEM Event ID 4624 (Logon Type 3) surges', 'Suricata signatures for SMBv1 Trans2 exploits', 'Workstation-to-workstation port 445 traffic'],
    defenseControls: ['Disable SMBv1 globally across enterprise', 'Block TCP 445 at perimeter and between internal workstations', 'Enforce SMB Signing (RequireSecuritySignatures)'],
    wiresharkFilters: ['smb2', 'tcp.port == 445', 'smb.cmd == 0x32']
  },
  {
    name: 'Secure Shell', shortName: 'SSH', layer: 'Application', port: 22, transport: 'TCP',
    purpose: 'Secure encrypted remote command line access, tunneling, and file transfers (SFTP/SCP).',
    headerFields: [
      { name: 'Protocol Version Exchange', size: 'String', purpose: 'SSH-2.0-OpenSSH_8.9p1', securityRelevance: 'Banner reveals exact OS and patch level' },
      { name: 'Key Exchange Init (KEXINIT)', size: 'Variable', purpose: 'Negotiates Diffie-Hellman ciphers & host keys', securityRelevance: 'Weak cipher detection (diffie-hellman-group1-sha1)' },
      { name: 'Encrypted Payload', size: 'Variable', purpose: 'Encrypted shell session', securityRelevance: 'SSH tunneling used to bypass firewalls' }
    ],
    rfc: 'RFC 4253',
    securityRisks: ['SSH Brute Force / Credential Stuffing', 'SSH Dynamic Port Forwarding / SOCKS Proxy Evasion', 'Stolen Private SSH Keys'],
    commonAttacks: ['Hydra SSH Brute-Force', 'Reverse SSH Tunnels (ssh -R)', 'SSH Key Exfiltration from ~/.ssh/id_rsa'],
    detectionMechanisms: ['Failed authentication rate monitoring in auth.log', 'High outbound SSH session duration from non-admin endpoints'],
    defenseControls: ['Disable root login (PermitRootLogin no)', 'Enforce SSH Key-Based Authentication only', 'Deploy Fail2ban / CrowdSec', 'SSH Bastion Jump Hosts'],
    wiresharkFilters: ['ssh', 'tcp.port == 22', 'ssh.protocol']
  },
  {
    name: 'Remote Desktop Protocol', shortName: 'RDP', layer: 'Application', port: 3389, transport: 'TCP/UDP',
    purpose: 'Microsoft proprietary protocol for remote graphical desktop administration and virtual desktop infrastructure.',
    headerFields: [
      { name: 'TPKT / X.224 Header', size: '7 bytes', purpose: 'Encapsulates RDP protocol within TCP stream', securityRelevance: 'Packet length boundary manipulation' },
      { name: 'MCS Connect Initial', size: 'Variable', purpose: 'Negotiates client security capabilities', securityRelevance: 'Target of BlueKeep (CVE-2019-0708) pre-auth RCE' },
      { name: 'CredSSP / NLA', size: 'Variable', purpose: 'Pre-authenticates client before GUI initializes', securityRelevance: 'NLA prevents pre-authentication remote exploits' }
    ],
    rfc: 'MS-RDPBCGR Documentation',
    securityRisks: ['RDP Password Brute-Forcing', 'BlueKeep Pre-Authentication RCE', 'RDP Session Hijacking (tscon)', 'Initial Ransomware Access Vector'],
    commonAttacks: ['NLBrute / Crowbar RDP password spray', 'BlueKeep exploit (CVE-2019-0708)', 'RDP tunnel via Ngrok / Chisel'],
    detectionMechanisms: ['Windows Event ID 4625 (Failed Logon Type 10) surges', 'Event ID 1149 in RemoteDesktopServices operational log'],
    defenseControls: ['Enforce Network Level Authentication (NLA)', 'Never expose port 3389 to internet; require VPN + MFA', 'Account lockout thresholds for brute-force defense'],
    wiresharkFilters: ['rdp', 'tcp.port == 3389', 'x224']
  }
];

const ports = [
  { port: 20, service: 'FTP-Data', protocol: 'TCP', purpose: 'File Transfer Protocol data stream channel', trafficProfile: 'High bandwidth file transfers', authentication: 'Controlled via FTP control channel', securityRisk: 'Medium', commonAttacks: ['Unencrypted data sniffing', 'Cleartext file exfiltration'], detectionGuidance: 'Monitor outbound FTP data flows to untrusted external IPs.', defenseRemediation: 'Replace with SFTP (SSH Port 22) or HTTPS; disable cleartext FTP.' },
  { port: 21, service: 'FTP-Control', protocol: 'TCP', purpose: 'File Transfer Protocol command channel', trafficProfile: 'Interactive command sessions (USER, PASS, LIST)', authentication: 'Cleartext plaintext credentials', securityRisk: 'High', commonAttacks: ['Credential sniffing in Wireshark', 'Anonymous FTP exploitation', 'Brute force'], detectionGuidance: 'Alert on any cleartext PASS commands in PCAP traces (filter: ftp.response.code).', defenseRemediation: 'Deprecate FTP; transition all users to SFTP or FTPS with enforced TLS.' },
  { port: 22, service: 'SSH / SFTP', protocol: 'TCP', purpose: 'Secure Shell remote terminal access & secure file transfer', trafficProfile: 'Encrypted interactive shell or file stream', authentication: 'Public Key, Password, Certificate, MFA', securityRisk: 'Medium', commonAttacks: ['Automated brute-force attacks', 'Reverse SSH tunneling for C2', 'Compromised authorized_keys'], detectionGuidance: 'Alert on >10 failed SSH logins per minute from single source IP.', defenseRemediation: 'Disable password auth; enforce SSH keys; use Fail2Ban; place behind VPN.' },
  { port: 23, service: 'Telnet', protocol: 'TCP', purpose: 'Legacy unencrypted terminal communication protocol', trafficProfile: 'Interactive command sessions in plaintext', authentication: 'Plaintext username and password', securityRisk: 'Critical', commonAttacks: ['Wireshark packet sniffing capturing root passwords', 'Mirai botnet IoT exploitation'], detectionGuidance: 'Immediate CRITICAL alert on any active TCP 23 traffic traversing the enterprise.', defenseRemediation: 'Disable Telnet daemon completely on all switches, routers, and servers; enforce SSH.' },
  { port: 25, service: 'SMTP', protocol: 'TCP', purpose: 'Simple Mail Transfer Protocol for MTA-to-MTA mail delivery', trafficProfile: 'Text-based email relay transactions', authentication: 'STARTTLS, SMTP AUTH, SPF, DKIM, DMARC', securityRisk: 'Medium', commonAttacks: ['Open Mail Relay abuse for spam/phishing', 'Email spoofing', 'STARTTLS stripping'], detectionGuidance: 'Monitor for unauthorized internal hosts attempting outbound port 25 connections (spam bot indicator).', defenseRemediation: 'Restrict outbound port 25 to authorized mail gateways; enforce SPF, DKIM, and DMARC policies.' },
  { port: 53, service: 'DNS', protocol: 'TCP/UDP', purpose: 'Domain Name System name-to-IP resolution', trafficProfile: 'High frequency small UDP datagrams; TCP for zone transfers', authentication: 'None natively (DNSSEC adds cryptographic integrity)', securityRisk: 'High', commonAttacks: ['DNS Tunneling C2', 'DNS Amplification DDoS', 'DNS Poisoning', 'Unauthorized Zone Transfers (AXFR)'], detectionGuidance: 'Calculate Shannon entropy on subdomains; alert on AXFR zone transfer requests from untrusted hosts.', defenseRemediation: 'Block external port 53 directly from workstations; disable AXFR zone transfers to untrusted IPs.' },
  { port: 67, service: 'DHCP-Server', protocol: 'UDP', purpose: 'DHCP server listening daemon for client discovers/requests', trafficProfile: 'Local broadcast datagrams on LAN subnet', authentication: 'None natively', securityRisk: 'High', commonAttacks: ['Rogue DHCP server injecting fake gateway', 'DHCP Starvation attacks'], detectionGuidance: 'Alert on multiple DHCP Offer packets generated by unrecognized MAC addresses.', defenseRemediation: 'Enable DHCP Snooping on all managed switches; mark client access ports as untrusted.' },
  { port: 80, service: 'HTTP', protocol: 'TCP', purpose: 'Hypertext Transfer Protocol for unencrypted web traffic', trafficProfile: 'Plaintext Web requests and HTML/JSON responses', authentication: 'Basic Auth (Base64), Cookies, Bearer Tokens', securityRisk: 'High', commonAttacks: ['Cleartext credential/cookie sniffing', 'Man-in-the-Middle packet injection', 'Web application attacks'], detectionGuidance: 'Wireshark filter: http.authorization or http.cookie over cleartext port 80.', defenseRemediation: 'Redirect all port 80 traffic to HTTPS port 443 with HSTS.' },
  { port: 88, service: 'Kerberos', protocol: 'TCP/UDP', purpose: 'Active Directory authentication service using ticket-granting architecture', trafficProfile: 'AS-REQ, AS-REP, TGS-REQ, TGS-REP ticket exchanges', authentication: 'Symmetric/Asymmetric cryptographic tickets', securityRisk: 'High', commonAttacks: ['Kerberoasting (requesting SPN tickets for offline cracking)', 'AS-REP Roasting', 'Golden Ticket forge'], detectionGuidance: 'Monitor SIEM for surges in Event ID 4769 with weak RC4 encryption (Ticket Encryption Type 0x17).', defenseRemediation: 'Enforce AES encryption for Kerberos; use complex 25+ character passwords for service accounts (gMSAs).' },
  { port: 123, service: 'NTP', protocol: 'UDP', purpose: 'Network Time Protocol for clock synchronization', trafficProfile: 'Periodic low-bandwidth UDP time packets', authentication: 'NTP Authentication Keys (rarely deployed publicly)', securityRisk: 'Medium', commonAttacks: ['NTP monlist amplification DDoS', 'Time manipulation to bypass certificate validity'], detectionGuidance: 'Detect inbound UDP 123 responses larger than 400 bytes (amplification indicator).', defenseRemediation: 'Disable "monlist" command in ntp.conf (noquery); restrict NTP sync to trusted internal time servers.' },
  { port: 135, service: 'MSRPC', protocol: 'TCP', purpose: 'Microsoft Remote Procedure Call endpoint mapper', trafficProfile: 'RPC service enumeration and inter-process calls', authentication: 'Windows Integrated (NTLM/Kerberos)', securityRisk: 'High', commonAttacks: ['RPC service enumeration (rpcdump)', 'DCOM lateral movement', 'PetitPotam NTLM relay coercion'], detectionGuidance: 'Alert on workstation-to-workstation port 135 connections initiating DCOM processes.', defenseRemediation: 'Block port 135 between client endpoints using Windows Defender Firewall.' },
  { port: 139, service: 'NetBIOS Session', protocol: 'TCP', purpose: 'Legacy NetBIOS session service for file and printer sharing', trafficProfile: 'Legacy Windows networking transactions', authentication: 'NTLM / Cleartext', securityRisk: 'High', commonAttacks: ['NetBIOS enumeration', 'Null session information disclosure'], detectionGuidance: 'Audit any active TCP 139 traffic on modern networks.', defenseRemediation: 'Disable NetBIOS over TCP/IP across all network adapter settings via DHCP/GPO.' },
  { port: 143, service: 'IMAP', protocol: 'TCP', purpose: 'Internet Message Access Protocol for email retrieval', trafficProfile: 'Cleartext email folder synchronization', authentication: 'Plaintext credentials without TLS', securityRisk: 'High', commonAttacks: ['Plaintext email and password sniffing'], detectionGuidance: 'Wireshark filter: imap.request.command == "LOGIN".', defenseRemediation: 'Migrate to IMAPS on port 993 with mandatory TLS 1.3.' },
  { port: 161, service: 'SNMP', protocol: 'UDP', purpose: 'Simple Network Management Protocol device monitoring', trafficProfile: 'Polling metrics (CPU, bandwidth, interfaces)', authentication: 'SNMPv1/v2c use plaintext community strings ("public")', securityRisk: 'High', commonAttacks: ['SNMP community string brute-force', 'Network topology enumeration', 'SNMP amplification DDoS'], detectionGuidance: 'Detect SNMP queries containing default community string "public" or "private".', defenseRemediation: 'Upgrade to SNMPv3 with SHA authentication and AES encryption; restrict via ACLs.' },
  { port: 389, service: 'LDAP', protocol: 'TCP/UDP', purpose: 'Lightweight Directory Access Protocol for directory queries', trafficProfile: 'Active Directory user/group/computer lookups', authentication: 'Simple bind (cleartext) or SASL/GSS-API', securityRisk: 'High', commonAttacks: ['LDAP enumeration by non-admin users', 'Cleartext credential harvesting', 'LDAP Injection'], detectionGuidance: 'Detect mass LDAP queries enumerating domain admins or Kerberoastable SPNs.', defenseRemediation: 'Enforce LDAPS (Port 636) and enable LDAP Channel Binding and Signing in Active Directory.' },
  { port: 443, service: 'HTTPS', protocol: 'TCP', purpose: 'Encrypted web traffic via TLS/SSL', trafficProfile: 'High bandwidth encrypted application data', authentication: 'TLS Certificates, JWT, OAuth, MFA', securityRisk: 'Medium', commonAttacks: ['C2 encrypted beaconing', 'TLS data exfiltration', 'Web application exploits (SQLi, XSS)'], detectionGuidance: 'JA3 fingerprint analysis, SSL forward proxy decryption, domain reputation monitoring.', defenseRemediation: 'Enforce modern TLS 1.3, configure WAF inspection, inspect egress HTTPS with Next-Gen Firewalls.' },
  { port: 445, service: 'SMB', protocol: 'TCP', purpose: 'Direct-hosted Server Message Block file and service sharing', trafficProfile: 'Windows file sharing, Named Pipes, RPC execution', authentication: 'NTLM, Kerberos, SMB Signing', securityRisk: 'Critical', commonAttacks: ['EternalBlue (MS17-010)', 'Pass-the-Hash', 'PsExec lateral execution', 'Ransomware propagation'], detectionGuidance: 'Alert on workstation-to-workstation port 445 traffic; detect PsExec named pipe creation (\\pipe\\psexec).', defenseRemediation: 'Block port 445 at perimeter; isolate workstations with host firewalls; require SMB Signing.' },
  { port: 636, service: 'LDAPS', protocol: 'TCP', purpose: 'Lightweight Directory Access Protocol over TLS', trafficProfile: 'Encrypted Active Directory directory queries', authentication: 'TLS Certificate + Kerberos/NTLM', securityRisk: 'Low', commonAttacks: ['Authenticated directory reconnaissance by rogue domain users'], detectionGuidance: 'Monitor high-volume queries from single endpoints seeking sensitive AD attributes.', defenseRemediation: 'Audit Active Directory object permissions; enforce Tiered Administrative Architecture.' },
  { port: 3389, service: 'RDP', protocol: 'TCP/UDP', purpose: 'Microsoft Remote Desktop Protocol graphical administration', trafficProfile: 'Encrypted interactive graphical video stream', authentication: 'Network Level Authentication (NLA) + Windows Credentials', securityRisk: 'Critical', commonAttacks: ['BlueKeep (CVE-2019-0708)', 'RDP credential brute-force', 'RDP Session Hijacking'], detectionGuidance: 'Monitor Event ID 4625 (Logon Type 10) surges in SIEM; alert on internet-exposed 3389.', defenseRemediation: 'Require NLA; mandate MFA and VPN for remote access; never expose directly to the internet.' },
  { port: 8080, service: 'HTTP-Proxy / Alt Web', protocol: 'TCP', purpose: 'Alternate HTTP port commonly used for development web apps & proxies', trafficProfile: 'Web application traffic, REST APIs, Burp Suite proxies', authentication: 'Application specific', securityRisk: 'High', commonAttacks: ['Unauthenticated management panels (Tomcat, Jenkins)', 'Proxy bypass'], detectionGuidance: 'Scan internal networks for unauthorized HTTP listening daemons on port 8080.', defenseRemediation: 'Enforce authentication on administrative consoles; restrict access via IP whitelisting.' }
];

const protocolsCode = 'import { ProtocolInfo } from "../types";\n\nexport const PROTOCOLS: ProtocolInfo[] = ' + JSON.stringify(protocols, null, 2) + ';\n';
const portsCode = 'import { PortInfo } from "../types";\n\nexport const PORTS: PortInfo[] = ' + JSON.stringify(ports, null, 2) + ';\n';

fs.writeFileSync('src/data/protocols.ts', protocolsCode);
fs.writeFileSync('src/data/ports.ts', portsCode);

console.log('src/data/protocols.ts and src/data/ports.ts generated successfully');
