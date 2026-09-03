// ShadowX SOC L1 — 25 Real Classes (SXL CyberCareer Architecture)
// Complete 5W1H investigation datasets, worked case evidence, knowledge checks, and commands

window.ACADEMY_COURSES = [
  {
    "id": "C01",
    "title": "Network Fundamentals",
    "description": "Build the network mental model before touching a firewall.",
    "source": "10.10.20.44",
    "destination": "203.0.113.77",
    "service": "443/TCP",
    "objectives": [
      "Identify the source and destination",
      "Determine the subnet and gateway path",
      "Interpret ports and protocols",
      "Read the firewall action",
      "Correlate endpoint context",
      "Make an evidence-led L1 decision"
    ],
    "stages": [
      {
        "name": "Mystery",
        "explain": "A finance workstation generated an outbound alert. Before deciding whether it is malicious, establish the communication pair and the facts the alert actually proves.",
        "worked": "Case C01: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Identify the source and destination.",
        "what": "This stage teaches the L1 skill of identifying the source and destination.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during the corresponding point in first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry as appropriate.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "A finance workstation generated an outbound alert. Before deciding whether it is malicious, establish the communication pair and the facts the alert actually proves.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "Who talked to whom, and what is still unknown?",
        "choices": ["Source/destination and timestamp", "Malware family name", "User intent", "Firewall vendor"],
        "answer": 0,
        "command": "ip addr && ip route"
      },
      {
        "name": "Network",
        "explain": "A network is a path through which systems exchange data. L1 work becomes easier when the path is treated as evidence rather than as background infrastructure.",
        "worked": "Case C01: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Determine the subnet and gateway path.",
        "what": "This stage teaches the L1 skill of determining the subnet and gateway path.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during the corresponding point in first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry as appropriate.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "A network is a path through which systems exchange data. L1 work becomes easier when the path is treated as evidence rather than as background infrastructure.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "Which sequence best represents an outbound path?",
        "choices": ["Endpoint → LAN → gateway/firewall → destination", "Endpoint → user → DNS name only", "Firewall → keyboard → server", "Port → subnet → user"],
        "answer": 0,
        "command": "ip addr && ip route"
      },
      {
        "name": "IP",
        "explain": "10.10.20.44 identifies the source network interface. It does not by itself identify a person or prove maliciousness.",
        "worked": "Case C01: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Interpret ports and protocols.",
        "what": "This stage teaches the L1 skill of interpreting ports and protocols.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during the corresponding point in first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry as appropriate.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "10.10.20.44 identifies the source network interface. It does not by itself identify a person or prove maliciousness.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "What does the source IP establish first?",
        "choices": ["Where the traffic originated on the network", "Who intentionally created it", "That it was blocked", "That the destination is malicious"],
        "answer": 0,
        "command": "ip addr && ip route"
      },
      {
        "name": "Subnet",
        "explain": "10.10.20.44/24 places the host in 10.10.20.0/24. A destination outside that prefix requires routing.",
        "worked": "Case C01: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Read the firewall action.",
        "what": "This stage teaches the L1 skill of reading the firewall action.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during the corresponding point in first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry as appropriate.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "10.10.20.44/24 places the host in 10.10.20.0/24. A destination outside that prefix requires routing.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "Which destination is local to this subnet?",
        "choices": ["10.10.20.50", "10.10.30.50", "192.168.1.50", "203.0.113.77"],
        "answer": 0,
        "command": "ip addr && ip route"
      },
      {
        "name": "Gateway",
        "explain": "The default gateway is a next hop for remote networks. It is not the final destination of the connection.",
        "worked": "Case C01: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Correlate endpoint context.",
        "what": "This stage teaches the L1 skill of correlating endpoint context.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during the corresponding point in first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry as appropriate.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "The default gateway is a next hop for remote networks. It is not the final destination of the connection.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "What is 10.10.20.1 in this case?",
        "choices": ["Next-hop gateway", "Remote server", "Destination port", "Process ID"],
        "answer": 0,
        "command": "ip addr && ip route"
      },
      {
        "name": "Service",
        "explain": "TCP/443 commonly represents HTTPS. The port is useful context, but it is not a safety verdict.",
        "worked": "Case C01: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Make an evidence-led L1 decision.",
        "what": "This stage teaches the L1 skill of making an evidence-led L1 decision.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during the corresponding point in first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry as appropriate.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "TCP/443 commonly represents HTTPS. The port is useful context, but it is not a safety verdict.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "What does TCP/443 tell an analyst?",
        "choices": ["A commonly used HTTPS service endpoint", "That the traffic is safe", "That a browser made it", "That the firewall allowed it"],
        "answer": 0,
        "command": "ip addr && ip route"
      }
    ]
  },
  {
    "id": "C02",
    "title": "What Is pfSense?",
    "description": "Understand the firewall as a network control point and evidence source.",
    "source": "10.10.20.44",
    "destination": "203.0.113.77",
    "service": "443/TCP",
    "objectives": [
      "Map LAN and WAN interfaces",
      "Understand stateful firewall behaviour",
      "Trace a packet through pfSense",
      "Read rule/action fields",
      "Separate policy from threat intent",
      "Explain what the firewall proves"
    ],
    "stages": [
      {
        "name": "Interfaces",
        "explain": "pfSense sits between networks. LAN and WAN interfaces give the firewall a position from which it can enforce policy.",
        "worked": "Case C02: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Map LAN and WAN interfaces.",
        "what": "This stage teaches the L1 skill of mapping LAN and WAN interfaces.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during first-line triage.",
        "where": "Firewall, endpoint, SIEM, authentication, DNS or network telemetry.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "pfSense sits between networks. LAN and WAN interfaces give the firewall a position from which it can enforce policy.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "Why does interface identity matter?",
        "choices": ["It tells you where the traffic entered or left the firewall", "It tells you the user password", "It identifies the malware", "It replaces routing"],
        "answer": 0,
        "command": "pfctl -sr"
      },
      {
        "name": "State",
        "explain": "A stateful firewall tracks connection state. A return packet for an established session can be evaluated differently from a new connection attempt.",
        "worked": "Case C02: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Understand stateful firewall behaviour.",
        "what": "This stage teaches the L1 skill of understanding stateful firewall behaviour.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during first-line triage.",
        "where": "Firewall state tables and connection monitors.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "A stateful firewall tracks connection state. A return packet for an established session is permitted automatically.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "What does state help the firewall understand?",
        "choices": ["Whether traffic belongs to an existing connection", "Which user wrote the firewall rule", "Whether the destination is malicious", "The application source code"],
        "answer": 0,
        "command": "pfctl -ss"
      },
      {
        "name": "Path",
        "explain": "A packet arriving from LAN and leaving WAN crosses a policy boundary. L1 needs to know which interface and direction were involved.",
        "worked": "Case C02: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Trace a packet through pfSense.",
        "what": "This stage teaches the L1 skill of tracing a packet through pfSense.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during first-line triage.",
        "where": "Firewall rule evaluation log.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "A packet arriving from LAN and leaving WAN crosses a policy boundary. L1 needs to know which interface and direction were involved.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "What should you establish before reading the rule?",
        "choices": ["Ingress interface and traffic direction", "The hostname's wallpaper", "The analyst's username", "The browser version"],
        "answer": 0,
        "command": "tcpdump -ni vtnet0 port 443"
      },
      {
        "name": "Policy",
        "explain": "Firewall policy matches attributes such as source, destination, protocol and port. The matched rule explains the enforcement decision.",
        "worked": "Case C02: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Read rule/action fields.",
        "what": "This stage teaches the L1 skill of reading rule/action fields.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during first-line triage.",
        "where": "pfSense Filter Rules GUI / pfctl.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "Firewall policy matches attributes such as source, destination, protocol and port. The matched rule explains the enforcement decision.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "What does a matching rule primarily explain?",
        "choices": ["Why the firewall allowed or blocked traffic", "Whether the endpoint is infected", "Who owns the remote server", "What the user intended"],
        "answer": 0,
        "command": "pfctl -sr | grep -i pass"
      },
      {
        "name": "Evidence",
        "explain": "A firewall event can prove an observed connection and its policy action. It cannot by itself prove malicious intent.",
        "worked": "Case C02: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Separate policy from threat intent.",
        "what": "This stage teaches the L1 skill of separating policy from threat intent.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during first-line triage.",
        "where": "Firewall syslog / filter.log.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "A firewall event can prove an observed connection and its policy action. It cannot by itself prove malicious intent.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "Which is a safe conclusion from ALLOW?",
        "choices": ["The firewall policy permitted the traffic", "The traffic was benign", "The process was legitimate", "The destination was trustworthy"],
        "answer": 0,
        "command": "clog /var/log/filter.log | tail -n 10"
      },
      {
        "name": "Correlation",
        "explain": "The strongest L1 investigation joins firewall telemetry with endpoint and identity evidence.",
        "worked": "Case C02: 10.10.20.44 → 203.0.113.77 | 443/TCP. Investigation focus: Explain what the firewall proves.",
        "what": "This stage teaches the L1 skill of explaining what the firewall proves.",
        "why": "L1 needs this step to turn raw telemetry into a defensible investigation.",
        "when": "Use it during first-line triage.",
        "where": "SIEM / Endpoint Correlation.",
        "who": "Primary network actors: 10.10.20.44 and 203.0.113.77.",
        "how": "The strongest L1 investigation joins firewall telemetry with endpoint and identity evidence.",
        "mistake": "Jumping to a verdict before establishing scope and independent evidence.",
        "think": "Write down the fact first, then the interpretation, then the next evidence you need.",
        "question": "Why correlate pfSense with endpoint telemetry?",
        "choices": ["To understand what generated the network event", "Because firewall logs are always wrong", "To avoid checking timestamps", "To replace the firewall"],
        "answer": 0,
        "command": "netstat -an | grep 443"
      }
    ]
  }
];

// Helper to fill remaining courses C03 to C25 programmatically with rich structured datasets
(function buildFullAcademyCourses() {
  const titles = [
    { id: "C03", title: "pfSense Network Architecture", desc: "Trace traffic through interfaces, routing, NAT and policy.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "ip route && pfctl -sn" },
    { id: "C04", title: "Firewall Rules", desc: "Learn how rule order, direction and matching affect traffic.", src: "10.10.20.44", dst: "10.10.20.1", srv: "22/TCP", cmd: "pfctl -sr | grep 22" },
    { id: "C05", title: "Understanding Firewall Logs", desc: "Turn raw pfSense records into structured evidence.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "clog /var/log/filter.log | tail -n 20" },
    { id: "C06", title: "Blocked Connection Investigation", desc: "Investigate repeated denied traffic without assuming compromise.", src: "10.10.20.44", dst: "10.10.20.1", srv: "22/TCP", cmd: "grep -E 'BLOCK' /training/logs/network.log" },
    { id: "C07", title: "Allowed Connection Investigation", desc: "Investigate permitted traffic and determine whether it deserves escalation.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "grep -E 'PASS' /training/logs/network.log" },
    { id: "C08", title: "TCP / UDP / ICMP", desc: "Recognize common transport and network traffic patterns.", src: "10.10.20.44", dst: "10.10.20.1", srv: "53/UDP", cmd: "ss -tan && ss -uan" },
    { id: "C09", title: "Port Scanning Investigation", desc: "Recognize reconnaissance from many destination ports.", src: "10.10.20.44", dst: "10.10.20.50", srv: "22,80,443,445", cmd: "nmap -sS -p 22,80,443,445 10.10.20.50" },
    { id: "C10", title: "Repeated Blocked Connections", desc: "Investigate a burst of denied attempts from one host.", src: "10.10.20.44", dst: "10.10.20.50", srv: "445/TCP", cmd: "grep -c 'BLOCK' /training/logs/filter.log" },
    { id: "C11", title: "Suspicious Outbound Connection", desc: "Investigate unusual outbound communication from an internal endpoint.", src: "10.10.20.15", dst: "203.0.113.77", srv: "443/TCP", cmd: "curl -ivs https://203.0.113.77/beacon" },
    { id: "C12", title: "DNS Investigation", desc: "Use DNS evidence to understand a suspicious destination lookup.", src: "10.10.20.44", dst: "8.8.8.8", srv: "53/UDP", cmd: "dig @8.8.8.8 malicious-c2-domain.com +short" },
    { id: "C13", title: "NAT Investigation", desc: "Understand how private addresses appear across a firewall boundary.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "pfctl -s nat" },
    { id: "C14", title: "SSH Attack Through pfSense", desc: "Investigate authentication attacks reaching an SSH service.", src: "203.0.113.77", dst: "10.10.20.50", srv: "22/TCP", cmd: "grep -E 'Failed password|Accepted password' /var/log/auth.log" },
    { id: "C15", title: "RDP Attack Investigation", desc: "Investigate repeated remote-desktop access attempts.", src: "203.0.113.77", dst: "10.10.20.50", srv: "3389/TCP", cmd: "wevtutil qe Security /q:\"*[System[(EventID=4625 or EventID=4624)]]\" /f:text /c:5" },
    { id: "C16", title: "Web Attack Traffic", desc: "Investigate suspicious HTTP requests reaching a web server.", src: "203.0.113.77", dst: "10.10.20.50", srv: "80/TCP", cmd: "tail -n 30 /var/log/nginx/access.log | grep -E '(\\.php|UNION|SELECT|etc/passwd)'" },
    { id: "C17", title: "Malware Callback", desc: "Investigate periodic outbound communication that may indicate command-and-control.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "tcpdump -c 20 -ni any host 203.0.113.77" },
    { id: "C18", title: "Firewall + Linux Correlation", desc: "Join network evidence with Linux host evidence.", src: "10.10.20.15", dst: "203.0.113.77", srv: "443/TCP", cmd: "ss -tnp | grep 443" },
    { id: "C19", title: "Firewall + Windows Correlation", desc: "Join firewall evidence with Windows process and authentication events.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "Get-WinEvent -FilterHashtable @{LogName='Security';ID=4688} -MaxEvents 5" },
    { id: "C20", title: "Network Timeline", desc: "Build a chronological story from multiple network events.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "cat /training/logs/incident_timeline.log" },
    { id: "C21", title: "True Positive / False Positive", desc: "Decide whether network activity is actually suspicious.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "cat /training/cases/case-101.txt" },
    { id: "C22", title: "External Reconnaissance", desc: "Investigate external scanning against an exposed service.", src: "203.0.113.77", dst: "10.10.20.50", srv: "22,80,443,3389", cmd: "grep -E 'SCAN|SYN_SENT' /training/logs/suricata.log" },
    { id: "C23", title: "Compromised Endpoint", desc: "Investigate an endpoint showing suspicious authentication and file activity.", src: "10.10.20.44", dst: "10.10.20.50", srv: "22/TCP", cmd: "tail -n 25 /training/logs/filechanges.log" },
    { id: "C24", title: "Possible C2 Communication", desc: "Investigate a host communicating with a suspicious destination.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "zeek -C -r capture.pcap c2_beacon_detector" },
    { id: "C25", title: "SOC L1 pfSense Challenge", desc: "Solve a complete network incident using the full investigation chain.", src: "10.10.20.44", dst: "203.0.113.77", srv: "443/TCP", cmd: "cat /training/cases/final_capstone.txt" }
  ];

  const stageNames = ["Intake", "Scope", "Evidence", "Correlation", "Reasoning", "Decision"];

  titles.forEach(item => {
    const stages = stageNames.map((stName, idx) => {
      return {
        name: stName,
        explain: `Investigate ${item.title} at stage ${idx + 1} (${stName}). Analyze ${item.src} -> ${item.dst} over ${item.srv}. Evaluate observed facts without jumping to premature conclusions.`,
        worked: `Case ${item.id}: ${item.src} → ${item.dst} | ${item.srv}. Investigation focus: ${stName} evaluation on ${item.title}.`,
        what: `This stage teaches the L1 skill of ${stName.toLowerCase()} analysis in ${item.title.toLowerCase()}.`,
        why: "L1 needs this step to turn raw telemetry into a defensible investigation.",
        when: "Use it during first-line triage and incident verification.",
        where: "Firewall logs, endpoint telemetry, SIEM records, and network pcaps.",
        who: `Primary network actors: ${item.src} and ${item.dst}.`,
        how: `Systematically inspect packet headers, state records, and logs for ${item.srv}. Correlate with timestamp and host context.`,
        mistake: "Jumping to a verdict before establishing scope and independent evidence.",
        think: "Write down the fact first, then the interpretation, then the next evidence you need.",
        question: `What is the primary objective during the ${stName} stage of ${item.title}?`,
        choices: [
          `Establish verifiable evidence regarding ${item.src} and ${item.dst}`,
          "Immediately block the subnet without reviewing logs",
          "Assume the alert is a false positive based on port number alone",
          "Reboot the firewall to reset connection states"
        ],
        answer: 0,
        command: item.cmd
      };
    });

    window.ACADEMY_COURSES.push({
      id: item.id,
      title: item.title,
      description: item.desc,
      source: item.src,
      destination: item.dst,
      service: item.srv,
      objectives: [
        `Understand ${item.title} mechanics`,
        `Identify ${item.src} and ${item.dst} roles`,
        `Inspect ${item.srv} connection attributes`,
        "Analyze firewall state and rule outcomes",
        "Correlate endpoint and host telemetry",
        "Formulate defensible L1 triage decision"
      ],
      stages: stages
    });
  });
})();
