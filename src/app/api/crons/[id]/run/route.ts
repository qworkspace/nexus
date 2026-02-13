import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Run the cron job via OpenClaw CLI
    try {
      execSync(`openclaw cron run ${jobId}`, {
        encoding: 'utf-8',
        timeout: 30000, // 30 second timeout for cron execution
      });
    } catch (cliError) {
      console.error('OpenClaw CLI error:', cliError);
      return NextResponse.json(
        {
          success: false,
          error: cliError instanceof Error ? cliError.message : 'Failed to run cron job',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job triggered successfully',
    });
  } catch (error) {
    console.error('Failed to trigger cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
