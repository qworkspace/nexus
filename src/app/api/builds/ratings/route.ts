import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

const FEEDBACK_FILE = '/Users/paulvillanueva/shared/decisions/build-feedback.json';

interface FeedbackEntry {
  spec: string;
  commit: string;
  rating: 'great' | 'good' | 'meh' | 'bad' | 'useless';
  ratedBy: string;
  ratedAt: string;
  model?: string;
  agent?: string;
  issues?: string[];
  context?: string;
}

export async function GET() {
  try {
    const data = await readFile(FEEDBACK_FILE, 'utf-8');
    const feedback: FeedbackEntry[] = JSON.parse(data);
    
    // Return indexed by commit hash for easy lookup
    return NextResponse.json({
      feedback: feedback.map(f => ({
        commit: f.commit,
        spec: f.spec,
        rating: f.rating,
        ratedBy: f.ratedBy,
        ratedAt: f.ratedAt,
        issues: f.issues || [],
        context: f.context,
      })),
      byCommit: Object.fromEntries(
        feedback.map(f => [f.commit, f])
      ),
    });
  } catch {
    return NextResponse.json({ feedback: [], byCommit: {} });
  }
}
