import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    // Try to get real data from OpenClaw CLI

    let result: string;
    try {
      result = execSync('openclaw gateway status --json', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError: unknown) {
      const error = cliError as { message?: string };
      // Gateway not running
      console.error('OpenClaw gateway error:', error?.message);

      return NextResponse.json({
        online: false,
        error: error?.message,
        suggestion: 'Start OpenClaw gateway: openclaw gateway start',
      });
    }

    const data = JSON.parse(result);
    const isRunning = data.service?.runtime?.status === 'running';

    return NextResponse.json({
      online: isRunning,
      data,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Failed to check gateway status:', error);

    return NextResponse.json({
      online: false,
      error: err?.message || 'Failed to check gateway status',
      suggestion: 'Start OpenClaw gateway: openclaw gateway start',
    });
  }
}
