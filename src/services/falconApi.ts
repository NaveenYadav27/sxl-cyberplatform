import { FalconSensor, FalconDetection, FalconProcessTreeNode } from '../types/falcon';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.detail || jsonErr.message || errText;
      } catch {}
      throw new Error(parsedErr);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[FalconAPI] Request failed for ${endpoint}:`, error);
    throw error;
  }
}

export const FalconAPI = {
  getSensors: () => request<FalconSensor[]>("/falcon/sensors"),
  getSensorDetail: (aid: string) => request<FalconSensor>(`/falcon/sensors/${aid}`),
  toggleContainment: (aid: string) => request<{ status: string; aid: string; hostname: string; containment_status: string; message: string }>(`/falcon/sensors/${aid}/contain`, { method: "POST" }),
  getDetections: () => request<FalconDetection[]>("/falcon/detections"),
  getDetectionTree: (detectionId: string) => request<{ detection_id: string; root_process: FalconProcessTreeNode }>(`/falcon/detections/${detectionId}/tree`),
  executeRtr: (aid: string, command: string) => request<{ status: string; output: string }>("/falcon/rtr/execute", {
    method: "POST",
    body: JSON.stringify({ aid, command })
  }),

  // Real Proxmox VE Integration API
  getProxmoxConfig: () => request<any>("/proxmox/config"),
  testProxmox: (payload: { host: string; token_id: string; token_secret: string; node_name?: string; verify_ssl?: boolean }) =>
    request<any>("/proxmox/test", { method: "POST", body: JSON.stringify(payload) }),
  getProxmoxVms: () => request<{ vms: any[]; count: number; host: string; node: string; is_connected: boolean }>("/proxmox/vms"),
  rollbackSnapshot: (vmid: number, snapname = "baseline-clean") =>
    request<any>(`/proxmox/vms/${vmid}/snapshot/rollback`, { method: "POST", body: JSON.stringify({ snapname }) })
};
