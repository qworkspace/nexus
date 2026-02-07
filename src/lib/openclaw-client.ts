// Shared OpenClaw client utilities

export interface OpenClawSession {
  key: string;
  kind: 'direct' | 'main' | 'spawn' | 'cron' | 'other';
  updatedAt: number;
  ageMs: number;
  sessionId: string;
  model: string;
  contextTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  systemSent?: boolean;
}

export interface OpenClawCronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  state: {
    nextRunAtMs: number;
    lastRunAtMs?: number;
    lastStatus?: 'ok' | 'error';
    lastDurationMs?: number;
  };
}

export interface OpenClawSessionsResponse {
  source: 'live' | 'mock' | 'error';
  data: {
    count: number;
    sessions: OpenClawSession[];
  };
  error?: string;
  suggestion?: string;
}

export interface OpenClawCronsResponse {
  source: 'live' | 'mock' | 'error';
  data: {
    jobs: OpenClawCronJob[];
  };
  error?: string;
  suggestion?: string;
}

export interface OpenClawStatusResponse {
  online: boolean;
  data?: unknown;
  error?: string;
  suggestion?: string;
}

// Fetcher function for SWR
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & { info?: unknown; status?: number };
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Transform OpenClaw session data to app format
export function transformSession(session: OpenClawSession) {
  const kind: 'main' | 'spawn' | 'cron' = session.key.startsWith('agent:main:main')
    ? 'main'
    : session.key.includes('cron')
      ? 'cron'
      : 'spawn';

  // Extract agent name from key
  const agent = kind === 'main' ? 'Q' : session.key.split(':')[1] || 'Unknown';

  // Calculate duration from ageMs
  const duration = Math.floor(session.ageMs / 1000);

  // Determine status based on recency
  const now = Date.now();
  const ageMinutes = (now - session.updatedAt) / 60000;
  const status = ageMinutes < 5 ? 'active' : 'complete';

  // Extract model name
  const modelName = session.model
    .replace('anthropic/', '')
    .replace('claude-', '')
    .replace('openai/', '')
    .replace('zai/', '');

  return {
    key: session.key,
    displayName: kind === 'main'
      ? 'Main Session (Q ↔ PJ)'
      : kind === 'cron'
        ? 'Cron Session'
        : `${agent} Agent`,
    kind,
    agent,
    agentEmoji: agent === 'Q' ? '🦾' : agent === 'Dev' ? '💻' : '🤖',
    model: modelName,
    status: status as 'active' | 'building' | 'complete' | 'error',
    tokenUsage: session.totalTokens || 0,
    duration,
    lastMessage: '',
    task: '',
    startedAt: new Date(now - session.ageMs),
    updatedAt: new Date(session.updatedAt),
  };
}

// Transform OpenClaw cron data to app format
export function transformCron(cron: OpenClawCronJob) {
  const lastRun = cron.state.lastRunAtMs ? new Date(cron.state.lastRunAtMs) : undefined;
  const nextRun = new Date(cron.state.nextRunAtMs);

  // Determine status
  let status: 'pending' | 'success' | 'slow' | 'error';
  if (cron.state.lastStatus === 'error') {
    status = 'error';
  } else if (cron.state.lastStatus === 'ok' && cron.state.lastDurationMs && cron.state.lastDurationMs > 120000) {
    status = 'slow';
  } else if (cron.state.lastStatus === 'ok') {
    status = 'success';
  } else {
    status = 'pending';
  }

  // Format time from cron expression
  const exprParts = cron.schedule.expr.split(' ');
  const time = `${exprParts[1].padStart(2, '0')}:${exprParts[0].padStart(2, '0')}`;

  return {
    id: cron.id,
    name: cron.name,
    time,
    nextRun,
    lastRun,
    status,
    duration: cron.state.lastDurationMs ? Math.floor(cron.state.lastDurationMs / 1000) : undefined,
    expectedDuration: 60, // Default 60s expectation
    description: '', // Could be extracted from payload if needed
  };
}
