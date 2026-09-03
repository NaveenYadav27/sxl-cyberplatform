import React, { useState, useEffect } from 'react';
import {
  Radio,
  Server,
  Shield,
  Key,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Terminal,
  Zap,
  Lock,
  Unlock,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { BASE_URL } from '../../utils/config';
import { ApplianceAPI } from '../../services/api';

interface EdgeAgentItem {
  agent_id: string;
  installation_id: string;
  hostname: string;
  local_ip: string;
  agent_version: string;
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'REVOKED' | 'PAIRING';
  is_revoked: boolean;
  certificate_fingerprint: string;
  certificate_expires_at?: string;
  last_heartbeat?: string;
  connectors_summary?: Record<string, any>;
}

export const EdgeAgentManager: React.FC = () => {
  const [agents, setAgents] = useState<EdgeAgentItem[]>([]);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const data = await ApplianceAPI.getAgents();
      setAgents(data || []);
    } catch (e) {
      console.warn("Failed to fetch edge agents:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateToken = async () => {
    setIsGeneratingToken(true);
    try {
      const data = await ApplianceAPI.generateAgentToken();
      setPairingToken(data.pairing_token);
      setTokenExpiresAt(data.expires_at);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e: any) {
      setToastMessage(`Failed to generate token: ${e.message}`);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleCopyCommand = () => {
    if (!pairingToken) return;
    const cmd = `cd edge-agent; python agent.py --token ${pairingToken}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevokeAgent = async (agentId: string) => {
    try {
      await ApplianceAPI.revokeAgent(agentId, "Revoked by administrator from Control Plane UI");
      setToastMessage(`Agent ${agentId} certificate revoked successfully.`);
      await fetchAgents();
    } catch (e: any) {
      setToastMessage(`Revocation failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-red-950/80 border border-red-500 text-red-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-xl">
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
              Outbound Edge Agent Management
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            LAB EDGE AGENTS & CERTIFICATE REGISTRY
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Outbound TLS/WSS tunnels from customer cyber ranges to Control Plane
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleGenerateToken}
            disabled={isGeneratingToken}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-950 flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>{isGeneratingToken ? 'Generating...' : 'Generate Pairing Token'}</span>
          </button>

          <button
            onClick={fetchAgents}
            className="p-2.5 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh Agents"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pairing Token Box (if generated) */}
      {pairingToken && (
        <div className="bg-[#121620] border border-purple-500/60 rounded-2xl p-5 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-purple-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>One-Time Edge Agent Pairing Token</span>
            </span>
            <span className="text-slate-400 text-[10px]">Valid for 2 Hours</span>
          </div>

          <div className="p-3 bg-[#080A0E] rounded-xl border border-[#202736] flex items-center justify-between gap-4">
            <span className="text-emerald-400 font-bold text-sm tracking-wider select-all">{pairingToken}</span>
            <button
              onClick={handleCopyCommand}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Pair Command'}</span>
            </button>
          </div>

          <div className="p-2.5 bg-[#080A0E] rounded-lg border border-[#182030] text-slate-400 text-[11px] space-y-1">
            <div><span className="text-slate-500 font-bold">Local / Dev: </span><code className="text-emerald-400">cd edge-agent; python agent.py --token {pairingToken}</code></div>
            <div><span className="text-slate-500 font-bold">Linux Lab: </span><code className="text-slate-200">./install-edge-agent.sh --token {pairingToken}</code></div>
            <div><span className="text-slate-500 font-bold">Windows Lab: </span><code className="text-slate-200">.\install-edge-agent.ps1 -Token {pairingToken}</code></div>
          </div>
        </div>
      )}

      {/* Edge Agents Table */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-[#202736] flex items-center justify-between bg-[#121620]/60">
          <span className="text-slate-400 uppercase text-[11px] font-bold">
            Registered Edge Agents ({agents.length})
          </span>
          <span className="text-slate-500 text-[10px]">Per-Agent X.509 Cryptographic Identity</span>
        </div>

        {agents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Radio className="w-8 h-8 mx-auto text-slate-600" />
            <div>No Edge Agents registered yet.</div>
            <div className="text-[10px] text-slate-600">
              Generate a pairing token above and run the command in your terminal to establish the outbound tunnel.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-[#202736]">
              <thead className="bg-[#080A0E] text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Agent ID & Hostname</th>
                  <th className="p-4">Local IP & Version</th>
                  <th className="p-4">Tunnel State</th>
                  <th className="p-4">Certificate Fingerprint</th>
                  <th className="p-4">Last Heartbeat</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202736]/60">
                {agents.map((a) => (
                  <tr key={a.agent_id} className="hover:bg-[#121620]/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{a.agent_id}</div>
                      <div className="text-[10px] text-slate-400">{a.hostname} ({a.installation_id.slice(0, 12)}...)</div>
                    </td>

                    <td className="p-4">
                      <div className="text-white font-bold">{a.local_ip}</div>
                      <div className="text-[10px] text-purple-300">v{a.agent_version}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          a.status === 'CONNECTED'
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                            : a.status === 'REVOKED'
                            ? 'bg-red-950 border-red-500/40 text-red-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        ● {a.status}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400 text-[11px] truncate max-w-[160px]" title={a.certificate_fingerprint}>
                      {a.certificate_fingerprint ? `${a.certificate_fingerprint.slice(0, 16)}...` : 'N/A'}
                    </td>

                    <td className="p-4 text-slate-400">
                      {a.last_heartbeat ? new Date(a.last_heartbeat).toLocaleTimeString() : 'Never'}
                    </td>

                    <td className="p-4 text-right">
                      {!a.is_revoked ? (
                        <button
                          onClick={() => handleRevokeAgent(a.agent_id)}
                          className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-lg font-bold transition flex items-center gap-1.5 ml-auto"
                          title="Instantly revoke agent certificate and terminate tunnel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-red-500 font-bold uppercase">REVOKED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
