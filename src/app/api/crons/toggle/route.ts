import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({
        source: 'error',
        success: false,
        error: 'Missing required fields: id and enabled (boolean)',
      }, { status: 400 });
    }

    const command = enabled ? 'enable' : 'disable';

    try {
      execSync(`openclaw cron ${command} ${id}`, {
        encoding: 'utf-8',
        timeout: 10000,
      });
    } catch (cliError: unknown) {
      console.error('OpenClaw CLI error:', cliError);
      return NextResponse.json({
        source: 'error',
        success: false,
        error: cliError instanceof Error ? cliError.message : 'Failed to toggle cron job',
      }, { status: 500 });
    }

    // Fetch updated job info
    let result: string;
    try {
      result = execSync('openclaw cron list --json', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch {
      return NextResponse.json({
        source: 'live',
        success: true,
        job: { id, enabled },
      });
    }

    const data = JSON.parse(result);
    const job = (data.jobs || []).find((j: Record<string, unknown>) => j.id === id);

    return NextResponse.json({
      source: 'live',
      success: true,
      job: job ? {
        id: String(job.id || id),
        name: String(job.name || 'Unknown'),
        enabled: Boolean(job.enabled !== false),
      } : { id, enabled },
    });
  } catch (error) {
    console.error('Failed to toggle cron:', error);
    return NextResponse.json(
      {
        source: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
