import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const handoffsDir = path.join(process.env.HOME!, 'shared', 'handoffs');

  try {
    const files = await fs.readdir(handoffsDir);
    const handoffs: Array<{ from: string; to: string; task: string; time: string }> = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = await fs.readFile(path.join(handoffsDir, file), 'utf-8');
        const handoff = JSON.parse(content);

        handoffs.push({
          from: handoff.from,
          to: handoff.to,
          task: handoff.task,
          time: handoff.created_at || file,
        });
      } catch {
        // Skip malformed files
      }
    }

    // Sort by time (most recent first)
    handoffs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ handoffs });
  } catch {
    // Directory doesn't exist or no access
    return NextResponse.json({ handoffs: [] });
  }
}
