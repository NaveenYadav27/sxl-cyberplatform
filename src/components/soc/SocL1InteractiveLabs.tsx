import React, { useState } from 'react';
import {
  Shield, ExternalLink, Maximize2, Minimize2, RotateCcw,
  Monitor, Sparkles, CheckCircle2, ArrowLeft
} from 'lucide-react';

export const SocL1InteractiveLabs: React.FC = () => {
  const [key, setKey] = useState(0);
  const [isDedicatedMode, setIsDedicatedMode] = useState(false);

  const handleReset = () => {
    setKey(prev => prev + 1);
  };

  const toggleDedicated = () => {
    setIsDedicatedMode(prev => !prev);
  };

  return (
    <div className={`font-sans flex flex-col w-full ${isDedicatedMode ? 'fixed inset-0 z-50 bg-[#070A0D] w-screen h-screen overflow-hidden' : 'h-[calc(100vh-60px)]'}`}>
      {/* ── Top Slim Action Strip ── */}
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 transition-colors ${
        isDedicatedMode
          ? 'bg-[#080A0E] border-[#1A2035] text-white shadow-xl'
          : 'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-[#1A2035]'
      }`}>
        <div className="flex items-center gap-2.5">
          {isDedicatedMode && (
            <button
              onClick={toggleDedicated}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-semibold mr-1 transition"
              title="Return to Control Plane Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Dedicated</span>
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-[#E31E24] flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-950/20">
            SX
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              SOC Analyst Interactive Labs &amp; Simulators
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400">
              45 Modules
            </span>
            <span className="hidden md:inline text-[11px] text-slate-400 font-mono">
              • V8 Network Sequence to pfSense &amp; Full Simulators
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dedicated Fullscreen Toggle */}
          <button
            onClick={toggleDedicated}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
              isDedicatedMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-[#E31E24] hover:bg-[#ff3d3d] text-white'
            }`}
            title={isDedicatedMode ? 'Exit full screen mode' : 'Expand lab to 100% full screen edge-to-edge'}
          >
            {isDedicatedMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full Page</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Separate Full Page</span>
              </>
            )}
          </button>

          {/* Reset Active Simulator */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#121827] border border-slate-200 dark:border-[#232F46] text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white text-xs font-semibold transition"
            title="Reset active lab session"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Open in Standalone Browser Window/Tab */}
          <a
            href="/soc-interactive-labs.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-xs font-bold"
            title="Open standalone page in a completely separate browser window without outer navigation"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Standalone Tab</span>
          </a>
        </div>
      </div>

      {/* ── Direct Iframe Workspace (Full Viewport Edge-to-Edge) ── */}
      <div className="flex-1 w-full h-full min-h-0 bg-[#070A0D]">
        <iframe
          key={key}
          src="/soc-interactive-labs.html"
          title="ShadowX SOC Interactive Labs"
          className="w-full h-full border-none block"
        />
      </div>
    </div>
  );
};
