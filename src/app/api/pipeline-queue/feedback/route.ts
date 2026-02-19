import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, rating, comment } = body;

    if (!briefId || !rating) {
      return NextResponse.json({ error: 'briefId and rating are required' }, { status: 400 });
    }

    if (!['good', 'bad', 'comment'].includes(rating)) {
      return NextResponse.json({ error: 'rating must be good, bad, or comment' }, { status: 400 });
    }

    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: 'pipeline-queue.json not found' }, { status: 404 });
    }

    const queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
    const idx = (queueData.briefs || []).findIndex((b: { id: string }) => b.id === briefId);

    if (idx === -1) {
      return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    }

    queueData.briefs[idx].feedback = {
      rating,
      comment: comment || undefined,
      ratedAt: new Date().toISOString(),
    };
    queueData.updated = new Date().toISOString();

    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, briefId, rating });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
