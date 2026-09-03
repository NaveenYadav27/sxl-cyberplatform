import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Flame,
  Terminal,
  Lock,
  Unlock,
  Radio,
  FileText,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Hash,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  Check,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FalconDetection, FalconProcessTreeNode } from '../../types/falcon';
import { FalconAPI } from '../../services/falconApi';

interface IncidentWorkbenchProps {
  onOpenRtr: (aid: string) => void;
}

export const IncidentWorkbench: React.FC<IncidentWorkbenchProps> = ({ onOpenRtr }) => {
  const [detections, setDetections] = useState<FalconDetection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<FalconDetection | null>(null);
  const [processTree, setProcessTree] = useState<FalconProcessTreeNode | null>(null);
  const [selectedProcessNode, setSelectedProcessNode] = useState<FalconProcessTreeNode | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'ioa' | 'network' | 'intel'>('graph');
  const [isLoading, setIsLoading] = useState(false);
  const [isContained, setIsContained] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const fetchDetections = async () => {
    setIsLoading(true);
    try {
      const data = await FalconAPI.getDetections();
      setDetections(data || []);
      if (data && data.length > 0) {
        const first = data[0];
        setSelectedDetection(first);
        const treeData = await FalconAPI.getDetectionTree(first.detection_id);
        if (treeData && treeData.root_process) {
          setProcessTree(treeData.root_process);
          // Auto select malicious node
          const threatNode = treeData.root_process.children?.[0]?.children?.[0] || treeData.root_process;
          setSelectedProcessNode(threatNode);
        }
      }
    } catch (e) {
      console.warn("Falcon detections fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, []);

  const handleToggleContainment = async () => {
    if (!selectedDetection) return;
    try {
      const res = await FalconAPI.toggleContainment(selectedDetection.aid);
      setIsContained(res.containment_status === 'contained');
      setActionToast(res.message);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => setActionToast(null), 4000);
    } catch (e: any) {
      setActionToast(`Containment failed: ${e.message}`);
    }
  };

  const renderProcessNode = (node: FalconProcessTreeNode, depth = 0) => {
    const isSelected = selectedProcessNode?.pid === node.pid;
    return (
      <div key={node.pid} className="space-y-1">
        <div
          onClick={() => setSelectedProcessNode(node)}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          className={`py-3 pr-4 rounded-xl cursor-pointer transition flex items-center justify-between font-mono text-xs ${
            isSelected
              ? 'bg-[#182030] border-2 border-red-500 text-white shadow-xl shadow-red-950/40 scale-[1.01]'
              : node.is_ioa
              ? 'bg-red-950/40 border border-red-500/60 text-red-300 hover:bg-red-900/50'
              : 'hover:bg-[#121620] text-slate-300 border border-[#202736]'
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            {node.children && node.children.length > 0 ? (
              <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}
            <span className="text-slate-500 font-bold">PID {node.pid}</span>
            <span className="font-black text-white text-sm truncate">{node.name}</span>
            {node.is_ioa && (
              <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-500/60 rounded text-[9px] font-bold uppercase animate-pulse">
                IOA TRIGGER
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500 hidden sm:inline">{node.user}</span>
            <span className="text-slate-400 font-bold">{node.signature}</span>
          </div>
        </div>

        {node.children && node.children.map((child) => renderProcessNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {actionToast && (
        <div className="p-3.5 bg-red-950/80 border border-red-500 text-red-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">{actionToast}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Incident Header (CrowdStrike Falcon Detection Banner) */}
      {selectedDetection && (
        <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202736]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/40 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-950">
                {selectedDetection.score}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-400 font-mono text-[10px] font-bold uppercase">
                    {selectedDetection.severity} IOA
                  </span>
                  <span className="text-slate-500 text-xs font-mono">ID: {selectedDetection.detection_id}</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
                  {selectedDetection.ioa_name}
                </h1>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => onOpenRtr(selectedDetection.aid)}
                className="px-4 py-2 bg-[#182030] hover:bg-[#222C42] text-purple-300 border border-purple-500/40 rounded-xl font-bold transition flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                <span>Connect via RTR</span>
              </button>

              <button
                onClick={handleToggleContainment}
                className={`px-5 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg ${
                  isContained
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-[#E01A22] hover:bg-red-600 text-white shadow-red-950'
                }`}
              >
                {isContained ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isContained ? 'Lift Network Containment' : 'Network Contain Host'}</span>
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Host / Sensor</span>
              <span className="text-white font-bold">{selectedDetection.hostname}</span>
            </div>
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Tactic / Objective</span>
              <span className="text-purple-300 font-bold">{selectedDetection.tactic}</span>
            </div>
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">MITRE Technique</span>
              <span className="text-amber-300 font-bold">{selectedDetection.technique_id}</span>
            </div>
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Attributed Adversary</span>
              <span className="text-red-400 font-bold">{selectedDetection.adversary}</span>
            </div>
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">User Context</span>
              <span className="text-cyan-300 font-bold">{selectedDetection.user_name}</span>
            </div>
            <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Containment State</span>
              <span className={isContained ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isContained ? '● CONTAINED' : '● NORMAL'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Workbench: Process Lineage Graph & Execution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Process Lineage Tree Graph */}
        <div className="lg:col-span-2 bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl space-y-4 flex flex-col min-h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#202736] font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white uppercase tracking-wider text-sm">
                Incident Process Lineage Graph
              </span>
              <span className="px-2 py-0.5 rounded bg-[#182030] text-red-400 border border-red-500/30 font-bold text-[10px]">
                Execution Flow
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">Click any node to inspect execution telemetry</span>
          </div>

          {/* Process Tree Display */}
          <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-[#080A0E] rounded-xl border border-[#182030]">
            {processTree ? (
              renderProcessNode(processTree)
            ) : (
              <div className="text-center py-20 text-slate-500 font-mono text-xs">Loading Falcon Process Tree...</div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Process Execution Details & Artifacts */}
        <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#202736]">
              <div>
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                  Process Artifact Inspector
                </span>
                <h3 className="text-base font-black text-white">{selectedProcessNode?.name || 'explorer.exe'}</h3>
              </div>
              {selectedProcessNode && (
                <span className="px-2.5 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-bold">
                  PID {selectedProcessNode.pid}
                </span>
              )}
            </div>

            {selectedProcessNode && (
              <div className="space-y-4 pt-3">
                {/* Threat Banner */}
                {selectedProcessNode.is_ioa && (
                  <div className="p-3 bg-red-950/60 border border-red-500 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>INDICATOR OF ATTACK (IOA)</span>
                    </div>
                    <p className="text-[11px] text-red-300">{selectedProcessNode.ioa_title}</p>
                  </div>
                )}

                {/* File Information */}
                <div className="space-y-2 bg-[#121620] p-3.5 rounded-xl border border-[#202736]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Signing Status:</span>
                    <span className="text-emerald-400 font-bold">{selectedProcessNode.signature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Context:</span>
                    <span className="text-purple-300 font-bold">{selectedProcessNode.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tactic / ID:</span>
                    <span className="text-amber-300 font-bold">{selectedProcessNode.tactic || 'Execution'} ({selectedProcessNode.technique || 'T1059.001'})</span>
                  </div>
                </div>

                {/* Command Line String */}
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                    Exact Command Line Execution:
                  </span>
                  <div className="p-3 bg-[#080A0E] rounded-lg border border-[#202736] text-amber-300 text-[11px] break-all leading-relaxed max-h-28 overflow-y-auto">
                    {selectedProcessNode.command_line}
                  </div>
                </div>

                {/* SHA-256 Hash */}
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                    SHA-256 Binary Hash:
                  </span>
                  <div className="p-2 bg-[#080A0E] rounded-lg border border-[#202736] text-cyan-300 text-[10px] truncate">
                    {selectedProcessNode.sha256}
                  </div>
                </div>

                {/* Network Connections */}
                {selectedProcessNode.network_connections && selectedProcessNode.network_connections.length > 0 && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                      Network Sockets (C2 Beacon):
                    </span>
                    <div className="p-2.5 bg-[#080A0E] rounded-lg border border-red-500/40 text-red-300 text-[11px] space-y-1">
                      {selectedProcessNode.network_connections.map((c, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{c.proto} {c.local_ip}:{c.local_port}</span>
                          <span className="text-red-400 font-bold">➔ {c.remote_ip}:{c.remote_port} ({c.state})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
