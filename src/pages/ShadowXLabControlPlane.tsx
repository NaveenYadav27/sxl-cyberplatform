import React, { useState, useEffect } from 'react';
import {
  Shield, Server, Radio, Terminal, Activity, Flame, HeartPulse,
  BookOpen, FileCheck, Globe, Cpu, Layers, Search, Lock, Unlock,
  Award, Key, BarChart3, Bell, ChevronDown, Menu, Zap, LayoutDashboard
} from 'lucide-react';

import { EnterpriseSidebar }    from '../components/common/EnterpriseSidebar';
import { CrossDomainNav }       from '../components/common/CrossDomainNav';
import { EnterpriseDashboard }  from '../components/common/EnterpriseDashboard';
import { SocPlatformWorkspace } from '../components/soc/SocPlatformWorkspace';
import { IncidentWorkbench }    from '../components/falcon/IncidentWorkbench';
import { ProxmoxClusterView }   from '../components/infrastructure/ProxmoxClusterView';
import { EdgeAgentManager }     from '../components/infrastructure/EdgeAgentManager';
import { VirtualBoxLabWorkbench } from '../components/infrastructure/VirtualBoxLabWorkbench';
import { PurpleExerciseWorkbench } from '../components/purple/PurpleExerciseWorkbench';
import { SystemHealthCenter }   from '../components/health/SystemHealthCenter';
import { RealTimeResponseTerminal } from '../components/falcon/RealTimeResponseTerminal';
import { Module02FoundationsLab }   from '../components/modules/Module02FoundationsLab';
import { SecurityBaselineScanner }  from '../components/compliance/SecurityBaselineScanner';
import { SocL1InteractiveLabs }     from '../components/soc/SocL1InteractiveLabs';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

type TabId = 'dashboard' | 'soclabs' | 'soc' | 'sca' | 'module02' | 'workbench' | 'proxmox' | 'vbox' | 'agents' | 'purple' | 'rtr' | 'health';

const TAB_LABELS: Record<TabId, string> = {
  dashboard:  'Dashboard',
  soclabs:    'SOC L1 Interactive Labs',
  soc:        'SOC Tool Suite',
  sca:        'Security Baseline',
  module02:   'Module 02 · Foundations',
  workbench:  'Falcon EDR',
  proxmox:    'Proxmox Cluster',
  vbox:       'VirtualBox Lab Range',
  agents:     'Edge Agents',
  purple:     'Purple Exercise',
  rtr:        'RTR Terminal',
  health:     'Health Center',
};



export const ShadowXLabControlPlane: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rtrTarget, setRtrTarget] = useState<string>('ShadowXLab');
  const [notifications, setNotifications] = useState(0);
  const [connectedEndpoint, setConnectedEndpoint] = useState<{ hostname: string; ip: string } | null>(null);

  // Fetch connected endpoint info for top bar
  useEffect(() => {
    const fetchEndpoint = async () => {
      try {
        const res = await fetch(`${BASE_URL}/assets/`);
        if (res.ok) {
          const d = await res.json();
          const assets = d.assets || [];
          if (assets.length > 0) {
            setConnectedEndpoint({ hostname: assets[0].hostname || 'ShadowXLab', ip: assets[0].ip_address || '—' });
          }
        }
      } catch {}
      try {
        const res = await fetch(`${BASE_URL}/detections/?limit=20`);
        if (res.ok) {
          const d = await res.json();
          const det = d.detections || d || [];
          setNotifications(Array.isArray(det) ? det.length : 0);
        }
      } catch {}
    };
    fetchEndpoint();
    const iv = setInterval(fetchEndpoint, 30000);
    return () => clearInterval(iv);
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('shadowx_theme') as 'light' | 'dark') || 'dark';
  });

  // Apply theme to html data-theme attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shadowx_theme', theme);
    // Broadcast to embedded iframe labs
    document.querySelectorAll('iframe').forEach(frame => {
      try {
        frame.contentWindow?.postMessage({ type: 'THEME_CHANGE', theme }, '*');
      } catch {}
    });
  }, [theme]);

  // Listen for theme toggle messages from embedded iframes
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'THEME_CHANGE' && (e.data.theme === 'light' || e.data.theme === 'dark')) {
        setTheme(e.data.theme);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenRtr = (aid: string) => {
    setRtrTarget(aid);
    setActiveTab('rtr');
  };

  const SIDEBAR_WIDTH = sidebarCollapsed ? 56 : 256;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#080A0E] text-slate-200'
      }`}
      style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}
    >

      {/* ── Enterprise Sidebar ── */}
      <EnterpriseSidebar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as TabId)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      {/* ── Main Content (offset by sidebar) ── */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        {/* ── Enterprise Top Bar ── */}
        <header
          className={`sticky top-0 z-30 flex items-center gap-4 px-6 h-14 shrink-0 transition-colors border-b ${
            theme === 'light'
              ? 'border-slate-200 bg-white/95'
              : 'border-[#1A2035] bg-[#080A0E]/85'
          }`}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className={`lg:hidden transition ${theme === 'light' ? 'text-slate-600 hover:text-black' : 'text-slate-400 hover:text-white'}`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={theme === 'light' ? 'text-slate-400 font-bold' : 'text-slate-500'}>ShadowXLab</span>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-slate-600'}>/</span>
            <span className={`font-bold ${theme === 'light' ? 'text-[#E31E24]' : 'text-white'}`}>
              {TAB_LABELS[activeTab]}
            </span>
          </div>

          <div className="flex-1" />

          {/* Connected endpoint badge */}
          {connectedEndpoint && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border ${
              theme === 'light'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">{connectedEndpoint.hostname}</span>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>{connectedEndpoint.ip}</span>
            </div>
          )}

          {/* Sun / Moon Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-amber-600 hover:border-[#E31E24] shadow-sm'
                : 'bg-[#0B1120] border-[#1A2035] text-amber-400 hover:border-[#E31E24]/50'
            }`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Red/White Light Mode'}
          >
            {theme === 'light' ? (
              <span className="text-base" role="img" aria-label="moon">🌙</span>
            ) : (
              <span className="text-base" role="img" aria-label="sun">☀️</span>
            )}
          </button>

          {/* Notification Bell */}
          <button
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-600 hover:text-black hover:border-[#E31E24] shadow-sm'
                : 'bg-[#0B1120] border-[#1A2035] text-slate-400 hover:text-white hover:border-[#E31E24]/40'
            }`}
          >
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E31E24] text-white text-[8px] font-black flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>
        </header>

        {/* ── Tab Content ── */}
        <main className={`flex-1 w-full ${activeTab === 'soclabs' ? 'p-0 max-w-none flex flex-col' : 'px-6 py-6 max-w-[1440px] mx-auto'}`}>
          {activeTab === 'dashboard'  && <EnterpriseDashboard onTabChange={(t) => setActiveTab(t as TabId)} />}
          {activeTab === 'soclabs'    && <SocL1InteractiveLabs />}
          {activeTab === 'soc'        && <SocPlatformWorkspace />}
          {activeTab === 'sca'        && <SecurityBaselineScanner />}
          {activeTab === 'module02'   && <Module02FoundationsLab />}
          {activeTab === 'workbench'  && <IncidentWorkbench onOpenRtr={handleOpenRtr} />}
          {activeTab === 'proxmox'    && <ProxmoxClusterView />}
          {activeTab === 'vbox'       && <VirtualBoxLabWorkbench />}
          {activeTab === 'agents'     && <EdgeAgentManager />}
          {activeTab === 'purple'     && <PurpleExerciseWorkbench />}
          {activeTab === 'rtr'        && <RealTimeResponseTerminal initialAid={rtrTarget} />}
          {activeTab === 'health'     && <SystemHealthCenter />}
        </main>

        {/* ── Enterprise Footer ── */}
        {activeTab !== 'soclabs' && (
          <footer className={`border-t px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono transition-colors ${
            theme === 'light'
              ? 'border-slate-200 text-slate-500 bg-white'
              : 'border-[#1A2035] text-slate-600 bg-[#080A0E]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
                <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-500'}`}>
                  ShadowXLab Cyber Range
                </span>
              </div>
              <span>·</span>
              <span>Enterprise SOC Cyber Range Appliance</span>
              <span>·</span>
              <span className="text-[#E31E24] font-bold">45 SOC Master Labs</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
