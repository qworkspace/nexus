/**
 * OpenClaw Client - Utilities for fetching and transforming OpenClaw data
 */

// Types for OpenClaw API responses
export interface OpenClawSession {
  key: string;
  kind: string;
  updatedAt: number;
  ageMs: number;
  sessionId: string;
  systemSent: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens: number;
  model: string;
  contextTokens?: number;
  abortedLastRun?: boolean;
}

export interface OpenClawSessionsResponse {
  path: string;
  count: number;
  activeMinutes: number | null;
  sessions: OpenClawSession[];
}

export interface OpenClawCronJob {
  id: string;
  agentId: string;
  name: string;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  sessionTarget: string;
  wakeMode: string;
  payload: Record<string, unknown>;
  state: {
    nextRunAtMs: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
  };
  enabled: boolean;
  delivery?: Record<string, unknown>;
}

export interface OpenClawCronsResponse {
  jobs: OpenClawCronJob[];
}

export interface OpenClawCronRun {
  ts: number;
  jobId: string;
  action: string;
  status: string;
  runAtMs: number;
  durationMs: number;
  nextRunAtMs?: number;
}

export interface OpenClawCronRunsResponse {
  entries: OpenClawCronRun[];
}

export interface OpenClawStatusResponse {
  online: boolean;
  data?: Record<string, unknown>;
  error?: string;
  suggestion?: string;
}

// Transform functions to convert OpenClaw data to Mission Control format
export function transformSession(session: OpenClawSession): {
  key: string;
  displayName: string;
  kind: 'main' | 'spawn' | 'cron' | 'other';
  agent: string;
  agentEmoji: string;
  model: string;
  status: 'active' | 'building' | 'complete' | 'error';
  tokenUsage: number;
  duration: number;
  lastMessage: string;
  task?: string;
  startedAt: Date;
  updatedAt: Date;
  totalTokens: number;
} {
  // Parse key to determine type
  const keyParts = session.key.split(':');
  const kind = keyParts[1] || 'other';
  
  // Calculate duration from ageMs
  const duration = Math.floor(session.ageMs / 1000);
  const startedAt = new Date(Date.now() - session.ageMs);
  const updatedAt = new Date(session.updatedAt);

  // Determine if active based on age
  const isActive = session.ageMs < 3600000; // Active if updated within last hour
  
  // Map to our kind types
  let mappedKind: 'main' | 'spawn' | 'cron' | 'other';
  let agent: string;
  let agentEmoji: string;
  
  if (kind === 'main' || keyParts[2] === 'main') {
    mappedKind = 'main';
    agent = 'Q';
    agentEmoji = '🦾';
  } else if (kind === 'cron') {
    mappedKind = 'cron';
    agent = 'Q';
    agentEmoji = '🔄';
  } else if (keyParts[0] === 'agent' && keyParts[1] === 'spawn') {
    mappedKind = 'spawn';
    agent = keyParts[2] || 'Dev';
    agentEmoji = '💻';
  } else {
    mappedKind = 'other';
    agent = 'Agent';
    agentEmoji = '🤖';
  }

  // Get display name
  const displayName = `${mappedKind === 'main' ? 'Main Session' : mappedKind === 'cron' ? 'Cron' : mappedKind === 'spawn' ? 'Spawn Agent' : 'Agent'} (${agent})`;

  // Map model to short name
  const modelMap: Record<string, string> = {
    'claude-opus-4-5': 'opus',
    'anthropic/claude-opus-4-5': 'opus',
    'claude-sonnet-4-5': 'sonnet',
    'zai/glm-4.7': 'glm-4.7',
    'zai/glm-4.7-flash': 'glm-flash',
  };
  const shortModel = modelMap[session.model] || session.model.split('/').pop() || session.model;

  return {
    key: session.key,
    displayName,
    kind: mappedKind,
    agent,
    agentEmoji,
    model: shortModel,
    status: isActive ? 'active' : 'complete',
    tokenUsage: session.totalTokens,
    duration,
    lastMessage: 'Session updated',
    startedAt,
    updatedAt,
    totalTokens: session.totalTokens,
  };
}

export function transformCronJob(job: OpenClawCronJob): {
  id: string;
  name: string;
  time: string;
  nextRun?: Date;
  lastRun?: Date;
  status: 'pending' | 'success' | 'slow' | 'error';
  duration?: number;
  expectedDuration?: number;
  description?: string;
  schedule: string;
  enabled: boolean;
} {
  // Parse cron expr to get time
  const exprParts = job.schedule.expr.split(' ');
  const [minute, hour] = exprParts;
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  // Determine status
  let status: 'pending' | 'success' | 'slow' | 'error' = 'pending';
  if (job.state.lastStatus === 'error') {
    status = 'error';
  } else if (job.state.lastStatus === 'ok') {
    if (job.state.lastDurationMs && job.state.lastDurationMs > 60000) {
      status = 'slow';
    } else {
      status = 'success';
    }
  }

  // Get expected duration from payload timeout
  const expectedDuration = (job.payload?.timeoutSeconds as number) || 60;

  // Extract description from payload
  let description = '';
  if (job.payload?.kind === 'systemEvent') {
    const text = job.payload.text as string | undefined;
    description = text?.substring(0, 100) || '';
  } else if (job.payload?.kind === 'agentTurn') {
    const message = job.payload.message as string | undefined;
    description = message?.substring(0, 100) || '';
  }

  return {
    id: job.id,
    name: job.name,
    time,
    nextRun: new Date(job.state.nextRunAtMs),
    lastRun: job.state.lastRunAtMs ? new Date(job.state.lastRunAtMs) : undefined,
    status,
    duration: job.state.lastDurationMs ? Math.floor(job.state.lastDurationMs / 1000) : undefined,
    expectedDuration,
    description: description.length > 0 ? description : undefined,
    schedule: job.schedule.expr,
    enabled: job.enabled,
  };
}

export function transformCronRun(run: OpenClawCronRun): {
  ts: number;
  jobId: string;
  action: string;
  status: string;
  runAt: Date;
  durationMs: number;
  nextRunAt?: Date;
} {
  return {
    ts: run.ts,
    jobId: run.jobId,
    action: run.action,
    status: run.status,
    runAt: new Date(run.runAtMs),
    durationMs: run.durationMs,
    nextRunAt: run.nextRunAtMs ? new Date(run.nextRunAtMs) : undefined,
  };
}

// Fetcher function for SWR
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// Fetch real OpenClaw data
export async function fetchOpenClawSessions(): Promise<OpenClawSessionsResponse> {
  const response = await fetch('/api/openclaw/sessions');
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  const result = await response.json();
  
  // Handle both direct data and wrapped responses
  if (result.source === 'mock' && result.data) {
    return result.data;
  }
  if (result.source === 'error') {
    throw new Error(result.error || 'Failed to fetch sessions');
  }
  if (result.data) {
    return result.data;
  }
  
  return result;
}

export async function fetchOpenClawCrons(): Promise<OpenClawCronsResponse> {
  const response = await fetch('/api/openclaw/crons');
  if (!response.ok) {
    throw new Error('Failed to fetch crons');
  }
  const result = await response.json();
  
  // Handle both direct data and wrapped responses
  if (result.source === 'mock' && result.data) {
    return result.data;
  }
  if (result.source === 'error') {
    throw new Error(result.error || 'Failed to fetch crons');
  }
  if (result.data) {
    return result.data;
  }
  
  return result;
}

export async function fetchOpenClawStatus(): Promise<OpenClawStatusResponse> {
  const response = await fetch('/api/openclaw/status');
  if (!response.ok) {
    throw new Error('Failed to fetch status');
  }
  return response.json();
}

export async function fetchOpenClawCronRuns(jobId: string, limit = 10): Promise<OpenClawCronRunsResponse> {
  const response = await fetch(`/api/openclaw/crons/${jobId}/runs?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cron runs');
  }
  return response.json();
}
