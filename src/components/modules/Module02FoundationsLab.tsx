import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Server,
  Terminal,
  Play,
  CheckCircle2,
  BookOpen,
  Cpu,
  Layers,
  Flame,
  Zap,
  Activity,
  Award,
  RefreshCw,
  Eye,
  FileCheck,
  PowerOff,
  Cloud,
  FileCode,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

interface BaselineComparison {
  cis: {
    benchmark: string;
    control_id: string;
    title: string;
    compliance_status: string;
    remediation: string;
  };
  microsoft: {
    baseline: string;
    feature: string;
    recommendation: string;
    compliance_status: string;
  };
  aws: {
    benchmark: string;
    control_id: string;
    title: string;
    compliance_status: string;
  };
}

interface ConceptItem {
  concept_id: string;
  name: string;
  triad_pillar: string;
  description: string;
  simulated_action: string;
  impact_type: string;
  telemetry_details: {
    process: string;
    command_line: string;
    access_mask?: string;
    target_file?: string;
    sysmon_event_id: number;
    event_type: string;
  };
  baselines: BaselineComparison;
}

interface ModuleData {
  module_id: string;
  title: string;
  track: string;
  description: string;
  units: Array<{
    unit_id: string;
    title: string;
    objectives: string[];
  }>;
  interactive_concepts: ConceptItem[];
}

export const Module02FoundationsLab: React.FC = () => {
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [activeUnitTab, setActiveUnitTab] = useState<string>('UNIT-03');
  const [activeConceptTab, setActiveConceptTab] = useState<string>('CIA-CONFIDENTIALITY');
  const [targetAsset, setTargetAsset] = useState<any>(null);
  const [isRunningAction, setIsRunningAction] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Module 02
    fetch(`${BASE_URL}/modules/02`)
      .then((res) => res.json())
      .then((data) => setModuleData(data))
      .catch((e) => console.warn("Failed to load Module 02:", e));

    // Fetch Active Asset
    fetch(`${BASE_URL}/assets/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.assets && data.assets.length > 0) {
          setTargetAsset(data.assets[0]);
        }
      })
      .catch((e) => console.warn("Failed to load assets:", e));
  }, []);

  const handleExecuteConcept = async (conceptId: string) => {
    setIsRunningAction(true);
    setExecutionResult(null);

    try {
      const res = await fetch(`${BASE_URL}/modules/02/demonstrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept_id: conceptId,
          asset_id: targetAsset?.asset_id
        })
      });

      if (res.ok) {
        const result = await res.json();
        setExecutionResult(result);
        setToastMessage(`Executed ${result.triad_pillar} simulation on ${result.target_hostname}. Baseline analysis generated!`);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } catch (e: any) {
      setToastMessage(`Execution error: ${e.message}`);
    } finally {
      setIsRunningAction(false);
    }
  };

  const currentConcept = moduleData?.interactive_concepts.find(c => c.concept_id === activeConceptTab);

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-purple-950/80 border border-purple-500 text-purple-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Lab Banner */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 font-bold">
              SOC COMPLIANCE &amp; BASELINES
            </span>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
              ● REAL TELEMETRY • CIS / MS / AWS BASELINES
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>MODULE 02 · Foundations: The CIA Triad & Baselines in Live Action</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Compare real endpoint telemetry against CIS Benchmarks, Microsoft Security Baselines, and AWS Foundations.
          </p>
        </div>

        {/* Live Connected Target Host Pill */}
        <div className="p-3 bg-[#121620] border border-[#202736] rounded-xl flex items-center gap-3 font-mono text-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Live Target Machine</div>
            <div className="text-white font-bold text-xs">{targetAsset?.hostname || 'ShadowXLab'} ({targetAsset?.ip_address || '100.95.175.46'})</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-2" />
        </div>
      </div>

      {/* Concept Selector Tabs (All 3 CIA Pillars + Risk) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {[
          { id: 'CIA-CONFIDENTIALITY', label: '1. Confidentiality (Breach)', icon: <Lock className="w-4 h-4 text-purple-400" /> },
          { id: 'CIA-INTEGRITY', label: '2. Integrity (Tampering)', icon: <FileCheck className="w-4 h-4 text-cyan-400" /> },
          { id: 'CIA-AVAILABILITY', label: '3. Availability (Denial)', icon: <PowerOff className="w-4 h-4 text-red-400" /> },
          { id: 'THREAT-VS-VULN', label: '4. Threat vs Vulnerability', icon: <Flame className="w-4 h-4 text-amber-400" /> }
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveConceptTab(c.id);
              setExecutionResult(null);
            }}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeConceptTab === c.id
                ? 'bg-[#182030] border-purple-500 text-white font-bold shadow-xl'
                : 'bg-[#0B0E14] border-[#202736] text-slate-400 hover:text-white'
            }`}
          >
            {c.icon}
            <span className="truncate">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Selected Concept Deep Dive & Live Action */}
      {currentConcept && (
        <div className="space-y-6 font-mono text-xs">
          {/* Main Action & Telemetry Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl">
            {/* Left Column: Concept Definition & Execute Trigger */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-purple-400">
                    {currentConcept.triad_pillar} · Live Laboratory Demonstration
                  </span>
                  <span className="px-2 py-0.5 bg-red-950 text-red-400 rounded text-[9px] font-bold border border-red-500/40">
                    LAB CIDR ONLY
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">{currentConcept.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">{currentConcept.description}</p>
              </div>

              {/* Action Description */}
              <div className="p-3.5 bg-[#121620] rounded-xl border border-[#202736] space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">🎯 Simulated Adversary Action:</span>
                <code className="text-amber-300 text-[11px] block break-all">{currentConcept.simulated_action}</code>
                <div className="text-[10px] text-red-400 pt-1">Impact: {currentConcept.impact_type}</div>
              </div>

              {/* Action Execution Button */}
              <button
                onClick={() => handleExecuteConcept(currentConcept.concept_id)}
                disabled={isRunningAction}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>{isRunningAction ? 'Executing on Target Machine...' : `Execute Live ${currentConcept.triad_pillar} Action & Pull Telemetry`}</span>
              </button>
            </div>

            {/* Right Column: Real Ingested Telemetry Canvas */}
            <div className="bg-[#080A0E] border border-[#202736] rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#202736]">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Real Ingested Telemetry (29-Field Normalizer)</span>
                </span>
                <span className={`text-[10px] font-bold ${executionResult ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {executionResult ? '● LIVE TELEMETRY STORED' : 'WAITING FOR EXECUTION'}
                </span>
              </div>

              {executionResult ? (
                <div className="space-y-3 text-[11px]">
                  <div className="p-3 bg-[#121620] border border-emerald-500/40 rounded-xl space-y-1">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Canonical 29-Field ShadowEvent Proof Ingested</span>
                    </div>
                    <div className="text-slate-300 text-[10px]">
                      Event ID: <code className="text-cyan-300">{executionResult.telemetry_proof.event_id}</code>
                    </div>
                    <div className="text-slate-300 text-[10px]">
                      Target Endpoint: <span className="text-white font-bold">{executionResult.target_hostname}</span> ({executionResult.target_ip})
                    </div>
                  </div>

                  {/* Telemetry Key-Value Pairs */}
                  <div className="space-y-1.5 p-3 bg-[#0B0E14] rounded-xl border border-[#202736] text-slate-300 text-[10px]">
                    <div><span className="text-slate-500 font-bold">Process: </span><span className="text-white">{executionResult.telemetry_proof.process}</span></div>
                    <div><span className="text-slate-500 font-bold">Command Line: </span><code className="text-amber-300">{executionResult.telemetry_proof.command_line}</code></div>
                    {executionResult.telemetry_proof.access_mask && (
                      <div><span className="text-slate-500 font-bold">Access Mask: </span><span className="text-purple-300 font-mono">{executionResult.telemetry_proof.access_mask}</span></div>
                    )}
                    {executionResult.telemetry_proof.target_file && (
                      <div><span className="text-slate-500 font-bold">Target Resource: </span><span className="text-cyan-300">{executionResult.telemetry_proof.target_file}</span></div>
                    )}
                    <div><span className="text-slate-500 font-bold">Sysmon Event ID: </span><span className="text-emerald-400 font-bold">{executionResult.telemetry_proof.sysmon_event_id}</span></div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-600 space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-slate-700" />
                  <div>Click the button on the left to execute the action on the live target.</div>
                  <div className="text-[10px] text-slate-600">The Edge Agent will capture real process creation, file access, and socket telemetry.</div>
                </div>
              )}

              <div className="pt-2 border-t border-[#182030] flex items-center justify-between text-[10px] text-slate-500">
                <span>Collector: Sysmon / Auditd</span>
                <span>Provenance: Control Plane Event Bus</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Baseline & Compliance Analysis Grid */}
          <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202736]">
              <div>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                  Security Benchmark & Baseline Analysis
                </span>
                <h3 className="text-base font-black text-white">
                  HOW THIS {currentConcept.triad_pillar.toUpperCase()} ISSUE COMPARES AGAINST INDUSTRY STANDARDS
                </h3>
              </div>

              <span className="text-slate-400 text-[10px]">
                Standards: CIS Controls • Microsoft Baseline • CIS AWS Foundations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. CIS Benchmark Card */}
              <div className="bg-[#121620] border border-[#202736] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-purple-500/60 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>CIS Benchmark</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-950 border border-red-500/40 text-red-400 uppercase">
                      {currentConcept.baselines.cis.compliance_status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{currentConcept.baselines.cis.control_id}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{currentConcept.baselines.cis.title}</p>
                </div>

                <div className="p-2.5 bg-[#080A0E] rounded-lg border border-[#182030] text-[10px] space-y-1">
                  <span className="text-slate-500 font-bold uppercase block">Remediation Command:</span>
                  <code className="text-emerald-400 block break-all">{currentConcept.baselines.cis.remediation}</code>
                </div>
              </div>

              {/* 2. Microsoft Security Baseline Card */}
              <div className="bg-[#121620] border border-[#202736] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-500/60 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Microsoft Baseline</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-950 border border-blue-500/40 text-blue-400 uppercase">
                      {currentConcept.baselines.microsoft.compliance_status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{currentConcept.baselines.microsoft.feature}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{currentConcept.baselines.microsoft.recommendation}</p>
                </div>

                <div className="p-2.5 bg-[#080A0E] rounded-lg border border-[#182030] text-[10px] space-y-1">
                  <span className="text-slate-500 font-bold uppercase block">Architecture Layer:</span>
                  <span className="text-slate-300">Virtualization-Based Security (VBS) & Kernel LSA Isolation</span>
                </div>
              </div>

              {/* 3. CIS AWS Foundations Card */}
              <div className="bg-[#121620] border border-[#202736] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/60 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>AWS Cloud Benchmark</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-400 uppercase">
                      {currentConcept.baselines.aws.compliance_status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{currentConcept.baselines.aws.control_id}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{currentConcept.baselines.aws.title}</p>
                </div>

                <div className="p-2.5 bg-[#080A0E] rounded-lg border border-[#182030] text-[10px] space-y-1">
                  <span className="text-slate-500 font-bold uppercase block">Cloud Control:</span>
                  <span className="text-slate-300">IAM Instance Profile / KMS Key Envelope Encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
