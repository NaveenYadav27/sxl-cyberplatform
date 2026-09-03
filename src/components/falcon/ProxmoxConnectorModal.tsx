import React, { useState, useEffect } from 'react';
import {
  Server,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Power,
  Layers,
  X,
  ExternalLink,
  Cpu,
  Lock,
  Zap,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FalconAPI } from '../../services/falconApi';

interface ProxmoxConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVmsUpdated?: (vms: any[]) => void;
}

export const ProxmoxConnectorModal: React.FC<ProxmoxConnectorModalProps> = ({
  isOpen,
  onClose,
  onVmsUpdated
}) => {
  const [host, setHost] = useState('https://100.118.161.17:8006');
  const [nodeName, setNodeName] = useState('pve');
  const [tokenId, setTokenId] = useState('root@pam!shadowxlab-token');
  const [tokenSecret, setTokenSecret] = useState('');
  const [verifySsl, setVerifySsl] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [vms, setVms] = useState<any[]>([]);
  const [isFetchingVms, setIsFetchingVms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSavedConfig();
    }
  }, [isOpen]);

  const loadSavedConfig = async () => {
    try {
      const cfg = await FalconAPI.getProxmoxConfig();
      if (cfg) {
        if (cfg.host) setHost(cfg.host);
        if (cfg.token_id) setTokenId(cfg.token_id);
        if (cfg.node_name) setNodeName(cfg.node_name);
        setVerifySsl(Boolean(cfg.verify_ssl));
        setIsConnected(Boolean(cfg.is_connected));
        if (cfg.is_connected) {
          fetchRealVms();
        }
      }
    } catch (e) {
      console.warn("Failed to load Proxmox config:", e);
    }
  };

  const fetchRealVms = async () => {
    setIsFetchingVms(true);
    try {
      const res = await FalconAPI.getProxmoxVms();
      if (res && res.vms) {
        setVms(res.vms);
        if (onVmsUpdated) onVmsUpdated(res.vms);
      }
    } catch (e) {
      console.warn("Failed to fetch Proxmox VMs:", e);
    } finally {
      setIsFetchingVms(false);
    }
  };

  if (!isOpen) return null;

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !tokenId || !tokenSecret) {
      setStatusMessage({
        text: 'Please provide Proxmox Host URL, API Token ID, and Token Secret UUID.',
        type: 'error'
      });
      return;
    }

    setIsConnecting(true);
    setStatusMessage({ text: 'Sending real API request to Proxmox VE...', type: 'info' });

    try {
      const res = await FalconAPI.testProxmox({
        host: host.trim(),
        token_id: tokenId.trim(),
        token_secret: tokenSecret.trim(),
        node_name: nodeName.trim(),
        verify_ssl: verifySsl
      });

      if (res.status === 'connected') {
        setIsConnected(true);
        if (res.active_node) setNodeName(res.active_node);
        setStatusMessage({
          text: `● Connected to Proxmox VE (${res.pve_version}) on node '${res.active_node || nodeName}'!`,
          type: 'success'
        });
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        await fetchRealVms();
      } else {
        setIsConnected(false);
        setStatusMessage({
          text: res.message || 'Connection failed. Check your token credentials and network connectivity.',
          type: 'error'
        });
      }
    } catch (e: any) {
      setIsConnected(false);
      setStatusMessage({
        text: `Proxmox request error: ${e.message}`,
        type: 'error'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSnapshotRollback = async (vmid: number, vmName: string) => {
    setStatusMessage({
      text: `Triggering real Proxmox snapshot rollback for ${vmName} (VMID: ${vmid})...`,
      type: 'info'
    });
    try {
      const res = await FalconAPI.rollbackSnapshot(vmid, 'baseline-clean');
      if (res.status === 'success') {
        setStatusMessage({
          text: res.message,
          type: 'success'
        });
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      } else {
        setStatusMessage({
          text: res.message,
          type: 'error'
        });
      }
    } catch (e: any) {
      setStatusMessage({
        text: `Snapshot rollback failed: ${e.message}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0E14] border border-[#202736] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden font-sans text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#202736] flex items-center justify-between bg-[#121620]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
                  Custom Proxmox VE Setup
                </span>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">PROXMOX CLUSTER CONFIGURATION</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#182030] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-mono text-xs">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl flex items-center justify-between border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/80 border-red-500/60 text-red-300'
                  : 'bg-[#182030] border-orange-500/40 text-orange-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="font-bold leading-relaxed">{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* User Configuration Form */}
          <form onSubmit={handleTestConnection} className="bg-[#121620] border border-[#202736] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#202736]">
              <span className="text-slate-400 uppercase text-[11px] font-bold">Configure Your Proxmox Credentials</span>
              <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {isConnected ? '● Connected & Active' : '● Disconnected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Proxmox Endpoint URL (IP or Hostname)
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="https://100.118.161.17:8006"
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 text-xs shadow-inner"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Include port :8006 and protocol (https://)</span>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Node Name (e.g. pve, pve-01)
                </label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="pve"
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 text-xs shadow-inner"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Auto-detected upon successful connection</span>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  API Token ID (USER@REALM!TOKENID)
                </label>
                <input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="root@pam!shadowxlab-token"
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 text-xs shadow-inner"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">From Datacenter → Permissions → API Tokens</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 text-[10px] uppercase font-bold">
                    Token Secret (UUID)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecret ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={tokenSecret}
                  onChange={(e) => setTokenSecret(e.target.value)}
                  placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 text-xs shadow-inner"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Generated when creating the API Token</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#202736]/60">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 text-[11px]">
                <input
                  type="checkbox"
                  checked={verifySsl}
                  onChange={(e) => setVerifySsl(e.target.checked)}
                  className="rounded border-[#202736] bg-[#080A0E] text-orange-500"
                />
                <span>Verify SSL Certificate (Leave unchecked for self-signed PVE certs)</span>
              </label>

              <button
                type="submit"
                disabled={isConnecting}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold transition shadow-lg shadow-orange-950 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isConnecting ? 'Verifying Proxmox...' : 'Connect & Save Proxmox VE'}</span>
              </button>
            </div>
          </form>

          {/* Real Live Proxmox VMs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 uppercase text-[11px] font-bold">
                  Discovered Proxmox Virtual Machines ({vms.length})
                </span>
                {isFetchingVms && <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />}
              </div>
              <button
                onClick={fetchRealVms}
                className="text-[11px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh VMs</span>
              </button>
            </div>

            {vms.length === 0 ? (
              <div className="p-8 text-center bg-[#121620] border border-[#202736] rounded-2xl text-slate-500 space-y-2">
                <Server className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-xs">No Proxmox VMs discovered yet.</div>
                <div className="text-[10px] text-slate-600">
                  Enter your Proxmox Token credentials above and click "Connect & Save Proxmox VE" to query your cluster.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {vms.map((vm) => (
                  <div
                    key={vm.vmid}
                    className="p-4 bg-[#121620] border border-[#202736] rounded-2xl flex flex-wrap items-center justify-between gap-4 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#182030] border border-[#303B52] flex items-center justify-center text-orange-400 font-bold">
                        {vm.vmid}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{vm.name}</span>
                          {vm.is_real && (
                            <span className="text-[9px] bg-orange-950 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/40">
                              PROXMOX NODE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {vm.os} • {vm.cores} vCPU • {vm.memory_mb} MB RAM
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-cyan-300 font-bold">{vm.ip}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          vm.status === 'running'
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        ● {vm.status}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSnapshotRollback(vm.vmid, vm.name)}
                      className="px-3.5 py-1.5 bg-[#182030] hover:bg-[#222C42] text-amber-300 border border-amber-500/40 rounded-xl font-bold transition flex items-center gap-1.5"
                      title="Rollback VM to clean snapshot"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Snapshot Rollback</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
