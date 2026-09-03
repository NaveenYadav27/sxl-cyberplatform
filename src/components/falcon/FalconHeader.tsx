import React from 'react';
import { Shield, Radio, Server, Terminal, Flame, Search, Bell, User, Lock, Activity, Zap } from 'lucide-react';

interface FalconHeaderProps {
  activeTab: 'workbench' | 'hosts' | 'rtr' | 'intel';
  setActiveTab: (tab: 'workbench' | 'hosts' | 'rtr' | 'intel') => void;
  containedCount: number;
  onOpenProxmox: () => void;
}

export const FalconHeader: React.FC<FalconHeaderProps> = ({
  activeTab,
  setActiveTab,
  containedCount,
  onOpenProxmox
}) => {
  return (
    <header className="bg-[#0B0E14] border-b border-[#202736] sticky top-0 z-50 text-slate-200 select-none">
      <div className="max-w-[1700px] mx-auto px-6 h-14 flex items-center justify-between gap-6">
        
        {/* Left: CrowdStrike Falcon Logo & CID */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E01A22] to-[#8A0006] flex items-center justify-center text-white font-black shadow-lg shadow-red-950/60 border border-red-500/40">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-white tracking-tight">CROWD<span className="text-[#E01A22]">STRIKE</span></span>
                <span className="text-[10px] font-mono uppercase bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">
                  FALCON® EDR
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#202736] text-[11px] font-mono text-slate-400">
            <span>CID:</span>
            <span className="text-slate-200 font-bold">SHADOWXLAB-ENTERPRISE-PROD</span>
          </div>
        </div>

        {/* Center: Main Falcon Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-mono font-bold">
          {[
            { id: 'workbench', label: 'Incident Workbench', icon: <Activity className="w-3.5 h-3.5 text-[#E01A22]" /> },
            { id: 'hosts', label: 'Host Management (Sensors)', icon: <Server className="w-3.5 h-3.5 text-cyan-400" /> },
            { id: 'rtr', label: 'Real-Time Response (RTR)', icon: <Terminal className="w-3.5 h-3.5 text-purple-400" /> },
            { id: 'intel', label: 'Falcon Intelligence', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#182030] text-white border border-[#303B52] shadow-md shadow-black/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#121620]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Proxmox Connector Trigger, Sensor Health Badge, Containment Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenProxmox}
            className="px-3 py-1.5 bg-orange-950/60 hover:bg-orange-900/80 border border-orange-500/50 text-orange-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-950"
          >
            <Server className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Proxmox VE</span>
          </button>

          {containedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/60 rounded-lg text-red-400 text-xs font-mono font-bold animate-pulse">
              <Lock className="w-3.5 h-3.5" />
              <span>{containedCount} Host Contained</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#121620] border border-[#202736] rounded-lg text-emerald-400 text-xs font-mono font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Sensors:</span>
            <span>100% HEALTHY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
