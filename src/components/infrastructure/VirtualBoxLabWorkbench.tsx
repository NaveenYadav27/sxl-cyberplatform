import React, { useState, useEffect } from 'react';
import {
  Boxes, Server, Cpu, Play, Square, Pause, RotateCw, Camera,
  Undo2, Shield, Network, Terminal, CheckCircle2, AlertCircle,
  RefreshCw, Layers, ExternalLink, Globe, Wifi, Activity, Plus, Edit2, Loader2
} from 'lucide-react';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

interface VBoxVM {
  uuid: string;
  name: string;
  status: 'running' | 'poweroff' | 'saved' | 'paused' | string;
  os_type: string;
  memory_mb: number;
  cpus: number;
  ip_address: string | null;
  mac_address: string | null;
  nic_type: string;
  assigned_role: string;
  target_labs: number[];
  last_updated: string;
}

interface HypervisorStatus {
  installed: boolean;
  version: string;
  executable_path: string | null;
  message: string;
}

export const VirtualBoxLabWorkbench: React.FC = () => {
  const [hypervisor, setHypervisor] = useState<HypervisorStatus | null>(null);
  const [vms, setVms] = useState<VBoxVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'error' } | null>(null);

  // Edit Role Modal State
  const [editingVm, setEditingVm] = useState<VBoxVM | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [ipInput, setIpInput] = useState('');

  // Snapshot Modal State
  const [snapshotVm, setSnapshotVm] = useState<VBoxVM | null>(null);
  const [snapshotName, setSnapshotName] = useState('');

  // Live Ping Test State
  const [pingTarget, setPingTarget] = useState('192.168.1.33');
  const [pingPort, setPingPort] = useState('22');
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);

  const fetchVBoxData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms`);
      if (res.ok) {
        const data = await res.json();
        setHypervisor(data.hypervisor);
        setVms(data.vms || []);
        // Pick first running VM or first VM with IP for ping target
        const active = (data.vms || []).find((v: VBoxVM) => v.ip_address);
        if (active && active.ip_address) {
          setPingTarget(active.ip_address);
        }
      }
    } catch (e: any) {
      setMsg({ text: `Failed to load VirtualBox status: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVBoxData();
    const iv = setInterval(fetchVBoxData, 12000);
    return () => clearInterval(iv);
  }, []);

  const handleStartVm = async (uuid: string, mode: 'gui' | 'headless') => {
    setActionLoading(uuid);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${uuid}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ VM started successfully in ${mode} mode.`, type: 'ok' });
        await fetchVBoxData();
      } else {
        setMsg({ text: `Error: ${data.detail || data.message || 'Failed to start VM'}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Execution error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleControlVm = async (uuid: string, action: 'poweroff' | 'acpipowerbutton' | 'pause' | 'resume' | 'reset') => {
    setActionLoading(uuid);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${uuid}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ Action '${action}' sent to VM.`, type: 'ok' });
        await fetchVBoxData();
      } else {
        setMsg({ text: `Error: ${data.detail || data.message || 'Failed to control VM'}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Execution error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveRole = async () => {
    if (!editingVm) return;
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: editingVm.uuid,
          name: editingVm.name,
          role: roleInput,
          ip: ipInput.trim() || null,
          target_labs: editingVm.target_labs || []
        })
      });
      if (res.ok) {
        setMsg({ text: `✓ Updated role for ${editingVm.name}`, type: 'ok' });
        setEditingVm(null);
        await fetchVBoxData();
      }
    } catch (e: any) {
      setMsg({ text: `Error saving role: ${e.message}`, type: 'error' });
    }
  };

  const handleTakeSnapshot = async () => {
    if (!snapshotVm) return;
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${snapshotVm.uuid}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_name: snapshotName.trim() || `ShadowX_Lab_Snap_${Date.now()}`,
          description: 'Created from ShadowXLab Control Plane'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ Snapshot captured successfully.`, type: 'ok' });
        setSnapshotVm(null);
      } else {
        setMsg({ text: `Snapshot error: ${data.detail || data.message}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    }
  };

  const handlePingTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingTarget) return;
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/test-connectivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: pingTarget.trim(),
          port: pingPort ? parseInt(pingPort, 10) : undefined
        })
      });
      if (res.ok) {
        setPingResult(await res.json());
      }
    } catch (e: any) {
      setPingResult({ ping_ok: false, message: e.message });
    } finally {
      setPingLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Top Header Banner ── */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E31E24] to-[#FF6B3D] flex items-center justify-center text-white shadow-lg shadow-red-950/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#E31E24] font-mono uppercase tracking-widest font-bold">
                Localhost Hypervisor Engine
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {hypervisor?.installed ? `Oracle VirtualBox ${hypervisor.version}` : 'Hypervisor Connecting...'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              VirtualBox Lab Range Workbench
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live hardware bridge: Import, power, control, and link your real local VirtualBox VMs to all 45 ShadowX SOC Analyst labs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchVBoxData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#121827] border border-slate-200 dark:border-[#232F46] text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:border-[#E31E24] transition text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Rescan VMs</span>
          </button>
        </div>
      </div>

      {/* Alert / Notification Feedback */}
      {msg && (
        <div className={`p-4 rounded-xl text-xs font-mono border flex items-center justify-between ${
          msg.type === 'ok'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── VirtualBox Hypervisor Node Status ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Hypervisor Engine</div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {hypervisor?.installed ? 'VirtualBox Active' : 'Not Detected'}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate mt-1">
            {hypervisor?.version || 'VBoxManage.exe'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Discovered VMs</div>
          <div className="text-lg font-black text-[#E31E24] mt-1">{vms.length} Registered</div>
          <div className="text-[10px] text-slate-500 mt-1">Available in local inventory</div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Active Running VMs</div>
          <div className="text-lg font-black text-emerald-500 mt-1">
            {vms.filter(v => v.status === 'running').length} Online
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Ready for live socket telemetry</div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Lab Topology Bridge</div>
          <div className="text-lg font-black text-blue-500 mt-1">Host-Only / NAT</div>
          <div className="text-[10px] text-slate-500 mt-1">Direct ICMP / TCP Reachable</div>
        </div>
      </div>

      {/* ── Discovered VirtualBox VMs Fleet ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-[#E31E24]" />
            <span>VirtualBox Machines in Active Lab Range ({vms.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Auto-synced via VBoxManage CLI</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vms.map(vm => {
            const isRunning = vm.status === 'running';
            const isTargeted = actionLoading === vm.uuid;

            return (
              <div
                key={vm.uuid}
                className={`bg-white dark:bg-[#0B1120] border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                  isRunning
                    ? 'border-emerald-500/40 shadow-emerald-950/10'
                    : 'border-slate-200 dark:border-[#1A2035]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{vm.name}</h3>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{vm.uuid}</div>
                    </div>
                    
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold font-mono uppercase ${
                      isRunning
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {vm.status}
                    </span>
                  </div>

                  {/* Assigned Role & Lab Target */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#060810] border border-slate-200 dark:border-[#182030] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-[#E31E24] uppercase font-mono block">ASSIGNED LAB ROLE:</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{vm.assigned_role}</span>
                      {vm.ip_address && (
                        <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                          IP: <b>{vm.ip_address}</b>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingVm(vm);
                        setRoleInput(vm.assigned_role);
                        setIpInput(vm.ip_address || '');
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-500 hover:text-black dark:hover:text-white"
                      title="Edit role & IP"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Hardware & Network Specs */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <div className="p-2 rounded-lg bg-slate-100/50 dark:bg-[#0e141d] flex flex-col">
                      <span className="text-[9px] text-slate-400">RAM / CPUs</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5">{vm.memory_mb} MB ({vm.cpus} vCPU)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/50 dark:bg-[#0e141d] flex flex-col">
                      <span className="text-[9px] text-slate-400">OS TYPE</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{vm.os_type}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/50 dark:bg-[#0e141d] flex flex-col">
                      <span className="text-[9px] text-slate-400">NETWORK ADAPTER</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 uppercase">{vm.nic_type}</span>
                    </div>
                  </div>
                </div>

                {/* Card Power & Lifecycle Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1A2035] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isRunning ? (
                      <>
                        <button
                          onClick={() => handleStartVm(vm.uuid, 'gui')}
                          disabled={isTargeted}
                          className="px-3 py-1.5 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                        >
                          {isTargeted ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          <span>Start (Window)</span>
                        </button>
                        <button
                          onClick={() => handleStartVm(vm.uuid, 'headless')}
                          disabled={isTargeted}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                        >
                          Headless
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleControlVm(vm.uuid, 'acpipowerbutton')}
                          disabled={isTargeted}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Square className="w-3 h-3" />
                          <span>ACPI Stop</span>
                        </button>
                        <button
                          onClick={() => handleControlVm(vm.uuid, 'poweroff')}
                          disabled={isTargeted}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/50 text-xs font-bold transition"
                        >
                          Force Off
                        </button>
                        <button
                          onClick={() => handleControlVm(vm.uuid, 'reset')}
                          disabled={isTargeted}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                          title="Reset VM"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSnapshotVm(vm);
                        setSnapshotName(`ShadowX_${vm.name.replace(/\s+/g, '_')}_Clean`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1"
                      title="Take snapshot"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Snapshot</span>
                    </button>
                    {vm.ip_address && (
                      <button
                        onClick={() => {
                          setPingTarget(vm.ip_address!);
                          document.getElementById('connectivity-test')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <Wifi className="w-3 h-3" />
                        <span>Ping Probe</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live Network & Connectivity Probe Tester ── */}
      <div id="connectivity-test" className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Real VM Network Connectivity &amp; Port Probe</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify live network reachability to your VirtualBox guest machines from the ShadowX Appliance.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-500 font-bold">ICMP &amp; TCP Socket Engine</span>
        </div>

        <form onSubmit={handlePingTest} className="flex flex-wrap gap-3 font-mono">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={pingTarget}
              onChange={e => setPingTarget(e.target.value)}
              placeholder="VM IP Address (e.g. 192.168.1.33)"
              className="w-full bg-slate-50 dark:bg-[#080A0E] border border-slate-200 dark:border-[#202736] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#E31E24]"
            />
          </div>
          <div className="w-32">
            <input
              type="number"
              value={pingPort}
              onChange={e => setPingPort(e.target.value)}
              placeholder="Port (e.g. 22)"
              className="w-full bg-slate-50 dark:bg-[#080A0E] border border-slate-200 dark:border-[#202736] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#E31E24]"
            />
          </div>
          <button
            type="submit"
            disabled={pingLoading}
            className="px-5 py-2.5 rounded-xl bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold transition flex items-center gap-2 shadow disabled:opacity-50"
          >
            {pingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            <span>Test Real Connectivity</span>
          </button>
        </form>

        {pingResult && (
          <div className={`p-4 rounded-xl border font-mono text-xs ${
            pingResult.ping_ok
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/40 text-red-900 dark:text-red-300'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span>Host {pingResult.ip} : {pingResult.ping_ok ? '✓ ICMP Reachable' : '✕ No Ping Response'}</span>
              {pingResult.latency_ms !== null && <span>Latency: {pingResult.latency_ms} ms</span>}
            </div>
            {pingResult.port && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                TCP Port {pingResult.port} : {pingResult.port_open ? '✓ Port Open & Accepting Connections' : '✕ Port Closed / Filtered'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── VirtualBox Multi-VM Cyber Range Architecture ── */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
          Recommended VirtualBox Lab Topology for SOC Operations
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          How to configure your 4 virtual machines in VirtualBox to experience the complete V8 network journey to pfSense:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">1. GATEWAY FIREWALL</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">pfsense vm</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              • Adapter 1 (WAN): Bridged to your home router<br />
              • Adapter 2 (LAN): Internal Network <code>shadowx-lan</code> (IP: 10.10.20.1)<br />
              • Used in: Labs 19, 28, 45
            </p>
          </div>

          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">2. SOC ATTACKER</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">kali linux</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              • Adapter 1: Bridged / Internal Network<br />
              • Live IP: <b>192.168.1.33</b><br />
              • Run real Nmap, Wireshark, Metasploit, Nikto against lab targets
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">3. TARGET ASSET</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">Metasploitable VM</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              • Adapter 1: Internal Network <code>shadowx-lan</code><br />
              • IP: 10.10.20.15<br />
              • Target of Nmap scans, Nessus audits &amp; web exploits
            </p>
          </div>
        </div>
      </div>

      {/* ── Edit Role Modal ── */}
      {editingVm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Configure Lab Role: {editingVm.name}
            </h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Assigned SOC Role:</label>
              <select
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080A0E] border border-slate-200 dark:border-[#202736] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="pfSense Perimeter Gateway">pfSense Perimeter Gateway (Labs 19 &amp; 28)</option>
                <option value="SOC Analyst / Attacker">SOC Analyst / Attacker (Kali Linux)</option>
                <option value="Vulnerable Target Web Server">Vulnerable Target Web Server (Metasploitable)</option>
                <option value="Corporate Windows / Linux Endpoint">Corporate Windows / Linux Endpoint</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Designated IP Address:</label>
              <input
                type="text"
                value={ipInput}
                onChange={e => setIpInput(e.target.value)}
                placeholder="e.g. 10.10.20.1 or 192.168.1.33"
                className="w-full bg-slate-50 dark:bg-[#080A0E] border border-slate-200 dark:border-[#202736] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingVm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2 rounded-xl bg-[#E31E24] text-white text-xs font-bold"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Snapshot Modal ── */}
      {snapshotVm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Take Snapshot: {snapshotVm.name}
            </h3>
            <p className="text-xs text-slate-400">
              Save the current state of this virtual machine so you can revert back after doing hands-on attacks or configuration experiments.
            </p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Snapshot Name:</label>
              <input
                type="text"
                value={snapshotName}
                onChange={e => setSnapshotName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080A0E] border border-slate-200 dark:border-[#202736] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSnapshotVm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeSnapshot}
                className="px-5 py-2 rounded-xl bg-[#E31E24] text-white text-xs font-bold"
              >
                Capture Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
