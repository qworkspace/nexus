import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  payload: {
    model: string;
  };
  delivery: {
    mode: 'none' | 'announce';
  };
  sessionTarget: 'main' | 'isolated';
  state: {
    nextRunAtMs: number;
    lastRunAtMs?: number;
    lastStatus?: 'ok' | 'error' | 'timeout';
    lastDurationMs?: number;
    lastError?: string;
    consecutiveErrors?: number;
  };
}

interface CronListResponse {
  source: 'live' | 'mock' | 'error';
  jobs: CronJob[];
  error?: string;
}

export async function GET(): Promise<NextResponse<CronListResponse>> {
  try {
    let result: string;
    try {
      result = execSync('openclaw cron list --json', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError) {
      console.error('OpenClaw CLI error:', cliError);
      return NextResponse.json({
        source: 'mock',
        jobs: getMockJobs(),
      });
    }

    const data = JSON.parse(result);
    const jobs: CronJob[] = (data.jobs || data || []).map((job: Record<string, unknown>) => ({
      id: String(job.id || ''),
      name: String(job.name || 'Unnamed'),
      enabled: Boolean(job.enabled !== false),
      schedule: {
        kind: String((job.schedule as Record<string, unknown>)?.kind || 'cron'),
        expr: String((job.schedule as Record<string, unknown>)?.expr || ''),
        tz: String((job.schedule as Record<string, unknown>)?.tz || 'UTC'),
      },
      payload: {
        model: String((job.payload as Record<string, unknown>)?.model || 'unknown'),
      },
      delivery: {
        mode: ((job.delivery as Record<string, unknown>)?.mode || 'none') as 'none' | 'announce',
      },
      sessionTarget: String(job.sessionTarget || 'main') as 'main' | 'isolated',
      state: {
        nextRunAtMs: Number((job.state as Record<string, unknown>)?.nextRunAtMs || Date.now() + 3600000),
        lastRunAtMs: (job.state as Record<string, unknown>)?.lastRunAtMs as number | undefined,
        lastStatus: (job.state as Record<string, unknown>)?.lastStatus as CronJob['state']['lastStatus'],
        lastDurationMs: (job.state as Record<string, unknown>)?.lastDurationMs as number | undefined,
        lastError: (job.state as Record<string, unknown>)?.lastError as string | undefined,
        consecutiveErrors: Number((job.state as Record<string, unknown>)?.consecutiveErrors || 0),
      },
    }));

    return NextResponse.json({
      source: 'live',
      jobs,
    });
  } catch (error) {
    console.error('Failed to fetch crons:', error);
    return NextResponse.json({
      source: 'error',
      jobs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getMockJobs(): CronJob[] {
  return [
    {
      id: 'morning-brief',
      name: 'Morning Brief',
      enabled: true,
      schedule: { kind: 'cron', expr: '0 7 * * *', tz: 'Australia/Sydney' },
      payload: { model: 'anthropic/claude-opus-4' },
      delivery: { mode: 'announce' },
      sessionTarget: 'main',
      state: {
        nextRunAtMs: Date.now() + 3600000,
        lastRunAtMs: Date.now() - 86400000,
        lastStatus: 'ok',
        lastDurationMs: 45000,
      },
    },
    {
      id: 'discord-digest-am',
      name: 'Discord Digest (Morning)',
      enabled: true,
      schedule: { kind: 'cron', expr: '0 9 * * *', tz: 'Australia/Sydney' },
      payload: { model: 'zai/glm-5' },
      delivery: { mode: 'announce' },
      sessionTarget: 'main',
      state: {
        nextRunAtMs: Date.now() + 7200000,
        lastRunAtMs: Date.now() - 82800000,
        lastStatus: 'ok',
        lastDurationMs: 120000,
      },
    },
    {
      id: 'cryptomon-checkpoint',
      name: 'CryptoMon Checkpoint',
      enabled: true,
      schedule: { kind: 'cron', expr: '0 1,3,5 * * *', tz: 'Australia/Sydney' },
      payload: { model: 'zai/glm-4.7' },
      delivery: { mode: 'none' },
      sessionTarget: 'isolated',
      state: {
        nextRunAtMs: Date.now() + 14400000,
        lastRunAtMs: Date.now() - 10800000,
        lastStatus: 'ok',
        lastDurationMs: 30000,
      },
    },
    {
      id: 'night-mode',
      name: 'Night Mode',
      enabled: true,
      schedule: { kind: 'cron', expr: '0 23 * * *', tz: 'Australia/Sydney' },
      payload: { model: 'zai/glm-5' },
      delivery: { mode: 'none' },
      sessionTarget: 'main',
      state: {
        nextRunAtMs: Date.now() + 36000000,
        lastRunAtMs: Date.now() - 50400000,
        lastStatus: 'ok',
        lastDurationMs: 5000,
      },
    },
  ];
}
