// Mock data for cron jobs matching OpenClaw cron format
export interface CronJob {
  id: string;
  name: string;
  schedule: { kind: string; expr: string; tz: string };
  enabled: boolean;
  lastStatus: 'ok' | 'error' | null;
  lastRunAt: Date | null;
  nextRunAt: Date;
  payload: { kind: string; message: string };
  runHistory: {
    id: string;
    status: 'ok' | 'error';
    timestamp: Date;
    duration?: number;
    error?: string;
  }[];
}

export const mockCronJobs: CronJob[] = [
  {
    id: '1',
    name: 'Daily Backup',
    schedule: { kind: 'cron', expr: '0 2 * * *', tz: 'Australia/Sydney' },
    enabled: true,
    lastStatus: 'ok',
    lastRunAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    nextRunAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
    payload: { kind: 'command', message: 'backup-all' },
    runHistory: [
      { id: '1', status: 'ok', timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000), duration: 1234 },
      { id: '2', status: 'ok', timestamp: new Date(Date.now() - 38 * 60 * 60 * 1000), duration: 1189 },
      { id: '3', status: 'ok', timestamp: new Date(Date.now() - 62 * 60 * 60 * 1000), duration: 1245 },
    ]
  },
  {
    id: '2',
    name: 'Health Check',
    schedule: { kind: 'cron', expr: '*/15 * * * *', tz: 'Australia/Sydney' },
    enabled: true,
    lastStatus: 'ok',
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000),
    nextRunAt: new Date(Date.now() + 10 * 60 * 1000),
    payload: { kind: 'message', message: 'health-check' },
    runHistory: [
      { id: '4', status: 'ok', timestamp: new Date(Date.now() - 5 * 60 * 1000), duration: 234 },
      { id: '5', status: 'ok', timestamp: new Date(Date.now() - 20 * 60 * 1000), duration: 198 },
      { id: '6', status: 'ok', timestamp: new Date(Date.now() - 35 * 60 * 1000), duration: 210 },
      { id: '7', status: 'error', timestamp: new Date(Date.now() - 50 * 60 * 1000), duration: 45, error: 'Connection timeout' },
    ]
  },
  {
    id: '3',
    name: 'Report Generation',
    schedule: { kind: 'cron', expr: '0 9 * * 1-5', tz: 'Australia/Sydney' },
    enabled: true,
    lastStatus: 'ok',
    lastRunAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    nextRunAt: new Date(Date.now() + 17 * 60 * 60 * 1000),
    payload: { kind: 'command', message: 'generate-report' },
    runHistory: [
      { id: '8', status: 'ok', timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000), duration: 5678 },
      { id: '9', status: 'ok', timestamp: new Date(Date.now() - 31 * 60 * 60 * 1000), duration: 5821 },
      { id: '10', status: 'ok', timestamp: new Date(Date.now() - 55 * 60 * 60 * 1000), duration: 5432 },
    ]
  },
  {
    id: '4',
    name: 'Cleanup Old Logs',
    schedule: { kind: 'cron', expr: '0 3 * * 0', tz: 'Australia/Sydney' },
    enabled: true,
    lastStatus: 'ok',
    lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    nextRunAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    payload: { kind: 'command', message: 'cleanup-logs' },
    runHistory: [
      { id: '11', status: 'ok', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), duration: 2345 },
      { id: '12', status: 'ok', timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), duration: 2189 },
    ]
  },
  {
    id: '5',
    name: 'Sync Database',
    schedule: { kind: 'cron', expr: '*/30 * * * *', tz: 'Australia/Sydney' },
    enabled: false,
    lastStatus: 'error',
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextRunAt: new Date(Date.now() + 30 * 60 * 1000),
    payload: { kind: 'command', message: 'sync-db' },
    runHistory: [
      { id: '13', status: 'error', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), duration: 1234, error: 'Database lock acquired' },
      { id: '14', status: 'ok', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), duration: 1156 },
      { id: '15', status: 'ok', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), duration: 1201 },
    ]
  },
  {
    id: '6',
    name: 'Send Notifications',
    schedule: { kind: 'cron', expr: '0 */2 * * *', tz: 'Australia/Sydney' },
    enabled: true,
    lastStatus: null,
    lastRunAt: null,
    nextRunAt: new Date(Date.now() + 43 * 60 * 1000),
    payload: { kind: 'message', message: 'send-notifications' },
    runHistory: []
  },
];
