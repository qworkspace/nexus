// CI Dashboard Types

export interface CIBuild {
  id: string;
  spec: string;
  status: 'running' | 'success' | 'failed' | 'parked';
  timestamp: string;
  testStatus?: 'pass' | 'fail' | 'pending';
  testDetails?: string;
  agent?: string;
  duration?: string;
  project?: string;
}

export interface CIQueueItem {
  id: string;
  title: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export interface CIPipelineHealth {
  successRate: number;
  totalBuilds: number;
  successCount: number;
  failureCount: number;
  failuresByProject: Record<string, number>;
}

export interface CIDashboardData {
  queue: CIQueueItem[];
  activeBuild: CIBuild | null;
  recentBuilds: CIBuild[];
  health: CIPipelineHealth;
  lastUpdated: string;
}
