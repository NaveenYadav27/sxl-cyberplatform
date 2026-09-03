import {
  ApplianceHealthState,
  LabAsset,
  ShadowEvent,
  AlertDetection,
  IncidentCase,
  PurpleExercise,
  MetricSourceInfo
} from "../types/appliance";

import { BASE_URL } from '../utils/config';
import { wsClient } from './websocket';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const isRemoteHttps = typeof window !== 'undefined' && 
      window.location.protocol === 'https:' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1';

    if (isRemoteHttps) {
      const method = options?.method || "GET";
      const body = options?.body ? JSON.parse(options.body as string) : undefined;
      const headers = options?.headers || {};
      const fullPath = `/api/v1${endpoint}`;
      return await wsClient.sendRpc(method, fullPath, body, headers) as T;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${await res.text()}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[ApplianceAPI] Request failed for ${endpoint}:`, error);
    throw error;
  }
}

export const ApplianceAPI = {
  // Health & Modes
  getHealth: () => request<ApplianceHealthState>("/appliance/health"),
  setMode: (mode: string) => request<{ status: string; current_mode: string }>("/appliance/mode", {
    method: "POST",
    body: JSON.stringify({ mode })
  }),
  completeFirstBoot: (config: Record<string, any>) => request<{ status: string }>("/appliance/first-boot-wizard", {
    method: "POST",
    body: JSON.stringify(config)
  }),

  // Network & Dual-NIC
  getInterfaces: () => request<any>("/network/interfaces"),

  // Assets & Discovery
  getAssets: () => request<{ assets: LabAsset[]; metric: string; value: number; source: any; confidence: number; status: any }>("/assets/"),
  triggerDiscovery: (subnet_cidr?: string) => request<{ status: string; hosts_discovered_count: number; hosts: any[] }>("/assets/discover", {
    method: "POST",
    body: JSON.stringify({ subnet_cidr })
  }),

  // Telemetry & Ingestion
  getEvents: (limit = 50) => request<{ events: ShadowEvent[]; count: number }>("/telemetry/events?limit=" + limit),
  getStats: () => request<MetricSourceInfo<number>>("/telemetry/stats"),
  ingestEvent: (eventData: Record<string, any>) => request<any>("/telemetry/ingest", {
    method: "POST",
    body: JSON.stringify(eventData)
  }),

  // Detections & MITRE
  getDetections: () => request<{ detections: AlertDetection[]; metric: string; value: number; status: any }>("/detections/"),
  getMitreMatrix: () => request<any>("/detections/mitre-matrix"),

  // Cases & Investigation
  getCases: () => request<{ cases: IncidentCase[]; metric: string; value: number; status: any }>("/cases/"),
  acknowledgeCase: (caseId: string) => request<any>(`/cases/${caseId}/acknowledge`, { method: "POST" }),
  containCase: (caseId: string, action = "HOST_ISOLATION") => request<any>(`/cases/${caseId}/contain`, {
    method: "POST",
    body: JSON.stringify({ action })
  }),

  // Purple Team Core
  getPurpleScore: () => request<MetricSourceInfo<string>>("/purple/score"),
  getExercises: () => request<PurpleExercise[]>("/purple/exercises"),
  launchExercise: (payload: {
    title: string;
    mitre_technique: string;
    technique_name: string;
    target_hostname: string;
    target_ip: string;
    command: string;
    protocol?: string;
    operator_confirmed?: boolean;
  }) => request<any>("/purple/launch", {
    method: "POST",
    body: JSON.stringify({ ...payload, operator_confirmed: true })
  }),
  evaluateExercise: (exerciseId: string) => request<any>(`/purple/${exerciseId}/evaluate`, { method: "POST" }),

  // Connectors
  getConnectors: () => request<any>("/connectors/status"),
  testProxmox: (payload: { host: string; token_id: string; token_secret: string }) => request<any>("/connectors/proxmox/test", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  searchSplunk: (spl_query: string) => request<any>("/connectors/splunk/search", {
    method: "POST",
    body: JSON.stringify({ spl_query })
  }),

  // Tool 1: Live EDR Endpoint API
  getEdrHosts: () => request<any[]>("/edr/hosts"),
  getHostEdrDetails: (hostname: string) => request<any>(`/edr/hosts/${hostname}`),
  killProcess: (hostname: string, pid: number) => request<any>(`/edr/hosts/${hostname}/processes/${pid}/kill`, { method: "POST" }),
  toggleHostIsolation: (hostname: string) => request<any>(`/edr/hosts/${hostname}/isolate`, { method: "POST" }),
  dumpProcessMemory: (hostname: string, pid: number) => request<any>(`/edr/hosts/${hostname}/processes/${pid}/dump`, { method: "POST" }),

  // Agents & Setup
  getAgents: () => request<any[]>("/agents/"),
  generateAgentToken: () => request<any>("/agents/token", { method: "POST" }),
  revokeAgent: (agentId: string, reason: string) => request<any>(`/agents/${agentId}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason })
  }),

  // Proxmox discovery & Manual Assets
  getProxmoxVms: () => request<any>("/proxmox/vms"),
  registerAsset: (payload: any) => request<any>("/assets/", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  deleteAsset: (assetId: string) => request<any>(`/assets/${assetId}`, { method: "DELETE" }),
  scanAsset: (assetId: string) => request<any>(`/assets/${assetId}/scan`, { method: "POST" })
};
