import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface SpawnRequest {
  label: string;
  model?: string;
  spec?: string;
  channel?: string;
}

interface SpawnResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SpawnResponse>> {
  try {
    const body: SpawnRequest = await request.json();
    
    if (!body.label) {
      return NextResponse.json({
        success: false,
        error: 'Label is required',
      }, { status: 400 });
    }

    // Build the spawn command
    const args: string[] = ['openclaw', 'session', 'spawn'];
    args.push('--label', body.label);
    
    if (body.model) {
      args.push('--model', body.model);
    }
    
    if (body.channel) {
      args.push('--channel', body.channel);
    }

    // If spec is provided, we'd pipe it or save to file
    // For now, just spawn with label
    
    try {
      const result = execSync(args.join(' '), {
        encoding: 'utf-8',
        timeout: 10000,
      });

      // Parse session ID from output
      const sessionIdMatch = result.match(/session[:\s]+([a-f0-9-]+)/i);
      const sessionId = sessionIdMatch?.[1] || 'unknown';

      return NextResponse.json({
        success: true,
        sessionId,
      });
    } catch (execError) {
      const error = execError as { message?: string; stderr?: string };
      console.error('Spawn command failed:', error);
      
      return NextResponse.json({
        success: false,
        error: error.stderr || error.message || 'Failed to spawn agent',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to spawn agent:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
