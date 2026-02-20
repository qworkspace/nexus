import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get real data from OpenClaw CLI

    let result: string;
    try {
      result = execSync('openclaw cron list --json', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError: unknown) {
      const error = cliError instanceof Error ? cliError : new Error('Unknown error');
      // CLI might not be available, return mock data
      console.error('OpenClaw CLI error:', error.message);

      return NextResponse.json({
        source: 'mock',
        error: error.message,
        data: {
          jobs: [
            {
              id: 'e6c7edc2-3e74-4a61-855c-62cab8dbc67f',
              name: 'Cron Failure Monitor',
              enabled: true,
              schedule: {
                kind: 'cron',
                expr: '*/30 * * * *',
                tz: 'Australia/Sydney',
              },
              state: {
                nextRunAtMs: Date.now() + 1000000,
                lastRunAtMs: Date.now() - 300000,
                lastStatus: 'ok',
                lastDurationMs: 60104,
              },
            },
          ],
        },
      });
    }

    const data = JSON.parse(result);
    return NextResponse.json({
      source: 'live',
      data,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch crons:', error);

    return NextResponse.json(
      {
        source: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch crons',
        suggestion: 'Ensure OpenClaw gateway is running: openclaw gateway start',
      },
      { status: 500 }
    );
  }
}
