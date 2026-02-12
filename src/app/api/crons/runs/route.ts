import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

interface RunEntry {
  id: string;
  cronJobId: string;
  startedAtMs: number;
  status: 'ok' | 'error' | 'timeout';
  durationMs?: number;
  error?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit') || '10';

    if (!id) {
      return NextResponse.json({
        source: 'error',
        entries: [],
        error: 'Missing cron job id',
      }, { status: 400 });
    }

    let result: string;
    try {
      result = execSync(`openclaw cron runs --id ${id} --limit ${limit}`, {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError) {
      console.error('OpenClaw CLI error:', cliError);
      // Return empty entries on error
      return NextResponse.json({
        source: 'mock',
        entries: [],
      });
    }

    const data = JSON.parse(result);
    const entries: RunEntry[] = (data.entries || []).map((entry: Record<string, unknown>) => ({
      id: String(entry.id || ''),
      cronJobId: String(entry.cronJobId || id),
      startedAtMs: Number(entry.startedAtMs || 0),
      status: (entry.status as RunEntry['status']) || 'ok',
      durationMs: entry.durationMs as number | undefined,
      error: entry.error as string | undefined,
    }));

    return NextResponse.json({
      source: 'live',
      entries,
    });
  } catch (error) {
    console.error('Failed to fetch cron runs:', error);
    return NextResponse.json(
      {
        source: 'error',
        entries: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
