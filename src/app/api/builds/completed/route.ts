import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { DevSession } from '@/types/builds';

const SESSIONS_DIR = path.join(process.env.HOME || '', '.openclaw/agents/dev/sessions');

async function parseSessionFile(filePath: string): Promise<DevSession | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) return null;

    const firstLine = JSON.parse(lines[0]);
    const lastLine = JSON.parse(lines[lines.length - 1]);

    // Extract task from the first user message
    let task = 'Unknown task';
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'message' && parsed.message?.role === 'user') {
          const userContent = parsed.message.content;
          if (Array.isArray(userContent)) {
            const textContent = userContent.find((c: any) => c.type === 'text');
            if (textContent?.text) {
              // Extract the first line or a brief summary
              const lines = textContent.text.split('\n');
              task = lines[0].substring(0, 100);
              if (textContent.text.length > 100) task += '...';
              break;
            }
          }
        }
      } catch (e) {
        // Skip unparseable lines
      }
    }

    const startTime = firstLine.timestamp;
    const endTime = lastLine.timestamp;
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

    // Check if session is "active" - sessions that were updated recently (last 30 minutes)
    const lastUpdate = new Date(endTime).getTime();
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const isRecent = lastUpdate > thirtyMinutesAgo;

    return {
      id: firstLine.id,
      startTime,
      endTime,
      status: isRecent ? 'active' : 'completed',
      task,
      durationMs,
    };
  } catch (error) {
    console.error(`Error parsing session file ${filePath}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const files = await fs.readdir(SESSIONS_DIR);
    const sessionFiles = files.filter(f => f.endsWith('.jsonl') && !f.includes('.deleted'));

    const sessions: DevSession[] = [];

    for (const file of sessionFiles) {
      const session = await parseSessionFile(path.join(SESSIONS_DIR, file));
      if (session && session.status !== 'active') {
        sessions.push(session);
      }
    }

    // Sort by end time (newest first) and take last 10
    sessions.sort((a, b) => {
      const aTime = new Date(a.endTime || a.startTime).getTime();
      const bTime = new Date(b.endTime || b.startTime).getTime();
      return bTime - aTime;
    });

    return NextResponse.json(sessions.slice(0, 10));
  } catch (error) {
    console.error('Error fetching completed builds:', error);
    return NextResponse.json({ error: 'Failed to fetch completed builds' }, { status: 500 });
  }
}
