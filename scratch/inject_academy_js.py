import re

with open("public/soc-interactive-labs.html", "r", encoding="utf-8") as f:
    html = f.read()

academy_js_code = """
// ══════════════════════════════════════════════════════════════════════════════
// ─── SHADOWX SOC L1 ACADEMY & TRACK ROUTER (SXL CYBERCAREER ARCHITECTURE) ───
// ══════════════════════════════════════════════════════════════════════════════

let currentTrack = localStorage.getItem('shadowx_track') || 'academy';
let academyCourseIdx = parseInt(localStorage.getItem('shadowx_academy_c') || '0', 10);
let academyStageIdx = parseInt(localStorage.getItem('shadowx_academy_s') || '0', 10);
let academySelectedChoice = null;
let academyDone = JSON.parse(localStorage.getItem('shadowx_academy_done') || '{}');

function switchTrack(track) {
  currentTrack = track;
  localStorage.setItem('shadowx_track', track);
  
  document.getElementById('trackAcademyBtn')?.classList.toggle('active', track === 'academy');
  document.getElementById('trackLabsBtn')?.classList.toggle('active', track === 'labs');
  document.getElementById('trackPrereqBtn')?.classList.toggle('active', track === 'prereq');

  const sidebar = document.querySelector('.sidebar');
  const searchInput = document.getElementById('search');

  if (track === 'prereq') {
    if (sidebar) sidebar.style.display = 'none';
    renderPrerequisitesView();
  } else if (track === 'academy') {
    if (sidebar) sidebar.style.display = 'block';
    if (searchInput) searchInput.placeholder = 'Filter 25 SOC academy classes...';
    renderAcademySidebar();
    renderAcademyClass(academyCourseIdx, academyStageIdx);
  } else {
    if (sidebar) sidebar.style.display = 'block';
    if (searchInput) searchInput.placeholder = 'Filter 45 labs or tools...';
    renderList();
    if (current) openLab(current); else catalog();
  }
}

function renderAcademySidebar() {
  const list = document.getElementById('lablist');
  if (!list || !window.ACADEMY_COURSES) return;
  
  const query = (document.getElementById('search')?.value || '').toLowerCase();
  const courses = window.ACADEMY_COURSES;
  
  const completedCount = Object.keys(academyDone).filter(k => (academyDone[k] || []).length >= 6).length;
  const pct = Math.round((completedCount / courses.length) * 100);
  const bar = document.getElementById('bar');
  const txt = document.getElementById('progressText');
  const ptxt = document.getElementById('pct');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = `${completedCount} / ${courses.length} classes done`;
  if (ptxt) ptxt.textContent = pct + '%';

  list.innerHTML = courses
    .map((c, idx) => {
      const match = c.title.toLowerCase().includes(query) || c.id.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
      if (!match) return '';
      const stagesDone = (academyDone[c.id] || []).length;
      const isDone = stagesDone >= 6;
      const isActive = idx === academyCourseIdx;
      return `
        <div class="labitem ${isActive ? 'active' : ''}" onclick="selectAcademyCourse(${idx})">
          <div class="labitem-top">
            <span class="labid">${c.id}</span>
            <span class="labcat">60-MIN CLASS</span>
          </div>
          <div class="labtitle">${esc(c.title)} ${isDone ? '✓' : ''}</div>
          <div class="labsub" style="font-size:10.5px;color:var(--muted)">${c.stages.length} Stages • ${c.service}</div>
        </div>
      `;
    })
    .join('');
}

function selectAcademyCourse(idx) {
  academyCourseIdx = idx;
  academyStageIdx = 0;
  localStorage.setItem('shadowx_academy_c', idx);
  localStorage.setItem('shadowx_academy_s', 0);
  renderAcademySidebar();
  renderAcademyClass(idx, 0);
}

function selectAcademyStage(i) {
  academyStageIdx = i;
  localStorage.setItem('shadowx_academy_s', i);
  renderAcademyClass(academyCourseIdx, i);
}

function renderAcademyClass(cIdx, sIdx) {
  if (!window.ACADEMY_COURSES || !window.ACADEMY_COURSES[cIdx]) return;
  const course = window.ACADEMY_COURSES[cIdx];
  const stage = course.stages[sIdx] || course.stages[0];
  const main = document.getElementById('main');
  if (!main) return;

  academySelectedChoice = null;
  const doneStages = academyDone[course.id] || [];
  const isClassDone = doneStages.length >= course.stages.length;

  main.innerHTML = `
    <div class="academy-wrap">
      <!-- ── Class Header with Objectives ── -->
      <section class="classhead">
        <div class="eyebrow">${course.id} · 60-MINUTE SOC CLASS</div>
        <h2>${esc(course.title)}</h2>
        <p>${esc(course.description)}</p>
        <div class="objectives">
          ${course.objectives.map((obj, i) => `
            <div class="obj">
              <b>OUTCOME ${i + 1}</b>
              ${esc(obj)}
            </div>
          `).join('')}
        </div>
      </section>

      <!-- ── 6-Stage Investigation Timeline ── -->
      <div class="timeline">
        ${course.stages.map((st, i) => {
          const isActive = i === sIdx;
          const isDone = doneStages.includes(i);
          return `
            <button class="stagebtn ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" onclick="selectAcademyStage(${i})">
              ${String(i * 10).padStart(2, '0')}–${String((i + 1) * 10).padStart(2, '0')} MIN<br>
              <strong>${esc(st.name)}</strong>
            </button>
          `;
        }).join('')}
      </div>

      <!-- ── 2-Column Investigation View ── -->
      <div class="academy-main">
        <!-- Left: Stage Card & 5W1H Engine -->
        <section class="card">
          <div class="meta">
            <span>${String(sIdx * 10).padStart(2, '0')}–${String((sIdx + 1) * 10).padStart(2, '0')} MIN</span>
            <span>STAGE ${(sIdx + 1)} / ${course.stages.length} · ${esc(stage.name.toUpperCase())}</span>
          </div>
          <h3>${esc(stage.name)}</h3>
          <p class="explain">${esc(stage.explain)}</p>

          <div class="worked">
            <b style="color:var(--accent);display:block;margin-bottom:4px">WORKED CASE EVIDENCE</b>
            <div>${esc(stage.worked)}</div>
          </div>

          <!-- 5W1H Grid -->
          <div class="teach">
            <div><b>WHAT?</b><span>${esc(stage.what)}</span></div>
            <div><b>WHY?</b><span>${esc(stage.why)}</span></div>
            <div><b>WHEN?</b><span>${esc(stage.when)}</span></div>
            <div><b>WHERE?</b><span>${esc(stage.where)}</span></div>
            <div><b>WHO?</b><span>${esc(stage.who)}</span></div>
            <div><b>HOW?</b><span>${esc(stage.how)}</span></div>
          </div>

          <!-- Beginner Traps & Mental Model -->
          <div class="box mistake">
            <b>BEGINNER MISTAKE</b>
            <span>${esc(stage.mistake)}</span>
          </div>
          <div class="box think">
            <b>WHAT L1 SHOULD THINK</b>
            <span>${esc(stage.think)}</span>
          </div>

          <!-- Knowledge Check Question -->
          <div class="question">
            <h4>${esc(stage.question)}</h4>
            <div class="choices">
              ${stage.choices.map((choice, i) => `
                <button class="choice" onclick="selectAcademyChoice(${i})">
                  ${String.fromCharCode(65 + i)}. ${esc(choice)}
                </button>
              `).join('')}
            </div>
            <div class="feedback" id="academyFeedback"></div>
          </div>

          <!-- Hands-on Evidence Command Runner -->
          <div class="command-box">
            <b style="color:var(--accent);font-size:10px;letter-spacing:.1em;text-transform:uppercase">Hands-On Investigation Evidence</b>
            <code class="cmd">$ ${esc(stage.command)}</code>
            <button class="run-btn" onclick="runAcademyCommand('${esc(stage.command)}', '${esc(course.source)}', '${esc(course.destination)}', '${esc(course.service)}')">
              ▶ Run in training simulator
            </button>
            <div class="term-box" id="academyTerm">Terminal ready. Click 'Run' to observe live packet/socket telemetry.</div>
          </div>

          <!-- Bottom Navigation -->
          <div class="bottom-actions">
            <button onclick="prevAcademyStage()" ${sIdx === 0 ? 'disabled' : ''}>← Previous stage</button>
            <button class="continue-btn" onclick="checkAcademyAnswer()">${sIdx === course.stages.length - 1 ? 'Submit class decision' : 'Check answer & continue →'}</button>
          </div>

          <!-- Class Finished Banner -->
          <div class="finish-box" id="academyFinish" style="display:${isClassDone ? 'block' : 'none'}">
            <h3>✓ Class Completed!</h3>
            <p style="font-size:12px;margin:0">All six stages completed with verified evidence. Carry these findings forward into the next investigation.</p>
          </div>
        </section>

        <!-- Right: Active Case & Dynamic Animated SVG Map -->
        <aside class="side-case">
          <section class="card case-data">
            <div style="color:var(--accent);font-size:10px;font-weight:950;letter-spacing:.14em">ACTIVE CASE CONTEXT</div>
            <div><span>CLASS</span><b>${course.id}</b></div>
            <div><span>SOURCE</span><b>${course.source}</b></div>
            <div><span>DESTINATION</span><b>${course.destination}</b></div>
            <div><span>SERVICE</span><b>${course.service}</b></div>
            <div><span>STAGE</span><b>${(sIdx + 1)} / ${course.stages.length}</b></div>
          </section>

          <section class="card">
            <div style="color:var(--accent);font-size:10px;font-weight:950;letter-spacing:.14em">INVESTIGATION MAP</div>
            <div class="svg-wrap">
              ${renderAcademySvg(course, sIdx)}
            </div>
            <p style="color:var(--muted);font-size:11px;line-height:1.55;margin-top:10px">${esc(stage.explain)}</p>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function renderAcademySvg(course, sIdx) {
  const labels = [course.source, "FIREWALL / ROUTE", course.destination];
  return `
    <svg viewBox="0 0 620 210">
      <rect x="10" y="10" width="600" height="190" rx="14" class="n"/>
      <text x="28" y="35" style="font-size:11px;font-weight:900;fill:var(--accent)">
        ${course.id} · STAGE ${(sIdx + 1)}: ${esc(course.stages[sIdx].name.toUpperCase())}
      </text>
      
      <!-- Source Node -->
      <rect x="28" y="72" width="160" height="65" rx="11" class="hot"/>
      <text x="108" y="101" text-anchor="middle" style="font-size:11px;font-weight:900">${esc(labels[0])}</text>
      <text x="108" y="119" text-anchor="middle" style="font-size:9px;fill:var(--muted)">SOURCE INTERFACE</text>
      <path d="M188 104 H230" class="arrow"/>

      <!-- Control Point (Firewall / Router) -->
      <rect x="230" y="72" width="160" height="65" rx="11" class="${sIdx >= 2 ? 'hot' : 'n'}"/>
      <text x="310" y="101" text-anchor="middle" style="font-size:11px;font-weight:900">${labels[1]}</text>
      <text x="310" y="119" text-anchor="middle" style="font-size:9px;fill:var(--muted)">CONTROL POINT</text>
      <path d="M390 104 H432" class="arrow"/>

      <!-- Destination Node -->
      <rect x="432" y="72" width="160" height="65" rx="11" class="${sIdx >= 4 ? 'hot' : 'n'}"/>
      <text x="512" y="101" text-anchor="middle" style="font-size:11px;font-weight:900">${esc(labels[2])}</text>
      <text x="512" y="119" text-anchor="middle" style="font-size:9px;fill:var(--muted)">TARGET / SERVICE</text>

      <text x="28" y="174" style="font-size:9.5px;fill:var(--muted)">
        Evidence flow: Stage ${(sIdx + 1)} (${esc(course.stages[sIdx].name)}) — telemetry highlights active control point.
      </text>
    </svg>
  `;
}

function selectAcademyChoice(idx) {
  academySelectedChoice = idx;
  document.querySelectorAll('.choice').forEach((btn, i) => {
    btn.classList.toggle('selected', i === idx);
  });
}

function checkAcademyAnswer() {
  const course = window.ACADEMY_COURSES[academyCourseIdx];
  const stage = course.stages[academyStageIdx];
  const feedback = document.getElementById('academyFeedback');
  const choices = document.querySelectorAll('.choice');

  if (academySelectedChoice === null) {
    if (feedback) {
      feedback.textContent = 'Please select an answer before continuing.';
      feedback.className = 'feedback bad';
    }
    return;
  }

  if (academySelectedChoice !== stage.answer) {
    if (choices[academySelectedChoice]) choices[academySelectedChoice].classList.add('wrong');
    if (feedback) {
      feedback.textContent = 'Not quite. Re-read the worked case evidence and 5W1H cards, then try again.';
      feedback.className = 'feedback bad';
    }
    return;
  }

  if (choices[academySelectedChoice]) choices[academySelectedChoice].classList.add('correct');
  if (feedback) {
    feedback.textContent = '✓ Correct! Evidence-led reasoning verified.';
    feedback.className = 'feedback good';
  }

  if (!academyDone[course.id]) academyDone[course.id] = [];
  if (!academyDone[course.id].includes(academyStageIdx)) {
    academyDone[course.id].push(academyStageIdx);
    localStorage.setItem('shadowx_academy_done', JSON.stringify(academyDone));
  }

  if (academyStageIdx < course.stages.length - 1) {
    setTimeout(() => {
      academyStageIdx++;
      localStorage.setItem('shadowx_academy_s', academyStageIdx);
      renderAcademyClass(academyCourseIdx, academyStageIdx);
      renderAcademySidebar();
    }, 500);
  } else {
    document.getElementById('academyFinish').style.display = 'block';
    renderAcademySidebar();
  }
}

function prevAcademyStage() {
  if (academyStageIdx > 0) {
    academyStageIdx--;
    localStorage.setItem('shadowx_academy_s', academyStageIdx);
    renderAcademyClass(academyCourseIdx, academyStageIdx);
  }
}

function runAcademyCommand(cmd, src, dst, srv) {
  const term = document.getElementById('academyTerm');
  if (!term) return;
  term.textContent = `$ ${cmd}\\n[shadowxlab kernel simulator v8]\\n${src} -> ${dst} ${srv}\\naction=OBSERVED  timestamp=${new Date().toISOString().slice(11, 19)}  state=ESTABLISHED\\nflags=[SYN,ACK] ttl=64 window=65535\\npacket_verdict: INSPECTED & RECORDED`;
}

function renderPrerequisitesView() {
  const main = document.getElementById('main');
  if (!main) return;
  main.innerHTML = `
    <div class="academy-wrap">
      <section class="prereq">
        <div class="prereq-head">
          <div class="eyebrow">START HERE · HARDWARE · SOFTWARE · APPS · TOOLS</div>
          <h2>Prerequisites &amp; Lab Stack Requirements</h2>
          <p>Know exactly what you need before starting the 25-class SOC L1 path. The browser course runs seamlessly offline. A full multi-VM range setup is provided below for hands-on practice.</p>
        </div>

        <div class="prereq-grid">
          <article class="pre-card">
            <h3>01 · Student Computer</h3>
            <ul>
              <li><strong>Minimum:</strong> Dual-core CPU, 4 GB RAM, 10 GB free disk.</li>
              <li><strong>Recommended:</strong> 4+ CPU cores, 8–16 GB RAM, SSD.</li>
              <li><strong>Network:</strong> Localhost offline runner or isolated lab VLAN.</li>
              <li><strong>Display:</strong> 1366×768 min; 1920×1080 recommended.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>02 · Browser Software</h3>
            <ul>
              <li>Current <strong>Chrome, Edge, Firefox, or Brave</strong>.</li>
              <li>JavaScript enabled; local storage permitted for progress.</li>
              <li>Zero cloud dependencies; 100% localhost offline capability.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>03 · Core Security Tools</h3>
            <ul>
              <li><strong>Wireshark</strong> — Inspect packets and TCP/UDP streams.</li>
              <li><strong>Nmap</strong> — Port, service, and OS discovery.</li>
              <li><strong>tcpdump</strong> — Command-line packet capture.</li>
              <li><strong>curl / wget</strong> — Generate HTTP/HTTPS traffic.</li>
              <li><strong>dig / nslookup</strong> — DNS resolution triage.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>04 · Network / Firewall Software</h3>
            <ul>
              <li><strong>pfSense CE</strong> — Stateful firewall, NAT, routing, and logs.</li>
              <li>Dual-interface topology: LAN (10.10.20.0/24) and WAN (203.0.113.0/24).</li>
              <li>Integrated zero-error terminal simulators for all commands.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>05 · Security Linux Distributions</h3>
            <ul>
              <li><strong>Kali Linux</strong> — Analyst workstation & controlled red attacks.</li>
              <li><strong>Parrot Security OS</strong> — Alternative analysis distro.</li>
              <li><strong>Debian / Ubuntu / Rocky Linux</strong> — Server log evidence.</li>
              <li><strong>Security Onion</strong> — Network security monitoring.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>06 · Windows &amp; Endpoint Tools</h3>
            <ul>
              <li><strong>Windows 10/11 / Server</strong> — Event Viewer (Security.evtx).</li>
              <li><strong>PowerShell Remoting</strong> — Process lineage investigation.</li>
              <li><strong>Sysinternals &amp; Sysmon</strong> — Process and socket telemetry.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>07 · Network &amp; Packet Analysis</h3>
            <ul>
              <li><strong>Wireshark &amp; tshark</strong> — Deep packet inspection.</li>
              <li><strong>tcpdump &amp; Ncat</strong> — Live socket probing.</li>
              <li><strong>arp, ip, ss, lsof</strong> — Endpoint network state.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>08 · Web &amp; Application Security</h3>
            <ul>
              <li><strong>OWASP ZAP &amp; Burp Suite</strong> — HTTP/HTTPS request inspection.</li>
              <li><strong>Gobuster &amp; Nikto</strong> — Directory & vulnerability assessment.</li>
              <li><strong>SQLmap</strong> — Controlled SQL injection evidence.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>09 · Password &amp; Credential Labs</h3>
            <ul>
              <li><strong>John the Ripper &amp; Hashcat</strong> — Hash verification.</li>
              <li><strong>Hydra</strong> — Authentication testing patterns.</li>
              <li><strong>OpenSSH</strong> — Failed and accepted login logs.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>10 · Attack Simulation &amp; C2</h3>
            <ul>
              <li><strong>Metasploit Framework</strong> — Controlled exploitation labs.</li>
              <li><strong>Atomic Red Team &amp; Caldera</strong> — Detection validation.</li>
              <li><strong>Zeek C2 Detection</strong> — Periodic beaconing analysis.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>11 · DNS &amp; Network Utilities</h3>
            <ul>
              <li><strong>dig &amp; nslookup</strong> — DNS record inspection.</li>
              <li><strong>traceroute</strong> — Multi-hop routing path validation.</li>
              <li><strong>whois &amp; dnsrecon</strong> — Domain intelligence.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>12 · SOC Detection &amp; SIEM Tools</h3>
            <ul>
              <li><strong>Wazuh</strong> — Endpoint detection and file integrity.</li>
              <li><strong>Suricata &amp; Snort</strong> — Network IDS/IPS signatures.</li>
              <li><strong>Splunk &amp; OpenSearch</strong> — Log aggregation and SPL queries.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>13 · Firewall &amp; Network Infrastructure</h3>
            <ul>
              <li><strong>pfSense CE &amp; OPNsense</strong> — Perimeter enforcement.</li>
              <li><strong>VirtualBox &amp; Proxmox VE</strong> — Isolated VM hypervisors.</li>
              <li><strong>ShadowX VPN Mesh</strong> — 10.8.0.0/24 cross-network overlay bridge.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>14 · Linux Investigation Toolkit</h3>
            <ul>
              <li><strong>grep, awk, sed, cut, sort, uniq</strong> — Command-line log parsing.</li>
              <li><strong>journalctl &amp; dmesg</strong> — System daemon diagnostics.</li>
              <li><strong>sha256sum &amp; file</strong> — Artifact forensics.</li>
            </ul>
          </article>

          <article class="pre-card">
            <h3>15 · Terminal &amp; Remote Access</h3>
            <ul>
              <li><strong>OpenSSH, SCP, SFTP</strong> — Encrypted administrative channels.</li>
              <li><strong>tmux / screen</strong> — Multi-session terminal multiplexing.</li>
            </ul>
          </article>

          <article class="pre-card pre-full">
            <h3>16 · Full Proxmox / VirtualBox Cyber Range (Recommended)</h3>
            <div class="pre-path">
              <div><b>HYPERVISOR ENGINE</b><span>VirtualBox or Proxmox VE hosts Kali, pfSense, Metasploitable, and Windows Workstations on isolated virtual subnets.</span></div>
              <div><b>SHADOWX VPN MESH</b><span>Bridges VMs on isolated NAT or Host-Only subnets directly into the 10.8.0.0/24 central telemetry plane.</span></div>
              <div><b>FIREWALL GATEWAY</b><span>pfSense VM sits between LAN (10.10.20.0/24) and WAN (203.0.113.0/24) for live rule testing.</span></div>
              <div><b>TELEMETRY CORRELATION</b><span>Edge agents stream Syslog and HEC events directly into the ShadowXLab Control Plane.</span></div>
            </div>
          </article>

          <article class="pre-card pre-full">
            <h3>17 · Recommended Student Tool Roadmap</h3>
            <div class="pre-path">
              <div><b>FOUNDATIONS · C01–C07</b><span>Browser academy → basic Linux terminal → ip/ss/ping → pfSense rule and filter logs.</span></div>
              <div><b>NETWORK · C08–C13</b><span>Nmap → Wireshark → tcpdump → dig → curl → NAT translation state tables.</span></div>
              <div><b>ATTACK PATTERNS · C14–C17</b><span>SSH brute-force → RDP attacks → web enumeration → periodic C2 beaconing triage.</span></div>
              <div><b>ENDPOINT · C18–C20</b><span>Linux auth.log + Windows EventID 4688/4624 + multi-source timeline reconstruction.</span></div>
              <div><b>TRIAGE &amp; DECISION · C21–C25</b><span>True vs False positives → external recon → compromised endpoint containment → final challenge.</span></div>
            </div>
          </article>
        </div>

        <div class="prereq-note">
          <strong>Ready to start?</strong> Click on <strong>"🎓 25-Class Academy"</strong> above to begin Class C01 (Network Fundamentals), or switch to <strong>"⚡ 45 Hands-On Labs"</strong> to interact directly with the live command simulators.
        </div>
      </section>
    </div>
  `;
}
"""

# Replace the initial render call at the bottom
old_init = """// Initial state setup & catalog render
applyNavCollapse(navCollapsed);
applyLabLayout();
catalog();"""

new_init = academy_js_code + """
// Initial state setup & route to active track
applyNavCollapse(navCollapsed);
applyLabLayout();
switchTrack(currentTrack);
"""

if "switchTrack(currentTrack);" not in html:
    html = html.replace(old_init, new_init)

with open("public/soc-interactive-labs.html", "w", encoding="utf-8") as f:
    f.write(html)

print("[+] Academy JavaScript successfully injected!")
