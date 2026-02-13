import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const transcriptsDir = path.join(homedir(), '.openclaw', 'transcripts');

    // List all transcript files
    const files = await readdir(transcriptsDir);
    const logFile = files.find(f => f.includes(sessionId));

    if (!logFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Log file not found',
        },
        { status: 404 }
      );
    }

    const content = await readFile(path.join(transcriptsDir, logFile), 'utf-8');

    return NextResponse.json({
      success: true,
      sessionId,
      content,
      filename: logFile,
    });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
