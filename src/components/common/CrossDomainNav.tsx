import React, { useEffect, useState } from 'react';
import { Radio, ShieldCheck } from 'lucide-react';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export const CrossDomainNav: React.FC = () => {
  const [latestEvent, setLatestEvent] = useState<string>('Waiting for telemetry...');
  const [agentStatus, setAgentStatus] = useState<'ONLINE' | 'OFFLINE' | 'UNKNOWN'>('UNKNOWN');

  useEffect(() => {
    // Fetch latest event for the ticker
    const fetchTicker = async () => {
      try {
        const res = await fetch(`${BASE_URL}/telemetry/events?limit=1`);
        if (res.ok) {
          const data = await res.json();
          const events = data.events || data;
          if (Array.isArray(events) && events.length > 0) {
            const e = events[0];
            setLatestEvent(`[${e.severity?.toUpperCase() || 'INFO'}] ${e.hostname || 'ShadowXLab'} · ${e.event_type || e.process || 'activity detected'} at ${new Date(e.timestamp || Date.now()).toLocaleTimeString()}`);
          }
        }
      } catch {}
      try {
        const res = await fetch(`${BASE_URL}/agents/`);
        if (res.ok) {
          const data = await res.json();
          const agents = data.agents || data;
          setAgentStatus(Array.isArray(agents) && agents.length > 0 ? 'ONLINE' : 'OFFLINE');
        }
      } catch {
        setAgentStatus('OFFLINE');
      }
    };
    fetchTicker();
    const iv = setInterval(fetchTicker, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="h-8 bg-[#060810] border-b border-[#1A2035] flex items-center justify-between px-4 text-[10px] font-mono shrink-0 overflow-hidden">
      {/* Left: Live Threat Ticker */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <Radio className="w-3 h-3 text-[#E31E24] animate-pulse" />
          <span className="text-[#E31E24] font-bold uppercase tracking-widest">LIVE</span>
        </div>
        <div className="h-3 w-px bg-[#1A2035]" />
        <div className="text-slate-400 truncate">{latestEvent}</div>
      </div>

      {/* Right: Agent status + Local Platform Indicator */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Agent Status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${agentStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className={agentStatus === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            AGENT {agentStatus}
          </span>
        </div>

        <div className="h-3 w-px bg-[#1A2035]" />

        {/* Local Range Indicator */}
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Local Hypervisor Engine</span>
        </div>
      </div>
    </div>
  );
};
