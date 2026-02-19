import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const HISTORY_FILE = path.join(
  process.env.HOME!,
  '.openclaw',
  'shared',
  'floor-history.jsonl'
);

export async function POST(req: NextRequest) {
  const snapshot = await req.json();
  
  try {
    await fs.appendFile(
      HISTORY_FILE,
      JSON.stringify({ ...snapshot, timestamp: Date.now() }) + '\n'
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = parseInt(url.searchParams.get('from') || '0');
  const to = parseInt(url.searchParams.get('to') || String(Date.now()));

  try {
    const content = await fs.readFile(HISTORY_FILE, 'utf-8');
    const snapshots = content
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((s: { timestamp: number }) => s.timestamp >= from && s.timestamp <= to);

    return NextResponse.json({ snapshots });
  } catch {
    return NextResponse.json({ snapshots: [] });
  }
}
