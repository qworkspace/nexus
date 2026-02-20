import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get real data from OpenClaw CLI

    let result: string;
    try {
      result = execSync('openclaw sessions list --json', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError: unknown) {
      const error = cliError as { message?: string };
      // CLI might not be available, try alternative approaches or return mock
      console.error('OpenClaw CLI error:', error?.message);

      // Return mock data for development/testing
      return NextResponse.json({
        source: 'mock',
        error: error?.message,
        data: {
          count: 1,
          sessions: [
            {
              key: 'agent:main:main',
              kind: 'direct',
              updatedAt: Date.now(),
              ageMs: 29334,
              sessionId: 'ee272111-131e-4c5c-9f73-b61b7806515b',
              systemSent: true,
              model: 'claude-opus-4-5',
              contextTokens: 200000,
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
    const err = error as { message?: string };
    console.error('Failed to fetch sessions:', error);

    return NextResponse.json(
      {
        source: 'error',
        error: err?.message || 'Failed to fetch sessions',
        suggestion: 'Ensure OpenClaw gateway is running: openclaw gateway start',
      },
      { status: 500 }
    );
  }
}
