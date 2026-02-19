import { NextResponse } from 'next/server';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const MEETINGS_DIR = join(process.env.HOME || '', '.openclaw/shared/meetings');
const RETROS_DIR = join(process.env.HOME || '', '.openclaw/shared/retros');

const typeLabels: Record<string, string> = {
  'standup': 'Morning Standup',
  'sync-content': 'Content Team Sync',
  'sync-engineering': 'Engineering Sync',
  'allhands': 'All-Hands',
  'retro': 'Retrospective',
};

function scanDir(dir: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const stats = statSync(join(dir, f));
      const name = f.replace('.md', '');
      const parts = name.split('-');
      const date = parts.slice(0, 3).join('-');
      const type = parts.slice(3).join('-');
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
}

export async function GET() {
  try {
    const meetings = [
      ...scanDir(MEETINGS_DIR),
      ...scanDir(RETROS_DIR),
    ].sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ meetings });
  } catch (error) {
    return NextResponse.json({ meetings: [], error: String(error) });
  }
}
