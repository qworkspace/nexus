import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { commitHash, rating, commitMessage } = body;

    if (typeof commitHash !== 'string' || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Check if already rated — update if so
    const existing = await db.buildFeedback.findFirst({
      where: { briefId: commitHash },
    });

    if (existing) {
      await db.buildFeedback.update({
        where: { id: existing.id },
        data: { ratingInt: rating, commitMessage: commitMessage || '', ratedAt: new Date() },
      });
    } else {
      await db.buildFeedback.create({
        data: {
          briefId: commitHash,
          ratingInt: rating,
          commitMessage: commitMessage || '',
          ratedBy: 'PJ',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
