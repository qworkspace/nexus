import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const FIXES_FILE = "/Users/paulvillanueva/shared/pipeline/fixes.json";
const FEEDBACK_FILE = "/Users/paulvillanueva/shared/decisions/build-feedback.json";

interface FixEntry {
  id: string;
  spec: string;
  commit: string;
  whatBroke: string;
  whatFixed: string;
  when: string;
  status: 'open' | 'fix_briefed' | 'fix_building' | 'fix_shipped' | 'verified';
  sourceRating: 'bad' | 'useless';
  issues: string[];
  pjComment?: string;
  fixBriefPath?: string;
  fixCommit?: string;
  agent: string;
}

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

export async function POST() {
  try {
    // Read existing fixes
    let fixes: FixEntry[] = [];
    if (existsSync(FIXES_FILE)) {
      const content = readFileSync(FIXES_FILE, 'utf-8');
      fixes = JSON.parse(content);
    }

    // Read feedback
    if (!existsSync(FEEDBACK_FILE)) {
      return NextResponse.json({ message: 'No feedback file found' });
    }

    const feedbackContent = readFileSync(FEEDBACK_FILE, 'utf-8');
    const feedback: FeedbackEntry[] = JSON.parse(feedbackContent);

    // Find bad/useless ratings that don't have a fix entry
    const badFeedback = feedback.filter(f => f.rating === 'bad' || f.rating === 'useless');
    let newEntries = 0;

    for (const fb of badFeedback) {
      const exists = fixes.find(f => f.spec === fb.spec && f.commit === fb.commit);
      if (!exists) {
        const newEntry: FixEntry = {
          id: `fix-${fb.spec}-${new Date(fb.ratedAt).toISOString().split('T')[0]}`,
          spec: fb.spec,
          commit: fb.commit,
          whatBroke: (fb.issues || []).join('; '),
          whatFixed: '',
          when: fb.ratedAt,
          status: 'open',
          sourceRating: fb.rating,
          issues: fb.issues || [],
          pjComment: fb.context,
          agent: fb.agent || 'unknown',
        };
        fixes.unshift(newEntry);
        newEntries++;
      }
    }

    if (newEntries > 0) {
      writeFileSync(FIXES_FILE, JSON.stringify(fixes, null, 2));
    }

    return NextResponse.json({
      message: 'Sync complete',
      newEntries,
      totalFixes: fixes.length
    });
  } catch (error) {
    console.error('Error syncing fixes:', error);
    return NextResponse.json(
      { error: 'Failed to sync fixes' },
      { status: 500 }
    );
  }
}
