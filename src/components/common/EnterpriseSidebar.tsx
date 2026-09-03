import React from 'react';
import {
  Shield, Server, Radio, Terminal, Activity, Flame, HeartPulse,
  BookOpen, FileCheck, LayoutDashboard, Cpu, Search, Key, Wifi, Lock, X, Menu,
  Zap, BarChart3, Boxes
} from 'lucide-react';

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'COMMAND CENTER',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'soclabs',   label: 'SOC Analyst Labs (45)', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'soc',       label: 'SOC Tool Suite', icon: <Shield className="w-4 h-4" /> },
      { id: 'sca',       label: 'Security Baseline', icon: <FileCheck className="w-4 h-4" /> },
      { id: 'purple',    label: 'Purple Exercise', icon: <Flame className="w-4 h-4" /> },
    ]
  },
  {
    label: 'EDR & RESPONSE',
    items: [
      { id: 'workbench', label: 'Falcon EDR Workbench', icon: <Zap className="w-4 h-4" /> },
      { id: 'rtr',       label: 'RTR Terminal', icon: <Terminal className="w-4 h-4" /> },
      { id: 'health',    label: 'System Health', icon: <HeartPulse className="w-4 h-4" /> },
    ]
  },
  {
    label: 'INFRASTRUCTURE',
    items: [
      { id: 'vbox',    label: 'VirtualBox Lab Range', icon: <Boxes className="w-4 h-4" /> },
      { id: 'proxmox', label: 'Proxmox Cluster', icon: <Server className="w-4 h-4" /> },
      { id: 'agents',  label: 'Edge Agents', icon: <Radio className="w-4 h-4" /> },
    ]
  },
];

export const EnterpriseSidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, collapsed, onToggle }) => {
  if (collapsed) {
    return (
      <div className="fixed left-0 top-0 bottom-0 w-14 bg-white dark:bg-[#080A0E] border-r border-slate-200 dark:border-[#1A2035] z-40 flex flex-col items-center pt-4 gap-3 transition-colors">
        <button onClick={onToggle} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0D1117] border border-slate-200 dark:border-[#1A2035] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-[#E31E24]/50 transition" title="Expand Sidebar">
          <Menu className="w-4 h-4" />
        </button>
        <div className="w-7 h-px bg-slate-200 dark:bg-[#1A2035] my-1" />
        {NAV_SECTIONS.flatMap(s => s.items).map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            title={item.label}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              activeTab === item.id
                ? 'bg-[#E31E24]/10 text-[#E31E24] border border-[#E31E24]/40 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0D1117]'
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#080A0E] border-r border-slate-200 dark:border-[#1A2035] z-40 flex flex-col overflow-hidden transition-colors">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1A2035] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E31E24] to-[#FF6B3D] flex items-center justify-center font-black text-white text-xs shadow-lg shadow-red-950/30">
            SX
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-bold text-sm leading-none tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Shadow<span className="text-[#E31E24]">X</span>Lab
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest mt-0.5">
              SOC Cyber Range Appliance
            </div>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0D1117]"
          title="Collapse Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 px-3">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="mb-3">
            <div className="text-[9px] text-slate-400 dark:text-slate-600 font-mono uppercase tracking-widest px-2 py-1.5 font-bold">
              {section.label}
            </div>
            {section.items.map(item => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition mb-0.5 ${
                  activeTab === item.id
                    ? 'bg-[#E31E24]/10 text-[#E31E24] dark:text-white border border-[#E31E24]/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0D1117]'
                }`}
              >
                <span className={activeTab === item.id ? 'text-[#E31E24]' : 'text-slate-400 dark:text-slate-600'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
