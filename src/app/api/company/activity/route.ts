import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const FEED_PATH = join(process.env.HOME || '', 'shared/activity-feed.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const data = JSON.parse(readFileSync(FEED_PATH, 'utf-8'));
    const entries = (data.entries || []).slice(0, limit);

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ entries: [], error: String(error) });
  }
}
