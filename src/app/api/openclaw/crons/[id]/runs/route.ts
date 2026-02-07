import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = context.params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    // Try to get real data from OpenClaw CLI
    let result: string;
    try {
      result = execSync(`openclaw cron runs --id ${id} --limit ${limit}`, {
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
          entries: [],
        },
      });
    }

    const data = JSON.parse(result);
    return NextResponse.json({
      source: 'live',
      data,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch cron runs:', error);

    return NextResponse.json(
      {
        source: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch cron runs',
        suggestion: 'Ensure OpenClaw gateway is running: openclaw gateway start',
      },
      { status: 500 }
    );
  }
}
