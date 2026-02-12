// Mock data for dev agent build monitor

export interface BuildSession {
  id: string;
  label: string;
  task: string;
  specPath?: string;
  status: 'building' | 'complete' | 'error';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  estimatedDuration?: number;
  tokenUsage?: number;
  error?: string;
  result?: string; // Summary from completion
}

export interface QueuedSpec {
  id: string;
  name: string;
  specPath: string;
  estimatedDuration: string;
  addedAt: Date;
}

export interface BuildStats {
  completedToday: number;
  currentlyBuilding: number;
  queueSize: number;
  avgDuration: number;
  successRate: number;
  totalTimeToday: number;
  mostProductiveHour: string;
  buildsInPeakHour: number;
}

// Active builds - currently running
export const mockActiveBuilds: BuildSession[] = [
  {
    id: '48e53cdd',
    label: 'cryptomon-portfolio-experience',
    task: 'Build the CryptoMon Complete Portfolio Experience with portfolio overview, asset allocation, performance metrics, and export functionality.',
    status: 'building',
    startedAt: new Date('2026-02-07T16:42:00'),
    estimatedDuration: 7200, // 2 hours
    tokenUsage: 124000,
  },
  {
    id: 'd9f82a44',
    label: 'mission-control-live-dashboard',
    task: 'Build the Nexus Live Operations Dashboard with real-time agent monitoring, live metrics streaming, and instant status updates.',
    status: 'building',
    startedAt: new Date('2026-02-07T16:45:00'),
    estimatedDuration: 5400, // 1.5 hours
    tokenUsage: 89000,
  },
];

// Recent builds - completed today
export const mockRecentBuilds: BuildSession[] = [
  {
    id: 'c1557883',
    label: 'cryptomon-market',
    task: 'Build Market Overview dashboard with price tracking and trends.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:36:00'),
    completedAt: new Date('2026-02-07T16:38:28'),
    duration: 148,
    tokenUsage: 45000,
    result: 'Successfully built market overview with 8 tracked assets',
  },
  {
    id: 'a9f77b12',
    label: 'cryptomon-compare-fix',
    task: 'Fix comparison tool bug with decimal precision.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:34:00'),
    completedAt: new Date('2026-02-07T16:36:51'),
    duration: 111,
    tokenUsage: 32000,
    result: 'Fixed decimal precision in comparison calculations',
  },
  {
    id: 'e3d66c55',
    label: 'cryptomon-compare',
    task: 'Build CryptoMon Compare tool for asset comparison.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:32:00'),
    completedAt: new Date('2026-02-07T16:34:21'),
    duration: 141,
    tokenUsage: 38000,
    result: 'Successfully built comparison tool with 5 metrics',
  },
  {
    id: 'b8e55d99',
    label: 'cryptomon-goals-v2',
    task: 'Build enhanced goals tracking with milestones.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:30:00'),
    completedAt: new Date('2026-02-07T16:33:39'),
    duration: 219,
    tokenUsage: 56000,
    result: 'Goals v2 with milestone tracking complete',
  },
  {
    id: 'f7c44e88',
    label: 'mission-control-agents',
    task: 'Build agent directory with status tracking.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:28:00'),
    completedAt: new Date('2026-02-07T16:29:59'),
    duration: 119,
    tokenUsage: 34000,
    result: 'Agent directory with 9 agents configured',
  },
  {
    id: 'a6b33d77',
    label: 'mission-control-memory',
    task: 'Build memory tree visualization component.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:26:00'),
    completedAt: new Date('2026-02-07T16:27:53'),
    duration: 113,
    tokenUsage: 29000,
    result: 'Memory tree with expandable nodes built',
  },
  {
    id: 'e5a22c66',
    label: 'cryptomon-watchlist',
    task: 'Build watchlist feature for tracked assets.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:24:00'),
    completedAt: new Date('2026-02-07T16:26:05'),
    duration: 125,
    tokenUsage: 41000,
    result: 'Watchlist with notifications implemented',
  },
  {
    id: 'd4911b55',
    label: 'cryptomon-analytics',
    task: 'Build analytics dashboard with charts.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:22:00'),
    completedAt: new Date('2026-02-07T16:24:00'),
    duration: 120,
    tokenUsage: 48000,
    result: 'Analytics with 3 chart types complete',
  },
  {
    id: 'c3800a44',
    label: 'cryptomon-export',
    task: 'Build data export functionality.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:20:00'),
    completedAt: new Date('2026-02-07T16:22:35'),
    duration: 155,
    tokenUsage: 37000,
    result: 'Export to CSV and JSON implemented',
  },
  {
    id: 'b2799933',
    label: 'mission-control-crons',
    task: 'Build cron job monitoring dashboard.',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:18:00'),
    completedAt: new Date('2026-02-07T16:19:23'),
    duration: 83,
    tokenUsage: 26000,
    result: 'Cron dashboard with timeline built',
  },
];

// Build queue - specs waiting to be built
export const mockBuildQueue: QueuedSpec[] = [
  {
    id: 'queue-1',
    name: 'cryptomon-telegram-alerts',
    specPath: 'COMPREHENSIVE-TELEGRAM-ALERTS.md',
    estimatedDuration: '1.5-2 hours',
    addedAt: new Date('2026-02-07T16:15:00'),
  },
  {
    id: 'queue-2',
    name: 'mission-control-api-integration',
    specPath: 'COMPREHENSIVE-API-INTEGRATION.md',
    estimatedDuration: '2-3 hours',
    addedAt: new Date('2026-02-07T16:10:00'),
  },
];

// Failed builds (if any)
export const mockFailedBuilds: BuildSession[] = [
  {
    id: 'error-48e53',
    label: 'cryptomon-goals',
    task: 'Build goals tracking feature.',
    status: 'error',
    startedAt: new Date('2026-02-07T15:44:00'),
    completedAt: new Date('2026-02-07T15:45:00'),
    duration: 60,
    error: 'TypeScript error in compare.tsx: Property "target" does not exist on type "Asset"',
  },
];

// Statistics
export const mockBuildStats: BuildStats = {
  completedToday: 11,
  currentlyBuilding: 2,
  queueSize: 2,
  avgDuration: 402, // seconds (6m 42s)
  successRate: 91.7, // percentage (11 of 12 completed, 1 failed)
  totalTimeToday: 4800, // seconds (1h 20m)
  mostProductiveHour: '16:00-17:00',
  buildsInPeakHour: 11,
};

// Helper function to calculate progress percentage
export function calculateProgress(
  startedAt: Date,
  estimatedDuration: number
): number {
  const now = new Date();
  const elapsed = (now.getTime() - startedAt.getTime()) / 1000; // seconds
  const progress = (elapsed / estimatedDuration) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return `${minutes}m ${secs}s`;
}

// Helper function to format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}
