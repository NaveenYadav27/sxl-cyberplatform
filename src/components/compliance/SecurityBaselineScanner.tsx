import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Terminal,
  Copy,
  Lock,
  FileCheck,
  PowerOff,
  Search,
  ExternalLink,
  Layers,
  Server,
  Zap,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

interface BaselineCheck {
  rule_id: string;
  benchmark: string;
  title: string;
  pillar: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expected_value: string;
  actual_value: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  rationale: string;
  remediation: string;
}

interface ScanResult {
  scan_id: string;
  hostname: string;
  ip_address: string;
  scanned_at: string;
  compliance_score: number;
  total_checks: number;
  passed_count: number;
  failed_count: number;
  warning_count: number;
  pillars_breakdown: {
    confidentiality: { passed: number; total: number };
    integrity: { passed: number; total: number };
    availability: { passed: number; total: number };
  };
  checks: BaselineCheck[];
}

export const SecurityBaselineScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAILED' | 'PASSED' | 'WARNING'>('ALL');
  const [pillarFilter, setPillarFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<BaselineCheck | null>(null);
  const [copiedRule, setCopiedRule] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLatestScan = async () => {
    try {
      const res = await fetch(`${BASE_URL}/compliance/scans`);
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
      }
    } catch (e) {
      console.warn("Failed to fetch baseline scan:", e);
    }
  };

  useEffect(() => {
    fetchLatestScan();
  }, []);

  const handleRunLiveScan = async () => {
    setIsScanning(true);
    setToastMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/compliance/scan`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        setToastMessage(`Baseline scan completed on ${data.hostname} (${data.ip_address}). Compliance score: ${data.compliance_score}%.`);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e: any) {
      setToastMessage(`Scan error: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyRemediation = (ruleId: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedRule(ruleId);
    setTimeout(() => setCopiedRule(null), 3000);
  };

  const filteredChecks = (scanResult?.checks || []).filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (pillarFilter !== 'ALL' && c.pillar !== pillarFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.rule_id.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

      {/* Top Banner */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 font-bold">
              WAZUH SCA & AZURE SECURITY BENCHMARK (ASB)
            </span>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
              ● REAL-TIME HOST CONFIG AUDITING
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>ENDPOINT SECURITY BASELINE SCANNER</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active configuration auditing: LSA Protection, SMBv1, NLA, UAC, ScriptBlock logging, Firewall profiles, and open attack surfaces.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleRunLiveScan}
            disabled={isScanning}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-950 flex items-center gap-2"
          >
            <Play className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Auditing Host Configurations...' : 'Run Live Security Baseline Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scorecard Overview */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          {/* Main Score Card */}
          <div className="p-5 bg-[#0B0E14] border border-[#202736] rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Overall Compliance Score</span>
              <div className="text-3xl font-black text-white mt-1">{scanResult.compliance_score}%</div>
              <span className="text-[10px] text-slate-400">Target: {scanResult.hostname} ({scanResult.ip_address})</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white font-black text-sm shadow-lg">
              SCA
            </div>
          </div>

          {/* Confidentiality Pillar Card */}
          <div className="p-5 bg-[#0B0E14] border border-[#202736] rounded-2xl flex flex-col justify-between shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Confidentiality</span>
              </span>
              <span className="text-white font-bold">
                {scanResult.pillars_breakdown.confidentiality.passed} / {scanResult.pillars_breakdown.confidentiality.total}
              </span>
            </div>
            <div className="w-full bg-[#182030] h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${(scanResult.pillars_breakdown.confidentiality.passed / scanResult.pillars_breakdown.confidentiality.total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">LSA Protection, SMBv1, NLA</span>
          </div>

          {/* Integrity Pillar Card */}
          <div className="p-5 bg-[#0B0E14] border border-[#202736] rounded-2xl flex flex-col justify-between shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Integrity</span>
              </span>
              <span className="text-white font-bold">
                {scanResult.pillars_breakdown.integrity.passed} / {scanResult.pillars_breakdown.integrity.total}
              </span>
            </div>
            <div className="w-full bg-[#182030] h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${(scanResult.pillars_breakdown.integrity.passed / scanResult.pillars_breakdown.integrity.total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">UAC, ScriptBlock Log, Antivirus</span>
          </div>

          {/* Availability Pillar Card */}
          <div className="p-5 bg-[#0B0E14] border border-[#202736] rounded-2xl flex flex-col justify-between shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <PowerOff className="w-3.5 h-3.5" />
                <span>Availability</span>
              </span>
              <span className="text-white font-bold">
                {scanResult.pillars_breakdown.availability.passed} / {scanResult.pillars_breakdown.availability.total}
              </span>
            </div>
            <div className="w-full bg-[#182030] h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all"
                style={{ width: `${(scanResult.pillars_breakdown.availability.passed / scanResult.pillars_breakdown.availability.total) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">Firewall Profiles & Exposed Ports</span>
          </div>
        </div>
      )}

      {/* Filter & Controls Bar */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-xl">
        <div className="flex items-center gap-2">
          {['ALL', 'FAILED', 'WARNING', 'PASSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                statusFilter === st
                  ? 'bg-[#182030] text-white border border-[#303B52] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'FAILED' ? '🔴 FAILED (Action Required)' : st === 'WARNING' ? '🟡 WARNING' : st === 'PASSED' ? '🟢 PASSED' : 'ALL CHECKS'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search rule or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080A0E] border border-[#202736] rounded-xl pl-9 pr-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <span className="text-slate-500 text-[11px]">
            Showing <span className="text-white font-bold">{filteredChecks.length}</span> Checks
          </span>
        </div>
      </div>

      {/* Baseline Findings Table */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-[#202736]">
            <thead className="bg-[#080A0E] text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Rule ID & Benchmark</th>
                <th className="p-4">Configuration Title & Pillar</th>
                <th className="p-4">Scanned Actual Value</th>
                <th className="p-4">Expected Baseline</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202736]/60">
              {filteredChecks.map((chk) => (
                <tr
                  key={chk.rule_id}
                  onClick={() => setSelectedCheck(chk)}
                  className={`hover:bg-[#121620]/80 transition cursor-pointer ${
                    selectedCheck?.rule_id === chk.rule_id ? 'bg-[#182030]/60' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="font-bold text-blue-400">{chk.rule_id}</div>
                    <div className="text-[10px] text-slate-500">{chk.benchmark}</div>
                  </td>

                  <td className="p-4 max-w-xs">
                    <div className="font-bold text-white leading-snug">{chk.title}</div>
                    <div className="text-[10px] text-purple-300 mt-0.5">{chk.pillar} • {chk.category}</div>
                  </td>

                  <td className="p-4">
                    <span className={`font-bold ${chk.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {chk.actual_value}
                    </span>
                  </td>

                  <td className="p-4 text-slate-400 text-[11px]">
                    {chk.expected_value}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        chk.status === 'PASSED'
                          ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                          : chk.status === 'FAILED'
                          ? 'bg-red-950 border-red-500/40 text-red-400'
                          : 'bg-amber-950 border-amber-500/40 text-amber-400'
                      }`}
                    >
                      ● {chk.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyRemediation(chk.rule_id, chk.remediation);
                      }}
                      className="px-3 py-1.5 bg-[#121620] hover:bg-[#182030] border border-[#202736] text-slate-300 hover:text-white rounded-lg font-bold transition flex items-center gap-1.5 ml-auto"
                      title="Copy remediation command"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedRule === chk.rule_id ? 'Copied!' : 'Copy Fix'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remediation Drawer (If check selected) */}
      {selectedCheck && (
        <div className="bg-[#121620] border border-blue-500/50 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202736]">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold uppercase text-[11px]">
                Remediation Guidance // {selectedCheck.rule_id}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                selectedCheck.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
              }`}>
                {selectedCheck.status}
              </span>
            </div>
            <button onClick={() => setSelectedCheck(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div>
            <h4 className="text-base font-black text-white">{selectedCheck.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{selectedCheck.rationale}</p>
          </div>

          <div className="p-4 bg-[#080A0E] rounded-xl border border-[#202736] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>PowerShell / Registry Remediation Command:</span>
              </span>
              <button
                onClick={() => handleCopyRemediation(selectedCheck.rule_id, selectedCheck.remediation)}
                className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedRule === selectedCheck.rule_id ? 'Copied to Clipboard!' : 'Copy Script'}</span>
              </button>
            </div>

            <code className="text-emerald-400 text-xs block break-all leading-relaxed p-2 bg-[#0B0E14] rounded-lg border border-[#182030]">
              {selectedCheck.remediation}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
