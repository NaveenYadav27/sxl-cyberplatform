import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Radio,
  Database,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Cpu,
  Zap
} from 'lucide-react';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

interface SubsystemHealth {
  status: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';
  source: string;
  message?: string;
  offset_ms?: number;
}

interface GlobalHealthData {
  overall_state: 'INITIALIZING' | 'LIVE LAB' | 'DEGRADED' | 'TRAINING SIMULATION';
  is_healthy: boolean;
  banner_alert: string;
  connected_agents_count: number;
  active_assets_count: number;
  ntp_offset_ms: number;
  subsystems: Record<string, SubsystemHealth>;
  timestamp: string;
}

export const SystemHealthCenter: React.FC = () => {
  const [health, setHealth] = useState<GlobalHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.warn("Failed to fetch health state:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              System Health & Operational State
            </span>
            <span className={`w-2 h-2 rounded-full ${health?.is_healthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            SHADOWXLAB GLOBAL HEALTH CENTER
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Source-of-truth verification across Control Plane, Edge Agents, Hypervisors, Telemetry, and NTP synchronization
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={fetchHealth}
            className="p-2.5 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh Health"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Operational State Banner */}
      {health && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between font-mono text-xs shadow-xl ${
            health.overall_state === 'LIVE LAB'
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
              : health.overall_state === 'TRAINING SIMULATION'
              ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
              : 'bg-[#182030] border-purple-500/40 text-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {health.overall_state === 'LIVE LAB' ? '🟢' : health.overall_state === 'TRAINING SIMULATION' ? '🟡' : '🟣'}
            </span>
            <div>
              <span className="font-black uppercase tracking-wider block text-sm">{health.overall_state}</span>
              <span className="text-slate-300 text-[11px]">{health.banner_alert}</span>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 hidden sm:block">
            <div>NTP Clock Offset: <span className="text-white font-bold">{health.ntp_offset_ms} ms</span></div>
            <div>Agents Connected: <span className="text-emerald-400 font-bold">{health.connected_agents_count}</span></div>
          </div>
        </div>
      )}

      {/* Subsystem Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {health?.subsystems &&
          Object.entries(health.subsystems).map(([name, sub]) => {
            const isGreen = sub.status === 'GREEN';
            const isYellow = sub.status === 'YELLOW';
            const isRed = sub.status === 'RED';

            return (
              <div
                key={name}
                className="p-4 bg-[#0B0E14] border border-[#202736] rounded-2xl space-y-2 hover:border-[#303B52] transition shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    {name.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      isGreen
                        ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                        : isYellow
                        ? 'bg-amber-950 border-amber-500/40 text-amber-400'
                        : isRed
                        ? 'bg-red-950 border-red-500/40 text-red-400'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    ● {sub.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {sub.message || `Subsystem operational (Source: ${sub.source})`}
                </p>

                <div className="pt-2 border-t border-[#182030] text-[10px] text-slate-500 flex justify-between">
                  <span>Source: {sub.source}</span>
                  {sub.offset_ms !== undefined && <span>{sub.offset_ms} ms</span>}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
