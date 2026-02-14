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
  model?: string;
  buildStatus?: 'building' | 'verifying' | 'pushing';
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
  totalLinesChanged: number;
  period: '24h' | '7d' | '30d';
}

export interface CompletedBuild {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  specName?: string;
  specPath?: string;
  rating?: number;
  durationMs?: number;
}

export interface FeedbackEntry {
  spec: string;
  commit: string;
  rating: 'great' | 'good' | 'meh' | 'bad' | 'useless';
  ratedBy: string;
  ratedAt: string;
  model?: string;
  agent?: string;
  issues?: string[];
  context?: string;
}

export interface BuildWithFeedback {
  id: string;
  spec: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'STALLED' | 'OTHER';
  timestamp: string;
  testStatus?: string;
  testDetails?: string;
  feedback?: FeedbackEntry;
}

export interface PipelineStage {
  name: string;
  agent: 'cipher' | 'spark' | 'flux';
  items: PipelineItem[];
}

export interface PipelineItem {
  id: string;
  name: string;
  status: 'queued' | 'speccing' | 'building' | 'qa' | 'shipped' | 'failed';
  priority: 'P0' | 'P1' | 'P2';
  createdAt: string;
  estimatedDuration?: string;
}

export interface BuildSpeedMetrics {
  specToShipTime: { date: string; minutes: number }[];
  buildDurationTrend: { date: string; minutes: number }[];
  buildsPerDay: { date: string; count: number }[];
  reworkRate: number; // percentage
}
