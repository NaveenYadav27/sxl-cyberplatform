import re

with open("public/soc-interactive-labs.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Add script src to <head>
if "academy_data.js" not in html:
    html = html.replace("</head>", '<script src="academy_data.js"></script>\n</head>')

# 2. Add Academy CSS styles before </style>
academy_css = """
/* ─── Track Switcher Bar ─── */
.track-switcher{display:flex;align-items:center;gap:4px;background:var(--panel);border:1px solid var(--line);padding:3px 4px;border-radius:10px}
.track-btn{background:transparent;border:1px solid transparent;color:var(--muted);border-radius:8px;padding:5px 11px;font-size:11px;font-weight:750;cursor:pointer;transition:all .15s ease}
.track-btn:hover{color:var(--text)}
.track-btn.active{background:var(--card-bg);border-color:var(--line);color:var(--accent);box-shadow:0 2px 6px rgba(0,0,0,.08)}

/* ─── 25-Class Academy Styles ─── */
.academy-wrap{display:flex;flex-direction:column;gap:14px;padding:16px 20px;height:calc(100vh - 65px);overflow-y:auto}
.hero{border:1px solid var(--line);border-radius:18px;padding:22px;background:linear-gradient(135deg,var(--card-bg),var(--subtle));box-shadow:0 4px 20px rgba(0,0,0,.05)}
.eyebrow{color:var(--accent);font-size:10px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
.hero h1{font-size:clamp(24px,3.5vw,38px);line-height:1.15;margin:8px 0;color:var(--text);font-family:'Space Grotesk',system-ui,sans-serif}
.hero p{max-width:950px;color:var(--muted);line-height:1.65;font-size:13px;margin:0}
.chain{font-weight:900;margin-top:12px;color:var(--accent);font-size:11px;letter-spacing:.06em}

.classhead{border:1px solid var(--line);border-radius:14px;background:var(--card-bg);padding:18px;box-shadow:0 3px 12px rgba(0,0,0,.04)}
.classhead h2{font-size:22px;margin:6px 0;color:var(--text);font-family:'Space Grotesk',system-ui,sans-serif}
.classhead p{color:var(--muted);line-height:1.6;font-size:13px;margin:0}
.objectives{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.obj{border:1px solid var(--line);border-radius:9px;padding:9px;font-size:11px;background:var(--panel);color:var(--text)}
.obj b{display:block;color:var(--accent);font-size:9px;margin-bottom:3px;letter-spacing:.05em}

.timeline{display:flex;gap:6px;margin:12px 0;overflow-x:auto;padding-bottom:4px}
.stagebtn{flex:1;min-width:105px;border:1px solid var(--line);background:var(--card-bg);color:var(--muted);border-radius:9px;padding:9px 10px;text-align:left;cursor:pointer;font-size:10px;transition:all .15s ease}
.stagebtn:hover{border-color:var(--accent);color:var(--text)}
.stagebtn.active{border-color:var(--accent);color:var(--accent);background:var(--subtle);font-weight:bold;box-shadow:0 0 0 1px var(--accent) inset}
.stagebtn.done:after{content:" ✓";color:var(--good);font-weight:900}

.academy-main{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:16px;min-height:550px}
.card{border:1px solid var(--line);border-radius:14px;background:var(--card-bg);padding:18px;box-shadow:0 3px 12px rgba(0,0,0,.04)}
.meta{display:flex;justify-content:space-between;color:var(--accent);font-size:10px;font-weight:950;letter-spacing:.1em}
.card h3{font-size:20px;margin:6px 0;color:var(--text);font-family:'Space Grotesk',system-ui,sans-serif}
.explain{line-height:1.75;font-size:13.5px;color:var(--text);margin:8px 0}
.worked{padding:12px;border:1px solid var(--line);background:var(--subtle);border-radius:10px;line-height:1.6;font-size:12px;margin-top:10px}
.teach{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}
.teach div{border:1px solid var(--line);border-radius:9px;padding:9px;background:var(--card-bg)}
.teach b{display:block;color:var(--accent);font-size:9px;letter-spacing:.1em;margin-bottom:3px}
.teach span{color:var(--muted);font-size:11px;line-height:1.5}
.box{margin-top:9px;padding:10px;border-radius:9px;font-size:11.5px;line-height:1.55}
.mistake{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:var(--text)}
.think{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.3);color:var(--text)}
.box b{display:block;font-size:9px;letter-spacing:.1em;margin-bottom:3px}
.mistake b{color:#ef4444}.think b{color:var(--good)}

.question{margin-top:14px;border:1.5px solid var(--line);border-radius:11px;padding:14px;background:var(--panel)}
.question h4{margin:0 0 9px;font-size:12.5px;color:var(--text)}
.choices{display:grid;gap:7px}
.choice{text-align:left;padding:9px 12px;border:1px solid var(--line);background:var(--card-bg);color:var(--text);border-radius:8px;cursor:pointer;font-size:11.5px;transition:all .15s ease}
.choice:hover{border-color:var(--accent)}
.choice.selected{border-color:var(--accent);background:var(--subtle)}
.choice.correct{border-color:var(--good);background:rgba(16,185,129,.12);color:var(--good);font-weight:bold}
.choice.wrong{border-color:#ef4444;background:rgba(239,68,68,.12);color:#ef4444;font-weight:bold}
.feedback{min-height:20px;font-size:11.5px;font-weight:900;margin-top:7px}
.good{color:var(--good)}.bad{color:#ef4444}

.command-box{margin-top:12px;padding:12px;border:1px dashed var(--line);border-radius:10px;background:var(--panel)}
.cmd{display:block;margin:6px 0;font-size:11.5px;color:var(--accent2);font-weight:bold;font-family:ui-monospace,monospace}
.run-btn,.continue-btn{border:1px solid var(--accent);background:var(--accent);color:#fff;border-radius:7px;padding:7px 12px;cursor:pointer;font-weight:800;font-size:11px;transition:all .15s}
.run-btn:hover,.continue-btn:hover{background:#ff2e34}
.term-box{background:#080b0f;color:#e9eef3;border-radius:8px;padding:11px;margin-top:8px;min-height:70px;font:11.5px ui-monospace,monospace;white-space:pre-wrap}

.side-case{position:sticky;top:0;align-self:start;display:flex;flex-direction:column;gap:12px}
.case-data div{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:7px 0;font-size:11px}
.case-data span{color:var(--muted);font-size:9px;font-weight:700}
.case-data b{font:11px ui-monospace,monospace;color:var(--text)}
.svg-wrap{margin-top:10px;border:1px solid var(--line);border-radius:11px;overflow:hidden;background:var(--panel)}
svg{width:100%;display:block}
svg text{font-family:Inter,system-ui,sans-serif;fill:var(--text)}
.n{fill:var(--card-bg);stroke:var(--line);stroke-width:2}
.hot{fill:var(--subtle);stroke:var(--accent);stroke-width:3}
.arrow{stroke:var(--accent);stroke-width:3;stroke-dasharray:8 7;animation:arrowDash 1s linear infinite}
@keyframes arrowDash{to{stroke-dashoffset:-30}}

.bottom-actions{display:flex;justify-content:space-between;margin-top:14px}
.bottom-actions button{border:1px solid var(--line);background:var(--card-bg);color:var(--text);border-radius:7px;padding:8px 13px;cursor:pointer;font-weight:750;font-size:11px}
.bottom-actions .continue-btn{border-color:var(--accent)}
.finish-box{margin-top:15px;padding:16px;border:2px solid var(--good);background:rgba(16,185,129,.1);border-radius:11px;display:none}
.finish-box h3{color:var(--good);margin:0 0 6px;font-size:15px}

/* ─── Prerequisites Matrix ─── */
.prereq{border:1px solid var(--line);border-radius:16px;background:var(--card-bg);box-shadow:0 4px 20px rgba(0,0,0,.05);overflow:hidden;margin-bottom:20px}
.prereq-head{padding:18px 20px;background:linear-gradient(135deg,var(--card-bg),var(--subtle));border-bottom:1px solid var(--line)}
.prereq-head h2{margin:4px 0 6px;font-size:22px;color:var(--text);font-family:'Space Grotesk',sans-serif}
.prereq-head p{margin:0;color:var(--muted);line-height:1.6;font-size:12.5px}
.prereq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px}
.pre-card{border:1px solid var(--line);border-radius:11px;padding:13px;background:var(--panel)}
.pre-card h3{margin:0 0 8px;font-size:12px;color:var(--accent);font-weight:900}
.pre-card ul{margin:0;padding-left:18px;color:var(--muted);font-size:11.5px;line-height:1.7}
.pre-card li::marker{color:var(--accent)}
.pre-card strong{color:var(--text)}
.pre-full{grid-column:1/-1}
.pre-path{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pre-path div{border:1px dashed var(--line);border-radius:9px;padding:10px;background:var(--card-bg)}
.pre-path b{display:block;color:var(--accent);font-size:9.5px;letter-spacing:.08em;margin-bottom:4px}
.pre-path span{font-size:11px;color:var(--muted);line-height:1.5}
.prereq-note{margin:0 14px 14px;padding:11px 13px;border-radius:9px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);color:var(--text);font-size:11.5px;line-height:1.6}
@media(max-width:1100px){.academy-main{grid-template-columns:1fr}.side-case{position:static}.prereq-grid{grid-template-columns:1fr 1fr}}
@media(max-width:800px){.prereq-grid{grid-template-columns:1fr}.objectives,.teach{grid-template-columns:1fr}}
"""

if "/* ─── Track Switcher Bar ─── */" not in html:
    html = html.replace("</style>", academy_css + "\n</style>")

# 3. Update top header with track switcher
track_switcher_markup = """  <div class="brand">
    <div style="width:26px;height:26px;background:var(--accent);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:13px">SX</div>
    <div>SHADOW<span>X</span> <span style="font-weight:400;color:var(--text)">SOC ACADEMY</span></div>
  </div>
  <div class="track-switcher">
    <button id="trackAcademyBtn" class="track-btn active" onclick="switchTrack('academy')">
      🎓 25-Class Academy
    </button>
    <button id="trackLabsBtn" class="track-btn" onclick="switchTrack('labs')">
      ⚡ 45 Hands-On Labs
    </button>
    <button id="trackPrereqBtn" class="track-btn" onclick="switchTrack('prereq')">
      📋 Prerequisites Matrix
    </button>
  </div>"""

html = re.sub(
    r'<div class="brand">[\s\S]*?</div>\s*<div class="crumb">.*?</div>',
    track_switcher_markup,
    html,
    count=1
)

with open("public/soc-interactive-labs.html", "w", encoding="utf-8") as f:
    f.write(html)

print("[+] Header and CSS updated successfully!")
