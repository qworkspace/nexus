import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROSTER_PATH = join(process.env.HOME || '', '.openclaw/shared/agent-roster.json');

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(ROSTER_PATH, 'utf-8'));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load roster', detail: String(error) },
      { status: 500 }
    );
  }
}
