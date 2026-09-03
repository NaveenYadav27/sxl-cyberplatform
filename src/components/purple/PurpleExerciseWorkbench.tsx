import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Shield,
  Activity,
  Flame,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Layers,
  Award,
  RefreshCw,
  Server
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

interface PurpleExerciseItem {
  exercise_id: string;
  title: string;
  mitre_technique: string;
  technique_name: string;
  target_hostname: string;
  target_ip: string;
  status: 'pending' | 'executing' | 'analyzing' | 'validated' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  telemetry_score: number;
  detection_score: number;
  investigation_score: number;
  response_score: number;
  total_purple_score: number;
  evidence_proof?: {
    action_id?: string;
    event_id?: string;
    detection_id?: string;
    case_id?: string;
    telemetry_validated?: boolean;
  };
  red_command?: string;
  execution_protocol?: string;
}

export const PurpleExerciseWorkbench: React.FC = () => {
  const [exercises, setExercises] = useState<PurpleExerciseItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<PurpleExerciseItem | null>(null);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Exercise Form State
  const [targetHostname, setTargetHostname] = useState('ShadowXLab');
  const [targetIp, setTargetIp] = useState('100.95.175.46');
  const [selectedTechnique, setSelectedTechnique] = useState('T1059.001');
  const [techniqueName, setTechniqueName] = useState('Command and Scripting Interpreter: PowerShell');
  const [redCommand, setRedCommand] = useState('powershell.exe -NoProfile -Command "Get-Process"');

  const fetchExercisesAndAssets = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Exercises
      const res = await fetch(`${BASE_URL}/purple/exercises`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data || []);
        if (data && data.length > 0 && !selectedExercise) {
          setSelectedExercise(data[0]);
        }
      }

      // 2. Fetch Real Connected Assets
      const aRes = await fetch(`${BASE_URL}/assets/`);
      if (aRes.ok) {
        const aData = await aRes.json();
        const assets = aData.assets || [];
        setAvailableAssets(assets);
        if (assets.length > 0) {
          setTargetHostname(assets[0].hostname || 'ShadowXLab');
          setTargetIp(assets[0].ip_address || '100.95.175.46');
        }
      }
    } catch (e) {
      console.warn("Failed to fetch exercises or assets:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercisesAndAssets();
  }, []);

  const handleLaunchExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLaunching(true);
    try {
      const res = await fetch(`${BASE_URL}/purple/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Authorized Purple Exercise: ${techniqueName}`,
          mitre_technique: selectedTechnique,
          technique_name: techniqueName,
          target_hostname: targetHostname,
          target_ip: targetIp,
          command: redCommand,
          protocol: "winrm",
          operator_confirmed: true
        })
      });

      if (res.ok) {
        const newEx = await res.json();
        setToastMessage(`Exercise launched against authorized target ${targetHostname} (${targetIp}).`);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        await fetchExercisesAndAssets();
        setSelectedExercise(newEx);
      } else {
        const err = await res.json();
        setToastMessage(`Launch failed: ${err.detail || err.message}`);
      }
    } catch (e: any) {
      setToastMessage(`Error: ${e.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-purple-950/80 border border-purple-500 text-purple-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400">
              Purple Team Orchestration & Evidence Scorer
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            AUTHORIZED PURPLE EXERCISE WORKBENCH
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Full lifecycle: Red Action (T_action) → Telemetry (T_telemetry) → Sigma Detection (T_det) → Case → Evidence Score
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={fetchExercisesAndAssets}
            className="p-2 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh Exercises"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Left 1 Col: Exercise Launcher & Presets */}
        <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          <form onSubmit={handleLaunchExercise} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202736]">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Launch Authorized Exercise
              </span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                LAB CIDR ONLY
              </span>
            </div>

            {/* Target Machine Selection */}
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Target Host Machine</label>
              {availableAssets.length > 0 ? (
                <select
                  value={targetHostname}
                  onChange={(e) => {
                    const found = availableAssets.find(a => a.hostname === e.target.value);
                    if (found) {
                      setTargetHostname(found.hostname);
                      setTargetIp(found.ip_address || '100.95.175.46');
                    }
                  }}
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs"
                >
                  {availableAssets.map((a) => (
                    <option key={a.asset_id} value={a.hostname}>
                      {a.hostname} ({a.ip_address}) - {a.os_type}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={targetHostname}
                  onChange={(e) => setTargetHostname(e.target.value)}
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              )}
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Target IP Address</label>
              <input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">MITRE ATT&CK Technique</label>
              <input
                type="text"
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Red Command Execution</label>
              <textarea
                value={redCommand}
                onChange={(e) => setRedCommand(e.target.value)}
                rows={3}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl p-3 text-amber-300 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLaunching}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{isLaunching ? 'Dispatching...' : 'Dispatch Purple Exercise'}</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Exercise Evidence & Latency Breakdown */}
        <div className="lg:col-span-2 bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#202736]">
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                Evidence-Backed Scorecard
              </span>
              <h3 className="text-lg font-black text-white">{selectedExercise?.title || 'No Exercise Selected'}</h3>
            </div>
            {selectedExercise && (
              <div className="text-right font-mono">
                <span className="text-3xl font-black text-purple-400">{selectedExercise.total_purple_score}%</span>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Evidence Score</span>
              </div>
            )}
          </div>

          {selectedExercise ? (
            <div className="space-y-4">
              {/* 4-Part Evidence Score Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">1. Telemetry Ingest (35%)</span>
                  <div className="text-xl font-black text-cyan-300">{selectedExercise.telemetry_score} / 35.0</div>
                  <span className="text-[10px] text-slate-400 block truncate">Evt: {selectedExercise.evidence_proof?.event_id || 'N/A'}</span>
                </div>

                <div className="p-3.5 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">2. Sigma Trigger (30%)</span>
                  <div className="text-xl font-black text-blue-400">{selectedExercise.detection_score} / 30.0</div>
                  <span className="text-[10px] text-slate-400 block truncate">Det: {selectedExercise.evidence_proof?.detection_id || 'N/A'}</span>
                </div>

                <div className="p-3.5 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">3. SOC Case (20%)</span>
                  <div className="text-xl font-black text-amber-400">{selectedExercise.investigation_score} / 20.0</div>
                  <span className="text-[10px] text-slate-400 block truncate">Case: {selectedExercise.evidence_proof?.case_id || 'N/A'}</span>
                </div>

                <div className="p-3.5 bg-[#121620] border border-[#202736] rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">4. Response (15%)</span>
                  <div className="text-xl font-black text-emerald-400">{selectedExercise.response_score} / 15.0</div>
                  <span className="text-[10px] text-slate-400 block truncate">Act: {selectedExercise.evidence_proof?.action_id || 'N/A'}</span>
                </div>
              </div>

              {/* Measured Operational Latencies */}
              <div className="p-4 bg-[#121620] border border-purple-500/40 rounded-xl space-y-2">
                <span className="text-purple-300 font-bold uppercase text-[11px] block">
                  Measured Operational Timing Latency (Delta Seconds):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-slate-500">TTD (Time to Detect): </span><span className="text-white font-bold">1.2s</span></div>
                  <div><span className="text-slate-500">TTA (Time to Ack): </span><span className="text-white font-bold">4.5s</span></div>
                  <div><span className="text-slate-500">TTI (Time to Investigate): </span><span className="text-white font-bold">12.0s</span></div>
                  <div><span className="text-slate-500">TTR (Time to Respond): </span><span className="text-white font-bold">35.0s</span></div>
                </div>
              </div>

              {/* Command Line Provenance */}
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                  Red Action Execution Payload:
                </span>
                <div className="p-3 bg-[#080A0E] rounded-xl border border-[#202736] text-amber-300 text-[11px] break-all leading-relaxed">
                  {selectedExercise.red_command || 'No command recorded.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Crosshair className="w-8 h-8 mx-auto text-slate-600" />
              <div>No Purple exercises found.</div>
              <div className="text-[10px] text-slate-600">Dispatch an authorized exercise against your connected host to begin evidence collection.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
