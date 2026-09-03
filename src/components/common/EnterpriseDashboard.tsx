import React, { useEffect, useState, useRef } from 'react';
import { Shield, Activity, Flame, Server, FileCheck, ArrowRight, Radio, Target, BarChart3, ChevronRight, Zap, AlertTriangle, BookOpen, Boxes } from 'lucide-react';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

interface MetricCard {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
}

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / 30);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(start);
    }, 40);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

export const EnterpriseDashboard: React.FC<{ onTabChange: (t: string) => void }> = ({ onTabChange }) => {
  const [metrics, setMetrics] = useState({ events: 0, detections: 0, cases: 0, assets: 0, score: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [complianceScore, setComplianceScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evRes, asRes, caRes, scRes] = await Promise.allSettled([
          fetch(`${BASE_URL}/telemetry/events?limit=8`),
          fetch(`${BASE_URL}/assets/`),
          fetch(`${BASE_URL}/cases/`),
          fetch(`${BASE_URL}/compliance/scans`),
        ]);

        if (evRes.status === 'fulfilled' && evRes.value.ok) {
          const d = await evRes.value.json();
          const evts = d.events || (Array.isArray(d) ? d : []);
          setEvents(evts);
          setMetrics(m => ({ ...m, events: evts.length }));
          const highs = evts.filter((e: any) => e.severity === 'high' || e.severity === 'critical').length;
          if (highs >= 5) setThreatLevel('CRITICAL');
          else if (highs >= 2) setThreatLevel('HIGH');
          else if (highs >= 1) setThreatLevel('MEDIUM');
          else setThreatLevel('LOW');
        }
        if (asRes.status === 'fulfilled' && asRes.value.ok) {
          const d = await asRes.value.json();
          setMetrics(m => ({ ...m, assets: d.assets?.length || 0 }));
        }
        if (caRes.status === 'fulfilled' && caRes.value.ok) {
          const d = await caRes.value.json();
          setMetrics(m => ({ ...m, cases: d.cases?.length || 0 }));
        }
        if (scRes.status === 'fulfilled' && scRes.value.ok) {
          const d = await scRes.value.json();
          setComplianceScore(d.compliance_score ?? null);
          setMetrics(m => ({ ...m, score: Math.round(d.compliance_score ?? 0) }));
        }
      } catch {}
    };
    fetchAll();
    const iv = setInterval(fetchAll, 20000);
    return () => clearInterval(iv);
  }, []);

  const THREAT_STYLE: Record<string, string> = {
    LOW:      'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
    MEDIUM:   'bg-amber-950/60 border-amber-500/40 text-amber-400',
    HIGH:     'bg-red-950/60 border-red-500/50 text-red-400',
    CRITICAL: 'bg-red-900/80 border-red-400/60 text-red-300 animate-pulse',
  };

  const KPI: MetricCard[] = [
    { label: 'Live Telemetry Events', value: metrics.events, sub: '29-field canonical logs', color: 'text-cyan-400', glow: 'shadow-cyan-950', icon: <Radio className="w-5 h-5" /> },
    { label: 'Active Target Hosts',   value: metrics.assets, sub: 'Edge agent endpoints',  color: 'text-blue-400',  glow: 'shadow-blue-950', icon: <Server className="w-5 h-5" /> },
    { label: 'Open SOC Cases',        value: metrics.cases,  sub: 'TheHive investigations', color: 'text-purple-400', glow: 'shadow-purple-950', icon: <Activity className="w-5 h-5" /> },
    { label: 'Compliance Score',      value: complianceScore !== null ? `${Math.round(complianceScore)}%` : 'N/A', sub: 'CIS / ASB baseline', color: 'text-emerald-400', glow: 'shadow-emerald-950', icon: <FileCheck className="w-5 h-5" /> },
    { label: 'Purple Score',          value: metrics.score + '%', sub: 'Evidence evaluation', color: 'text-orange-400', glow: 'shadow-orange-950', icon: <Flame className="w-5 h-5" /> },
  ];

  const QUICK_LAUNCH = [
    { id: 'soclabs',   label: 'SOC Analyst Labs (45)', sub: '45 Interactive Labs & pfSense', icon: <BookOpen className="w-5 h-5" />, color: 'from-[#E31E24] to-[#FF6B3D]' },
    { id: 'soc',       label: 'SOC Tool Suite',        sub: 'CyberChef · VT · Shodan · HIBP',  icon: <Shield className="w-5 h-5" />, color: 'from-purple-600 to-indigo-800' },
    { id: 'workbench', label: 'Falcon EDR Workbench',  sub: 'Incident triage · alerts',          icon: <Zap className="w-5 h-5" />,    color: 'from-amber-600 to-amber-800' },
    { id: 'vbox',      label: 'VirtualBox Lab Range',  sub: 'Hypervisor & Live Target VMs',    icon: <Boxes className="w-5 h-5" />,   color: 'from-emerald-600 to-teal-800' },
    { id: 'sca',       label: 'Security Baseline',     sub: 'Wazuh SCA · ASB · CIS',             icon: <FileCheck className="w-5 h-5" />, color: 'from-blue-600 to-blue-800' },
    { id: 'purple',    label: 'Purple Exercise',        sub: 'Red + Blue team scenarios',         icon: <Flame className="w-5 h-5" />,   color: 'from-purple-600 to-purple-800' },
    { id: 'proxmox',   label: 'Proxmox Cluster',       sub: 'Cluster Range & Node Controls',   icon: <Server className="w-5 h-5" />,  color: 'from-cyan-600 to-blue-800' },
    { id: 'rtr',       label: 'RTR Terminal',           sub: 'Live remote shell',                 icon: <Target className="w-5 h-5" />,  color: 'from-slate-600 to-slate-800' },
  ];

  const SEV_COLOR: Record<string, string> = {
    critical: 'bg-red-950/80 border-red-500/50 text-red-300',
    high:     'bg-red-950/60 border-red-500/40 text-red-400',
    medium:   'bg-amber-950/60 border-amber-500/40 text-amber-400',
    low:      'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
    info:     'bg-blue-950/60 border-blue-500/30 text-blue-400',
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Threat Level Banner */}
      <div className={`rounded-2xl border p-4 flex items-center justify-between ${THREAT_STYLE[threatLevel]}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <div className="font-black text-sm tracking-widest uppercase">Threat Level: {threatLevel}</div>
            <div className="text-xs opacity-70 mt-0.5">ShadowXLab Cyber Range · Enterprise SOC Analyst Appliance · Real-Time Intelligence</div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPI.map((k, i) => (
          <div key={i} className={`bg-[#0B1120] border border-[#1A2035] rounded-2xl p-5 shadow-xl hover:border-[#E31E24]/30 transition group`}>
            <div className={`${k.color} mb-3 opacity-80 group-hover:opacity-100 transition`}>{k.icon}</div>
            <div className={`text-2xl font-black ${k.color} tracking-tight`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {typeof k.value === 'number' ? <AnimatedNumber target={k.value} /> : k.value}
            </div>
            <div className="text-xs text-white font-semibold mt-1">{k.label}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Launch Grid + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch (2/3 width) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E31E24]" /> Quick Launch
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LAUNCH.map(q => (
              <button key={q.id} onClick={() => onTabChange(q.id)}
                className="group bg-[#0B1120] border border-[#1A2035] rounded-2xl p-4 text-left hover:border-[#E31E24]/40 hover:bg-[#0D1525] transition flex flex-col gap-2">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center text-white shadow-lg`}>
                  {q.icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-xs leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{q.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">{q.sub}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#E31E24] group-hover:translate-x-0.5 transition mt-auto" />
              </button>
            ))}
          </div>

          {/* Learning Loop */}
          <div className="bg-[#0B1120] border border-[#1A2035] rounded-2xl p-5">
            <div className="text-xs text-slate-400 font-mono uppercase tracking-widest font-bold mb-4">SOC Incident Investigation Cycle</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['SEE', 'LEARN', 'OPERATE', 'VALIDATE', 'PROVE', 'CHAIN'].map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#E31E24]/10 border border-[#E31E24]/30 flex items-center justify-center text-[#E31E24] font-black text-[10px] font-mono">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-white font-bold font-mono">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Activity Feed (1/3 width) */}
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <Radio className="w-3 h-3 text-[#E31E24] animate-pulse" /> Live Event Feed
          </div>
          <div className="bg-[#0B1120] border border-[#1A2035] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#1A2035]">
              {events.length > 0 ? events.slice(0, 8).map((e, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-[#0D1525] transition">
                  <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded border font-bold font-mono mt-0.5 ${SEV_COLOR[e.severity || 'info']}`}>
                    {(e.severity || 'info').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-white font-semibold truncate">{e.event_type || e.process || 'Activity'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{e.hostname || 'ShadowXLab'} · {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'now'}</div>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-8 text-center text-slate-600 text-xs font-mono">
                  Waiting for live agent telemetry events...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
