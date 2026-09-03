import React from 'react';
import { Radio, Clock, Shield, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export interface SourceOfTruthData {
  metric: string;
  value: string | number;
  source: string;
  last_updated?: string;
  freshness?: 'LIVE' | 'STALE' | 'N/A';
  status?: 'LIVE' | 'DEGRADED' | 'DISCONNECTED' | 'INITIALIZING' | 'N/A';
  confidence?: number; // 0.0 to 1.0
}

interface SourceOfTruthWidgetProps {
  data: SourceOfTruthData;
  icon?: React.ReactNode;
  subtitle?: string;
}

export const SourceOfTruthWidget: React.FC<SourceOfTruthWidgetProps> = ({
  data,
  icon,
  subtitle
}) => {
  const isAvailable = data.value !== 'N/A' && data.value !== undefined && data.value !== null;
  const isLive = data.status === 'LIVE' || data.freshness === 'LIVE';

  return (
    <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 font-sans transition hover:border-[#303B52]">
      {/* Top Row: Metric Name & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-purple-400">{icon}</div>}
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            {data.metric}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
          {isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </span>
          ) : data.status === 'DEGRADED' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>DEGRADED</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
              N/A
            </span>
          )}
        </div>
      </div>

      {/* Center: Real Value */}
      <div>
        <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isAvailable ? 'text-white' : 'text-slate-600'}`}>
          {isAvailable ? data.value : 'N/A'}
        </div>
        {subtitle && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{subtitle}</div>}
      </div>

      {/* Bottom: Provenance, Freshness & Confidence */}
      <div className="pt-2 border-t border-[#182030] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="truncate max-w-[140px]" title={`Source: ${data.source}`}>
          Src: <span className="text-slate-400 font-bold">{data.source}</span>
        </span>

        {data.confidence !== undefined && (
          <span className="text-purple-400 font-bold">
            {(data.confidence * 100).toFixed(0)}% Conf
          </span>
        )}
      </div>
    </div>
  );
};
