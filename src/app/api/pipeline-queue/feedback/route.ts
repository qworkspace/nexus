import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const QUEUE_PATH = join(HOME, '.openclaw', 'shared', 'pipeline-queue.json');
const BUILD_FEEDBACK_PATH = join(HOME, '.openclaw', 'shared', 'pipeline', 'build-feedback.json');
const LESSONS_PATH = join(HOME, '.openclaw', 'workspace', 'LESSONS.md');
const SPEC_BRIEFS_DIR = join(HOME, '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');

const VALID_RATINGS = ['nailed-it', 'acceptable', 'needs-work'] as const;
type Rating = typeof VALID_RATINGS[number];

const VALID_TAGS = [
  'missed-spec', 'broke-existing', 'wrong-approach', 'incomplete',
  'over-engineered', 'poor-quality', 'needed-context',
] as const;
type Tag = typeof VALID_TAGS[number];

function appendToLessons(feature: string, rating: Rating, tags: Tag[], comment?: string) {
  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney',
  });

  const ratingEmoji = rating === 'needs-work' ? '🔴 Needs work' : '🟡 Acceptable';
  const tagList = tags.join(', ') || '(none)';

  // Derive action hint from tags
  const actionMap: Record<Tag, string> = {
    'missed-spec': 'Cipher should validate all input constraints from spec before building',
    'broke-existing': 'Spark should run regression checks before marking build complete',
    'wrong-approach': 'Cipher should explore alternative architectures in spec before committing',
    'incomplete': 'Spark must cover edge cases, not just the happy path',
    'over-engineered': 'Cipher should flag complexity vs scope mismatch in the spec',
    'poor-quality': 'Spark should self-review for readability before shipping',
    'needed-context': 'Q should proactively share relevant LESSONS.md entries when spawning agents',
  };
  const action = tags.length > 0
    ? (actionMap[tags[0]] || 'Review the approach before next iteration')
    : 'Review what went wrong and update approach';

  const entry = `
## ${date} — ${feature} (${ratingEmoji})
**Tags:** ${tagList}
**Comment:** ${comment || '(none)'}
**Action:** ${action}

`;

  try {
    if (existsSync(LESSONS_PATH)) {
      const current = readFileSync(LESSONS_PATH, 'utf-8');
      writeFileSync(LESSONS_PATH, current + entry, 'utf-8');
    } else {
      // Create LESSONS.md if it doesn't exist
      writeFileSync(LESSONS_PATH, `# LESSONS.md\n${entry}`, 'utf-8');
    }
  } catch (e) {
    console.error('Failed to append to LESSONS.md:', e);
  }
}

function appendToBuildFeedback(
  briefId: string,
  feature: string,
  rating: Rating,
  tags: Tag[],
  comment?: string,
  screenshotPath?: string
) {
  try {
    const dir = join(HOME, '.openclaw', 'shared', 'pipeline');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    let feedbackData: { ratings?: object[]; feedback?: object[] } = { ratings: [], feedback: [] };
    if (existsSync(BUILD_FEEDBACK_PATH)) {
      feedbackData = JSON.parse(readFileSync(BUILD_FEEDBACK_PATH, 'utf-8'));
    }
    if (!Array.isArray(feedbackData.feedback)) feedbackData.feedback = [];

    const entry = {
      buildId: briefId,
      feature,
      rating,
      tags,
      comment: comment || undefined,
      screenshotPath: screenshotPath || undefined,
      rolledBack: false,
      timestamp: new Date().toISOString(),
    };

    (feedbackData.feedback as object[]).unshift(entry);
    writeFileSync(BUILD_FEEDBACK_PATH, JSON.stringify(feedbackData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to append to build-feedback.json:', e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, rating, tags = [], comment, screenshotPath } = body;

    if (!briefId || !rating) {
      return NextResponse.json({ error: 'briefId and rating are required' }, { status: 400 });
    }

    if (!VALID_RATINGS.includes(rating)) {
      return NextResponse.json(
        { error: `rating must be one of: ${VALID_RATINGS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate tags
    const invalidTags = tags.filter((t: string) => !VALID_TAGS.includes(t as Tag));
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: `Invalid tags: ${invalidTags.join(', ')}` },
        { status: 400 }
      );
    }

    // Require at least one tag for 'needs-work'
    if (rating === 'needs-work' && tags.length === 0) {
      return NextResponse.json(
        { error: 'At least one tag is required for needs-work rating' },
        { status: 400 }
      );
    }

    if (!existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: 'pipeline-queue.json not found' }, { status: 404 });
    }

    const queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
    const idx = (queueData.briefs || []).findIndex((b: { id: string }) => b.id === briefId);

    if (idx === -1) {
      return NextResponse.json({ error: `Brief ${briefId} not found` }, { status: 404 });
    }

    const brief = queueData.briefs[idx];

    queueData.briefs[idx].feedback = {
      rating,
      tags: tags.length > 0 ? tags : undefined,
      comment: comment || undefined,
      screenshotPath: screenshotPath || undefined,
      rolledBack: false,
      ratedAt: new Date().toISOString(),
    };
    queueData.updated = new Date().toISOString();

    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    // Auto-append to LESSONS.md on 'needs-work' or 'acceptable'
    if (rating === 'needs-work' || rating === 'acceptable') {
      appendToLessons(brief.title, rating, tags, comment);
    }

    // Also log to build-feedback.json
    appendToBuildFeedback(briefId, brief.title, rating, tags, comment, screenshotPath);

    // Auto-generate fix brief on 'needs-work'
    if (rating === 'needs-work') {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const safeOriginalId = briefId.replace(/[^a-z0-9-]/gi, '-').slice(0, 40);
      const fixBriefId = `brief-${today}-fix-${safeOriginalId}`;
      const fixBriefFilename = `${today}-fix-${safeOriginalId}.md`;
      const fixBriefPath = join(SPEC_BRIEFS_DIR, fixBriefFilename);

      const tagDescriptions: Record<string, string> = {
        'missed-spec': 'Did not meet the original spec requirements',
        'broke-existing': 'Broke existing functionality',
        'wrong-approach': 'Wrong technical approach taken',
        'incomplete': 'Build is incomplete / partial',
        'over-engineered': 'Unnecessarily complex',
        'poor-quality': 'Code quality issues',
        'needed-context': 'Agent lacked context to do the job properly',
      };

      const tagLines = tags.map((t: string) => `- ${t} → ${tagDescriptions[t] || t}`).join('\n');
      const screenshotLine = screenshotPath ? `**Screenshot:** ${screenshotPath}` : '**Screenshot:** none';

      const fixBriefContent = `# Fix: ${brief.title}

**Status:** pending-review
**Priority:** HIGH
**Complexity:** TBD (Q to assess)
**Front:** ${brief.front || 'infrastructure'}
**Source:** needs-work-rating
**Parent Build:** ${briefId}${brief.buildCommit ? ` (${brief.buildCommit})` : ''}

## Problem
Build was rated 🔴 Needs Work on ${today}.

**Tags:** ${tags.join(', ')}
**Comment:** ${comment || '(none)'}
${screenshotLine}

## What Needs Fixing
${tagLines || '- (see comment)'}

## Original Brief
${brief.briefPath ? `Path: ${brief.briefPath}` : `ID: ${briefId}`}

## Lineage
- Parent: ${briefId}
- Rating: 🔴 Needs Work — ${today}
- Auto-generated by Performance Feedback Loop
`;

      if (!existsSync(SPEC_BRIEFS_DIR)) mkdirSync(SPEC_BRIEFS_DIR, { recursive: true });
      writeFileSync(fixBriefPath, fixBriefContent, 'utf-8');

      // Add fix brief entry to pipeline-queue.json
      const fixBriefEntry = {
        id: fixBriefId,
        title: `Fix: ${brief.title}`,
        description: `Auto-generated fix brief from 🔴 Needs Work rating on ${today}. Tags: ${tags.join(', ')}.`,
        problem: `Build "${brief.title}" was rated 🔴 Needs Work on ${today}.${comment ? ` PJ's comment: ${comment}` : ''}`,
        solution: `Fix the issues identified: ${tags.map((t: string) => tagDescriptions[t] || t).join('; ')}.`,
        source: 'needs-work-rating',
        sourceRef: fixBriefFilename,
        status: 'pending-review',
        priority: 'HIGH',
        complexity: 'TBD',
        front: brief.front || undefined,
        parentBuildId: briefId,
        screenshotPath: screenshotPath || undefined,
        createdAt: new Date().toISOString(),
        approvedAt: '',
        assignee: '',
      };

      // Re-read queue in case writeFileSync above modified it, then unshift fix brief
      const freshQueueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
      freshQueueData.briefs.unshift(fixBriefEntry);
      writeFileSync(QUEUE_PATH, JSON.stringify(freshQueueData, null, 2), 'utf-8');

      return NextResponse.json({ ok: true, briefId, rating, fixBriefId, fixBriefPath });
    }

    return NextResponse.json({ ok: true, briefId, rating });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
