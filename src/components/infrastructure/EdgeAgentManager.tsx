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
  Clock,
  Network,
  Globe,
  Wifi,
  Activity,
  Cpu,
  Download,
  Check,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

interface VpnPeer {
  id: string;
  vm_name: string;
  os: string;
  native_ip: string;
  virtual_ip: string;
  role: string;
  status: string;
  last_handshake: number | null;
  latency_ms: number | null;
  auth_token: string;
}

interface VpnStatus {
  server: {
    id: string;
    name: string;
    virtual_ip: string;
    listen_port: number;
    subnet: string;
    public_key: string;
    status: string;
    uptime: string;
  };
  total_peers: number;
  connected_peers: number;
  mesh_subnet: string;
  overlay_protocol: string;
  active: boolean;
}

export const EdgeAgentManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agents' | 'vpn'>('vpn');
  const [agents, setAgents] = useState<EdgeAgentItem[]>([]);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // VPN State
  const [vpnStatus, setVpnStatus] = useState<VpnStatus | null>(null);
  const [vpnPeers, setVpnPeers] = useState<VpnPeer[]>([]);
  const [isDetectingVms, setIsDetectingVms] = useState(false);
  const [deployModalPeer, setDeployModalPeer] = useState<VpnPeer | null>(null);
  const [deployScriptData, setDeployScriptData] = useState<{ filename: string; content: string; one_liner: string } | null>(null);
  const [pingingPeerId, setPingingPeerId] = useState<string | null>(null);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);

  const fetchAgents = async () => {
    try {
      const data = await ApplianceAPI.getAgents();
      setAgents(data || []);
    } catch (e) {
      console.warn("Failed to fetch edge agents:", e);
    }
  };

  const fetchVpnData = async () => {
    try {
      const [status, peers] = await Promise.all([
        ApplianceAPI.getVpnStatus(),
        ApplianceAPI.getVpnPeers()
      ]);
      setVpnStatus(status);
      setVpnPeers(peers || []);
    } catch (e) {
      console.warn("Failed to fetch VPN status:", e);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchAgents(), fetchVpnData()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000);
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

  const handleAutoDetectVms = async () => {
    setIsDetectingVms(true);
    try {
      const res = await ApplianceAPI.autoDetectVms();
      setToastMessage(`Auto-scan complete: Discovered ${res.active_vms_found} running VMs and synchronized mesh addresses.`);
      await fetchVpnData();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
    } catch (e: any) {
      setToastMessage(`VM Auto-Detection error: ${e.message}`);
    } finally {
      setIsDetectingVms(false);
    }
  };

  const handleOpenDeployModal = async (peer: VpnPeer) => {
    setDeployModalPeer(peer);
    try {
      const scriptData = await ApplianceAPI.getPeerScript(peer.id);
      setDeployScriptData(scriptData);
    } catch (e: any) {
      setToastMessage(`Could not generate script: ${e.message}`);
    }
  };

  const handlePingPeer = async (peerId: string) => {
    setPingingPeerId(peerId);
    try {
      const res = await ApplianceAPI.pingPeer(peerId);
      if (res.ok) {
        setToastMessage(`Ping to ${res.target_ip} succeeded! Round-trip latency: ${res.latency_ms} ms`);
      } else {
        setToastMessage(`Ping to peer failed: Host is unreachable or firewalled on native interface.`);
      }
      await fetchVpnData();
    } catch (e: any) {
      setToastMessage(`Ping error: ${e.message}`);
    } finally {
      setPingingPeerId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-red-950/80 border border-red-500 text-red-200 rounded-xl font-mono text-xs flex items-center justify-between shadow-xl">
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
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E31E24]">
              Cross-Network Edge &amp; VPN Mesh Gateway
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AGENT WORKBENCH &amp; CROSS-NETWORK VM MESH
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Bridges VirtualBox and Proxmox VMs on isolated subnets (NAT, Internal, Host-Only) into a unified 10.8.0.0/24 telemetry plane.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {activeTab === 'vpn' ? (
            <button
              onClick={handleAutoDetectVms}
              disabled={isDetectingVms}
              className="px-4 py-2.5 bg-[#E31E24] hover:bg-[#ff2e34] text-white rounded-xl font-bold transition shadow-lg shadow-red-950/40 flex items-center gap-2"
            >
              <Activity className={`w-4 h-4 ${isDetectingVms ? 'animate-spin' : ''}`} />
              <span>{isDetectingVms ? 'Scanning Running VMs...' : 'Auto-Detect Active VMs'}</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateToken}
              disabled={isGeneratingToken}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-950 flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>{isGeneratingToken ? 'Generating...' : 'Generate Pairing Token'}</span>
            </button>
          )}

          <button
            onClick={loadAll}
            className="p-2.5 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh State"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#202736] pb-3">
        <button
          onClick={() => setActiveTab('vpn')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'vpn'
              ? 'bg-[#E31E24] text-white shadow-md shadow-red-950/30'
              : 'bg-[#121620] text-slate-400 hover:text-white border border-[#202736]'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Cross-Network VPN Mesh (10.8.0.0/24)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">
            {vpnPeers.length} Peers
          </span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'agents'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/30'
              : 'bg-[#121620] text-slate-400 hover:text-white border border-[#202736]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>TLS/WSS Edge Agents</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">
            {agents.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: CROSS-NETWORK VPN MESH ─── */}
      {activeTab === 'vpn' && (
        <div className="space-y-6">
          {/* Gateway Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">Central Gateway IP</span>
              <div className="text-xl font-mono font-bold text-emerald-400">{vpnStatus?.server?.virtual_ip || '10.8.0.1'}</div>
              <div className="text-[11px] text-slate-500 font-mono">Port: {vpnStatus?.server?.listen_port || 51820} UDP</div>
            </div>

            <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">Overlay Subnet</span>
              <div className="text-xl font-mono font-bold text-white">{vpnStatus?.mesh_subnet || '10.8.0.0/24'}</div>
              <div className="text-[11px] text-slate-500 font-mono">Isolated Subnet Bridge</div>
            </div>

            <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">Connected VM Peers</span>
              <div className="text-xl font-mono font-bold text-blue-400">
                {vpnStatus?.connected_peers || 0} / {vpnStatus?.total_peers || 0}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Auto-mesh active</div>
            </div>

            <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">Cross-Network Engine</span>
              <div className="text-xl font-mono font-bold text-purple-400">Operational</div>
              <div className="text-[11px] text-slate-500 font-mono">NAT / IntNet / Bridged</div>
            </div>
          </div>

          {/* Enrolled VM Peers Table */}
          <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 border-b border-[#202736] flex items-center justify-between bg-[#121620]/60">
              <div>
                <span className="text-white uppercase text-[11px] font-bold">
                  Enrolled Virtual Machine Peers on Overlay Mesh
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  VMs communicate with the ShadowXLab Control Plane via their assigned 10.8.0.x tunnel address.
                </p>
              </div>
              <button
                onClick={handleAutoDetectVms}
                className="px-3 py-1.5 bg-[#121620] hover:bg-[#182030] text-slate-200 border border-[#202736] rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                <span>Sync Active VMs</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#080A0E] text-slate-400 border-b border-[#202736] text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">VM Name &amp; Role</th>
                    <th className="py-3 px-4">OS Type</th>
                    <th className="py-3 px-4">Native Isolated IP</th>
                    <th className="py-3 px-4">Mesh Virtual IP</th>
                    <th className="py-3 px-4">Tunnel Status</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {vpnPeers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No VM peers configured on mesh. Click "Auto-Detect Active VMs" above to scan VirtualBox.
                      </td>
                    </tr>
                  ) : (
                    vpnPeers.map(peer => (
                      <tr key={peer.id} className="hover:bg-[#121620]/40 transition">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-100">{peer.vm_name}</div>
                              <div className="text-[10px] text-slate-500">{peer.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            peer.os === 'windows' ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' : 'bg-orange-950/60 text-orange-300 border border-orange-800/40'
                          }`}>
                            {peer.os.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {peer.native_ip}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {peer.virtual_ip}
                        </td>
                        <td className="py-3.5 px-4">
                          {peer.status === 'connected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-400">
                              Configured
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {peer.latency_ms ? `${peer.latency_ms} ms` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handlePingPeer(peer.id)}
                            disabled={pingingPeerId === peer.id}
                            className="px-2.5 py-1 bg-[#121620] hover:bg-[#1c2436] text-slate-300 border border-[#202736] rounded-lg text-xs transition"
                            title="Ping Peer"
                          >
                            {pingingPeerId === peer.id ? 'Pinging...' : 'Ping'}
                          </button>
                          <button
                            onClick={() => handleOpenDeployModal(peer)}
                            className="px-3 py-1 bg-[#E31E24] hover:bg-[#ff2e34] text-white rounded-lg text-xs font-bold transition shadow"
                          >
                            Deploy Agent
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TLS/WSS EDGE AGENTS ─── */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
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
              <span className="text-slate-500 text-[11px]">Heartbeat interval: 10s</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#080A0E] text-slate-400 border-b border-[#202736] text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Hostname</th>
                    <th className="py-3 px-4">Local IP</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Certificate Fingerprint</th>
                    <th className="py-3 px-4">Connectors</th>
                    <th className="py-3 px-4">Last Heartbeat</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No Edge Agents paired yet. Click "Generate Pairing Token" above to link a remote cyber-range host.
                      </td>
                    </tr>
                  ) : (
                    agents.map(agent => (
                      <tr key={agent.agent_id} className="hover:bg-[#121620]/40 transition">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Radio className={`w-3.5 h-3.5 ${agent.status === 'CONNECTED' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                          <span>{agent.hostname}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {agent.local_ip}
                        </td>
                        <td className="py-3.5 px-4">
                          {agent.status === 'CONNECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              CONNECTED
                            </span>
                          )}
                          {agent.status === 'DEGRADED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              DEGRADED
                            </span>
                          )}
                          {agent.status === 'DISCONNECTED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                              OFFLINE
                            </span>
                          )}
                          {agent.status === 'REVOKED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 border border-red-500/40 text-red-400">
                              <Lock className="w-3 h-3" />
                              REVOKED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                          {agent.certificate_fingerprint}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                          {agent.connectors_summary ? (
                            <span className="px-2 py-0.5 bg-[#182030] rounded text-emerald-400 font-bold">
                              {Object.keys(agent.connectors_summary).length} Active
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                          {agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleTimeString() : 'Never'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!agent.is_revoked && (
                            <button
                              onClick={() => handleRevokeAgent(agent.agent_id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                              title="Revoke Certificate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DEPLOY VPN AGENT TO VM ─── */}
      {deployModalPeer && deployScriptData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl font-mono text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#202736] pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-[#E31E24]" />
                <h3 className="font-bold text-sm text-white">
                  Deploy VPN Mesh Agent to {deployModalPeer.vm_name}
                </h3>
              </div>
              <button
                onClick={() => { setDeployModalPeer(null); setDeployScriptData(null); }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 text-[11px] font-bold uppercase">1-Line Guest Terminal Command</span>
              <div className="p-3 bg-[#080A0E] border border-[#202736] rounded-xl flex items-center justify-between gap-3">
                <code className="text-emerald-400 font-bold truncate select-all">{deployScriptData.one_liner}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(deployScriptData.one_liner);
                    setCopiedOneLiner(true);
                    setTimeout(() => setCopiedOneLiner(false), 2500);
                  }}
                  className="px-3 py-1.5 bg-[#E31E24] hover:bg-[#ff2e34] text-white rounded-lg font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedOneLiner ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Paste and execute this command in the guest VM terminal ({deployModalPeer.os === 'windows' ? 'Administrator PowerShell' : 'root shell'}).
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 text-[11px] font-bold uppercase">Assigned Tunnel Properties</span>
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#080A0E] border border-[#182030] rounded-xl text-[11px]">
                <div><span className="text-slate-500">Virtual Mesh IP:</span> <b className="text-emerald-400">{deployModalPeer.virtual_ip}</b></div>
                <div><span className="text-slate-500">Native VM IP:</span> <b className="text-white">{deployModalPeer.native_ip}</b></div>
                <div><span className="text-slate-500">Gateway Server:</span> <b className="text-blue-400">{vpnStatus?.server?.virtual_ip}</b></div>
                <div><span className="text-slate-500">Protocol:</span> <b className="text-purple-400">WireGuard / Overlay</b></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setDeployModalPeer(null); setDeployScriptData(null); }}
                className="px-4 py-2 bg-[#121620] hover:bg-[#182030] border border-[#202736] rounded-xl text-slate-300 font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
