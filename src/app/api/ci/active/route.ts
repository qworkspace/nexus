import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export interface ActiveSession {
  id: string;
  key: string;
  model: string;
  startedAt: string;
  ageMs: number;
}

export async function GET() {
  try {
    let result: string;

    try {
      result = execSync('openclaw sessions list --json', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch (cliError: unknown) {
      const error = cliError as { message?: string };
      console.error('OpenClaw CLI error:', error?.message);
      // Return empty array if CLI not available
      return NextResponse.json({ sessions: [] });
    }

    const data = JSON.parse(result);

    // Filter for sessions with spark-, ci-, or dev- prefixes
    const activeSessions: ActiveSession[] = (data.sessions || [])
      .filter((s: { key?: string }) => {
        const key = s.key || '';
        return (
          key.includes('spark-') ||
          key.includes('ci-') ||
          key.includes('dev-')
        );
      })
      .map((s: { sessionId?: string; key?: string; model?: string; ageMs?: number }) => ({
        id: s.sessionId || s.key || 'unknown',
        key: s.key || 'unknown',
        model: s.model || 'unknown',
        startedAt: new Date(Date.now() - (s.ageMs || 0)).toISOString(),
        ageMs: s.ageMs || 0,
      }))
      .sort((a: ActiveSession, b: ActiveSession) => a.ageMs - b.ageMs); // Most recent first

    return NextResponse.json({ sessions: activeSessions });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Failed to fetch active sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active sessions', details: err.message },
      { status: 500 }
    );
  }
}
