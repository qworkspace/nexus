import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const MEETINGS_DIR = join(process.env.HOME || '', 'shared/meetings');

export async function GET() {
  try {
    const files = readdirSync(MEETINGS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse();

    const meetings = files.map(f => {
      const stats = statSync(join(MEETINGS_DIR, f));
      const name = f.replace('.md', '');
      const parts = name.split('-');
      const date = parts.slice(0, 3).join('-');
      const type = parts.slice(3).join('-');

      const typeLabels: Record<string, string> = {
        'standup': 'Morning Standup',
        'sync-content': 'Content Team Sync',
        'sync-engineering': 'Engineering Sync',
        'allhands': 'All-Hands',
      };

      return {
        id: name,
        filename: f,
        date,
        type,
        title: typeLabels[type] || type,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      };
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    return NextResponse.json({ meetings: [], error: String(error) });
  }
}
