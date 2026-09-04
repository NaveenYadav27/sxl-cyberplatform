import React, { useState, useEffect } from 'react';
import {
  Boxes, Server, Cpu, Play, Square, Pause, RotateCw, Camera,
  Undo2, Shield, Network, Terminal, CheckCircle2, AlertCircle,
  RefreshCw, Layers, ExternalLink, Globe, Wifi, Activity, Plus, Edit2, Loader2,
  Trash2, Copy, ToggleLeft, ToggleRight, ArrowRight, Cable, Settings, HardDrive
} from 'lucide-react';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

interface VBoxAdapter {
  index: number;
  mode: string;
  mac: string;
  cable_connected: boolean;
  network_name: string;
}

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
  cable_connected?: boolean;
  adapters?: VBoxAdapter[];
  assigned_role: string;
  target_labs: string[];
  last_updated: string;
}

interface HypervisorStatus {
  installed: boolean;
  version: string;
  executable_path: string | null;
  message: string;
}

interface SnapshotItem {
  name: string;
  uuid: string;
  description: string;
  is_current: boolean;
}

interface HostInterface {
  name: string;
  ip: string;
  mask: string;
  dhcp: string;
  status: string;
}

interface NatNetwork {
  name: string;
  network: string;
  gateway: string;
  dhcp: string;
}

interface DhcpServer {
  network_name: string;
  server_ip: string;
  pool_start: string;
  pool_end: string;
  enabled: string;
}

interface PortForwardRule {
  name: string;
  proto: string;
  host_ip: string;
  host_port: string;
  guest_ip: string;
  guest_port: string;
}

export const VirtualBoxLabWorkbench: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'snapshots' | 'network' | 'guest' | 'host' | 'bindings'>('fleet');
  const [hypervisor, setHypervisor] = useState<HypervisorStatus | null>(null);
  const [vms, setVms] = useState<VBoxVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'error' } | null>(null);

  // Selected VM for sub-panels
  const [selectedVmUuid, setSelectedVmUuid] = useState<string>('');
  const selectedVm = vms.find(v => v.uuid === selectedVmUuid) || vms[0] || null;

  // Edit Role Modal State
  const [editingVm, setEditingVm] = useState<VBoxVM | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [ipInput, setIpInput] = useState('');

  // Snapshot State
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [newSnapName, setNewSnapName] = useState('');
  const [newSnapDesc, setNewSnapDesc] = useState('');

  // Clone State
  const [cloneModalVm, setCloneModalVm] = useState<VBoxVM | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneMode, setCloneMode] = useState<'full' | 'linked'>('linked');

  // Network & Port Forward State
  const [portForwards, setPortForwards] = useState<PortForwardRule[]>([]);
  const [newPfName, setNewPfName] = useState('ssh_lab');
  const [newPfProto, setNewPfProto] = useState('tcp');
  const [newPfHostPort, setNewPfHostPort] = useState('2222');
  const [newPfGuestPort, setNewPfGuestPort] = useState('22');

  // Guest Control State
  const [guestUser, setGuestUser] = useState('kali');
  const [guestPass, setGuestPass] = useState('kali');
  const [guestCmd, setGuestCmd] = useState('/usr/bin/id');
  const [guestOut, setGuestOut] = useState<any>(null);
  const [guestLoading, setGuestLoading] = useState(false);

  // Host Networks State
  const [hostNetworks, setHostNetworks] = useState<{ host_only_interfaces: HostInterface[]; nat_networks: NatNetwork[]; dhcp_servers: DhcpServer[] }>({
    host_only_interfaces: [],
    nat_networks: [],
    dhcp_servers: []
  });

  // Lab Bindings State
  const [labBindings, setLabBindings] = useState<Record<string, any>>({});
  const [selectedLabId, setSelectedLabId] = useState('L01');
  const [bindCustomIp, setBindCustomIp] = useState('');

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
        const fetchedVms: VBoxVM[] = data.vms || [];
        setVms(fetchedVms);
        if (!selectedVmUuid && fetchedVms.length > 0) {
          setSelectedVmUuid(fetchedVms[0].uuid);
        }
        const active = fetchedVms.find(v => v.ip_address);
        if (active && active.ip_address) {
          setPingTarget(active.ip_address);
        }
      }

      // Fetch host networks
      const resNet = await fetch(`${BASE_URL}/virtualbox/host-networks`);
      if (resNet.ok) {
        setHostNetworks(await resNet.json());
      }

      // Fetch lab bindings
      const resBind = await fetch(`${BASE_URL}/virtualbox/lab-bindings`);
      if (resBind.ok) {
        const bindData = await resBind.json();
        setLabBindings(bindData.bindings || {});
      }
    } catch (e: any) {
      setMsg({ text: `Failed to load VirtualBox data: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVBoxData();
    const iv = setInterval(fetchVBoxData, 15000);
    return () => clearInterval(iv);
  }, []);

  // Fetch snapshots when selected VM changes
  useEffect(() => {
    if (!selectedVm) return;
    const fetchSnapshots = async () => {
      setSnapshotLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/snapshots`);
        if (res.ok) {
          const data = await res.json();
          setSnapshots(data.snapshots || []);
        }
        const resPf = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/port-forwards`);
        if (resPf.ok) {
          const data = await resPf.json();
          setPortForwards(data.rules || []);
        }
      } catch {
        // ignore
      } finally {
        setSnapshotLoading(false);
      }
    };
    fetchSnapshots();
  }, [selectedVmUuid]);

  const handleStartVm = async (uuid: string, mode: 'gui' | 'headless' | 'separate') => {
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

  const handleControlVm = async (uuid: string, action: 'savestate' | 'pause' | 'resume' | 'poweroff' | 'acpipowerbutton' | 'reset') => {
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
        setMsg({ text: `✓ Action '${action}' executed successfully.`, type: 'ok' });
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

  const handleToggleCable = async (uuid: string, nicIndex: number, currentConnected: boolean) => {
    setActionLoading(`cable-${uuid}-${nicIndex}`);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${uuid}/cable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic_index: nicIndex, connected: !currentConnected })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ Network cable for adapter ${nicIndex} set to ${!currentConnected ? 'CONNECTED' : 'DISCONNECTED'}.`, type: 'ok' });
        await fetchVBoxData();
      } else {
        setMsg({ text: `Error: ${data.detail || data.message}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!selectedVm) return;
    setActionLoading('take-snap');
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_name: newSnapName.trim() || `ShadowX_${Date.now()}`,
          description: newSnapDesc.trim() || 'Created from ShadowXLab Cyber Range Workbench'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ Snapshot captured successfully.`, type: 'ok' });
        setNewSnapName('');
        setNewSnapDesc('');
        const resSnaps = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/snapshots`);
        if (resSnaps.ok) setSnapshots((await resSnaps.json()).snapshots || []);
      } else {
        setMsg({ text: `Snapshot error: ${data.detail || data.message}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreSnapshot = async (snapshotName: string) => {
    if (!selectedVm) return;
    if (!window.confirm(`Restore ${selectedVm.name} to snapshot '${snapshotName}'? Any uncommitted changes will be lost.`)) return;
    setActionLoading('restore-snap');
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot_name: snapshotName })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ Restored VM to snapshot '${snapshotName}'.`, type: 'ok' });
        await fetchVBoxData();
      } else {
        setMsg({ text: `Error: ${data.detail || data.message}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSnapshot = async (snapshotName: string) => {
    if (!selectedVm) return;
    if (!window.confirm(`Delete snapshot '${snapshotName}'?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/snapshots/${encodeURIComponent(snapshotName)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMsg({ text: `✓ Snapshot '${snapshotName}' deleted.`, type: 'ok' });
        setSnapshots(prev => prev.filter(s => s.name !== snapshotName));
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    }
  };

  const handleCloneVm = async () => {
    if (!cloneModalVm) return;
    setActionLoading('clone');
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${cloneModalVm.uuid}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_name: cloneName.trim(),
          mode: cloneMode
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✓ Successfully cloned VM as '${cloneName}'.`, type: 'ok' });
        setCloneModalVm(null);
        setCloneName('');
        await fetchVBoxData();
      } else {
        setMsg({ text: `Clone error: ${data.detail || data.message}`, type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddPortForward = async () => {
    if (!selectedVm) return;
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/port-forwards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nic_index: 1,
          name: newPfName.trim(),
          proto: newPfProto,
          host_port: parseInt(newPfHostPort, 10),
          guest_port: parseInt(newPfGuestPort, 10)
        })
      });
      if (res.ok) {
        setMsg({ text: `✓ Port forward rule '${newPfName}' created.`, type: 'ok' });
        const resPf = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/port-forwards`);
        if (resPf.ok) setPortForwards((await resPf.json()).rules || []);
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    }
  };

  const handleDeletePortForward = async (name: string) => {
    if (!selectedVm) return;
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/port-forwards/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPortForwards(prev => prev.filter(r => r.name !== name));
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e.message}`, type: 'error' });
    }
  };

  const handleGuestExec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVm) return;
    setGuestLoading(true);
    setGuestOut(null);
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/vms/${selectedVm.uuid}/guest-exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: guestUser,
          password: guestPass,
          command: guestCmd
        })
      });
      setGuestOut(await res.json());
    } catch (e: any) {
      setGuestOut({ status: 'error', stderr: e.message });
    } finally {
      setGuestLoading(false);
    }
  };

  const handleAutoBind = async () => {
    setActionLoading('autobind');
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/lab-bindings/auto-bind`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLabBindings(data.bindings || {});
        setMsg({ text: `✓ Successfully bound ${data.bound_count} SOC labs to detected active VirtualBox VMs!`, type: 'ok' });
      }
    } catch (e: any) {
      setMsg({ text: `Auto-bind error: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveLabBinding = async () => {
    if (!selectedLabId) return;
    try {
      const res = await fetch(`${BASE_URL}/virtualbox/lab-bindings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lab_id: selectedLabId,
          vm_uuid: selectedVm ? selectedVm.uuid : null,
          custom_ip: bindCustomIp.trim() || (selectedVm ? selectedVm.ip_address : null),
          custom_name: selectedVm ? selectedVm.name : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLabBindings(prev => ({ ...prev, [selectedLabId]: data.binding }));
        setMsg({ text: `✓ Bound ${selectedLabId} to ${selectedVm?.name || 'Custom Target'} (${bindCustomIp || selectedVm?.ip_address})`, type: 'ok' });
      }
    } catch (e: any) {
      setMsg({ text: `Error saving binding: ${e.message}`, type: 'error' });
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
      if (res.ok) setPingResult(await res.json());
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
              Live hardware bridge: Power, snapshot, clone, reconfigure adapters, pull cables, and dynamically bind real VirtualBox VMs to all 40 SOC labs.
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

      {/* ── VirtualBox Hypervisor Stats Bar ── */}
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
          <div className="text-[10px] text-slate-500 mt-1">Kali, pfSense, Metasploitable</div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Active Running VMs</div>
          <div className="text-lg font-black text-emerald-500 mt-1">
            {vms.filter(v => v.status === 'running').length} Online
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Live guest socket telemetry</div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Host-Only Bridge</div>
          <div className="text-lg font-black text-blue-500 mt-1">
            {hostNetworks.host_only_interfaces[0]?.ip || '192.168.208.1'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">VirtualBox Host-Only Adapter</div>
        </div>
      </div>

      {/* ── VirtualBox Range Feature Sub-Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 dark:border-[#1A2035] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>VM Fleet &amp; Power Lifecycle</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'snapshots'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Snapshots &amp; Lab Clones</span>
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'network'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>Network Adapters &amp; Cable Pull Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('guest')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'guest'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Guest Command Runner</span>
        </button>

        <button
          onClick={() => setActiveTab('host')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'host'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Host Interfaces &amp; NAT Networks</span>
        </button>

        <button
          onClick={() => setActiveTab('bindings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bindings'
              ? 'border-[#E31E24] text-[#E31E24]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Dynamic Lab-to-VM Bindings</span>
        </button>
      </div>

      {/* ── TAB 1: VM FLEET & POWER LIFECYCLE ── */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-[#E31E24]" />
              <span>VirtualBox Machines in Active Lab Range ({vms.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Dynamic IP discovery via Guest Additions &amp; ARP</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vms.map(vm => {
              const isRunning = vm.status === 'running';
              const isSaved = vm.status === 'saved';
              const isTargeted = actionLoading === vm.uuid;

              return (
                <div
                  key={vm.uuid}
                  className={`bg-white dark:bg-[#0B1120] border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                    isRunning
                      ? 'border-emerald-500/40 shadow-emerald-950/10'
                      : isSaved
                      ? 'border-amber-500/40'
                      : 'border-slate-200 dark:border-[#1A2035]'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : isSaved ? 'bg-amber-400' : 'bg-slate-400'}`} />
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">{vm.name}</h3>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{vm.uuid}</div>
                      </div>
                      
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold font-mono uppercase ${
                        isRunning
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                          : isSaved
                          ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300 text-amber-800 dark:text-amber-400'
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
                        <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1.5">
                          <span>DYNAMIC IP:</span>
                          <b className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                            {vm.ip_address || 'Resolving on boot...'}
                          </b>
                        </div>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!isRunning ? (
                        <>
                          <button
                            onClick={() => handleStartVm(vm.uuid, 'gui')}
                            disabled={isTargeted}
                            className="px-3 py-1.5 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                            title="Start with full display window"
                          >
                            {isTargeted ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            <span>Start (GUI)</span>
                          </button>
                          <button
                            onClick={() => handleStartVm(vm.uuid, 'headless')}
                            disabled={isTargeted}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                            title="Run in background without opening window"
                          >
                            Headless
                          </button>
                          <button
                            onClick={() => handleStartVm(vm.uuid, 'separate')}
                            disabled={isTargeted}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs font-semibold"
                            title="Detachable Window"
                          >
                            Detachable
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleControlVm(vm.uuid, 'savestate')}
                            disabled={isTargeted}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 transition"
                            title="Save VM memory state to disk and close"
                          >
                            <HardDrive className="w-3 h-3" />
                            <span>Save State</span>
                          </button>
                          <button
                            onClick={() => handleControlVm(vm.uuid, 'acpipowerbutton')}
                            disabled={isTargeted}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1 transition"
                            title="Graceful OS Shutdown"
                          >
                            <Square className="w-3 h-3" />
                            <span>ACPI Off</span>
                          </button>
                          <button
                            onClick={() => handleControlVm(vm.uuid, 'poweroff')}
                            disabled={isTargeted}
                            className="px-2 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/50 text-xs font-bold transition"
                            title="Force Kill VM"
                          >
                            Force Off
                          </button>
                          <button
                            onClick={() => handleControlVm(vm.uuid, 'reset')}
                            disabled={isTargeted}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                            title="Hard Reset VM"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedVmUuid(vm.uuid);
                          setActiveTab('snapshots');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1"
                        title="Manage Snapshots"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Snapshots</span>
                      </button>
                      <button
                        onClick={() => {
                          setCloneModalVm(vm);
                          setCloneName(`${vm.name}_Student_Clone`);
                        }}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs flex items-center gap-1"
                        title="Clone this VM"
                      >
                        <Copy className="w-3 h-3" />
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
                          <span>Probe</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: SNAPSHOTS & CLONES ── */}
      {activeTab === 'snapshots' && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#E31E24]" />
                <span>VirtualBox Snapshot Management &amp; State Reversion</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Take instant snapshots before conducting attacks, and revert back to a pristine clean state with 1 click.
              </p>
            </div>

            {/* VM Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Selected VM:</span>
              <select
                value={selectedVmUuid}
                onChange={e => setSelectedVmUuid(e.target.value)}
                className="bg-slate-50 dark:bg-[#121827] border border-slate-200 dark:border-[#232F46] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
              >
                {vms.map(v => (
                  <option key={v.uuid} value={v.uuid}>{v.name} ({v.status})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Take Snapshot Form */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070A10] border border-slate-200 dark:border-[#1A2035] flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newSnapName}
              onChange={e => setNewSnapName(e.target.value)}
              placeholder={`Snapshot Name (e.g. Clean_OS_${new Date().toISOString().slice(0, 10)})`}
              className="flex-1 min-w-[220px] bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none"
            />
            <input
              type="text"
              value={newSnapDesc}
              onChange={e => setNewSnapDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 min-w-[200px] bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none"
            />
            <button
              onClick={handleTakeSnapshot}
              disabled={actionLoading === 'take-snap'}
              className="px-4 py-2 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Snapshot</span>
            </button>
          </div>

          {/* Snapshots Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Existing Snapshots on {selectedVm?.name || 'VM'} ({snapshots.length})
            </h4>

            {snapshotLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E31E24]" />
                <span>Reading VirtualBox snapshot tree...</span>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 dark:border-[#1A2035] rounded-xl">
                No snapshots found for this machine. Capture one above to safeguard your lab environment.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1A2035] border border-slate-200 dark:border-[#1A2035] rounded-xl overflow-hidden font-mono text-xs">
                {snapshots.map((snap, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-[#0B1120] flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#0E131F] transition">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{snap.name}</span>
                          {snap.is_current && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold">
                              CURRENT STATE
                            </span>
                          )}
                        </div>
                        {snap.description && <div className="text-[10px] text-slate-400">{snap.description}</div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreSnapshot(snap.name)}
                        className="px-2.5 py-1.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1"
                        title="Revert VM to this snapshot"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.name)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-500 transition"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: NETWORK ADAPTERS & CABLE PULL SIMULATOR ── */}
      {activeTab === 'network' && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Cable className="w-4 h-4 text-emerald-500" />
                <span>Multi-Adapter Management &amp; Air-Gap Cable Disconnect Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate pulling the Ethernet cable to quarantine a compromised host, or switch network modes (Host-Only, Bridged, NAT, Internal).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Select VM:</span>
              <select
                value={selectedVmUuid}
                onChange={e => setSelectedVmUuid(e.target.value)}
                className="bg-slate-50 dark:bg-[#121827] border border-slate-200 dark:border-[#232F46] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
              >
                {vms.map(v => (
                  <option key={v.uuid} value={v.uuid}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Adapters List for Selected VM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedVm?.adapters || [
              { index: 1, mode: selectedVm?.nic_type || 'nat', mac: selectedVm?.mac_address || '08:00:27:XX:XX:XX', cable_connected: selectedVm?.cable_connected ?? true, network_name: 'default' }
            ]).map(ad => (
              <div key={ad.index} className="p-4 rounded-xl border border-slate-200 dark:border-[#1A2035] bg-slate-50 dark:bg-[#080B12] font-mono text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-[#E31E24]" />
                    <span className="font-bold text-slate-900 dark:text-white">Adapter {ad.index}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    {ad.mode}
                  </span>
                </div>

                <div className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                  <div>MAC: <b className="text-slate-900 dark:text-white">{ad.mac}</b></div>
                  <div>Network: <b className="text-slate-900 dark:text-white">{ad.network_name}</b></div>
                </div>

                {/* Cable Simulator Action */}
                <div className="pt-3 border-t border-slate-200 dark:border-[#1A2035] flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ad.cable_connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {ad.cable_connected ? 'Cable Connected (Live Link)' : 'Cable Unplugged (Air-Gapped)'}
                  </span>

                  <button
                    onClick={() => handleToggleCable(selectedVm!.uuid, ad.index, ad.cable_connected)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      ad.cable_connected
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-600 border border-red-300 dark:border-red-800 hover:bg-red-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    <Cable className="w-3 h-3" />
                    <span>{ad.cable_connected ? 'Simulate Cable Pull' : 'Plug Cable In'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* NAT Port Forwarding Manager */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#1A2035]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              NAT Port Forwarding Rules on {selectedVm?.name} ({portForwards.length})
            </h4>

            {/* Add Rule Form */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070A10] border border-slate-200 dark:border-[#1A2035] flex flex-wrap items-center gap-2 text-xs font-mono">
              <input
                type="text"
                value={newPfName}
                onChange={e => setNewPfName(e.target.value)}
                placeholder="Rule Name"
                className="w-28 bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded px-2.5 py-1.5 text-slate-900 dark:text-white outline-none"
              />
              <select
                value={newPfProto}
                onChange={e => setNewPfProto(e.target.value)}
                className="bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded px-2 py-1.5 text-slate-900 dark:text-white outline-none uppercase font-bold"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
              <input
                type="number"
                value={newPfHostPort}
                onChange={e => setNewPfHostPort(e.target.value)}
                placeholder="Host Port (e.g. 2222)"
                className="w-36 bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded px-2.5 py-1.5 text-slate-900 dark:text-white outline-none"
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                value={newPfGuestPort}
                onChange={e => setNewPfGuestPort(e.target.value)}
                placeholder="Guest Port (e.g. 22)"
                className="w-36 bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded px-2.5 py-1.5 text-slate-900 dark:text-white outline-none"
              />
              <button
                onClick={handleAddPortForward}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Forward</span>
              </button>
            </div>

            {portForwards.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-[#1A2035] border border-slate-200 dark:border-[#1A2035] rounded-xl overflow-hidden font-mono text-xs">
                {portForwards.map((r, i) => (
                  <div key={i} className="p-2.5 bg-white dark:bg-[#0B1120] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{r.name}</span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        Host :{r.host_port} → Guest :{r.guest_port} ({r.proto.toUpperCase()})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePortForward(r.name)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: GUEST COMMAND RUNNER ── */}
      {activeTab === 'guest' && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>VirtualBox Direct Guest Execution Console</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute forensic scripts and commands inside running guest VMs without SSH using VirtualBox Guest Control APIs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Target VM:</span>
              <select
                value={selectedVmUuid}
                onChange={e => setSelectedVmUuid(e.target.value)}
                className="bg-slate-50 dark:bg-[#121827] border border-slate-200 dark:border-[#232F46] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
              >
                {vms.filter(v => v.status === 'running').map(v => (
                  <option key={v.uuid} value={v.uuid}>{v.name} (Running)</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleGuestExec} className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">GUEST USERNAME</label>
                <input
                  type="text"
                  value={guestUser}
                  onChange={e => setGuestUser(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080B12] border border-slate-200 dark:border-[#202736] rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">GUEST PASSWORD</label>
                <input
                  type="password"
                  value={guestPass}
                  onChange={e => setGuestPass(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080B12] border border-slate-200 dark:border-[#202736] rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">BINARY / SCRIPT PATH</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestCmd}
                  onChange={e => setGuestCmd(e.target.value)}
                  placeholder="/bin/bash or C:\Windows\System32\cmd.exe"
                  className="flex-1 bg-slate-50 dark:bg-[#080B12] border border-slate-200 dark:border-[#202736] rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={guestLoading || selectedVm?.status !== 'running'}
                  className="px-5 py-2 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-50"
                >
                  {guestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Exec Inside Guest</span>
                </button>
              </div>
            </div>
          </form>

          {guestOut && (
            <div className="p-4 rounded-xl bg-[#080B10] text-[#10B981] font-mono text-xs border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-1">
                <span>STATUS: {guestOut.status?.toUpperCase()}</span>
                <span>EXIT CODE: {guestOut.exit_code}</span>
              </div>
              <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed">
                {guestOut.stdout || guestOut.stderr || '(Command produced no stdout)'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: HOST NETWORKS & NAT NETWORKS ── */}
      {activeTab === 'host' && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-500" />
              <span>VirtualBox Host-Only Adapters, NAT Networks &amp; DHCP Pools</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Physical host hypervisor virtual network interfaces inspected directly from VBoxManage.
            </p>
          </div>

          {/* Host-Only Adapters */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Host-Only Network Interfaces ({hostNetworks.host_only_interfaces.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {hostNetworks.host_only_interfaces.map((hi, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-[#1A2035] bg-slate-50 dark:bg-[#070A10] space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                    <span>{hi.name}</span>
                    <span className="text-emerald-500">{hi.status}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">IP: <b className="text-slate-900 dark:text-white">{hi.ip}</b></div>
                  <div className="text-slate-500 text-[11px]">Subnet Mask: <b className="text-slate-900 dark:text-white">{hi.mask}</b></div>
                  <div className="text-slate-500 text-[11px]">DHCP: <b>{hi.dhcp}</b></div>
                </div>
              ))}
            </div>
          </div>

          {/* NAT Networks */}
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-[#1A2035]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              VirtualBox NAT Networks ({hostNetworks.nat_networks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {hostNetworks.nat_networks.map((nn, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-[#1A2035] bg-slate-50 dark:bg-[#070A10] space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                    <span>{nn.name}</span>
                    <span className="text-blue-500">Gateway: {nn.gateway}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Subnet: <b className="text-slate-900 dark:text-white">{nn.network}</b></div>
                  <div className="text-slate-500 text-[11px]">DHCP Server: <b>{nn.dhcp}</b></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: DYNAMIC LAB-TO-VM BINDINGS MATRIX ── */}
      {activeTab === 'bindings' && (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E31E24]" />
                <span>Dynamic SOC Lab to VirtualBox VM Binding Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bind your real local VirtualBox VMs or custom IP addresses to the 40 SOC L1 concept labs. Replaces hardcoded IPs automatically.
              </p>
            </div>

            <button
              onClick={handleAutoBind}
              disabled={actionLoading === 'autobind'}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E31E24] to-[#FF453A] hover:brightness-110 text-white text-xs font-bold transition flex items-center gap-2 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'autobind' ? 'animate-spin' : ''}`} />
              <span>Auto-Bind All Detected VMs</span>
            </button>
          </div>

          {/* Quick Bind Form */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070A10] border border-slate-200 dark:border-[#1A2035] flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="w-36">
              <label className="text-[10px] text-slate-400 block mb-1">SELECT LAB ID</label>
              <select
                value={selectedLabId}
                onChange={e => setSelectedLabId(e.target.value)}
                className="w-full bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-bold outline-none"
              >
                {Array.from({ length: 40 }, (_, i) => {
                  const labId = `L${(i + 1).toString().padStart(2, '0')}`;
                  return <option key={labId} value={labId}>{labId}</option>;
                })}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] text-slate-400 block mb-1">SELECT VIRTUALBOX VM</label>
              <select
                value={selectedVmUuid}
                onChange={e => {
                  setSelectedVmUuid(e.target.value);
                  const vm = vms.find(v => v.uuid === e.target.value);
                  if (vm?.ip_address) setBindCustomIp(vm.ip_address);
                }}
                className="w-full bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-bold outline-none"
              >
                {vms.map(v => (
                  <option key={v.uuid} value={v.uuid}>{v.name} ({v.ip_address || 'No IP'})</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="text-[10px] text-slate-400 block mb-1">CUSTOM TARGET IP OVERRIDE</label>
              <input
                type="text"
                value={bindCustomIp}
                onChange={e => setBindCustomIp(e.target.value)}
                placeholder="e.g. 192.168.208.50"
                className="w-full bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#232F46] rounded-lg px-3 py-1.5 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveLabBinding}
                className="px-4 py-2 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold transition shadow"
              >
                Save Lab Binding
              </button>
            </div>
          </div>

          {/* Bindings Matrix Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Active Dynamic Lab Bindings ({Object.keys(labBindings).length} of 40)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
              {Object.values(labBindings).map((b: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-[#1A2035] bg-white dark:bg-[#090D16] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#E31E24]">{b.lab_id}</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{b.name || 'Custom VM'}</span>
                    </div>
                    <div className="text-[11px] text-blue-500 font-bold mt-0.5">{b.ip}</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active binding" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Live Network & Connectivity Probe Tester ── */}
      <div id="connectivity-test" className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Real VM Network Connectivity &amp; Port Probe</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify live ICMP ping reachability and TCP socket latency to your VirtualBox guest machines.
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

      {/* Clone VM Modal */}
      {cloneModalVm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Copy className="w-4 h-4 text-[#E31E24]" />
              <span>Clone Virtual Machine: {cloneModalVm.name}</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">CLONE NAME</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={e => setCloneName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080B12] border border-slate-200 dark:border-[#202736] rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CLONE TYPE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCloneMode('linked')}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      cloneMode === 'linked'
                        ? 'border-[#E31E24] bg-red-50 dark:bg-red-950/20 text-[#E31E24] font-bold'
                        : 'border-slate-200 dark:border-[#202736] text-slate-400'
                    }`}
                  >
                    <div>Linked Clone</div>
                    <div className="text-[10px] opacity-75">Instant, shares base disk</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloneMode('full')}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      cloneMode === 'full'
                        ? 'border-[#E31E24] bg-red-50 dark:bg-red-950/20 text-[#E31E24] font-bold'
                        : 'border-slate-200 dark:border-[#202736] text-slate-400'
                    }`}
                  >
                    <div>Full Clone</div>
                    <div className="text-[10px] opacity-75">Completely independent</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCloneModalVm(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneVm}
                disabled={actionLoading === 'clone' || !cloneName.trim()}
                className="px-4 py-2 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                {actionLoading === 'clone' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Create Clone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingVm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1A2035] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#E31E24]" />
              <span>Configure Role &amp; IP: {editingVm.name}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">LAB ROLE TITLE</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080B12] border border-slate-200 dark:border-[#202736] rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">STATIC / GUEST IP ADDRESS</label>
                <input
                  type="text"
                  value={ipInput}
                  onChange={e => setIpInput(e.target.value)}
                  placeholder="e.g. 192.168.1.33 or 10.10.20.15"
                  className="w-full bg-slate-50 dark:bg-[#080B12] border border-slate-200 dark:border-[#202736] rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingVm(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#232F46] text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
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
                    setMsg({ text: `Error: ${e.message}`, type: 'error' });
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#E31E24] hover:bg-[#ff3d3d] text-white text-xs font-bold transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
