import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Kill the session via OpenClaw CLI
    try {
      execSync(`openclaw session kill ${sessionId}`, {
        encoding: 'utf-8',
        timeout: 10000,
      });
    } catch (cliError) {
      console.error('OpenClaw CLI error:', cliError);
      return NextResponse.json(
        {
          success: false,
          error: cliError instanceof Error ? cliError.message : 'Failed to kill agent',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agent terminated successfully',
    });
  } catch (error) {
    console.error('Failed to terminate agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
