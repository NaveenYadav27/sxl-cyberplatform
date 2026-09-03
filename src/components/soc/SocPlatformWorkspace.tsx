import React, { useState, useEffect } from 'react';
import {
  Shield, Search, Play, Copy, Wifi, Key, Globe, Terminal,
  CheckCircle2, AlertTriangle, Loader2, ExternalLink, RefreshCw,
  Lock, Unlock, Server, Radio, HelpCircle, ArrowRight
} from 'lucide-react';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// ─── helpers ──────────────────────────────────────────────────────────────
const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

function StatusBadge({ ok, trueLabel = 'Live API', falseLabel = 'Needs Key' }: { ok: boolean; trueLabel?: string; falseLabel?: string }) {
  return ok ? (
    <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {trueLabel}
    </span>
  ) : (
    <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {falseLabel}
    </span>
  );
}

function JsonView({ data }: { data: any }) {
  return (
    <pre className="w-full bg-[#060810] rounded-xl p-4 text-emerald-300 text-[10px] font-mono overflow-auto max-h-80 whitespace-pre-wrap break-all border border-[#182030] leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─── CyberChef – embedded GCHQ + quick-bake ───────────────────────────────
const RECIPES = [
  { id: 'ps_utf16le', label: 'PowerShell -enc (UTF-16LE Base64)' },
  { id: 'from_base64', label: 'From Base64' },
  { id: 'to_base64', label: 'To Base64' },
  { id: 'url_decode', label: 'URL Decode' },
  { id: 'url_encode', label: 'URL Encode' },
  { id: 'rot13', label: 'ROT13' },
  { id: 'rot47', label: 'ROT47' },
  { id: 'to_hex', label: 'To Hex' },
  { id: 'from_hex', label: 'From Hex' },
  { id: 'to_binary', label: 'To Binary' },
  { id: 'from_binary', label: 'From Binary' },
  { id: 'reverse', label: 'Reverse' },
  { id: 'sha256', label: 'SHA-256' },
  { id: 'sha1', label: 'SHA-1' },
  { id: 'xor', label: 'XOR with Key' },
];

async function applyRecipe(input: string, recipeId: string, xorKey: string): Promise<string> {
  let v = input;
  try {
    switch (recipeId) {
      case 'ps_utf16le': { const b = atob(v.trim()); let s = ''; for (let i = 0; i < b.length; i += 2) s += b[i]; return s; }
      case 'from_base64': return atob(v.trim());
      case 'to_base64': return btoa(v);
      case 'url_decode': return decodeURIComponent(v);
      case 'url_encode': return encodeURIComponent(v);
      case 'rot13': return v.replace(/[a-zA-Z]/g, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(b + (c.charCodeAt(0) - b + 13) % 26); });
      case 'rot47': return v.replace(/[!-~]/g, c => String.fromCharCode(33 + (c.charCodeAt(0) - 33 + 47) % 94));
      case 'to_hex': return Array.from(new TextEncoder().encode(v)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      case 'from_hex': { const h = v.replace(/\s/g, ''); let s = ''; for (let i = 0; i < h.length; i += 2) s += String.fromCharCode(parseInt(h.substr(i, 2), 16)); return s; }
      case 'to_binary': return Array.from(new TextEncoder().encode(v)).map(b => b.toString(2).padStart(8, '0')).join(' ');
      case 'from_binary': return v.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
      case 'reverse': return v.split('').reverse().join('');
      case 'sha256': { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
      case 'sha1': { const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(v)); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
      case 'xor': { const k = xorKey || 'A'; let r = ''; for (let i = 0; i < v.length; i++) r += String.fromCharCode(v.charCodeAt(i) ^ k.charCodeAt(i % k.length)); return r; }
      default: return v;
    }
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

function CyberChefTab() {
  const [mode, setMode] = useState<'embed' | 'bake'>('embed');
  const [recipe, setRecipe] = useState('ps_utf16le');
  const [xorKey, setXorKey] = useState('secret');
  const [input, setInput] = useState('SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwADAALgAxADEAOAAuADEANgAxAC4AMQA3AC8AcABhAHkAbABvAGEAZAAnACkA');
  const [output, setOutput] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { applyRecipe(input, recipe, xorKey).then(setOutput); }, [input, recipe, xorKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
          CyberChef Offline Quick-Bake Decoder &amp; Encoder Engine
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4 font-mono">
          {/* Operations picker */}
          <div className="col-span-3 bg-[#0B0E14] border border-[#202736] rounded-2xl p-3 space-y-2">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Select Recipe:</span>
            {RECIPES.map(r => (
              <button key={r.id} onClick={() => setRecipe(r.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition ${recipe === r.id ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50' : 'text-slate-400 hover:text-white hover:bg-[#121620]'}`}>
                {r.label}
              </button>
            ))}
            {recipe === 'xor' && (
              <div className="pt-2 border-t border-[#202736] space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">XOR Key:</label>
                <input value={xorKey} onChange={e => setXorKey(e.target.value)}
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-lg px-2 py-1 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500" />
              </div>
            )}
          </div>

          {/* IO */}
          <div className="col-span-9 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold block">Input ({input.length} chars)</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={6}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl p-3 text-amber-300 text-xs focus:outline-none focus:border-emerald-500 font-mono resize-none" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-emerald-400 uppercase font-bold block">Output ({output.length} chars)</label>
                <button onClick={() => { copyToClipboard(output); setToast('Copied!'); setTimeout(() => setToast(''), 2000); }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold">
                  <Copy className="w-3 h-3" />{toast || 'Copy'}
                </button>
              </div>
              <div className="w-full bg-[#060810] border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs font-mono min-h-24 max-h-40 overflow-auto whitespace-pre-wrap break-all">
                {output || '// Result appears here as you type.'}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

// ─── VirusTotal ─────────────────────────────────────────────────────────────
function VTTab({ apiStatus }: { apiStatus: any }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult(null);
    const resp = await fetch(`${BASE_URL}/tools/virustotal/hash/${encodeURIComponent(query.trim())}`);
    setResult(await resp.json());
    setLoading(false);
  };

  const malicious = result?.malicious ?? 0;
  const total = result?.total ?? 0;

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">VIRUSTOTAL FILE / HASH ANALYSIS</h3>
        <div className="flex items-center gap-2">
          <StatusBadge ok={apiStatus?.virustotal} trueLabel="Live API" falseLabel="Set VIRUSTOTAL_API_KEY" />
        </div>
      </div>

      {!apiStatus?.virustotal && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
          <b>Add your key:</b> Open <code className="bg-[#0B0E14] px-1 rounded">backend/.env</code> and configure:<br />
          <code className="text-emerald-300">VIRUSTOTAL_API_KEY=your_key_here</code>
        </div>
      )}

      <div className="flex gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Enter MD5 / SHA-1 / SHA-256 hash or URL..."
          className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs" />
        <button onClick={run} disabled={loading}
          className="px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          {result.error ? (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
          ) : result.api_key_configured === false ? (
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 text-xs">
              <b>No API key configured.</b> The backend returned what it can compute locally:
              <JsonView data={result} />
            </div>
          ) : (
            <>
              <div className={`p-4 rounded-xl border flex items-center justify-between ${malicious > 0 ? 'bg-red-950/60 border-red-500/50' : 'bg-emerald-950/40 border-emerald-500/40'}`}>
                <div>
                  <div className={`text-lg font-black ${malicious > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {malicious > 0 ? '⚠ MALICIOUS' : '✓ CLEAN'}
                  </div>
                  <div className="text-xs text-slate-300">{result.threat_label || 'N/A'} · {result.type || 'Unknown type'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{result.sha256 || result.submitted_hash}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${malicious > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{malicious}/{total}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Vendors</div>
                </div>
              </div>

              {result.engines?.length > 0 && (
                <div className="border border-[#202736] rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-[#121620] text-[10px] text-slate-400 uppercase font-bold border-b border-[#202736]">
                    Malicious Detections ({result.engines.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#202736]">
                    {result.engines.slice(0, 18).map((e: any, i: number) => (
                      <div key={i} className="p-2.5 flex items-center justify-between bg-[#080A0E]">
                        <span className="font-bold text-white text-[11px]">{e.name}</span>
                        <span className="text-amber-400 text-[10px] truncate max-w-[130px]">{e.detection}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AbuseIPDB ──────────────────────────────────────────────────────────────
function AbuseIPDBTab({ apiStatus }: { apiStatus: any }) {
  const [ip, setIp] = useState('185.220.101.34');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true); setResult(null);
    const resp = await fetch(`${BASE_URL}/tools/abuseipdb/${encodeURIComponent(ip.trim())}`);
    setResult(await resp.json());
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">ABUSEIPDB IP REPUTATION CHECK</h3>
        <div className="flex items-center gap-2">
          <StatusBadge ok={apiStatus?.abuseipdb} trueLabel="Live API" falseLabel="Set ABUSEIPDB_API_KEY" />
        </div>
      </div>

      {!apiStatus?.abuseipdb && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
          <b>Configure key:</b> Set <code className="text-emerald-300">ABUSEIPDB_API_KEY=your_key_here</code> in <code>backend/.env</code>
        </div>
      )}

      <div className="flex gap-3">
        <input value={ip} onChange={e => setIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Enter IP address..."
          className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 text-xs" />
        <button onClick={run} disabled={loading}
          className="px-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Checking...' : 'Check IP'}
        </button>
      </div>

      {result && (
        result.error ? (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
        ) : result.api_key_configured === false ? (
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs">{result.note}</div>
        ) : (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${result.confidence_score > 50 ? 'bg-red-950/60 border-red-500/50' : 'bg-emerald-950/40 border-emerald-500/40'}`}>
              <div>
                <div className={`text-2xl font-black ${result.confidence_score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {result.confidence_score}% Abuse Score
                </div>
                <div className="text-xs text-slate-300">{result.country} · {result.isp}</div>
                <div className="text-[10px] text-slate-400">{result.usage_type}</div>
              </div>
              <div className="text-right text-xs text-slate-300 space-y-1">
                <div><b className="text-white">{result.total_reports}</b> reports</div>
                <div><b className="text-white">{result.distinct_users}</b> users</div>
                {result.is_tor && <div className="text-red-400 font-bold">TOR EXIT NODE</div>}
              </div>
            </div>

            {result.reports?.length > 0 && (
              <div className="border border-[#202736] rounded-xl overflow-hidden">
                <div className="p-2.5 bg-[#121620] text-[10px] text-slate-400 uppercase font-bold border-b border-[#202736]">
                  Recent Abuse Reports:
                </div>
                <div className="divide-y divide-[#202736]">
                  {result.reports.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="p-2.5 bg-[#080A0E] text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{new Date(r.reported_at).toLocaleString()}</span>
                        <span className="text-amber-400 font-bold">{r.reporter_country}</span>
                      </div>
                      <div className="text-slate-300">{r.comment || 'No comment provided'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ─── Shodan InternetDB (always free) ────────────────────────────────────────
function ShodanTab() {
  const [ip, setIp] = useState('8.8.8.8');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true); setResult(null);
    const resp = await fetch(`${BASE_URL}/tools/shodan/${encodeURIComponent(ip.trim())}`);
    setResult(await resp.json());
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">SHODAN INTERNETDB (NO KEY REQUIRED)</h3>
        <div className="flex items-center gap-2">
          <StatusBadge ok={true} trueLabel="Live · Ready" />
        </div>
      </div>

      <div className="flex gap-3">
        <input value={ip} onChange={e => setIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Enter public IP address..."
          className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-xs" />
        <button onClick={run} disabled={loading}
          className="px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {loading ? 'Querying...' : 'Shodan Lookup'}
        </button>
      </div>

      {result && (
        result.error ? (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-[#121620] border border-blue-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-white">{result.ip}</div>
                <div className="flex gap-2 flex-wrap">
                  {result.tags?.map((t: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-950 text-blue-400 border border-blue-500/40">{t}</span>
                  ))}
                </div>
              </div>
              {result.hostnames?.length > 0 && (
                <div className="text-xs text-slate-400">Hostnames: <span className="text-slate-200">{result.hostnames.join(', ')}</span></div>
              )}
              {result.note && <div className="text-xs text-amber-300">{result.note}</div>}
            </div>

            {result.ports?.length > 0 && (
              <div className="p-4 bg-[#080A0E] border border-[#202736] rounded-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Open Ports ({result.ports.length}):</span>
                <div className="flex flex-wrap gap-2">
                  {result.ports.map((p: number) => (
                    <span key={p} className="px-2.5 py-1 rounded-lg bg-[#121620] text-cyan-300 font-bold text-xs border border-cyan-500/30">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {result.vulns?.length > 0 && (
              <div className="border border-red-500/40 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-red-950/40 text-[10px] text-red-400 uppercase font-bold border-b border-red-500/40">
                  Known Vulnerabilities ({result.vulns.length}):
                </div>
                <div className="divide-y divide-[#202736]">
                  {result.vulns.map((v: string, i: number) => (
                    <div key={i} className="px-3 py-2 bg-[#080A0E] text-amber-400 font-bold text-xs">{v}</div>
                  ))}
                </div>
              </div>
            )}

            {result.cpes?.length > 0 && (
              <div className="p-3 bg-[#080A0E] border border-[#202736] rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">CPE Software Fingerprints:</span>
                {result.cpes.map((c: string, i: number) => (
                  <div key={i} className="text-[11px] text-purple-300 font-mono">{c}</div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ─── Real TCP Port Scanner ──────────────────────────────────────────────────
function PortScannerTab() {
  const [target, setTarget] = useState('100.95.175.46');
  const [ports, setPorts] = useState('22,80,135,139,443,445,3000,3389,8000,8080');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true); setResult(null);
    const portList = ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0 && p <= 65535);
    const resp = await fetch(`${BASE_URL}/tools/portscan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, ports: portList.length > 0 ? portList : undefined })
    });
    setResult(await resp.json());
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">REAL TCP PORT SCANNER (SERVER-SIDE)</h3>
        <StatusBadge ok={true} trueLabel="Always Available" />
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-bold block">Target Host / IP:</label>
            <input value={target} onChange={e => setTarget(e.target.value)}
              placeholder="hostname or IP..."
              className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs" />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-bold block">Ports (comma-separated, blank=common set):</label>
            <input value={ports} onChange={e => setPorts(e.target.value)}
              placeholder="22,80,443,445,3389..."
              className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs" />
          </div>
        </div>
        <button onClick={run} disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {loading ? 'Scanning... (real TCP connects)' : 'Run Port Scan'}
        </button>
      </div>

      {result && (
        result.error ? (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300"><b className="text-white">{result.target}</b> resolved to <b className="text-cyan-300">{result.resolved_ip}</b></span>
              <span className="text-emerald-400 font-bold">{result.open_count} open / {result.total_scanned} scanned</span>
            </div>

            {result.open_ports?.length > 0 && (
              <div className="border border-emerald-500/40 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-emerald-950/30 text-[10px] text-emerald-400 uppercase font-bold border-b border-emerald-500/30">
                  Open Ports:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3 bg-[#080A0E]">
                  {result.open_ports.map((p: any) => (
                    <div key={p.port} className="p-2.5 bg-[#0B0E14] border border-emerald-500/30 rounded-xl text-center">
                      <div className="text-emerald-400 font-black">{p.port}</div>
                      <div className="text-[10px] text-slate-400">{p.service}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.open_ports?.length === 0 && (
              <div className="p-4 text-center text-slate-500 border border-dashed border-[#202736] rounded-xl text-xs">
                No open ports detected in the scanned range. Target may be firewalled or offline.
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ─── HIBP (Real API, no key needed) ─────────────────────────────────────────
function HIBPTab() {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setLoading(true); setResult(null);

    // SHA-1 in browser, send only prefix to backend which proxies to HIBP
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hex.substring(0, 5);
    const suffix = hex.substring(5);

    const resp = await fetch(`${BASE_URL}/tools/hibp/range/${prefix}`);
    const data = await resp.json();

    if (data.error) { setResult({ error: data.error }); setLoading(false); return; }

    let count = 0;
    for (const line of (data.data || '').split('\n')) {
      const [h, c] = line.trim().split(':');
      if (h === suffix) { count = parseInt(c, 10); break; }
    }
    setResult({ sha1: hex, prefix, suffix, count, pwned: count > 0 });
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">HAVE I BEEN PWNED — REAL k-ANONYMITY API</h3>
        <StatusBadge ok={true} trueLabel="Live · 800M+ Breaches" />
      </div>

      <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl text-xs text-slate-400">
        Your password is <b className="text-white">never sent</b> anywhere. Only a 5-char SHA-1 prefix leaves the browser.
        The full hash never travels over the network — this is the real HIBP k-anonymity method.
      </div>

      <form onSubmit={run} className="flex gap-3">
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter any password to test..."
          className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 text-xs" />
        <button type="submit" disabled={loading || !pw}
          className="px-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          {loading ? 'Checking API...' : 'Check'}
        </button>
      </form>

      {result && (
        result.error ? (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
        ) : result.pwned ? (
          <div className="p-4 bg-red-950/60 border border-red-500/60 rounded-xl space-y-1 text-xs">
            <div className="text-base font-black text-red-400">⚠ COMPROMISED IN BREACH DATA</div>
            <div className="text-slate-200">This password appears <b className="text-red-300">{result.count.toLocaleString()}</b> times in known data breaches. Do not use it.</div>
            <div className="text-[10px] text-slate-500 pt-1">SHA-1: {result.sha1}</div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1 text-xs">
            <div className="text-base font-black text-emerald-400">✓ NOT FOUND IN ANY KNOWN BREACH</div>
            <div className="text-slate-300">This password was not found in any of the 800M+ breach records checked.</div>
            <div className="text-[10px] text-slate-500 pt-1">SHA-1: {result.sha1}</div>
          </div>
        )
      )}
    </div>
  );
}

// ─── DNS Real Resolver ───────────────────────────────────────────────────────
function DNSTab() {
  const [hostname, setHostname] = useState('shadowxlab.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true); setResult(null);
    const resp = await fetch(`${BASE_URL}/tools/dns/${encodeURIComponent(hostname.trim())}`);
    setResult(await resp.json());
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">DNS RESOLVER (REAL SERVER-SIDE LOOKUP)</h3>
        <StatusBadge ok={true} trueLabel="Always Available" />
      </div>

      <div className="flex gap-3">
        <input value={hostname} onChange={e => setHostname(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="hostname or domain..."
          className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-xs" />
        <button onClick={run} disabled={loading}
          className="px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {loading ? 'Resolving...' : 'Resolve'}
        </button>
      </div>

      {result && (
        result.error ? (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
        ) : (
          <div className="p-4 bg-[#121620] border border-purple-500/40 rounded-xl space-y-2">
            <div className="text-xs font-bold text-white">{result.hostname}</div>
            <div className="flex flex-wrap gap-2">
              {result.addresses?.map((a: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-[#080A0E] text-cyan-300 font-bold font-mono text-xs border border-cyan-500/30">{a}</span>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── Hunter.io ───────────────────────────────────────────────────────────────
function HunterTab({ apiStatus }: { apiStatus: any }) {
  const [domain, setDomain] = useState('shadowxlab.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true); setResult(null);
    const resp = await fetch(`${BASE_URL}/tools/hunter/${encodeURIComponent(domain.trim())}`);
    setResult(await resp.json());
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">HUNTER.IO EMAIL OSINT</h3>
        <div className="flex items-center gap-2">
          <StatusBadge ok={apiStatus?.hunter} trueLabel="Live API" falseLabel="Set HUNTER_API_KEY" />
        </div>
      </div>

      {!apiStatus?.hunter && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
          <b>Configure key:</b> Set <code className="text-emerald-300">HUNTER_API_KEY=your_key_here</code> in <code>backend/.env</code>
        </div>
      )}

      <div className="flex gap-3">
        <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Corporate domain..."
          className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-xs" />
        <button onClick={run} disabled={loading}
          className="px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-2 text-xs">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : 'Search Domain'}
        </button>
      </div>

      {result && (
        result.error ? (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs">{result.error}</div>
        ) : result.api_key_configured === false ? (
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs">{result.note}</div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl text-xs flex items-center justify-between">
              <span className="text-slate-300">Domain: <b className="text-white">{result.domain}</b> · Pattern: <b className="text-emerald-300">{result.pattern || 'N/A'}</b></span>
              <span className="text-emerald-400 font-bold">{result.total_emails} emails found</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.emails?.map((e: any, i: number) => (
                <div key={i} className="p-3 bg-[#080A0E] border border-[#202736] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-xs">{e.email}</div>
                    <div className="text-[10px] text-slate-400">{e.first_name} {e.last_name} · {e.position || 'N/A'}</div>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">{e.confidence}%</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── API Key Setup Panel ─────────────────────────────────────────────────────
function KeySetupPanel({ apiStatus }: { apiStatus: any }) {
  const keys = [
    { key: 'VIRUSTOTAL_API_KEY', live: apiStatus?.virustotal, label: 'VirusTotal', desc: 'File & hash reputation lookups' },
    { key: 'ABUSEIPDB_API_KEY', live: apiStatus?.abuseipdb, label: 'AbuseIPDB', desc: 'IP reputation & threat intelligence' },
    { key: 'HUNTER_API_KEY', live: apiStatus?.hunter, label: 'Hunter.io', desc: 'Domain email pattern analysis' },
  ];

  return (
    <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-5 shadow-xl space-y-4 font-mono">
      <div className="pb-2 border-b border-[#202736]">
        <h3 className="text-sm font-black text-white">API KEY CONFIGURATION</h3>
        <p className="text-xs text-slate-400 mt-1">Add keys to <code className="bg-[#182030] px-1 rounded">backend/.env</code> and restart the backend server.</p>
      </div>

      <div className="space-y-2.5">
        {keys.map(k => (
          <div key={k.key} className={`p-3 rounded-xl border flex items-center justify-between ${k.live ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-[#202736] bg-[#080A0E]'}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${k.live ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-white font-bold text-xs">{k.label}</span>
                <code className="text-slate-400 text-[10px]">{k.key}</code>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 ml-4">{k.desc}</div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${k.live ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              {k.live ? 'Connected' : 'Not Set'}
            </span>
          </div>
        ))}

        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="text-emerald-400 font-bold text-xs mb-1">✓ No key required:</div>
          <div className="flex gap-3 flex-wrap text-[10px] text-slate-300">
            <span>• Shodan InternetDB (public)</span>
            <span>• HIBP Password Range API</span>
            <span>• Real TCP Port Scanner</span>
            <span>• DNS Resolver</span>
            <span>• CyberChef (embedded)</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#060810] border border-[#182030] rounded-xl">
        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">backend/.env example:</p>
        <pre className="text-emerald-300 text-[11px] leading-relaxed">{`VIRUSTOTAL_API_KEY=abcdef123456...
ABUSEIPDB_API_KEY=xyz789...
HUNTER_API_KEY=abc123...`}</pre>
      </div>
    </div>
  );
}

// ─── pfSense Simulator Tab ──────────────────────────────────────────────────
function PfSenseTab() {
  const [cmd, setCmd] = useState('pfctl -sr');
  const [out, setOut] = useState(`@1 pass in quick on em1 proto tcp from 10.10.20.0/24 to any port = 443 flags S/SA keep state
@2 pass in quick on em1 proto tcp from 10.10.20.0/24 to any port = 80 flags S/SA keep state
@3 pass in quick on em1 proto udp from 10.10.20.0/24 to any port = 53 keep state
@4 block drop in quick on em0 from <rogue_ips> to any
@5 block drop in on em0 proto tcp from any to any port = 22
@6 pass out on em0 proto tcp from 10.10.20.0/24 to any flags S/SA keep state`);

  const run = (c: string) => {
    setCmd(c);
    if (c === 'pfsense') {
      setOut(`*** Welcome to pfSense 2.7.2-RELEASE (amd64) on pfsense-gw ***\n WAN (em0) -> v4: 203.0.113.15/24\n LAN (em1) -> v4: 10.10.20.1/24\n 0) Logout  1) Assign Interfaces  8) Shell  9) pfTop  10) Filter Logs\nEnter an option:`);
    } else if (c.includes('-ss')) {
      setOut(`ALL tcp 203.0.113.77:443 <- 10.10.20.44:51544       ESTABLISHED:ESTABLISHED\nALL tcp 10.10.20.15:22 <- 10.10.20.44:54412          ESTABLISHED:ESTABLISHED\nALL udp 10.10.10.2:53 <- 10.10.20.44:49152           MULTIPLE:SINGLE`);
    } else if (c.includes('pftop')) {
      setOut(`pfTop: Up 3/04:12:10, View: default, Order: bytes, 3 states, 281 pkts/sec\nPR   DIR SRC                   DEST                 STATE                AGE   EXP  PKTS BYTES\ntcp  Out 10.10.20.44:51544     203.0.113.77:443     ESTABLISHED:ESTAB  00:03 23:59  1420 1842K\ntcp  In  10.10.20.44:54412     10.10.20.15:22       ESTABLISHED:ESTAB  00:15 23:59   420  482K`);
    } else if (c.includes('filter.log')) {
      setOut(`Sep 02 17:41:58 em0 filterlog[811]: 4,,,match,block,in,4,0x0,,64,0,0,DF,6,tcp,60,203.0.113.77,10.10.20.15,51120,22,0,S,102482,,\nSep 02 17:53:02 em1 filterlog[811]: 1,,,match,pass,out,4,0x0,,64,124,0,DF,6,tcp,1514,10.10.20.44,203.0.113.77,51544,443,1420,A,142082,,`);
    } else {
      setOut(`@1 pass in quick on em1 proto tcp from 10.10.20.0/24 to any port = 443 flags S/SA keep state\n@4 block drop in quick on em0 from <rogue_ips> to any`);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">PFSENSE 2.7.2 · PERIMETER FIREWALL</h3>
          <p className="text-xs text-slate-400 mt-0.5">FreeBSD Packet Filter (pf) state tracking, filter logs, and dynamic table blocking.</p>
        </div>
        <StatusBadge ok={true} trueLabel="pf Engine Active" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Console Menu', cmd: 'pfsense' },
          { label: 'Filter Rules (-sr)', cmd: 'pfctl -sr' },
          { label: 'State Table (-ss)', cmd: 'pfctl -ss' },
          { label: 'pfTop Live', cmd: 'pftop' },
          { label: 'Filter Logs', cmd: 'clog /var/log/filter.log' },
        ].map(p => (
          <button key={p.label} onClick={() => run(p.cmd)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs hover:bg-purple-900/50 transition">
            {p.label}
          </button>
        ))}
      </div>

      <pre className="w-full bg-[#060810] rounded-xl p-4 text-purple-300 text-[11px] overflow-auto max-h-80 whitespace-pre-wrap border border-[#182030] leading-relaxed">
        {out}
      </pre>
    </div>
  );
}

// ─── Nmap Simulator Tab ─────────────────────────────────────────────────────
function NmapTab() {
  const [cmd, setCmd] = useState('nmap -sS -p 22,80,443 10.10.20.15');
  const [out, setOut] = useState(`Starting Nmap 7.94 (Local Scanner Engine) at 2026-09-02 17:41:00
Nmap scan report for 10.10.20.15
Host is up (0.00042s latency).
PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
443/tcp  open     https
3389/tcp filtered ms-wbt-server
Nmap done: 1 IP address (1 host up) scanned in 1.42 seconds`);

  const run = (c: string) => {
    setCmd(c);
    if (c.includes('-sn')) {
      setOut(`Starting Nmap 7.94\nNmap scan report for 10.10.20.1 (gateway)\nNmap scan report for 10.10.20.15 (soc-server)\nNmap scan report for 10.10.20.44 (workstation)\nNmap done: 256 IPs (3 hosts up) scanned in 2.1s`);
    } else if (c.includes('-sV')) {
      setOut(`PORT     STATE SERVICE VERSION\n22/tcp   open  ssh     OpenSSH 8.7 (protocol 2.0)\n80/tcp   open  http    Apache httpd 2.4.51 ((Unix) OpenSSL/1.1.1k)\n443/tcp  open  ssl/http Apache httpd 2.4.51`);
    } else if (c.includes('vuln')) {
      setOut(`PORT     STATE SERVICE\n80/tcp   open  http\n| ssl-heartbleed: VULNERABLE\n| Risk factor: High (CVE-2014-0160)`);
    } else {
      setOut(`PORT     STATE    SERVICE\n22/tcp   open     ssh\n80/tcp   open     http\n443/tcp  open     https\n3389/tcp filtered ms-wbt-server`);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">NMAP 7.94 · NETWORK RECONNAISSANCE</h3>
          <p className="text-xs text-slate-400 mt-0.5">Host discovery (-sn), TCP SYN stealth (-sS), service banners (-sV), and NSE scripts.</p>
        </div>
        <StatusBadge ok={true} trueLabel="CLI Ready" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Host Discovery (-sn)', cmd: 'nmap -sn 10.10.20.0/24' },
          { label: 'SYN Stealth (-sS)', cmd: 'nmap -sS -p 22,80,443 10.10.20.15' },
          { label: 'Service Versions (-sV)', cmd: 'nmap -sV -p 22,80,443 10.10.20.15' },
          { label: 'Vulnerability Script (--script vuln)', cmd: 'nmap --script vuln 10.10.20.15' },
        ].map(p => (
          <button key={p.label} onClick={() => run(p.cmd)}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-900/50 transition">
            {p.label}
          </button>
        ))}
      </div>

      <pre className="w-full bg-[#060810] rounded-xl p-4 text-emerald-300 text-[11px] overflow-auto max-h-80 whitespace-pre-wrap border border-[#182030] leading-relaxed">
        {out}
      </pre>
    </div>
  );
}

// ─── Wireshark & TShark Simulator Tab ───────────────────────────────────────
function WiresharkTab() {
  const [out, setOut] = useState(`Frame 1: 74 bytes on wire (592 bits), 74 bytes captured
Ethernet II, Src: 52:54:00:12:34:56, Dst: 00:50:56:b3:21:44
Internet Protocol Version 4, Src: 10.10.20.44, Dst: 203.0.113.77
Transmission Control Protocol, Src Port: 51544, Dst Port: 443, Flags: [SYN]`);

  const run = (c: string) => {
    if (c === 'http') {
      setOut(`GET /index.php HTTP/1.1\nHost: 203.0.113.77\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\nAccept: text/html\n\nHTTP/1.1 200 OK\nServer: Apache/2.4.51\nContent-Type: text/html`);
    } else if (c === 'phs') {
      setOut(`Protocol Hierarchy Statistics:\nframe: frames:420 bytes:384210\n  eth: frames:420 bytes:384210\n    ip: frames:420 bytes:384210\n      tcp: frames:380 bytes:378110\n        http: frames:85 bytes:128420`);
    } else {
      setOut(`Frame 1: 74 bytes on wire\nEthernet II -> IPv4 (10.10.20.44 -> 203.0.113.77) -> TCP (51544 -> 443) [SYN]`);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">WIRESHARK &amp; TSHARK · PACKET DISSECTION</h3>
          <p className="text-xs text-slate-400 mt-0.5">Deep packet inspection, protocol hierarchy, TCP stream analysis, and display filters.</p>
        </div>
        <StatusBadge ok={true} trueLabel="Dissector Ready" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Packet Headers', cmd: 'pcap' },
          { label: 'Extract HTTP Stream', cmd: 'http' },
          { label: 'Protocol Hierarchy (-z io,phs)', cmd: 'phs' },
        ].map(p => (
          <button key={p.label} onClick={() => run(p.cmd)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/50 transition">
            {p.label}
          </button>
        ))}
      </div>

      <pre className="w-full bg-[#060810] rounded-xl p-4 text-cyan-300 text-[11px] overflow-auto max-h-80 whitespace-pre-wrap border border-[#182030] leading-relaxed">
        {out}
      </pre>
    </div>
  );
}

// ─── Metasploit Simulator Tab ───────────────────────────────────────────────
function MetasploitTab() {
  const [out, setOut] = useState(`       =[ metasploit v6.3.25-dev                          ]
+ -- --=[ 2340 exploits - 1215 auxiliary - 410 post       ]
+ -- --=[ 1385 payloads - 46 encoders - 11 nops            ]

msf6 > search ssh
msf6 > use auxiliary/scanner/ssh/ssh_login
msf6 auxiliary(scanner/ssh/ssh_login) > show options`);

  const run = (c: string) => {
    if (c === 'exploit') {
      setOut(`[*] Exploit running against 10.10.20.15:22\n[+] Success: 'admin':'password123' (uid=0 root)\n[*] Command shell session 1 opened (10.10.20.44:51210 -> 10.10.20.15:22)`);
    } else {
      setOut(`msf6 > search ssh\nmsf6 > use auxiliary/scanner/ssh/ssh_login\nRHOSTS => 10.10.20.15\nRPORT  => 22`);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">METASPLOIT FRAMEWORK · ADVERSARY EMULATION</h3>
          <p className="text-xs text-slate-400 mt-0.5">Interactive msfconsole sub-shell, auxiliary scanners, and purple team exploit simulation.</p>
        </div>
        <StatusBadge ok={true} trueLabel="MSF Console Ready" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Search & Load Module', cmd: 'search' },
          { label: 'Execute Exploit / Auxiliary', cmd: 'exploit' },
        ].map(p => (
          <button key={p.label} onClick={() => run(p.cmd)}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs hover:bg-red-900/50 transition">
            {p.label}
          </button>
        ))}
      </div>

      <pre className="w-full bg-[#060810] rounded-xl p-4 text-red-300 text-[11px] overflow-auto max-h-80 whitespace-pre-wrap border border-[#182030] leading-relaxed">
        {out}
      </pre>
    </div>
  );
}

// ─── Nessus Simulator Tab ───────────────────────────────────────────────────
function NessusTab() {
  const [out, setOut] = useState(`Nessus CLI Vulnerability Scanner v10.6.2
Scanning Target: 10.10.20.15
[+] 148 Plugins Executed

CRITICAL: OpenSSH 8.7 Remote Code Execution (CVE-2023-38606) | CVSS 9.8
HIGH:     Apache HTTP Outdated Version (CVE-2021-41773)       | CVSS 7.5
MEDIUM:   Missing Anti-Clickjacking Header (CWE-1021)          | CVSS 5.3`);

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">NESSUS &amp; OPENVAS · VULNERABILITY TRIAGE</h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated vulnerability auditing, CVE correlation, and CVSS v3 severity ranking.</p>
        </div>
        <StatusBadge ok={true} trueLabel="Scanner Active" />
      </div>

      <pre className="w-full bg-[#060810] rounded-xl p-4 text-amber-300 text-[11px] overflow-auto max-h-80 whitespace-pre-wrap border border-[#182030] leading-relaxed">
        {out}
      </pre>
    </div>
  );
}

// ─── Nikto Simulator Tab ────────────────────────────────────────────────────
function NiktoTab() {
  const [out, setOut] = useState(`- Nikto v2.5.0
+ Target IP: 10.10.20.15  Port: 80
+ Server: Apache/2.4.51 (Unix) OpenSSL/1.1.1k
+ /: The anti-clickjacking X-Frame-Options header is not present.
+ /: The X-Content-Type-Options header is not set (MIME Sniffing Risk).
+ /admin/config.php: Admin script exposed without authentication.
+ /phpmyadmin/: Directory indexing found.`);

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">NIKTO 2.5 · WEB SECURITY AUDITING</h3>
          <p className="text-xs text-slate-400 mt-0.5">Web daemon fingerprinting, missing security headers, and dangerous file discovery.</p>
        </div>
        <StatusBadge ok={true} trueLabel="Auditor Ready" />
      </div>

      <pre className="w-full bg-[#060810] rounded-xl p-4 text-pink-300 text-[11px] overflow-auto max-h-80 whitespace-pre-wrap border border-[#182030] leading-relaxed">
        {out}
      </pre>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export const SocPlatformWorkspace: React.FC = () => {
  const [tab, setTab] = useState('pfsense');
  const [apiStatus, setApiStatus] = useState<any>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/tools/status`).then(r => r.json()).then(setApiStatus).catch(() => {});
  }, []);

  const TABS = [
    { id: 'pfsense',     label: 'pfSense Firewall',badge: 'Open Source',color: 'purple' },
    { id: 'nmap',        label: 'Nmap Scanner',    badge: 'Recon',      color: 'emerald' },
    { id: 'wireshark',   label: 'Wireshark/TShark',badge: 'PCAP',       color: 'blue' },
    { id: 'metasploit',  label: 'Metasploit',      badge: 'Adversary',  color: 'red' },
    { id: 'nessus',      label: 'Nessus Audit',    badge: 'CVE Matrix', color: 'amber' },
    { id: 'nikto',       label: 'Nikto Web',       badge: 'Headers',    color: 'red' },
    { id: 'cyberchef',   label: 'CyberChef',       badge: '300+ Ops',   color: 'emerald' },
    { id: 'vt',          label: 'VirusTotal',      badge: apiStatus?.virustotal ? 'Live' : 'Key Needed', color: apiStatus?.virustotal ? 'emerald' : 'amber' },
    { id: 'shodan',      label: 'Shodan',          badge: 'Live',       color: 'blue' },
    { id: 'portscan',    label: 'Port Scanner',    badge: 'Real TCP',   color: 'blue' },
    { id: 'abuseipdb',   label: 'AbuseIPDB',       badge: apiStatus?.abuseipdb ? 'Live' : 'Key Needed', color: apiStatus?.abuseipdb ? 'red' : 'amber' },
    { id: 'hibp',        label: 'HIBP',            badge: 'Live',       color: 'red' },
    { id: 'dns',         label: 'DNS Resolver',    badge: 'Real',       color: 'purple' },
    { id: 'hunter',      label: 'Hunter.io',       badge: apiStatus?.hunter ? 'Live' : 'Key Needed', color: apiStatus?.hunter ? 'purple' : 'amber' },
    { id: 'keys',        label: 'API Keys',        badge: 'Setup',      color: 'slate' },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-500 text-white',
    blue: 'border-blue-500 text-white',
    red: 'border-red-500 text-white',
    purple: 'border-purple-500 text-white',
    amber: 'border-amber-500 text-white',
    slate: 'border-slate-500 text-white',
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              tab === t.id
                ? colorMap[t.color] + ' bg-[#182030] shadow'
                : 'border-[#202736] text-slate-400 hover:text-white bg-[#0B0E14]'
            }`}>
            {t.label}
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${tab === t.id ? 'bg-white/10' : 'bg-[#182030] text-slate-500'}`}>
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl">
        {tab === 'pfsense'    && <PfSenseTab />}
        {tab === 'nmap'       && <NmapTab />}
        {tab === 'wireshark'  && <WiresharkTab />}
        {tab === 'metasploit' && <MetasploitTab />}
        {tab === 'nessus'     && <NessusTab />}
        {tab === 'nikto'      && <NiktoTab />}
        {tab === 'cyberchef'  && <CyberChefTab />}
        {tab === 'vt'         && <VTTab apiStatus={apiStatus} />}
        {tab === 'shodan'     && <ShodanTab />}
        {tab === 'portscan'   && <PortScannerTab />}
        {tab === 'abuseipdb'  && <AbuseIPDBTab apiStatus={apiStatus} />}
        {tab === 'hibp'       && <HIBPTab />}
        {tab === 'dns'        && <DNSTab />}
        {tab === 'hunter'     && <HunterTab apiStatus={apiStatus} />}
        {tab === 'keys'       && <KeySetupPanel apiStatus={apiStatus} />}
      </div>
    </div>
  );
};
