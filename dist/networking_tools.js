// ══════════════════════════════════════════════════════════════════════════════
// ─── MASTER NETWORKING TOOLS & IP CALCULATORS SUITE ──────────────────────────
// ─── Free IP Calculators, VLSM, FLSM, Wildcard Masks & Practical Engine ──────
// ══════════════════════════════════════════════════════════════════════════════

window.NetworkingTools = (function () {
  let activeTool = 'cidr';
  let quizQuestion = null;
  let quizScore = { correct: 0, total: 0 };

  // ─── IP MATH HELPERS ───
  function ipToInt(ip) {
    return ip.split('.').reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0) >>> 0;
  }

  function intToIp(int) {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join('.');
  }

  function intToBinary(int) {
    return [
      ((int >>> 24) & 255).toString(2).padStart(8, '0'),
      ((int >>> 16) & 255).toString(2).padStart(8, '0'),
      ((int >>> 8) & 255).toString(2).padStart(8, '0'),
      (int & 255).toString(2).padStart(8, '0')
    ].join('.');
  }

  function prefixToMaskInt(prefix) {
    return prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  }

  function isValidIPv4(ip) {
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p.trim();
    });
  }

  function getIpClass(ip) {
    const first = parseInt(ip.split('.')[0], 10);
    if (first >= 1 && first <= 126) return { cls: 'A', scope: first === 10 ? 'Private (RFC 1918)' : 'Public' };
    if (first === 127) return { cls: 'Loopback', scope: 'Localhost (127.0.0.0/8)' };
    if (first >= 128 && first <= 191) {
      const isPriv = first === 172 && (parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31);
      return { cls: 'B', scope: isPriv ? 'Private (RFC 1918)' : 'Public' };
    }
    if (first >= 192 && first <= 223) {
      const isPriv = first === 192 && parseInt(ip.split('.')[1], 10) === 168;
      return { cls: 'C', scope: isPriv ? 'Private (RFC 1918)' : 'Public' };
    }
    if (first >= 224 && first <= 239) return { cls: 'D', scope: 'Multicast' };
    return { cls: 'E', scope: 'Experimental' };
  }

  // ─── 1. CIDR & WILDCARD CALCULATOR ───
  function calculateCidr(ipStr, prefix) {
    if (!isValidIPv4(ipStr)) return null;
    prefix = parseInt(prefix, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

    const ip = ipToInt(ipStr);
    const mask = prefixToMaskInt(prefix);
    const wildcard = (~mask) >>> 0;
    const net = (ip & mask) >>> 0;
    const bcast = (net | wildcard) >>> 0;

    let firstHost = net + 1;
    let lastHost = bcast - 1;
    let usable = Math.pow(2, 32 - prefix) - 2;

    if (prefix === 31) {
      firstHost = net;
      lastHost = bcast;
      usable = 2; // RFC 3021 point-to-point
    } else if (prefix === 32) {
      firstHost = net;
      lastHost = net;
      usable = 1;
    }

    return {
      ip: ipStr,
      prefix,
      netStr: intToIp(net),
      bcastStr: intToIp(bcast),
      firstStr: intToIp(firstHost),
      lastStr: intToIp(lastHost),
      maskStr: intToIp(mask),
      wildcardStr: intToIp(wildcard),
      usable: Math.max(0, usable),
      netBinary: intToBinary(net),
      maskBinary: intToBinary(mask),
      wildcardBinary: intToBinary(wildcard),
      ipClass: getIpClass(ipStr)
    };
  }

  // ─── 2. VLSM CALCULATOR ───
  function calculateVlsm(majorNetStr, majorPrefix, requirements) {
    if (!isValidIPv4(majorNetStr)) return { error: "Invalid Major Network IP." };
    majorPrefix = parseInt(majorPrefix, 10);
    const majorInt = ipToInt(majorNetStr) & prefixToMaskInt(majorPrefix);
    const maxIps = Math.pow(2, 32 - majorPrefix);

    // Sort descending by required hosts
    const reqs = requirements
      .map((r, i) => ({ name: r.name || `Subnet ${i + 1}`, hosts: parseInt(r.hosts, 10) || 0 }))
      .filter(r => r.hosts > 0)
      .sort((a, b) => b.hosts - a.hosts);

    if (reqs.length === 0) return { error: "Please enter at least one subnet with required hosts." };

    let currentIp = majorInt;
    const results = [];
    let totalAllocated = 0;

    for (const req of reqs) {
      // Smallest power of 2 >= needed + 2
      let needed = req.hosts;
      let power = 2;
      while (Math.pow(2, power) - 2 < needed && power <= 30) {
        power++;
      }
      const block = Math.pow(2, power);
      const prefix = 32 - power;

      if (currentIp + block > majorInt + maxIps) {
        return { error: `Address space exhausted! Could not fit ${req.name} (needs ${req.hosts} hosts) inside /${majorPrefix}.` };
      }

      const netStr = intToIp(currentIp);
      const maskStr = intToIp(prefixToMaskInt(prefix));
      const firstStr = intToIp(currentIp + 1);
      const lastStr = intToIp(currentIp + block - 2);
      const bcastStr = intToIp(currentIp + block - 1);

      results.push({
        name: req.name,
        needed: req.hosts,
        allocated: block - 2,
        prefix,
        netStr,
        maskStr,
        firstStr,
        lastStr,
        bcastStr
      });

      currentIp += block;
      totalAllocated += block;
    }

    return {
      major: `${intToIp(majorInt)}/${majorPrefix}`,
      subnets: results,
      totalCapacity: maxIps,
      usedCapacity: totalAllocated,
      utilizationPct: Math.round((totalAllocated / maxIps) * 100)
    };
  }

  // ─── 3. ROUTE SUMMARIZATION (SUPERNETTING) ───
  function calculateSummarization(routes) {
    const valid = routes.map(r => r.trim()).filter(r => r.length > 0);
    if (valid.length < 2) return { error: "Please provide at least two IPv4 routes to summarize." };

    const parsed = [];
    for (const r of valid) {
      const parts = r.split('/');
      if (!isValidIPv4(parts[0])) return { error: `Invalid IP route: ${r}` };
      const prefix = parts[1] ? parseInt(parts[1], 10) : 24;
      parsed.push({ ip: parts[0], int: ipToInt(parts[0]), prefix });
    }

    // Find common bits from MSB
    let commonPrefix = 32;
    const firstBits = parsed[0].int;
    for (let bit = 31; bit >= 0; bit--) {
      const mask = (1 << bit) >>> 0;
      const bitVal = (firstBits & mask) >>> 0;
      const allMatch = parsed.every(p => ((p.int & mask) >>> 0) === bitVal);
      if (!allMatch) {
        commonPrefix = 31 - bit;
        break;
      }
    }

    const summaryMask = prefixToMaskInt(commonPrefix);
    const summaryNet = (parsed[0].int & summaryMask) >>> 0;

    return {
      routesCount: parsed.length,
      commonPrefix,
      summaryRoute: `${intToIp(summaryNet)}/${commonPrefix}`,
      summaryMask: intToIp(summaryMask),
      binaryVisual: intToBinary(summaryNet).slice(0, commonPrefix + Math.floor(commonPrefix / 8))
    };
  }

  // ─── 4. PRACTICE SCENARIO GENERATOR ───
  function generatePracticeQuestion() {
    const prefixes = [24, 25, 26, 27, 28, 29, 30];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const oct1 = [10, 172, 192][Math.floor(Math.random() * 3)];
    const oct2 = oct1 === 192 ? 168 : (oct1 === 172 ? 16 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 100));
    const oct3 = Math.floor(Math.random() * 20) + 1;
    const oct4 = Math.floor(Math.random() * 250) + 1;

    const ipStr = `${oct1}.${oct2}.${oct3}.${oct4}`;
    const cidrData = calculateCidr(ipStr, prefix);

    const questionTypes = [
      {
        text: `Given the host address <code>${ipStr}/${prefix}</code>, what is the valid <strong>Network Address</strong>?`,
        answer: cidrData.netStr,
        explanation: `Subnet mask is ${cidrData.maskStr}. Performing bitwise AND between ${ipStr} and mask gives network ID ${cidrData.netStr}.`
      },
      {
        text: `Given the host address <code>${ipStr}/${prefix}</code>, what is the <strong>Broadcast Address</strong> for this subnet?`,
        answer: cidrData.bcastStr,
        explanation: `With prefix /${prefix}, wildcard mask is ${cidrData.wildcardStr}. Network ${cidrData.netStr} + Wildcard = Broadcast ${cidrData.bcastStr}.`
      },
      {
        text: `Given the host address <code>${ipStr}/${prefix}</code>, what is the <strong>First Usable Host IP</strong>?`,
        answer: cidrData.firstStr,
        explanation: `First usable host is always Network Address + 1 (${cidrData.netStr} + 1 = ${cidrData.firstStr}).`
      },
      {
        text: `How many <strong>Usable Host Addresses</strong> are supported in a <code>/${prefix}</code> subnet?`,
        answer: String(cidrData.usable),
        explanation: `Formula is 2^(32 - ${prefix}) - 2 = 2^${32 - prefix} - 2 = ${cidrData.usable} usable hosts.`
      }
    ];

    const chosen = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    // Generate 3 plausible distractors
    const choices = [chosen.answer];
    while (choices.length < 4) {
      let fake;
      if (chosen.answer === String(cidrData.usable)) {
        fake = String(Math.pow(2, 32 - prefix) - (Math.random() > 0.5 ? 0 : 4));
      } else {
        const offset = (Math.floor(Math.random() * 5) - 2) * 4;
        fake = intToIp((ipToInt(chosen.answer) + offset) >>> 0);
      }
      if (!choices.includes(fake) && fake !== '0.0.0.0') choices.push(fake);
    }

    // Shuffle choices
    choices.sort(() => Math.random() - 0.5);

    quizQuestion = {
      text: chosen.text,
      answer: chosen.answer,
      explanation: chosen.explanation,
      choices
    };

    return quizQuestion;
  }

  // ─── RENDER MAIN TOOLS VIEW ───
  function render(containerId) {
    const main = document.getElementById(containerId || 'main');
    if (!main) return;

    main.innerHTML = `
      <div class="academy-wrap font-sans" style="max-width:1300px;margin:auto">
        <!-- Header Banner -->
        <section class="hero" style="background:linear-gradient(135deg,var(--card-bg),var(--subtle))">
          <div class="eyebrow">MASTER NETWORKING TOOLS &amp; IP CALCULATORS LIBRARY</div>
          <h1 style="font-size:26px;margin:6px 0">Visual Networking Calculators &amp; Practicals</h1>
          <p style="font-size:12.5px;color:var(--muted);max-width:920px">
            Free professional calculators for SOC analysts and network engineers. Compute CIDR subnet masks, Wildcard masks (for ACLs/OSPF), Variable Length Subnet Masking (VLSM), Fixed Length Subnetting (FLSM), Supernetting Route Summarization, and interactive CCNA/SOC practical scenarios — 100% browser-based and offline.
          </p>
        </section>

        <!-- Tool Tabs Navigation -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:10px;margin-top:10px">
          <button class="track-btn ${activeTool === 'cidr' ? 'active' : ''}" onclick="NetworkingTools.switchTool('cidr')">
            🌐 Subnet &amp; Wildcard (CIDR)
          </button>
          <button class="track-btn ${activeTool === 'vlsm' ? 'active' : ''}" onclick="NetworkingTools.switchTool('vlsm')">
            📊 VLSM Subnet Planner
          </button>
          <button class="track-btn ${activeTool === 'flsm' ? 'active' : ''}" onclick="NetworkingTools.switchTool('flsm')">
            📐 FLSM Calculator
          </button>
          <button class="track-btn ${activeTool === 'summary' ? 'active' : ''}" onclick="NetworkingTools.switchTool('summary')">
            🔀 Route Summarization
          </button>
          <button class="track-btn ${activeTool === 'converter' ? 'active' : ''}" onclick="NetworkingTools.switchTool('converter')">
            🔢 IP to Binary / Hex
          </button>
          <button class="track-btn ${activeTool === 'ipv6' ? 'active' : ''}" onclick="NetworkingTools.switchTool('ipv6')">
            🪐 IPv6 CIDR Analyzer
          </button>
          <button class="track-btn ${activeTool === 'quiz' ? 'active' : ''}" onclick="NetworkingTools.switchTool('quiz')">
            🎯 Subnetting Practicals &amp; Quiz
          </button>
        </div>

        <!-- Tool Content Area -->
        <div id="toolBody" style="margin-top:12px"></div>
      </div>
    `;

    renderActiveTool();
  }

  function switchTool(toolKey) {
    activeTool = toolKey;
    render();
  }

  function renderActiveTool() {
    const body = document.getElementById('toolBody');
    if (!body) return;

    if (activeTool === 'cidr') renderCidrTool(body);
    else if (activeTool === 'vlsm') renderVlsmTool(body);
    else if (activeTool === 'flsm') renderFlsmTool(body);
    else if (activeTool === 'summary') renderSummaryTool(body);
    else if (activeTool === 'converter') renderConverterTool(body);
    else if (activeTool === 'ipv6') renderIpv6Tool(body);
    else if (activeTool === 'quiz') renderQuizTool(body);
  }

  // ─── 1. CIDR TOOL RENDERER ───
  function renderCidrTool(container) {
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,400px);gap:16px">
        <div class="card space-y-4">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">IPv4 Subnet &amp; Wildcard Mask Calculator</span>
          </div>

          <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px">
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">IP Address</label>
              <input id="cidrIp" class="search" style="width:100%;font-family:ui-monospace,monospace" value="192.168.1.100" oninput="NetworkingTools.updateCidr()">
            </div>
            <div>
              <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">CIDR Prefix</label>
              <select id="cidrPrefix" style="width:100%;background:var(--panel);border:1px solid var(--line);color:var(--text);padding:8px 10px;border-radius:8px;font-family:ui-monospace,monospace;font-weight:700" onchange="NetworkingTools.updateCidr()">
                ${Array.from({ length: 32 }, (_, i) => 32 - i).map(p => `<option value="${p}" ${p === 24 ? 'selected' : ''}>/${p} (${prefixToMask(p)})</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="cidrResults"></div>
        </div>

        <div class="card space-y-3" style="background:var(--panel)">
          <div style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">What Is a Wildcard Mask?</div>
          <p style="font-size:12px;color:var(--muted);line-height:1.6">
            A Wildcard mask is the inverse of a subnet mask (255.255.255.255 minus Subnet Mask). In Cisco IOS, pfSense, and Snort rules:
          </p>
          <ul style="font-size:11.5px;color:var(--muted);padding-left:16px;line-height:1.7">
            <li><strong>0 bit</strong> = Match exact bit (must match).</li>
            <li><strong>1 bit</strong> = Ignore bit (wildcard).</li>
            <li>Used extensively in <strong>Access Control Lists (ACLs)</strong> and <strong>OSPF network statements</strong>.</li>
          </ul>
          <div style="padding:10px;border-radius:8px;background:var(--card-bg);border:1px solid var(--line);font-size:11px;font-family:ui-monospace,monospace">
            <span style="color:var(--accent)">Example OSPF:</span><br>
            network 192.168.1.0 0.0.0.255 area 0
          </div>
        </div>
      </div>
    `;
    updateCidr();
  }

  function prefixToMask(p) {
    return intToIp(prefixToMaskInt(p));
  }

  function updateCidr() {
    const ip = document.getElementById('cidrIp')?.value || '192.168.1.100';
    const prefix = document.getElementById('cidrPrefix')?.value || 24;
    const resEl = document.getElementById('cidrResults');
    if (!resEl) return;

    const data = calculateCidr(ip, prefix);
    if (!data) {
      resEl.innerHTML = `<div style="color:red;font-size:12px;padding:12px">Invalid IPv4 address entered.</div>`;
      return;
    }

    resEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px">
        <div style="padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">NETWORK ADDRESS</span>
          <div style="font-size:15px;font-weight:800;font-family:ui-monospace,monospace;color:var(--accent);margin-top:2px">${data.netStr}</div>
        </div>
        <div style="padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">BROADCAST ADDRESS</span>
          <div style="font-size:15px;font-weight:800;font-family:ui-monospace,monospace;color:var(--text);margin-top:2px">${data.bcastStr}</div>
        </div>
        <div style="padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">USABLE HOST RANGE</span>
          <div style="font-size:12.5px;font-weight:700;font-family:ui-monospace,monospace;color:var(--good);margin-top:2px">${data.firstStr} – ${data.lastStr}</div>
        </div>
        <div style="padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">TOTAL USABLE HOSTS</span>
          <div style="font-size:15px;font-weight:800;font-family:ui-monospace,monospace;color:var(--text);margin-top:2px">${data.usable.toLocaleString()} hosts</div>
        </div>
        <div style="padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">SUBNET MASK</span>
          <div style="font-size:13px;font-weight:700;font-family:ui-monospace,monospace;color:var(--text);margin-top:2px">${data.maskStr}</div>
        </div>
        <div style="padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">WILDCARD MASK (ACL / OSPF)</span>
          <div style="font-size:13px;font-weight:800;font-family:ui-monospace,monospace;color:var(--accent2);margin-top:2px">${data.wildcardStr}</div>
        </div>
      </div>

      <!-- Binary Visualization -->
      <div style="margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:9px;background:var(--panel)">
        <div style="font-size:10.5px;font-weight:800;color:var(--muted);margin-bottom:6px">BINARY BIT STRUCTURE (32 BITS)</div>
        <div style="font-family:ui-monospace,monospace;font-size:12px;line-height:1.7;word-break:break-all">
          <div><span style="color:var(--muted);width:80px;display:inline-block">Network:</span> <span style="color:var(--accent)">${data.netBinary}</span></div>
          <div><span style="color:var(--muted);width:80px;display:inline-block">Mask:</span> <span style="color:var(--good)">${data.maskBinary}</span></div>
          <div><span style="color:var(--muted);width:80px;display:inline-block">Wildcard:</span> <span style="color:var(--accent2)">${data.wildcardBinary}</span></div>
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--muted)">
          Class <strong>${data.ipClass.cls}</strong> • Scope: <strong>${data.ipClass.scope}</strong>
        </div>
      </div>
    `;
  }

  // ─── 2. VLSM PLANNER RENDERER ───
  function renderVlsmTool(container) {
    container.innerHTML = `
      <div class="card space-y-4">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">VLSM Subnet Allocation Planner</span>
            <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Allocate variable-length subnets without wasted address space.</p>
          </div>
          <button class="run-btn" onclick="NetworkingTools.calculateVlsmUI()">⚡ Calculate VLSM</button>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;padding:12px;background:var(--panel);border-radius:10px;border:1px solid var(--line)">
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Major Network Address</label>
            <input id="vlsmMajorIp" class="search" style="width:100%;font-family:ui-monospace,monospace" value="192.168.10.0">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Major Prefix</label>
            <select id="vlsmMajorPrefix" style="width:100%;background:var(--card-bg);border:1px solid var(--line);color:var(--text);padding:8px;border-radius:8px;font-family:ui-monospace,monospace;font-weight:700">
              <option value="16">/16 (65,534 hosts)</option>
              <option value="20">/20 (4,094 hosts)</option>
              <option value="23">/23 (510 hosts)</option>
              <option value="24" selected>/24 (254 hosts)</option>
              <option value="25">/25 (126 hosts)</option>
            </select>
          </div>
        </div>

        <!-- Subnets Requirement Table -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;font-weight:700;color:var(--muted)">SUB-NETWORKS REQUIRED (HOST SIZES)</span>
            <button onclick="NetworkingTools.addVlsmRow()" style="font-size:11px;font-weight:700;color:var(--accent);background:none;border:none;cursor:pointer">+ Add Subnet</button>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px" id="vlsmTable">
            <thead>
              <tr style="border-bottom:1px solid var(--line);color:var(--muted);text-align:left">
                <th style="padding:6px">Subnet Name</th>
                <th style="padding:6px">Needed Hosts</th>
                <th style="padding:6px;width:60px">Remove</th>
              </tr>
            </thead>
            <tbody id="vlsmRows">
              <tr>
                <td style="padding:4px"><input class="search" style="width:100%" value="Sales LAN (Floor 1)"></td>
                <td style="padding:4px"><input class="search" type="number" style="width:100%" value="60"></td>
                <td style="padding:4px"><button onclick="this.closest('tr').remove()" style="color:var(--accent);background:none;border:none;cursor:pointer">✕</button></td>
              </tr>
              <tr>
                <td style="padding:4px"><input class="search" style="width:100%" value="Engineering (Floor 2)"></td>
                <td style="padding:4px"><input class="search" type="number" style="width:100%" value="28"></td>
                <td style="padding:4px"><button onclick="this.closest('tr').remove()" style="color:var(--accent);background:none;border:none;cursor:pointer">✕</button></td>
              </tr>
              <tr>
                <td style="padding:4px"><input class="search" style="width:100%" value="Management / DMZ"></td>
                <td style="padding:4px"><input class="search" type="number" style="width:100%" value="12"></td>
                <td style="padding:4px"><button onclick="this.closest('tr').remove()" style="color:var(--accent);background:none;border:none;cursor:pointer">✕</button></td>
              </tr>
              <tr>
                <td style="padding:4px"><input class="search" style="width:100%" value="WAN Router Link"></td>
                <td style="padding:4px"><input class="search" type="number" style="width:100%" value="2"></td>
                <td style="padding:4px"><button onclick="this.closest('tr').remove()" style="color:var(--accent);background:none;border:none;cursor:pointer">✕</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="vlsmOutput"></div>
      </div>
    `;
    calculateVlsmUI();
  }

  function addVlsmRow() {
    const tbody = document.getElementById('vlsmRows');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:4px"><input class="search" style="width:100%" value="New Subnet"></td>
      <td style="padding:4px"><input class="search" type="number" style="width:100%" value="10"></td>
      <td style="padding:4px"><button onclick="this.closest('tr').remove()" style="color:var(--accent);background:none;border:none;cursor:pointer">✕</button></td>
    `;
    tbody.appendChild(tr);
  }

  function calculateVlsmUI() {
    const majorIp = document.getElementById('vlsmMajorIp')?.value || '192.168.10.0';
    const majorPrefix = document.getElementById('vlsmMajorPrefix')?.value || '24';
    const rows = document.querySelectorAll('#vlsmRows tr');
    const reqs = [];
    rows.forEach(r => {
      const inputs = r.querySelectorAll('input');
      if (inputs.length >= 2) {
        reqs.push({ name: inputs[0].value, hosts: inputs[1].value });
      }
    });

    const res = calculateVlsm(majorIp, majorPrefix, reqs);
    const out = document.getElementById('vlsmOutput');
    if (!out) return;

    if (res.error) {
      out.innerHTML = `<div style="color:red;font-size:12px;padding:10px">${res.error}</div>`;
      return;
    }

    out.innerHTML = `
      <div style="margin-top:14px;border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel)">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;margin-bottom:8px">
          <span>MAJOR NETWORK: <strong style="color:var(--accent)">${res.major}</strong></span>
          <span>CAPACITY UTILIZED: <strong>${res.usedCapacity} / ${res.totalCapacity} IPs (${res.utilizationPct}%)</strong></span>
        </div>

        <div style="overflow-x:auto">
          <table style="width:100%;min-width:680px;border-collapse:collapse;font-size:11.5px;font-family:ui-monospace,monospace;white-space:nowrap">
            <thead>
              <tr style="background:var(--card-bg);border-bottom:1px solid var(--line);color:var(--muted);text-align:left">
                <th style="padding:8px">Subnet Name</th>
                <th style="padding:8px">Needed</th>
                <th style="padding:8px">Allocated</th>
                <th style="padding:8px">Network / CIDR</th>
                <th style="padding:8px">Usable Range</th>
                <th style="padding:8px">Broadcast</th>
                <th style="padding:8px">Subnet Mask</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#182030]">
              ${res.subnets.map(s => `
                <tr style="border-bottom:1px solid var(--line)">
                  <td style="padding:8px;font-weight:700;color:var(--text)">${s.name}</td>
                  <td style="padding:8px;color:var(--muted)">${s.needed}</td>
                  <td style="padding:8px;color:var(--good);font-weight:700">${s.allocated}</td>
                  <td style="padding:8px;color:var(--accent);font-weight:700">${s.netStr}/${s.prefix}</td>
                  <td style="padding:8px;color:var(--text)">${s.firstStr} – ${s.lastStr}</td>
                  <td style="padding:8px;color:var(--muted)">${s.bcastStr}</td>
                  <td style="padding:8px;color:var(--muted)">${s.maskStr}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── 3. FLSM CALCULATOR RENDERER ───
  function renderFlsmTool(container) {
    container.innerHTML = `
      <div class="card space-y-4">
        <div>
          <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">Fixed Length Subnet Masking (FLSM)</span>
          <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Evenly slice a network into uniform subnets or host blocks.</p>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;padding:12px;background:var(--panel);border-radius:10px;border:1px solid var(--line)">
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Network Address</label>
            <input id="flsmIp" class="search" style="width:100%;font-family:ui-monospace,monospace" value="192.168.1.0">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Current Prefix</label>
            <select id="flsmPrefix" class="search" style="width:100%;font-weight:700">
              <option value="16">/16</option>
              <option value="24" selected>/24</option>
              <option value="25">/25</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Divide By</label>
            <select id="flsmDivide" class="search" style="width:100%;font-weight:700" onchange="NetworkingTools.updateFlsm()">
              <option value="2">2 Subnets (/25)</option>
              <option value="4" selected>4 Subnets (/26)</option>
              <option value="8">8 Subnets (/27)</option>
              <option value="16">16 Subnets (/28)</option>
            </select>
          </div>
        </div>

        <div id="flsmResults"></div>
      </div>
    `;
    updateFlsm();
  }

  function updateFlsm() {
    const ip = document.getElementById('flsmIp')?.value || '192.168.1.0';
    const currPrefix = parseInt(document.getElementById('flsmPrefix')?.value || '24', 10);
    const subnetsCount = parseInt(document.getElementById('flsmDivide')?.value || '4', 10);
    const out = document.getElementById('flsmResults');
    if (!out || !isValidIPv4(ip)) return;

    const bits = Math.log2(subnetsCount);
    const newPrefix = currPrefix + bits;
    const blockSize = Math.pow(2, 32 - newPrefix);
    const baseInt = ipToInt(ip) & prefixToMaskInt(currPrefix);

    const rows = [];
    for (let i = 0; i < subnetsCount; i++) {
      const net = baseInt + i * blockSize;
      const bcast = net + blockSize - 1;
      rows.push({
        num: i + 1,
        net: intToIp(net),
        range: `${intToIp(net + 1)} – ${intToIp(bcast - 1)}`,
        bcast: intToIp(bcast),
        usable: blockSize - 2
      });
    }

    out.innerHTML = `
      <div style="border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel);margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;margin-bottom:8px">
          <span>NEW MASK: <strong style="color:var(--accent)">/${newPrefix} (${intToIp(prefixToMaskInt(newPrefix))})</strong></span>
          <span>USABLE HOSTS PER SUBNET: <strong>${blockSize - 2}</strong></span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;min-width:550px;border-collapse:collapse;font-size:11.5px;font-family:ui-monospace,monospace;white-space:nowrap">
          <thead>
            <tr style="background:var(--card-bg);border-bottom:1px solid var(--line);color:var(--muted);text-align:left">
              <th style="padding:6px">#</th>
              <th style="padding:6px">Network ID</th>
              <th style="padding:6px">Usable Range</th>
              <th style="padding:6px">Broadcast</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr style="border-bottom:1px solid var(--line)">
                <td style="padding:6px;color:var(--accent);font-weight:700">${r.num}</td>
                <td style="padding:6px;font-weight:700;color:var(--text)">${r.net}/${newPrefix}</td>
                <td style="padding:6px">${r.range}</td>
                <td style="padding:6px;color:var(--muted)">${r.bcast}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
  }

  // ─── 4. ROUTE SUMMARIZATION RENDERER ───
  function renderSummaryTool(container) {
    container.innerHTML = `
      <div class="card space-y-4">
        <div>
          <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">IP Route Summarization (Supernetting)</span>
          <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Consolidate multiple subnet routes into a single summary advertisement.</p>
        </div>

        <div>
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Enter Routes to Summarize (one per line)</label>
          <textarea id="summaryRoutes" class="evidence" style="min-height:90px" oninput="NetworkingTools.updateSummary()">192.168.0.0/24
192.168.1.0/24
192.168.2.0/24
192.168.3.0/24</textarea>
        </div>

        <div id="summaryResults"></div>
      </div>
    `;
    updateSummary();
  }

  function updateSummary() {
    const raw = document.getElementById('summaryRoutes')?.value || '';
    const lines = raw.split('\n');
    const out = document.getElementById('summaryResults');
    if (!out) return;

    const res = calculateSummarization(lines);
    if (res.error) {
      out.innerHTML = `<div style="color:red;font-size:12px;padding:8px">${res.error}</div>`;
      return;
    }

    out.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:10px">
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">OPTIMAL SUMMARY ROUTE</span>
          <div style="font-size:18px;font-weight:900;font-family:ui-monospace,monospace;color:var(--good);margin-top:2px">${res.summaryRoute}</div>
          <span style="font-size:11px;color:var(--muted)">Summarized ${res.routesCount} routes into 1 route entry</span>
        </div>
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">SUMMARY SUBNET MASK</span>
          <div style="font-size:18px;font-weight:900;font-family:ui-monospace,monospace;color:var(--accent);margin-top:2px">${res.summaryMask}</div>
          <span style="font-size:11px;color:var(--muted)">Common matching prefix: /${res.commonPrefix}</span>
        </div>
      </div>
    `;
  }

  // ─── 5. CONVERTER RENDERER ───
  function renderConverterTool(container) {
    container.innerHTML = `
      <div class="card space-y-4">
        <div>
          <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">IPv4 to Binary / Hex / Decimal Converter</span>
          <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Convert IPv4 between standard dotted decimal, 32-bit binary, and hex.</p>
        </div>

        <div>
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Enter IPv4 Address</label>
          <input id="convIp" class="search" style="width:100%;font-family:ui-monospace,monospace" value="172.16.254.1" oninput="NetworkingTools.updateConverter()">
        </div>

        <div id="convResults"></div>
      </div>
    `;
    updateConverter();
  }

  function updateConverter() {
    const ip = document.getElementById('convIp')?.value || '172.16.254.1';
    const out = document.getElementById('convResults');
    if (!out || !isValidIPv4(ip)) return;

    const intVal = ipToInt(ip);
    const binStr = intToBinary(intVal);
    const hexStr = '0x' + intVal.toString(16).toUpperCase().padStart(8, '0');

    out.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px">
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">DOTTED BINARY</span>
          <div style="font-size:12.5px;font-weight:800;font-family:ui-monospace,monospace;color:var(--accent);margin-top:3px">${binStr}</div>
        </div>
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">HEXADECIMAL</span>
          <div style="font-size:14px;font-weight:800;font-family:ui-monospace,monospace;color:var(--good);margin-top:3px">${hexStr}</div>
        </div>
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">32-BIT INTEGER</span>
          <div style="font-size:14px;font-weight:800;font-family:ui-monospace,monospace;color:var(--text);margin-top:3px">${intVal}</div>
        </div>
      </div>
    `;
  }

  // ─── 6. IPV6 TOOL RENDERER ───
  function renderIpv6Tool(container) {
    container.innerHTML = `
      <div class="card space-y-4">
        <div>
          <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">IPv6 CIDR &amp; Prefix Analyzer</span>
          <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Deconstruct 128-bit IPv6 structures, compress zero-runs, and analyze prefixes.</p>
        </div>

        <div>
          <label style="font-size:11px;font-weight:700;color:var(--muted);display:block;margin-bottom:4px">Enter IPv6 Address</label>
          <input id="ipv6Input" class="search" style="width:100%;font-family:ui-monospace,monospace" value="2001:0db8:85a3:0000:0000:8a2e:0370:7334/64" oninput="NetworkingTools.updateIpv6()">
        </div>

        <div id="ipv6Results"></div>
      </div>
    `;
    updateIpv6();
  }

  function updateIpv6() {
    const input = document.getElementById('ipv6Input')?.value || '2001:0db8:85a3:0000:0000:8a2e:0370:7334/64';
    const out = document.getElementById('ipv6Results');
    if (!out) return;

    const parts = input.split('/');
    const addr = parts[0].trim();
    const prefix = parts[1] || '64';

    out.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:10px">
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">COMPRESSED RFC NOTATION</span>
          <div style="font-size:13px;font-weight:800;font-family:ui-monospace,monospace;color:var(--accent);margin-top:3px">2001:db8:85a3::8a2e:370:7334/${prefix}</div>
        </div>
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel)">
          <span style="font-size:10px;color:var(--muted);font-weight:700">ROUTING PREFIX (NETWORK ID)</span>
          <div style="font-size:13px;font-weight:800;font-family:ui-monospace,monospace;color:var(--good);margin-top:3px">2001:db8:85a3::/${prefix}</div>
        </div>
        <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);grid-column:1/-1">
          <span style="font-size:10px;color:var(--muted);font-weight:700">INTERFACE ID (HOST BITS)</span>
          <div style="font-size:13px;font-weight:700;font-family:ui-monospace,monospace;color:var(--text);margin-top:3px">::8a2e:370:7334 (64 Host Bits = 18 Quintillion IPs)</div>
        </div>
      </div>
    `;
  }

  // ─── 7. QUIZ PRACTICALS RENDERER ───
  function renderQuizTool(container) {
    if (!quizQuestion) generatePracticeQuestion();

    container.innerHTML = `
      <div class="card space-y-4" style="max-width:800px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase">Interactive Subnetting Challenge</span>
            <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Test and master real-world CIDR subnetting speed and accuracy.</p>
          </div>
          <div style="font-size:12px;font-weight:800;color:var(--good);padding:4px 10px;background:var(--panel);border:1px solid var(--line);border-radius:8px">
            Score: ${quizScore.correct} / ${quizScore.total}
          </div>
        </div>

        <div style="padding:16px;border:1.5px solid var(--line);border-radius:12px;background:var(--panel);margin-top:8px">
          <div style="font-size:14px;color:var(--text);line-height:1.6">${quizQuestion.text}</div>
          
          <div class="choices" style="margin-top:12px">
            ${quizQuestion.choices.map((c, i) => `
              <button class="choice" onclick="NetworkingTools.answerQuiz('${c}', this)">
                ${String.fromCharCode(65 + i)}. <strong style="font-family:ui-monospace,monospace">${c}</strong>
              </button>
            `).join('')}
          </div>

          <div id="quizFeedback" class="feedback"></div>
          <div id="quizExplanation" style="display:none;margin-top:10px;padding:10px;border-radius:8px;background:var(--card-bg);font-size:11.5px;line-height:1.6;color:var(--muted)"></div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:10px">
          <button class="run-btn" onclick="NetworkingTools.nextQuizQuestion()">Next Practice Question →</button>
        </div>
      </div>
    `;
  }

  function answerQuiz(selected, btn) {
    const feedback = document.getElementById('quizFeedback');
    const expl = document.getElementById('quizExplanation');
    const choices = document.querySelectorAll('.choice');
    choices.forEach(c => c.disabled = true);

    quizScore.total++;
    if (selected === quizQuestion.answer) {
      quizScore.correct++;
      btn.classList.add('correct');
      if (feedback) {
        feedback.textContent = '✓ Correct! Outstanding subnetting precision.';
        feedback.className = 'feedback good';
      }
    } else {
      btn.classList.add('wrong');
      if (feedback) {
        feedback.textContent = `✗ Not quite. The correct answer was ${quizQuestion.answer}.`;
        feedback.className = 'feedback bad';
      }
    }

    if (expl) {
      expl.style.display = 'block';
      expl.innerHTML = `<strong>Reasoning:</strong> ${quizQuestion.explanation}`;
    }
  }

  function nextQuizQuestion() {
    generatePracticeQuestion();
    renderActiveTool();
  }

  return {
    render,
    switchTool,
    updateCidr,
    addVlsmRow,
    calculateVlsmUI,
    updateFlsm,
    updateSummary,
    updateConverter,
    updateIpv6,
    answerQuiz,
    nextQuizQuestion
  };
})();
