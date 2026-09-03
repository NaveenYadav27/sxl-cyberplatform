import React, { useState, useEffect } from 'react';
import { FalconHeader } from '../components/falcon/FalconHeader';
import { IncidentWorkbench } from '../components/falcon/IncidentWorkbench';
import { HostManagement } from '../components/falcon/HostManagement';
import { RealTimeResponseTerminal } from '../components/falcon/RealTimeResponseTerminal';
import { FalconIntel } from '../components/falcon/FalconIntel';
import { ProxmoxConnectorModal } from '../components/falcon/ProxmoxConnectorModal';
import { FalconAPI } from '../services/falconApi';

export const FalconEdrPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workbench' | 'hosts' | 'rtr' | 'intel'>('workbench');
  const [rtrTargetAid, setRtrTargetAid] = useState<string>('WIN11-01');
  const [containedCount, setContainedCount] = useState<number>(0);
  const [isProxmoxOpen, setIsProxmoxOpen] = useState<boolean>(false);

  const checkSensorContainment = async () => {
    try {
      const sensors = await FalconAPI.getSensors();
      const count = sensors.filter((s) => s.containment_status === 'contained').length;
      setContainedCount(count);
    } catch (e) {
      console.warn("Sensor check failed:", e);
    }
  };

  useEffect(() => {
    checkSensorContainment();
  }, [activeTab]);

  const handleOpenRtr = (aid: string) => {
    setRtrTargetAid(aid);
    setActiveTab('rtr');
  };

  return (
    <div className="min-h-screen bg-[#080A0E] text-slate-200 flex flex-col font-sans">
      <FalconHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        containedCount={containedCount}
        onOpenProxmox={() => setIsProxmoxOpen(true)}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-6 py-6 space-y-6">
        {activeTab === 'workbench' && <IncidentWorkbench onOpenRtr={handleOpenRtr} />}
        {activeTab === 'hosts' && <HostManagement onOpenRtr={handleOpenRtr} />}
        {activeTab === 'rtr' && <RealTimeResponseTerminal initialAid={rtrTargetAid} />}
        {activeTab === 'intel' && <FalconIntel />}
      </main>

      <ProxmoxConnectorModal
        isOpen={isProxmoxOpen}
        onClose={() => setIsProxmoxOpen(false)}
      />
    </div>
  );
};
