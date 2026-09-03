export type OperationalMode = "INITIALIZING" | "LIVE_LAB" | "DEGRADED" | "TRAINING_SIMULATION";

export type MetricSourceType =
  | "asset_registry"
  | "event_store"
  | "detection_engine"
  | "case_engine"
  | "purple_evaluation_engine"
  | "mitre_evidence_engine"
  | "proxmox_adapter"
  | "virtualbox_adapter"
  | "splunk_adapter"
  | "network_interface_engine"
  | "appliance_health_manager";

export interface MetricSourceInfo<T = number | string | null> {
  metric: string;
  value: T;
  source: MetricSourceType;
  lastUpdated: string;
  freshness: "live" | "cached" | "stale" | "disconnected";
  status: "live" | "degraded" | "disconnected" | "no_telemetry" | "simulated";
  confidence: number; // 0.0 to 1.0
}

export interface ShadowEvent {
  schema_version: string;
  event_id: string;
  timestamp: string;
  source: string;
  collector: string;
  asset_id?: string | null;
  hostname?: string | null;
  ip?: string | null;
  mac?: string | null;
  user?: string | null;
  process?: string | null;
  parent_process?: string | null;
  command_line?: string | null;
  file_path?: string | null;
  file_hash?: string | null;
  src_ip?: string | null;
  src_port?: number | null;
  dst_ip?: string | null;
  dst_port?: number | null;
  protocol?: string | null;
  event_type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  confidence: number;
  risk_score: number;
  mitre_tactic?: string | null;
  mitre_technique?: string | null;
  exercise_id?: string | null;
  action_id?: string | null;
  raw_event?: Record<string, any>;
  correlation_id?: string | null;
}

export interface LabAsset {
  asset_id: string;
  hostname: string;
  ip_address: string;
  mac_address?: string;
  os_type: "windows" | "linux" | "kali" | "router" | "unknown";
  status: "active" | "offline" | "degraded";
  confidence_score: number;
  discovery_source: string;
  hypervisor?: {
    type?: string;
    node?: string;
    vmid?: string;
    vm_status?: string;
  };
  open_ports?: Array<{ port: number; service: string }>;
  first_seen?: string;
  last_seen?: string;
}

export interface AlertDetection {
  detection_id: string;
  title: string;
  rule_name: string;
  severity: "low" | "medium" | "high" | "critical";
  mitre_tactic?: string;
  mitre_technique?: string;
  triggered_at: string;
  event_id?: string;
  hostname?: string;
  status: string;
  risk_score_delta: number;
}

export interface IncidentCase {
  case_id: string;
  title: string;
  severity: string;
  status: "open" | "investigating" | "contained" | "closed";
  lead_analyst?: string;
  target_hostname?: string;
  exercise_id?: string;
  created_at: string;
  ttd_seconds?: number;
  tta_seconds?: number;
  tti_seconds?: number;
  ttr_seconds?: number;
  timeline_events: Array<{
    timestamp: string;
    stage: string;
    delta_s: number;
    desc: string;
  }>;
}

export interface PurpleExercise {
  exercise_id: string;
  title: string;
  mitre_technique: string;
  technique_name: string;
  target_hostname?: string;
  target_ip?: string;
  status: "pending" | "executing" | "analyzing" | "validated" | "completed" | "failed";
  total_purple_score: number;
  score_breakdown: {
    telemetry: number;
    detection: number;
    investigation: number;
    response: number;
  };
  evidence_proof?: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

export interface ApplianceHealthState {
  appliance_name: string;
  version: string;
  mode: OperationalMode;
  banner_message: string;
  reasons: string[];
  subsystems: {
    interfaces: Record<string, boolean>;
    collectors: Record<string, boolean>;
    connectors: Record<string, boolean>;
    discovery: boolean;
  };
  time_sync: {
    is_synchronized: boolean;
    clock_offset_ms: number;
    status: string;
    purple_metrics_enabled: boolean;
  };
  storage: {
    percent_used: number;
    storage_warning: boolean;
  };
  timestamp: string;
}
