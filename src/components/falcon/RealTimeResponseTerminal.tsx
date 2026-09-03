import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Laptop,
  Server,
  Shield,
  Play,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { FalconAPI } from '../../services/falconApi';

interface RealTimeResponseTerminalProps {
  initialAid?: string;
}

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

export const RealTimeResponseTerminal: React.FC<RealTimeResponseTerminalProps> = ({ initialAid }) => {
  const [activeHosts, setActiveHosts] = useState<string[]>([]);
  const [selectedAid, setSelectedAid] = useState<string>(initialAid || 'ShadowXLab');
  const [inputCommand, setInputCommand] = useState<string>('ps');
  const [terminalHistory, setTerminalHistory] = useState<{ command: string; output: string; timestamp: string }[]>([
    {
      command: 'session_init',
      output: `[Falcon RTR] Real-Time Response session established with ${initialAid || 'ShadowXLab'}.
Authentication: Certificate-based TLS 1.3
Permissions: Administrator / SYSTEM Level
Type 'help' for available Real-Time Response commands.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch live connected assets
    fetch(`${BASE_URL}/assets/`)
      .then((res) => res.json())
      .then((data) => {
        const hosts = (data.assets || []).map((a: any) => a.hostname || a.asset_id);
        if (hosts.length > 0) {
          setActiveHosts(hosts);
          if (!initialAid) {
            setSelectedAid(hosts[0]);
          }
        }
      })
      .catch((e) => console.warn("Failed to fetch assets for RTR:", e));
  }, [initialAid]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCommand.trim()) return;

    const cmd = inputCommand.trim();
    setIsExecuting(true);

    if (cmd.toLowerCase() === 'clear') {
      setTerminalHistory([]);
      setInputCommand('');
      setIsExecuting(false);
      return;
    }

    try {
      const res = await FalconAPI.executeRtr(selectedAid, cmd);
      setTerminalHistory((prev) => [
        ...prev,
        {
          command: cmd,
          output: res.output || `Executed '${cmd}' on endpoint ${selectedAid}.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      setTerminalHistory((prev) => [
        ...prev,
        {
          command: cmd,
          output: `Error executing command on ${selectedAid}: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setInputCommand('');
      setIsExecuting(false);
    }
  };

  const runQuickCommand = (cmd: string) => {
    setInputCommand(cmd);
    setTimeout(() => {
      handleExecute();
    }, 50);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Session Target Bar */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Falcon Real-Time Response (RTR)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">Interactive live sensor shell over outbound authenticated TLS tunnel</p>
          </div>
        </div>

        {/* Dynamic Connected Host Buttons */}
        <div className="flex items-center gap-2 bg-[#080A0E] p-1.5 rounded-xl border border-[#202736]">
          {(activeHosts.length > 0 ? activeHosts : ['ShadowXLab']).map((host) => (
            <button
              key={host}
              onClick={() => {
                setSelectedAid(host);
                setTerminalHistory((prev) => [
                  ...prev,
                  {
                    command: `connect ${host}`,
                    output: `[Falcon RTR] Connected to endpoint ${host}. Session ready.`,
                    timestamp: new Date().toLocaleTimeString()
                  }
                ]);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                selectedAid === host
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{host}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Container */}
      <div className="bg-[#080A0E] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col min-h-[500px]">
        {/* Terminal Header */}
        <div className="bg-[#0B0E14] px-5 py-3 border-b border-[#202736] flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>FALCON RTR // SESSION: {selectedAid}</span>
          </div>

          {/* Quick Command Pills */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-500 uppercase font-bold hidden md:inline">Quick RTR:</span>
            {['ps', 'netstat', 'contain', 'lift_contain', 'help'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => runQuickCommand(cmd)}
                className="px-2 py-0.5 bg-[#182030] hover:bg-[#222C42] text-slate-300 rounded border border-[#303B52] transition"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Output Log Canvas */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-slate-300 leading-relaxed max-h-[460px]">
          {terminalHistory.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400">
                <span className="text-slate-500">[{item.timestamp}]</span>
                <span className="font-bold text-white">$ {item.command}</span>
              </div>
              <pre className="p-3 bg-[#0B0E14] rounded-xl border border-[#182030] text-[11px] font-mono text-slate-200 whitespace-pre-wrap">
                {item.output}
              </pre>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleExecute} className="p-4 bg-[#0B0E14] border-t border-[#202736] flex items-center gap-3">
          <span className="text-purple-400 font-black text-sm">$</span>
          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            placeholder="Type RTR command (e.g. ps, netstat, kill <PID>, contain)..."
            disabled={isExecuting}
            className="flex-1 bg-[#080A0E] border border-[#202736] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={isExecuting || !inputCommand.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
