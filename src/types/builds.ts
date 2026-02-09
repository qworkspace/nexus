// Build Dashboard Types

export interface DevSession {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'failed';
  task: string;
  durationMs?: number;
  tokenCount?: number;
  cost?: number;
}

export interface QueuedSpec {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2';
  epic?: string;
  estTime?: string;
  createdAt: string;
}

export interface BuildStats {
  totalToday: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
}
