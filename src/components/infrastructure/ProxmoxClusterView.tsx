import React, { useState, useEffect } from 'react';
import {
  Server,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  RefreshCw,
  Search,
  Lock,
  ExternalLink,
  Shield,
  Clock,
  Plus,
  Trash2,
  Play,
  PlusCircle,
  Monitor
} from 'lucide-react';

import { BASE_URL } from '../../utils/config';
import { ApplianceAPI } from '../../services/api';

interface ProxmoxVmItem {
  vmid: string;
  name: string;
  hostname: string;
  status: 'running' | 'stopped' | 'paused';
  ip?: string;
  mac?: string;
  os: string;
  cores: number;
  memory_mb: number;
  qemu_agent_active: boolean;
  discovery_source: string;
  confidence: number;
  node: string;
}

interface ManualAsset {
  asset_id: string;
  hostname: string;
  ip_address: string;
  mac_address?: string;
  os_type: string;
  status: string;
  discovery_source: string;
  hypervisor: {
    type: string;
    node: string;
  };
  open_ports: number[];
}

export const ProxmoxClusterView: React.FC = () => {
  const [vms, setVms] = useState<ProxmoxVmItem[]>([]);
  const [manualAssets, setManualAssets] = useState<any[]>([]);
  const [hostUrl, setHostUrl] = useState<string>('Not Configured');
  const [activeNode, setActiveNode] = useState<string>('pve');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Registration Form State
  const [newHostname, setNewHostname] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newOs, setNewOs] = useState('linux');
  const [newHypervisor, setNewHypervisor] = useState('virtualbox');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProxmoxData = async () => {
    setIsLoading(true);
    try {
      const data = await ApplianceAPI.getProxmoxVms();
      setVms(data.vms || []);
      setHostUrl(data.host || 'Not Configured');
      setActiveNode(data.node || 'pve');
      setIsConnected(Boolean(data.is_connected));
    } catch (e) {
      console.warn("Failed to fetch Proxmox data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManualAssets = async () => {
    try {
      const data = await ApplianceAPI.getAssets();
      const assets = data.assets || [];
      setManualAssets(assets.filter((a: any) => a.discovery_source === 'manual'));
    } catch (e) {
      console.warn("Failed to fetch manual assets:", e);
    }
  };

  useEffect(() => {
    fetchProxmoxData();
    fetchManualAssets();
    const interval = setInterval(() => {
      fetchProxmoxData();
      fetchManualAssets();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname || !newIp) {
      setErrorMsg("Hostname and IP Address are required");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await ApplianceAPI.registerAsset({
        hostname: newHostname,
        ip_address: newIp,
        os_type: newOs,
        hypervisor_type: newHypervisor
      });
      setNewHostname('');
      setNewIp('');
      fetchManualAssets();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register local host");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManual = async (assetId: string) => {
    try {
      await ApplianceAPI.deleteAsset(assetId);
      fetchManualAssets();
    } catch (e) {
      console.warn("Failed to delete asset:", e);
    }
  };

  const handleScanManual = async (assetId: string) => {
    try {
      await ApplianceAPI.scanAsset(assetId);
      fetchManualAssets();
    } catch (e) {
      console.warn("Failed to scan asset:", e);
    }
  };

  const filteredVms = vms.filter((vm) => {
    if (!searchQuery) return true;
    return (
      vm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vm.ip && vm.ip.includes(searchQuery)) ||
      vm.vmid.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
              Proxmox VE Hypervisor Discovery
            </span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
              READ-ONLY MODE (SAFE)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            PROXMOX CLUSTER & VM INVENTORY
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Continuous QEMU VM discovery, QEMU Guest Agent IPv4/MAC correlation, and node telemetry
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1.5 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 font-bold">
            Node: <span className="text-white">{activeNode}</span>
          </span>
          <button
            onClick={fetchProxmoxData}
            className="p-2 bg-[#121620] border border-[#202736] rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Permission Safety Matrix Banner */}
      <div className="bg-[#121620] border border-[#202736] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-bold">Read-Only Safety Guard:</span>
          <span className="text-emerald-400 font-bold">● Active (No destructive write actions permitted)</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>GET Cluster: <span className="text-emerald-400 font-bold">ALLOW</span></span>
          <span>GET VMs: <span className="text-emerald-400 font-bold">ALLOW</span></span>
          <span>VM Power: <span className="text-red-400 font-bold">PROHIBITED</span></span>
          <span>Snapshot Rollback: <span className="text-red-400 font-bold">QUARANTINED (PHASE 2)</span></span>
        </div>
      </div>

      {/* VM Table */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-[#202736] flex items-center justify-between bg-[#121620]/60">
          <div className="relative w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by VMID, Name, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080A0E] border border-[#202736] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing <span className="text-white font-bold">{filteredVms.length}</span> Virtual Machines
          </span>
        </div>

        {filteredVms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Server className="w-8 h-8 mx-auto text-slate-600" />
            <div>No Proxmox VMs discovered yet.</div>
            <div className="text-[10px] text-slate-600">
              Ensure the Edge Agent is connected and has Proxmox VE API credentials configured in agent_config.json.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-[#202736]">
              <thead className="bg-[#080A0E] text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">VMID & Name</th>
                  <th className="p-4">Resolved IP Address</th>
                  <th className="p-4">MAC Address</th>
                  <th className="p-4">Hardware Profile</th>
                  <th className="p-4">Guest Agent</th>
                  <th className="p-4">VM State</th>
                  <th className="p-4">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202736]/60">
                {filteredVms.map((vm) => (
                  <tr key={vm.vmid} className="hover:bg-[#121620]/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#303B52] flex items-center justify-center text-orange-400 font-bold text-xs">
                          {vm.vmid}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{vm.name}</div>
                          <div className="text-[10px] text-slate-500">{vm.os} • Node: {vm.node}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {vm.ip ? (
                        <span className="text-cyan-300 font-bold">{vm.ip}</span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400 text-[11px]">
                      {vm.mac || 'N/A'}
                    </td>

                    <td className="p-4 text-slate-300">
                      {vm.cores} vCPU • {vm.memory_mb} MB
                    </td>

                    <td className="p-4">
                      {vm.qemu_agent_active ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold text-[10px]">
                          ● AGENT ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-500 font-bold text-[10px]">
                          ● NO AGENT
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          vm.status === 'running'
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        ● {vm.status}
                      </span>
                    </td>

                    <td className="p-4 text-purple-400 font-bold">
                      {(vm.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Manually Registered Local VMs / Practices Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register Host Form */}
        <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-5 shadow-2xl space-y-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E31E24] flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> Add Local Host VM
            </span>
            <h3 className="text-base font-bold text-white mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Practice Target VM Registry
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Manually map your local VirtualBox target VM, Hyper-V sandbox, or Loopback address into the Cyber Range database.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-400 rounded-xl font-mono text-[10px]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegisterLocal} className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 block">Target VM Hostname:</label>
              <input
                type="text"
                placeholder="e.g. Local-Ubuntu-Target"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E31E24]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block">Target IPv4 Address:</label>
              <input
                type="text"
                placeholder="e.g. 192.168.56.101 or 127.0.0.1"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E31E24]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 block">OS Type:</label>
                <select
                  value={newOs}
                  onChange={(e) => setNewOs(e.target.value)}
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E31E24]"
                >
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                  <option value="kali">Kali Linux</option>
                  <option value="appliance">Appliance / Route</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block">Platform Node:</label>
                <select
                  value={newHypervisor}
                  onChange={(e) => setNewHypervisor(e.target.value)}
                  className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E31E24]"
                >
                  <option value="virtualbox">VirtualBox VM</option>
                  <option value="vmware">VMware Player</option>
                  <option value="physical">Physical Host</option>
                  <option value="loopback">Localhost Loopback</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#E31E24] hover:bg-[#B4141A] text-white rounded-xl font-bold transition shadow-lg shadow-red-950/40 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Local Host'}</span>
            </button>
          </form>
        </div>

        {/* Display manual hosts list */}
        <div className="lg:col-span-2 bg-[#0B0E14] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col">
          <div className="p-4 border-b border-[#202736] bg-[#121620]/60 flex items-center justify-between">
            <span className="text-slate-400 uppercase text-[11px] font-bold">
              Manually Registered Targets ({manualAssets.length})
            </span>
            <span className="text-[10px] text-[#E31E24] font-bold">LOCAL PRACTICE MODE</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#202736]/60 max-h-96">
            {manualAssets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Monitor className="w-8 h-8 mx-auto text-slate-600" />
                <div>No manual sandbox targets registered yet.</div>
                <div className="text-[10px] text-slate-600">
                  Register your VirtualBox or VMware local IP on the left to start testing EDR alerts, EDR telemetry & Baseline scans.
                </div>
              </div>
            ) : (
              manualAssets.map(a => (
                <div key={a.asset_id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#121620]/40 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E31E24]/10 border border-[#E31E24]/30 flex items-center justify-center text-[#E31E24] font-bold text-xs">
                      {a.os_type.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{a.hostname}</div>
                      <div className="text-[10px] text-slate-400">{a.ip_address} • Node: {a.hypervisor.node} ({a.hypervisor.type})</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleScanManual(a.asset_id)}
                      className="px-2.5 py-1.5 bg-purple-950 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-900 transition flex items-center gap-1 font-bold"
                      title="Trigger service port scan"
                    >
                      <Play className="w-3 h-3" />
                      <span>Scan Ports</span>
                    </button>
                    <button
                      onClick={() => handleDeleteManual(a.asset_id)}
                      className="p-1.5 bg-[#121620] hover:bg-[#1C2230] border border-[#202736] text-red-400 hover:text-red-300 rounded-lg transition"
                      title="Delete manually registered target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

