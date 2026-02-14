import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const FEEDBACK_FILE = '/Users/paulvillanueva/shared/decisions/build-feedback.json';
const FIXES_FILE = '/Users/paulvillanueva/shared/pipeline/fixes.json';

interface FeedbackEntry {
  spec: string;
  commit: string;
  rating: 'great' | 'good' | 'meh' | 'bad' | 'useless';
  ratedBy: string;
  ratedAt: string;
  issues?: string[];
  context?: string;
  agent?: string;
}

interface FixEntry {
  id: string;
  whatBroke: string;
  whatFixed: string;
  when: string;
  agent: string;
  status: 'open' | 'fix_briefed' | 'fix_shipped' | 'verified';
  sourceRating: string;
  spec?: string;
  commit?: string;
  issues?: string[];
  context?: string;
}

export async function POST() {
  try {
    // Read feedback
    const feedbackData = await readFile(FEEDBACK_FILE, 'utf-8');
    const feedback: FeedbackEntry[] = JSON.parse(feedbackData);
    
    // Read existing fixes
    let fixes: FixEntry[] = [];
    if (existsSync(FIXES_FILE)) {
      const fixesData = await readFile(FIXES_FILE, 'utf-8');
      fixes = JSON.parse(fixesData);
    }
    
    // Find bad/useless ratings that don't have fix entries yet
    const existingFixIds = new Set(fixes.map(f => f.id));
    const newFixes: FixEntry[] = [];
    
    for (const entry of feedback) {
      if (entry.rating === 'bad' || entry.rating === 'useless') {
        const fixId = `fix-${entry.spec}-${entry.commit}`;
        
        if (!existingFixIds.has(fixId)) {
          newFixes.push({
            id: fixId,
            whatBroke: entry.issues?.join('; ') || `${entry.spec} rated ${entry.rating}`,
            whatFixed: '', // Empty until fix is shipped
            when: entry.ratedAt,
            agent: entry.agent || 'unknown',
            status: 'open',
            sourceRating: entry.rating,
            spec: entry.spec,
            commit: entry.commit,
            issues: entry.issues,
            context: entry.context,
          });
        }
      }
    }
    
    // Append new fixes
    if (newFixes.length > 0) {
      fixes = [...fixes, ...newFixes];
      await writeFile(FIXES_FILE, JSON.stringify(fixes, null, 2));
    }
    
    return NextResponse.json({
      created: newFixes.length,
      total: fixes.length,
      newFixes,
    });
  } catch (error) {
    console.error('Failed to sync fixes:', error);
    return NextResponse.json(
      { error: 'Failed to sync fixes' },
      { status: 500 }
    );
  }
}
