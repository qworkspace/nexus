import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { DevSession, BuildStats } from '@/types/builds';

const SESSIONS_DIR = path.join(process.env.HOME || '', '.openclaw/agents/dev/sessions');

async function parseSessionFile(filePath: string): Promise<DevSession | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) return null;

    const firstLine = JSON.parse(lines[0]);
    const lastLine = JSON.parse(lines[lines.length - 1]);

    const startTime = firstLine.timestamp;
    const endTime = lastLine.timestamp;
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

    // Check if session is from today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isToday = new Date(startTime).getTime() >= startOfDay.getTime();

    return {
      id: firstLine.id,
      startTime,
      endTime,
      status: 'completed', // For stats, all completed sessions count
      task: '',
      durationMs,
    };
  } catch (error) {
    return null;
  }
}

export async function GET() {
  try {
    const files = await fs.readdir(SESSIONS_DIR);
    const sessionFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted'));

    const todaySessions: DevSession[] = [];
    const allSessions: DevSession[] = [];

    for (const file of sessionFiles) {
      const session = await parseSessionFile(path.join(SESSIONS_DIR, file));
      if (session) {
        // Check if it's from today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const isToday = new Date(session.startTime).getTime() >= startOfDay.getTime();

        if (isToday) {
          todaySessions.push(session);
        }
        allSessions.push(session);
      }
    }

    const totalToday = todaySessions.length;

    // Calculate average duration for today's sessions
    const sessionsWithDuration = todaySessions.filter(s => s.durationMs && s.durationMs > 0);
    const avgDuration = sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.durationMs || 0), 0) / sessionsWithDuration.length
      : 0;

    // Success rate - assume all completed sessions are successful for now
    // In a real implementation, you'd check for error states in the session
    const successRate = todaySessions.length > 0 ? 100 : 0;

    // Total cost (mock - would need to parse from session usage data)
    const totalCost = 0;

    const stats: BuildStats = {
      totalToday,
      successRate,
      avgDuration,
      totalCost,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching build stats:', error);
    return NextResponse.json({ error: 'Failed to fetch build stats' }, { status: 500 });
  }
}
