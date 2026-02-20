import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const feedback = await db.buildFeedback.findMany({
      orderBy: { ratedAt: 'desc' },
    });

    const mapped = feedback.map(f => ({
      buildId: f.briefId,
      commit: f.briefId,
      rating: f.rating || (f.ratingInt ? String(f.ratingInt) : null),
      tags: f.tags ? JSON.parse(f.tags) : [],
      comment: f.comment,
      ratedBy: f.ratedBy,
      ratedAt: f.ratedAt.toISOString(),
      commitMessage: f.commitMessage,
    }));

    return NextResponse.json({
      feedback: mapped,
      byCommit: Object.fromEntries(mapped.map(f => [f.buildId, f])),
    });
  } catch {
    return NextResponse.json({ feedback: [], byCommit: {} });
  }
}
