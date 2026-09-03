import React, { useState, useEffect } from 'react';
import {
  Server,
  Laptop,
  Shield,
  Lock,
  Unlock,
  Terminal,
  Radio,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Cpu,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FalconSensor } from '../../types/falcon';
import { FalconAPI } from '../../services/falconApi';

interface HostManagementProps {
  onOpenRtr: (aid: string) => void;
}

export const HostManagement: React.FC<HostManagementProps> = ({ onOpenRtr }) => {
  const [sensors, setSensors] = useState<FalconSensor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSensors = async () => {
    setIsLoading(true);
    try {
      const data = await FalconAPI.getSensors();
      setSensors(data || []);
    } catch (e) {
      console.warn("Failed to fetch sensors:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleToggleContainment = async (aid: string) => {
    try {
      const res = await FalconAPI.toggleContainment(aid);
      setToastMessage(res.message);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      await fetchSensors();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      setToastMessage(`Action failed: ${e.message}`);
    }
  };

  const filteredSensors = sensors.filter((s) => {
    if (!searchQuery) return true;
    return (
      s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ip_address.includes(searchQuery) ||
      s.aid.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-red-950/80 border border-red-500 text-red-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner & Sensor Metrics */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              Host Management & Sensor Health
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            FALCON SENSOR ENDPOINT INVENTORY
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Direct sensor management: Agent ID (AID), RFM reduced functionality state, and one-click network containment
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={fetchSensors}
            className="p-2 bg-[#121620] border border-[#202736] hover:border-slate-600 rounded-xl text-slate-300 transition"
            title="Refresh Sensors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sensor Table */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-[#202736] flex items-center justify-between bg-[#121620]/60">
          <div className="relative w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Hostname, IP, or AID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080A0E] border border-[#202736] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing <span className="text-white font-bold">{filteredSensors.length}</span> Active Sensors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-[#202736]">
            <thead className="bg-[#080A0E] text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Hostname & Platform</th>
                <th className="p-4">Agent ID (AID)</th>
                <th className="p-4">IP Address & MAC</th>
                <th className="p-4">Sensor Version</th>
                <th className="p-4">RFM State</th>
                <th className="p-4">Containment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202736]/60">
              {filteredSensors.map((s) => (
                <tr key={s.aid} className="hover:bg-[#121620]/80 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      {s.platform_name === 'Windows' ? (
                        <Laptop className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Server className="w-4 h-4 text-amber-400" />
                      )}
                      <div>
                        <div className="font-bold text-white text-sm">{s.hostname}</div>
                        <div className="text-[10px] text-slate-400">{s.os_version}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-400 text-[11px] truncate max-w-[140px]" title={s.aid}>
                    {s.aid}
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-white">{s.ip_address}</div>
                    <div className="text-[10px] text-slate-500">{s.mac_address}</div>
                  </td>

                  <td className="p-4 text-purple-300 font-bold">
                    v{s.sensor_version}
                  </td>

                  <td className="p-4">
                    <span className="text-emerald-400 font-bold text-[10px]">
                      ● Full Functionality
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        s.containment_status === 'contained'
                          ? 'bg-red-950 border-red-500 text-red-400 animate-pulse'
                          : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      }`}
                    >
                      ● {s.containment_status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenRtr(s.hostname)}
                        className="px-3 py-1.5 bg-[#182030] hover:bg-[#222C42] text-purple-300 border border-purple-500/40 rounded-lg font-bold transition flex items-center gap-1.5"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>RTR</span>
                      </button>

                      <button
                        onClick={() => handleToggleContainment(s.aid)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          s.containment_status === 'contained'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-[#E01A22] hover:bg-red-600 text-white shadow-md shadow-red-950'
                        }`}
                      >
                        {s.containment_status === 'contained' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{s.containment_status === 'contained' ? 'Lift' : 'Contain'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
