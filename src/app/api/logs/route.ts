import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '200';
    const follow = searchParams.get('follow') === 'true';

    let result: string;
    try {
      const command = follow
        ? `openclaw logs --json --follow --limit ${limit}`
        : `openclaw logs --json --limit ${limit}`;
      
      result = execSync(command, {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError: unknown) {
      const error = cliError as { message?: string };
      console.error('OpenClaw logs CLI error:', error?.message);

      // Return mock log data for development
      const mockLogs = [
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'info',
          source: 'agent',
          message: 'Session started: agent:main:main',
          sessionId: 'ee272111-131e-4c5c-9f73-b61b7806515b',
        },
        {
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'info',
          source: 'agent',
          message: 'Building Mission Control dashboard components',
          sessionId: 'dev-agent-1',
        },
        {
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'warn',
          source: 'gateway',
          message: 'High token usage detected (95% of context)',
        },
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'info',
          source: 'cron',
          message: 'Cron job completed: afternoon-joke',
          cronId: 'cron-001',
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'error',
          source: 'agent',
          message: 'Failed to parse response: unexpected token',
          sessionId: 'dev-agent-2',
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'channel',
          message: 'Message delivered to telegram',
          channelId: 'telegram',
        },
      ];

      return NextResponse.json({
        source: 'mock',
        error: error?.message,
        logs: mockLogs,
        count: mockLogs.length,
      });
    }

    // Parse JSON lines
    const lines = result.trim().split('\n').filter(line => line);
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        // If not JSON, wrap as plain text log
        return {
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'system',
          message: line,
        };
      }
    });

    return NextResponse.json({
      source: 'live',
      logs,
      count: logs.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Failed to fetch logs:', error);

    return NextResponse.json(
      {
        source: 'error',
        error: err?.message || 'Failed to fetch logs',
        suggestion: 'Ensure OpenClaw gateway is running: openclaw gateway start',
      },
      { status: 500 }
    );
  }
}
