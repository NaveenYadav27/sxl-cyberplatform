export interface FalconSensor {
  aid: string;
  hostname: string;
  ip_address: string;
  mac_address: string;
  os_version: string;
  platform_name: string;
  sensor_version: string;
  status: 'online' | 'offline' | 'reduced_functionality';
  containment_status: 'normal' | 'contained' | 'containing';
  last_seen: string;
  rfm_state: boolean;
  cpu_usage_pct: number;
  memory_usage_pct: number;
  active_detections_count: number;
}

export interface FalconDetection {
  detection_id: string;
  cid: string;
  aid: string;
  hostname: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  score: number; // 1.0 - 10.0 Falcon Score
  status: 'new' | 'in_progress' | 'resolved_true_positive' | 'closed';
  ioa_name: string;
  objective: string;
  tactic: string;
  technique: string;
  technique_id: string;
  adversary: string;
  adversary_type: string;
  timestamp: string;
  trigger_process_name: string;
  trigger_process_pid: number;
  trigger_command_line: string;
  parent_process_name: string;
  user_name: string;
  containment_status: string;
  is_prevented: boolean;
}

export interface FalconProcessTreeNode {
  pid: number;
  name: string;
  command_line: string;
  user: string;
  sha256: string;
  signature: string;
  is_ioa: boolean;
  ioa_title?: string;
  severity?: string;
  tactic?: string;
  technique?: string;
  network_connections?: { proto: string; local_ip: string; local_port: number; remote_ip: string; remote_port: number; state: string }[];
  children?: FalconProcessTreeNode[];
}
