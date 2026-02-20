import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const FIXES_FILE = "/Users/paulvillanueva/.openclaw/shared/pipeline/fixes.json";

interface FixEntry {
  id: string;
  spec: string;
  commit: string;
  whatBroke: string;
  whatFixed: string;
  when: string;
  status: 'open' | 'fix_briefed' | 'fix_building' | 'fix_shipped' | 'verified';
  sourceRating: string;
  issues: string[];
  pjComment?: string;
  fixBriefPath?: string;
  fixCommit?: string;
  agent: string;
}

export async function POST() {
  try {
    // Read existing fixes
    let fixes: FixEntry[] = [];
    if (existsSync(FIXES_FILE)) {
      fixes = JSON.parse(readFileSync(FIXES_FILE, 'utf-8'));
    }

    // Read bad feedback from DB
    const badFeedback = await db.buildFeedback.findMany({
      where: { rating: 'needs-work' },
      orderBy: { ratedAt: 'desc' },
    });

    let newEntries = 0;
    for (const fb of badFeedback) {
      const exists = fixes.find(f => f.commit === fb.briefId);
      if (!exists) {
        const tags = fb.tags ? JSON.parse(fb.tags) : [];
        fixes.unshift({
          id: `fix-${fb.briefId}-${fb.ratedAt.toISOString().split('T')[0]}`,
          spec: fb.briefId,
          commit: fb.briefId,
          whatBroke: tags.join('; '),
          whatFixed: '',
          when: fb.ratedAt.toISOString(),
          status: 'open',
          sourceRating: fb.rating || 'needs-work',
          issues: tags,
          pjComment: fb.comment || undefined,
          agent: 'unknown',
        });
        newEntries++;
      }
    }

    if (newEntries > 0) {
      writeFileSync(FIXES_FILE, JSON.stringify(fixes, null, 2));
    }

    return NextResponse.json({ message: 'Sync complete', newEntries, totalFixes: fixes.length });
  } catch (error) {
    console.error('Error syncing fixes:', error);
    return NextResponse.json({ error: 'Failed to sync fixes' }, { status: 500 });
  }
}
